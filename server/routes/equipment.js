const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// --- Equipment Catalog ---

router.get('/catalog', (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT * FROM equipment_catalog ORDER BY category, name').all());
});

router.post('/catalog', (req, res) => {
  const db = getDb();
  const { name, category, unit_cost, description } = req.body;
  if (!name || !category || unit_cost == null) {
    return res.status(400).json({ error: 'name, category, and unit_cost are required' });
  }
  const result = db.prepare(
    'INSERT INTO equipment_catalog (name, category, unit_cost, description) VALUES (?, ?, ?, ?)'
  ).run(name, category, unit_cost, description || null);
  res.status(201).json(db.prepare('SELECT * FROM equipment_catalog WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/catalog/:id', (req, res) => {
  const db = getDb();
  const { name, category, unit_cost, description } = req.body;
  db.prepare('UPDATE equipment_catalog SET name=?, category=?, unit_cost=?, description=? WHERE id=?')
    .run(name, category, unit_cost, description, req.params.id);
  res.json(db.prepare('SELECT * FROM equipment_catalog WHERE id = ?').get(req.params.id));
});

router.delete('/catalog/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM equipment_catalog WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// --- Equipment Assignments ---

router.get('/assignments', (req, res) => {
  const db = getDb();
  const { employee_id, department, status } = req.query;
  let sql = `
    SELECT ea.*, ec.name as equipment_name, ec.category, ec.unit_cost,
           e.first_name, e.last_name, e.department as emp_department
    FROM equipment_assignments ea
    JOIN equipment_catalog ec ON ea.equipment_catalog_id = ec.id
    JOIN employees e ON ea.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];
  if (employee_id) { sql += ' AND ea.employee_id = ?'; params.push(employee_id); }
  if (department) { sql += ' AND ea.department = ?'; params.push(department); }
  if (status === 'active') { sql += ' AND ea.returned_date IS NULL'; }
  if (status === 'returned') { sql += ' AND ea.returned_date IS NOT NULL'; }
  sql += ' ORDER BY ea.assigned_date DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/assignments', (req, res) => {
  const db = getDb();
  const { employee_id, equipment_catalog_id, serial_number, assigned_date, assigned_by, department, notes } = req.body;
  if (!employee_id || !equipment_catalog_id || !assigned_date || !department) {
    return res.status(400).json({ error: 'employee_id, equipment_catalog_id, assigned_date, and department are required' });
  }
  const result = db.prepare(`
    INSERT INTO equipment_assignments (employee_id, equipment_catalog_id, serial_number, assigned_date, assigned_by, department, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(employee_id, equipment_catalog_id, serial_number || null, assigned_date, assigned_by || null, department, notes || null);

  res.status(201).json(db.prepare(`
    SELECT ea.*, ec.name as equipment_name, ec.category, ec.unit_cost
    FROM equipment_assignments ea JOIN equipment_catalog ec ON ea.equipment_catalog_id = ec.id
    WHERE ea.id = ?
  `).get(result.lastInsertRowid));
});

router.put('/assignments/:id/return', (req, res) => {
  const db = getDb();
  const { returned_date, condition_on_return } = req.body;
  db.prepare('UPDATE equipment_assignments SET returned_date=?, condition_on_return=? WHERE id=?')
    .run(returned_date || new Date().toISOString().split('T')[0], condition_on_return || 'good', req.params.id);

  res.json(db.prepare(`
    SELECT ea.*, ec.name as equipment_name, ec.category, ec.unit_cost
    FROM equipment_assignments ea JOIN equipment_catalog ec ON ea.equipment_catalog_id = ec.id
    WHERE ea.id = ?
  `).get(req.params.id));
});

router.get('/cost-summary/:employeeId', (req, res) => {
  const db = getDb();
  const assignments = db.prepare(`
    SELECT ea.*, ec.name as equipment_name, ec.category, ec.unit_cost
    FROM equipment_assignments ea JOIN equipment_catalog ec ON ea.equipment_catalog_id = ec.id
    WHERE ea.employee_id = ?
  `).all(req.params.employeeId);

  const totalIssued = assignments.reduce((sum, a) => sum + a.unit_cost, 0);
  const unreturned = assignments.filter(a => !a.returned_date);
  const unreturnedCost = unreturned.reduce((sum, a) => sum + a.unit_cost, 0);

  res.json({
    employee_id: parseInt(req.params.employeeId),
    total_items: assignments.length,
    total_cost_issued: totalIssued,
    items_unreturned: unreturned.length,
    unreturned_cost: unreturnedCost,
    assignments
  });
});

module.exports = router;
