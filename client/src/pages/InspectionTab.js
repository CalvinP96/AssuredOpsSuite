import React, { useState, useMemo } from 'react';
import * as api from '../api';

// ── Inspection checklist items (from hes-tracker QAQCTab + CloseoutTab) ──
const VISUAL_CHECKLIST = [
  'Air sealing — penetrations sealed',
  'Air sealing — top plates sealed',
  'Air sealing — attic bypasses sealed',
  'Air sealing — rim joist sealed',
  'Insulation — attic coverage complete',
  'Insulation — wall cavities filled',
  'Insulation — no gaps or voids',
  'Insulation — proper depth/density',
  'Duct sealing — all connections sealed',
  'Duct sealing — returns sealed',
  'Ventilation — fan installed and working',
  'Ventilation — ducted to exterior',
  'Health & safety — CO detectors installed',
  'Health & safety — smoke detectors installed',
  'Health & safety — combustion safety passed',
  'Workmanship — clean job site',
  'Workmanship — no damage to home',
  'Workmanship — all materials properly installed',
];

const CLOSEOUT_DOCS = [
  'Assessment Report uploaded to RISE',
  'CAZ results documented',
  'Pre-installation photos uploaded',
  'RISE data entry complete',
  'Customer Authorization Form signed',
  'Scope of Work signed',
  'Post-installation photos uploaded',
  'Final Inspection Form signed',
  'Customer Satisfaction Survey completed',
  'Estimate with pricing uploaded',
  'Invoice submitted',
];

function getAssessment(job) {
  try { return JSON.parse(job.assessment_data || '{}'); } catch { return {}; }
}

function getInspection(job) {
  try { return JSON.parse(job.inspection_data || '{}'); } catch { return {}; }
}

