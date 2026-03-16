import React, { useState, useRef, useEffect } from 'react';
import * as api from '../api';

export default function CustomerAuthForm({ job, onClose, onSigned, user, inline }) {
  const canvasRef = useRef(null);
  const isDirty = useRef(false);
  const isDrawing = useRef(false);
  const [printedName, setPrintedName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [, forceUpdate] = useState(0);

  const today = new Date();
  const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleStart = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handleMove = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    if (!isDirty.current) {
      isDirty.current = true;
      forceUpdate(n => n + 1);
    }
  };

  const handleEnd = () => {
    isDrawing.current = false;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    isDirty.current = false;
    forceUpdate(n => n + 1);
  };

  const handleSubmit = async () => {
    if (!isDirty.current || !printedName.trim()) return;
    setSubmitting(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      await api.saveCustomerAuth(job.id, {
        signature: dataUrl,
        printed_name: printedName,
        signed_at: new Date().toISOString(),
        signed_by_name: user?.full_name || user?.email || 'Assessor'
      });
      onSigned();
    } catch (err) {
      alert('Error saving signature: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = isDirty.current && printedName.trim().length > 0;

  const content = (
    <div style={inline ? {} : { background: '#fff', borderRadius: 12, padding: 28, width: '90%', maxWidth: 800, maxHeight: '90vh', overflowY: 'scroll', position: 'relative' }}>
      {!inline && <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>&times;</button>}

      {/* ── Embedded PDF ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Customer Authorization Form</h3>
          <a href="/forms/customer-authorization.pdf" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary, #2563eb)', textDecoration: 'none' }}>
            Open PDF &#8599;
          </a>
        </div>
        <iframe
          src="/forms/customer-authorization.pdf"
          title="Customer Authorization Form"
          style={{ width: '100%', height: 500, border: '1px solid #ccc', borderRadius: 8, background: '#f9f9f9' }}
        />
      </div>

      {/* ── Signature Section ── */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
        <h4 style={{ margin: '0 0 16px', fontSize: 14, color: '#334155' }}>Customer Signature</h4>

        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          style={{ border: '1px solid #ccc', background: '#fff', display: 'block', touchAction: 'none', cursor: 'crosshair', maxWidth: '100%', borderRadius: 6 }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
        <button onClick={handleClear} style={{ marginTop: 8, marginBottom: 16, fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', color: '#6b7280', textDecoration: 'underline' }}>
          Clear Signature
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Customer Printed Name *</label>
            <input
              type="text"
              value={printedName}
              onChange={e => setPrintedName(e.target.value)}
              placeholder="Full name"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Date</label>
            <input type="text" value={dateStr} readOnly
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 6, background: '#f3f4f6', color: '#6b7280', fontSize: 14 }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Property Address</label>
          <input type="text" value={`${job.address || ''}, ${job.city || ''}${job.zip ? ' ' + job.zip : ''}`} readOnly
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 6, background: '#f3f4f6', color: '#6b7280', fontSize: 14 }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          style={{
            width: '100%', padding: '12px 24px',
            background: canSubmit && !submitting ? '#2563eb' : '#9ca3af',
            color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 15,
            cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Signature'}
        </button>
      </div>
    </div>
  );

  if (inline) return content;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {content}
    </div>
  );
}
