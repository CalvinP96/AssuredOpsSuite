import React, { useEffect } from 'react';

const ADOBE_SIGN_URL = 'https://assuredinsulation.na4.documents.adobe.com/public/esignWidget?wid=CBFCIBAA3AAABLblqZhDPusF-q5ykHj9_BmKVlxPcLPSz_v-Fly2eYhhccvu9N6-lkHKZzvE66sVlzqBwO5k*&hosted=false';

export default function HSConsentForm({ job, onClose, onSigned, user, hsConditions, inline }) {
  // Lock body scroll while open as overlay (skip for inline mode)
  useEffect(() => {
    if (inline) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [inline]);

  const content = (
    <div style={inline ? {} : { background: '#fff', borderRadius: 12, padding: 0, width: '95%', maxWidth: 900, maxHeight: '95vh', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {!inline && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Health &amp; Safety Consent Form</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>&times;</button>
        </div>
      )}

      {inline && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Health &amp; Safety Consent Form</h3>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {job.customer_name} &mdash; {job.address}, {job.city} {job.zip}
            </span>
          </div>
          {hsConditions && hsConditions.length > 0 && (
            <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, marginBottom: 12, fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: '#991b1b' }}>Conditions identified: </span>
              <span style={{ color: '#7f1d1d' }}>{hsConditions.join(', ')}</span>
            </div>
          )}
        </>
      )}

      <iframe
        src={ADOBE_SIGN_URL}
        title="Health & Safety Consent Form - Adobe Sign"
        frameBorder="0"
        style={{
          width: '100%',
          height: inline ? 700 : 'calc(95vh - 60px)',
          border: 0,
          overflow: 'hidden',
          minHeight: 500,
          minWidth: 300,
          borderRadius: inline ? 8 : 0,
        }}
      />
    </div>
  );

  if (inline) return content;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {content}
    </div>
  );
}
