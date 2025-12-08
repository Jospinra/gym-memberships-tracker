// Test utilities and mock database helpers
const mockDb = {
  execute: jest.fn(),
};

const createMockDb = () => ({
  execute: jest.fn(),
});

const mockMembers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
    membership_plan_id: 1,
    status: 'active',
    plan_name: 'Premium',
    price: 49.99,
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-5678',
    membership_plan_id: 2,
    status: 'active',
    plan_name: 'Standard',
    price: 29.99,
  },
];

const mockPlans = [
  {
    id: 1,
    name: 'Premium',
    duration_months: 12,
    price: 49.99,
    description: 'Full access to all facilities',
  },
  {
    id: 2,
    name: 'Standard',
    duration_months: 6,
    price: 29.99,
    description: 'Standard membership',
  },
  {
    id: 3,
    name: 'Basic',
    duration_months: 1,
    price: 9.99,
    description: 'Basic membership',
  },
];

const mockPayments = [
  {
    id: 1,
    member_id: 1,
    amount: 49.99,
    plan_id: 1,
    payment_date: '2025-12-08T10:00:00Z',
    expiry_date: '2026-12-08',
    status: 'completed',
    member_name: 'John Doe',
    plan_name: 'Premium',
  },
];

const mockAttendance = [
  {
    id: 1,
    member_id: 1,
    check_in_date: '2025-12-08T08:00:00Z',
    check_out_date: '2025-12-08T09:30:00Z',
    duration_minutes: 90,
  },
];

module.exports = {
  mockDb,
  createMockDb,
  mockMembers,
  mockPlans,
  mockPayments,
  mockAttendance,
};
