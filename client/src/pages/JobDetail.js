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

const JOB_STATUSES = ['assessment_scheduled', 'assessment_complete', 'pre_approval', 'approved', 'install_scheduled', 'install_in_progress', 'inspection', 'submitted', 'invoiced', 'complete', 'deferred'];
const UTILITIES = ['ComEd', 'Nicor Gas', 'Peoples Gas', 'North Shore Gas'];

const PHASE_STEPS = [
  { key: 'inquiry', label: 'Inquiry', statuses: [] },
  { key: 'assessment', label: 'Assessment', statuses: ['assessment_scheduled'] },
  { key: 'scope', label: 'Scope', statuses: ['assessment_complete', 'pre_approval'] },
  { key: 'install', label: 'Install', statuses: ['approved', 'install_scheduled', 'install_in_progress'] },
  { key: 'inspection', label: 'Inspection', statuses: ['inspection'] },
  { key: 'billing', label: 'Billing', statuses: ['submitted', 'invoiced'] },
  { key: 'complete', label: 'Complete', statuses: ['complete'] },
];

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

export default function JobDetail({ role }) {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [program, setProgram] = useState(null);
  const [tab, setTab] = useState('overview');

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

  const utilities = (job.utility || '').split(',').map(u => u.trim()).filter(Boolean);

  // Phase stepper state
  const currentPhaseIdx = PHASE_STEPS.findIndex(p => p.statuses.includes(job.status));
  const isDone = job.status === 'complete';
  const isDeferred = job.status === 'deferred';
  const currentPhaseKey = isDeferred ? 'deferred' : isDone ? 'complete' : currentPhaseIdx >= 0 ? PHASE_STEPS[currentPhaseIdx].key : 'inquiry';
  const phaseColor = PHASE_COLORS[currentPhaseKey] || PHASE_COLORS.inquiry;

  // Tab config by role
  const getVisibleTabs = () => {
    if (role === 'Assessor') return [
      { key: 'overview', label: 'Overview' },
      { key: 'assessment', label: 'MS Forms Survey' },
      { key: 'photos', label: 'Photos' },
    ];
    if (role === 'Scope Creator') return [
      { key: 'overview', label: 'Overview' },
      { key: 'assessment', label: 'Assessor Data' },
      { key: 'scope', label: 'Scope of Work' },
      { key: 'photos', label: 'Photos' },
    ];
    if (role === 'Installer') return [
      { key: 'overview', label: 'Overview' },
      { key: 'scope', label: 'Scope of Work' },
      { key: 'install', label: 'Installation' },
      { key: 'photos', label: 'Photos' },
    ];
    if (role === 'HVAC') return [
      { key: 'overview', label: 'Overview' },
      { key: 'hvac', label: 'HVAC' },
      { key: 'photos', label: 'Photos' },
    ];
    return [
      { key: 'overview', label: 'Overview' },
      { key: 'assessment', label: 'Assessment' },
      { key: 'scope', label: 'Scope of Work' },
      { key: 'install', label: 'Installation' },
      { key: 'hvac', label: 'HVAC' },
      { key: 'inspection', label: 'Inspection' },
      { key: 'photos', label: 'Photos' },
      { key: 'forms', label: 'Forms & Docs' },
      { key: 'export', label: 'Export' },
    ];
  };

  const visibleTabs = getVisibleTabs();
  const tabProps = { job, program, canEdit, onUpdate: updateField, role };

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

      {/* Phase Timeline — Desktop Stepper */}
      <div className="jd-stepper">
        {PHASE_STEPS.map((step, i) => {
          const isActive = i === currentPhaseIdx;
          const isPast = isDone || (currentPhaseIdx >= 0 && i < currentPhaseIdx);
          const state = isPast ? 'done' : isActive ? 'active' : 'future';
          return (
            <React.Fragment key={step.key}>
              {i > 0 && <div className={`jd-step-line ${isPast ? 'done' : 'future'}`} />}
              <div className="jd-step">
                <div className={`jd-step-circle ${state}`}>
                  {isPast ? '\u2713' : i + 1}
                </div>
                <div className={`jd-step-label ${state}`}>{step.label}</div>
              </div>
            </React.Fragment>
          );
        })}
        {isDeferred && <div className="jd-deferred-badge">DEFERRED</div>}
      </div>

      {/* Phase Timeline — Mobile Compact */}
      <div className="jd-stepper-mobile">
        {isDeferred ? 'DEFERRED' : isDone ? 'Complete' : currentPhaseIdx >= 0
          ? `Step ${currentPhaseIdx + 1} of ${PHASE_STEPS.length}: ${PHASE_STEPS[currentPhaseIdx].label}`
          : 'Step 1 of 7: Inquiry'}
      </div>

      {/* Tab Bar */}
      <div className="jd-tabs">
        {visibleTabs.map(t => (
          <button key={t.key} className={`jd-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB (inline — small) ===== */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="jd-card">
            <div className="jd-card-title">Customer Information</div>
            <div className="jd-field-grid">
              <div className="jd-field">
                <label className="jd-field-label">Customer Name</label>
                <input defaultValue={job.customer_name} disabled={!canEdit} onBlur={e => updateField('customer_name', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Phone</label>
                <input defaultValue={job.phone} disabled={!canEdit} onBlur={e => updateField('phone', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Email</label>
                <input defaultValue={job.email} disabled={!canEdit} onBlur={e => updateField('email', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Address</label>
                <input defaultValue={job.address} disabled={!canEdit} onBlur={e => updateField('address', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">City</label>
                <input defaultValue={job.city} disabled={!canEdit} onBlur={e => updateField('city', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Zip</label>
                <input defaultValue={job.zip} disabled={!canEdit} onBlur={e => updateField('zip', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Job Number</label>
                <input defaultValue={job.job_number} disabled={!canEdit} onBlur={e => updateField('job_number', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Contractor</label>
                <input value="Assured Energy Solutions" disabled />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="jd-field-label" style={{ marginBottom: 6, display: 'block' }}>Utility Company</label>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {UTILITIES.map(u => (
                    <label key={u} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: canEdit ? 'pointer' : 'default' }}>
                      <input type="checkbox" checked={utilities.includes(u)} disabled={!canEdit}
                        onChange={e => {
                          const newUtils = e.target.checked ? [...utilities, u] : utilities.filter(x => x !== u);
                          updateField('utility', newUtils.join(', '));
                        }} />
                      {u}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="jd-card">
            <div className="jd-card-title">Project Status</div>
            <div className="jd-field-grid">
              <div className="jd-field">
                <label className="jd-field-label">Status</label>
                <select value={job.status} disabled={!canEdit} onChange={e => updateField('status', e.target.value)}>
                  {JOB_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Estimate Amount</label>
                <input type="number" defaultValue={job.estimate_amount} disabled={!canEdit}
                  onBlur={e => updateField('estimate_amount', parseFloat(e.target.value) || null)} placeholder="$0.00" />
              </div>
              <div className="jd-field" style={{ gridColumn: '1 / -1' }}>
                <label className="jd-field-label">Notes</label>
                <textarea defaultValue={job.notes} disabled={!canEdit} onBlur={e => updateField('notes', e.target.value)} />
              </div>
            </div>
            <div className="jd-summary-pills">
              <span className="jd-summary-pill" style={{ background: '#dbeafe', color: '#1e40af' }}>{(job.photos || []).length} Photos</span>
              <span className="jd-summary-pill" style={{ background: '#dcfce7', color: '#166534' }}>{(job.measures || []).length} Measures</span>
              <span className="jd-summary-pill" style={{ background: '#fef3c7', color: '#92400e' }}>{(job.change_orders || []).filter(c => c.status === 'pending').length} Pending COs</span>
            </div>
          </div>
          <div className="jd-card">
            <div className="jd-card-title">Scheduling</div>
            <div className="jd-schedule-grid">
              {[
                { label: 'Assessment Date', field: 'assessment_date' },
                { label: 'Assessment Scheduled', field: 'assessment_scheduled' },
                { label: 'Install Date', field: 'install_date' },
                { label: 'Install Scheduled', field: 'install_scheduled' },
              ].map(d => (
                <div key={d.field} className="jd-field">
                  <label className="jd-field-label">{d.label}</label>
                  <input type="date" className="jd-date-input" value={job[d.field] || ''} disabled={!canEdit}
                    onChange={e => updateField(d.field, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
          <div className="jd-card">
            <div className="jd-card-title">Permit Tracking</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: canEdit ? 'pointer' : 'default' }}>
              <input type="checkbox" checked={!!job.needs_permit} disabled={!canEdit}
                onChange={e => updateField('needs_permit', e.target.checked ? 1 : 0)}
                style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
              <strong>Needs Permit</strong>
            </label>
            {job.needs_permit ? (
              <div className="jd-permit-fields">
                <div className="jd-field">
                  <label className="jd-field-label">Permit Status</label>
                  <select value={job.permit_status || 'not_applied'} disabled={!canEdit} onChange={e => updateField('permit_status', e.target.value)}>
                    <option value="not_applied">Not Applied</option>
                    <option value="applied">Applied</option>
                    <option value="received">Received</option>
                    <option value="issue">Issue</option>
                  </select>
                </div>
                <div className="jd-field">
                  <label className="jd-field-label">Date Applied</label>
                  <input type="date" className="jd-date-input" value={job.permit_applied_date || ''} disabled={!canEdit}
                    onChange={e => updateField('permit_applied_date', e.target.value)} />
                </div>
                <div className="jd-field">
                  <label className="jd-field-label">Date Received</label>
                  <input type="date" className="jd-date-input" value={job.permit_received_date || ''} disabled={!canEdit}
                    onChange={e => updateField('permit_received_date', e.target.value)} />
                </div>
                <div className="jd-field">
                  <label className="jd-field-label">Permit Number</label>
                  <input defaultValue={job.permit_number} disabled={!canEdit}
                    onBlur={e => updateField('permit_number', e.target.value)} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ===== TAB COMPONENTS ===== */}
      {tab === 'assessment' && <AssessmentTab job={job} onSave={saveAssessment} />}
      {tab === 'scope' && <ScopeOfWorkTab {...tabProps} />}
      {tab === 'install' && <InstallationTab {...tabProps} />}
      {tab === 'hvac' && <HVACTab {...tabProps} />}
      {tab === 'inspection' && <InspectionTab {...tabProps} />}
      {tab === 'photos' && <PhotosTab {...tabProps} />}
      {tab === 'forms' && <FormsDocsTab {...tabProps} />}
      {tab === 'export' && <ExportTab {...tabProps} />}
    </div>
  );
}
