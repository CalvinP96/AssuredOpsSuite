import React from 'react';
import { Link } from 'react-router-dom';

const PHASES = [
  { key: 'intake', label: 'Intake', statuses: ['assessment_scheduled'], color: '#6366f1' },
  { key: 'schedule', label: 'Schedule', statuses: ['assessment_scheduled'], color: '#8b5cf6' },
  { key: 'assess', label: 'Assess', statuses: ['assessment_complete'], color: '#3b82f6' },
  { key: 'scope', label: 'Scope', statuses: ['pre_approval'], color: '#0ea5e9' },
  { key: 'in_review', label: 'In Review', statuses: ['in_review'], color: '#d97706' },
  { key: 'pre_approved', label: 'Pre-Approved', statuses: ['approved'], color: '#16a34a' },
  { key: 'install', label: 'Install', statuses: ['install_scheduled', 'install_in_progress'], color: '#059669' },
  { key: 'post_qc', label: 'Post-QC', statuses: ['inspection'], color: '#0d9488' },
  { key: 'closeout', label: 'Closeout', statuses: ['submitted', 'invoiced'], color: '#14b8a6' },
];

export default function ProgramPipelineTab({ jobs }) {
  const columns = PHASES.map(phase => {
    const phaseJobs = jobs
      .filter(j => phase.statuses.includes(j.status))
      .sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
    return { ...phase, jobs: phaseJobs };
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Pipeline View</h3>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          {jobs.filter(j => j.status !== 'complete' && j.status !== 'deferred').length} active jobs
        </span>
      </div>

      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16,
        WebkitOverflowScrolling: 'touch',
      }}>
        {columns.map(col => (
          <div key={col.key} style={{
            minWidth: 200, maxWidth: 240, flex: '0 0 220px',
            background: 'var(--color-surface)', borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column',
          }}>
            {/* Column Header */}
            <div style={{
              padding: '12px 14px', borderBottom: '2px solid ' + col.color,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>
                {col.label}
              </span>
              <span style={{
                background: col.color + '20', color: col.color,
                padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
              }}>
                {col.jobs.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ padding: 8, flex: 1, minHeight: 60, maxHeight: 500, overflowY: 'auto' }}>
              {col.jobs.length === 0 ? (
                <div style={{ padding: 12, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 12 }}>
                  No jobs
                </div>
              ) : (
                col.jobs.map(job => {
                  const days = Math.floor((Date.now() - new Date(job.updated_at)) / 86400000);
                  const dayColor = days >= 15 ? '#dc2626' : days >= 8 ? '#d97706' : 'var(--color-text-muted)';
                  return (
                    <Link key={job.id} to={`/job/${job.id}`} style={{
                      display: 'block', textDecoration: 'none', color: 'inherit',
                      padding: '10px 12px', marginBottom: 6,
                      background: 'var(--color-surface-alt)', borderRadius: 6,
                      border: '1px solid var(--color-border)',
                      transition: 'box-shadow 0.15s, border-color 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = col.color; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                        {job.customer_name || 'Unnamed'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {job.job_number && (
                          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>#{job.job_number}</span>
                        )}
                        <span style={{ fontSize: 10, fontWeight: 600, color: dayColor }}>
                          {days}d
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
