import React, { useState, useMemo } from 'react';
import * as api from '../api';

// ── Helpers ──
function getScope(job) {
  try { return JSON.parse(job.scope_data || '{}'); } catch { return {}; }
}

function getInstallData(job) {
  try { return JSON.parse(job.install_data || '{}'); } catch { return {}; }
}

export default function InstallationTab({ job, canEdit, onUpdate, user }) {
  const [coText, setCoText] = useState('');
  const [coResponse, setCoResponse] = useState({});
  const [saving, setSaving] = useState(false);

  const sc = useMemo(() => getScope(job), [job.scope_data]);
  const data = useMemo(() => getInstallData(job), [job.install_data]);
  const measures = sc.selected_measures || [];
  const measureStatus = data.measure_status || {};
  const co = job.change_orders || [];

  // ── Persist install data ──
  const save = async (updates) => {
    const merged = { ...data, ...updates };
    try {
      setSaving(true);
      onUpdate('install_data', JSON.stringify(merged));
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const setField = (field, val) => save({ [field]: val });

  const updateMeasure = (m, field, val) => {
    const ms = { ...measureStatus };
    ms[m] = { ...(ms[m] || {}), [field]: val };
    save({ measure_status: ms });
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

  // ── Blower door reduction ──
  const preCFM = Number(data.pre_cfm50) || 0;
  const postCFM = Number(data.post_cfm50) || 0;
  const reduction = preCFM && postCFM ? Math.round(((preCFM - postCFM) / preCFM) * 100) : null;

  return (
    <div>
      {/* ── Install Info ── */}
      <div className="jd-card">
        <div className="jd-card-title">Install Completion</div>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 12px' }}>
          Complete all sections before leaving the job site.
        </p>
        <div className="jd-schedule-grid">
          <div className="jd-field">
            <label className="jd-field-label">Install Date</label>
            <input
              type="date"
              className="jd-date-input"
              value={data.install_date || ''}
              disabled={!canEdit}
              onChange={e => setField('install_date', e.target.value)}
            />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Crew Lead</label>
            <input
              className="jd-date-input"
              style={{ cursor: 'text' }}
              value={data.crew_lead || ''}
              disabled={!canEdit}
              placeholder="Enter crew lead name"
              onChange={e => setField('crew_lead', e.target.value)}
            />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Technician / Inspector</label>
            <input
              className="jd-date-input"
              style={{ cursor: 'text' }}
              value={data.technician || ''}
              disabled={!canEdit}
              placeholder="Enter technician name"
              onChange={e => setField('technician', e.target.value)}
            />
          </div>
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
                  {/* Installed checkbox + measure name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: canEdit ? 'pointer' : 'default', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={!!ms.installed}
                        disabled={!canEdit}
                        onChange={() => updateMeasure(m, 'installed', !ms.installed)}
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
                    {ms.issues && (
                      <span className="badge terminated" style={{ fontSize: 10 }}>Issue</span>
                    )}
                  </div>

                  {/* Notes + issues per measure */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingLeft: 28 }}>
                    <input
                      style={{
                        flex: 1, fontSize: 12, padding: '6px 10px',
                        border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
                        background: 'var(--color-surface)', color: 'var(--color-text)'
                      }}
                      defaultValue={ms.notes || ''}
                      disabled={!canEdit}
                      placeholder="Install notes..."
                      onBlur={e => {
                        if (e.target.value !== (ms.notes || '')) {
                          updateMeasure(m, 'notes', e.target.value);
                        }
                      }}
                    />
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, color: ms.issues ? '#dc2626' : 'var(--color-text-muted)',
                      cursor: canEdit ? 'pointer' : 'default', whiteSpace: 'nowrap'
                    }}>
                      <input
                        type="checkbox"
                        checked={!!ms.issues}
                        disabled={!canEdit}
                        onChange={() => updateMeasure(m, 'issues', !ms.issues)}
                        style={{ width: 14, height: 14, accentColor: '#dc2626' }}
                      />
                      Issues
                    </label>
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

      {/* ── Change Order Requests ── */}
      <div className="jd-card">
        <div className="jd-card-title">Change Order Requests ({co.length})</div>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
          Installer describes what needs to change. Admin reviews and approves/denies.
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

      {/* ── Blower Door Post-Test ── */}
      <div className="jd-card">
        <div className="jd-card-title">Post-Work Blower Door</div>
        <div className="jd-schedule-grid">
          <div className="jd-field">
            <label className="jd-field-label">Pre CFM50</label>
            <input
              type="number"
              className="jd-date-input"
              style={{ cursor: 'text' }}
              value={data.pre_cfm50 || ''}
              disabled={!canEdit}
              placeholder="0"
              onChange={e => setField('pre_cfm50', e.target.value)}
            />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Post CFM50</label>
            <input
              type="number"
              className="jd-date-input"
              style={{ cursor: 'text' }}
              value={data.post_cfm50 || ''}
              disabled={!canEdit}
              placeholder="0"
              onChange={e => setField('post_cfm50', e.target.value)}
            />
          </div>
        </div>
        {reduction !== null && (
          <div style={{
            marginTop: 12, padding: '10px 14px',
            background: reduction >= 25 ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${reduction >= 25 ? '#bbf7d0' : '#fde68a'}`,
            borderRadius: 'var(--radius)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: 13, color: 'var(--color-text)' }}>
              Air Seal Reduction: <strong>{reduction}%</strong>
            </span>
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: reduction >= 25 ? '#16a34a' : '#d97706'
            }}>
              {reduction >= 25 ? 'Meets 25% target' : 'Below 25% target'}
            </span>
          </div>
        )}
      </div>

      {/* ── Follow-up ── */}
      <div className="jd-card">
        <div className="jd-card-title">Follow-up</div>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
          cursor: canEdit ? 'pointer' : 'default', marginBottom: 8
        }}>
          <input
            type="checkbox"
            checked={data.followup_needed || false}
            disabled={!canEdit}
            onChange={() => setField('followup_needed', !data.followup_needed)}
            style={{ width: 16, height: 16, accentColor: 'var(--color-warning)' }}
          />
          Follow-up needed
        </label>
        {data.followup_needed && (
          <textarea
            style={{
              width: '100%', padding: '8px 10px', fontSize: 12,
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              minHeight: 50, resize: 'vertical'
            }}
            value={data.followup_notes || ''}
            disabled={!canEdit}
            placeholder="What needs follow-up..."
            onChange={e => setField('followup_notes', e.target.value)}
          />
        )}
      </div>

      {/* ── Final Sign-off ── */}
      <div className="jd-card">
        <div className="jd-card-title">Final Sign-off</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
            cursor: canEdit ? 'pointer' : 'default'
          }}>
            <input
              type="checkbox"
              checked={data.final_passed || false}
              disabled={!canEdit}
              onChange={() => setField('final_passed', !data.final_passed)}
              style={{ width: 18, height: 18, accentColor: 'var(--color-success)' }}
            />
            <span style={{ fontWeight: 600 }}>Final Inspection Passed</span>
          </label>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
            cursor: canEdit ? 'pointer' : 'default'
          }}>
            <input
              type="checkbox"
              checked={data.customer_signoff || false}
              disabled={!canEdit}
              onChange={() => setField('customer_signoff', !data.customer_signoff)}
              style={{ width: 18, height: 18, accentColor: 'var(--color-success)' }}
            />
            <span style={{ fontWeight: 600 }}>Customer Signature Collected</span>
          </label>
        </div>

        {/* Sign-off notes */}
        <div style={{ marginTop: 12 }}>
          <label className="jd-field-label">Sign-off Notes</label>
          <textarea
            style={{
              width: '100%', padding: '8px 10px', fontSize: 12,
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              minHeight: 50, resize: 'vertical'
            }}
            value={data.sign_off_notes || ''}
            disabled={!canEdit}
            placeholder="Any final notes or observations..."
            onChange={e => setField('sign_off_notes', e.target.value)}
          />
        </div>

        {/* Completion summary */}
        {(data.final_passed && data.customer_signoff) && (
          <div style={{
            marginTop: 12, padding: '10px 14px',
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius)', textAlign: 'center'
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
              Install complete — ready for Post-QC
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
