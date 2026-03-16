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

/* ── Styles ── */
const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9000,
    background: '#f5f5f0', overflowY: 'auto',
  },
  page: {
    maxWidth: 780, margin: '0 auto', padding: '32px 28px 60px',
    background: '#fff', minHeight: '100vh',
    boxShadow: '0 0 40px rgba(0,0,0,0.08)',
  },
  closeBtn: {
    position: 'fixed', top: 16, right: 20, zIndex: 9001,
    width: 36, height: 36, borderRadius: '50%',
    background: 'rgba(0,0,0,0.7)', color: '#fff',
    border: 'none', cursor: 'pointer', fontSize: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoRow: {
    textAlign: 'center', padding: '12px 0 8px',
    fontSize: 15, fontWeight: 700, color: '#1a237e',
    letterSpacing: '0.5px', borderBottom: '2px solid #1a237e',
    marginBottom: 4,
    fontFamily: 'Georgia, "Times New Roman", serif',
  },
  title: {
    textAlign: 'center', fontSize: 16, fontWeight: 700,
    margin: '10px 0 24px', color: '#333',
    fontFamily: 'Georgia, "Times New Roman", serif',
  },
  sectionHead: {
    fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '1px', color: '#555', margin: '28px 0 12px',
    paddingBottom: 6, borderBottom: '1px solid #ccc',
    fontFamily: 'Georgia, "Times New Roman", serif',
  },
  fieldRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '12px 20px', marginBottom: 12,
  },
  label: {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: '#555', marginBottom: 4,
  },
  input: {
    width: '100%', height: 36, padding: '6px 10px',
    border: '1px solid #ccc', borderRadius: 4,
    fontSize: 14, background: '#fff', color: '#222',
  },
  inputRO: {
    width: '100%', height: 36, padding: '6px 10px',
    border: '1px solid #ddd', borderRadius: 4,
    fontSize: 14, background: '#f9f9f9', color: '#555',
  },
  textarea: {
    width: '100%', minHeight: 80, padding: '8px 10px',
    border: '1px solid #ccc', borderRadius: 4,
    fontSize: 14, resize: 'vertical', fontFamily: 'inherit',
  },
  checkbox: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    fontSize: 13, lineHeight: 1.5, marginBottom: 10, cursor: 'pointer',
  },
  subCheckbox: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    fontSize: 13, lineHeight: 1.5, marginBottom: 8,
    marginLeft: 28, cursor: 'pointer',
  },
  ackText: {
    fontSize: 13, lineHeight: 1.6, color: '#333',
    margin: '12px 0 20px', padding: '12px 16px',
    background: '#fffde7', border: '1px solid #fff9c4',
    borderRadius: 4,
  },
  footer: {
    fontSize: 10, color: '#888', lineHeight: 1.5,
    textAlign: 'center', marginTop: 32, paddingTop: 16,
    borderTop: '1px solid #ddd',
  },
  submitBtn: {
    width: '100%', padding: '14px 24px', fontSize: 16, fontWeight: 700,
    background: '#1a237e', color: '#fff', border: 'none',
    borderRadius: 6, cursor: 'pointer', marginTop: 24,
    transition: 'opacity 0.15s',
  },
};

