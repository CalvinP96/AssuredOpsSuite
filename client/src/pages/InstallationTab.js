import React, { useState, useMemo } from 'react';
import * as api from '../api';

// ── Helpers ──
function getScope(job) {
  try { return JSON.parse(job.scope_data || '{}'); } catch { return {}; }
}

function getInstallData(job) {
  try { return JSON.parse(job.install_data || '{}'); } catch { return {}; }
}

export default function InstallationTab({ job, program, canEdit, onUpdate, user }) {
  const [coText, setCoText] = useState('');
  const [coResponse, setCoResponse] = useState({});
  const [saving, setSaving] = useState(false);
  const sc = useMemo(() => getScope(job), [job.scope_data]);
  const installData = useMemo(() => getInstallData(job), [job.install_data]);
  const measures = sc.selected_measures || [];
  const measureStatus = installData.measure_status || {};
  const co = job.change_orders || [];

  // ── Persist install data ──
  const saveInstall = async (updates) => {
    const merged = { ...installData, ...updates };
    try {
      setSaving(true);
      await api.updateJob(job.id, { install_data: JSON.stringify(merged) });
      onUpdate('_reload');
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleMeasure = (m, field, val) => {
    const ms = { ...measureStatus };
    ms[m] = { ...(ms[m] || {}), [field]: val };
    saveInstall({ measure_status: ms });
  };

  // ── Change order ──
  const submitCO = async () => {
    if (!coText.trim()) return;
    try {
      await api.createChangeOrder(job.id, {
        description: coText.trim(),
        requested_by: user?.name || user?.email || 'Unknown',
        status: 'pending'
      });
      setCoText('');
      onUpdate('_reload');
    } catch (err) {
      alert('Failed to submit COR: ' + err.message);
    }
  };

  const reviewCO = async (coId, status) => {
    const resp = coResponse[coId] || '';
    try {
      await api.updateChangeOrder(coId, {
        status,
        reviewer_notes: resp,
        reviewed_by: user?.name || user?.email || 'Unknown'
      });
      setCoResponse(prev => ({ ...prev, [coId]: '' }));
      onUpdate('_reload');
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'Admin';
  const installedCount = measures.filter(m => measureStatus[m]?.installed).length;

  return (
    <div>
      {/* ── Installation Dates ── */}
      <div className="jd-card">
        <div className="jd-card-title">Installation Progress</div>
        <div className="jd-schedule-grid">
          {[
            { label: 'Install Date', field: 'install_date' },
            { label: 'Crew Lead', field: 'crew_lead' },
            { label: 'ABC Install Date', field: 'abc_install_date' },
            { label: 'Wall Injection Date', field: 'wall_injection_date' },
            { label: 'Patch Date', field: 'patch_date' },
          ].map(d => (
            <div key={d.field} className="jd-field">
              <label className="jd-field-label">{d.label}</label>
              {d.field === 'crew_lead' ? (
                <input
                  className="jd-date-input"
                  style={{ cursor: 'text' }}
                  value={job[d.field] || ''}
                  disabled={!canEdit}
                  placeholder="Enter crew lead name"
                  onChange={e => onUpdate(d.field, e.target.value)}
                />
              ) : (
                <input
                  type="date"
                  className="jd-date-input"
                  value={job[d.field] || ''}
                  disabled={!canEdit}
                  onChange={e => onUpdate(d.field, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        {saving && <div style={{ fontSize: 11, color: 'var(--color-primary)', marginTop: 8 }}>Saving...</div>}
      </div>

      {/* ── Measure-by-Measure Install Checklist ── */}
      <div className="jd-card">
        <div className="jd-card-title">
          Install Checklist — Measures ({installedCount}/{measures.length})
        </div>
        {measures.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No scope measures defined yet.</p>
        ) : (
          <>
            {/* Progress bar */}
            <div style={{
              height: 6, borderRadius: 3, background: 'var(--color-border)', marginBottom: 16, overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${measures.length ? (installedCount / measures.length) * 100 : 0}%`,
                background: 'var(--color-success)',
                borderRadius: 3,
                transition: 'width 0.3s ease'
              }} />
            </div>

            {measures.map(m => {
              const ms = measureStatus[m] || {};
              return (
                <div key={m} style={{
                  padding: '12px 0',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: canEdit ? 'pointer' : 'default', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={!!ms.installed}
                        disabled={!canEdit}
                        onChange={() => toggleMeasure(m, 'installed', !ms.installed)}
                        style={{ width: 18, height: 18, accentColor: 'var(--color-success)' }}
                      />
                      <span style={{
                        fontSize: 14,
                        fontWeight: 600,
                        textDecoration: ms.installed ? 'line-through' : 'none',
                        color: ms.installed ? 'var(--color-text-muted)' : 'var(--color-text)'
                      }}>
                        {m}
                      </span>
                    </label>
                    {ms.installed && (
                      <span className="badge active" style={{ fontSize: 10 }}>Installed</span>
                    )}
                  </div>
                  {/* Notes field per measure */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingLeft: 28 }}>
                    <input
                      style={{
                        flex: 1, fontSize: 12, padding: '6px 10px',
                        border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
                        background: 'var(--color-surface)', color: 'var(--color-text)'
                      }}
                      value={ms.notes || ''}
                      disabled={!canEdit}
                      placeholder="Install notes..."
                      onBlur={e => {
                        if (e.target.value !== (ms.notes || '')) {
                          toggleMeasure(m, 'notes', e.target.value);
                        }
                      }}
                      onChange={e => {
                        // Local state update — saves onBlur
                        const el = e.target;
                        el.dataset.val = el.value;
                      }}
                      defaultValue={ms.notes || ''}
                    />
                    {ms.photo_ref && (
                      <span style={{ fontSize: 11, color: 'var(--color-primary)' }}>Photo linked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Scope notes */}
        {sc.notes && (
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 12 }}>
            <strong>Scope Notes:</strong> {sc.notes}
          </p>
        )}
      </div>

      {/* ── Existing Checklist Items ── */}
      {(job.checklist || []).filter(c => c.item_type === 'photo' || c.item_type === 'paperwork').length > 0 && (
        <div className="jd-card">
          <div className="jd-card-title">Documentation Checklist</div>
          {(job.checklist || []).filter(c => c.item_type === 'photo' || c.item_type === 'paperwork').map(item => (
            <label key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 0',
              cursor: canEdit ? 'pointer' : 'default'
            }}>
              <input
                type="checkbox"
                checked={!!item.completed}
                disabled={!canEdit}
                onChange={async () => {
                  await api.updateChecklist(item.id, {
                    completed: !item.completed,
                    completed_by: user?.name || user?.email || 'Unknown'
                  });
                  onUpdate('_reload');
                }}
                style={{ width: 16, height: 16, accentColor: 'var(--color-success)' }}
              />
              <span style={{
                textDecoration: item.completed ? 'line-through' : 'none',
                color: item.completed ? 'var(--color-text-muted)' : 'var(--color-text)'
              }}>
                {item.description}
              </span>
              {item.completed_date && (
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>({item.completed_date})</span>
              )}
            </label>
          ))}
        </div>
      )}

      {/* ── Change Orders ── */}
      <div className="jd-card">
        <div className="jd-card-title">Change Order Requests ({co.length})</div>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
          Describe any scope changes needed. Admin reviews and approves/denies.
        </p>

        {/* Submit new COR */}
        {canEdit && (
          <div style={{ marginBottom: 16 }}>
            <textarea
              style={{
                width: '100%', padding: '10px 12px', fontSize: 13,
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
                background: 'var(--color-surface)', color: 'var(--color-text)',
                minHeight: 60, resize: 'vertical'
              }}
              value={coText}
              onChange={e => setCoText(e.target.value)}
              placeholder="Describe what needs to change and why..."
            />
            <button
              className="btn btn-secondary"
              style={{ marginTop: 8, width: '100%', opacity: coText.trim() ? 1 : 0.4 }}
              disabled={!coText.trim()}
              onClick={submitCO}
            >
              Submit Change Order Request
            </button>
          </div>
        )}

        {/* COR list */}
        {co.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 12, textAlign: 'center', padding: 16 }}>
            No change orders submitted.
          </p>
        ) : (
          co.map(c => (
            <div key={c.id} style={{
              padding: 14,
              border: `1px solid ${c.status === 'approved' ? '#bbf7d0' : c.status === 'denied' ? '#fecaca' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius)',
              marginBottom: 10,
              background: c.status === 'approved' ? '#f0fdf4' : c.status === 'denied' ? '#fef2f2' : 'var(--color-surface-alt)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.5 }}>{c.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    Requested by {c.requested_by} &middot; {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                  </div>
                </div>
                <span className={`badge ${c.status === 'approved' ? 'active' : c.status === 'denied' ? 'terminated' : 'pending'}`}
                  style={{ fontSize: 10, marginLeft: 10, flexShrink: 0 }}>
                  {c.status?.toUpperCase()}
                </span>
              </div>

              {/* Reviewer notes */}
              {c.reviewer_notes && (
                <div style={{
                  fontSize: 12, color: 'var(--color-text-muted)', padding: '6px 10px', marginTop: 6,
                  background: 'var(--color-surface-alt)', borderRadius: 'var(--radius)',
                  borderLeft: '3px solid var(--color-border)'
                }}>
                  <strong>Review:</strong> {c.reviewer_notes}
                </div>
              )}

              {/* Admin approve/deny panel */}
              {c.status === 'pending' && isAdmin && (
                <div style={{ marginTop: 10, padding: 12, background: 'var(--color-surface-alt)', borderRadius: 'var(--radius)' }}>
                  <textarea
                    style={{
                      width: '100%', padding: '8px 10px', fontSize: 12,
                      border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)', color: 'var(--color-text)',
                      minHeight: 40, resize: 'vertical', marginBottom: 8
                    }}
                    value={coResponse[c.id] || ''}
                    onChange={e => setCoResponse(prev => ({ ...prev, [c.id]: e.target.value }))}
                    placeholder="Review notes (optional)..."
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => reviewCO(c.id, 'approved')}>
                      Approve
                    </button>
                    <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => reviewCO(c.id, 'denied')}>
                      Deny
                    </button>
                  </div>
                </div>
              )}

              {c.status === 'pending' && !isAdmin && (
                <div style={{ fontSize: 11, color: 'var(--color-warning)', marginTop: 6, fontStyle: 'italic' }}>
                  Awaiting admin review...
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
