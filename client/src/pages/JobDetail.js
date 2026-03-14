import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api';
import LazyPhoto from '../components/LazyPhoto';
import AssessmentTab from './AssessmentTab';

const JOB_STATUSES = ['assessment_scheduled', 'assessment_complete', 'pre_approval', 'approved', 'install_scheduled', 'install_in_progress', 'inspection', 'submitted', 'invoiced', 'complete', 'deferred'];
const UTILITIES = ['ComEd', 'Nicor Gas', 'Peoples Gas', 'North Shore Gas'];
const HOUSE_SIDES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Interior', 'Other'];
const PHOTO_PHASES = ['assessment', 'pre_install', 'post_install', 'hvac', 'inspection'];

const PHASE_STEPS = [
  { key: 'inquiry', label: 'Inquiry', statuses: [] },
  { key: 'assessment', label: 'Assessment', statuses: ['assessment_scheduled'] },
  { key: 'scope', label: 'Scope', statuses: ['assessment_complete', 'pre_approval'] },
  { key: 'install', label: 'Install', statuses: ['approved', 'install_scheduled', 'install_in_progress'] },
  { key: 'inspection', label: 'Inspection', statuses: ['inspection'] },
  { key: 'billing', label: 'Billing', statuses: ['submitted', 'invoiced'] },
  { key: 'complete', label: 'Complete', statuses: ['complete'] },
];

const PHASE_COLORS = {
  inquiry: { bg: '#e2e8f0', text: '#475569' },
  assessment: { bg: '#dbeafe', text: '#1e40af' },
  scope: { bg: '#fef3c7', text: '#92400e' },
  install: { bg: '#e0e7ff', text: '#3730a3' },
  inspection: { bg: '#d1fae5', text: '#065f46' },
  billing: { bg: '#fce7f3', text: '#9d174d' },
  complete: { bg: '#dcfce7', text: '#166534' },
  deferred: { bg: '#fee2e2', text: '#991b1b' },
};

