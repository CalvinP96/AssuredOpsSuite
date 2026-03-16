import React, { useState } from 'react';
import * as api from '../../api';

const DOC_TYPES = ['Policy', 'Procedure', 'Form', 'Report', 'Audit', 'Compliance', 'Training', 'SOP', 'Manual', 'Checklist', 'Other'];
const DOC_STATUSES = ['draft', 'in_review', 'approved', 'active', 'archived'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];

export default function ProgramDocsTasksTab({ program, canEdit, onRefresh }) {
  const [section, setSection] = useState('documents');

  // Document state
  const [showDocModal, setShowDocModal] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [docForm, setDocForm] = useState({ title: '', doc_type: 'SOP', assigned_to: '', due_date: '', notes: '' });

  // Task state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '', category: '', notes: '' });

  // Document handlers
  const closeDocModal = () => { setShowDocModal(false); setEditDoc(null); setDocForm({ title: '', doc_type: 'SOP', assigned_to: '', due_date: '', notes: '' }); };

  const submitDoc = async (e) => {
    e.preventDefault();
    try {
      if (editDoc) {
        await api.updateDocument(editDoc.id, { ...editDoc, ...docForm });
      } else {
        await api.createDocument(program.id, docForm);
      }
      closeDocModal();
      onRefresh();
    } catch (err) { alert('Failed to save document: ' + err.message); }
  };

  const updateDocStatus = async (doc, status) => {
    try { await api.updateDocument(doc.id, { ...doc, status }); onRefresh(); }
    catch (err) { alert('Failed to update document: ' + err.message); }
  };

  const deleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try { await api.deleteDocument(docId); onRefresh(); }
    catch (err) { alert('Failed to delete document: ' + err.message); }
  };

  const openEditDoc = (doc) => {
    setEditDoc(doc);
    setDocForm({ title: doc.title, doc_type: doc.doc_type, assigned_to: doc.assigned_to || '', due_date: doc.due_date || '', notes: doc.notes || '' });
    setShowDocModal(true);
  };

  // Task handlers
  const closeTaskModal = () => { setShowTaskModal(false); setEditTask(null); setTaskForm({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '', category: '', notes: '' }); };

  const submitTask = async (e) => {
    e.preventDefault();
    try {
      if (editTask) {
        await api.updateTask(editTask.id, { ...editTask, ...taskForm });
      } else {
        await api.createTask(program.id, taskForm);
      }
      closeTaskModal();
      onRefresh();
    } catch (err) { alert('Failed to save task: ' + err.message); }
  };

  const updateTaskStatus = async (task, status) => {
    try { await api.updateTask(task.id, { ...task, status }); onRefresh(); }
    catch (err) { alert('Failed to update task: ' + err.message); }
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({ title: task.title, description: task.description || '', priority: task.priority, assigned_to: task.assigned_to || '', due_date: task.due_date || '', category: task.category || '', notes: task.notes || '' });
    setShowTaskModal(true);
  };

  const tasks = program.tasks || [];
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const reviewTasks = tasks.filter(t => t.status === 'review');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div>
      {/* Section Toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button className={`btn btn-sm ${section === 'documents' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSection('documents')}>Documents ({(program.documents || []).length})</button>
        <button className={`btn btn-sm ${section === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSection('tasks')}>Tasks ({tasks.length})</button>
      </div>

      {/* ===== DOCUMENTS SECTION ===== */}
      {section === 'documents' && (
        <div>
          {canEdit && (
            <div style={{ marginBottom: 15 }}>
              <button className="btn btn-primary" onClick={() => setShowDocModal(true)}>+ Add Document</button>
            </div>
          )}
          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Version</th><th>Assigned To</th><th>Due Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {program.documents?.map(doc => (
                    <tr key={doc.id}>
                      <td><strong>{doc.title}</strong></td>
                      <td>{doc.doc_type}</td>
                      <td>
                        {canEdit ? (
                          <select className="btn btn-sm" value={doc.status} onChange={e => updateDocStatus(doc, e.target.value)}
                            style={{ padding: '2px 6px', fontSize: 12 }}>
                            {DOC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span className={`badge ${doc.status === 'approved' || doc.status === 'active' ? 'active' : doc.status === 'draft' ? 'pending' : 'at_risk'}`}>{doc.status}</span>
                        )}
                      </td>
                      <td>{doc.version}</td>
                      <td>{doc.assigned_to || '-'}</td>
                      <td>{doc.due_date || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {canEdit && <button className="btn btn-sm btn-secondary" onClick={() => openEditDoc(doc)}>Edit</button>}
                          {canEdit && <button className="btn btn-sm btn-danger" onClick={() => deleteDoc(doc.id)}>Del</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!program.documents || program.documents.length === 0) && (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 30 }}>No documents yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showDocModal && (
            <div className="modal-overlay" onClick={closeDocModal}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>{editDoc ? 'Edit Document' : 'Add Document'}</h3>
                <form onSubmit={submitDoc}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Document Title *</label>
                      <input required value={docForm.title} onChange={e => setDocForm({...docForm, title: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Document Type *</label>
                      <select value={docForm.doc_type} onChange={e => setDocForm({...docForm, doc_type: e.target.value})}>
                        {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Assigned To</label>
                      <input value={docForm.assigned_to} onChange={e => setDocForm({...docForm, assigned_to: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Due Date</label>
                      <input type="date" value={docForm.due_date} onChange={e => setDocForm({...docForm, due_date: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea rows={2} value={docForm.notes} onChange={e => setDocForm({...docForm, notes: e.target.value})} />
                  </div>
                  <div className="btn-group">
                    <button type="submit" className="btn btn-success">{editDoc ? 'Update' : 'Add Document'}</button>
                    <button type="button" className="btn btn-secondary" onClick={closeDocModal}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== TASKS SECTION ===== */}
      {section === 'tasks' && (
        <div>
          {canEdit && (
            <div style={{ marginBottom: 15 }}>
              <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>+ Add Task</button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15 }}>
            {[{ title: 'To Do', items: todoTasks, status: 'todo' },
              { title: 'In Progress', items: inProgressTasks, status: 'in_progress' },
              { title: 'Review', items: reviewTasks, status: 'review' },
              { title: 'Done', items: doneTasks, status: 'done' }].map(col => (
              <div key={col.status}>
                <h4 style={{ marginBottom: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
                  {col.title} ({col.items.length})
                </h4>
                {col.items.map(task => (
                  <div key={task.id} className="card" style={{ marginBottom: 10, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <strong style={{ fontSize: 13 }}>{task.title}</strong>
                      <span className={`badge ${task.priority === 'critical' ? 'terminated' : task.priority === 'high' ? 'at_risk' : 'active'}`}
                        style={{ fontSize: 10 }}>{task.priority}</span>
                    </div>
                    {task.assigned_to && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{task.assigned_to}</div>}
                    {task.due_date && <div style={{ fontSize: 11, color: 'var(--color-danger)' }}>Due: {task.due_date}</div>}
                    {canEdit && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                        {TASK_STATUSES.filter(s => s !== task.status).map(s => (
                          <button key={s} className="btn btn-sm btn-secondary" style={{ padding: '2px 6px', fontSize: 10 }}
                            onClick={() => updateTaskStatus(task, s)}>{s.replace('_', ' ')}</button>
                        ))}
                        <button className="btn btn-sm btn-secondary" style={{ padding: '2px 6px', fontSize: 10 }}
                          onClick={() => openEditTask(task)}>Edit</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {showTaskModal && (
            <div className="modal-overlay" onClick={closeTaskModal}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>{editTask ? 'Edit Task' : 'Add Task'}</h3>
                <form onSubmit={submitTask}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Task Title *</label>
                      <input required value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                        {TASK_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Assigned To</label>
                      <input value={taskForm.assigned_to} onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Due Date</label>
                      <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <input placeholder="e.g. Compliance, Outreach, QA" value={taskForm.category} onChange={e => setTaskForm({...taskForm, category: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea rows={2} value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
                  </div>
                  <div className="btn-group">
                    <button type="submit" className="btn btn-success">{editTask ? 'Update' : 'Add Task'}</button>
                    <button type="button" className="btn btn-secondary" onClick={closeTaskModal}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