export default function InspectionTab({ job, program, canEdit, onUpdate, user }) {
  const [saving, setSaving] = useState(false);
  const ad = useMemo(() => getAssessment(job), [job.assessment_data]);
  const insp = useMemo(() => getInspection(job), [job.inspection_data]);

  const visualChecks = insp.visual_checks || {};
  const closeoutChecks = insp.closeout_checks || {};
  const qaqcResult = insp.qaqc_result || {};

  // ── Save inspection data ──
  const saveInspection = async (updates) => {
    const merged = { ...insp, ...updates };
    try {
      setSaving(true);
      await api.saveInspectionData(job.id, merged);
      onUpdate('_reload');
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const setVisualCheck = (item, val) => {
    saveInspection({ visual_checks: { ...visualChecks, [item]: val } });
  };

  const setCloseoutCheck = (item, val) => {
    saveInspection({ closeout_checks: { ...closeoutChecks, [item]: val } });
  };

  const setQAQC = (field, val) => {
    saveInspection({ qaqc_result: { ...qaqcResult, [field]: val } });
  };

  // Stats
  const visualDone = VISUAL_CHECKLIST.filter(item => visualChecks[item] === 'pass').length;
  const closeoutDone = CLOSEOUT_DOCS.filter(item => closeoutChecks[item]).length;
  const preCFM50 = Number(insp.pre_cfm50 || ad?.diagnostics?.pre_cfm50 || job.pre_cfm50 || 0);
  const postCFM50 = Number(insp.post_cfm50 || ad?.diagnostics?.post_cfm50 || 0);
  const reduction = preCFM50 && postCFM50 ? Math.round(((preCFM50 - postCFM50) / preCFM50) * 100) : null;

  return (
    <div>
      {/* ── Schedule ── */}
      <div className="jd-card">
        <div className="jd-card-title">Inspection Schedule</div>
        <div className="jd-schedule-grid">
          <div className="jd-field">
            <label className="jd-field-label">Inspection Date</label>
            <input type="date" className="jd-date-input" value={job.inspection_date || ''} disabled={!canEdit}
              onChange={e => onUpdate('inspection_date', e.target.value)} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Inspector</label>
            <input className="jd-date-input" style={{ cursor: 'text' }}
              value={insp.inspector || ''} disabled={!canEdit}
              placeholder="Inspector name"
              onChange={e => saveInspection({ inspector: e.target.value })} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Submission Date</label>
            <input type="date" className="jd-date-input" value={job.submission_date || ''} disabled={!canEdit}
              onChange={e => onUpdate('submission_date', e.target.value)} />
          </div>
        </div>
        {saving && <div style={{ fontSize: 11, color: 'var(--color-primary)', marginTop: 6 }}>Saving...</div>}
      </div>

      {/* ── Post-Install Blower Door Test ── */}
      <div className="jd-card">
        <div className="jd-card-title">Post-Install Blower Door Test</div>
        <div className="jd-schedule-grid">
          <div className="jd-field">
            <label className="jd-field-label">Pre CFM50</label>
            <input type="number" className="jd-date-input" style={{ cursor: 'text' }}
              value={insp.pre_cfm50 || ''} disabled={!canEdit}
              placeholder="Pre blower door"
              onChange={e => saveInspection({ pre_cfm50: e.target.value })} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Post CFM50</label>
            <input type="number" className="jd-date-input" style={{ cursor: 'text' }}
              value={insp.post_cfm50 || ''} disabled={!canEdit}
              placeholder="Post blower door"
              onChange={e => saveInspection({ post_cfm50: e.target.value })} />
          </div>
        </div>
        {reduction !== null && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 'var(--radius)',
            background: reduction >= 25 ? '#f0fdf4' : '#fef3c7',
            border: `1px solid ${reduction >= 25 ? '#bbf7d0' : '#fde68a'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
              Air Seal Reduction: <strong>{reduction}%</strong>
            </span>
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: reduction >= 25 ? 'var(--color-success)' : 'var(--color-warning)'
            }}>
              {reduction >= 25 ? '✓ Meets 25% target' : '⚠ Below 25% target'}
            </span>
          </div>
        )}
      </div>

      {/* ── Duct Leakage Test ── */}
      <div className="jd-card">
        <div className="jd-card-title">Duct Leakage Test</div>
        <div className="jd-schedule-grid">
          <div className="jd-field">
            <label className="jd-field-label">Pre Duct Blaster (CFM25)</label>
            <input type="number" className="jd-date-input" style={{ cursor: 'text' }}
              value={insp.pre_cfm25 || ''} disabled={!canEdit}
              placeholder="CFM25"
              onChange={e => saveInspection({ pre_cfm25: e.target.value })} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Post Duct Blaster (CFM25)</label>
            <input type="number" className="jd-date-input" style={{ cursor: 'text' }}
              value={insp.post_cfm25 || ''} disabled={!canEdit}
              placeholder="CFM25"
              onChange={e => saveInspection({ post_cfm25: e.target.value })} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">% Reduction</label>
            <input className="jd-date-input" style={{ cursor: 'text' }}
              value={insp.cfm25_reduction || ''} disabled={!canEdit}
              placeholder="%"
              onChange={e => saveInspection({ cfm25_reduction: e.target.value })} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Combustion Post</label>
            <input className="jd-date-input" style={{ cursor: 'text' }}
              value={insp.combustion_post || ''} disabled={!canEdit}
              placeholder="Post-install reading"
              onChange={e => saveInspection({ combustion_post: e.target.value })} />
          </div>
        </div>
      </div>

      {/* ── Visual Inspection Checklist ── */}
      <div className="jd-card">
        <div className="jd-card-title">
          Visual Inspection Checklist ({visualDone}/{VISUAL_CHECKLIST.length})
        </div>
        {/* Progress bar */}
        <div style={{
          height: 6, borderRadius: 3, background: 'var(--color-border)', marginBottom: 14, overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${VISUAL_CHECKLIST.length ? (visualDone / VISUAL_CHECKLIST.length) * 100 : 0}%`,
            background: 'var(--color-success)',
            borderRadius: 3,
            transition: 'width 0.3s ease'
          }} />
        </div>

        {VISUAL_CHECKLIST.map(item => {
          const val = visualChecks[item] || '';
          return (
            <div key={item} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', borderBottom: '1px solid var(--color-border)'
            }}>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text)' }}>{item}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {['pass', 'fail', 'na'].map(opt => (
                  <button key={opt} type="button" disabled={!canEdit} onClick={() => setVisualCheck(item, val === opt ? '' : opt)}
                    style={{
                      padding: '4px 10px', borderRadius: 'var(--radius)', fontSize: 11, fontWeight: 600,
                      cursor: canEdit ? 'pointer' : 'default',
                      border: val === opt
                        ? `1px solid ${opt === 'pass' ? '#16a34a' : opt === 'fail' ? '#dc2626' : '#64748b'}`
                        : '1px solid var(--color-border)',
                      background: val === opt
                        ? (opt === 'pass' ? '#dcfce7' : opt === 'fail' ? '#fee2e2' : '#f1f5f9')
                        : 'var(--color-surface)',
                      color: val === opt
                        ? (opt === 'pass' ? '#166534' : opt === 'fail' ? '#991b1b' : '#475569')
                        : 'var(--color-text-muted)',
                    }}>
                    {opt === 'pass' ? 'Pass' : opt === 'fail' ? 'Fail' : 'N/A'}
                  </button>
                ))}
              </div>
              {/* Comment field per item */}
              <input style={{
                width: 120, fontSize: 11, padding: '4px 8px',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
                background: 'var(--color-surface)', color: 'var(--color-text)'
              }}
                defaultValue={visualChecks[item + '_comment'] || ''}
                disabled={!canEdit}
                placeholder="Comment"
                onBlur={e => {
                  if (e.target.value !== (visualChecks[item + '_comment'] || '')) {
                    saveInspection({ visual_checks: { ...visualChecks, [item + '_comment']: e.target.value } });
                  }
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ── QA/QC Sign-off ── */}
      <div className="jd-card">
        <div className="jd-card-title">QA/QC Sign-off</div>
        <div className="jd-field-grid">
          <div className="jd-field">
            <label className="jd-field-label">QA/QC Inspector</label>
            <input className="jd-date-input" style={{ cursor: 'text' }}
              value={qaqcResult.inspector || ''} disabled={!canEdit}
              placeholder="Inspector name"
              onChange={e => setQAQC('inspector', e.target.value)} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Inspection Date</label>
            <input type="date" className="jd-date-input"
              value={qaqcResult.date || ''} disabled={!canEdit}
              onChange={e => setQAQC('date', e.target.value)} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Overall Result</label>
            <select className="jd-date-input" value={qaqcResult.result || ''} disabled={!canEdit}
              onChange={e => setQAQC('result', e.target.value)}>
              <option value="">— Select —</option>
              <option value="pass">PASS</option>
              <option value="fail">FAIL</option>
            </select>
          </div>
        </div>
        {qaqcResult.result && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 'var(--radius)',
            background: qaqcResult.result === 'pass' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${qaqcResult.result === 'pass' ? '#bbf7d0' : '#fecaca'}`,
            fontSize: 14, fontWeight: 700,
            color: qaqcResult.result === 'pass' ? '#166534' : '#991b1b'
          }}>
            {qaqcResult.result === 'pass' ? '✓ QA/QC PASSED' : '✕ QA/QC FAILED'}
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <label className="jd-field-label">QA/QC Notes</label>
          <textarea style={{
            width: '100%', padding: '10px 12px', fontSize: 13,
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
            background: 'var(--color-surface)', color: 'var(--color-text)',
            minHeight: 60, resize: 'vertical'
          }}
            value={qaqcResult.notes || ''} disabled={!canEdit}
            placeholder="Overall inspection notes..."
            onChange={e => setQAQC('notes', e.target.value)}
          />
        </div>
      </div>

      {/* ── Closeout Checklist ── */}
      <div className="jd-card">
        <div className="jd-card-title">
          Closeout Checklist ({closeoutDone}/{CLOSEOUT_DOCS.length})
        </div>
        {/* Progress bar */}
        <div style={{
          height: 6, borderRadius: 3, background: 'var(--color-border)', marginBottom: 14, overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${CLOSEOUT_DOCS.length ? (closeoutDone / CLOSEOUT_DOCS.length) * 100 : 0}%`,
            background: 'var(--color-primary)',
            borderRadius: 3,
            transition: 'width 0.3s ease'
          }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {CLOSEOUT_DOCS.map(doc => (
            <label key={doc} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
              cursor: canEdit ? 'pointer' : 'default', fontSize: 13
            }}>
              <input type="checkbox" checked={!!closeoutChecks[doc]} disabled={!canEdit}
                style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
                onChange={() => setCloseoutCheck(doc, !closeoutChecks[doc])} />
              <span style={{
                textDecoration: closeoutChecks[doc] ? 'line-through' : 'none',
                color: closeoutChecks[doc] ? 'var(--color-text-muted)' : 'var(--color-text)'
              }}>
                {doc}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ── DB Checklist Items ── */}
      {(job.checklist || []).filter(c => c.item_type === 'job_paperwork').length > 0 && (
        <div className="jd-card">
          <div className="jd-card-title">Job Documentation</div>
          {(job.checklist || []).filter(c => c.item_type === 'job_paperwork').map(item => (
            <label key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '5px 0',
              cursor: canEdit ? 'pointer' : 'default'
            }}>
              <input type="checkbox" checked={!!item.completed} disabled={!canEdit}
                style={{ width: 16, height: 16, accentColor: 'var(--color-success)' }}
                onChange={async () => {
                  await api.updateChecklist(item.id, {
                    completed: !item.completed,
                    completed_by: user?.name || user?.email || 'Unknown'
                  });
                  onUpdate('_reload');
                }} />
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

      {/* ── Payment / Invoice ── */}
      <div className="jd-card">
        <div className="jd-card-title">Payment & Invoice</div>
        <div className="jd-schedule-grid">
          <div className="jd-field">
            <label className="jd-field-label">Invoice Amount ($)</label>
            <input type="number" className="jd-date-input" style={{ cursor: 'text' }}
              value={insp.invoice_amount || ''} disabled={!canEdit}
              placeholder="0.00"
              onChange={e => saveInspection({ invoice_amount: e.target.value })} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Payment Date</label>
            <input type="date" className="jd-date-input"
              value={insp.payment_date || ''} disabled={!canEdit}
              onChange={e => saveInspection({ payment_date: e.target.value })} />
          </div>
        </div>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13,
          cursor: canEdit ? 'pointer' : 'default'
        }}>
          <input type="checkbox" checked={!!insp.invoice_submitted} disabled={!canEdit}
            style={{ width: 16, height: 16, accentColor: 'var(--color-success)' }}
            onChange={() => saveInspection({ invoice_submitted: !insp.invoice_submitted })} />
          <span style={{ fontWeight: 600 }}>Invoice Submitted</span>
        </label>
      </div>
    </div>
  );
}