export default function JobDetail({ role }) {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [program, setProgram] = useState(null);
  const [tab, setTab] = useState('overview');
  const [exportData, setExportData] = useState(null);
  const [photoModal, setPhotoModal] = useState(null);
  const cameraRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const canEdit = ['Admin', 'Operations', 'Program Manager', 'Assessor', 'Installer', 'HVAC'].includes(role);

  const load = useCallback(() => {
    api.getJobDetail(jobId).then(setJob).catch(() => {});
  }, [jobId]);

  const loadProgram = useCallback(() => {
    api.getHesIeProgram().then(p => {
      if (p && p.id) api.getProgram(p.id).then(setProgram);
    });
  }, []);

  useEffect(() => { load(); loadProgram(); }, [load, loadProgram]);

  const updateField = async (field, value) => {
    try {
      const updated = { ...job, [field]: value };
      setJob(updated);
      await api.updateJob(jobId, updated);
      load();
    } catch (err) { alert('Failed to update: ' + err.message); }
  };

  const saveAssessment = async (data) => {
    try { await api.saveAssessmentData(jobId, data); } catch (err) { alert('Failed to save assessment: ' + err.message); }
  };

  const saveScope = async (data) => {
    try { await api.saveScopeData(jobId, data); } catch (err) { alert('Failed to save scope: ' + err.message); }
  };

  const getAssessment = () => {
    try { return JSON.parse(job.assessment_data || '{}'); } catch { return {}; }
  };

  const getScope = () => {
    try { return JSON.parse(job.scope_data || '{}'); } catch { return {}; }
  };

  // Photo handling
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setCameraStream(stream);
      if (cameraRef.current) cameraRef.current.srcObject = stream;
    } catch (err) {
      alert('Camera access denied or not available. You can still upload photos from your gallery.');
    }
  };

  const captureFromCamera = () => {
    if (!cameraRef.current || !canvasRef.current) return;
    const video = cameraRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setCapturedPhoto(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const submitPhoto = async (phase, description, houseSide, measureName) => {
    if (!capturedPhoto && !photoModal?.ref) return;
    try {
      await api.uploadPhoto(jobId, {
        uploaded_by: role, role: role, phase: phase,
        measure_name: measureName || null, house_side: houseSide || null,
        description: description, photo_data: capturedPhoto || null,
        photo_ref: photoModal?.ref || null,
        file_name: `${phase}_${houseSide || 'general'}_${Date.now()}.jpg`
      });
      setCapturedPhoto(null);
      setPhotoModal(null);
      load();
    } catch (err) { alert('Failed to upload photo: ' + err.message); }
  };

  const loadExport = async () => {
    try { const data = await api.getJobExport(jobId); setExportData(data); } catch (err) { alert('Failed to load export: ' + err.message); }
  };

  if (!job) return <div className="card" style={{ padding: 30 }}>Loading project...</div>;

  const ad = getAssessment();
  const sc = getScope();
  const utilities = (job.utility || '').split(',').map(u => u.trim()).filter(Boolean);

  // Assessment form helpers
  const aSet = (section, field, val) => {
    const updated = { ...ad, [section]: { ...(ad[section] || {}), [field]: val } };
    saveAssessment(updated);
  };
  const aVal = (section, field) => (ad[section] || {})[field] || '';
  const yn = (section, field) => (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      <label style={{ fontSize: 11 }}><input type="radio" name={`jd-${section}-${field}`} checked={aVal(section, field) === 'yes'} onChange={() => aSet(section, field, 'yes')} disabled={!canEdit} /> Y</label>
      <label style={{ fontSize: 11 }}><input type="radio" name={`jd-${section}-${field}`} checked={aVal(section, field) === 'no'} onChange={() => aSet(section, field, 'no')} disabled={!canEdit} /> N</label>
    </span>
  );
  const txt = (section, field, ph, w) => (
    <input style={{ width: w || 100, fontSize: 11, padding: '2px 4px', border: '1px solid #ccc', borderRadius: 3 }}
      defaultValue={aVal(section, field)} placeholder={ph} disabled={!canEdit}
      onBlur={e => aSet(section, field, e.target.value)} />
  );
  const sel = (section, field, opts) => (
    <select style={{ fontSize: 11, padding: '2px 4px' }} value={aVal(section, field)} disabled={!canEdit}
      onChange={e => aSet(section, field, e.target.value)}>
      <option value="">--</option>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const hs = { background: '#8a8a8a', color: '#fff', padding: '6px 12px', fontWeight: 700, fontSize: 13 };
  const ss = { padding: '10px 12px', borderBottom: '1px solid #ddd' };
  const gs = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px 16px', fontSize: 12 };
  const fs = { display: 'flex', alignItems: 'center', gap: 4, padding: '3px 0' };

  // Determine current phase from status
  const currentPhaseIdx = PHASE_STEPS.findIndex(p => p.statuses.includes(job.status));
  const isDone = job.status === 'complete';
  const isDeferred = job.status === 'deferred';
  const currentPhaseKey = isDeferred ? 'deferred' : isDone ? 'complete' : currentPhaseIdx >= 0 ? PHASE_STEPS[currentPhaseIdx].key : 'inquiry';
  const phaseColor = PHASE_COLORS[currentPhaseKey] || PHASE_COLORS.inquiry;

  // Tab config by role
  const getVisibleTabs = () => {
    if (role === 'Assessor') return [
      { key: 'overview', label: 'Overview' },
      { key: 'assessment', label: 'MS Forms Survey' },
      { key: 'photos', label: 'Photos' },
    ];
    if (role === 'Scope Creator') return [
      { key: 'overview', label: 'Overview' },
      { key: 'assessment', label: 'Assessor Data' },
      { key: 'scope', label: 'Scope of Work' },
      { key: 'photos', label: 'Photos' },
      { key: 'scheduling', label: 'Scheduling' },
    ];
    if (role === 'Installer') return [
      { key: 'overview', label: 'Overview' },
      { key: 'scope', label: 'Scope of Work' },
      { key: 'install', label: 'Installation' },
      { key: 'photos', label: 'Photos' },
      { key: 'checklist', label: 'Checklist' },
      { key: 'change_orders', label: 'Change Orders' },
    ];
    if (role === 'HVAC') return [
      { key: 'overview', label: 'Overview' },
      { key: 'hvac', label: 'HVAC' },
      { key: 'photos', label: 'Photos' },
    ];
    // Admin, Operations, Program Manager, etc.
    return [
      { key: 'overview', label: 'Overview' },
      { key: 'assessment', label: 'Assessment' },
      { key: 'scope', label: 'Scope of Work' },
      { key: 'install', label: 'Installation' },
      { key: 'hvac', label: 'HVAC' },
      { key: 'inspection', label: 'Inspection' },
      { key: 'photos', label: 'Photos' },
      { key: 'forms', label: 'Forms & Docs' },
      { key: 'export', label: 'Export' },
    ];
  };

  const visibleTabs = getVisibleTabs();

  // tabStyle removed — using CSS classes .jd-tab / .jd-tab.active


  // Photo capture modal component
  const PhotoCaptureModal = () => {
    const [desc, setDesc] = useState('');
    const [side, setSide] = useState('');
    const [phase, setPhase] = useState(photoModal?.phase || 'assessment');
    const [measure, setMeasure] = useState('');
    const [ref, setRef] = useState('');

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, maxWidth: 600, width: '95%', maxHeight: '90vh', overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Capture Photo</h3>
            <button onClick={() => { stopCamera(); setCapturedPhoto(null); setPhotoModal(null); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>X</button>
          </div>
          <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden', marginBottom: 12, position: 'relative', minHeight: 200 }}>
            {cameraStream && !capturedPhoto && (
              <video ref={cameraRef} autoPlay playsInline style={{ width: '100%', display: 'block' }}
                onLoadedMetadata={() => { if (cameraRef.current) cameraRef.current.play(); }} />
            )}
            {capturedPhoto && <img src={capturedPhoto} alt="Captured" style={{ width: '100%', display: 'block' }} />}
            {!cameraStream && !capturedPhoto && (
              <div style={{ color: '#aaa', textAlign: 'center', padding: 40, fontSize: 14 }}>Use camera or upload a photo</div>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {!cameraStream && !capturedPhoto && (
              <>
                <button className="btn btn-primary" onClick={startCamera} style={{ fontSize: 12, padding: '6px 14px' }}>Open Camera</button>
                <label className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 14px', cursor: 'pointer' }}>
                  Upload from Gallery
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </>
            )}
            {cameraStream && !capturedPhoto && (
              <button className="btn btn-success" onClick={captureFromCamera} style={{ fontSize: 12, padding: '8px 20px' }}>Take Photo</button>
            )}
            {capturedPhoto && (
              <button className="btn btn-warning" onClick={() => setCapturedPhoto(null)} style={{ fontSize: 12, padding: '6px 14px' }}>Retake</button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600 }}>Phase</label>
              <select value={phase} onChange={e => setPhase(e.target.value)} style={{ width: '100%', fontSize: 12, padding: '4px 6px' }}>
                {PHOTO_PHASES.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600 }}>Side of House</label>
              <select value={side} onChange={e => setSide(e.target.value)} style={{ width: '100%', fontSize: 12, padding: '4px 6px' }}>
                <option value="">-- Select Side --</option>
                {HOUSE_SIDES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600 }}>Measure (optional)</label>
              <select value={measure} onChange={e => setMeasure(e.target.value)} style={{ width: '100%', fontSize: 12, padding: '4px 6px' }}>
                <option value="">-- General --</option>
                {(job.measures || []).map(m => <option key={m.id} value={m.measure_name}>{m.measure_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600 }}>Company Cam Ref (optional)</label>
              <input value={ref} onChange={e => setRef(e.target.value)} placeholder="Ref link" style={{ width: '100%', fontSize: 12, padding: '4px 6px' }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600 }}>Description *</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this photo of?"
              style={{ width: '100%', fontSize: 12, padding: '6px 8px' }} />
          </div>
          <button className="btn btn-success" disabled={!desc || (!capturedPhoto && !ref)}
            onClick={() => { submitPhoto(phase, desc, side, measure); }}
            style={{ width: '100%', padding: '10px', fontSize: 14 }}>
            Save Photo
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="jd-page">
      {/* Back button */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/hes-ie')} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }}>
          &#8592; Back to Jobs
        </button>
      </div>

      {/* Header Card */}
      <div className="jd-header">
        <div className="jd-header-left">
          <h2 className="jd-header-name">{job.customer_name || 'Unnamed Project'}</h2>
          <div className="jd-header-meta">
            {job.job_number && <span>#{job.job_number}</span>}
            <span>{job.address}, {job.city} {job.zip}</span>
            <span>Assured Energy Solutions</span>
          </div>
        </div>
        <div className="jd-header-right">
          <span className="jd-status-pill" style={{ background: phaseColor.bg, color: phaseColor.text }}>
            {isDeferred ? 'DEFERRED' : job.status.replace(/_/g, ' ')}
          </span>
          {canEdit && <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={load}>Save</button>}
        </div>
      </div>

      {/* Phase Timeline — Desktop Stepper */}
      <div className="jd-stepper">
        {PHASE_STEPS.map((step, i) => {
          const isActive = i === currentPhaseIdx;
          const isPast = isDone || (currentPhaseIdx >= 0 && i < currentPhaseIdx);
          const state = isPast ? 'done' : isActive ? 'active' : 'future';
          return (
            <React.Fragment key={step.key}>
              {i > 0 && <div className={`jd-step-line ${isPast ? 'done' : 'future'}`} />}
              <div className="jd-step">
                <div className={`jd-step-circle ${state}`}>
                  {isPast ? '\u2713' : i + 1}
                </div>
                <div className={`jd-step-label ${state}`}>{step.label}</div>
              </div>
            </React.Fragment>
          );
        })}
        {isDeferred && <div className="jd-deferred-badge">DEFERRED</div>}
      </div>

      {/* Phase Timeline — Mobile Compact */}
      <div className="jd-stepper-mobile">
        {isDeferred ? 'DEFERRED' : isDone ? 'Complete' : currentPhaseIdx >= 0
          ? `Step ${currentPhaseIdx + 1} of ${PHASE_STEPS.length}: ${PHASE_STEPS[currentPhaseIdx].label}`
          : 'Step 1 of 7: Inquiry'}
      </div>

      {/* Tab Bar — scrollable */}
      <div className="jd-tabs">
        {visibleTabs.map(t => (
          <button key={t.key} className={`jd-tab${tab === t.key ? ' active' : ''}`} onClick={() => { setTab(t.key); if (t.key === 'export') loadExport(); }}>
            {t.label}
          </button>
        ))}
      </div>


      {/* ===================== OVERVIEW TAB ===================== */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Customer Information Card */}
          <div className="jd-card">
            <div className="jd-card-title">Customer Information</div>
            <div className="jd-field-grid">
              <div className="jd-field">
                <label className="jd-field-label">Customer Name</label>
                <input defaultValue={job.customer_name} disabled={!canEdit} onBlur={e => updateField('customer_name', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Phone</label>
                <input defaultValue={job.phone} disabled={!canEdit} onBlur={e => updateField('phone', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Email</label>
                <input defaultValue={job.email} disabled={!canEdit} onBlur={e => updateField('email', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Address</label>
                <input defaultValue={job.address} disabled={!canEdit} onBlur={e => updateField('address', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">City</label>
                <input defaultValue={job.city} disabled={!canEdit} onBlur={e => updateField('city', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Zip</label>
                <input defaultValue={job.zip} disabled={!canEdit} onBlur={e => updateField('zip', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Job Number</label>
                <input defaultValue={job.job_number} disabled={!canEdit} onBlur={e => updateField('job_number', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Contractor</label>
                <input value="Assured Energy Solutions" disabled />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="jd-field-label" style={{ marginBottom: 6, display: 'block' }}>Utility Company</label>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {UTILITIES.map(u => (
                    <label key={u} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: canEdit ? 'pointer' : 'default' }}>
                      <input type="checkbox" checked={utilities.includes(u)} disabled={!canEdit}
                        onChange={e => {
                          const newUtils = e.target.checked ? [...utilities, u] : utilities.filter(x => x !== u);
                          updateField('utility', newUtils.join(', '));
                        }} />
                      {u}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Project Status Card */}
          <div className="jd-card">
            <div className="jd-card-title">Project Status</div>
            <div className="jd-field-grid">
              <div className="jd-field">
                <label className="jd-field-label">Status</label>
                <select value={job.status} disabled={!canEdit} onChange={e => updateField('status', e.target.value)}>
                  {JOB_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Estimate Amount</label>
                <input type="number" defaultValue={job.estimate_amount} disabled={!canEdit}
                  onBlur={e => updateField('estimate_amount', parseFloat(e.target.value) || null)} placeholder="$0.00" />
              </div>
              <div className="jd-field" style={{ gridColumn: '1 / -1' }}>
                <label className="jd-field-label">Notes</label>
                <textarea defaultValue={job.notes} disabled={!canEdit} onBlur={e => updateField('notes', e.target.value)} />
              </div>
            </div>
            <div className="jd-summary-pills">
              <span className="jd-summary-pill" style={{ background: '#dbeafe', color: '#1e40af' }}>
                {(job.photos || []).length} Photos
              </span>
              <span className="jd-summary-pill" style={{ background: '#dcfce7', color: '#166534' }}>
                {(job.measures || []).length} Measures
              </span>
              <span className="jd-summary-pill" style={{ background: '#fef3c7', color: '#92400e' }}>
                {(job.change_orders || []).filter(c => c.status === 'pending').length} Pending COs
              </span>
            </div>
          </div>

          {/* Scheduling Card */}
          <div className="jd-card">
            <div className="jd-card-title">Scheduling</div>
            <div className="jd-schedule-grid">
              <div className="jd-field">
                <label className="jd-field-label">Assessment Date</label>
                <input type="date" className="jd-date-input" value={job.assessment_date || ''} disabled={!canEdit}
                  onChange={e => updateField('assessment_date', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Assessment Scheduled</label>
                <input type="date" className="jd-date-input" value={job.assessment_scheduled || ''} disabled={!canEdit}
                  onChange={e => updateField('assessment_scheduled', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Install Date</label>
                <input type="date" className="jd-date-input" value={job.install_date || ''} disabled={!canEdit}
                  onChange={e => updateField('install_date', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Install Scheduled</label>
                <input type="date" className="jd-date-input" value={job.install_scheduled || ''} disabled={!canEdit}
                  onChange={e => updateField('install_scheduled', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Permit Tracking Card */}
          <div className="jd-card">
            <div className="jd-card-title">Permit Tracking</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: canEdit ? 'pointer' : 'default' }}>
              <input type="checkbox" checked={!!job.needs_permit} disabled={!canEdit}
                onChange={e => updateField('needs_permit', e.target.checked ? 1 : 0)}
                style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
              <strong>Needs Permit</strong>
            </label>
            {job.needs_permit ? (
              <div className="jd-permit-fields">
                <div className="jd-field">
                  <label className="jd-field-label">Permit Status</label>
                  <select value={job.permit_status || 'not_applied'} disabled={!canEdit} onChange={e => updateField('permit_status', e.target.value)}>
                    <option value="not_applied">Not Applied</option>
                    <option value="applied">Applied</option>
                    <option value="received">Received</option>
                    <option value="issue">Issue</option>
                  </select>
                </div>
                <div className="jd-field">
                  <label className="jd-field-label">Date Applied</label>
                  <input type="date" className="jd-date-input" value={job.permit_applied_date || ''} disabled={!canEdit}
                    onChange={e => updateField('permit_applied_date', e.target.value)} />
                </div>
                <div className="jd-field">
                  <label className="jd-field-label">Date Received</label>
                  <input type="date" className="jd-date-input" value={job.permit_received_date || ''} disabled={!canEdit}
                    onChange={e => updateField('permit_received_date', e.target.value)} />
                </div>
                <div className="jd-field">
                  <label className="jd-field-label">Permit Number</label>
                  <input defaultValue={job.permit_number} disabled={!canEdit}
                    onBlur={e => updateField('permit_number', e.target.value)} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}


      {/* ===================== ASSESSMENT TAB ===================== */}
      {tab === 'assessment' && (
        <AssessmentTab job={job} onSave={saveAssessment} />
      )}


      {/* ===================== SCOPE OF WORK TAB ===================== */}
      {tab === 'scope' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Assessor Recommendations in Scope View */}
          {(() => {
            const recs = ad.recommendations || {};
            const recItems = ['attic_insulation', 'wall_insulation', 'basement_insulation', 'air_sealing', 'duct_sealing', 'rim_joist', 'hvac_tune_clean', 'hvac_replacement', 'thermostat', 'exhaust_fans', 'detectors', 'hs_repairs'].filter(r => recs[r] === 'yes');
            if (recItems.length === 0 && !recs.details) return null;
            return (
              <div style={{ padding: '10px 16px', background: '#fff3e0', borderBottom: '1px solid #ffe0b2' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e65100', marginBottom: 4 }}>Assessor Recommended:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {recItems.map(r => (
                    <span key={r} style={{ fontSize: 10, padding: '2px 6px', background: '#e8f5e9', borderRadius: 3, border: '1px solid #c8e6c9' }}>{r.replace(/_/g, ' ')}</span>
                  ))}
                </div>
                {recs.details && <p style={{ fontSize: 10, color: '#666', margin: '4px 0 0' }}>{recs.details}</p>}
              </div>
            );
          })()}
          <div style={{ padding: '12px 16px', background: '#0f3460', color: '#fff' }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Scope of Work {role === 'Scope Creator' ? '(You Have Final Say)' : ''}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 11, opacity: 0.85 }}>Select measures and build the scope based on the 2026 HES IE form and assessor recommendations.</p>
          </div>
          {program && (() => {
            const canScope = ['Admin', 'Operations', 'Program Manager', 'Scope Creator'].includes(role);
            const measures = program.measures || [];
            const selectedMeasures = sc.selected_measures || [];
            const toggleMeasure = (name) => {
              if (!canScope) return;
              const updated = selectedMeasures.includes(name) ? selectedMeasures.filter(m => m !== name) : [...selectedMeasures, name];
              const newScope = { ...sc, selected_measures: updated };
              saveScope(newScope);
            };

            const suggestions = [];
            if (aVal('recommendations', 'attic_insulation') === 'yes') suggestions.push('Attic Insulation');
            if (aVal('recommendations', 'wall_insulation') === 'yes') suggestions.push('Wall Insulation');
            if (aVal('recommendations', 'basement_insulation') === 'yes') suggestions.push('Basement/Crawlspace Wall Insulation');
            if (aVal('recommendations', 'air_sealing') === 'yes') suggestions.push('Air Sealing');
            if (aVal('recommendations', 'duct_sealing') === 'yes') suggestions.push('Duct Sealing');
            if (aVal('recommendations', 'rim_joist') === 'yes') suggestions.push('Rim Joist Insulation');
            if (aVal('recommendations', 'hvac_tune_clean') === 'yes') { suggestions.push('Gas Furnace Tune-Up'); suggestions.push('Boiler Tune-Up'); }
            if (aVal('recommendations', 'hvac_replacement') === 'yes') { suggestions.push('Furnace Replacement'); suggestions.push('Boiler Replacement'); }
            if (aVal('recommendations', 'thermostat') === 'yes') { suggestions.push('Programmable Thermostat'); suggestions.push('Advanced Thermostat'); }

            const categories = [...new Set(measures.map(m => m.category))];
            return (
              <div style={{ padding: 16 }}>
                {suggestions.length > 0 && (
                  <div style={{ background: '#fff3e0', padding: 10, borderRadius: 6, marginBottom: 12 }}>
                    <strong style={{ fontSize: 12 }}>Auto-Suggested from Assessor Recommendations:</strong>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {suggestions.map(s => (
                        <button key={s} className={`btn btn-sm ${selectedMeasures.includes(s) ? 'btn-success' : 'btn-warning'}`}
                          style={{ fontSize: 11, padding: '3px 8px' }} disabled={!canScope} onClick={() => toggleMeasure(s)}>
                          {selectedMeasures.includes(s) ? '+ ' : ''}{s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {categories.map(cat => (
                  <div key={cat} style={{ marginBottom: 12 }}>
                    <h4 style={{ fontSize: 13, color: '#333', marginBottom: 6, borderBottom: '1px solid #eee', paddingBottom: 4 }}>{cat}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 4 }}>
                      {measures.filter(m => m.category === cat).map(m => {
                        const isRec = suggestions.includes(m.name);
                        return (
                          <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '3px 6px', background: selectedMeasures.includes(m.name) ? '#e8f5e9' : isRec ? '#fff8e1' : '#f9f9f9', borderRadius: 4, cursor: canScope ? 'pointer' : 'default', border: isRec && !selectedMeasures.includes(m.name) ? '1px dashed #ff9800' : '1px solid transparent' }}>
                            <input type="checkbox" checked={selectedMeasures.includes(m.name)} disabled={!canScope} onChange={() => toggleMeasure(m.name)} />
                            {m.name} {isRec && !selectedMeasures.includes(m.name) && <span style={{ fontSize: 9, color: '#ff9800' }}>(recommended)</span>}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {canScope && selectedMeasures.length > 0 && (
                  <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 6, border: '1px solid #ddd' }}>
                    <h4 style={{ fontSize: 13, color: '#333', marginBottom: 8 }}>Weatherization Pricing Worksheet</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '4px 8px', fontSize: 11, alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, borderBottom: '1px solid #ccc', paddingBottom: 2 }}>Measure</div>
                      <div style={{ fontWeight: 700, borderBottom: '1px solid #ccc', paddingBottom: 2 }}>Qty/SqFt</div>
                      <div style={{ fontWeight: 700, borderBottom: '1px solid #ccc', paddingBottom: 2 }}>Unit</div>
                      <div style={{ fontWeight: 700, borderBottom: '1px solid #ccc', paddingBottom: 2 }}>Cost</div>
                      {selectedMeasures.map(m => (
                        <React.Fragment key={m}>
                          <div>{m}</div>
                          <input style={{ fontSize: 11, padding: '2px 4px', border: '1px solid #ccc', borderRadius: 3 }}
                            defaultValue={(sc.pricing || {})[m]?.qty || ''} placeholder="0"
                            onBlur={e => saveScope({ ...sc, pricing: { ...(sc.pricing || {}), [m]: { ...((sc.pricing || {})[m] || {}), qty: e.target.value } } })} />
                          <div style={{ color: '#666' }}>{m.includes('Insulation') || m.includes('Sealing') ? 'SF/LF' : 'Ea'}</div>
                          <input style={{ fontSize: 11, padding: '2px 4px', border: '1px solid #ccc', borderRadius: 3 }}
                            defaultValue={(sc.pricing || {})[m]?.cost || ''} placeholder="$0"
                            onBlur={e => saveScope({ ...sc, pricing: { ...(sc.pricing || {}), [m]: { ...((sc.pricing || {})[m] || {}), cost: e.target.value } } })} />
                        </React.Fragment>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, textAlign: 'right' }}>
                      Total: ${Object.values(sc.pricing || {}).reduce((sum, p) => sum + (parseFloat(p.cost) || 0), 0).toLocaleString()}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 12 }}>
                  <strong style={{ fontSize: 12 }}>Scope Notes:</strong>
                  <textarea style={{ width: '100%', fontSize: 11, padding: 4, minHeight: 60, marginTop: 4, border: '1px solid #ccc', borderRadius: 3 }}
                    defaultValue={sc.notes} disabled={!['Admin', 'Operations', 'Program Manager', 'Scope Creator'].includes(role)}
                    onBlur={e => saveScope({ ...sc, notes: e.target.value })} />
                </div>
                {selectedMeasures.length > 0 && (
                  <div style={{ marginTop: 12, padding: 10, background: '#e8f5e9', borderRadius: 6 }}>
                    <strong style={{ fontSize: 12 }}>Selected Measures ({selectedMeasures.length}):</strong>
                    <div style={{ marginTop: 4, fontSize: 12 }}>{selectedMeasures.join(' | ')}</div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ===================== INSTALLATION TAB ===================== */}
      {tab === 'install' && (
        <div>
          <div className="jd-card">
            <div className="jd-card-title">Installation Progress</div>
            <div className="jd-schedule-grid">
              {[
                { label: 'ABC Install Date', field: 'abc_install_date' },
                { label: 'Wall Injection Date', field: 'wall_injection_date' },
                { label: 'Patch Date', field: 'patch_date' },
              ].map(d => (
                <div key={d.field} className="jd-field">
                  <label className="jd-field-label">{d.label}</label>
                  <input type="date" className="jd-date-input" value={job[d.field] || ''} disabled={!canEdit}
                    onChange={e => updateField(d.field, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {/* Scope summary for installer reference */}
          <div className="jd-card">
            <div className="jd-card-title">Scope of Work (Reference)</div>
            {(sc.selected_measures || []).length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(sc.selected_measures || []).map(m => (
                  <span key={m} style={{ fontSize: 12, padding: '4px 10px', background: '#e8f5e9', borderRadius: 4, border: '1px solid #c8e6c9' }}>{m}</span>
                ))}
              </div>
            ) : <p style={{ fontSize: 12, color: '#888' }}>No scope defined yet.</p>}
            {sc.notes && <p style={{ fontSize: 11, color: '#666', marginTop: 8 }}><strong>Notes:</strong> {sc.notes}</p>}
          </div>

          {/* Checklist for installer */}
          <div className="jd-card">
            <div className="jd-card-title">Install Checklist</div>
            {(job.checklist || []).filter(c => c.item_type === 'photo' || c.item_type === 'paperwork').map(item => (
              <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 0', cursor: canEdit ? 'pointer' : 'default' }}>
                <input type="checkbox" checked={!!item.completed} disabled={!canEdit}
                  onChange={async () => {
                    await api.updateChecklist(item.id, { completed: !item.completed, completed_by: role });
                    load();
                  }} />
                <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#888' : '#333' }}>
                  {item.description}
                </span>
                {item.completed_date && <span style={{ fontSize: 10, color: '#888' }}>({item.completed_date})</span>}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ===================== HVAC TAB ===================== */}
      {tab === 'hvac' && (
        <div className="jd-card">
          <div className="jd-card-title">HVAC Tune & Clean / Replacements</div>
          <div className="jd-schedule-grid" style={{ marginBottom: 16 }}>
            {[
              { label: 'HVAC Tune & Clean Date', field: 'hvac_tune_clean_date' },
              { label: 'HVAC Replacement Date', field: 'hvac_replacement_date' },
            ].map(d => (
              <div key={d.field} className="jd-field">
                <label className="jd-field-label">{d.label}</label>
                <input type="date" className="jd-date-input" value={job[d.field] || ''} disabled={!canEdit}
                  onChange={e => updateField(d.field, e.target.value)} />
              </div>
            ))}
          </div>
          {(job.hvac_replacements || []).length === 0 ? (
            <p style={{ color: '#888', fontSize: 12 }}>No HVAC records yet.</p>
          ) : (
            (job.hvac_replacements || []).map(hvac => (
              <div key={hvac.id} style={{ padding: 12, border: '1px solid #ddd', borderRadius: 6, marginBottom: 10, background: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ fontSize: 13 }}>{hvac.equipment_type}</strong>
                  <span className={`badge ${hvac.approval_status === 'approved' ? 'active' : 'pending'}`} style={{ fontSize: 10 }}>
                    {hvac.approval_status}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 6, fontSize: 12 }}>
                  <div><strong>Make:</strong> {hvac.existing_make || '-'}</div>
                  <div><strong>Model:</strong> {hvac.existing_model || '-'}</div>
                  <div><strong>Condition:</strong> {hvac.existing_condition || '-'}</div>
                  <div><strong>Efficiency:</strong> {hvac.existing_efficiency || '-'}</div>
                  <div><strong>Age:</strong> {hvac.existing_age || '-'}</div>
                  <div><strong>Decision Tree:</strong> {hvac.decision_tree_result || '-'}</div>
                </div>
                {hvac.notes && <p style={{ fontSize: 11, color: '#666', marginTop: 6 }}>{hvac.notes}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* ===================== INSPECTION TAB ===================== */}
      {tab === 'inspection' && (
        <div>
          <div className="jd-card">
            <div className="jd-card-title">Final Inspection</div>
            <div className="jd-schedule-grid">
              <div className="jd-field">
                <label className="jd-field-label">Inspection Date</label>
                <input type="date" className="jd-date-input" value={job.inspection_date || ''} disabled={!canEdit}
                  onChange={e => updateField('inspection_date', e.target.value)} />
              </div>
              <div className="jd-field">
                <label className="jd-field-label">Submission Date</label>
                <input type="date" className="jd-date-input" value={job.submission_date || ''} disabled={!canEdit}
                  onChange={e => updateField('submission_date', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Post-install diagnostics */}
          <div className="jd-card">
            <div className="jd-card-title">Post-Install Diagnostics</div>
            <div style={gs}>
              <div style={fs}><strong>Post Blower Door (CFM50):</strong> {txt('diagnostics', 'post_cfm50', 'CFM50', 60)}</div>
              <div style={fs}><strong>Post Duct Blaster (CFM25):</strong> {txt('diagnostics', 'post_cfm25', 'CFM25', 60)}</div>
              <div style={fs}><strong>% CFM50 Reduction:</strong> {txt('diagnostics', 'cfm50_reduction', '%', 40)}</div>
              <div style={fs}><strong>Combustion Post:</strong> {txt('diagnostics', 'combustion_post', '%', 60)}</div>
            </div>
          </div>

          {/* QA Checklist */}
          <div className="jd-card">
            <div className="jd-card-title">Inspection Checklist</div>
            {['job_paperwork', 'photo', 'paperwork'].map(type => {
              const items = (job.checklist || []).filter(c => c.item_type === type);
              if (items.length === 0) return null;
              return (
                <div key={type} style={{ marginBottom: 12 }}>
                  <h4 style={{ fontSize: 13, marginBottom: 6, textTransform: 'capitalize' }}>
                    {type === 'job_paperwork' ? 'Job Documentation' : type === 'photo' ? 'Photo Requirements' : 'Measure Paperwork'}
                  </h4>
                  {items.map(item => (
                    <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '3px 0', cursor: canEdit ? 'pointer' : 'default' }}>
                      <input type="checkbox" checked={!!item.completed} disabled={!canEdit}
                        onChange={async () => {
                          await api.updateChecklist(item.id, { completed: !item.completed, completed_by: role });
                          load();
                        }} />
                      <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#888' : '#333' }}>
                        {item.description}
                      </span>
                      {item.completed_date && <span style={{ fontSize: 10, color: '#888' }}>({item.completed_date})</span>}
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ===================== PHOTOS TAB ===================== */}
      {tab === 'photos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Project Photos</h3>
            <button className="btn btn-primary" onClick={() => setPhotoModal({ phase: 'assessment' })} style={{ fontSize: 13 }}>
              + Capture Photo
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {HOUSE_SIDES.map(s => {
              const colors = { Alpha: '#e3f2fd', Bravo: '#fce4ec', Charlie: '#e8f5e9', Delta: '#fff3e0', Interior: '#f3e5f5', Other: '#f5f5f5' };
              const count = (job.photos || []).filter(p => p.house_side === s).length;
              return (
                <div key={s} style={{ padding: '6px 14px', background: colors[s], borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                  {s} Side: {count} photos
                </div>
              );
            })}
          </div>

          {PHOTO_PHASES.map(phase => {
            const photos = (job.photos || []).filter(p => p.phase === phase);
            if (photos.length === 0) return null;
            return (
              <div key={phase} style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, textTransform: 'capitalize', marginBottom: 8, borderBottom: '1px solid #eee', paddingBottom: 4 }}>
                  {phase.replace(/_/g, ' ')} ({photos.length})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                  {photos.map(p => {
                    const sideColors = { Alpha: '#1565c0', Bravo: '#c62828', Charlie: '#2e7d32', Delta: '#ef6c00', Interior: '#7b1fa2', Other: '#616161' };
                    return (
                      <div key={p.id} style={{ border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                        {p.has_photo ? (
                          <LazyPhoto id={p.id} alt={p.description} style={{ width: '100%', height: 130, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ height: 130, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 12 }}>
                            {p.photo_ref || 'No image'}
                          </div>
                        )}
                        <div style={{ padding: '6px 8px' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{p.description}</div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {p.house_side && <span style={{ fontSize: 9, padding: '1px 6px', background: sideColors[p.house_side] || '#999', color: '#fff', borderRadius: 3 }}>{p.house_side}</span>}
                            {p.measure_name && <span style={{ fontSize: 9, padding: '1px 6px', background: '#e0e0e0', borderRadius: 3 }}>{p.measure_name}</span>}
                          </div>
                          <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{p.uploaded_by} - {p.created_at?.split('T')[0]}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {(job.photos || []).length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: '#888' }}>
              No photos yet. Click "Capture Photo" to add your first photo.
            </div>
          )}
        </div>
      )}

      {/* ===================== SCHEDULING TAB ===================== */}
      {tab === 'scheduling' && (
        <div className="jd-card">
          <div className="jd-card-title">Scheduling & Install Dates</div>
          <div className="jd-schedule-grid">
            {[
              { label: 'Assessment Date', field: 'assessment_date' },
              { label: 'Submission Date', field: 'submission_date' },
              { label: 'ABC Install Date', field: 'abc_install_date' },
              { label: 'Wall Injection Date', field: 'wall_injection_date' },
              { label: 'Patch Date', field: 'patch_date' },
              { label: 'HVAC Tune & Clean Date', field: 'hvac_tune_clean_date' },
              { label: 'HVAC Replacement Date', field: 'hvac_replacement_date' },
              { label: 'Inspection Date', field: 'inspection_date' }
            ].map(d => (
              <div key={d.field} className="jd-field">
                <label className="jd-field-label">{d.label}</label>
                <input type="date" className="jd-date-input" value={job[d.field] || ''} disabled={!canEdit}
                  onChange={e => updateField(d.field, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== FORMS & DOCUMENTS TAB ===================== */}
      {tab === 'forms' && (
        <div>
          <div className="jd-card">
            <div className="jd-card-title">Required Forms & Signatures</div>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>Track all forms that need to be signed and submitted for this project per 2026 HES requirements.</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { name: 'Customer Authorization Form', desc: 'Customer signs to authorize work', key: 'auth_form' },
                { name: 'Customer-Signed Final Scope of Work', desc: 'Customer approves the final scope before install', key: 'signed_scope' },
                { name: 'Assessment Report', desc: 'MS Forms assessment survey completed', key: 'assessment_report' },
                { name: 'Hazardous Conditions Form', desc: 'Document any H&S hazards found', key: 'hazardous_form' },
                { name: 'Sub-Contractor Estimates', desc: 'If applicable, for work outside scope', key: 'sub_estimates' },
                { name: 'Final Inspection Form', desc: 'QA inspector completes after install', key: 'final_inspection' },
                { name: 'Final Invoice', desc: 'Invoice for completed work', key: 'final_invoice' },
              ].map(form => {
                const formStatus = (sc.forms || {})[form.key] || 'pending';
                return (
                  <div key={form.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: formStatus === 'signed' ? '#e8f5e9' : '#f9f9f9', borderRadius: 6, border: '1px solid #eee' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{form.name}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{form.desc}</div>
                    </div>
                    <select value={formStatus} disabled={!canEdit}
                      onChange={e => saveScope({ ...sc, forms: { ...(sc.forms || {}), [form.key]: e.target.value } })}
                      style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4 }}>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="signed">Signed/Complete</option>
                      <option value="na">N/A</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Documentation Checklist */}
          <div className="jd-card">
            <div className="jd-card-title">Documentation Checklist</div>
            {['job_paperwork', 'photo', 'paperwork'].map(type => {
              const items = (job.checklist || []).filter(c => c.item_type === type);
              if (items.length === 0) return null;
              return (
                <div key={type} style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: 13, marginBottom: 8, textTransform: 'capitalize' }}>
                    {type === 'job_paperwork' ? 'Job Documentation' : type === 'photo' ? 'Photo Requirements' : 'Measure Paperwork'}
                  </h4>
                  {items.map(item => (
                    <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 0', cursor: canEdit ? 'pointer' : 'default' }}>
                      <input type="checkbox" checked={!!item.completed} disabled={!canEdit}
                        onChange={async () => {
                          await api.updateChecklist(item.id, { completed: !item.completed, completed_by: role });
                          load();
                        }} />
                      <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#888' : '#333' }}>
                        {item.description}
                      </span>
                      {item.completed_date && <span style={{ fontSize: 10, color: '#888' }}>({item.completed_date})</span>}
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== CHECKLIST TAB (Installer view) ===================== */}
      {tab === 'checklist' && (
        <div className="jd-card">
          <div className="jd-card-title">Documentation & Photo Checklist</div>
          {['job_paperwork', 'photo', 'paperwork'].map(type => {
            const items = (job.checklist || []).filter(c => c.item_type === type);
            if (items.length === 0) return null;
            return (
              <div key={type} style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, marginBottom: 8, textTransform: 'capitalize' }}>
                  {type === 'job_paperwork' ? 'Job Documentation' : type === 'photo' ? 'Photo Requirements' : 'Measure Paperwork'}
                </h4>
                {items.map(item => (
                  <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 0', cursor: canEdit ? 'pointer' : 'default' }}>
                    <input type="checkbox" checked={!!item.completed} disabled={!canEdit}
                      onChange={async () => {
                        await api.updateChecklist(item.id, { completed: !item.completed, completed_by: role });
                        load();
                      }} />
                    <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#888' : '#333' }}>
                      {item.description}
                    </span>
                    {item.completed_date && <span style={{ fontSize: 10, color: '#888' }}>({item.completed_date})</span>}
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== CHANGE ORDERS TAB ===================== */}
      {tab === 'change_orders' && (
        <div className="jd-card">
          <div className="jd-card-title">Change Orders</div>
          {(job.change_orders || []).length === 0 ? (
            <p style={{ color: '#888', fontSize: 12 }}>No change orders.</p>
          ) : (
            (job.change_orders || []).map(co => (
              <div key={co.id} style={{ padding: 12, border: '1px solid #ddd', borderRadius: 6, marginBottom: 10, background: co.status === 'approved' ? '#e8f5e9' : co.status === 'denied' ? '#ffebee' : '#fff3e0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ fontSize: 12 }}>{co.request_type}</strong>
                  <span className={`badge ${co.status === 'approved' ? 'active' : co.status === 'denied' ? 'expired' : 'pending'}`} style={{ fontSize: 10 }}>
                    {co.status}
                  </span>
                </div>
                <p style={{ fontSize: 12, margin: '4px 0' }}>{co.description}</p>
                {co.reason && <p style={{ fontSize: 11, color: '#666' }}>Reason: {co.reason}</p>}
                {co.status === 'pending' && canEdit && ['Admin', 'Operations'].includes(role) && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button className="btn btn-sm btn-success" style={{ fontSize: 11 }} onClick={async () => {
                      await api.updateChangeOrder(co.id, { status: 'approved', reviewed_by: role });
                      load();
                    }}>Approve</button>
                    <button className="btn btn-sm btn-danger" style={{ fontSize: 11 }} onClick={async () => {
                      await api.updateChangeOrder(co.id, { status: 'denied', reviewed_by: role });
                      load();
                    }}>Deny</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ===================== EXPORT TAB ===================== */}
      {tab === 'export' && (
        <div className="jd-card">
          <div className="jd-card-title">Export & Documentation</div>
          {!exportData ? (
            <p style={{ color: '#888', fontSize: 12 }}>Loading export data...</p>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
                <div style={{ padding: 12, background: '#e3f2fd', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{exportData.photo_count}</div>
                  <div style={{ fontSize: 11 }}>Total Photos</div>
                </div>
                <div style={{ padding: 12, background: '#fff3e0', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{exportData.pre_photos?.length || 0}</div>
                  <div style={{ fontSize: 11 }}>Pre-Install</div>
                </div>
                <div style={{ padding: 12, background: '#e8f5e9', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{exportData.post_photos?.length || 0}</div>
                  <div style={{ fontSize: 11 }}>Post-Install</div>
                </div>
              </div>

              <h4 style={{ fontSize: 13, marginBottom: 8 }}>Photos by Side of House</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 16 }}>
                {Object.entries(exportData.by_side || {}).map(([side, photos]) => (
                  <div key={side} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6 }}>
                    <strong style={{ fontSize: 12, textTransform: 'capitalize' }}>{side} ({photos.length})</strong>
                    {photos.map(p => (
                      <div key={p.id} style={{ fontSize: 11, padding: '2px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p.has_photo && <LazyPhoto id={p.id} alt="" style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 3 }} />}
                        <span>{p.description}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <h4 style={{ fontSize: 13, marginBottom: 8 }}>Photos by Phase</h4>
              {Object.entries(exportData.photos_by_phase || {}).map(([phase, photos]) => (
                <div key={phase} style={{ marginBottom: 12 }}>
                  <strong style={{ fontSize: 12, textTransform: 'capitalize' }}>{phase.replace(/_/g, ' ')} ({photos.length})</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6, marginTop: 4 }}>
                    {photos.map(p => (
                      <div key={p.id} style={{ textAlign: 'center' }}>
                        {p.has_photo && <LazyPhoto id={p.id} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 4 }} />}
                        <div style={{ fontSize: 10, marginTop: 2 }}>{p.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <h4 style={{ fontSize: 13, marginTop: 16, marginBottom: 8 }}>Documentation Checklist</h4>
              {(exportData.checklist || []).map(item => (
                <div key={item.id} style={{ fontSize: 12, padding: '2px 0', display: 'flex', gap: 6 }}>
                  <span style={{ color: item.completed ? '#27ae60' : '#e74c3c' }}>{item.completed ? '[DONE]' : '[    ]'}</span>
                  {item.description}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photo Capture Modal */}
      {photoModal && <PhotoCaptureModal />}
    </div>
  );
}
