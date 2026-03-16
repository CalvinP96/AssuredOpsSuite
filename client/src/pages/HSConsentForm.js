import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as api from '../api';

/* ── Signature Pad ── */
function SignaturePad({ width, height, onChange, label }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const hasStrokes = useRef(false);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (touch.clientY - rect.top) * (canvasRef.current.height / rect.height),
    };
  }, []);

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    isDrawing.current = true;
  }, [getPos]);

  const draw = useCallback((e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    hasStrokes.current = true;
  }, [getPos]);

  const endDraw = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (hasStrokes.current) {
      onChange(canvasRef.current.toDataURL('image/png'));
    }
  }, [onChange]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokes.current = false;
    onChange(null);
  }, [onChange]);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{label}</span>
        <button type="button" onClick={clear}
          style={{ fontSize: 11, color: '#666', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '1px solid #999', borderRadius: 4, background: '#fff',
          cursor: 'crosshair', touchAction: 'none', display: 'block', maxWidth: '100%',
        }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
    </div>
  );
}

/* ── Component ── */
export default function HSConsentForm({ job, onClose, onSigned, user, hsConditions, inline }) {
  const [staffName, setStaffName] = useState(user?.full_name || '');
  const [description, setDescription] = useState((hsConditions || []).join('\n'));
  const [homeownerName, setHomeownerName] = useState('');
  const [homeownerSig, setHomeownerSig] = useState(null);
  const [staffSig, setStaffSig] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const canSubmit = homeownerSig && homeownerName.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await api.updateJob(job.id, {
        hs_consent_signed_at: new Date().toISOString(),
        hs_consent_homeowner_name: homeownerName.trim(),
        hs_consent_homeowner_signature: homeownerSig,
        hs_consent_staff_name: staffName,
        hs_consent_staff_signature: staffSig,
        hs_consent_description: description,
      });
      onSigned();
    } catch (err) {
      alert('Failed to save consent: ' + err.message);
    }
    setSubmitting(false);
  };

  // Lock body scroll while open (skip for inline mode)
  useEffect(() => {
    if (inline) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [inline]);

  const formContent = (
    <div style={inline ? {} : { maxWidth: 780, margin: '0 auto', padding: '32px 28px 60px', background: '#fff', minHeight: '100vh', boxShadow: '0 0 40px rgba(0,0,0,0.08)' }}>
      {!inline && (
        <button type="button" onClick={onClose}
          style={{ position: 'fixed', top: 16, right: 20, zIndex: 9001, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Close">&#10005;</button>
      )}

      {/* ── Embedded PDF ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>H&S Consent and Release Form</h3>
          <a href="/forms/hs-consent-release.pdf" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary, #2563eb)', textDecoration: 'none' }}>
            Open PDF &#8599;
          </a>
        </div>
        <iframe
          src="/forms/hs-consent-release.pdf"
          title="H&S Consent and Release Form"
          style={{ width: '100%', height: 500, border: '1px solid #ccc', borderRadius: 8, background: '#f9f9f9' }}
        />
      </div>

      {/* ── Fill-in Fields ── */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 16px', fontSize: 14, color: '#334155' }}>Form Details</h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Staff Name</label>
            <input type="text" value={staffName} onChange={e => setStaffName(e.target.value)}
              style={{ width: '100%', height: 36, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Customer Name</label>
            <input type="text" value={job.customer_name || ''} readOnly
              style={{ width: '100%', height: 36, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, background: '#f9f9f9', color: '#555' }} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>
            Description of hazardous condition(s)
          </label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            style={{ width: '100%', minHeight: 80, padding: '8px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
        </div>
      </div>

      {/* ── Signatures ── */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
        <h4 style={{ margin: '0 0 16px', fontSize: 14, color: '#334155' }}>Signatures</h4>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>
            Homeowner Name (print) <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input type="text" value={homeownerName} onChange={e => setHomeownerName(e.target.value)}
            placeholder="Full name"
            style={{ width: '100%', height: 36, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }} />
        </div>

        <SignaturePad width={400} height={120} label="Homeowner Signature *" onChange={setHomeownerSig} />

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Date</label>
          <input type="text" value={today} readOnly
            style={{ width: '100%', height: 36, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, background: '#f9f9f9', color: '#555' }} />
        </div>

        <SignaturePad width={300} height={80} label="Staff Signature" onChange={setStaffSig} />

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Staff Printed Name</label>
          <input type="text" value={staffName} readOnly
            style={{ width: '100%', height: 36, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, background: '#f9f9f9', color: '#555' }} />
        </div>

        <button type="button" onClick={handleSubmit} disabled={!canSubmit}
          style={{
            width: '100%', padding: '14px 24px', fontSize: 16, fontWeight: 700,
            background: '#1a237e', color: '#fff', border: 'none', borderRadius: 6, cursor: canSubmit ? 'pointer' : 'not-allowed',
            marginTop: 16, opacity: canSubmit ? 1 : 0.5,
          }}>
          {submitting ? 'Submitting...' : 'Submit Signed Consent'}
        </button>
      </div>
    </div>
  );

  if (inline) return formContent;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#f5f5f0', overflowY: 'auto' }}>
      {formContent}
    </div>
  );
}
