import React, { useState } from 'react';

export default function HESPortal() {
  const [hesUrl, setHesUrl] = useState(localStorage.getItem('hesUrl') || '');
  const [savedUrl, setSavedUrl] = useState(localStorage.getItem('hesUrl') || '');

  const saveUrl = (e) => {
    e.preventDefault();
    localStorage.setItem('hesUrl', hesUrl);
    setSavedUrl(hesUrl);
  };

  return (
    <div>
      <div className="section-header">
        <h2>HES IE Portal</h2>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Connect to HES IE Site</h3>
        <p style={{ color: '#888', marginBottom: 15 }}>
          Enter the URL of your HES IE site to embed it directly into AssuredOpsSuite.
          This gives your team quick access to the HES IE portal without leaving the company site.
        </p>
        <form onSubmit={saveUrl} style={{ display: 'flex', gap: 10, alignItems: 'end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>HES IE Site URL</label>
            <input
              type="url"
              placeholder="https://your-hes-ie-site.com"
              value={hesUrl}
              onChange={e => setHesUrl(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: 42 }}>Save & Connect</button>
        </form>
      </div>

      {savedUrl ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '10px 20px', background: '#f8f9fa', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#888' }}>Connected to: {savedUrl}</span>
            <a href={savedUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">Open in New Tab</a>
          </div>
          <iframe
            src={savedUrl}
            title="HES IE Portal"
            className="hes-frame"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: 48, marginBottom: 15 }}>🌐</p>
          <h3>No HES IE Site Connected</h3>
          <p style={{ color: '#888' }}>Enter the URL above to connect your HES IE site to AssuredOpsSuite.</p>
        </div>
      )}
    </div>
  );
}
