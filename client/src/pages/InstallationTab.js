import React from 'react';
import * as api from '../api';

export default function InstallationTab({ job, program, canEdit, onUpdate, role }) {
  const getScope = () => {
    try { return JSON.parse(job.scope_data || '{}'); } catch { return {}; }
  };
  const sc = getScope();

  return (
    <div>
      <div className="jd-card">
        <div className="jd-card-title">Installation Progress</div>
        <div className="jd-schedule-grid">
          {[
            { label: 'ABC Install Date', field: 'abc_install_date' },
            { label: 'Wall Injection Date', field: 'wall_injection_date' },
            { label: 'Patch Date', field: 'patch_date' },
          ].map(d => (
            <div key={d.field} className="jd-field">
              <label className="jd-field-label">{d.label}</label>
              <input type="date" className="jd-date-input" value={job[d.field] || ''} disabled={!canEdit}
                onChange={e => onUpdate(d.field, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Scope summary for installer reference */}
      <div className="jd-card">
        <div className="jd-card-title">Scope of Work (Reference)</div>
        {(sc.selected_measures || []).length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(sc.selected_measures || []).map(m => (
              <span key={m} style={{ fontSize: 12, padding: '4px 10px', background: '#e8f5e9', borderRadius: 4, border: '1px solid #c8e6c9' }}>{m}</span>
            ))}
          </div>
        ) : <p style={{ fontSize: 12, color: '#888' }}>No scope defined yet.</p>}
        {sc.notes && <p style={{ fontSize: 11, color: '#666', marginTop: 8 }}><strong>Notes:</strong> {sc.notes}</p>}
      </div>

      {/* Checklist for installer */}
      <div className="jd-card">
        <div className="jd-card-title">Install Checklist</div>
        {(job.checklist || []).filter(c => c.item_type === 'photo' || c.item_type === 'paperwork').map(item => (
          <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 0', cursor: canEdit ? 'pointer' : 'default' }}>
            <input type="checkbox" checked={!!item.completed} disabled={!canEdit}
              onChange={async () => {
                await api.updateChecklist(item.id, { completed: !item.completed, completed_by: role });
                onUpdate('_reload');
              }} />
            <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#888' : '#333' }}>
              {item.description}
            </span>
            {item.completed_date && <span style={{ fontSize: 10, color: '#888' }}>({item.completed_date})</span>}
          </label>
        ))}
      </div>
    </div>
  );
}
