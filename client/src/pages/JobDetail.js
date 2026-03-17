import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useJob } from '../hooks/useJob';
import { JOB_PHASES } from '../constants';
import { StatusBadge } from '../components/ui';
import * as api from '../api';
import JobInfo from './job/JobInfo';
import JobSchedule from './job/JobSchedule';
import JobAssess from './job/JobAssess';
import JobPhotos from './job/JobPhotos';
import JobScope from './job/JobScope';
import JobHVAC from './job/JobHVAC';
import JobInstall from './job/JobInstall';
import JobInspection from './job/JobInspection';
import JobExport from './job/JobExport';
import JobLog from './job/JobLog';
import FormsDocsTab from './FormsDocsTab';

const TABS = [
  { key: 'info', label: 'Info' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'assess', label: 'Assess' },
  { key: 'photos', label: 'Photos' },
  { key: 'scope', label: 'Scope' },
  { key: 'forms', label: 'Forms' },
  { key: 'review', label: 'Review' },
  { key: 'hvac', label: 'HVAC' },
  { key: 'install', label: 'Install' },
  { key: 'inspection', label: 'Inspection' },
  { key: 'export', label: 'Export' },
  { key: 'log', label: 'Log' },
];

const PHASE_TAB_MAP = {
  intake: 'info', schedule: 'schedule', assess: 'assess', scope: 'scope',
  in_review: 'review', pre_approved: 'info', install: 'install',
  post_qc: 'inspection', closeout: 'export', complete: 'info',
};

const REQUIRED_PHOTOS = 6;

function parseJSON(raw) {
  try { return typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {}); } catch { return {}; }
}

function parseAssessment(job) {
  return parseJSON(job.assessment_data);
}

/**
 * Each phase independently checks its own data to determine done/not-done.
 * Phases happen in parallel — no sequential gating except Closeout (needs all others).
 * Pre-Approved is external (program approval).
 */
function getPhaseStates(job) {
  const assess = parseJSON(job.assessment_data);
  const scope = parseJSON(job.scope_data);
  const install = parseJSON(job.install_data);
  const inspection = parseJSON(job.inspection_data);

  const intakeDone = !!(job.customer_name && job.address && job.city && job.zip);
  const scheduleDone = !!(job.assessment_date && job.assessor_name);
  const assessDone = !!(job.authorization_signed_at && assess.tenant_type);
  const scopeDone = (scope.measures?.length || 0) > 0;
  const reviewDone = !!(scopeDone && assessDone && job.authorization_signed_at);
  const preApprovedDone = ['approved', 'install_scheduled', 'install_in_progress', 'inspection', 'submitted', 'invoiced', 'complete'].includes(job.status);
  const installDone = !!(install.install_date && install.crew_lead && install.post_blower_door && install.post_sow_signed);
  const inspectionDone = !!(inspection.date && inspection.inspector && inspection.inspector_sig);
  const closeoutDone = ['submitted', 'invoiced', 'complete'].includes(job.status);
  const completeDone = job.status === 'complete';

  const checks = {
    intake: intakeDone,
    schedule: scheduleDone,
    assess: assessDone,
    scope: scopeDone,
    in_review: reviewDone,
    pre_approved: preApprovedDone,
    install: installDone,
    post_qc: inspectionDone,
    closeout: closeoutDone,
    complete: completeDone,
  };

  return JOB_PHASES.map(phase => ({
    ...phase,
    state: checks[phase.key] ? 'done' : 'active',
  }));
}

