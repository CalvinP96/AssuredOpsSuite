import React, { useState, useRef } from 'react';
import * as api from '../api';
import LazyPhoto from '../components/LazyPhoto';

const PHOTO_CHECKLIST = [
  {
    zone: 'HOME EXTERIOR',
    color: '#1565c0',
    bg: '#e3f2fd',
    items: [
      { name: 'Front of home', timing: 'PRE', note: 'address visible' },
      { name: 'Pre-existing damage', timing: 'PRE', note: '' },
      { name: 'Roof overall condition', timing: 'PRE', note: '' },
      { name: '3 other sides of home', timing: 'PRE', note: '' },
      { name: 'AC Condenser', timing: 'PRE', note: '' },
      { name: 'AC Condenser tag', timing: 'PRE', note: '' },
      { name: 'Vent terminations', timing: 'PRE', note: '' },
      { name: 'Gutters', timing: 'PRE', note: 'show downspouts/elbows/extensions' },
    ],
  },
  {
    zone: 'ATTIC',
    color: '#6a1b9a',
    bg: '#f3e5f5',
    items: [
      { name: 'Insulation', timing: 'BOTH', note: 'wide angle' },
      { name: 'Major bypasses', timing: 'PRE', note: '' },
      { name: 'Baffle needs', timing: 'PRE', note: '' },
      { name: 'Exhaust terminations', timing: 'PRE', note: '' },
      { name: 'Hatch', timing: 'PRE', note: '' },
      { name: 'Roof decking condition', timing: 'PRE', note: '' },
      { name: 'Pre-existing damage', timing: 'PRE', note: '' },
      { name: 'Bulk moisture/mold', timing: 'PRE', note: '' },
    ],
  },
  {
    zone: 'TOP FLOOR',
    color: '#00695c',
    bg: '#e0f2f1',
    items: [
      { name: 'Insulation opportunities', timing: 'PRE', note: '' },
      { name: 'Plumbing DI retrofits', timing: 'MEASURE', note: 'measure-specific' },
      { name: 'Pre-existing damage', timing: 'PRE', note: '' },
    ],
  },
  {
    zone: 'MAIN FLOOR',
    color: '#2e7d32',
    bg: '#e8f5e9',
    items: [
      { name: 'Insulation opportunities', timing: 'PRE', note: '' },
      { name: 'Plumbing DI retrofits', timing: 'MEASURE', note: 'measure-specific' },
      { name: 'Pre-existing damage', timing: 'PRE', note: '' },
      { name: 'Thermostat', timing: 'PRE', note: '' },
    ],
  },
  {
    zone: 'FOUNDATION',
    color: '#4e342e',
    bg: '#efebe9',
    items: [
      { name: 'Insulation opportunities', timing: 'PRE', note: '' },
      { name: 'Plumbing DI retrofits', timing: 'MEASURE', note: 'measure-specific' },
      { name: 'Pre-existing damage', timing: 'PRE', note: '' },
      { name: 'Furnace/FRN', timing: 'PRE', note: 'venting visible' },
      { name: 'Water Heater/HWT', timing: 'PRE', note: 'venting visible' },
      { name: 'Dryer vent', timing: 'PRE', note: 'vent+termination+cap' },
      { name: 'Bulk moisture/mold', timing: 'PRE', note: '' },
    ],
  },
  {
    zone: 'CAZ',
    color: '#c62828',
    bg: '#ffebee',
    items: [
      { name: 'Smoke/CO detectors', timing: 'PRE', note: '' },
      { name: 'DHW flue pipes config', timing: 'PRE', note: '' },
      { name: 'DHW data tag', timing: 'PRE', note: 'legible' },
      { name: 'Furnace flue config', timing: 'PRE', note: '' },
      { name: 'Furnace data tag', timing: 'PRE', note: 'legible' },
    ],
  },
  {
    zone: 'AIR SEAL',
    color: '#0277bd',
    bg: '#e1f5fe',
    items: [
      { name: 'Blower door setup', timing: 'DURING', note: 'with manometer' },
      { name: 'Manometer pre-CFM50', timing: 'PRE', note: 'legible' },
      { name: 'Manometer post-CFM50', timing: 'POST', note: 'legible' },
      { name: 'Common penetrations', timing: 'BOTH', note: '' },
    ],
  },
  {
    zone: 'DUCT SEAL',
    color: '#ef6c00',
    bg: '#fff3e0',
    items: [
      { name: 'Mastic/tape on ducts', timing: 'POST', note: '' },
      { name: 'Manometer duct leakage pre-CFM', timing: 'PRE', note: 'legible' },
      { name: 'Manometer duct leakage post-CFM', timing: 'POST', note: 'legible' },
    ],
  },
  {
    zone: 'ASHRAE FAN',
    color: '#37474f',
    bg: '#eceff1',
    items: [
      { name: 'Specs on box', timing: 'PRE', note: 'model number visible' },
      { name: 'Fan installed', timing: 'POST', note: '' },
      { name: 'Switch', timing: 'POST', note: '' },
    ],
  },
  {
    zone: 'NEW PRODUCTS',
    color: '#1b5e20',
    bg: '#e8f5e9',
    items: [
      { name: 'New HVAC', timing: 'POST', note: 'data tag visible' },
      { name: 'New furnace', timing: 'POST', note: 'data tag visible' },
      { name: 'New water heater', timing: 'POST', note: 'data tag visible' },
      { name: 'Smart thermostat', timing: 'POST', note: '' },
    ],
  },
];

