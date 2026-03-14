import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

const ACTION_COLORS = {
  created: '#16a34a',
  updated: '#2563eb',
  status_changed: '#d97706',
  deleted: '#dc2626',
  signed: '#7c3aed',
};

function getActionColor(action) {
  if (!action) return '#64748b';
  const key = action.toLowerCase();
  return ACTION_COLORS[key] || '#64748b';
}

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return then.toLocaleDateString();
}

function formatChange(entry) {
  if (entry.action === 'status_changed') {
    return null; // rendered separately with badges
  }
  if (entry.field_name && entry.old_value !== null && entry.new_value !== null) {
    return `Updated ${entry.field_name}: ${entry.old_value || 'null'} \u2192 ${entry.new_value}`;
  }
  if (entry.field_name && entry.new_value !== null) {
    return `Set ${entry.field_name} to ${entry.new_value}`;
  }
  if (entry.notes) return entry.notes;
  if (entry.action === 'created') return 'Created this job';
  if (entry.action === 'signed') return 'Signed document';
  return entry.action || 'Activity recorded';
}

function StatusBadge({ status }) {
  if (!status) return null;
  const colors = {
    intake: { bg: '#f1f5f9', text: '#475569' },
    assessment: { bg: '#e3f2fd', text: '#1565c0' },
    scoping: { bg: '#f3e5f5', text: '#6a1b9a' },
    scheduling: { bg: '#fff3e0', text: '#e65100' },
    install: { bg: '#e8f5e9', text: '#2e7d32' },
    submitted: { bg: '#dcfce7', text: '#166534' },
    invoiced: { bg: '#dcfce7', text: '#166534' },
    complete: { bg: '#dcfce7', text: '#166534' },
    deferred: { bg: '#fee2e2', text: '#991b1b' },
  };
  const c = colors[status.toLowerCase()] || { bg: '#f1f5f9', text: '#475569' };
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text, textTransform: 'capitalize' }}>
      {status}
    </span>
  );
}

export default function LogTab({ job, user }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLog = useCallback(async () => {
    try {
      const data = await api.getAuditLog({ entityType: 'job', entityId: job.id });
      setEntries(data);
    } catch (err) {
      console.error('Failed to load audit log:', err);
    } finally {
      setLoading(false);
    }
  }, [job.id]);

  useEffect(() => { loadLog(); }, [loadLog]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadLog, 30000);
    return () => clearInterval(interval);
  }, [loadLog]);

  if (loading) {
    return (
      <div className="jd-card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
        Loading activity log...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="jd-card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>&#128203;</div>
        <div style={{ fontSize: 14 }}>No activity logged yet</div>
      </div>
    );
  }

  return (
    <div>
      <div className="jd-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Activity Log</h3>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{entries.length} entries</span>
        </div>
      </div>

      <div style={{ position: 'relative', paddingLeft: 24 }}>
        {/* Timeline line */}
        <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: 'var(--color-border)' }} />

        {entries.map((entry, i) => {
          const color = getActionColor(entry.action);
          const desc = formatChange(entry);
          const isStatusChange = entry.action === 'status_changed';

          return (
            <div key={entry.id || i} style={{ position: 'relative', marginBottom: 2 }}>
              {/* Dot */}
              <div style={{ position: 'absolute', left: -20, top: 18, width: 16, height: 16, borderRadius: '50%', background: color, border: '3px solid var(--color-surface)', zIndex: 1, boxShadow: '0 0 0 1px var(--color-border)' }} />

              <div className="jd-card" style={{ marginBottom: 8, padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
                    {entry.user_name || 'System'}
                  </span>
                  <span title={entry.created_at ? new Date(entry.created_at).toLocaleString() : ''} style={{ fontSize: 11, color: 'var(--color-text-muted)', cursor: 'default', flexShrink: 0, marginLeft: 12 }}>
                    {relativeTime(entry.created_at)}
                  </span>
                </div>

                {isStatusChange ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Status changed</span>
                    <StatusBadge status={entry.old_value} />
                    <span style={{ color: 'var(--color-text-muted)' }}>{'\u2192'}</span>
                    <StatusBadge status={entry.new_value} />
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {desc}
                  </div>
                )}

                {entry.entity_label && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, opacity: 0.7 }}>
                    {entry.entity_label}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
