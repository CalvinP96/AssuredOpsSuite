import React, { useState, useEffect } from 'react';
import * as api from '../../api';

const PHASES = [
  { key: 'intake', label: 'Intake', statuses: ['assessment_scheduled'] },
  { key: 'schedule', label: 'Schedule', statuses: ['assessment_scheduled'] },
  { key: 'assess', label: 'Assess', statuses: ['assessment_complete'] },
  { key: 'scope', label: 'Scope', statuses: ['pre_approval'] },
  { key: 'in_review', label: 'In Review', statuses: ['in_review'] },
  { key: 'pre_approved', label: 'Pre-Approved', statuses: ['approved'] },
  { key: 'install', label: 'Install', statuses: ['install_scheduled', 'install_in_progress'] },
  { key: 'post_qc', label: 'Post-QC', statuses: ['inspection'] },
  { key: 'closeout', label: 'Closeout', statuses: ['submitted', 'invoiced'] },
];

function getPhaseForStatus(status) {
  return PHASES.find(p => p.statuses.includes(status));
}

export default function ProgramDashboardTab({ program, jobs, onSwitchTab }) {
  const [auditLog, setAuditLog] = useState([]);

  useEffect(() => {
    api.getAuditLog({ entityType: 'job' }).then(entries => {
      const programJobIds = new Set(jobs.map(j => String(j.id)));
      const filtered = entries.filter(e => programJobIds.has(e.entity_id)).slice(0, 5);
      setAuditLog(filtered);
    }).catch(() => {});
  }, [jobs]);

  const activeJobs = jobs.filter(j => j.status !== 'complete' && j.status !== 'deferred');
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const completionsThisMonth = jobs.filter(j => j.status === 'complete' && j.updated_at >= monthStart).length;
  const pendingReview = jobs.filter(j => j.status === 'in_review').length;
  const preApproved = jobs.filter(j => j.status === 'approved').length;

  // Attention flags
  const hsJobs = jobs.filter(j => {
    const ad = typeof j.assessment_data === 'string' ? (() => { try { return JSON.parse(j.assessment_data); } catch { return null; } })() : j.assessment_data;
    return ad?.health_safety_conditions?.length > 0 && !j.customer_signature;
  });
  const fourteenDaysAgo = Date.now() - 14 * 86400000;
  const stuckJobs = jobs.filter(j =>
    j.status !== 'complete' && j.status !== 'deferred' &&
    new Date(j.updated_at).getTime() < fourteenDaysAgo
  );
  const pendingChangeOrders = jobs.filter(j =>
    (j.change_orders || []).some(co => co.status === 'pending')
  );
  const hasFlags = hsJobs.length > 0 || stuckJobs.length > 0 || pendingChangeOrders.length > 0;

  // Pipeline counts
  const phaseCounts = PHASES.map(phase => {
    const count = jobs.filter(j => phase.statuses.includes(j.status)).length;
    return { ...phase, count };
  });
  const totalPipelineJobs = phaseCounts.reduce((s, p) => s + p.count, 0);

  return (
    <div>
      {/* Header Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-value">{activeJobs.length}</div>
          <div className="stat-label">Active Jobs</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{completionsThisMonth}</div>
          <div className="stat-label">Completions This Month</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">{pendingReview}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{preApproved}</div>
          <div className="stat-label">Pre-Approved</div>
        </div>
      </div>

      {/* Attention Flags */}
      {hasFlags && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--color-warning)' }}>
          <h3 style={{ color: 'var(--color-warning)', marginBottom: 12 }}>Attention Required</h3>
          {hsJobs.length > 0 && (
            <div style={{ padding: '8px 12px', background: '#fef3c7', borderRadius: 6, marginBottom: 8, fontSize: 13 }}>
              <strong>{hsJobs.length} job{hsJobs.length !== 1 ? 's' : ''}</strong> with H&S conditions flagged (consent not yet signed)
            </div>
          )}
          {stuckJobs.length > 0 && (
            <div style={{ padding: '8px 12px', background: '#fee2e2', borderRadius: 6, marginBottom: 8, fontSize: 13 }}>
              <strong>{stuckJobs.length} job{stuckJobs.length !== 1 ? 's' : ''}</strong> with no status change in 14+ days
            </div>
          )}
          {pendingChangeOrders.length > 0 && (
            <div style={{ padding: '8px 12px', background: '#fef3c7', borderRadius: 6, fontSize: 13 }}>
              <strong>{pendingChangeOrders.length} job{pendingChangeOrders.length !== 1 ? 's' : ''}</strong> with pending change orders
            </div>
          )}
        </div>
      )}

      {/* Pipeline Summary */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 14 }}>Pipeline Summary</h3>
        <div style={{ display: 'flex', gap: 4, borderRadius: 8, overflow: 'hidden', height: 36, background: 'var(--color-surface-alt)' }}>
          {phaseCounts.map(p => {
            if (p.count === 0) return null;
            const pct = totalPipelineJobs > 0 ? Math.max((p.count / totalPipelineJobs) * 100, 8) : 0;
            const colors = {
              intake: '#6366f1', schedule: '#8b5cf6', assess: '#3b82f6',
              scope: '#0ea5e9', in_review: '#d97706', pre_approved: '#16a34a',
              install: '#059669', post_qc: '#0d9488', closeout: '#14b8a6',
            };
            return (
              <div key={p.key}
                onClick={() => onSwitchTab('jobs')}
                style={{
                  width: `${pct}%`, minWidth: 40, background: colors[p.key] || '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                title={`${p.label}: ${p.count}`}
              >
                {p.count}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
          {phaseCounts.map(p => (
            <button key={p.key}
              onClick={() => onSwitchTab('jobs')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{p.count}</span>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Recent Activity</h3>
        {auditLog.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No recent activity logged.</p>
        ) : (
          auditLog.map((entry, i) => (
            <div key={entry.id || i} style={{
              padding: '10px 0', borderBottom: i < auditLog.length - 1 ? '1px solid var(--color-border)' : 'none',
              fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div>
                <strong>{entry.user_name}</strong>{' '}
                <span style={{ color: 'var(--color-text-muted)' }}>{entry.action}</span>{' '}
                {entry.entity_label && <span>{entry.entity_label}</span>}
                {entry.field_name && (
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {' '}&mdash; {entry.field_name}: {entry.old_value} &rarr; {entry.new_value}
                  </span>
                )}
              </div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 11, whiteSpace: 'nowrap', marginLeft: 12 }}>
                {new Date(entry.created_at).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
