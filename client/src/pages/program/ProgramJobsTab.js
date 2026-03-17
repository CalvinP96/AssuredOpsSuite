import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const PHASES = [
  { key: 'schedule', label: 'Intake / Schedule', statuses: ['assessment_scheduled'] },
  { key: 'assess', label: 'Assess', statuses: ['assessment_complete'] },
  { key: 'scope', label: 'Scope', statuses: ['pre_approval'] },
  { key: 'in_review', label: 'In Review', statuses: ['in_review'] },
  { key: 'pre_approved', label: 'Pre-Approved', statuses: ['approved'] },
  { key: 'install', label: 'Install', statuses: ['install_scheduled', 'install_in_progress'] },
  { key: 'post_qc', label: 'Post-QC', statuses: ['inspection'] },
  { key: 'closeout', label: 'Closeout', statuses: ['submitted', 'invoiced'] },
];

function getPhaseForJob(job) {
  return PHASES.find(p => p.statuses.includes(job.status));
}

function getDaysInPhase(job) {
  return Math.floor((Date.now() - new Date(job.updated_at)) / 86400000);
}

function getDaysBadgeStyle(days) {
  if (days >= 15) return { background: '#fee2e2', color: '#991b1b' };
  if (days >= 8) return { background: '#fef3c7', color: '#92400e' };
  return { background: '#f1f5f9', color: '#475569' };
}

function getStatusColor(phaseKey) {
  const colors = {
    schedule: { bg: '#ede9fe', color: '#5b21b6' },
    assess: { bg: '#dbeafe', color: '#1e40af' },
    scope: { bg: '#e0f2fe', color: '#0369a1' },
    in_review: { bg: '#fef3c7', color: '#92400e' },
    pre_approved: { bg: '#dcfce7', color: '#166534' },
    install: { bg: '#d1fae5', color: '#065f46' },
    post_qc: { bg: '#ccfbf1', color: '#115e59' },
    closeout: { bg: '#99f6e4', color: '#134e4a' },
  };
  return colors[phaseKey] || { bg: '#f1f5f9', color: '#475569' };
}

export default function ProgramJobsTab({ jobs, canEdit, onRefresh, onNewJob }) {
  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const filtered = jobs.filter(job => {
    if (job.status === 'complete' || job.status === 'deferred') return false;
    if (phaseFilter !== 'all') {
      const phase = PHASES.find(p => p.key === phaseFilter);
      if (phase && !phase.statuses.includes(job.status)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (job.customer_name || '').toLowerCase().includes(q) ||
             (job.address || '').toLowerCase().includes(q) ||
             (job.job_number || '').includes(q) ||
             (job.rise_pid || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Group by phase
  const grouped = PHASES.map(phase => {
    const phaseJobs = filtered
      .filter(j => phase.statuses.includes(j.status))
      .sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
    return { ...phase, jobs: phaseJobs };
  }).filter(g => g.jobs.length > 0);

  const totalFiltered = filtered.length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
          {totalFiltered} job{totalFiltered !== 1 ? 's' : ''}
          {phaseFilter !== 'all' ? ` in ${PHASES.find(p => p.key === phaseFilter)?.label}` : ''}
          {search ? ` matching "${search}"` : ''}
        </div>
        {canEdit && <button className="btn btn-primary" onClick={onNewJob}>+ New Job</button>}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by name, address, job #, or RISE PID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)', fontSize: 14, background: 'var(--color-surface)',
          }}
        />
      </div>

      {/* Phase Filter Pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${phaseFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setPhaseFilter('all')}
        >All ({jobs.filter(j => j.status !== 'complete' && j.status !== 'deferred').length})</button>
        {PHASES.map(p => {
          const count = jobs.filter(j => p.statuses.includes(j.status)).length;
          return (
            <button key={p.key}
              className={`btn btn-sm ${phaseFilter === p.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPhaseFilter(p.key)}
            >{p.label} ({count})</button>
          );
        })}
      </div>

      {/* Job List Grouped by Phase */}
      {grouped.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
          {jobs.length === 0
            ? 'No jobs yet. Create a job to start tracking.'
            : 'No jobs match your search/filter.'}
        </div>
      ) : (
        grouped.map(group => {
          const isCollapsed = collapsed[group.key];
          const statusClr = getStatusColor(group.key);
          return (
            <div key={group.key} style={{ marginBottom: 20 }}>
              {/* Phase Section Header */}
              <div
                onClick={() => toggleCollapse(group.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  padding: '10px 0', borderBottom: '2px solid var(--color-border)', marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 14, color: 'var(--color-text-muted)', transition: 'transform 0.15s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                  &#9660;
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>
                  {group.label}
                </span>
                <span style={{
                  background: statusClr.bg, color: statusClr.color,
                  padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                }}>
                  {group.jobs.length}
                </span>
              </div>

              {/* Job Cards */}
              {!isCollapsed && group.jobs.map(job => {
                const days = getDaysInPhase(job);
                const dayStyle = getDaysBadgeStyle(days);
                const phase = getPhaseForJob(job);
                const phaseClr = phase ? getStatusColor(phase.key) : { bg: '#f1f5f9', color: '#475569' };

                return (
                  <Link key={job.id} to={`/job/${job.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div className="card" style={{
                    marginBottom: 8, padding: '14px 18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 16, flexWrap: 'wrap', cursor: 'pointer',
                    ...(job.submission_date ? { borderLeft: '4px solid #16a34a', background: '#f0fdf4' } : {}),
                  }}>
                    {/* Left: Name, job#, address */}
                    <div style={{ minWidth: 0, flex: '1 1 280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Link to={`/job/${job.id}`} style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
                          {job.customer_name || 'Unnamed'}
                        </Link>
                        {job.job_number && (
                          <span className="badge active" style={{ fontSize: 10 }}>#{job.job_number}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {job.address}{job.city ? `, ${job.city}` : ''} {job.zip || ''}
                      </div>
                    </div>

                    {/* Center: RISE PID, utility, days */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 1 auto', flexWrap: 'wrap' }}>
                      {job.rise_pid && (
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'var(--color-surface-alt)', padding: '2px 8px', borderRadius: 4 }}>
                          RISE: {job.rise_pid}
                        </span>
                      )}
                      {job.utility && (
                        <span style={{ fontSize: 11, color: 'var(--color-primary)', background: '#eff6ff', padding: '2px 8px', borderRadius: 4 }}>
                          {job.utility}
                        </span>
                      )}
                      <span style={{
                        ...dayStyle, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      }}>
                        {days}d
                      </span>
                    </div>

                    {/* Right: Status badge + Open Project */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 auto' }}>
                      <span style={{
                        background: phaseClr.bg, color: phaseClr.color,
                        padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                        textTransform: 'capitalize', whiteSpace: 'nowrap',
                      }}>
                        {job.status?.replace(/_/g, ' ')}
                      </span>
                      <Link to={`/job/${job.id}`} className="btn btn-sm btn-primary"
                        style={{ textDecoration: 'none', fontSize: 11, padding: '4px 12px', whiteSpace: 'nowrap' }}>
                        Open Project
                      </Link>
                    </div>
                  </div>
                  </Link>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}