function ReviewTab({ job, isAdmin, onUpdate }) {
  const [submitting, setSubmitting] = useState(false);
  const checks = job.review_checklist || {};
  const hasHS = !!(job.assessment_data && (() => {
    try { const d = typeof job.assessment_data === 'string' ? JSON.parse(job.assessment_data) : job.assessment_data;
      return (d.health_safety_conditions || []).length > 0; } catch { return false; }
  })());

  const ITEMS = [
    { key: 'auth_signed', label: 'Customer Authorization signed' },
    ...(hasHS ? [{ key: 'hs_signed', label: 'H&S Consent & Release signed' }] : []),
    { key: 'pre_photos', label: 'All required pre-photos uploaded' },
    { key: 'scope_complete', label: 'Scope of Work complete and reviewed' },
    { key: 'ms_form', label: 'MS Form / assessment data complete' },
    { key: 'rise_id', label: 'RISE PID entered' },
  ];

  const toggle = async (key) => {
    if (!isAdmin) return;
    const updated = { ...checks, [key]: !checks[key] };
    await onUpdate({ review_checklist: updated });
  };

  const allChecked = ITEMS.every(i => checks[i.key]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try { await onUpdate({ status: 'in_review' }); } finally { setSubmitting(false); }
  };

  return (
    <div className="jd-card">
      <div className="jd-card-title">Submission Readiness</div>
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 12px' }}>
        Check each item once confirmed. All must be checked before submitting to RISE.
      </p>
      {ITEMS.map(item => (
        <div key={item.key}
          onClick={() => toggle(item.key)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
            borderBottom: '1px solid var(--color-border)', cursor: isAdmin ? 'pointer' : 'default',
            userSelect: 'none' }}>
          <span style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', flexShrink: 0,
            alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700,
            background: checks[item.key] ? '#dcfce7' : 'var(--color-surface-alt)',
            border: `2px solid ${checks[item.key] ? '#16a34a' : 'var(--color-border)'}`,
            color: checks[item.key] ? '#16a34a' : 'var(--color-text-muted)',
            transition: 'all 0.15s' }}>
            {checks[item.key] ? '✓' : ''}
          </span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500,
            color: checks[item.key] ? 'var(--color-text)' : 'var(--color-text-muted)',
            textDecoration: checks[item.key] ? 'none' : 'none' }}>
            {item.label}
          </span>
          {checks[item.key] && (
            <span style={{ fontSize: 11, color: 'var(--color-success)', fontWeight: 600 }}>✓ Confirmed</span>
          )}
        </div>
      ))}

      <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 'var(--radius)',
        background: allChecked ? '#dcfce7' : '#f8fafc',
        border: `1px solid ${allChecked ? '#86efac' : 'var(--color-border)'}`,
        color: allChecked ? '#166534' : 'var(--color-text-muted)',
        fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
        {allChecked ? '✅ All items confirmed — ready to submit' : `${ITEMS.filter(i => checks[i.key]).length} / ${ITEMS.length} confirmed`}
      </div>

      {isAdmin && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Submit to RISE — moves to In Review */}
          {job.status !== 'in_review' && job.status !== 'approved' && (
            <button className="btn btn-primary" disabled={!ready || submitting}
              onClick={handleSubmit}
              style={{ width: '100%', padding: '12px 24px', fontSize: 15, fontWeight: 700,
                opacity: !ready || submitting ? 0.6 : 1 }}>
              {submitting ? 'Submitting…' : '📤 Submit to RISE'}
            </button>
          )}

          {/* In Review status banner */}
          {job.status === 'in_review' && (
            <div style={{ padding: '12px 16px', background: '#fef3c7', border: '1px solid #fcd34d',
              borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, color: '#92400e', textAlign: 'center' }}>
              🔄 In Review — waiting on RI approval
            </div>
          )}

          {/* Pre-Approved — set when RI approves */}
          {(job.status === 'in_review' || job.status === 'pre_approval') && (
            <button className="btn btn-primary"
              style={{ width: '100%', padding: '12px 24px', fontSize: 15, fontWeight: 700,
                background: 'var(--color-success)', border: 'none' }}
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                try { await onUpdate({ status: 'approved' }); } finally { setSubmitting(false); }
              }}>
              ✅ Mark Pre-Approved (RI Approved)
            </button>
          )}

          {/* Already Pre-Approved */}
          {job.status === 'approved' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, padding: '12px 16px', background: '#dcfce7', border: '1px solid #86efac',
                borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 700, color: '#166534', textAlign: 'center' }}>
                ✅ Pre-Approved — ready to schedule install
              </div>
              <button className="btn btn-secondary btn-sm"
                style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', whiteSpace: 'nowrap' }}
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try { await onUpdate({ status: 'in_review' }); } finally { setSubmitting(false); }
                }}>
                Revert to In Review
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JobDetail({ role, user }) {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { job, loading, error, reload, update } = useJob(jobId);
  const scrollKey = `job_scroll_${jobId}`;

  // Restore tab from URL hash or sessionStorage
  const getInitialTab = () => {
    const hash = location.hash.replace('#', '');
    if (hash && TABS.some(t => t.key === hash)) return hash;
    const saved = sessionStorage.getItem(`job_tab_${jobId}`);
    if (saved && TABS.some(t => t.key === saved)) return saved;
    return 'info';
  };
  const [tab, setTabRaw] = useState(getInitialTab);
  const [toast, setToast] = useState(null);

  // Persist tab to URL hash and sessionStorage
  const setTab = (t) => {
    setTabRaw(t);
    sessionStorage.setItem(`job_tab_${jobId}`, t);
    window.history.replaceState(null, '', `#${t}`);
  };

  // Restore scroll position on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(scrollKey);
    if (saved) {
      requestAnimationFrame(() => window.scrollTo(0, parseInt(saved, 10)));
    }
  }, [loading]); // eslint-disable-line

  // Save scroll position periodically
  useEffect(() => {
    const save = () => sessionStorage.setItem(scrollKey, String(window.scrollY));
    window.addEventListener('scroll', save, { passive: true });
    window.addEventListener('beforeunload', save);
    return () => { save(); window.removeEventListener('scroll', save); window.removeEventListener('beforeunload', save); };
  }, [scrollKey]);

  const isAdmin = role === 'Admin';
  const canEdit = isAdmin || ['Operations', 'Program Manager', 'Assessor', 'Scope Creator', 'Installer', 'HVAC'].includes(role);

  const handleUpdate = async (fields) => {
    try {
      await update(fields);
      setToast('Saved');
      setTimeout(() => setToast(null), 2000);
    } catch {
      setToast('Save failed');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteJob(jobId);
      navigate('/hes-ie');
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <div className="photo-slot-spinner" />
    </div>
  );

  if (error || !job) return (
    <div className="jd-page">
      <div className="jd-card" style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: 'var(--color-danger)', marginBottom: 12 }}>{error || 'Job not found'}</p>
        <button className="btn btn-primary" onClick={reload}>Retry</button>
      </div>
    </div>
  );

  const phases = getPhaseStates(job);
  const isDeferred = job.status === 'deferred';
  const tabProps = { job, canEdit, isAdmin, onUpdate: handleUpdate, user };

  const renderTab = () => {
    switch (tab) {
      case 'info': return <JobInfo {...tabProps} onDelete={handleDelete} />;
      case 'schedule': return <JobSchedule {...tabProps} />;
      case 'assess': return <JobAssess {...tabProps} />;
      case 'photos': return <JobPhotos {...tabProps} />;
      case 'scope': return <JobScope {...tabProps} />;
      case 'forms': return <FormsDocsTab {...tabProps} role={role} />;
      case 'review': return <ReviewTab job={job} isAdmin={isAdmin} onUpdate={handleUpdate} />;
      case 'hvac': return <JobHVAC {...tabProps} />;
      case 'install': return <JobInstall {...tabProps} />;
      case 'inspection': return <JobInspection {...tabProps} />;
      case 'export': return <JobExport {...tabProps} />;
      case 'log': return <JobLog {...tabProps} />;
      default: return null;
    }
  };

  return (
    <div className="jd-page">
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/hes-ie')} className="btn btn-secondary btn-sm">&#8592; Back to Jobs</button>
      </div>
      <div className="jd-header">
        <div className="jd-header-left">
          <h2 className="jd-header-name">{job.customer_name || 'Unnamed Project'}</h2>
          <div className="jd-header-meta">
            {job.job_number && <span>#{job.job_number}</span>}
            <span>{job.address}, {job.city} {job.zip}</span>
          </div>
        </div>
        <div className="jd-header-right">
          <StatusBadge status={job.status} />
          {toast && (
            <span style={{
              fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 12,
              background: toast === 'Saved' ? '#dcfce7' : '#fee2e2',
              color: toast === 'Saved' ? '#166534' : '#991b1b',
            }}>{toast}</span>
          )}
        </div>
      </div>
      <div className="jd-phase-bar">
        {phases.map(phase => (
          <button key={phase.key} className={`jd-phase-pill ${phase.state}`}
            onClick={() => setTab(PHASE_TAB_MAP[phase.key] || 'info')}>
            <span className="jd-phase-icon">{phase.state === 'done' ? '\u2713' : phase.icon}</span>
            <span className="jd-phase-label">{phase.label}</span>
          </button>
        ))}
        {isDeferred && <span className="jd-deferred-badge">DEFERRED</span>}
      </div>
      <div className="jd-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`jd-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {renderTab()}
    </div>
  );
}
