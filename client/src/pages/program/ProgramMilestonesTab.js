import React, { useState } from 'react';
import * as api from '../../api';

export default function ProgramMilestonesTab({ program, canEdit, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', target_date: '', notes: '' });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.createMilestone(program.id, form);
      setShowModal(false);
      setForm({ title: '', target_date: '', notes: '' });
      onRefresh();
    } catch (err) { alert('Failed to create milestone: ' + err.message); }
  };

  const complete = async (ms) => {
    try { await api.updateMilestone(ms.id, { ...ms, status: 'completed', completed_date: new Date().toISOString().split('T')[0] }); onRefresh(); }
    catch (err) { alert('Failed to update milestone: ' + err.message); }
  };

  return (
    <div>
      {canEdit && (
        <div style={{ marginBottom: 15 }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Milestone</button>
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
                <button className="btn btn-sm btn-success" onClick={() => complete(ms)}>Complete</button>
              )}
            </div>
          </div>
        ))}
        {(!program.milestones || program.milestones.length === 0) && (
          <p style={{ textAlign: 'center', color: '#888', padding: 20 }}>No milestones yet</p>
        )}
      </div>

      {/* Milestone Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Milestone</h3>
            <form onSubmit={submit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Milestone Title *</label>
                  <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Target Date</label>
                  <input type="date" value={form.target_date} onChange={e => setForm({...form, target_date: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-success">Add Milestone</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
