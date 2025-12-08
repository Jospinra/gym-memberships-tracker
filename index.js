const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// If the database isn't connected, return 503 for any API requests.
app.use('/api', (req, res, next) => {
  if (!db) {
    return res.status(503).json({ error: 'Service unavailable: database not connected' });
  }
  next();
});

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'gym_tracker'
};

let db;

// Initialize database connection
async function initDB() {
  try {
    db = await mysql.createConnection(dbConfig);
    
    // Create members table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        membership_plan_id INT,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create membership plans table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS membership_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        duration_months INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create payments table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        plan_id INT,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expiry_date DATE,
        status ENUM('completed', 'pending', 'failed') DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
        FOREIGN KEY (plan_id) REFERENCES membership_plans(id)
      )
    `);

    // Create attendance table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NOT NULL,
        check_in_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        check_out_date TIMESTAMP NULL,
        duration_minutes INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      )
    `);

    console.log('Database connected and tables created');
  } catch (error) {
    console.error('Database connection failed:', error);
    // Do not exit the process — run in degraded mode so the app can still serve static
    // assets and health checks. API routes will return 503 until the DB is available.
    db = null;
    console.warn('Continuing without database — API routes will return 503 until DB is available.');
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== MEMBERS API ====================

// GET all members
app.get('/api/members', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT m.*, mp.name as plan_name, mp.price 
      FROM members m 
      LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id
      ORDER BY m.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// GET single member
app.get('/api/members/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT m.*, mp.name as plan_name, mp.price, mp.duration_months
      FROM members m 
      LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id
      WHERE m.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

// POST register new member
app.post('/api/members', async (req, res) => {
  const { name, email, phone, membership_plan_id } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO members (name, email, phone, membership_plan_id, status) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone || null, membership_plan_id || null, 'active']
    );
    res.status(201).json({ 
      id: result.insertId, 
      name, 
      email, 
      message: 'Member registered successfully' 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    console.error('Error creating member:', error);
    res.status(500).json({ error: 'Failed to register member' });
  }
});

// PUT update member
app.put('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, status } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const [result] = await db.execute(
      'UPDATE members SET name = ?, email = ?, phone = ?, status = ? WHERE id = ?',
      [name, email, phone || null, status || 'active', id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    res.json({ message: 'Member updated successfully' });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// DELETE member
app.delete('/api/members/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute('DELETE FROM members WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

// ==================== MEMBERSHIP PLANS API ====================

// GET all plans
app.get('/api/plans', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM membership_plans ORDER BY price ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// POST new plan
app.post('/api/plans', async (req, res) => {
  const { name, duration_months, price, description } = req.body;
  
  if (!name || !duration_months || !price) {
    return res.status(400).json({ error: 'Name, duration, and price are required' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO membership_plans (name, duration_months, price, description) VALUES (?, ?, ?, ?)',
      [name, duration_months, price, description || null]
    );
    res.status(201).json({ 
      id: result.insertId, 
      name, 
      message: 'Plan created successfully' 
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// ==================== PAYMENTS API ====================

// GET all payments
app.get('/api/payments', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT p.*, m.name as member_name, mp.name as plan_name
      FROM payments p
      JOIN members m ON p.member_id = m.id
      LEFT JOIN membership_plans mp ON p.plan_id = mp.id
      ORDER BY p.payment_date DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// POST new payment
app.post('/api/payments', async (req, res) => {
  const { member_id, plan_id, amount } = req.body;
  
  if (!member_id || !amount) {
    return res.status(400).json({ error: 'Member ID and amount are required' });
  }

  try {
    // Calculate expiry date based on plan duration
    let expiryDate = new Date();
    if (plan_id) {
      const [plans] = await db.execute('SELECT duration_months FROM membership_plans WHERE id = ?', [plan_id]);
      if (plans.length > 0) {
        expiryDate.setMonth(expiryDate.getMonth() + plans[0].duration_months);
      }
    }

    const [result] = await db.execute(
      'INSERT INTO payments (member_id, plan_id, amount, expiry_date, status) VALUES (?, ?, ?, ?, ?)',
      [member_id, plan_id || null, amount, expiryDate.toISOString().split('T')[0], 'completed']
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      member_id, 
      amount, 
      message: 'Payment recorded successfully' 
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// ==================== ATTENDANCE API ====================

// GET member attendance
app.get('/api/attendance/:member_id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM attendance WHERE member_id = ? ORDER BY check_in_date DESC',
      [req.params.member_id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// POST check-in
app.post('/api/attendance/checkin/:member_id', async (req, res) => {
  try {
    const [result] = await db.execute(
      'INSERT INTO attendance (member_id) VALUES (?)',
      [req.params.member_id]
    );
    res.status(201).json({ 
      id: result.insertId, 
      message: 'Check-in recorded successfully' 
    });
  } catch (error) {
    console.error('Error recording check-in:', error);
    res.status(500).json({ error: 'Failed to record check-in' });
  }
});

// POST check-out
app.post('/api/attendance/checkout/:attendance_id', async (req, res) => {
  try {
    const [attendance] = await db.execute(
      'SELECT check_in_date FROM attendance WHERE id = ?',
      [req.params.attendance_id]
    );

    if (attendance.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    const checkIn = new Date(attendance[0].check_in_date);
    const checkOut = new Date();
    const durationMinutes = Math.round((checkOut - checkIn) / 60000);

    const [result] = await db.execute(
      'UPDATE attendance SET check_out_date = ?, duration_minutes = ? WHERE id = ?',
      [checkOut.toISOString(), durationMinutes, req.params.attendance_id]
    );

    res.json({ message: 'Check-out recorded successfully', durationMinutes });
  } catch (error) {
    console.error('Error recording check-out:', error);
    res.status(500).json({ error: 'Failed to record check-out' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
