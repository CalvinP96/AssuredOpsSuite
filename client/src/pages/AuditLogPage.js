import React, { useState, useEffect } from 'react';
import { getAuditLog } from '../api';

export default function AuditLogPage({ user }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ entityType: '', dateFrom: '', dateTo: '' });

  const load = async () => {
    setLoading(true);
    const data = await getAuditLog(filters);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>Audit Log</h2>

      <form onSubmit={handleFilter} style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity Type</label>
          <select
            value={filters.entityType}
            onChange={e => setFilters(f => ({ ...f, entityType: e.target.value }))}
            style={{ height: 38, padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 14, background: 'var(--color-surface)' }}
          >
            <option value="">All</option>
            <option value="job">Job</option>
            <option value="employee">Employee</option>
            <option value="program">Program</option>
            <option value="kpi">KPI</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>From</label>
          <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
            style={{ height: 38, padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 14 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>To</label>
          <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
            style={{ height: 38, padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 14 }} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ height: 38, padding: '6px 16px', fontSize: 14 }}>
          Filter
        </button>
      </form>

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      ) : entries.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No audit log entries found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>Timestamp</th>
                <th style={{ padding: '8px 12px' }}>User</th>
                <th style={{ padding: '8px 12px' }}>Action</th>
                <th style={{ padding: '8px 12px' }}>Entity</th>
                <th style={{ padding: '8px 12px' }}>Field</th>
                <th style={{ padding: '8px 12px' }}>Old Value</th>
                <th style={{ padding: '8px 12px' }}>New Value</th>
                <th style={{ padding: '8px 12px' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 12px' }}>{e.user_name}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius)',
                      fontSize: 12,
                      fontWeight: 600,
                      background: e.action === 'delete' ? '#fef2f2' : e.action === 'create' ? '#f0fdf4' : '#eff6ff',
                      color: e.action === 'delete' ? '#dc2626' : e.action === 'create' ? '#16a34a' : '#2563eb',
                    }}>
                      {e.action}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {e.entity_type}{e.entity_label ? `: ${e.entity_label}` : ''}
                  </td>
                  <td style={{ padding: '8px 12px' }}>{e.field_name || '—'}</td>
                  <td style={{ padding: '8px 12px', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.old_value || '—'}</td>
                  <td style={{ padding: '8px 12px', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.new_value || '—'}</td>
                  <td style={{ padding: '8px 12px' }}>{e.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
