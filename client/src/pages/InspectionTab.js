import React from 'react';
import * as api from '../api';

export default function InspectionTab({ job, program, canEdit, onUpdate, role }) {
  const getAssessment = () => {
    try { return JSON.parse(job.assessment_data || '{}'); } catch { return {}; }
  };
  const ad = getAssessment();

  const saveAssessment = async (data) => {
    try { await api.saveAssessmentData(job.id, data); } catch (err) { alert('Failed to save: ' + err.message); }
  };

  const aVal = (section, field) => (ad[section] || {})[field] || '';
  const aSet = (section, field, val) => {
    const updated = { ...ad, [section]: { ...(ad[section] || {}), [field]: val } };
    saveAssessment(updated);
  };
  const txt = (section, field, ph, w) => (
    <input style={{ width: w || 100, fontSize: 11, padding: '2px 4px', border: '1px solid #ccc', borderRadius: 3 }}
      defaultValue={aVal(section, field)} placeholder={ph} disabled={!canEdit}
      onBlur={e => aSet(section, field, e.target.value)} />
  );

  const gs = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px 16px', fontSize: 12 };
  const fs = { display: 'flex', alignItems: 'center', gap: 4, padding: '3px 0' };

  return (
    <div>
      <div className="jd-card">
        <div className="jd-card-title">Final Inspection</div>
        <div className="jd-schedule-grid">
          <div className="jd-field">
            <label className="jd-field-label">Inspection Date</label>
            <input type="date" className="jd-date-input" value={job.inspection_date || ''} disabled={!canEdit}
              onChange={e => onUpdate('inspection_date', e.target.value)} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Submission Date</label>
            <input type="date" className="jd-date-input" value={job.submission_date || ''} disabled={!canEdit}
              onChange={e => onUpdate('submission_date', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Post-install diagnostics */}
      <div className="jd-card">
        <div className="jd-card-title">Post-Install Diagnostics</div>
        <div style={gs}>
          <div style={fs}><strong>Post Blower Door (CFM50):</strong> {txt('diagnostics', 'post_cfm50', 'CFM50', 60)}</div>
          <div style={fs}><strong>Post Duct Blaster (CFM25):</strong> {txt('diagnostics', 'post_cfm25', 'CFM25', 60)}</div>
          <div style={fs}><strong>% CFM50 Reduction:</strong> {txt('diagnostics', 'cfm50_reduction', '%', 40)}</div>
          <div style={fs}><strong>Combustion Post:</strong> {txt('diagnostics', 'combustion_post', '%', 60)}</div>
        </div>
      </div>

      {/* QA Checklist */}
      <div className="jd-card">
        <div className="jd-card-title">Inspection Checklist</div>
        {['job_paperwork', 'photo', 'paperwork'].map(type => {
          const items = (job.checklist || []).filter(c => c.item_type === type);
          if (items.length === 0) return null;
          return (
            <div key={type} style={{ marginBottom: 12 }}>
              <h4 style={{ fontSize: 13, marginBottom: 6, textTransform: 'capitalize' }}>
                {type === 'job_paperwork' ? 'Job Documentation' : type === 'photo' ? 'Photo Requirements' : 'Measure Paperwork'}
              </h4>
              {items.map(item => (
                <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '3px 0', cursor: canEdit ? 'pointer' : 'default' }}>
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
