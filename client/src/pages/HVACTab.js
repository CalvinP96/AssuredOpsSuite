import React from 'react';

export default function HVACTab({ job, program, canEdit, onUpdate }) {
  return (
    <div className="jd-card">
      <div className="jd-card-title">HVAC Tune & Clean / Replacements</div>
      <div className="jd-schedule-grid" style={{ marginBottom: 16 }}>
        {[
          { label: 'HVAC Tune & Clean Date', field: 'hvac_tune_clean_date' },
          { label: 'HVAC Replacement Date', field: 'hvac_replacement_date' },
        ].map(d => (
          <div key={d.field} className="jd-field">
            <label className="jd-field-label">{d.label}</label>
            <input type="date" className="jd-date-input" value={job[d.field] || ''} disabled={!canEdit}
              onChange={e => onUpdate(d.field, e.target.value)} />
          </div>
        ))}
      </div>
      {(job.hvac_replacements || []).length === 0 ? (
        <p style={{ color: '#888', fontSize: 12 }}>No HVAC records yet.</p>
      ) : (
        (job.hvac_replacements || []).map(hvac => (
          <div key={hvac.id} style={{ padding: 12, border: '1px solid #ddd', borderRadius: 6, marginBottom: 10, background: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 13 }}>{hvac.equipment_type}</strong>
              <span className={`badge ${hvac.approval_status === 'approved' ? 'active' : 'pending'}`} style={{ fontSize: 10 }}>
                {hvac.approval_status}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 6, fontSize: 12 }}>
              <div><strong>Make:</strong> {hvac.existing_make || '-'}</div>
              <div><strong>Model:</strong> {hvac.existing_model || '-'}</div>
              <div><strong>Condition:</strong> {hvac.existing_condition || '-'}</div>
              <div><strong>Efficiency:</strong> {hvac.existing_efficiency || '-'}</div>
              <div><strong>Age:</strong> {hvac.existing_age || '-'}</div>
              <div><strong>Decision Tree:</strong> {hvac.decision_tree_result || '-'}</div>
            </div>
            {hvac.notes && <p style={{ fontSize: 11, color: '#666', marginTop: 6 }}>{hvac.notes}</p>}
          </div>
        ))
      )}
    </div>
  );
}