/* ── Component ── */
export default function HSConsentForm({ job, onClose, onSigned, user, hsConditions, inline }) {
  const [staffName, setStaffName] = useState(user?.full_name || '');
  const [description, setDescription] = useState((hsConditions || []).join('\n'));
  const [nextStep1, setNextStep1] = useState(false);
  const [nextStep2, setNextStep2] = useState(false);
  const [nextStep2a, setNextStep2a] = useState(false);
  const [nextStep2b, setNextStep2b] = useState(false);
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
      <div style={inline ? {} : S.page}>
        {/* ── HEADER ── */}
        <div style={S.logoRow}>
          ComEd &nbsp;|&nbsp; Nicor Gas &nbsp;|&nbsp; Peoples Gas &nbsp;|&nbsp; North Shore Gas
        </div>
        <div style={S.title}>
          Home Energy Savings offering &mdash; Consent and release
        </div>

        {/* ── FORM FIELDS ── */}
        <div style={S.sectionHead}>Project Information</div>

        <div style={S.fieldRow}>
          <div>
            <label style={S.label}>Staff Name</label>
            <input style={S.input} type="text" value={staffName}
              onChange={e => setStaffName(e.target.value)} />
          </div>
          <div>
            <label style={S.label}>Customer Name</label>
            <input style={S.inputRO} type="text" value={job.customer_name || ''} readOnly />
          </div>
        </div>

        <div style={S.fieldRow}>
          <div>
            <label style={S.label}>Customer Address</label>
            <input style={S.inputRO} type="text" value={job.address || ''} readOnly />
          </div>
          <div>
            <label style={S.label}>City</label>
            <input style={S.inputRO} type="text" value={job.city || ''} readOnly />
          </div>
        </div>

        <div style={S.fieldRow}>
          <div>
            <label style={S.label}>State</label>
            <input style={S.inputRO} type="text" value="IL" readOnly />
          </div>
          <div>
            <label style={S.label}>ZIP</label>
            <input style={S.inputRO} type="text" value={job.zip || ''} readOnly />
          </div>
        </div>

        {/* ── DESCRIPTION ── */}
        <div style={S.sectionHead}>Hazardous Condition Description</div>

        <p style={{ fontSize: 14, fontWeight: 700, color: '#b71c1c', lineHeight: 1.5, marginBottom: 12 }}>
          A potentially hazardous condition has been observed in your home that may cause
          unsafe conditions for living and/or work.
        </p>

        <label style={S.label}>Description of condition(s)</label>
        <textarea style={S.textarea} value={description}
          onChange={e => setDescription(e.target.value)} />

        {/* ── RECOMMENDED NEXT STEPS ── */}
        <div style={S.sectionHead}>Recommended Next Steps</div>

        <label style={S.checkbox}>
          <input type="checkbox" checked={nextStep1} onChange={() => setNextStep1(!nextStep1)}
            style={{ width: 16, height: 16, marginTop: 2, accentColor: '#1a237e', flexShrink: 0 }} />
          <span>
            No action is required by the customer. The Home Energy Savings contractors will
            perform work to remediate this condition before resuming any work on home upgrades
            or improvements.
          </span>
        </label>

        <label style={S.checkbox}>
          <input type="checkbox" checked={nextStep2} onChange={() => setNextStep2(!nextStep2)}
            style={{ width: 16, height: 16, marginTop: 2, accentColor: '#1a237e', flexShrink: 0 }} />
          <span>Action required by customer:</span>
        </label>

        {nextStep2 && (
          <>
            <label style={S.subCheckbox}>
              <input type="checkbox" checked={nextStep2a} onChange={() => setNextStep2a(!nextStep2a)}
                style={{ width: 16, height: 16, marginTop: 2, accentColor: '#1a237e', flexShrink: 0 }} />
              <span>
                Hire a qualified contractor to identify remediation plans and remedy unsafe conditions.
              </span>
            </label>
            <label style={S.subCheckbox}>
              <input type="checkbox" checked={nextStep2b} onChange={() => setNextStep2b(!nextStep2b)}
                style={{ width: 16, height: 16, marginTop: 2, accentColor: '#1a237e', flexShrink: 0 }} />
              <span>
                Uncertain of level of severity. Contact a contractor to confirm your safety.
              </span>
            </label>
          </>
        )}

        {/* ── CUSTOMER ACKNOWLEDGEMENT ── */}
        <div style={S.sectionHead}>Customer Acknowledgement</div>

        <div style={S.ackText}>
          By signing below, you understand that Home Energy Savings contractors will not provide
          any additional home upgrades or improvements until the customer has completed all
          required actions and the issues described above have been remediated.
        </div>

        {/* ── SIGNATURES ── */}
        <div style={S.sectionHead}>Signatures</div>

        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Homeowner Name (print) <span style={{ color: '#dc2626' }}>*</span></label>
          <input style={S.input} type="text" value={homeownerName}
            onChange={e => setHomeownerName(e.target.value)}
            placeholder="Full name" />
        </div>

        <SignaturePad
          width={400} height={120}
          label="Homeowner Signature *"
          onChange={setHomeownerSig}
        />

        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Date</label>
          <input style={S.inputRO} type="text" value={today} readOnly />
        </div>

        <SignaturePad
          width={300} height={80}
          label="Staff Signature"
          onChange={setStaffSig}
        />

        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Staff Printed Name</label>
          <input style={S.inputRO} type="text" value={staffName} readOnly />
        </div>

        {/* ── FOOTER ── */}
        <div style={S.footer}>
          Terms and conditions apply. Offer subject to change. Installed products may vary.
          This program is funded by ComEd, Nicor Gas, Peoples Gas and North Shore Gas customers
          in compliance with state law.
        </div>

        {/* ── SUBMIT ── */}
        <button type="button" onClick={handleSubmit} disabled={!canSubmit}
          style={{ ...S.submitBtn, opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
          {submitting ? 'Submitting...' : 'Submit Signed Consent'}
        </button>
      </div>
  );

  if (inline) return formContent;
  return (
    <div style={S.overlay}>
      <button type="button" onClick={onClose} style={S.closeBtn} title="Close">&#10005;</button>
      {formContent}
    </div>
  );
}
