import React, { useState } from 'react';
import * as api from '../../api';

const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];

export default function ProgramTasksTab({ program, canEdit, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '', category: '', notes: '' });

  const closeModal = () => { setShowModal(false); setEditTask(null); setForm({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '', category: '', notes: '' }); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editTask) {
        await api.updateTask(editTask.id, { ...editTask, ...form });
      } else {
        await api.createTask(program.id, form);
      }
      closeModal();
      onRefresh();
    } catch (err) { alert('Failed to save task: ' + err.message); }
  };

  const updateStatus = async (task, status) => {
    try { await api.updateTask(task.id, { ...task, status }); onRefresh(); }
    catch (err) { alert('Failed to update task: ' + err.message); }
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({ title: task.title, description: task.description || '', priority: task.priority, assigned_to: task.assigned_to || '', due_date: task.due_date || '', category: task.category || '', notes: task.notes || '' });
    setShowModal(true);
  };

  const tasks = program.tasks || [];
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const reviewTasks = tasks.filter(t => t.status === 'review');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div>
      {canEdit && (
        <div style={{ marginBottom: 15 }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Task</button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15 }}>
        {[{ title: 'To Do', items: todoTasks, status: 'todo' },
          { title: 'In Progress', items: inProgressTasks, status: 'in_progress' },
          { title: 'Review', items: reviewTasks, status: 'review' },
          { title: 'Done', items: doneTasks, status: 'done' }].map(col => (
          <div key={col.status}>
            <h4 style={{ marginBottom: 10, color: '#666', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
              {col.title} ({col.items.length})
            </h4>
            {col.items.map(task => (
              <div key={task.id} className="card" style={{ marginBottom: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ fontSize: 13 }}>{task.title}</strong>
                  <span className={`badge ${task.priority === 'critical' ? 'terminated' : task.priority === 'high' ? 'at_risk' : 'active'}`}
                    style={{ fontSize: 10 }}>{task.priority}</span>
                </div>
                {task.assigned_to && <div style={{ fontSize: 12, color: '#888' }}>{task.assigned_to}</div>}
                {task.due_date && <div style={{ fontSize: 11, color: '#e94560' }}>Due: {task.due_date}</div>}
                {canEdit && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                    {TASK_STATUSES.filter(s => s !== task.status).map(s => (
                      <button key={s} className="btn btn-sm btn-secondary" style={{ padding: '2px 6px', fontSize: 10 }}
                        onClick={() => updateStatus(task, s)}>{s.replace('_', ' ')}</button>
                    ))}
                    <button className="btn btn-sm btn-secondary" style={{ padding: '2px 6px', fontSize: 10 }}
                      onClick={() => openEdit(task)}>Edit</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editTask ? 'Edit Task' : 'Add Task'}</h3>
            <form onSubmit={submit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Task Title *</label>
                  <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    {TASK_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assigned To</label>
                  <input value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input placeholder="e.g. Compliance, Outreach, QA" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-success">{editTask ? 'Update' : 'Add Task'}</button>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
