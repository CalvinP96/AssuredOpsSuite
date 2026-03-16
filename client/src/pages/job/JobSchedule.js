import React, { useState, useEffect, useRef } from 'react';

const INSTALL_STATUSES = [
  'approved', 'install_scheduled', 'install_in_progress',
  'inspection', 'submitted', 'invoiced', 'complete'
];

export default function JobSchedule({ job, canEdit, onUpdate }) {
  const [form, setForm] = useState({
    assessment_date: job.assessment_date || '',
    schedule_notes: job.schedule_notes || '',
    assessor_name: job.assessor_name || '',
    install_date: job.install_date || '',
    install_notes: job.install_notes || '',
    insulation_crew: job.insulation_crew || '',
    hvac_scheduled: !!job.hvac_scheduled,
    hvac_date: job.hvac_date || '',
  });

  const saveTimer = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onUpdate(form), 800);
    return () => clearTimeout(saveTimer.current);
  }, [form]); // eslint-disable-line

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const showInstall = INSTALL_STATUSES.includes(job.status);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* ASSESSMENT SCHEDULING */}
      <div className="jd-card">
        <div className="jd-card-title">Assessment Scheduling</div>
        <div className="jd-field-grid">
          <div className="jd-field">
            <label className="jd-field-label">Assessment Date</label>
            <input type="date" className="jd-date-input"
              value={form.assessment_date} disabled={!canEdit}
              onChange={e => set('assessment_date', e.target.value)} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Assigned Assessor</label>
            <input value={form.assessor_name} disabled={!canEdit}
              onChange={e => set('assessor_name', e.target.value)} />
          </div>
        </div>
        <div className="jd-field" style={{ marginTop: 12 }}>
          <label className="jd-field-label">Assessment Notes</label>
          <textarea value={form.schedule_notes} disabled={!canEdit}
            onChange={e => set('schedule_notes', e.target.value)} rows={2}
            placeholder="Customer availability, access notes..." />
        </div>
      </div>

      {/* INSTALL SCHEDULING */}
      {showInstall ? (
        <div className="jd-card">
          <div className="jd-card-title">Install Scheduling</div>
          <div className="jd-field-grid">
            <div className="jd-field">
              <label className="jd-field-label">Install Date</label>
              <input type="date" className="jd-date-input"
                value={form.install_date} disabled={!canEdit}
                onChange={e => set('install_date', e.target.value)} />
            </div>
            <div className="jd-field">
              <label className="jd-field-label">Insulation Crew</label>
              <input value={form.insulation_crew} disabled={!canEdit}
                onChange={e => set('insulation_crew', e.target.value)} />
            </div>
          </div>
          <div className="jd-field" style={{ marginTop: 12 }}>
            <label className="jd-field-label">Install Notes</label>
            <textarea value={form.install_notes} disabled={!canEdit}
              onChange={e => set('install_notes', e.target.value)} rows={2}
              placeholder="Crew details, material staging..." />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: canEdit ? 'pointer' : 'default' }}>
              <input type="checkbox" checked={form.hvac_scheduled} disabled={!canEdit}
                onChange={e => set('hvac_scheduled', e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
              <span>HVAC Scheduled</span>
            </label>
            {form.hvac_scheduled && (
              <div className="jd-field" style={{ marginTop: 8 }}>
                <label className="jd-field-label">HVAC Date</label>
                <input type="date" className="jd-date-input"
                  value={form.hvac_date} disabled={!canEdit}
                  onChange={e => set('hvac_date', e.target.value)} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="jd-card">
          <div className="jd-card-title">Install Scheduling</div>
          <p style={{ fontSize: 12, color: '#64748b' }}>
            Install scheduling opens after scope is approved.
          </p>
        </div>
      )}

    </div>
  );
}
