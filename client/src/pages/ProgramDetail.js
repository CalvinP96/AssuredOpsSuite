import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const DOC_TYPES = ['Policy', 'Procedure', 'Form', 'Report', 'Audit', 'Compliance', 'Training', 'SOP', 'Manual', 'Checklist', 'Other'];
const DOC_STATUSES = ['draft', 'in_review', 'approved', 'active', 'archived'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];

export default function ProgramDetail({ role }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [tab, setTab] = useState('overview');
  const [showDocModal, setShowDocModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMsModal, setShowMsModal] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [editTask, setEditTask] = useState(null);

  const [docForm, setDocForm] = useState({ title: '', doc_type: 'SOP', assigned_to: '', due_date: '', notes: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '', category: '', notes: '' });
  const [msForm, setMsForm] = useState({ title: '', target_date: '', notes: '' });

  const load = useCallback(() => {
    fetch(`/api/programs/${id}`).then(r => r.json()).then(setProgram).catch(() => {});
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Document handlers
  const submitDoc = async (e) => {
    e.preventDefault();
    if (editDoc) {
      await fetch(`/api/programs/documents/${editDoc.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editDoc, ...docForm })
      });
    } else {
      await fetch(`/api/programs/${id}/documents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docForm)
      });
    }
    closeDocModal();
    load();
  };

  const updateDocStatus = async (doc, status) => {
    await fetch(`/api/programs/documents/${doc.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...doc, status })
    });
    load();
  };

  const deleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    await fetch(`/api/programs/documents/${docId}`, { method: 'DELETE' });
    load();
  };

  const openEditDoc = (doc) => {
    setEditDoc(doc);
    setDocForm({ title: doc.title, doc_type: doc.doc_type, assigned_to: doc.assigned_to || '', due_date: doc.due_date || '', notes: doc.notes || '' });
    setShowDocModal(true);
  };

  const closeDocModal = () => { setShowDocModal(false); setEditDoc(null); setDocForm({ title: '', doc_type: 'SOP', assigned_to: '', due_date: '', notes: '' }); };

  // Task handlers
  const submitTask = async (e) => {
    e.preventDefault();
    if (editTask) {
      await fetch(`/api/programs/tasks/${editTask.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editTask, ...taskForm })
      });
    } else {
      await fetch(`/api/programs/${id}/tasks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm)
      });
    }
    closeTaskModal();
    load();
  };

  const updateTaskStatus = async (task, status) => {
    await fetch(`/api/programs/tasks/${task.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, status })
    });
    load();
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({ title: task.title, description: task.description || '', priority: task.priority, assigned_to: task.assigned_to || '', due_date: task.due_date || '', category: task.category || '', notes: task.notes || '' });
    setShowTaskModal(true);
  };

  const closeTaskModal = () => { setShowTaskModal(false); setEditTask(null); setTaskForm({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '', category: '', notes: '' }); };

  // Milestone handlers
  const submitMs = async (e) => {
    e.preventDefault();
    await fetch(`/api/programs/${id}/milestones`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msForm)
    });
    setShowMsModal(false);
    setMsForm({ title: '', target_date: '', notes: '' });
    load();
  };

  const completeMilestone = async (ms) => {
    await fetch(`/api/programs/milestones/${ms.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ms, status: 'completed', completed_date: new Date().toISOString().split('T')[0] })
    });
    load();
  };

  if (!program) return <div className="card"><p>Loading...</p></div>;

  const canEdit = role === 'Admin' || role === 'Operations';
  const todoTasks = program.tasks?.filter(t => t.status === 'todo') || [];
  const inProgressTasks = program.tasks?.filter(t => t.status === 'in_progress') || [];
  const reviewTasks = program.tasks?.filter(t => t.status === 'review') || [];
  const doneTasks = program.tasks?.filter(t => t.status === 'done') || [];

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>{program.name} <span className="badge active">{program.code}</span></h2>
          {program.manager_name && <p style={{ color: '#888', marginTop: 4 }}>Manager: {program.manager_name} {program.manager_title ? `(${program.manager_title})` : ''}</p>}
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/programs')}>Back to Programs</button>
      </div>

      {program.description && <div className="card"><p>{program.description}</p></div>}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {['overview', 'documents', 'tasks', 'milestones'].map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div>
          <div className="stats-grid">
            <div className="stat-card blue"><div className="stat-value">{program.documents?.length || 0}</div><div className="stat-label">Documents</div></div>
            <div className="stat-card orange"><div className="stat-value">{todoTasks.length + inProgressTasks.length + reviewTasks.length}</div><div className="stat-label">Open Tasks</div></div>
            <div className="stat-card green"><div className="stat-value">{doneTasks.length}</div><div className="stat-label">Completed Tasks</div></div>
            <div className="stat-card"><div className="stat-value">{program.milestones?.length || 0}</div><div className="stat-label">Milestones</div></div>
          </div>

          {inProgressTasks.length > 0 && (
            <div className="card">
              <h3>In Progress Tasks</h3>
              {inProgressTasks.map(t => (
                <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                  <div><strong>{t.title}</strong> {t.assigned_to && <small style={{ color: '#888' }}>- {t.assigned_to}</small>}</div>
                  <span className={`badge ${t.priority === 'critical' ? 'terminated' : t.priority === 'high' ? 'at_risk' : 'active'}`}>{t.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DOCUMENTS TAB */}
      {tab === 'documents' && (
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
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: '#888', padding: 30 }}>No documents yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TASKS TAB - Kanban style */}
      {tab === 'tasks' && (
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
        </div>
      )}

      {/* MILESTONES TAB */}
      {tab === 'milestones' && (
        <div>
          {canEdit && (
            <div style={{ marginBottom: 15 }}>
              <button className="btn btn-primary" onClick={() => setShowMsModal(true)}>+ Add Milestone</button>
            </div>
          )}
          <div className="card">
            {program.milestones?.map(ms => (
              <div key={ms.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{ms.title}</strong>
                  {ms.target_date && <span style={{ marginLeft: 10, color: '#888', fontSize: 13 }}>Target: {ms.target_date}</span>}
                  {ms.notes && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>{ms.notes}</p>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${ms.status === 'completed' ? 'active' : 'pending'}`}>{ms.status}</span>
                  {canEdit && ms.status !== 'completed' && (
                    <button className="btn btn-sm btn-success" onClick={() => completeMilestone(ms)}>Complete</button>
                  )}
                </div>
              </div>
            ))}
            {(!program.milestones || program.milestones.length === 0) && (
              <p style={{ textAlign: 'center', color: '#888', padding: 20 }}>No milestones yet</p>
            )}
          </div>
        </div>
      )}

      {/* Doc Modal */}
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

      {/* Task Modal */}
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

      {/* Milestone Modal */}
      {showMsModal && (
        <div className="modal-overlay" onClick={() => setShowMsModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Milestone</h3>
            <form onSubmit={submitMs}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Milestone Title *</label>
                  <input required value={msForm.title} onChange={e => setMsForm({...msForm, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Target Date</label>
                  <input type="date" value={msForm.target_date} onChange={e => setMsForm({...msForm, target_date: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} value={msForm.notes} onChange={e => setMsForm({...msForm, notes: e.target.value})} />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-success">Add Milestone</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMsModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
