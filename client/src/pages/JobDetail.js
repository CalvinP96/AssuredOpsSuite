import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJob } from '../hooks/useJob';
import { JOB_PHASES, getPhaseForStatus } from '../constants';
import { StatusBadge } from '../components/ui';
import * as api from '../api';
import JobInfo from './job/JobInfo';
import JobSchedule from './job/JobSchedule';
import JobAssess from './job/JobAssess';
import JobScope from './job/JobScope';
import JobHVAC from './job/JobHVAC';
import JobInstall from './job/JobInstall';
import JobInspection from './job/JobInspection';
import JobExport from './job/JobExport';
import JobLog from './job/JobLog';

const TABS = [
  { key: 'info', label: 'Info' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'assess', label: 'Assess' },
  { key: 'scope', label: 'Scope' },
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

function getPhaseStates(job) {
  const currentPhase = getPhaseForStatus(job.status);
  const currentIdx = JOB_PHASES.indexOf(currentPhase);
  return JOB_PHASES.map((phase, i) => ({
    ...phase,
    state: i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'future',
  }));
}

function parseAssessment(job) {
  try {
    const raw = job.assessment_data;
    return typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
  } catch { return {}; }
}

function ReviewTab({ job, isAdmin, onUpdate }) {
  const [submitting, setSubmitting] = useState(false);
  const assess = parseAssessment(job);
  const hasHS = Array.isArray(assess.health_safety) && assess.health_safety.length > 0;
  const photoCount = Object.keys(assess.photos || {}).length;
  const scopeComplete = (job.scope_data?.measures?.length || 0) > 0;
  const authOk = !!job.authorization_signed_at;
  const hsOk = !hasHS || !!job.hs_consent_signed_at;
  const ready = authOk && hsOk && scopeComplete;

  const handleSubmit = async () => {
    setSubmitting(true);
    try { await onUpdate({ status: 'in_review' }); } finally { setSubmitting(false); }
  };

  const Row = ({ label, ok, text }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
      borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0,
        background: ok ? '#dcfce7' : '#fee2e2', color: ok ? '#166534' : '#991b1b' }}>
        {ok ? '\u2713' : '\u2717'}
      </span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 12, color: ok ? 'var(--color-success)' : 'var(--color-text-muted)' }}>{text}</span>
    </div>
  );

  return (
    <div className="jd-card">
      <div className="jd-card-title">Submission Readiness</div>
      <Row label="Customer Authorization" ok={authOk} text={authOk ? 'Signed' : 'Not signed'} />
      <Row label="H&S Consent" ok={hsOk}
        text={!hasHS ? 'N/A' : job.hs_consent_signed_at ? 'Signed' : 'Not signed'} />
      <Row label="Pre-Photos" ok={photoCount >= REQUIRED_PHOTOS}
        text={`${photoCount} / ${REQUIRED_PHOTOS} uploaded`} />
      <Row label="Scope Complete" ok={scopeComplete} text={scopeComplete ? 'Yes' : 'No'} />

      <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 'var(--radius)',
        background: ready ? '#dcfce7' : '#fee2e2', border: `1px solid ${ready ? '#86efac' : '#fca5a5'}`,
        color: ready ? '#166534' : '#991b1b', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
        {ready ? 'Ready to Submit' : 'Not Ready \u2014 complete required items above'}
      </div>

      {isAdmin && (
        <button className="btn btn-primary" disabled={!ready || submitting}
          onClick={handleSubmit}
          style={{ width: '100%', marginTop: 12, padding: '12px 24px', fontSize: 15, fontWeight: 700,
            opacity: !ready || submitting ? 0.6 : 1 }}>
          {submitting ? 'Submitting\u2026' : 'Submit to RISE'}
        </button>
      )}
    </div>
  );
}

export default function JobDetail({ role, user }) {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { job, loading, error, reload, update } = useJob(jobId);
  const [tab, setTab] = useState('info');
  const [toast, setToast] = useState(null);

  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || user?.role === 'operations';

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
      case 'scope': return <JobScope {...tabProps} />;
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
            onClick={() => { if (phase.state !== 'future') setTab(PHASE_TAB_MAP[phase.key] || 'info'); }}>
            <span className="jd-phase-icon">{phase.icon}</span>
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
