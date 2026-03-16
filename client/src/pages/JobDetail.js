import React, { useState, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJob } from '../hooks/useJob';
import { JOB_PHASES, getPhaseForStatus } from '../constants';
import { StatusBadge } from '../components/ui';
import * as api from '../api';

import JobInfo from './job/JobInfo';
import JobSchedule from './job/JobSchedule';
const AssessmentTab = lazy(() => import('./AssessmentTab'));
const ScopeOfWorkTab = lazy(() => import('./ScopeOfWorkTab'));
const InstallationTab = lazy(() => import('./InstallationTab'));
const HVACTab = lazy(() => import('./HVACTab'));
const InspectionTab = lazy(() => import('./InspectionTab'));
const JobExport = lazy(() => import('./job/JobExport'));
const JobLog = lazy(() => import('./job/JobLog'));

const TABS = [
  { key: 'info', label: 'Info' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'assessment', label: 'Assess' },
  { key: 'scope', label: 'Scope' },
  { key: 'review', label: 'Review' },
  { key: 'hvac', label: 'HVAC' },
  { key: 'install', label: 'Install' },
  { key: 'inspection', label: 'Inspection' },
  { key: 'export', label: 'Export' },
  { key: 'log', label: 'Log' },
];

const PHASE_TAB_MAP = {
  intake: 'info',
  schedule: 'schedule',
  assess: 'assessment',
  scope: 'scope',
  in_review: 'review',
  pre_approved: 'info',
  install: 'install',
  post_qc: 'inspection',
  closeout: 'export',
  complete: 'info',
};

function getPhaseStates(job) {
  const currentPhase = getPhaseForStatus(job.status);
  const currentIdx = JOB_PHASES.indexOf(currentPhase);
  return JOB_PHASES.map((phase, i) => ({
    ...phase,
    state: i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'future',
  }));
}

const ComingSoon = ({ label }) => (
  <div className="jd-card" style={{ textAlign: 'center', padding: 40 }}>
    <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{label} — Coming soon</p>
  </div>
);

const TabSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
    <div className="photo-slot-spinner" />
  </div>
);

export default function JobDetail({ role, user }) {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { job, loading, error, reload, update } = useJob(jobId);
  const [tab, setTab] = useState('info');
  const [toast, setToast] = useState(null);

  const isAdmin = role === 'Admin';
  const canEdit = isAdmin || ['Operations', 'Program Manager', 'Assessor', 'Installer', 'HVAC'].includes(role);

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

  if (error || !job) {
    return (
      <div className="jd-page">
        <div className="jd-card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--color-danger)', marginBottom: 12 }}>
            {error || 'Job not found'}
          </p>
          <button className="btn btn-primary" onClick={reload}>Retry</button>
        </div>
      </div>
    );
  }

  const phases = getPhaseStates(job);
  const isDeferred = job.status === 'deferred';

  const renderTab = () => {
    const tabProps = { job, canEdit, isAdmin, onUpdate: handleUpdate, role, user };

    switch (tab) {
      case 'info':
        return <JobInfo job={job} canEdit={canEdit} isAdmin={isAdmin} onUpdate={handleUpdate} onDelete={handleDelete} />;
      case 'schedule':
        return <JobSchedule job={job} canEdit={canEdit} onUpdate={handleUpdate} />;
      case 'assessment':
        return <AssessmentTab job={job} onSave={(data) => update({ assessment_data: data })} user={user} />;
      case 'scope':
        return <ScopeOfWorkTab {...tabProps} />;
      case 'install':
        return <InstallationTab {...tabProps} />;
      case 'hvac':
        return <HVACTab {...tabProps} />;
      case 'inspection':
        return <InspectionTab {...tabProps} />;
      case 'export':
        return <JobExport {...tabProps} />;
      case 'log':
        return <JobLog job={job} user={user} />;
      default:
        return <ComingSoon label={TABS.find(t => t.key === tab)?.label || tab} />;
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
            }}>
              {toast}
            </span>
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
      <Suspense fallback={<TabSpinner />}>{renderTab()}</Suspense>
    </div>
  );
}
