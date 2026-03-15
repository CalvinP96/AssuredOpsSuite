import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../api';

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

function isPreTiming(t) { return t === 'PRE' || t === 'BOTH' || t === 'DURING' || t === 'MEASURE'; }
function isPostTiming(t) { return t === 'POST' || t === 'BOTH'; }

function matchPhoto(photos, zone, itemName) {
  const zoneLC = zone.toLowerCase();
  const nameLC = itemName.toLowerCase();
  return photos.filter(p => {
    const hs = (p.house_side || '').toLowerCase();
    const lbl = (p.label || p.description || '').toLowerCase();
    return (hs === zoneLC && lbl.includes(nameLC)) ||
           (lbl.includes(zoneLC) && lbl.includes(nameLC.split(' ')[0])) ||
           (lbl.includes(`[${zoneLC}] ${nameLC}`));
  });
}

export default function PhotosTab({ job, program, canEdit, onUpdate, role, user }) {
  const [viewMode, setViewMode] = useState('all');
  const [collapsed, setCollapsed] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const [lbIndex, setLbIndex] = useState(0);
  const [uploading, setUploading] = useState(null);
  const [photos, setPhotos] = useState([]);
  const fileRef = useRef(null);

  const loadPhotos = useCallback(async () => {
    try {
      const data = await api.getJobPhotos(job.id);
      setPhotos(data);
    } catch {
      setPhotos(job.photos || []);
    }
  }, [job.id, job.photos]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const toggleZone = (zone) => setCollapsed(c => ({ ...c, [zone]: !c[zone] }));

  const handleUpload = async (zone, itemName, timing, file) => {
    if (!file) return;
    setUploading(`${zone}-${itemName}`);
    try {
      await api.uploadJobPhoto(job.id, zone, itemName, timing.toLowerCase(), file, user?.full_name);
      await loadPhotos();
      if (onUpdate) onUpdate('_reload');
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (photo) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      let storagePath = null;
      if (photo.photo_url) {
        const marker = '/object/public/job-photos/';
        const idx = photo.photo_url.indexOf(marker);
        if (idx >= 0) storagePath = photo.photo_url.substring(idx + marker.length);
      }
      await api.deleteJobPhoto(photo.id, storagePath);
      await loadPhotos();
      if (onUpdate) onUpdate('_reload');
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Build flat list for lightbox navigation
  const allPhotosFlat = photos.filter(p => p.photo_url || p.photo_data || p.photo_ref);

  const openLightbox = (photo) => {
    setLightbox(photo);
    setLbIndex(allPhotosFlat.findIndex(p => p.id === photo.id));
  };

  const lbPrev = () => {
    if (lbIndex > 0) { setLbIndex(lbIndex - 1); setLightbox(allPhotosFlat[lbIndex - 1]); }
  };
  const lbNext = () => {
    if (lbIndex < allPhotosFlat.length - 1) { setLbIndex(lbIndex + 1); setLightbox(allPhotosFlat[lbIndex + 1]); }
  };

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowLeft') lbPrev();
      if (e.key === 'ArrowRight') lbNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const getPhotoUrl = (p) => p.photo_url || (p.photo_data ? `data:image/jpeg;base64,${p.photo_data}` : null);

  // Progress
  const totalItems = PHOTO_CHECKLIST.reduce((s, z) => s + z.items.length, 0);
  const totalDone = PHOTO_CHECKLIST.reduce((s, z) => {
    return s + z.items.filter(item => matchPhoto(photos, z.zone, item.name).length > 0).length;
  }, 0);

  // Filter items per view mode
  const getFilteredZones = () => {
    if (viewMode === 'all') return PHOTO_CHECKLIST;
    if (viewMode === 'pre') return PHOTO_CHECKLIST.map(z => ({
      ...z, items: z.items.filter(i => isPreTiming(i.timing))
    })).filter(z => z.items.length > 0);
    if (viewMode === 'post') return PHOTO_CHECKLIST.map(z => ({
      ...z, items: z.items.filter(i => isPostTiming(i.timing))
    })).filter(z => z.items.length > 0);
    return PHOTO_CHECKLIST;
  };

  // Side-by-side pairs
  const buildPairs = () => {
    const pairs = [];
    PHOTO_CHECKLIST.forEach(z => {
      z.items.forEach(item => {
        if (!isPreTiming(item.timing) && !isPostTiming(item.timing)) return;
        const matched = matchPhoto(photos, z.zone, item.name);
        const prePhotos = matched.filter(p => ['assessment', 'pre_install', 'pre', 'during', 'measure'].includes((p.phase || '').toLowerCase()));
        const postPhotos = matched.filter(p => ['post_install', 'post', 'post_installation'].includes((p.phase || '').toLowerCase()));
        if (prePhotos.length > 0 || postPhotos.length > 0) {
          pairs.push({ zone: z.zone, color: z.color, label: item.name, prePhotos, postPhotos });
        }
      });
    });
    return pairs;
  };

  const viewBtnStyle = (mode) => ({
    flex: 1, padding: '8px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: viewMode === mode ? 700 : 500,
    background: viewMode === mode ? 'var(--color-primary)' : 'var(--color-surface-alt)',
    color: viewMode === mode ? '#fff' : 'var(--color-text-muted)',
    transition: 'all 0.15s',
  });

  return (
    <div>
      {/* Progress header */}
      <div className="jd-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Photo Documentation</h3>
          <span style={{ fontSize: 13, fontWeight: 600, color: totalDone === totalItems ? '#2e7d32' : '#e65100' }}>
            {totalDone}/{totalItems} items
          </span>
        </div>
        <div style={{ background: '#e0e0e0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
          <div style={{ width: `${totalItems > 0 ? (totalDone / totalItems) * 100 : 0}%`, height: '100%', background: totalDone === totalItems ? '#4caf50' : '#ff9800', transition: 'width 0.3s' }} />
        </div>

        {/* View toggles */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <button style={viewBtnStyle('all')} onClick={() => setViewMode('all')}>All Photos</button>
          <button style={viewBtnStyle('pre')} onClick={() => setViewMode('pre')}>Pre-Install</button>
          <button style={viewBtnStyle('post')} onClick={() => setViewMode('post')}>Post-Install</button>
          <button style={viewBtnStyle('side')} onClick={() => setViewMode('side')}>Side by Side</button>
        </div>

        {/* Zone summary chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {PHOTO_CHECKLIST.map(z => {
            const done = z.items.filter(i => matchPhoto(photos, z.zone, i.name).length > 0).length;
            return (
              <span key={z.zone} style={{ fontSize: 10, padding: '2px 8px', background: done === z.items.length ? '#e8f5e9' : z.bg, color: done === z.items.length ? '#2e7d32' : z.color, borderRadius: 3, border: `1px solid ${done === z.items.length ? '#c8e6c9' : 'transparent'}` }}>
                {z.zone} {done}/{z.items.length}
              </span>
            );
          })}
        </div>
      </div>

      {/* === SIDE BY SIDE VIEW === */}
      {viewMode === 'side' && (() => {
        const pairs = buildPairs();
        if (pairs.length === 0) return (
          <div className="jd-card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>↔</div>
            <div style={{ fontSize: 14 }}>No photos to compare yet. Upload pre and post photos to see side-by-side.</div>
          </div>
        );
        let currentZone = '';
        return pairs.map((pair, pi) => {
          const showHeader = pair.zone !== currentZone;
          currentZone = pair.zone;
          return (
            <React.Fragment key={pi}>
              {showHeader && (
                <div style={{ fontSize: 13, fontWeight: 700, color: pair.color, margin: '16px 0 8px', padding: '4px 0', borderBottom: `2px solid ${pair.color}` }}>
                  {pair.zone}
                </div>
              )}
              <div className="jd-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ padding: '6px 12px', background: '#fff3e0', fontSize: 11, fontWeight: 700, color: '#e65100', textAlign: 'center' }}>
                    PRE — {pair.label}
                  </div>
                  <div style={{ padding: '6px 12px', background: '#e8f5e9', fontSize: 11, fontWeight: 700, color: '#2e7d32', textAlign: 'center' }}>
                    POST — {pair.label}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 120 }}>
                  <div style={{ borderRight: '1px solid var(--color-border)', padding: 8, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                    {pair.prePhotos.length > 0 ? pair.prePhotos.map((p, i) => {
                      const url = getPhotoUrl(p);
                      return url ? (
                        <img key={i} src={url} alt="" onClick={() => openLightbox(p)}
                          style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 4, cursor: 'pointer' }} />
                      ) : null;
                    }) : <div style={{ color: '#999', fontSize: 12, padding: 20 }}>No pre photo</div>}
                  </div>
                  <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                    {pair.postPhotos.length > 0 ? pair.postPhotos.map((p, i) => {
                      const url = getPhotoUrl(p);
                      return url ? (
                        <img key={i} src={url} alt="" onClick={() => openLightbox(p)}
                          style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 4, cursor: 'pointer' }} />
                      ) : null;
                    }) : <div style={{ color: '#999', fontSize: 12, padding: 20 }}>No post photo</div>}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        });
      })()}

      {/* === ALL / PRE / POST VIEWS === */}
      {viewMode !== 'side' && getFilteredZones().map(zoneData => {
        const done = zoneData.items.filter(i => matchPhoto(photos, zoneData.zone, i.name).length > 0).length;
        const isCollapsed = collapsed[zoneData.zone];

        return (
          <div key={zoneData.zone} className="jd-card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
            {/* Zone header - clickable to collapse */}
            <div
              onClick={() => toggleZone(zoneData.zone)}
              style={{ padding: '10px 14px', background: zoneData.color, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
              <strong style={{ fontSize: 13 }}>
                <span style={{ marginRight: 8, fontSize: 10, display: 'inline-block', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>&#9660;</span>
                {zoneData.zone}
              </strong>
              <span style={{ fontSize: 11, opacity: 0.9 }}>
                {done === zoneData.items.length && <span style={{ marginRight: 4 }}>{'\u2713'}</span>}
                {done}/{zoneData.items.length}
              </span>
            </div>

            {/* Photo items */}
            {!isCollapsed && (
              <div style={{ padding: '6px 0' }}>
                {zoneData.items.map((item, idx) => {
                  const matched = matchPhoto(photos, zoneData.zone, item.name);
                  const hasPhotoMatch = matched.length > 0;
                  const timingInfo = TIMING_COLORS[item.timing] || TIMING_COLORS.PRE;
                  const isUploading = uploading === `${zoneData.zone}-${item.name}`;

                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderBottom: idx < zoneData.items.length - 1 ? '1px solid #f0f0f0' : 'none', background: hasPhotoMatch ? '#fafff9' : '#fff' }}>
                      {/* Checkbox indicator */}
                      <div style={{ width: 20, height: 20, borderRadius: 4, border: hasPhotoMatch ? '2px solid #4caf50' : '2px solid #ccc', background: hasPhotoMatch ? '#4caf50' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {hasPhotoMatch && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{'\u2713'}</span>}
                      </div>

                      {/* Thumbnails */}
                      {hasPhotoMatch && matched.slice(0, 3).map((p, i) => {
                        const url = getPhotoUrl(p);
                        return url ? (
                          <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                            <img src={url} alt={item.name} onClick={() => openLightbox(p)}
                              style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid #e0e0e0', display: 'block' }} />
                            {canEdit && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
                                style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }}>
                                &#10005;
                              </button>
                            )}
                          </div>
                        ) : null;
                      })}
                      {matched.length > 3 && <span style={{ fontSize: 10, color: '#666', flexShrink: 0 }}>+{matched.length - 3}</span>}

                      {/* Item details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: hasPhotoMatch ? '#333' : '#555' }}>
                          {item.name}
                        </div>
                        {item.note && <div style={{ fontSize: 10, color: '#888' }}>{item.note}</div>}
                      </div>

                      {/* Timing badge */}
                      <span style={{ fontSize: 9, padding: '2px 6px', background: timingInfo.bg, color: timingInfo.text, borderRadius: 3, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {timingInfo.label}
                      </span>

                      {/* Upload button */}
                      {canEdit && (
                        <label style={{ fontSize: 10, padding: '4px 10px', background: hasPhotoMatch ? '#e8f5e9' : '#1976d2', color: hasPhotoMatch ? '#2e7d32' : '#fff', border: 'none', borderRadius: 4, cursor: isUploading ? 'wait' : 'pointer', flexShrink: 0, whiteSpace: 'nowrap', fontWeight: 600, display: 'inline-block' }}>
                          {isUploading ? 'Uploading...' : hasPhotoMatch ? '+ Add' : 'Upload'}
                          <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} disabled={isUploading}
                            onChange={(e) => { handleUpload(zoneData.zone, item.name, item.timing, e.target.files[0]); e.target.value = ''; }} />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* === LIGHTBOX === */}
      {lightbox && (() => {
        const url = getPhotoUrl(lightbox);
        return (
          <>
            <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 5000 }} />
            <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5001, padding: 20 }}>
              {/* Close */}
              <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5002 }}>
                &#10005;
              </button>

              {/* Image */}
              {url && <img src={url} alt="" style={{ maxWidth: '90vw', maxHeight: '75vh', objectFit: 'contain', borderRadius: 8 }} />}

              {/* Prev */}
              {lbIndex > 0 && (
                <button onClick={lbPrev} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: 22, zIndex: 5002, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  &#8592;
                </button>
              )}

              {/* Next */}
              {lbIndex < allPhotosFlat.length - 1 && (
                <button onClick={lbNext} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: 22, zIndex: 5002, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  &#8594;
                </button>
              )}

              {/* Info bar */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', padding: '40px 20px 20px', textAlign: 'center', color: '#fff' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                  {lightbox.label || lightbox.description || 'Photo'}
                </div>
                <div style={{ fontSize: 12, color: '#aaa' }}>
                  {lightbox.house_side || lightbox.phase || ''} {lightbox.created_at ? new Date(lightbox.created_at).toLocaleString() : ''}
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
