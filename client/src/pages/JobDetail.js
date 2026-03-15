import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api';
import AssessmentTab from './AssessmentTab';
import ScopeOfWorkTab from './ScopeOfWorkTab';
import InstallationTab from './InstallationTab';
import HVACTab from './HVACTab';
import InspectionTab from './InspectionTab';
import PhotosTab from './PhotosTab';
import FormsDocsTab from './FormsDocsTab';
import ExportTab from './ExportTab';
import LogTab from './LogTab';

const PHASES = [
  { key: 'intake', icon: '📥', label: 'Intake', tab: 'overview' },
  { key: 'schedule', icon: '📅', label: 'Schedule', tab: 'schedule' },
  { key: 'assess', icon: '🔍', label: 'Assess', tab: 'assessment' },
  { key: 'scope', icon: '📋', label: 'Scope', tab: 'scope' },
  { key: 'approve', icon: '✅', label: 'Approve', tab: 'overview' },
  { key: 'install', icon: '🏗️', label: 'Install', tab: 'install' },
  { key: 'postqc', icon: '🔎', label: 'Post-QC', tab: 'inspection' },
  { key: 'closeout', icon: '📦', label: 'Closeout', tab: 'export' },
];

function getPhaseStatus(job) {
  const d = job?.assessment_data || {};
  const s = job?.scope_data || {};
  return {
    intake: true,
    schedule: !!job?.assessment_scheduled_date,
    assess: !!(d.assessor_name && d.weatherization_recommendations?.length > 0 && job?.authorization_signed_at),
    scope: !!(s.measures?.length > 0 || s.selectedMeasures?.length > 0),
    approve: ['approved','install_scheduled','install_in_progress','inspection','submitted','invoiced','complete'].includes(job?.status),
    install: ['install_in_progress','inspection','submitted','invoiced','complete'].includes(job?.status),
    postqc: ['inspection','submitted','invoiced','complete'].includes(job?.status),
    closeout: ['submitted','invoiced','complete'].includes(job?.status)
  };
}

const PHASE_COLORS = {
  inquiry: { bg: '#e2e8f0', text: '#475569' },
  assessment: { bg: '#dbeafe', text: '#1e40af' },
  scope: { bg: '#fef3c7', text: '#92400e' },
  install: { bg: '#e0e7ff', text: '#3730a3' },
  inspection: { bg: '#d1fae5', text: '#065f46' },
  billing: { bg: '#fce7f3', text: '#9d174d' },
  complete: { bg: '#dcfce7', text: '#166534' },
  deferred: { bg: '#fee2e2', text: '#991b1b' },
};

