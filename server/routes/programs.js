const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// --- Programs CRUD ---

router.get('/', (req, res) => {
  const db = getDb();
  const programs = db.prepare('SELECT * FROM programs ORDER BY name').all();
  const result = programs.map(p => {
    const docCount = db.prepare('SELECT COUNT(*) as count FROM program_documents WHERE program_id = ?').get(p.id).count;
    const taskCount = db.prepare('SELECT COUNT(*) as count FROM program_tasks WHERE program_id = ?').get(p.id).count;
    const openTasks = db.prepare("SELECT COUNT(*) as count FROM program_tasks WHERE program_id = ? AND status != 'done'").get(p.id).count;
    return { ...p, doc_count: docCount, task_count: taskCount, open_tasks: openTasks };
  });
  res.json(result);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id);
  if (!program) return res.status(404).json({ error: 'Program not found' });

  const documents = db.prepare('SELECT * FROM program_documents WHERE program_id = ? ORDER BY updated_at DESC').all(req.params.id);
  const tasks = db.prepare('SELECT * FROM program_tasks WHERE program_id = ? ORDER BY priority DESC, due_date ASC').all(req.params.id);
  const milestones = db.prepare('SELECT * FROM program_milestones WHERE program_id = ? ORDER BY target_date ASC').all(req.params.id);

  res.json({ ...program, documents, tasks, milestones });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, code, description, manager_name, manager_title, site_url } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'name and code are required' });

  const result = db.prepare(
    'INSERT INTO programs (name, code, description, manager_name, manager_title, site_url) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, code, description || null, manager_name || null, manager_title || null, site_url || null);

  res.status(201).json(db.prepare('SELECT * FROM programs WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, code, description, manager_name, manager_title, status, site_url } = req.body;
  db.prepare(
    "UPDATE programs SET name=?, code=?, description=?, manager_name=?, manager_title=?, status=?, site_url=?, updated_at=datetime('now') WHERE id=?"
  ).run(name, code, description, manager_name, manager_title, status, site_url, req.params.id);
  res.json(db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM program_milestones WHERE program_id = ?').run(req.params.id);
  db.prepare('DELETE FROM program_tasks WHERE program_id = ?').run(req.params.id);
  db.prepare('DELETE FROM program_documents WHERE program_id = ?').run(req.params.id);
  db.prepare('DELETE FROM programs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// --- Documents ---

router.post('/:id/documents', (req, res) => {
  const db = getDb();
  const { title, doc_type, assigned_to, due_date, notes } = req.body;
  if (!title || !doc_type) return res.status(400).json({ error: 'title and doc_type are required' });

  const result = db.prepare(
    'INSERT INTO program_documents (program_id, title, doc_type, assigned_to, due_date, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, title, doc_type, assigned_to || null, due_date || null, notes || null);

  res.status(201).json(db.prepare('SELECT * FROM program_documents WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/documents/:docId', (req, res) => {
  const db = getDb();
  const { title, doc_type, status, version, assigned_to, due_date, completed_date, file_url, notes } = req.body;
  db.prepare(
    "UPDATE program_documents SET title=?, doc_type=?, status=?, version=?, assigned_to=?, due_date=?, completed_date=?, file_url=?, notes=?, updated_at=datetime('now') WHERE id=?"
  ).run(title, doc_type, status, version, assigned_to, due_date, completed_date, file_url, notes, req.params.docId);
  res.json(db.prepare('SELECT * FROM program_documents WHERE id = ?').get(req.params.docId));
});

router.delete('/documents/:docId', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM program_documents WHERE id = ?').run(req.params.docId);
  res.json({ success: true });
});

// --- Tasks ---

router.post('/:id/tasks', (req, res) => {
  const db = getDb();
  const { title, description, priority, assigned_to, due_date, category, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const result = db.prepare(
    'INSERT INTO program_tasks (program_id, title, description, priority, assigned_to, due_date, category, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, title, description || null, priority || 'medium', assigned_to || null, due_date || null, category || null, notes || null);

  res.status(201).json(db.prepare('SELECT * FROM program_tasks WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/tasks/:taskId', (req, res) => {
  const db = getDb();
  const { title, description, priority, status, assigned_to, due_date, completed_date, category, notes } = req.body;
  const completedVal = status === 'done' && !completed_date ? new Date().toISOString().split('T')[0] : completed_date;

  db.prepare(
    "UPDATE program_tasks SET title=?, description=?, priority=?, status=?, assigned_to=?, due_date=?, completed_date=?, category=?, notes=?, updated_at=datetime('now') WHERE id=?"
  ).run(title, description, priority, status, assigned_to, due_date, completedVal, category, notes, req.params.taskId);

  res.json(db.prepare('SELECT * FROM program_tasks WHERE id = ?').get(req.params.taskId));
});

router.delete('/tasks/:taskId', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM program_tasks WHERE id = ?').run(req.params.taskId);
  res.json({ success: true });
});

// --- Milestones ---

router.post('/:id/milestones', (req, res) => {
  const db = getDb();
  const { title, target_date, notes } = req.body;
  const result = db.prepare(
    'INSERT INTO program_milestones (program_id, title, target_date, notes) VALUES (?, ?, ?, ?)'
  ).run(req.params.id, title, target_date || null, notes || null);
  res.status(201).json(db.prepare('SELECT * FROM program_milestones WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/milestones/:msId', (req, res) => {
  const db = getDb();
  const { title, target_date, completed_date, status, notes } = req.body;
  db.prepare(
    'UPDATE program_milestones SET title=?, target_date=?, completed_date=?, status=?, notes=? WHERE id=?'
  ).run(title, target_date, completed_date, status, notes, req.params.msId);
  res.json(db.prepare('SELECT * FROM program_milestones WHERE id = ?').get(req.params.msId));
});

module.exports = router;
