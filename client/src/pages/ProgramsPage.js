import React, { useState, useEffect, useCallback } from 'react';

export default function ProgramsPage({ role }) {
  const [programs, setPrograms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', manager_name: '', manager_title: '', site_url: '' });

  const load = useCallback(() => {
    fetch('/api/programs').then(r => r.json()).then(setPrograms).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/programs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setShowModal(false);
    setForm({ name: '', code: '', description: '', manager_name: '', manager_title: '', site_url: '' });
    load();
  };

  const canEdit = role === 'Admin' || role === 'Operations';

  return (
    <div>
      <div className="section-header">
        <h2>Programs</h2>
        {canEdit && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Program</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {programs.map(p => (
          <div key={p.id} className="card" style={{ cursor: 'pointer' }}
            onClick={() => window.location.href = `/program/${p.id}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3 style={{ margin: 0 }}>{p.name}</h3>
                <span className="badge active" style={{ marginTop: 5, display: 'inline-block' }}>{p.code}</span>
              </div>
              <span className={`badge ${p.status}`}>{p.status}</span>
            </div>
            {p.description && <p style={{ color: '#888', margin: '10px 0 0', fontSize: 13 }}>{p.description}</p>}
            <div style={{ marginTop: 15, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ padding: 8, background: '#f0f2f5', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#0f3460' }}>{p.doc_count}</div>
                <div style={{ fontSize: 11, color: '#888' }}>Documents</div>
              </div>
              <div style={{ padding: 8, background: '#f0f2f5', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: p.open_tasks > 0 ? '#e94560' : '#27ae60' }}>{p.open_tasks}</div>
                <div style={{ fontSize: 11, color: '#888' }}>Open Tasks</div>
              </div>
            </div>
            {p.manager_name && (
              <div style={{ marginTop: 10, fontSize: 13, color: '#666' }}>
                <strong>Manager:</strong> {p.manager_name}{p.manager_title ? ` (${p.manager_title})` : ''}
              </div>
            )}
          </div>
        ))}
        {programs.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40, gridColumn: '1/-1' }}>
            <p style={{ fontSize: 40, marginBottom: 10 }}>📋</p>
            <h3>No Programs Yet</h3>
            <p style={{ color: '#888' }}>Add your first program (HES IE, WHE SF, WHE MF, CEDA, Elevate MF, IESP, etc.)</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add New Program</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Program Name *</label>
                  <input required placeholder="e.g. HES IE" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Program Code * (unique)</label>
                  <input required placeholder="e.g. HES-IE" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Program Manager</label>
                  <input placeholder="Manager name" value={form.manager_name} onChange={e => setForm({...form, manager_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Manager Title</label>
                  <input placeholder="e.g. CTO, Program Manager" value={form.manager_title} onChange={e => setForm({...form, manager_title: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Program Site URL (optional)</label>
                <input type="url" placeholder="https://..." value={form.site_url} onChange={e => setForm({...form, site_url: e.target.value})} />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-success">Add Program</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
