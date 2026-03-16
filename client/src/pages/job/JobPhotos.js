import React, { useState, useEffect } from 'react';
import * as api from '../../api';
import { PHOTO_SECTIONS, PHASE_LABEL } from './photoSectionsData';

const photoSrc = (p) => p.photo_ref || p.photo_data || '';

function zoneKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}

export default function JobPhotos({ job, canEdit, user }) {
  const [photoMap, setPhotoMap] = useState({});
  const [preview, setPreview] = useState(null);
  const [viewMode, setViewMode] = useState('role');
  const [uploading, setUploading] = useState({});

  const getPhotos = id => photoMap[id] || [];
  const hasP = id => (photoMap[id] || []).length > 0;

  const allItems = Object.entries(PHOTO_SECTIONS).flatMap(([cat, items]) => items.map(i => ({ ...i, cat })));
  const preSections = Object.entries(PHOTO_SECTIONS).filter(([cat]) => cat.includes('(Pre)'));
  const postSections = Object.entries(PHOTO_SECTIONS).filter(([cat]) => cat.includes('(Post)'));
  const hvacSections = Object.entries(PHOTO_SECTIONS).filter(([cat]) => cat.startsWith('HVAC'));
  const replSections = Object.entries(PHOTO_SECTIONS).filter(([cat]) => cat.startsWith('HVAC Replacement'));
  const preItems = preSections.flatMap(([, items]) => items);
  const postItems = postSections.flatMap(([, items]) => items);
  const hvacItems = hvacSections.flatMap(([, items]) => items);
  const preTaken = preItems.filter(i => hasP(i.id)).length;
  const postTaken = postItems.filter(i => hasP(i.id)).length;
  const hvacTaken = hvacItems.filter(i => hasP(i.id)).length;
  const totalTaken = allItems.filter(i => hasP(i.id)).length;

  const reloadPhotos = async () => {
    try {
      const rows = await api.getJobPhotos(job.id);
      const grouped = {};
      for (const p of rows) {
        p.photo_src = photoSrc(p);
        (grouped[p.description] ||= []).push(p);
      }
      setPhotoMap(grouped);
    } catch { /* ignore */ }
  };

  useEffect(() => { reloadPhotos(); }, [job.id]); // eslint-disable-line

  const handleUpload = async (cat, item, file) => {
    setUploading(prev => ({ ...prev, [item.id]: true }));
    try {
      await api.uploadJobPhoto(job.id, zoneKey(cat), item.id, item.p, file, user?.full_name);
      await reloadPhotos();
    } catch (err) { console.error('Upload failed:', err); }
    setUploading(prev => ({ ...prev, [item.id]: false }));
  };

  const handleDelete = async (itemId, idx) => {
    const arr = getPhotos(itemId);
    const photo = arr[idx];
    if (!photo) return;
    try {
      await api.deleteJobPhoto(photo.id);
      setPhotoMap(prev => {
        const next = { ...prev };
        next[itemId] = (next[itemId] || []).filter(p => p.id !== photo.id);
        if (!next[itemId].length) delete next[itemId];
        return next;
      });
    } catch (err) { console.error('Delete failed:', err); }
    setPreview(null);
  };

  /* ── Preview overlay ── */
  if (preview) {
    const arr = getPhotos(preview.id);
    const ph = arr[preview.idx];
    const it = allItems.find(x => x.id === preview.id);
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#000', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 8 }}>
          <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', padding: '4px 8px' }}
            onClick={() => setPreview(null)}>{'\u2190'} Back</button>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 14, color: '#fff' }}>
            {it?.l} {arr.length > 1 ? `(${preview.idx + 1}/${arr.length})` : ''}
          </div>
          {canEdit && (
            <button style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
              onClick={() => handleDelete(preview.id, preview.idx)}>Delete</button>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, position: 'relative' }}>
          {ph?.photo_src && <img src={ph.photo_src} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8 }} alt="" />}
          {arr.length > 1 && preview.idx > 0 && (
            <button onClick={() => setPreview({ ...preview, idx: preview.idx - 1 })}
              style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.2)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer' }}>{'\u2039'}</button>
          )}
          {arr.length > 1 && preview.idx < arr.length - 1 && (
            <button onClick={() => setPreview({ ...preview, idx: preview.idx + 1 })}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.2)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer' }}>{'\u203A'}</button>
          )}
        </div>
        <div style={{ padding: 12, textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
          {ph?.uploaded_by}{ph?.created_at ? ` \u00B7 ${new Date(ph.created_at).toLocaleString()}` : ''}
        </div>
      </div>
    );
  }

  /* ── PhotoRow ── */
  const PhotoRow = ({ it, cat }) => {
    const arr = getPhotos(it.id);
    const has = arr.length > 0;
    const busy = uploading[it.id];
    return (
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: has ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
            {has ? '\u2713' : '\u25CB'} {it.l}
            {arr.length > 1 && <span style={{ fontSize: 10, color: 'var(--color-primary)', marginLeft: 4 }}>({arr.length})</span>}
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
            {PHASE_LABEL[it.p] || it.p}{has && arr[0].uploaded_by ? ` \u00B7 ${arr[0].uploaded_by}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
          {arr.map((ph, idx) => (
            <button key={ph.id} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              onClick={() => setPreview({ id: it.id, idx })}>
              <img src={ph.photo_src} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--color-border)' }} alt="" />
            </button>
          ))}
          {canEdit && (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: 6, border: '2px dashed var(--color-primary)',
              background: 'rgba(37,99,235,0.06)', cursor: 'pointer', color: 'var(--color-primary)', gap: 1 }}
              title={has ? 'Add another' : 'Take photo'}>
              {busy ? <span className="photo-slot-spinner" style={{ width: 18, height: 18 }} /> : (
                <><span style={{ fontSize: 16 }}>{'\uD83D\uDCF7'}</span><span style={{ fontSize: 8, fontWeight: 700 }}>Camera</span></>
              )}
              <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(cat, it, f); e.target.value = ''; }} />
            </label>
          )}
          {canEdit && (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: 6, border: '1px solid var(--color-border)',
              background: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-text-muted)', gap: 1 }}
              title="Upload from gallery">
              <span style={{ fontSize: 16 }}>{'\uD83D\uDCC1'}</span><span style={{ fontSize: 8, fontWeight: 700 }}>Upload</span>
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(cat, it, f); e.target.value = ''; }} />
            </label>
          )}
        </div>
      </div>
    );
  };

  /* ── Side-by-side pairs — match Pre/Post categories by base name ── */
  const buildPairs = () => {
    const pairs = [];
    const usedPost = new Set();
    preSections.forEach(([preCat, preItms]) => {
      const catBase = preCat.replace(/ \(Pre\)| \(Post\)/g, '');
      const postMatch = postSections.find(([pc]) => pc.replace(/ \(Pre\)| \(Post\)/g, '') === catBase);
      preItms.forEach(preIt => {
        const preArr = getPhotos(preIt.id);
        let postIt = null;
        if (postMatch) {
          postIt = postMatch[1].find(po => !usedPost.has(po.id) && hasP(po.id));
          if (!postIt) postIt = postMatch[1].find(po => !usedPost.has(po.id));
          if (postIt) usedPost.add(postIt.id);
        }
        if (preArr.length > 0 || postIt) {
          pairs.push({ preCat: catBase, preIt, postIt, preArr, postArr: postIt ? getPhotos(postIt.id) : [] });
        }
      });
    });
    // Remaining post items not yet paired
    postSections.forEach(([postCat, postItms]) => {
      postItms.filter(po => !usedPost.has(po.id) && hasP(po.id)).forEach(po => {
        usedPost.add(po.id);
        pairs.push({ preCat: postCat.replace(/ \(Pre\)| \(Post\)/g, ''), preIt: null, postIt: po, preArr: [], postArr: getPhotos(po.id) });
      });
    });
    return pairs;
  };

  /* ── Helpers ── */
  const tabStyle = mode => ({
    flex: 1, padding: '8px 4px', borderRadius: 6,
    border: `1px solid ${viewMode === mode ? 'var(--color-primary)' : 'var(--color-border)'}`,
    background: viewMode === mode ? 'rgba(37,99,235,0.1)' : 'var(--color-surface)',
    color: viewMode === mode ? 'var(--color-primary)' : 'var(--color-text-muted)',
    fontSize: 11, fontWeight: viewMode === mode ? 700 : 500, cursor: 'pointer', textAlign: 'center',
  });

  const Sec = ({ title, children }) => (
    <div className="jd-card">
      <div className="jd-card-title">{title}</div>
      {children}
    </div>
  );

  const progBar = (taken, total, color) => (
    <div style={{ height: 6, background: 'var(--color-surface-alt)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
      <div style={{ height: '100%', width: `${total ? (taken / total) * 100 : 0}%`, background: color || 'var(--color-primary)', transition: 'width 0.3s' }} />
    </div>
  );

  const SectionBlock = ({ sections: secs, color }) => secs.map(([cat, items]) => {
    const cd = items.filter(i => hasP(i.id)).length;
    return (
      <div key={cat} style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: color || 'var(--color-primary)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span>{cat}</span>
          <span style={{ color: cd === items.length ? 'var(--color-success)' : 'var(--color-text-muted)' }}>{cd}/{items.length}</span>
        </div>
        {items.map(it => <PhotoRow key={it.id} it={it} cat={cat} />)}
      </div>
    );
  });

  /* ── Render ── */
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* ── HEADER ── */}
      <Sec title={<>Photos <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>{totalTaken}/{allItems.length}</span></>}>
        {progBar(totalTaken, allItems.length, 'var(--color-primary)')}
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          <button type="button" onClick={() => setViewMode('role')} style={tabStyle('role')}>By Role</button>
          <button type="button" onClick={() => setViewMode('all')} style={tabStyle('all')}>All</button>
          <button type="button" onClick={() => setViewMode('compare')} style={tabStyle('compare')}>Side-by-Side</button>
        </div>
      </Sec>

      {/* ═══ VIEW: BY ROLE ═══ */}
      {viewMode === 'role' && <>
        <Sec title={<span style={{ color: 'var(--color-primary)' }}>Assessor &mdash; Pre-Install <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>{preTaken}/{preItems.length}</span></span>}>
          {progBar(preTaken, preItems.length, 'var(--color-primary)')}
          <SectionBlock sections={preSections} color="var(--color-primary)" />
        </Sec>

        <Sec title={<span style={{ color: '#f97316' }}>Install Crew &mdash; Post-Install <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>{postTaken}/{postItems.length}</span></span>}>
          {progBar(postTaken, postItems.length, '#f97316')}
          <SectionBlock sections={postSections} color="#f97316" />
        </Sec>

        {hvacSections.length > 0 && (
          <Sec title={<span style={{ color: '#ea580c' }}>HVAC <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>{hvacTaken}/{hvacItems.length}</span></span>}>
            {progBar(hvacTaken, hvacItems.length, '#ea580c')}
            <SectionBlock sections={hvacSections} color="#ea580c" />
          </Sec>
        )}
      </>}

      {/* ═══ VIEW: ALL ═══ */}
      {viewMode === 'all' && Object.entries(PHOTO_SECTIONS).map(([cat, items]) => {
        const cd = items.filter(i => hasP(i.id)).length;
        return (
          <Sec key={cat} title={<>{cat} <span style={{ fontWeight: 400, color: cd === items.length ? 'var(--color-success)' : 'var(--color-text-muted)' }}>{cd}/{items.length}</span></>}>
            {items.map(it => <PhotoRow key={it.id} it={it} cat={cat} />)}
          </Sec>
        );
      })}

      {/* ═══ VIEW: SIDE-BY-SIDE ═══ */}
      {viewMode === 'compare' && (() => {
        const pairs = buildPairs();
        if (pairs.length === 0) return (
          <Sec title="Side-by-Side Comparison">
            <p style={{ color: 'var(--color-text-muted)', fontSize: 12, textAlign: 'center', padding: 20 }}>
              Take pre photos (from Assess tab) and post photos (from Install tab) to see them side-by-side.
            </p>
          </Sec>
        );
        const grouped = {};
        pairs.forEach(pr => { (grouped[pr.preCat] ||= []).push(pr); });
        return Object.entries(grouped).map(([catBase, catPairs]) => (
          <Sec key={catBase} title={<>{'\u2194'} {catBase}</>}>
            {catPairs.map((pr, pi) => (
              <div key={pi} style={{ marginBottom: 12, border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
                {/* Labels */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ padding: '6px 8px', background: 'rgba(37,99,235,0.06)', fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', textAlign: 'center' }}>
                    PRE &mdash; {pr.preIt?.l || '\u2014'}
                  </div>
                  <div style={{ padding: '6px 8px', background: 'rgba(249,115,22,0.06)', fontSize: 10, fontWeight: 700, color: '#f97316', textAlign: 'center' }}>
                    POST &mdash; {pr.postIt?.l || '\u2014'}
                  </div>
                </div>
                {/* Images */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 100 }}>
                  <div style={{ borderRight: '1px solid var(--color-border)', padding: 4, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
                    {pr.preArr.length > 0 ? pr.preArr.map((ph, idx) => (
                      <button key={ph.id} onClick={() => setPreview({ id: pr.preIt.id, idx })}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%' }}>
                        <img src={ph.photo_src} style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 4 }} alt="" />
                      </button>
                    )) : <div style={{ color: 'var(--color-text-muted)', fontSize: 11, padding: 20 }}>No pre photo</div>}
                  </div>
                  <div style={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
                    {pr.postArr.length > 0 ? pr.postArr.map((ph, idx) => (
                      <button key={ph.id} onClick={() => setPreview({ id: pr.postIt.id, idx })}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%' }}>
                        <img src={ph.photo_src} style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 4 }} alt="" />
                      </button>
                    )) : <div style={{ color: 'var(--color-text-muted)', fontSize: 11, padding: 20 }}>No post photo</div>}
                  </div>
                </div>
                {/* Metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--color-border)', fontSize: 9, color: 'var(--color-text-muted)' }}>
                  <div style={{ padding: '3px 8px' }}>
                    {pr.preArr[0]?.uploaded_by || ''}{pr.preArr[0]?.created_at ? ` \u00B7 ${new Date(pr.preArr[0].created_at).toLocaleDateString()}` : ''}
                  </div>
                  <div style={{ padding: '3px 8px' }}>
                    {pr.postArr[0]?.uploaded_by || ''}{pr.postArr[0]?.created_at ? ` \u00B7 ${new Date(pr.postArr[0].created_at).toLocaleDateString()}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </Sec>
        ));
      })()}
    </div>
  );
}
