const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all termination bills
router.get('/', (req, res) => {
  const bills = db.prepare(`
    SELECT tb.*, e.first_name, e.last_name, e.department, e.position
    FROM termination_bills tb
    JOIN employees e ON tb.employee_id = e.id
    ORDER BY tb.bill_date DESC
  `).all();
  res.json(bills);
});

// GET single bill with details
router.get('/:id', (req, res) => {
  const bill = db.prepare(`
    SELECT tb.*, e.first_name, e.last_name, e.department, e.position, e.hire_date, e.termination_date
    FROM termination_bills tb
    JOIN employees e ON tb.employee_id = e.id
    WHERE tb.id = ?
  `).get(req.params.id);

  if (!bill) return res.status(404).json({ error: 'Bill not found' });

  const equipment = db.prepare(`
    SELECT ea.*, ec.name as equipment_name, ec.category, ec.unit_cost
    FROM equipment_assignments ea
    JOIN equipment_catalog ec ON ea.equipment_catalog_id = ec.id
    WHERE ea.employee_id = ?
  `).all(bill.employee_id);

  res.json({ ...bill, equipment });
});

// PUT update bill status (paid, waived, etc.)
router.put('/:id', (req, res) => {
  const { status, amount_due, notes } = req.body;
  db.prepare('UPDATE termination_bills SET status=?, amount_due=?, notes=? WHERE id=?')
    .run(status, amount_due, notes, req.params.id);

  res.json(db.prepare('SELECT * FROM termination_bills WHERE id = ?').get(req.params.id));
});

// GET billing summary stats
router.get('/stats/summary', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM termination_bills').get().count;
  const totalDue = db.prepare('SELECT COALESCE(SUM(amount_due), 0) as total FROM termination_bills').get().total;
  const pending = db.prepare("SELECT COUNT(*) as count FROM termination_bills WHERE status='pending'").get().count;
  const paid = db.prepare("SELECT COUNT(*) as count FROM termination_bills WHERE status='paid'").get().count;

  res.json({ total_bills: total, total_amount_due: totalDue, pending, paid });
});

module.exports = router;
