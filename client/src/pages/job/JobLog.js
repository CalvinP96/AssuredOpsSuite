import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../api';

const ACTION_COLORS = {
  created: '#16a34a',
  updated: '#2563eb',
  status_changed: '#d97706',
  deleted: '#dc2626',
  signed: '#7c3aed',
};

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function describeEntry(entry) {
  if (entry.action === 'status_changed') return null;
  if (entry.field_name && entry.old_value != null && entry.new_value != null)
    return `Updated ${entry.field_name}: ${entry.old_value} \u2192 ${entry.new_value}`;
  if (entry.field_name && entry.new_value != null)
    return `Set ${entry.field_name} to ${entry.new_value}`;
  if (entry.notes) return entry.notes;
  if (entry.action === 'created') return 'Created this job';
  if (entry.action === 'signed') return 'Signed document';
  return entry.action || 'Activity recorded';
}

function StatusBadge({ status }) {
  if (!status) return null;
  const normalized = status.replace(/\s+/g, '_').toLowerCase();
  return (
    <span className={`status-badge status-badge--${normalized} status-badge--sm`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function SkeletonRows() {
  return [1, 2, 3].map(i => (
    <div key={i} className="jd-card" style={{ padding: '14px 16px', marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 4, height: 40, borderRadius: 2, background: 'var(--color-border)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 12, width: '40%', background: 'var(--color-border)', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 10, width: '70%', background: 'var(--color-surface-alt)', borderRadius: 4 }} />
        </div>
      </div>
    </div>
  ));
}

export default function JobLog({ job, user }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLog = useCallback(async () => {
    try {
      const data = await api.getAuditLog({ entityType: 'job', entityId: job.id });
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load audit log:', err);
    } finally {
      setLoading(false);
    }
  }, [job.id]);

  useEffect(() => { loadLog(); }, [loadLog]);

  useEffect(() => {
    const interval = setInterval(loadLog, 60000);
    return () => clearInterval(interval);
  }, [loadLog]);

  if (loading) {
    return <div style={{ paddingLeft: 24 }}><SkeletonRows /></div>;
  }

  if (entries.length === 0) {
    return (
      <div className="jd-card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
        <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }}>&#128203;</div>
        <div style={{ fontSize: 14 }}>No activity logged yet for this job</div>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) =>
    new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  return (
    <div>
      <div className="jd-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Activity Log</h3>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{sorted.length} entries</span>
        </div>
      </div>

      <div style={{ position: 'relative', paddingLeft: 24 }}>
        <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: 'var(--color-border)' }} />

        {sorted.map((entry, i) => {
          const color = ACTION_COLORS[entry.action?.toLowerCase()] || '#64748b';
          const desc = describeEntry(entry);
          const isStatus = entry.action === 'status_changed';

          return (
            <div key={entry.id || i} style={{ position: 'relative', marginBottom: 2 }}>
              <div style={{
                position: 'absolute', left: -20, top: 16, width: 16, height: 16,
                borderRadius: '50%', background: color,
                border: '3px solid var(--color-surface)', zIndex: 1,
                boxShadow: '0 0 0 1px var(--color-border)',
              }} />
              <div className="jd-card" style={{
                marginBottom: 8, padding: '12px 16px',
                borderLeft: `3px solid ${color}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>
                    {entry.user_name || 'System'}
                  </span>
                  <span
                    title={entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}
                    style={{ fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0, marginLeft: 12, cursor: 'default' }}
                  >
                    {relativeTime(entry.created_at)}
                  </span>
                </div>

                {isStatus ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Status changed</span>
                    <StatusBadge status={entry.old_value} />
                    <span style={{ color: 'var(--color-text-muted)' }}>{'\u2192'}</span>
                    <StatusBadge status={entry.new_value} />
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{desc}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
