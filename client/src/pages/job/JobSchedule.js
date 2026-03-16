import React, { useState, useEffect, useRef, useMemo } from 'react';

const INSTALL_STATUSES = [
  'approved', 'install_scheduled', 'install_in_progress',
  'inspection', 'submitted', 'invoiced', 'complete'
];

export default function JobSchedule({ job, canEdit, onUpdate }) {
  // Determine which install types are applicable based on job measures
  const { hasHvacTuneClean, hasReplacement, hasWallInjection } = useMemo(() => {
    const ms = job.job_measures || [];
    return {
      hasHvacTuneClean: ms.some(m => m.program_measures?.name?.includes('Tune-Up')),
      hasReplacement: ms.some(m => m.program_measures?.name?.includes('Replacement')),
      hasWallInjection: ms.some(m => m.program_measures?.name === 'Wall Insulation'),
    };
  }, [job.job_measures]);

  // Check if HVAC replacement is recommended from hvac_data
  const replacementRecommended = hasReplacement || !!job.hvac_data?.replacement?.recommended;

  const [form, setForm] = useState({
    assessment_date: job.assessment_date || '',
    schedule_notes: job.schedule_notes || '',
    assessor_name: job.assessor_name || '',
    install_notes: job.install_notes || '',
    insulation_crew: job.insulation_crew || '',
    hvac_tune_clean_date: job.hvac_tune_clean_date || '',
    hvac_replacement_date: job.hvac_replacement_date || '',
    abc_install_date: job.abc_install_date || '',
    wall_injection_date: job.wall_injection_date || '',
    patch_date: job.patch_date || '',
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
      {/* 1. ASSESSMENT SCHEDULING */}
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

      {/* 2. HVAC TUNE & CLEAN (if applicable) */}
      {showInstall && hasHvacTuneClean && (
        <div className="jd-card">
          <div className="jd-card-title">HVAC Tune & Clean</div>
          <div className="jd-field-grid">
            <div className="jd-field">
              <label className="jd-field-label">Tune & Clean Date</label>
              <input type="date" className="jd-date-input"
                value={form.hvac_tune_clean_date} disabled={!canEdit}
                onChange={e => set('hvac_tune_clean_date', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* 3. HVAC REPLACEMENT INSTALL (if replacement recommended) */}
      {showInstall && replacementRecommended && (
        <div className="jd-card">
          <div className="jd-card-title">HVAC Replacement Install</div>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
            Final date of replacement install
          </p>
          <div className="jd-field-grid">
            <div className="jd-field">
              <label className="jd-field-label">Replacement Install Date</label>
              <input type="date" className="jd-date-input"
                value={form.hvac_replacement_date} disabled={!canEdit}
                onChange={e => set('hvac_replacement_date', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* 4. ABC INSTALL */}
      {showInstall ? (
        <div className="jd-card">
          <div className="jd-card-title">ABC Install</div>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
            Air Sealing / Basement / Crawlspace
          </p>
          <div className="jd-field-grid">
            <div className="jd-field">
              <label className="jd-field-label">ABC Install Date</label>
              <input type="date" className="jd-date-input"
                value={form.abc_install_date} disabled={!canEdit}
                onChange={e => set('abc_install_date', e.target.value)} />
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
        </div>
      ) : (
        <div className="jd-card">
          <div className="jd-card-title">Install Scheduling</div>
          <p style={{ fontSize: 12, color: '#64748b' }}>
            Install scheduling opens after scope is approved.
          </p>
        </div>
      )}

      {/* 5. WALL INJECTION INSTALL (if applicable) */}
      {showInstall && hasWallInjection && (
        <div className="jd-card">
          <div className="jd-card-title">Wall Injection Install</div>
          <div className="jd-field-grid">
            <div className="jd-field">
              <label className="jd-field-label">Wall Injection Date</label>
              <input type="date" className="jd-date-input"
                value={form.wall_injection_date} disabled={!canEdit}
                onChange={e => set('wall_injection_date', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* 6. PATCH DATE (if applicable - only if walls are done) */}
      {showInstall && hasWallInjection && form.wall_injection_date && (
        <div className="jd-card">
          <div className="jd-card-title">Patch</div>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
            Patch after wall injection
          </p>
          <div className="jd-field-grid">
            <div className="jd-field">
              <label className="jd-field-label">Patch Date</label>
              <input type="date" className="jd-date-input"
                value={form.patch_date} disabled={!canEdit}
                onChange={e => set('patch_date', e.target.value)} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