const TIMING_COLORS = {
  PRE: { bg: '#fff3e0', text: '#e65100', label: 'PRE' },
  POST: { bg: '#e8f5e9', text: '#2e7d32', label: 'POST' },
  BOTH: { bg: '#e3f2fd', text: '#1565c0', label: 'PRE & POST' },
  DURING: { bg: '#fce4ec', text: '#c62828', label: 'DURING' },
  MEASURE: { bg: '#f3e5f5', text: '#6a1b9a', label: 'MEASURE' },
};

function matchPhoto(photos, zone, itemName, timing) {
  const zoneLC = zone.toLowerCase();
  const nameLC = itemName.toLowerCase();
  return photos.filter(p => {
    const desc = (p.description || '').toLowerCase();
    return desc.includes(nameLC) || (desc.includes(zoneLC) && desc.includes(nameLC.split(' ')[0]));
  });
}

export default function PhotosTab({ job, program, canEdit, onUpdate, role }) {
  const [uploadModal, setUploadModal] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const cameraRef = useRef(null);
  const canvasRef = useRef(null);

  const photos = job.photos || [];

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setCameraStream(stream);
      if (cameraRef.current) cameraRef.current.srcObject = stream;
    } catch {
      alert('Camera access denied. You can still upload from gallery.');
    }
  };

  const captureFromCamera = () => {
    if (!cameraRef.current || !canvasRef.current) return;
    const video = cameraRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.85));
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
    reader.onload = (ev) => setCapturedPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const submitPhoto = async () => {
    if (!capturedPhoto || !uploadModal) return;
    try {
      await api.uploadPhoto(job.id, {
        uploaded_by: role,
        role: role,
        phase: uploadModal.timing === 'POST' ? 'post_install' : 'assessment',
        measure_name: null,
        house_side: null,
        description: `[${uploadModal.zone}] ${uploadModal.item}`,
        photo_data: capturedPhoto,
        photo_ref: null,
        file_name: `${uploadModal.zone.toLowerCase().replace(/\s+/g, '_')}_${uploadModal.item.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`,
      });
      setCapturedPhoto(null);
      setUploadModal(null);
      onUpdate('_reload');
    } catch (err) {
      alert('Failed to upload: ' + err.message);
    }
  };

  // Count completed items per zone
  const getZoneProgress = (zoneData) => {
    let done = 0;
    zoneData.items.forEach(item => {
      const matched = matchPhoto(photos, zoneData.zone, item.name, item.timing);
      if (matched.length > 0) done++;
    });
    return { done, total: zoneData.items.length };
  };

  // Overall progress
  const totalItems = PHOTO_CHECKLIST.reduce((sum, z) => sum + z.items.length, 0);
  const totalDone = PHOTO_CHECKLIST.reduce((sum, z) => sum + getZoneProgress(z).done, 0);

  return (
    <div>
      {/* Progress header */}
      <div className="jd-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Photo Documentation Checklist</h3>
          <span style={{ fontSize: 13, fontWeight: 600, color: totalDone === totalItems ? '#2e7d32' : '#e65100' }}>
            {totalDone}/{totalItems} items
          </span>
        </div>
        <div style={{ background: '#e0e0e0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
          <div style={{ width: `${totalItems > 0 ? (totalDone / totalItems) * 100 : 0}%`, height: '100%', background: totalDone === totalItems ? '#4caf50' : '#ff9800', transition: 'width 0.3s' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {PHOTO_CHECKLIST.map(z => {
            const { done, total } = getZoneProgress(z);
            return (
              <span key={z.zone} style={{ fontSize: 10, padding: '2px 8px', background: done === total ? '#e8f5e9' : z.bg, color: done === total ? '#2e7d32' : z.color, borderRadius: 3, border: `1px solid ${done === total ? '#c8e6c9' : 'transparent'}` }}>
                {z.zone} {done}/{total}
              </span>
            );
          })}
        </div>
      </div>

      {/* Zone sections */}
      {PHOTO_CHECKLIST.map(zoneData => {
        const { done, total } = getZoneProgress(zoneData);
        return (
          <div key={zoneData.zone} className="jd-card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
            {/* Zone header */}
            <div style={{ padding: '8px 14px', background: zoneData.color, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 13 }}>{zoneData.zone}</strong>
              <span style={{ fontSize: 11, opacity: 0.9 }}>{done}/{total}</span>
            </div>

            {/* Photo items */}
            <div style={{ padding: '6px 0' }}>
              {zoneData.items.map((item, idx) => {
                const matched = matchPhoto(photos, zoneData.zone, item.name, item.timing);
                const hasPhoto = matched.length > 0;
                const timingInfo = TIMING_COLORS[item.timing] || TIMING_COLORS.PRE;

                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderBottom: idx < zoneData.items.length - 1 ? '1px solid #f0f0f0' : 'none', background: hasPhoto ? '#fafff9' : '#fff' }}>
                    {/* Checkbox */}
                    <div style={{ width: 20, height: 20, borderRadius: 4, border: hasPhoto ? '2px solid #4caf50' : '2px solid #ccc', background: hasPhoto ? '#4caf50' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {hasPhoto && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{'\u2713'}</span>}
                    </div>

                    {/* Thumbnail if uploaded */}
                    {hasPhoto && matched[0].has_photo && (
                      <LazyPhoto id={matched[0].id} alt={item.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                    )}

                    {/* Item details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: hasPhoto ? '#333' : '#555' }}>
                        {item.name}
                      </div>
                      {item.note && (
                        <div style={{ fontSize: 10, color: '#888' }}>{item.note}</div>
                      )}
                    </div>

                    {/* Timing badge */}
                    <span style={{ fontSize: 9, padding: '2px 6px', background: timingInfo.bg, color: timingInfo.text, borderRadius: 3, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {timingInfo.label}
                    </span>

                    {/* Upload button */}
                    {canEdit && !hasPhoto && (
                      <button
                        onClick={() => setUploadModal({ zone: zoneData.zone, item: item.name, timing: item.timing })}
                        style={{ fontSize: 10, padding: '4px 10px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        Upload
                      </button>
                    )}
                    {canEdit && hasPhoto && (
                      <span style={{ fontSize: 10, color: '#4caf50', fontWeight: 600, flexShrink: 0 }}>Done</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Upload modal */}
      {uploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, maxWidth: 500, width: '95%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15 }}>Upload Photo</h3>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{uploadModal.zone} &mdash; {uploadModal.item}</div>
              </div>
              <button onClick={() => { stopCamera(); setCapturedPhoto(null); setUploadModal(null); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>X</button>
            </div>

            <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden', marginBottom: 12, position: 'relative', minHeight: 180 }}>
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

            <button className="btn btn-success" disabled={!capturedPhoto} onClick={submitPhoto}
              style={{ width: '100%', padding: 10, fontSize: 14 }}>
              Save Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
