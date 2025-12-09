-- Gym Membership Tracker Database Initialization Script
-- Run this to set up the complete database schema and sample data

-- Create database
CREATE DATABASE IF NOT EXISTS gym_tracker;
USE gym_tracker;

-- ==================== TABLES ====================

-- Create membership_plans table (must exist before members)
CREATE TABLE IF NOT EXISTS membership_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  duration_months INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  membership_plan_id INT,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (membership_plan_id) REFERENCES membership_plans(id)
);

-- Create payments table
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
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  check_in_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  check_out_date TIMESTAMP NULL,
  duration_minutes INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- ==================== SAMPLE DATA ====================

-- Insert membership plans
INSERT INTO membership_plans (name, duration_months, price, description) VALUES
('Basic', 1, 29.99, 'One month basic membership'),
('Standard', 3, 79.99, 'Three months standard membership with group classes'),
('Premium', 6, 149.99, 'Six months premium membership with personal trainer'),
('Annual', 12, 249.99, 'One year membership with all perks');

-- Insert sample members
INSERT INTO members (name, email, phone, membership_plan_id, status) VALUES
('John Doe', 'john.doe@example.com', '555-0101', 1, 'active'),
('Jane Smith', 'jane.smith@example.com', '555-0102', 2, 'active'),
('Bob Johnson', 'bob.johnson@example.com', '555-0103', 3, 'active'),
('Alice Williams', 'alice.williams@example.com', '555-0104', 4, 'active'),
('Charlie Brown', 'charlie.brown@example.com', '555-0105', 1, 'inactive');

-- Insert sample payments
INSERT INTO payments (member_id, amount, plan_id, expiry_date, status) VALUES
(1, 29.99, 1, DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 'completed'),
(2, 79.99, 2, DATE_ADD(CURDATE(), INTERVAL 3 MONTH), 'completed'),
(3, 149.99, 3, DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'completed'),
(4, 249.99, 4, DATE_ADD(CURDATE(), INTERVAL 12 MONTH), 'completed'),
(5, 29.99, 1, DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 'pending');

-- Insert sample attendance records
INSERT INTO attendance (member_id, check_in_date, check_out_date, duration_minutes) VALUES
(1, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 60 MINUTE, 60),
(2, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 90 MINUTE, 90),
(3, NOW() - INTERVAL 30 MINUTE, NULL, NULL),
(1, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 75 MINUTE, 75),
(4, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 120 MINUTE, 120);

-- ==================== VERIFICATION ====================
-- Run these SELECT statements to verify data was inserted correctly

-- View all membership plans
-- SELECT * FROM membership_plans;

-- View all members with their plan names
-- SELECT m.*, mp.name as plan_name, mp.price FROM members m
-- LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id;

-- View all payments
-- SELECT p.*, m.name as member_name FROM payments p
-- JOIN members m ON p.member_id = m.id;

-- View all attendance records
-- SELECT a.*, m.name as member_name FROM attendance a
-- JOIN members m ON a.member_id = m.id;
