import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../api';

// ── Helpers ──
function getScope(job) {
  try { return JSON.parse(job.scope_data || '{}'); } catch { return {}; }
}

function getAssessment(job) {
  try { return JSON.parse(job.assessment_data || '{}'); } catch { return {}; }
}

function getInspection(job) {
  try { return JSON.parse(job.inspection_data || '{}'); } catch { return {}; }
}

function getInstallData(job) {
  try { return JSON.parse(job.install_data || '{}'); } catch { return {}; }
}

function fmtVal(v) { return v != null && v !== '' ? String(v) : '\u2014'; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '\u2014'; }

// ── Print overlay (from hes-tracker savePrint.js) ──
function openPrintWindow(html) {
  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to view the print preview.'); return; }
  win.document.write(html);
  win.document.close();
}

// ── Scope of Work HTML builder ──
function buildScopeHTML(job) {
  const sc = getScope(job);
  const ad = getAssessment(job);
  const measures = sc.selected_measures || [];
  const hsMeasures = sc.hs_measures || [];

  const row = (label, val) =>
    `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #eee;font-size:12px"><span style="color:#555">${label}</span><span style="font-weight:600">${fmtVal(val)}</span></div>`;

  const section = (title) =>
    `<div style="margin:12px 0 6px;font-weight:bold;font-size:14px;border-bottom:2px solid #333;padding-bottom:3px">${title}</div>`;

  const measTable = measures.length
    ? `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:6px">
        <tr style="background:#f0fdf4"><th style="text-align:left;padding:4px 8px;border:1px solid #ccc">Measure</th></tr>
        ${measures.map(m => `<tr><td style="padding:4px 8px;border:1px solid #ddd">${m}</td></tr>`).join('')}
       </table>`
    : '<p style="color:#999;font-size:11px">No measures selected</p>';

  const hsTable = hsMeasures.length
    ? `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:6px">
        <tr style="background:#fffbeb"><th style="text-align:left;padding:4px 8px;border:1px solid #ccc">H&S Measure</th></tr>
        ${hsMeasures.map(m => `<tr><td style="padding:4px 8px;border:1px solid #ddd">${m}</td></tr>`).join('')}
       </table>`
    : '';

  return `<!DOCTYPE html><html><head><title>Scope of Work</title>
<style>@page{margin:.5in}body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#000;background:#fff}</style>
</head><body>
<div style="font-size:18px;font-weight:bold;border-bottom:2px solid #333;padding-bottom:8px;margin-bottom:4px">Scope of Work</div>
<div style="font-size:12px;color:#666;margin-bottom:16px">${fmtVal(job.customer_name)} &middot; ${fmtVal(job.address)} &middot; ${new Date().toLocaleDateString()}</div>
${section('Customer Information')}
${row('Customer', job.customer_name)}
${row('Address', job.address)}
${row('Program', job.program_name || '')}
${row('Status', job.status)}
${section('Energy Efficiency Measures (' + measures.length + ')')}
${measTable}
${hsMeasures.length ? section('Health & Safety Measures (' + hsMeasures.length + ')') : ''}
${hsTable}
${sc.notes ? section('Notes') + `<p style="font-size:12px;color:#333">${sc.notes}</p>` : ''}
</body></html>`;
}

