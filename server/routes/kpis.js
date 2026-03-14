const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', (req, res) => {
  const db = getDb();
  const { department, category } = req.query;
  let sql = 'SELECT * FROM kpis WHERE 1=1';
  const params = [];
  if (department) { sql += ' AND department = ?'; params.push(department); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  sql += ' ORDER BY category, name';
  res.json(db.prepare(sql).all(...params));
});

// Stats must be before /:id
router.get('/stats/dashboard', (req, res) => {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as count FROM kpis').get().count;
  const onTrack = db.prepare("SELECT COUNT(*) as count FROM kpis WHERE status='on_track'").get().count;
  const atRisk = db.prepare("SELECT COUNT(*) as count FROM kpis WHERE status='at_risk'").get().count;
  const offTrack = db.prepare("SELECT COUNT(*) as count FROM kpis WHERE status='off_track'").get().count;
  const byCategory = db.prepare('SELECT category, COUNT(*) as count FROM kpis GROUP BY category').all();
  const byDept = db.prepare("SELECT department, COUNT(*) as count FROM kpis WHERE department IS NOT NULL GROUP BY department").all();
  res.json({ total, on_track: onTrack, at_risk: atRisk, off_track: offTrack, by_category: byCategory, by_department: byDept });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const kpi = db.prepare('SELECT * FROM kpis WHERE id = ?').get(req.params.id);
  if (!kpi) return res.status(404).json({ error: 'KPI not found' });
  const history = db.prepare('SELECT * FROM kpi_history WHERE kpi_id = ? ORDER BY recorded_date DESC LIMIT 30').all(req.params.id);
  res.json({ ...kpi, history });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, category, target_value, current_value, unit, department, period, notes } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'name and category are required' });
  const result = db.prepare(`
    INSERT INTO kpis (name, category, target_value, current_value, unit, department, period, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, category, target_value || 0, current_value || 0, unit || null, department || null, period || null, notes || null);
  res.status(201).json(db.prepare('SELECT * FROM kpis WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, category, target_value, current_value, unit, department, period, status, notes } = req.body;
  let kpiStatus = status;
  if (!kpiStatus && target_value && current_value != null) {
    const pct = (current_value / target_value) * 100;
    if (pct >= 90) kpiStatus = 'on_track';
    else if (pct >= 70) kpiStatus = 'at_risk';
    else kpiStatus = 'off_track';
  }
  db.prepare(`
    UPDATE kpis SET name=?, category=?, target_value=?, current_value=?, unit=?, department=?, period=?, status=?, notes=?, updated_at=datetime('now')
    WHERE id=?
  `).run(name, category, target_value, current_value, unit, department, period, kpiStatus || 'on_track', notes, req.params.id);

  if (current_value != null) {
    db.prepare('INSERT INTO kpi_history (kpi_id, value, notes) VALUES (?, ?, ?)').run(req.params.id, current_value, notes || null);
  }
  res.json(db.prepare('SELECT * FROM kpis WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM kpi_history WHERE kpi_id = ?').run(req.params.id);
  db.prepare('DELETE FROM kpis WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
