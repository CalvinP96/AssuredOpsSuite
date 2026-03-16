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

  const address = `${job.address || ''}, ${job.city || ''}${job.zip ? ' ' + job.zip : ''}`;

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

        <h2>Home Energy Savings Program</h2>
        <h3>Customer Authorization Form</h3>

        <p>
          Commonwealth Edison Company (&lsquo;ComEd&rsquo;), Nicor Gas, North Shore Gas, and Peoples Gas
          (collectively, the &lsquo;Utilities&rsquo;) are jointly funding the Home Energy Savings offering
          (&lsquo;Offering&rsquo;) for eligible residential customers to facilitate the identification and
          implementation of energy efficiency improvements available at their homes. As a customer of at
          least one of the Utilities, you may be eligible to receive comprehensive home improvements at no
          charge that will help you save energy and money on your monthly energy bills. This Customer
          Authorization Form sets forth the terms and conditions applicable to customers participating in
          the Offering.
        </p>

        <p>By signing below, I certify that:</p>
        <ol>
          <li>
            I am an account holder with one of the Utilities at the property address listed below and that
            I have the authority to accept the Offering Terms and Conditions outlined in this Customer
            Authorization form;
          </li>
          <li>I have read, understand, and agree to comply with the Offering Terms and Conditions; and</li>
          <li>
            If signing by electronic signature, I agree that my electronic signature is the legal equivalent
            of my handwritten signature.
          </li>
        </ol>

        <hr style={{ margin: '24px 0' }} />

        <h4>Customer Representative Signature</h4>
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          style={{ border: '1px solid #ccc', background: '#fff', display: 'block', touchAction: 'none', cursor: 'crosshair' }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
        <button onClick={handleClear} style={{ marginTop: 8, marginBottom: 16, fontSize: 13, cursor: 'pointer' }}>
          Clear
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Customer Printed Name</label>
            <input
              type="text"
              value={printedName}
              onChange={e => setPrintedName(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 6 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Date</label>
            <input
              type="text"
              value={dateStr}
              readOnly
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 6, background: '#f3f4f6', color: '#6b7280' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Property Address</label>
          <input
            type="text"
            value={address}
            readOnly
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 6, background: '#f3f4f6', color: '#6b7280' }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          style={{
            padding: '10px 24px',
            background: canSubmit && !submitting ? '#2563eb' : '#9ca3af',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
            marginBottom: 32
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Signature'}
        </button>

        <hr style={{ margin: '24px 0' }} />

        <h3>Terms and Conditions</h3>

        <h4>Offering Year</h4>
        <p>
          The Offering Year is from January 1st through December 31st. Eligible projects are accepted on a
          first-come, first-served basis until the conclusion of the Offering Year, or until Offering funds
          are exhausted, whichever comes first.
        </p>

        <h4>Implementing Contractor</h4>
        <p>
          The Utilities have contracted and authorized Resource Innovations, LLC (&ldquo;Implementing
          Contractor&rdquo;) to manage the Offering and oversee the delivery of energy efficiency services
          to eligible customers.
        </p>

        {/* TODO: Additional T&C sections to be added */}
      </div>
  );

  if (inline) return content;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {content}
    </div>
  );
}