export default function JobDetail({ role, user }) {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [program, setProgram] = useState(null);
  const [tab, setTab] = useState('overview');
  const [confirmDel, setConfirmDel] = useState(false);

  const canEdit = ['Admin', 'Operations', 'Program Manager', 'Assessor', 'Installer', 'HVAC'].includes(role);

  const load = useCallback(() => {
    api.getJobDetail(jobId).then(setJob).catch(() => {});
  }, [jobId]);

  const loadProgram = useCallback(() => {
    api.getHesIeProgram().then(p => {
      if (p && p.id) api.getProgram(p.id).then(setProgram);
    });
  }, []);

  useEffect(() => { load(); loadProgram(); }, [load, loadProgram]);

  const updateField = async (field, value) => {
    if (field === '_reload') { load(); return; }
    try {
      const updated = { ...job, [field]: value };
      setJob(updated);
      await api.updateJob(jobId, updated);
      load();
    } catch (err) { alert('Failed to update: ' + err.message); }
  };

  const saveAssessment = async (data) => {
    try { await api.saveAssessmentData(jobId, data); } catch (err) { alert('Failed to save assessment: ' + err.message); }
  };

  if (!job) return <div className="card" style={{ padding: 30 }}>Loading project...</div>;

  // Phase bar status
  const phaseStatus = getPhaseStatus(job);
  const isDeferred = job.status === 'deferred';
  const statusPhaseMap = { assessment_scheduled: 'assessment', assessment_complete: 'scope', pre_approval: 'scope', approved: 'install', install_scheduled: 'install', install_in_progress: 'install', inspection: 'inspection', submitted: 'billing', invoiced: 'billing', complete: 'complete', deferred: 'deferred' };
  const phaseColor = PHASE_COLORS[statusPhaseMap[job.status] || 'inquiry'];

  // Tab config by role
  const getVisibleTabs = () => {
    if (role === 'Assessor') return [
      { key: 'overview', label: 'Overview' },
      { key: 'schedule', label: 'Schedule' },
      { key: 'assessment', label: 'MS Forms Survey' },
      { key: 'photos', label: 'Photos' },
    ];
    if (role === 'Scope Creator') return [
      { key: 'overview', label: 'Overview' },
      { key: 'schedule', label: 'Schedule' },
      { key: 'assessment', label: 'Assessor Data' },
      { key: 'scope', label: 'Scope of Work' },
      { key: 'photos', label: 'Photos' },
    ];
    if (role === 'Installer') return [
      { key: 'overview', label: 'Overview' },
      { key: 'schedule', label: 'Schedule' },
      { key: 'scope', label: 'Scope of Work' },
      { key: 'install', label: 'Installation' },
      { key: 'photos', label: 'Photos' },
    ];
    if (role === 'HVAC') return [
      { key: 'overview', label: 'Overview' },
      { key: 'schedule', label: 'Schedule' },
      { key: 'hvac', label: 'HVAC' },
      { key: 'photos', label: 'Photos' },
    ];
    return [
      { key: 'overview', label: 'Overview' },
      { key: 'schedule', label: 'Schedule' },
      { key: 'assessment', label: 'Assessment' },
      { key: 'scope', label: 'Scope of Work' },
      { key: 'install', label: 'Installation' },
      { key: 'hvac', label: 'HVAC' },
      { key: 'inspection', label: 'Inspection' },
      { key: 'photos', label: 'Photos' },
      { key: 'forms', label: 'Forms & Docs' },
      { key: 'export', label: 'Export' },
      { key: 'log', label: 'Log' },
    ];
  };

  const visibleTabs = getVisibleTabs();
  const tabProps = { job, program, canEdit, onUpdate: updateField, role, user };

  return (
    <div className="jd-page">
      {/* Back button */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/hes-ie')} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }}>
          &#8592; Back to Jobs
        </button>
      </div>

      {/* Header Card */}
      <div className="jd-header">
        <div className="jd-header-left">
          <h2 className="jd-header-name">{job.customer_name || 'Unnamed Project'}</h2>
          <div className="jd-header-meta">
            {job.job_number && <span>#{job.job_number}</span>}
            <span>{job.address}, {job.city} {job.zip}</span>
            <span>Assured Energy Solutions</span>
          </div>
        </div>
        <div className="jd-header-right">
          <span className="jd-status-pill" style={{ background: phaseColor.bg, color: phaseColor.text }}>
            {isDeferred ? 'DEFERRED' : job.status.replace(/_/g, ' ')}
          </span>
          {canEdit && <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={load}>Save</button>}
        </div>
      </div>

      {/* Phase Bar */}
      <div className="jd-phase-bar">
        {PHASES.map((phase, i) => {
          const done = phaseStatus[phase.key];
          const firstFalseIdx = PHASES.findIndex(p => !phaseStatus[p.key]);
          const isCurrent = i === firstFalseIdx;
          const state = done ? 'done' : isCurrent ? 'current' : 'future';
          return (
            <button
              key={phase.key}
              className={`jd-phase-pill ${state}`}
              onClick={() => { if (state !== 'future') setTab(phase.tab); }}
            >
              <span className="jd-phase-icon">{phase.icon}</span>
              <span className="jd-phase-label">{phase.label}</span>
            </button>
          );
        })}
        {isDeferred && <span className="jd-deferred-badge">DEFERRED</span>}
      </div>

      {/* Tab Bar */}
      <div className="jd-tabs">
        {visibleTabs.map(t => (
          <button key={t.key} className={`jd-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB (ported from InfoTab) ===== */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="jd-card">
            <div className="jd-card-title">Customer</div>
            <div className="jd-field-grid">
              <div className="jd-field">
                <label className="jd-field-label">Name</label>
                <input defaultValue={job.customer_name} disabled={!canEdit} onBlur={e => updateField('customer_name', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Address</label>
                <input defaultValue={job.address} disabled={!canEdit} onBlur={e => updateField('address', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Phone</label>
                <input defaultValue={job.phone} disabled={!canEdit} onBlur={e => updateField('phone', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Email</label>
                <input defaultValue={job.email} disabled={!canEdit} onBlur={e => updateField('email', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="jd-card">
            <div className="jd-card-title">System IDs</div>
            <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>Lookup customer in ST, enter IDs here</p>
            <div className="jd-field-grid">
              <div className="jd-field">
                <label className="jd-field-label">RISE PID</label>
                <input defaultValue={job.rise_id} disabled={!canEdit} onBlur={e => updateField('rise_id', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">ServiceTitan ID</label>
                <input defaultValue={job.st_id} disabled={!canEdit} onBlur={e => updateField('st_id', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Utility</label>
                <input defaultValue={job.utility} disabled={!canEdit} onBlur={e => updateField('utility', e.target.value)} placeholder="Nicor, ComEd…" />
              </div>
            </div>
          </div>
          <div className="jd-card">
            <div className="jd-card-title">Flags & Notes</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: canEdit ? 'pointer' : 'default' }}>
              <input type="checkbox" checked={!!job.flagged} disabled={!canEdit}
                onChange={e => updateField('flagged', e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
              <span>⚠️ Flag this project</span>
            </label>
            {job.flagged && (
              <div className="jd-field" style={{ marginTop: 6 }}>
                <label className="jd-field-label">Reason</label>
                <input defaultValue={job.flag_reason} disabled={!canEdit} onBlur={e => updateField('flag_reason', e.target.value)} />
              </div>
            )}
            <div className="jd-field" style={{ marginTop: 8 }}>
              <label className="jd-field-label">Notes</label>
              <textarea defaultValue={job.notes} disabled={!canEdit} onBlur={e => updateField('notes', e.target.value)} rows={3} />
            </div>
          </div>
          {role === 'Admin' && (
            <div className="jd-card" style={{ borderColor: '#fca5a5' }}>
              <div className="jd-card-title" style={{ color: '#dc2626' }}>Danger Zone</div>
              {!confirmDel ? (
                <button className="btn btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444' }} onClick={() => setConfirmDel(true)}>Delete Project</button>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="btn btn-danger" onClick={async () => { try { await api.deleteJob(jobId); navigate('/hes-ie'); } catch (err) { alert('Failed to delete: ' + err.message); } }}>Confirm Delete</button>
                  <button className="btn btn-secondary" onClick={() => setConfirmDel(false)}>Cancel</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== SCHEDULE TAB (ported from SchedTab) ===== */}
      {tab === 'schedule' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="jd-card">
            <div className="jd-card-title">Assessment</div>
            <div className="jd-field">
              <label className="jd-field-label">Assessment Date</label>
              <input type="date" className="jd-date-input" value={job.assessment_date || ''} disabled={!canEdit}
                onChange={e => updateField('assessment_date', e.target.value)} />
            </div>
            <div className="jd-field" style={{ marginTop: 6 }}>
              <textarea style={{ width: '100%', minHeight: 60, resize: 'vertical', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 14, background: 'var(--color-surface)', color: 'var(--color-text)' }}
                value={job.schedule_notes || ''} disabled={!canEdit}
                onChange={e => updateField('schedule_notes', e.target.value)} rows={2}
                placeholder="Customer availability, access notes…" />
            </div>
          </div>
          {['approved', 'install_scheduled', 'install_in_progress', 'inspection', 'submitted', 'invoiced', 'complete'].includes(job.status) ? (
            <div className="jd-card">
              <div className="jd-card-title">Install Scheduling</div>
              <div className="jd-field-grid">
                <div className="jd-field">
                  <label className="jd-field-label">Install Date</label>
                  <input type="date" className="jd-date-input" value={job.install_date || ''} disabled={!canEdit}
                    onChange={e => updateField('install_date', e.target.value)} />
                </div>
                <div className="jd-field">
                  <label className="jd-field-label">Tune/Clean</label>
                  <input type="date" className="jd-date-input" value={job.tune_clean_date || ''} disabled={!canEdit}
                    onChange={e => updateField('tune_clean_date', e.target.value)} />
                </div>
                <div className="jd-field">
                  <label className="jd-field-label">Final Insp.</label>
                  <input type="date" className="jd-date-input" value={job.final_insp_date || ''} disabled={!canEdit}
                    onChange={e => updateField('final_insp_date', e.target.value)} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: canEdit ? 'pointer' : 'default' }}>
                  <input type="checkbox" checked={!!job.install_confirmed} disabled={!canEdit}
                    onChange={e => updateField('install_confirmed', e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
                  <span>Install Confirmed in ST</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="jd-card">
              <div className="jd-card-title">Install Scheduling</div>
              <p style={{ fontSize: 12, color: '#64748b' }}>Install scheduling opens after scope is approved.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB COMPONENTS ===== */}
      {tab === 'assessment' && <AssessmentTab job={job} onSave={saveAssessment} user={user} />}
      {tab === 'scope' && <ScopeOfWorkTab {...tabProps} />}
      {tab === 'install' && <InstallationTab {...tabProps} />}
      {tab === 'hvac' && <HVACTab {...tabProps} />}
      {tab === 'inspection' && <InspectionTab {...tabProps} />}
      {tab === 'photos' && <PhotosTab {...tabProps} />}
      {tab === 'forms' && <FormsDocsTab {...tabProps} />}
      {tab === 'export' && <ExportTab {...tabProps} />}
      {tab === 'log' && <LogTab job={job} user={user} />}
    </div>
  );
}
