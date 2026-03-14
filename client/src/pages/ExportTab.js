import React, { useState, useEffect } from 'react';
import * as api from '../api';
import LazyPhoto from '../components/LazyPhoto';

export default function ExportTab({ job, program, canEdit, onUpdate }) {
  const [exportData, setExportData] = useState(null);

  useEffect(() => {
    api.getJobExport(job.id).then(setExportData).catch(err => alert('Failed to load export: ' + err.message));
  }, [job.id]);

  return (
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
  );
}
