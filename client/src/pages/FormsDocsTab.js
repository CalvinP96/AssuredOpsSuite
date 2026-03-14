import React from 'react';
import * as api from '../api';

export default function FormsDocsTab({ job, program, canEdit, onUpdate, role }) {
  const getScope = () => {
    try { return JSON.parse(job.scope_data || '{}'); } catch { return {}; }
  };
  const sc = getScope();

  const saveScope = async (data) => {
    try { await api.saveScopeData(job.id, data); } catch (err) { alert('Failed to save: ' + err.message); }
  };

  const FORMS = [
    { name: 'Customer Authorization Form', desc: 'Customer signs to authorize work', key: 'auth_form' },
    { name: 'Customer-Signed Final Scope of Work', desc: 'Customer approves the final scope before install', key: 'signed_scope' },
    { name: 'Assessment Report', desc: 'MS Forms assessment survey completed', key: 'assessment_report' },
    { name: 'Hazardous Conditions Form', desc: 'Document any H&S hazards found', key: 'hazardous_form' },
    { name: 'Sub-Contractor Estimates', desc: 'If applicable, for work outside scope', key: 'sub_estimates' },
    { name: 'Final Inspection Form', desc: 'QA inspector completes after install', key: 'final_inspection' },
    { name: 'Final Invoice', desc: 'Invoice for completed work', key: 'final_invoice' },
  ];

  return (
    <div>
      <div className="jd-card">
        <div className="jd-card-title">Required Forms & Signatures</div>
        <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>Track all forms that need to be signed and submitted for this project per 2026 HES requirements.</p>
        <div style={{ display: 'grid', gap: 8 }}>
          {FORMS.map(form => {
            const formStatus = (sc.forms || {})[form.key] || 'pending';
            return (
              <div key={form.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: formStatus === 'signed' ? '#e8f5e9' : '#f9f9f9', borderRadius: 6, border: '1px solid #eee' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{form.name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{form.desc}</div>
                </div>
                <select value={formStatus} disabled={!canEdit}
                  onChange={e => saveScope({ ...sc, forms: { ...(sc.forms || {}), [form.key]: e.target.value } })}
                  style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4 }}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="signed">Signed/Complete</option>
                  <option value="na">N/A</option>
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* Documentation Checklist */}
      <div className="jd-card">
        <div className="jd-card-title">Documentation Checklist</div>
        {['job_paperwork', 'photo', 'paperwork'].map(type => {
          const items = (job.checklist || []).filter(c => c.item_type === type);
          if (items.length === 0) return null;
          return (
            <div key={type} style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, marginBottom: 8, textTransform: 'capitalize' }}>
                {type === 'job_paperwork' ? 'Job Documentation' : type === 'photo' ? 'Photo Requirements' : 'Measure Paperwork'}
              </h4>
              {items.map(item => (
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
          );
        })}
      </div>
    </div>
  );
}