// ── Authorization Form HTML builder ──
function buildAuthFormHTML(job) {
  const sigImg = job.customer_signature
    ? `<img src="${job.customer_signature}" style="max-width:300px;height:60px;object-fit:contain;display:block;margin-top:10px"/>`
    : '<div style="height:50px;border-bottom:1px solid #333;width:300px;margin-top:20px"></div>';

  const signedInfo = job.authorization_signed_at
    ? `<div style="font-size:10px;color:#666;margin-top:4px">Signed ${fmtDate(job.authorization_signed_at)} by ${fmtVal(job.customer_printed_name)}</div>`
    : '';

  return `<!DOCTYPE html><html><head><title>Customer Authorization</title>
<style>@page{margin:.5in}body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#000;background:#fff;font-size:12px;line-height:1.6}</style>
</head><body>
<div style="text-align:center;margin-bottom:24px">
<div style="font-size:20px;font-weight:900;letter-spacing:1px">ASSURED ENERGY SOLUTIONS</div>
<div style="font-size:12px;color:#555">Customer Authorization Form</div>
</div>
<div style="margin-bottom:16px">
<div><strong>Customer:</strong> ${fmtVal(job.customer_name)}</div>
<div><strong>Address:</strong> ${fmtVal(job.address)}</div>
<div><strong>Date:</strong> ${fmtDate(job.authorization_signed_at || new Date().toISOString())}</div>
</div>
<div style="border:1px solid #ccc;border-radius:6px;padding:16px;margin-bottom:24px">
<p>I hereby authorize Assured Energy Solutions to perform the energy efficiency improvements as described in the approved Scope of Work for my home at the above address.</p>
<p>I understand that:</p>
<ul>
<li>All work will be performed in accordance with program guidelines</li>
<li>An energy assessment has been completed to determine the recommended measures</li>
<li>Post-installation quality assurance inspection will be performed</li>
<li>I will receive documentation of all work performed</li>
</ul>
</div>
<div style="margin-top:30px">
<div style="font-size:11px;color:#666">Customer Signature:</div>
${sigImg}
<div style="font-size:11px;color:#666;margin-top:8px">Printed Name: ${fmtVal(job.customer_printed_name)}</div>
${signedInfo}
</div>
<div style="margin-top:30px;padding-top:12px;border-top:1px solid #ccc">
<div style="font-size:11px;color:#666">Contractor Representative: _______________________________ &nbsp;&nbsp; Date: _______________</div>
</div>
</body></html>`;
}

