import React, { useState, useEffect } from 'react';
import * as api from '../../api';
import { PHASE_LABEL } from './photoSectionsData';

const photoSrc = (p) => p.photo_ref || p.photo_data || '';

/**
 * Reusable photo checklist used by Assess, Install, and HVAC tabs.
 * Props:
 *   sections  – object like { "Category Name": [{ id, l, p }, ...] }
 *   job       – job object (needs .id)
 *   canEdit   – boolean
 *   user      – current user object
 */
export default function PhotoChecklist({ sections, job, canEdit, user }) {
  const [photoMap, setPhotoMap] = useState({});
  const [uploading, setUploading] = useState({});
  const [viewPhoto, setViewPhoto] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  const allItems = Object.entries(sections).flatMap(([, items]) => items);
  const knownIds = new Set(allItems.map(i => i.id));

  const reloadPhotos = async () => {
    try {
      const rows = await api.getJobPhotos(job.id);
      const grouped = {};
      for (const p of rows) {
        if (knownIds.has(p.description)) {
          p.photo_src = photoSrc(p);
          (grouped[p.description] ||= []).push(p);
        }
      }
      setPhotoMap(grouped);
    } catch { /* ignore */ }
  };

  useEffect(() => { reloadPhotos(); }, [job.id]); // eslint-disable-line

  // Poll photos every 10s for cross-device sync
  useEffect(() => {
    const iv = setInterval(reloadPhotos, 10000);
    return () => clearInterval(iv);
  }, [job.id]); // eslint-disable-line

  const getPhotos = id => photoMap[id] || [];
  const photoCount = id => (photoMap[id] || []).length;

  const handleUpload = async (cat, item, file) => {
    setUploading(prev => ({ ...prev, [item.id]: true }));
    try {
      await api.uploadJobPhoto(job.id, cat.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, ''), item.id, item.p, file, user?.full_name);
      await reloadPhotos();
    } catch (err) { console.error('Upload failed:', err); }
    setUploading(prev => ({ ...prev, [item.id]: false }));
  };

  const handleDelete = async (photo) => {
    try {
      await api.deleteJobPhoto(photo.id);
      setPhotoMap(prev => {
        const next = {};
        for (const k of Object.keys(prev)) {
          next[k] = prev[k].filter(p => p.id !== photo.id);
          if (!next[k].length) delete next[k];
        }
        return next;
      });
    } catch (err) { console.error('Delete failed:', err); }
  };

  const toggle = (cat) => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <>
      {Object.entries(sections).map(([cat, items]) => {
        const taken = items.filter(i => photoCount(i.id) > 0).length;
        const isCollapsed = collapsed[cat];
        return (
          <div key={cat} className="jd-card" style={{ padding: 0, overflow: 'hidden' }}>
            <button type="button" onClick={() => toggle(cat)} style={{
              width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-text-muted)' }}>{cat}</span>
              <span style={{ fontSize: 12, color: taken === items.length ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                {taken}/{items.length} {isCollapsed ? '\u25BC' : '\u25B2'}
              </span>
            </button>
            {!isCollapsed && (
              <div style={{ padding: '12px 20px', display: 'grid', gap: 12, borderTop: '1px solid var(--color-border)' }}>
                {items.map(item => {
                  const itemPhotos = getPhotos(item.id);
                  const busy = uploading[item.id];
                  return (
                    <div key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: itemPhotos.length > 0 ? 'var(--color-success)' : 'var(--color-text)' }}>
                          {itemPhotos.length > 0 ? '\u2713' : '\u25CB'} {item.l}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          background: item.p === 'pre' ? 'rgba(37,99,235,0.1)' : item.p === 'post' ? 'rgba(22,163,74,0.1)' : 'rgba(234,88,12,0.1)',
                          color: item.p === 'pre' ? '#2563eb' : item.p === 'post' ? '#16a34a' : '#ea580c' }}>
                          {PHASE_LABEL[item.p] || item.p}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {itemPhotos.map(p => (
                          <div key={p.id} style={{ position: 'relative', width: 64, height: 48, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                            <img src={p.photo_src} alt={item.l} onClick={() => setViewPhoto(p.photo_src)}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
                            {canEdit && (
                              <button type="button" onClick={() => handleDelete(p)} style={{
                                position: 'absolute', top: 1, right: 1, width: 16, height: 16, borderRadius: '50%',
                                background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer',
                                fontSize: 10, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                            )}
                          </div>
                        ))}
                        {canEdit && (
                          <>
                            <label style={{ minWidth: 64, height: 48, borderRadius: 6, border: '2px dashed var(--color-primary)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                              background: 'rgba(37,99,235,0.06)', padding: '4px 10px', gap: 2, flexShrink: 0 }}>
                              {busy ? <div className="photo-slot-spinner" /> : (
                                <><span style={{ fontSize: 18 }}>{'\uD83D\uDCF7'}</span><span style={{ fontSize: 9, fontWeight: 600, color: 'var(--color-primary)' }}>Camera</span></>
                              )}
                              <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(cat, item, f); e.target.value = ''; }} />
                            </label>
                            <label style={{ minWidth: 64, height: 48, borderRadius: 6, border: '1px solid var(--color-border)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                              background: 'var(--color-surface-alt)', padding: '4px 10px', gap: 2, flexShrink: 0 }}>
                              <span style={{ fontSize: 18 }}>{'\uD83D\uDCC1'}</span>
                              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--color-text-muted)' }}>Upload</span>
                              <input type="file" accept="image/*" style={{ display: 'none' }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(cat, item, f); e.target.value = ''; }} />
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {viewPhoto && (
        <div onClick={() => setViewPhoto(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <img src={viewPhoto} alt="Full size" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 8 }} />
        </div>
      )}
    </>
  );
}
