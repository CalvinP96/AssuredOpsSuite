const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all employees
router.get('/', (req, res) => {
  const { status, department } = req.query;
  let sql = 'SELECT * FROM employees WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (department) {
    sql += ' AND department = ?';
    params.push(department);
  }
  sql += ' ORDER BY created_at DESC';

  const employees = db.prepare(sql).all(...params);
  res.json(employees);
});

// GET single employee with equipment
router.get('/:id', (req, res) => {
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const equipment = db.prepare(`
    SELECT ea.*, ec.name as equipment_name, ec.category, ec.unit_cost
    FROM equipment_assignments ea
    JOIN equipment_catalog ec ON ea.equipment_catalog_id = ec.id
    WHERE ea.employee_id = ?
    ORDER BY ea.assigned_date DESC
  `).all(req.params.id);

  res.json({ ...employee, equipment });
});

// POST hire new employee
router.post('/', (req, res) => {
  const { first_name, last_name, email, phone, department, position, hire_date, notes } = req.body;
  if (!first_name || !last_name || !department || !position || !hire_date) {
    return res.status(400).json({ error: 'first_name, last_name, department, position, and hire_date are required' });
  }

  const result = db.prepare(`
    INSERT INTO employees (first_name, last_name, email, phone, department, position, hire_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(first_name, last_name, email || null, phone || null, department, position, hire_date, notes || null);

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(employee);
});

// PUT update employee
router.put('/:id', (req, res) => {
  const { first_name, last_name, email, phone, department, position, notes } = req.body;

  db.prepare(`
    UPDATE employees SET first_name=?, last_name=?, email=?, phone=?, department=?, position=?, notes=?, updated_at=datetime('now')
    WHERE id=?
  `).run(first_name, last_name, email, phone, department, position, notes, req.params.id);

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  res.json(employee);
});

// POST terminate (fire) employee — generates billing
router.post('/:id/terminate', (req, res) => {
  const { termination_date, notes } = req.body;
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const dateUsed = termination_date || new Date().toISOString().split('T')[0];

  // Update employee status
  db.prepare(`
    UPDATE employees SET status='terminated', termination_date=?, notes=?, updated_at=datetime('now') WHERE id=?
  `).run(dateUsed, notes || employee.notes, req.params.id);

  // Calculate equipment billing
  const assignments = db.prepare(`
    SELECT ea.*, ec.unit_cost, ec.name as equipment_name
    FROM equipment_assignments ea
    JOIN equipment_catalog ec ON ea.equipment_catalog_id = ec.id
    WHERE ea.employee_id = ? AND ea.returned_date IS NULL
  `).all(req.params.id);

  const totalCost = assignments.reduce((sum, a) => sum + a.unit_cost, 0);

  const bill = db.prepare(`
    INSERT INTO termination_bills (employee_id, total_equipment_cost, items_not_returned, amount_due, bill_date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, totalCost, assignments.length, totalCost, dateUsed, `Termination billing for ${employee.first_name} ${employee.last_name}`);

  const billRecord = db.prepare('SELECT * FROM termination_bills WHERE id = ?').get(bill.lastInsertRowid);
  const updatedEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);

  res.json({
    employee: updatedEmployee,
    bill: billRecord,
    unreturned_equipment: assignments
  });
});

// GET dashboard stats
router.get('/stats/summary', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM employees').get().count;
  const active = db.prepare("SELECT COUNT(*) as count FROM employees WHERE status='active'").get().count;
  const terminated = db.prepare("SELECT COUNT(*) as count FROM employees WHERE status='terminated'").get().count;
  const byDept = db.prepare("SELECT department, COUNT(*) as count FROM employees WHERE status='active' GROUP BY department").all();

  res.json({ total, active, terminated, by_department: byDept });
});

module.exports = router;