// ── Photo Report HTML builder ──
function buildPhotoReportHTML(job, photos) {
  const grouped = {};
  (photos || []).forEach(p => {
    const side = p.house_side || 'Other';
    if (!grouped[side]) grouped[side] = [];
    grouped[side].push(p);
  });

  const sections = Object.entries(grouped).map(([side, sidePhotos]) => {
    const items = sidePhotos.map(p =>
      `<div style="break-inside:avoid;margin-bottom:10px;border:1px solid #ddd;border-radius:6px;overflow:hidden;display:inline-block;width:48%;vertical-align:top;margin-right:2%">
        <div style="padding:6px 10px;background:#f5f5f5;font-size:11px;font-weight:600">${fmtVal(p.description)} <span style="font-weight:400;color:#888">(${p.phase || ''})</span></div>
        <div style="height:120px;display:flex;align-items:center;justify-content:center;background:#f9f9f9;font-size:10px;color:#999">Photo ID: ${p.id}</div>
        <div style="padding:3px 10px;font-size:9px;color:#999">${p.uploaded_by || ''} &middot; ${p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</div>
      </div>`
    ).join('');
    return `<div style="margin-bottom:20px"><h3 style="font-size:14px;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:10px">${side}</h3>${items}</div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><title>Photo Report</title>
<style>@page{margin:.4in}body{font-family:Arial,sans-serif;max-width:900px;margin:0 auto;padding:20px}h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:8px}h2{font-size:12px;color:#666;margin-bottom:16px}</style>
</head><body>
<h1>Photo Report</h1>
<h2>${fmtVal(job.customer_name)} &middot; ${fmtVal(job.address)} &middot; ${new Date().toLocaleDateString()}</h2>
${sections || '<p style="color:#999">No photos available</p>'}
</body></html>`;
}

// ── CSV export ──
function exportJobCSV(job) {
  const sc = getScope(job);
  const ad = getAssessment(job);
  const insp = getInspection(job);
  const inst = getInstallData(job);

  const fields = [
    ['Customer Name', job.customer_name],
    ['Address', job.address],
    ['Status', job.status],
    ['Program', job.program_name || ''],
    ['Created', fmtDate(job.created_at)],
    ['Install Date', fmtDate(job.install_date || job.abc_install_date)],
    ['Inspection Date', fmtDate(job.inspection_date)],
    ['Submission Date', fmtDate(job.submission_date)],
    ['Pre CFM50', insp.pre_cfm50 || ad?.diagnostics?.pre_cfm50 || ''],
    ['Post CFM50', insp.post_cfm50 || ad?.diagnostics?.post_cfm50 || ''],
    ['Scope Measures', (sc.selected_measures || []).join('; ')],
    ['H&S Measures', (sc.hs_measures || []).join('; ')],
    ['Scope Notes', sc.notes || ''],
    ['Estimate Amount', job.estimate_amount || ''],
    ['HVAC Tune Date', job.hvac_tune_clean_date || ''],
    ['HVAC Replace Date', job.hvac_replacement_date || ''],
    ['Permit Status', job.permit_status || ''],
    ['Invoice Submitted', insp.invoice_submitted ? 'Yes' : 'No'],
    ['Invoice Amount', insp.invoice_amount || ''],
  ];

  const csv = fields.map(([k, v]) => `"${k}","${String(v || '').replace(/"/g, '""')}"`).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(job.customer_name || 'job').replace(/[^a-zA-Z0-9]/g, '_')}_export.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportTab({ job, program, user }) {
  const [exportData, setExportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const sc = useMemo(() => getScope(job), [job.scope_data]);
  const insp = useMemo(() => getInspection(job), [job.inspection_data]);
  const inst = useMemo(() => getInstallData(job), [job.install_data]);

  useEffect(() => {
    setLoading(true);
    api.getJobExport(job.id)
      .then(setExportData)
      .catch(err => console.error('Failed to load export:', err))
      .finally(() => setLoading(false));
  }, [job.id]);

  // ── Stats ──
  const measures = sc.selected_measures || [];
  const measureStatus = inst.measure_status || {};
  const installedCount = measures.filter(m => measureStatus[m]?.installed).length;
  const photoCount = exportData?.photo_count || (job.photos || []).length;
  const checklistTotal = (job.checklist || []).length;
  const checklistDone = (job.checklist || []).filter(c => c.completed).length;

  // Phase completion
  const phases = [
    { label: 'Assessment', done: !!job.assessment_data },
    { label: 'Scope', done: !!job.scope_data && measures.length > 0 },
    { label: 'Install', done: installedCount === measures.length && measures.length > 0 },
    { label: 'Inspection', done: insp.qaqc_result?.result === 'pass' },
    { label: 'Submitted', done: job.status === 'submitted' || job.status === 'complete' },
  ];
  const phasesComplete = phases.filter(p => p.done).length;

  return (
    <div>
      {/* ── Completion Stats ── */}
      <div className="jd-card">
        <div className="jd-card-title">Job Completion Summary</div>
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card blue">
            <div className="stat-value">{phasesComplete}/{phases.length}</div>
            <div className="stat-label">Phases Complete</div>
          </div>
          <div className="stat-card green">
            <div className="stat-value">{photoCount}</div>
            <div className="stat-label">Photos Uploaded</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-value">{measures.length}</div>
            <div className="stat-label">Measures in Scope</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{installedCount}/{measures.length || 0}</div>
            <div className="stat-label">Measures Installed</div>
          </div>
        </div>

        {/* Phase progress */}
        <div style={{ marginTop: 16 }}>
          {phases.map(p => (
            <div key={p.label} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                background: p.done ? '#dcfce7' : 'var(--color-surface-alt)',
                color: p.done ? '#166534' : 'var(--color-text-muted)',
                border: `1px solid ${p.done ? '#bbf7d0' : 'var(--color-border)'}`
              }}>
                {p.done ? '✓' : '·'}
              </span>
              <span style={{
                fontSize: 13, fontWeight: 500,
                color: p.done ? 'var(--color-success)' : 'var(--color-text-muted)'
              }}>
                {p.label}
              </span>
            </div>
          ))}
        </div>

        {/* Checklist progress */}
        {checklistTotal > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>
              Documentation: {checklistDone}/{checklistTotal} items complete
            </div>
            <div style={{
              height: 6, borderRadius: 3, background: 'var(--color-border)', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${checklistTotal ? (checklistDone / checklistTotal) * 100 : 0}%`,
                background: 'var(--color-primary)',
                borderRadius: 3,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Export Buttons ── */}
      <div className="jd-card">
        <div className="jd-card-title">Export & Print</div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12
        }}>
          {/* Print Scope of Work */}
          <button className="btn btn-primary" style={{ padding: '14px 20px', fontSize: 14 }}
            onClick={() => openPrintWindow(buildScopeHTML(job))}>
            <span style={{ display: 'block', fontSize: 18, marginBottom: 4 }}>📋</span>
            Print Scope of Work
          </button>

          {/* Print Authorization Form */}
          <button className="btn btn-primary" style={{ padding: '14px 20px', fontSize: 14 }}
            onClick={() => openPrintWindow(buildAuthFormHTML(job))}>
            <span style={{ display: 'block', fontSize: 18, marginBottom: 4 }}>📝</span>
            Print Authorization Form
          </button>

          {/* Export Photo Report */}
          <button className="btn btn-secondary" style={{ padding: '14px 20px', fontSize: 14 }}
            disabled={loading}
            onClick={() => {
              const photos = exportData?.photos_by_phase
                ? Object.values(exportData.photos_by_phase).flatMap(sides =>
                  Object.values(sides).flat()
                )
                : (job.photos || []);
              openPrintWindow(buildPhotoReportHTML(job, photos));
            }}>
            <span style={{ display: 'block', fontSize: 18, marginBottom: 4 }}>📸</span>
            Export Photo Report
          </button>

          {/* Export to CSV */}
          <button className="btn btn-secondary" style={{ padding: '14px 20px', fontSize: 14 }}
            onClick={() => exportJobCSV(job)}>
            <span style={{ display: 'block', fontSize: 18, marginBottom: 4 }}>📊</span>
            Export to CSV
          </button>
        </div>
      </div>

      {/* ── Photo Summary ── */}
      {exportData && (
        <div className="jd-card">
          <div className="jd-card-title">Photo Summary</div>
          <div className="stats-grid" style={{ marginBottom: 16 }}>
            <div style={{ padding: 14, background: '#e3f2fd', borderRadius: 'var(--radius)', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>{exportData.photo_count || 0}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Total Photos</div>
            </div>
            <div style={{ padding: 14, background: '#fff3e0', borderRadius: 'var(--radius)', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-warning)' }}>{exportData.pre_installation_count || 0}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Pre-Install</div>
            </div>
            <div style={{ padding: 14, background: '#e8f5e9', borderRadius: 'var(--radius)', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-success)' }}>{exportData.post_installation_count || 0}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Post-Install</div>
            </div>
          </div>

          {/* Photos by side */}
          {exportData.house_sides && (
            <div>
              <h4 style={{ fontSize: 13, marginBottom: 8, color: 'var(--color-text)' }}>Photos by Side of House</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                {(exportData.house_sides || []).map(side => {
                  const allPhasePhotos = exportData.photos_by_phase || {};
                  let count = 0;
                  Object.values(allPhasePhotos).forEach(sides => {
                    if (sides[side]) count += sides[side].length;
                  });
                  return (
                    <div key={side} style={{
                      padding: '10px 14px', border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)', textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>{count}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{side}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="jd-card">
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
            Loading export data...
          </p>
        </div>
      )}
    </div>
  );
}
