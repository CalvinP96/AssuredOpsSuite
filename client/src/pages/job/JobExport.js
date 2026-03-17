import React, { useMemo } from 'react';
import { generatePreWorkSOW, generatePostWorkSOW, printSOW } from '../../utils';

function getScope(job) {
  try { return JSON.parse(job.scope_data || '{}'); } catch { return {}; }
}

function getMeasures(job) {
  const sc = getScope(job);
  return sc.selected_measures?.map(name => ({ name, qty: 1, unit: 'ea' })) || [];
}

function hasHSConditions(job) {
  const sc = getScope(job);
  return (sc.hs_measures || []).length > 0;
}

function getPhotos(job, timing) {
  return (job.photos || []).filter(p => (p.timing || '').toLowerCase() === timing);
}

export default function JobExport({ job, canEdit, isAdmin, onUpdate, user }) {
  const scope = useMemo(() => getScope(job), [job.scope_data]);
  const measures = useMemo(() => getMeasures(job), [job.scope_data]);
  const hsFlag = hasHSConditions(job);
  const prePhotos = getPhotos(job, 'pre');
  const postPhotos = getPhotos(job, 'post');

  const checklist = [
    {
      key: 'auth',
      label: 'Customer Authorization signed',
      done: !!job.authorization_signed_at,
      status: job.authorization_signed_at ? 'Signed' : 'Missing',
    },
    ...(hsFlag ? [{
      key: 'hs',
      label: 'H&S Consent signed',
      done: !!job.hs_consent_signed_at,
      status: job.hs_consent_signed_at ? 'Signed' : 'Missing',
    }] : []),
    {
      key: 'pre_photos',
      label: 'Pre-photos uploaded',
      done: prePhotos.length > 0,
      status: prePhotos.length > 0 ? `${prePhotos.length} photos` : 'None',
    },
    {
      key: 'scope',
      label: 'Scope of Work complete',
      done: measures.length > 0,
      status: measures.length > 0 ? `${measures.length} measures` : 'Incomplete',
    },
    {
      key: 'pre_sow',
      label: 'Pre-Work SOW signed',
      done: !!job.pre_sow_signed_at,
      status: job.pre_sow_signed_at ? 'Signed' : 'Missing',
    },
    {
      key: 'post_sow',
      label: 'Post-Work SOW signed',
      done: !!job.post_sow_signed_at,
      status: job.post_sow_signed_at ? 'Signed' : 'Missing',
    },
    {
      key: 'post_photos',
      label: 'Post-photos uploaded',
      done: postPhotos.length > 0,
      status: postPhotos.length > 0 ? `${postPhotos.length} photos` : 'None',
    },
    {
      key: 'inspection',
      label: 'Final Inspection signed',
      done: !!job.inspection_signed_at,
      status: job.inspection_signed_at ? 'Signed' : 'Missing',
    },
  ];

  const allComplete = checklist.every(c => c.done);

  const handlePrintPreSOW = () => {
    const html = generatePreWorkSOW(job, measures);
    printSOW(html);
  };

  const handlePrintPostSOW = () => {
    const changeOrders = job.change_orders || [];
    const html = generatePostWorkSOW(job, measures, changeOrders);
    printSOW(html);
  };

  const handlePhotoReport = () => {
    const all = [...prePhotos, ...postPhotos];
    const rows = all.map(p =>
      `<tr><td>${p.description || p.zone || ''}</td><td>${(p.timing || '').toUpperCase()}</td>` +
      `<td>${p.url ? `<img src="${p.url}" style="max-width:200px;max-height:140px"/>` : 'No image'}</td></tr>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><title>Photo Report</title>
<style>body{font-family:sans-serif;padding:24px;max-width:900px;margin:0 auto}table{width:100%;border-collapse:collapse}th,td{padding:8px 12px;border:1px solid #ddd;text-align:left}th{background:#f1f5f9}</style>
</head><body><h1>Photo Report &mdash; ${job.customer_name || ''}</h1><p>${job.address || ''}</p>
<table><thead><tr><th>Description</th><th>Timing</th><th>Photo</th></tr></thead><tbody>${rows || '<tr><td colspan="3">No photos</td></tr>'}</tbody></table></body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const handleMarkSubmitted = async () => {
    await onUpdate({
      status: 'submitted',
      submitted_for_payment_at: new Date().toISOString(),
      submitted_for_payment_by: user?.full_name || user?.email || 'Admin',
    });
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* SUBMISSION CHECKLIST */}
      <div className="jd-card">
        <div className="jd-card-title">Submission Checklist</div>
        {checklist.map(item => (
          <div key={item.key} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0', borderBottom: '1px solid var(--color-border)',
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700,
              background: item.done ? '#dcfce7' : '#fee2e2',
              color: item.done ? '#166534' : '#991b1b',
              flexShrink: 0,
            }}>
              {item.done ? '\u2713' : '\u2717'}
            </span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{item.label}</span>
            <span style={{
              fontSize: 12, color: item.done ? 'var(--color-success)' : 'var(--color-text-muted)',
            }}>
              {item.status}
            </span>
          </div>
        ))}
        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: allComplete ? 'var(--color-success)' : 'var(--color-warning)' }}>
          {allComplete ? 'All items complete — ready to export' : `${checklist.filter(c => c.done).length}/${checklist.length} complete`}
        </div>
      </div>

      {/* EXPORT ACTIONS */}
      <div className="jd-card">
        <div className="jd-card-title">Export Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <button className="btn btn-primary" disabled={!allComplete} onClick={handlePrintPreSOW}>
            Print Pre-Work SOW
          </button>
          <button className="btn btn-primary" disabled={!allComplete} onClick={handlePrintPostSOW}>
            Print Post-Work SOW
          </button>
          <button className="btn btn-secondary" disabled={!allComplete} onClick={handlePhotoReport}>
            Export Photo Report
          </button>
          <button className="btn btn-secondary" disabled title="Coming soon">
            Download All Forms (ZIP)
          </button>
        </div>
      </div>

      {/* PAYMENT SUBMISSION — standalone card */}
      <div className="jd-card" style={job.submitted_for_payment_at ? { borderLeft: '4px solid var(--color-success)' } : { borderLeft: '4px solid var(--color-border)' }}>
        <div className="jd-card-title">Payment Submission</div>

        {job.submitted_for_payment_at ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <span style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: 15 }}>Submitted for Payment</span>
            </div>
            {isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <label className="form-label">Submission Date</label>
                  <input
                    type="date"
                    defaultValue={job.submitted_for_payment_at?.split('T')[0]}
                    onBlur={e => onUpdate({ submitted_for_payment_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    style={{ width: 160 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 18 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    By {job.submitted_for_payment_by || '—'}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                    onClick={() => {
                      if (window.confirm('Clear submission status? This will remove the submitted date and revert status.')) {
                        onUpdate({ submitted_for_payment_at: null, submitted_for_payment_by: null, status: 'invoiced' });
                      }
                    }}
                  >
                    Clear Submission
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              Mark this job as submitted for payment to RISE. This records the submission date and highlights the job in green.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {isAdmin ? (
                <button
                  className="btn btn-primary"
                  style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                  onClick={handleMarkSubmitted}
                >
                  ✓ Submit for Payment
                </button>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Admin only</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
