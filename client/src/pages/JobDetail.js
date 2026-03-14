import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const JOB_STATUSES = ['assessment_scheduled', 'assessment_complete', 'pre_approval', 'approved', 'install_scheduled', 'install_in_progress', 'inspection', 'submitted', 'invoiced', 'complete', 'deferred'];
const UTILITIES = ['ComEd', 'Nicor Gas', 'Peoples Gas', 'North Shore Gas'];
const HOUSE_SIDES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Interior', 'Other'];
const PHOTO_PHASES = ['assessment', 'pre_install', 'post_install', 'hvac', 'inspection'];

export default function JobDetail({ role }) {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [program, setProgram] = useState(null);
  const [tab, setTab] = useState('overview');
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [photoModal, setPhotoModal] = useState(null);
  const cameraRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const canEdit = ['Admin', 'Operations', 'Program Manager', 'Assessor', 'Installer', 'HVAC'].includes(role);

  const load = useCallback(() => {
    fetch(`/api/programs/jobs/${jobId}/detail`).then(r => r.json()).then(setJob).catch(() => {});
  }, [jobId]);

  const loadProgram = useCallback(() => {
    fetch('/api/hes-ie-program').then(r => r.json()).then(p => {
      if (p && p.id) {
        fetch(`/api/programs/${p.id}`).then(r => r.json()).then(setProgram);
      }
    });
  }, []);

  useEffect(() => { load(); loadProgram(); }, [load, loadProgram]);

  const updateField = async (field, value) => {
    const updated = { ...job, [field]: value };
    setJob(updated);
    await fetch(`/api/programs/jobs/${jobId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    load();
  };

  const saveAssessment = async (data) => {
    await fetch(`/api/programs/jobs/${jobId}/assessment`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessment_data: data })
    });
  };

  const saveScope = async (data) => {
    await fetch(`/api/programs/jobs/${jobId}/scope`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope_data: data })
    });
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
    reader.onload = (ev) => {
      setCapturedPhoto(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const submitPhoto = async (phase, description, houseSide, measureName) => {
    if (!capturedPhoto && !photoModal?.ref) return;
    await fetch(`/api/programs/jobs/${jobId}/photos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploaded_by: role,
        role: role,
        phase: phase,
        measure_name: measureName || null,
        house_side: houseSide || null,
        description: description,
        photo_data: capturedPhoto || null,
        photo_ref: photoModal?.ref || null,
        file_name: `${phase}_${houseSide || 'general'}_${Date.now()}.jpg`
      })
    });
    setCapturedPhoto(null);
    setPhotoModal(null);
    load();
  };

  const loadExport = async () => {
    const data = await fetch(`/api/programs/jobs/${jobId}/export`).then(r => r.json());
    setExportData(data);
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

  const tabStyle = (t) => ({
    padding: '8px 16px', cursor: 'pointer', fontWeight: tab === t ? 700 : 400,
    borderBottom: tab === t ? '3px solid #1a73e8' : '3px solid transparent',
    color: tab === t ? '#1a73e8' : '#666', fontSize: 13, background: 'none', border: 'none',
    borderBottomWidth: 3, borderBottomStyle: 'solid', borderBottomColor: tab === t ? '#1a73e8' : 'transparent'
  });

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

          {/* Camera / Preview Area */}
          <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden', marginBottom: 12, position: 'relative', minHeight: 200 }}>
            {cameraStream && !capturedPhoto && (
              <video ref={cameraRef} autoPlay playsInline style={{ width: '100%', display: 'block' }}
                onLoadedMetadata={() => { if (cameraRef.current) cameraRef.current.play(); }} />
            )}
            {capturedPhoto && (
              <img src={capturedPhoto} alt="Captured" style={{ width: '100%', display: 'block' }} />
            )}
            {!cameraStream && !capturedPhoto && (
              <div style={{ color: '#aaa', textAlign: 'center', padding: 40, fontSize: 14 }}>
                Use camera or upload a photo
              </div>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Camera / Upload buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {!cameraStream && !capturedPhoto && (
              <>
                <button className="btn btn-primary" onClick={startCamera} style={{ fontSize: 12, padding: '6px 14px' }}>
                  Open Camera
                </button>
                <label className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 14px', cursor: 'pointer' }}>
                  Upload from Gallery
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </>
            )}
            {cameraStream && !capturedPhoto && (
              <button className="btn btn-success" onClick={captureFromCamera} style={{ fontSize: 12, padding: '8px 20px' }}>
                Take Photo
              </button>
            )}
            {capturedPhoto && (
              <button className="btn btn-warning" onClick={() => setCapturedPhoto(null)} style={{ fontSize: 12, padding: '6px 14px' }}>
                Retake
              </button>
            )}
          </div>

          {/* Photo metadata */}
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
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this photo of? e.g. Alpha side pre-install, Furnace data plate..."
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
    <div>
      {/* Back button + Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => navigate('/hes-ie')} className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 12px' }}>
          Back to Jobs
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{job.customer_name || 'Unnamed Project'}</h2>
          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
            {job.job_number && <span style={{ marginRight: 12 }}>#{job.job_number}</span>}
            {job.address}, {job.city} {job.zip}
            <span style={{ marginLeft: 12, fontWeight: 600 }}>Assured Energy Solutions</span>
          </div>
        </div>
        <span className={`badge ${job.status === 'complete' ? 'active' : 'pending'}`} style={{ fontSize: 12, padding: '4px 12px' }}>
          {job.status.replace(/_/g, ' ').toUpperCase()}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: 16, flexWrap: 'wrap' }}>
        {['overview', 'assessment', 'scope', 'photos', 'scheduling', 'checklist', 'hvac', 'change_orders', 'export'].map(t => (
          <button key={t} style={tabStyle(t)} onClick={() => { setTab(t); if (t === 'export') loadExport(); }}>
            {t === 'change_orders' ? 'Change Orders' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ===================== OVERVIEW TAB ===================== */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Customer Info */}
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 14, marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}>Customer Information</h3>
            <div style={{ display: 'grid', gap: 8, fontSize: 12 }}>
              <div><strong>Name:</strong> <input defaultValue={job.customer_name} disabled={!canEdit} style={{ width: 200, fontSize: 12, padding: '2px 4px' }} onBlur={e => updateField('customer_name', e.target.value)} /></div>
              <div><strong>Phone:</strong> <input defaultValue={job.phone} disabled={!canEdit} style={{ width: 160, fontSize: 12, padding: '2px 4px' }} onBlur={e => updateField('phone', e.target.value)} /></div>
              <div><strong>Email:</strong> <input defaultValue={job.email} disabled={!canEdit} style={{ width: 200, fontSize: 12, padding: '2px 4px' }} onBlur={e => updateField('email', e.target.value)} /></div>
              <div><strong>Address:</strong> <input defaultValue={job.address} disabled={!canEdit} style={{ width: 260, fontSize: 12, padding: '2px 4px' }} onBlur={e => updateField('address', e.target.value)} /></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span><strong>City:</strong> <input defaultValue={job.city} disabled={!canEdit} style={{ width: 120, fontSize: 12, padding: '2px 4px' }} onBlur={e => updateField('city', e.target.value)} /></span>
                <span><strong>Zip:</strong> <input defaultValue={job.zip} disabled={!canEdit} style={{ width: 70, fontSize: 12, padding: '2px 4px' }} onBlur={e => updateField('zip', e.target.value)} /></span>
              </div>
              <div>
                <strong>Utility:</strong>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {UTILITIES.map(u => (
                    <label key={u} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
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
              <div><strong>Contractor:</strong> Assured Energy Solutions</div>
              <div><strong>Job #:</strong> <input defaultValue={job.job_number} disabled={!canEdit} style={{ width: 120, fontSize: 12, padding: '2px 4px' }} onBlur={e => updateField('job_number', e.target.value)} /></div>
            </div>
          </div>

          {/* Status + Quick Actions */}
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 14, marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}>Project Status</h3>
            <div style={{ fontSize: 12, marginBottom: 12 }}>
              <strong>Status:</strong>
              <select value={job.status} disabled={!canEdit} onChange={e => updateField('status', e.target.value)}
                style={{ marginLeft: 8, fontSize: 12, padding: '2px 6px' }}>
                {JOB_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div style={{ fontSize: 12, marginBottom: 8 }}>
              <strong>Estimate:</strong> $<input type="number" defaultValue={job.estimate_amount} disabled={!canEdit}
                style={{ width: 100, fontSize: 12, padding: '2px 4px' }} onBlur={e => updateField('estimate_amount', parseFloat(e.target.value) || null)} />
            </div>
            <div style={{ fontSize: 12, marginBottom: 8 }}>
              <strong>Notes:</strong>
              <textarea defaultValue={job.notes} disabled={!canEdit} style={{ width: '100%', fontSize: 11, padding: 4, minHeight: 60, marginTop: 4 }}
                onBlur={e => updateField('notes', e.target.value)} />
            </div>

            {/* Permit Tracking */}
            <h4 style={{ fontSize: 13, marginTop: 12, marginBottom: 8 }}>Permit Tracking</h4>
            <div style={{ fontSize: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <input type="checkbox" checked={!!job.needs_permit} disabled={!canEdit} onChange={e => updateField('needs_permit', e.target.checked ? 1 : 0)} />
                <strong>Needs Permit</strong>
              </label>
              {job.needs_permit ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
                  <div>Status: <select value={job.permit_status || 'not_applied'} disabled={!canEdit} onChange={e => updateField('permit_status', e.target.value)} style={{ fontSize: 11 }}>
                    <option value="not_applied">Not Applied</option><option value="applied">Applied</option><option value="received">Received</option><option value="issue">Issue</option>
                  </select></div>
                  <div>Applied: <input type="date" value={job.permit_applied_date || ''} disabled={!canEdit} onChange={e => updateField('permit_applied_date', e.target.value)} style={{ fontSize: 11 }} /></div>
                  <div>Received: <input type="date" value={job.permit_received_date || ''} disabled={!canEdit} onChange={e => updateField('permit_received_date', e.target.value)} style={{ fontSize: 11 }} /></div>
                  <div>Permit #: <input defaultValue={job.permit_number} disabled={!canEdit} style={{ width: 80, fontSize: 11 }} onBlur={e => updateField('permit_number', e.target.value)} /></div>
                  <div>Jurisdiction: <input defaultValue={job.permit_jurisdiction} disabled={!canEdit} style={{ width: 100, fontSize: 11 }} onBlur={e => updateField('permit_jurisdiction', e.target.value)} /></div>
                </div>
              ) : null}
            </div>

            {/* Quick summary */}
            <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ background: '#e3f2fd', padding: '4px 10px', borderRadius: 4, fontSize: 11 }}>
                {(job.photos || []).length} Photos
              </div>
              <div style={{ background: '#e8f5e9', padding: '4px 10px', borderRadius: 4, fontSize: 11 }}>
                {(job.measures || []).length} Measures
              </div>
              <div style={{ background: '#fff3e0', padding: '4px 10px', borderRadius: 4, fontSize: 11 }}>
                {(job.change_orders || []).filter(c => c.status === 'pending').length} Pending COs
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== ASSESSMENT TAB ===================== */}
      {tab === 'assessment' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#4a6741', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
            onClick={() => setAssessmentOpen(!assessmentOpen)}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Energy Assessment Data (Appendix D)</h3>
            <span>{assessmentOpen ? '\u25B2' : '\u25BC'}</span>
          </div>
          {assessmentOpen && (
            <div>
              {/* HEADER */}
              <div style={ss}><div style={gs}>
                <div style={fs}><strong>Completed By:</strong> {txt('header', 'completed_by', 'Name', 140)}</div>
                <div style={fs}><strong>Date:</strong> <input type="date" style={{ fontSize: 11, padding: '2px 4px' }} value={aVal('header', 'date')} disabled={!canEdit} onChange={e => aSet('header', 'date', e.target.value)} /></div>
              </div></div>
              {/* EXTERIOR */}
              <div style={hs}>EXTERIOR INSPECTION</div>
              <div style={ss}><div style={gs}>
                <div style={fs}><strong>Style:</strong> {txt('exterior', 'style', 'Ranch...', 100)}</div>
                <div style={fs}><strong>Year Built:</strong> {txt('exterior', 'year_built', 'Year', 60)}</div>
                <div style={fs}><strong>Stories:</strong> {txt('exterior', 'stories', '#', 40)}</div>
                <div style={fs}><strong>Bedrooms:</strong> {txt('exterior', 'bedrooms', '#', 40)}</div>
                <div style={fs}><strong>SqFt:</strong> {txt('exterior', 'sq_footage', 'sqft', 70)}</div>
                <div style={fs}><strong>Volume:</strong> {txt('exterior', 'volume', 'cuft', 70)}</div>
                <div style={fs}><strong>Gutters:</strong> {yn('exterior', 'gutters')} Cond: {sel('exterior', 'gutter_condition', ['good', 'poor'])}</div>
                <div style={fs}><strong>Downspouts:</strong> {yn('exterior', 'downspouts')} Repairs: {yn('exterior', 'gutter_repairs')}</div>
                <div style={fs}><strong>Roof:</strong> {sel('exterior', 'roof_condition', ['good', 'average', 'poor'])} Type: {sel('exterior', 'roof_type', ['Architecture', '3-Tab', 'Flat'])}</div>
                <div style={fs}><strong>Roof Age:</strong> {txt('exterior', 'roof_age', 'years', 50)} Repair: {yn('exterior', 'roof_repair')}</div>
                <div style={fs}><strong>High Roof Venting:</strong> {yn('exterior', 'high_roof_venting')} Type: {sel('exterior', 'vent_type', ['static', 'ridge'])}</div>
                <div style={fs}><strong>Chimney:</strong> {sel('exterior', 'chimney', ['brick', 'metal', 'none'])} Flashing: {yn('exterior', 'flashing_repair')}</div>
                <div style={fs}><strong>Soffit:</strong> {yn('exterior', 'soffit')} Type: {txt('exterior', 'soffit_type', 'Type', 60)} Cond: {sel('exterior', 'soffit_condition', ['good', 'poor'])}</div>
                <div style={fs}><strong>Soffit Vents:</strong> {yn('exterior', 'soffit_vents')} Repairs: {yn('exterior', 'soffit_repairs')}</div>
                <div style={fs}><strong>Chutes/Baffles:</strong> {txt('exterior', 'soffit_chutes', 'Qty', 40)}</div>
              </div>
              <div style={{ marginTop: 6 }}><strong style={{ fontSize: 12 }}>Notes:</strong> {txt('exterior', 'notes', 'Notes...', '100%')}</div>
              </div>
              {/* INTERIOR */}
              <div style={hs}>INTERIOR INSPECTION</div>
              <div style={ss}><div style={gs}>
                <div style={fs}><strong>Mold:</strong> {yn('interior', 'mold')}</div>
                <div style={fs}><strong>Broken Glass:</strong> {yn('interior', 'broken_glass')}</div>
                <div style={fs}><strong>Knob & Tube:</strong> {yn('interior', 'knob_tube')}</div>
                <div style={fs}><strong>Wiring Issues:</strong> {yn('interior', 'wiring_issues')}</div>
                <div style={fs}><strong>Moisture:</strong> {yn('interior', 'moisture')}</div>
                <div style={fs}><strong>Water Leaks:</strong> {yn('interior', 'water_leaks')}</div>
                <div style={fs}><strong>Roof Leaks:</strong> {yn('interior', 'roof_leaks')} Loc: {txt('interior', 'roof_leaks_location', 'Loc', 80)}</div>
                <div style={fs}><strong>Drop Ceiling:</strong> {yn('interior', 'drop_ceiling')}</div>
                <div style={fs}><strong>Ceiling:</strong> {sel('interior', 'ceiling_condition', ['good', 'poor'])}</div>
                <div style={fs}><strong>Wall Cond:</strong> {txt('interior', 'wall_condition', 'Condition', 80)}</div>
                <div style={fs}><strong>Smoke Det:</strong> {yn('interior', 'smoke_detector')}</div>
                <div style={fs}><strong>Drywall Repair:</strong> {yn('interior', 'drywall_repair')} Loc: {txt('interior', 'drywall_location', 'Location', 80)}</div>
                <div style={fs}><strong>CO Det:</strong> {yn('interior', 'co_detector')}</div>
                <div style={fs}><strong>Recessed Lighting:</strong> {yn('interior', 'recessed_lighting')}</div>
                <div style={fs}><strong>Dryer Vented:</strong> {yn('interior', 'dryer_vented')}</div>
              </div>
              <div style={{ marginTop: 6 }}><strong style={{ fontSize: 12 }}>Notes:</strong> {txt('interior', 'notes', 'Notes...', '100%')}</div>
              </div>
              {/* DIRECT INSTALLS */}
              <div style={hs}>DIRECT INSTALLS</div>
              <div style={ss}><div style={gs}>
                <div style={fs}><strong>Smoke Det Qty:</strong> {txt('direct_install', 'smoke_qty', '#', 40)}</div>
                <div style={fs}><strong>CO Det Qty:</strong> {txt('direct_install', 'co_qty', '#', 40)}</div>
                <div style={fs}><strong>Total:</strong> {txt('direct_install', 'total', '#', 40)}</div>
              </div></div>
              {/* DOORS */}
              <div style={hs}>DOOR TYPES</div>
              <div style={ss}><div style={gs}>
                {['Front', 'Back', 'Basement', 'Attic'].map(d => (
                  <div key={d} style={fs}><strong>{d}:</strong> {yn('doors', d.toLowerCase())} WS: {yn('doors', `${d.toLowerCase()}_strip`)}</div>
                ))}
                <div style={fs}><strong>Other:</strong> {txt('doors', 'other', 'Type', 60)}</div>
                <div style={fs}><strong>Total WS Needed:</strong> {txt('doors', 'total_ws', '#', 30)}</div>
              </div></div>
              {/* HATCHES */}
              <div style={hs}>HATCHES</div>
              <div style={ss}>
                {['Scuttle', 'Knee Wall', 'Pull Down', 'Walk Up'].map(h => (
                  <div key={h} style={{ ...fs, marginBottom: 4 }}>
                    <strong style={{ minWidth: 70 }}>{h}:</strong>
                    Loc: {txt('hatches', `${h.toLowerCase().replace(/ /g,'_')}_loc`, 'Loc', 60)}
                    Qty: {txt('hatches', `${h.toLowerCase().replace(/ /g,'_')}_qty`, '#', 25)}
                    R: {txt('hatches', `${h.toLowerCase().replace(/ /g,'_')}_rval`, 'R', 30)}
                    Add: {txt('hatches', `${h.toLowerCase().replace(/ /g,'_')}_add`, 'R', 30)}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12 }}>
                  <div style={fs}><strong>Created - Scuttle:</strong> {txt('hatches', 'created_scuttle', '#', 25)}</div>
                  <div style={fs}><strong>Knee Wall:</strong> {txt('hatches', 'created_knee_wall', '#', 25)}</div>
                </div>
              </div>
              {/* ATTIC */}
              <div style={hs}>ATTIC</div>
              <div style={ss}><div style={gs}>
                <div style={fs}><strong>Type:</strong> {sel('attic', 'type', ['Finished', 'Unfinished', 'Flat'])}</div>
                <div style={fs}><strong>Pre R:</strong> {txt('attic', 'pre_r_value', 'R', 40)}</div>
                <div style={fs}><strong>SqFt:</strong> {txt('attic', 'sq_footage', 'sqft', 60)}</div>
                <div style={fs}><strong>R to Add:</strong> {txt('attic', 'r_to_add', 'R', 40)}</div>
                <div style={fs}><strong>Recessed:</strong> {yn('attic', 'recessed_lights')} Qty: {txt('attic', 'recessed_qty', '#', 25)} Type: {sel('attic', 'recessed_type', ['Straight Bow', 'Other'])}</div>
                <div style={fs}><strong>Storage Created:</strong> {txt('attic', 'storage_created', 'Details', 100)}</div>
                <div style={fs}><strong>Ductwork:</strong> {yn('attic', 'ductwork')} Cond: {sel('attic', 'duct_condition', ['good', 'poor'])}</div>
                <div style={fs}><strong>Duct Seal ft:</strong> {txt('attic', 'duct_lin_ft', 'ft', 40)}</div>
                <div style={fs}><strong>Floor Boards:</strong> {yn('attic', 'floor_boards')}</div>
              </div>
              <div style={{ marginTop: 6 }}><strong style={{ fontSize: 12 }}>Notes:</strong> {txt('attic', 'notes', 'Notes...', '100%')}</div>
              </div>
              {/* COLLAR BEAM */}
              <div style={hs}>COLLAR BEAM</div>
              <div style={ss}><div style={gs}>
                <div style={fs}><strong>Pre R:</strong> {txt('collar_beam', 'pre_r_value', 'R', 40)}</div>
                <div style={fs}><strong>SqFt:</strong> {txt('collar_beam', 'sq_footage', 'sqft', 60)}</div>
                <div style={fs}><strong>R to Add:</strong> {txt('collar_beam', 'r_to_add', 'R', 40)}</div>
                <div style={fs}><strong>Ductwork:</strong> {yn('collar_beam', 'ductwork')} Cond: {sel('collar_beam', 'duct_condition', ['good', 'poor'])}</div>
                <div style={fs}><strong>Duct Seal ft:</strong> {txt('collar_beam', 'duct_lin_ft', 'ft', 40)}</div>
                <div style={fs}><strong>Accessibles:</strong> {yn('collar_beam', 'accessibles')}</div>
                <div style={fs}><strong>Cut In:</strong> {yn('collar_beam', 'cut_in')}</div>
              </div></div>
              {/* OCJ */}
              <div style={hs}>OUTER CEILING JOIST</div>
              <div style={ss}><div style={gs}>
                <div style={fs}><strong>Pre R:</strong> {txt('ocj', 'pre_r_value', 'R', 40)}</div>
                <div style={fs}><strong>SqFt:</strong> {txt('ocj', 'sq_footage', 'sqft', 60)}</div>
                <div style={fs}><strong># OCJs:</strong> {txt('ocj', 'num_ocjs', '#', 25)}</div>
                <div style={fs}><strong>R to Add:</strong> {txt('ocj', 'r_to_add', 'R', 40)}</div>
                <div style={fs}><strong>Ductwork:</strong> {yn('ocj', 'ductwork')} Cond: {sel('ocj', 'duct_condition', ['good', 'poor'])}</div>
                <div style={fs}><strong>Accessible:</strong> {yn('ocj', 'accessible')}</div>
                <div style={fs}><strong>Cut In:</strong> {yn('ocj', 'cut_in')}</div>
                <div style={fs}><strong>Floor Boards:</strong> {yn('ocj', 'floor_boards')}</div>
              </div></div>
              {/* FOUNDATION */}
              <div style={hs}>FOUNDATION</div>
              <div style={ss}><div style={gs}>
                <div style={fs}><strong>Basement:</strong> {sel('foundation', 'basement_type', ['Finished', 'Unfinished w/framing', 'Unfinished', 'No basement/slab'])}</div>
                <div style={fs}><strong>Above Grade:</strong> {txt('foundation', 'above_grade_sqft', 'sqft', 50)}</div>
                <div style={fs}><strong>Below Grade:</strong> {txt('foundation', 'below_grade_sqft', 'sqft', 50)}</div>
                <div style={fs}><strong>Pre R:</strong> {txt('foundation', 'pre_r_value', 'R', 40)}</div>
                <div style={fs}><strong>Insulation:</strong> {sel('foundation', 'insulation_type', ['Fiberglass', 'Rigid Foam Board', 'None'])}</div>
                <div style={fs}><strong>Band Joints:</strong> {yn('foundation', 'band_joints')} Lin Ft: {txt('foundation', 'linear_ft', 'ft', 40)}</div>
                <div style={fs}><strong>Band R:</strong> {txt('foundation', 'band_pre_r_value', 'R', 35)} Insul: {sel('foundation', 'band_insulation_type', ['Fiberglass', 'Rigid Foam Board', 'None'])}</div>
                <div style={fs}><strong>Plaster/Lath:</strong> {yn('foundation', 'plaster_lath')}</div>
                <div style={fs}><strong>Balloon:</strong> {yn('foundation', 'balloon_const')}</div>
                <div style={fs}><strong>Asbestos:</strong> {yn('foundation', 'asbestos')}</div>
                <div style={fs}><strong>Ductwork:</strong> {yn('foundation', 'ductwork')} Cond: {sel('foundation', 'duct_condition', ['good', 'poor'])}</div>
                <div style={fs}><strong>Duct Seal ft:</strong> {txt('foundation', 'duct_lin_ft', 'ft', 40)}</div>
              </div>
              <div style={{ marginTop: 6 }}><strong style={{ fontSize: 12 }}>Notes:</strong> {txt('foundation', 'notes', 'Notes...', '100%')}</div>
              </div>
              {/* CRAWLSPACE */}
              <div style={hs}>CRAWLSPACE</div>
              <div style={ss}><div style={gs}>
                <div style={fs}><strong>Vented:</strong> {yn('crawlspace', 'vented')} # Vents: {txt('crawlspace', 'num_vents', '#', 25)}</div>
                <div style={fs}><strong>Floor:</strong> {sel('crawlspace', 'floor_type', ['Concrete', 'Dirt/Gravel'])}</div>
                <div style={fs}><strong>Vapor Barrier:</strong> {yn('crawlspace', 'vapor_barrier')} SqFt: {txt('crawlspace', 'vapor_sqft', 'sqft', 50)}</div>
                <div style={fs}><strong>Water Issues:</strong> {yn('crawlspace', 'water_issues')}</div>
                <div style={fs}><strong>Above Grade:</strong> {txt('crawlspace', 'above_grade', 'sqft', 50)}</div>
                <div style={fs}><strong>Below Grade:</strong> {txt('crawlspace', 'below_grade', 'sqft', 50)}</div>
                <div style={fs}><strong>Pre R:</strong> {txt('crawlspace', 'pre_r_value', 'R', 40)}</div>
                <div style={fs}><strong>Insulation:</strong> {sel('crawlspace', 'insulation_type', ['Fiberglass', 'Rigid Foam Board', 'None'])}</div>
                <div style={fs}><strong>Band Joints:</strong> {yn('crawlspace', 'band_joints')} Lin Ft: {txt('crawlspace', 'band_linear_ft', 'ft', 40)}</div>
                <div style={fs}><strong>Band R:</strong> {txt('crawlspace', 'band_pre_r_value', 'R', 35)} Insul: {sel('crawlspace', 'band_insulation_type', ['Fiberglass', 'Rigid Foam Board', 'None'])}</div>
                <div style={fs}><strong>Ductwork:</strong> {yn('crawlspace', 'ductwork')} Cond: {sel('crawlspace', 'duct_condition', ['good', 'poor'])}</div>
              </div>
              <div style={{ marginTop: 6 }}><strong style={{ fontSize: 12 }}>Notes:</strong> {txt('crawlspace', 'notes', 'Notes...', '100%')}</div>
              </div>
              {/* EXTERIOR WALLS */}
              <div style={hs}>EXTERIOR WALLS</div>
              <div style={ss}>
                {['1st Floor', '2nd Floor'].map(floor => (
                  <div key={floor} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{floor}</div>
                    <div style={gs}>
                      <div style={fs}><strong>Pre R:</strong> {txt('walls', `${floor}_r_value`, 'R', 35)}</div>
                      <div style={fs}><strong>Wall SqFt:</strong> {txt('walls', `${floor}_wall_sqft`, 'sqft', 50)}</div>
                      <div style={fs}><strong>R to Add:</strong> {txt('walls', `${floor}_r_add`, 'R', 35)}</div>
                      <div style={fs}><strong>Win/Door SqFt:</strong> {txt('walls', `${floor}_window_sqft`, 'sqft', 50)}</div>
                      <div style={fs}><strong>Cladding:</strong> {sel('walls', `${floor}_cladding`, ['Stucco', 'Wood Lap', 'Asbestos Shingle', 'Masonry', 'Aluminum', 'Vinyl', 'Other'])}</div>
                      <div style={fs}><strong>Wall Type:</strong> {sel('walls', `${floor}_wall_type`, ['Drywall', 'Plaster'])}</div>
                      <div style={fs}><strong>From:</strong> {sel('walls', `${floor}_insulate_from`, ['Interior', 'Exterior'])}</div>
                      <div style={fs}><strong>Phenolic:</strong> {yn('walls', `${floor}_phenolic_foam`)}</div>
                      <div style={fs}><strong>Dense Pack:</strong> {yn('walls', `${floor}_dense_pack`)}</div>
                    </div>
                  </div>
                ))}
                <div style={fs}><strong>Spoke to Owner re: Prep:</strong> {yn('walls', 'spoke_owner')}</div>
                <div style={fs}><strong>Drill Location:</strong> {txt('walls', 'drill_location', 'Location', 200)}</div>
                <div style={{ marginTop: 6 }}><strong style={{ fontSize: 12 }}>Notes:</strong> {txt('walls', 'notes', 'Notes...', '100%')}</div>
              </div>
              {/* KNEE WALLS */}
              <div style={hs}>KNEE WALLS</div>
              <div style={ss}><div style={gs}>
                <div style={fs}><strong>Pre R:</strong> {txt('knee_walls', 'pre_r_value', 'R', 40)}</div>
                <div style={fs}><strong>SqFt:</strong> {txt('knee_walls', 'sq_footage', 'sqft', 60)}</div>
                <div style={fs}><strong>Plumbing Wall:</strong> {yn('knee_walls', 'plumbing_wall')}</div>
                <div style={fs}><strong>R to Add:</strong> {txt('knee_walls', 'r_to_add', 'R', 40)}</div>
                <div style={fs}><strong>Dense Pack:</strong> {yn('knee_walls', 'dense_pack')}</div>
                <div style={fs}><strong>Rigid Foam:</strong> {yn('knee_walls', 'rigid_foam')}</div>
                <div style={fs}><strong>Fiberglass:</strong> {yn('knee_walls', 'fiberglass')}</div>
                <div style={fs}><strong>Wall Type:</strong> {sel('knee_walls', 'wall_type', ['Drywall', 'Plaster'])}</div>
              </div></div>
              {/* MECHANICAL */}
              <div style={hs}>MECHANICAL EQUIPMENT</div>
              <div style={ss}>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Furnace / Boiler</div>
                <div style={gs}>
                  <div style={fs}><strong>Type:</strong> {sel('mechanical', 'heating_type', ['Gas Furnace', 'Boiler', 'Electric', 'Heat Pump', 'Other'])}</div>
                  <div style={fs}><strong>Make:</strong> {txt('mechanical', 'heating_make', 'Make', 80)}</div>
                  <div style={fs}><strong>Model:</strong> {txt('mechanical', 'heating_model', 'Model', 80)}</div>
                  <div style={fs}><strong>Age:</strong> {txt('mechanical', 'heating_age', 'Year', 50)}</div>
                  <div style={fs}><strong>Condition:</strong> {sel('mechanical', 'heating_condition', ['Good', 'Fair', 'Poor', 'Failed'])}</div>
                  <div style={fs}><strong>Efficiency:</strong> {txt('mechanical', 'heating_efficiency', '%', 40)}</div>
                  <div style={fs}><strong>Last Serviced:</strong> {txt('mechanical', 'heating_last_service', 'Year', 60)}</div>
                  <div style={fs}><strong>Tune & Clean Rec:</strong> {yn('mechanical', 'tune_clean_recommended')}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 12, marginTop: 8, marginBottom: 4 }}>Water Heater</div>
                <div style={gs}>
                  <div style={fs}><strong>Type:</strong> {sel('mechanical', 'wh_type', ['Gas', 'Electric', 'Tankless', 'Heat Pump WH'])}</div>
                  <div style={fs}><strong>Make:</strong> {txt('mechanical', 'wh_make', 'Make', 80)}</div>
                  <div style={fs}><strong>Model:</strong> {txt('mechanical', 'wh_model', 'Model', 80)}</div>
                  <div style={fs}><strong>Age:</strong> {txt('mechanical', 'wh_age', 'Year', 50)}</div>
                  <div style={fs}><strong>Condition:</strong> {sel('mechanical', 'wh_condition', ['Good', 'Fair', 'Poor', 'Failed'])}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 12, marginTop: 8, marginBottom: 4 }}>Central Air / Cooling</div>
                <div style={gs}>
                  <div style={fs}><strong>Type:</strong> {sel('mechanical', 'cooling_type', ['Central AC', 'Room AC', 'Heat Pump', 'None'])}</div>
                  <div style={fs}><strong>Make:</strong> {txt('mechanical', 'cooling_make', 'Make', 80)}</div>
                  <div style={fs}><strong>SEER:</strong> {txt('mechanical', 'cooling_seer', 'SEER', 40)}</div>
                  <div style={fs}><strong>Condition:</strong> {sel('mechanical', 'cooling_condition', ['Good', 'Fair', 'Poor', 'Failed'])}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 12, marginTop: 8, marginBottom: 4 }}>Thermostat</div>
                <div style={gs}>
                  <div style={fs}><strong>Type:</strong> {sel('mechanical', 'thermostat_type', ['Manual', 'Programmable', 'Smart/Advanced'])}</div>
                  <div style={fs}><strong>Condition:</strong> {sel('mechanical', 'thermostat_condition', ['Good', 'Poor'])}</div>
                </div>
              </div>
              {/* DIAGNOSTICS */}
              <div style={hs}>DIAGNOSTIC TESTING</div>
              <div style={ss}><div style={gs}>
                <div style={fs}><strong>Pre Blower Door (CFM50):</strong> {txt('diagnostics', 'pre_cfm50', 'CFM50', 60)}</div>
                <div style={fs}><strong>Post Blower Door (CFM50):</strong> {txt('diagnostics', 'post_cfm50', 'CFM50', 60)}</div>
                <div style={fs}><strong>% Reduction:</strong> {txt('diagnostics', 'cfm50_reduction', '%', 40)}</div>
                <div style={fs}><strong>Pre Duct Blaster (CFM25):</strong> {txt('diagnostics', 'pre_cfm25', 'CFM25', 60)}</div>
                <div style={fs}><strong>Post Duct Blaster (CFM25):</strong> {txt('diagnostics', 'post_cfm25', 'CFM25', 60)}</div>
                <div style={fs}><strong>Combustion Pre:</strong> {txt('diagnostics', 'combustion_pre', '%', 60)}</div>
                <div style={fs}><strong>Combustion Post:</strong> {txt('diagnostics', 'combustion_post', '%', 60)}</div>
                <div style={fs}><strong>CO Test:</strong> {txt('diagnostics', 'co_test', 'ppm', 50)}</div>
              </div></div>
              {/* RECOMMENDATIONS */}
              <div style={{ ...hs, background: '#4a6741' }}>ASSESSOR RECOMMENDATIONS</div>
              <div style={{ ...ss, borderBottom: 'none' }}>
                <div style={gs}>
                  {['attic_insulation', 'wall_insulation', 'basement_insulation', 'air_sealing', 'duct_sealing', 'rim_joist', 'hvac_tune_clean', 'thermostat', 'exhaust_fans', 'detectors', 'hs_repairs', 'deferral'].map(r => (
                    <div key={r} style={fs}><strong>{r.replace(/_/g, ' ')}:</strong> {yn('recommendations', r)}</div>
                  ))}
                </div>
                <textarea style={{ width: '100%', fontSize: 11, padding: 4, minHeight: 60, marginTop: 8, border: '1px solid #ccc', borderRadius: 3 }}
                  defaultValue={aVal('recommendations', 'details')} placeholder="Recommendation details..." disabled={!canEdit}
                  onBlur={e => aSet('recommendations', 'details', e.target.value)} />
                <div style={{ marginTop: 6 }}>
                  <strong style={{ fontSize: 12 }}>Deferral Reason:</strong>
                  <textarea style={{ width: '100%', fontSize: 11, padding: 4, minHeight: 40, marginTop: 4, border: '1px solid #ccc', borderRadius: 3 }}
                    defaultValue={aVal('recommendations', 'deferral_reason')} placeholder="If applicable..." disabled={!canEdit}
                    onBlur={e => aSet('recommendations', 'deferral_reason', e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== SCOPE TAB ===================== */}
      {tab === 'scope' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#0f3460', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
            onClick={() => setScopeOpen(!scopeOpen)}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Scope of Work Builder</h3>
            <span>{scopeOpen ? '\u25B2' : '\u25BC'}</span>
          </div>
          {scopeOpen && program && (() => {
            const measures = program.measures || [];
            const selectedMeasures = sc.selected_measures || [];
            const toggleMeasure = (name) => {
              const updated = selectedMeasures.includes(name) ? selectedMeasures.filter(m => m !== name) : [...selectedMeasures, name];
              const newScope = { ...sc, selected_measures: updated };
              saveScope(newScope);
            };

            // Auto-suggest from assessment
            const suggestions = [];
            if (aVal('recommendations', 'attic_insulation') === 'yes') suggestions.push('Attic Insulation');
            if (aVal('recommendations', 'wall_insulation') === 'yes') suggestions.push('Wall Insulation');
            if (aVal('recommendations', 'basement_insulation') === 'yes') suggestions.push('Basement/Crawlspace Wall Insulation');
            if (aVal('recommendations', 'air_sealing') === 'yes') suggestions.push('Air Sealing');
            if (aVal('recommendations', 'duct_sealing') === 'yes') suggestions.push('Duct Sealing');
            if (aVal('recommendations', 'rim_joist') === 'yes') suggestions.push('Rim Joist Insulation');
            if (aVal('recommendations', 'hvac_tune_clean') === 'yes') { suggestions.push('Gas Furnace Tune-Up'); suggestions.push('Boiler Tune-Up'); }
            if (aVal('recommendations', 'thermostat') === 'yes') { suggestions.push('Programmable Thermostat'); suggestions.push('Advanced Thermostat'); }

            const categories = [...new Set(measures.map(m => m.category))];
            return (
              <div style={{ padding: 16 }}>
                {suggestions.length > 0 && (
                  <div style={{ background: '#fff3e0', padding: 10, borderRadius: 6, marginBottom: 12 }}>
                    <strong style={{ fontSize: 12 }}>Auto-Suggested from Assessment:</strong>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {suggestions.map(s => (
                        <button key={s} className={`btn btn-sm ${selectedMeasures.includes(s) ? 'btn-success' : 'btn-warning'}`}
                          style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => toggleMeasure(s)}>
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
                      {measures.filter(m => m.category === cat).map(m => (
                        <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '3px 6px', background: selectedMeasures.includes(m.name) ? '#e8f5e9' : '#f9f9f9', borderRadius: 4, cursor: canEdit ? 'pointer' : 'default' }}>
                          <input type="checkbox" checked={selectedMeasures.includes(m.name)} disabled={!canEdit} onChange={() => toggleMeasure(m.name)} />
                          {m.name}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 12 }}>
                  <strong style={{ fontSize: 12 }}>Scope Notes:</strong>
                  <textarea style={{ width: '100%', fontSize: 11, padding: 4, minHeight: 60, marginTop: 4, border: '1px solid #ccc', borderRadius: 3 }}
                    defaultValue={sc.notes} disabled={!canEdit}
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

      {/* ===================== PHOTOS TAB ===================== */}
      {tab === 'photos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Project Photos</h3>
            <button className="btn btn-primary" onClick={() => setPhotoModal({ phase: 'assessment' })} style={{ fontSize: 13 }}>
              + Capture Photo
            </button>
          </div>

          {/* House Side Legend */}
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

          {/* Photos by Phase */}
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
                          <img src={`/api/programs/photos/${p.id}/image`} alt={p.description} style={{ width: '100%', height: 130, objectFit: 'cover' }} />
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
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 16 }}>Scheduling & Install Dates</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
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
              <div key={d.field} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <strong style={{ minWidth: 160 }}>{d.label}:</strong>
                <input type="date" value={job[d.field] || ''} disabled={!canEdit}
                  onChange={e => updateField(d.field, e.target.value)}
                  style={{ fontSize: 12, padding: '4px 6px' }} />
                {job[d.field] && <span style={{ color: '#27ae60', fontSize: 11 }}>Set</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== CHECKLIST TAB ===================== */}
      {tab === 'checklist' && (
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Documentation & Photo Checklist</h3>
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
                        await fetch(`/api/programs/jobs/checklist/${item.id}`, {
                          method: 'PUT', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ completed: !item.completed, completed_by: role })
                        });
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

      {/* ===================== HVAC TAB ===================== */}
      {tab === 'hvac' && (
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>HVAC Tune & Clean / Replacements</h3>
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

      {/* ===================== CHANGE ORDERS TAB ===================== */}
      {tab === 'change_orders' && (
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Change Orders</h3>
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
                      await fetch(`/api/programs/change-orders/${co.id}`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'approved', reviewed_by: role })
                      });
                      load();
                    }}>Approve</button>
                    <button className="btn btn-sm btn-danger" style={{ fontSize: 11 }} onClick={async () => {
                      await fetch(`/api/programs/change-orders/${co.id}`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'denied', reviewed_by: role })
                      });
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
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Export & Documentation</h3>
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

              {/* By House Side */}
              <h4 style={{ fontSize: 13, marginBottom: 8 }}>Photos by Side of House</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 16 }}>
                {Object.entries(exportData.by_side || {}).map(([side, photos]) => (
                  <div key={side} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6 }}>
                    <strong style={{ fontSize: 12, textTransform: 'capitalize' }}>{side} ({photos.length})</strong>
                    {photos.map(p => (
                      <div key={p.id} style={{ fontSize: 11, padding: '2px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p.has_photo && <img src={`/api/programs/photos/${p.id}/image`} alt="" style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 3 }} />}
                        <span>{p.description}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* By Phase */}
              <h4 style={{ fontSize: 13, marginBottom: 8 }}>Photos by Phase</h4>
              {Object.entries(exportData.photos_by_phase || {}).map(([phase, photos]) => (
                <div key={phase} style={{ marginBottom: 12 }}>
                  <strong style={{ fontSize: 12, textTransform: 'capitalize' }}>{phase.replace(/_/g, ' ')} ({photos.length})</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6, marginTop: 4 }}>
                    {photos.map(p => (
                      <div key={p.id} style={{ textAlign: 'center' }}>
                        {p.has_photo && <img src={`/api/programs/photos/${p.id}/image`} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 4 }} />}
                        <div style={{ fontSize: 10, marginTop: 2 }}>{p.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Checklist summary */}
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
