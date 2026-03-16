import React, { useState, useEffect } from 'react';
import * as api from '../api';
import CustomerAuthForm from './CustomerAuthForm';
import HSConsentForm from './HSConsentForm';

function compressFile(file) {
  return new Promise(resolve => {
    if (file.type === 'image/gif') { resolve(file); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1600;
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        c.toBlob(blob => resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })), 'image/jpeg', 0.7);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function FormsDocsTab({ job, canEdit, onUpdate, role, user }) {
  const [localScope, setLocalScope] = useState({});
  const [showAuthInline, setShowAuthInline] = useState(false);
  const [showHSInline, setShowHSInline] = useState(false);
  const [formPhotos, setFormPhotos] = useState({});
  const [uploading, setUploading] = useState({});
  const [viewPhoto, setViewPhoto] = useState(null);

  useEffect(() => {
    try {
      const raw = job.scope_data;
      setLocalScope(typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {}));
    } catch { setLocalScope({}); }
  }, [job.scope_data]);

  // Load form-related photos
  useEffect(() => {
    api.getJobPhotos(job.id).then(rows => {
      const grouped = {};
      for (const p of rows) {
        if (p.house_side === 'forms') {
          p.photo_src = p.photo_ref || p.photo_data || '';
          (grouped[p.description] ||= []).push(p);
        }
      }
      setFormPhotos(grouped);
    }).catch(() => {});
  }, [job.id]);

  const saveScope = async (data) => {
    setLocalScope(data);
    try {
      await api.saveScopeData(job.id, data);
      onUpdate({});
    } catch (err) { alert('Failed to save: ' + err.message); }
  };

  const handleFormStatusChange = (formKey, value) => {
    const updated = { ...localScope, forms: { ...(localScope.forms || {}), [formKey]: value } };
    saveScope(updated);
  };

  const handlePhotoUpload = async (formKey, file) => {
    setUploading(prev => ({ ...prev, [formKey]: true }));
    try {
      const compressed = await compressFile(file);
      await api.uploadJobPhoto(job.id, 'forms', formKey, 'docs', compressed, user?.full_name);
      // Reload photos
      const rows = await api.getJobPhotos(job.id);
      const grouped = {};
      for (const p of rows) {
        if (p.house_side === 'forms') {
          p.photo_src = p.photo_ref || p.photo_data || '';
          (grouped[p.description] ||= []).push(p);
        }
      }
      setFormPhotos(grouped);
    } catch (err) { console.error('Upload failed:', err); }
    setUploading(prev => ({ ...prev, [formKey]: false }));
  };

  const handlePhotoDelete = async (formKey, photo) => {
    try {
      await api.deleteJobPhoto(photo.id);
      setFormPhotos(prev => {
        const next = { ...prev };
        next[formKey] = (next[formKey] || []).filter(p => p.id !== photo.id);
        if (!next[formKey].length) delete next[formKey];
        return next;
      });
    } catch (err) { console.error('Delete failed:', err); }
  };

  const FORMS = [
    { name: 'Customer Authorization Form', desc: 'Customer signs via Adobe Sign', key: 'auth_form', hasInline: true, inlineType: 'auth' },
    { name: 'Customer-Signed Final Scope of Work', desc: 'Customer approves the final scope before install', key: 'signed_scope' },
    { name: 'Assessment Report (MS Form)', desc: 'MS Forms assessment survey completed', key: 'assessment_report', pdf: '/forms/ms-form.pdf' },
    { name: 'H&S Consent & Release Form', desc: 'Required when health & safety conditions are present', key: 'hazardous_form', hasInline: true, inlineType: 'hs' },
    { name: 'HEA IE Retrofit Form', desc: '2026 HEA IE Retrofit fillable form', key: 'hea_retrofit', pdf: '/forms/hea-ie-retrofit.pdf' },
    { name: 'Safety Plan', desc: 'Safety plan documentation', key: 'safety_plan', pdf: '/forms/safety-plan.pdf' },
    { name: 'Photo & Documentation Checklist', desc: 'Required photos and documentation per HES', key: 'photo_checklist', pdf: '/forms/photo-checklist.pdf' },
    { name: 'Sub-Contractor Estimates', desc: 'If applicable, for work outside scope', key: 'sub_estimates' },
    { name: 'Final Inspection Form', desc: 'QA inspector completes after install', key: 'final_inspection' },
    { name: 'Final Invoice', desc: 'Invoice for completed work', key: 'final_invoice' },
    { name: 'CSAT Leave Behind', desc: 'Customer satisfaction survey leave behind', key: 'csat', pdf: '/forms/csat-leave-behind.pdf' },
  ];

  const statusColors = {
    pending: { bg: 'var(--color-surface-alt)', border: 'var(--color-border)' },
    in_progress: { bg: '#fff7ed', border: '#fed7aa' },
    signed: { bg: '#dcfce7', border: '#86efac' },
    na: { bg: 'var(--color-surface)', border: 'var(--color-border)' },
  };

  // Check if auth/hs are already signed on the job
  const authSigned = !!job.authorization_signed_at;
  const hsSigned = !!job.hs_consent_signed_at;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* ── Required Forms & Signatures ── */}
      <div className="jd-card">
        <div className="jd-card-title">Required Forms & Signatures</div>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
          Track all forms that need to be signed and submitted for this project per 2026 HES requirements.
          Upload photos of signed documents for each form.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {FORMS.map(form => {
            const formStatus = (localScope.forms || {})[form.key] || 'pending';
            const colors = statusColors[formStatus] || statusColors.pending;
            const photos = formPhotos[form.key] || [];
            const isUploading = uploading[form.key];

            // Show signed status from job data for auth/hs forms
            const isAutoSigned = (form.key === 'auth_form' && authSigned) || (form.key === 'hazardous_form' && hsSigned);

            return (
              <div key={form.key} style={{
                padding: '12px 14px', borderRadius: 8,
                background: isAutoSigned ? '#dcfce7' : colors.bg,
                border: `1px solid ${isAutoSigned ? '#86efac' : colors.border}`,
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: photos.length > 0 || canEdit ? 10 : 0 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                      {isAutoSigned && <span style={{ color: '#16a34a', marginRight: 6 }}>&#10003;</span>}
                      {form.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{form.desc}</div>
                    {isAutoSigned && (
                      <div style={{ fontSize: 11, color: '#166534', fontWeight: 600, marginTop: 2 }}>
                        Signed digitally {form.key === 'auth_form'
                          ? `by ${job.authorization_signed_by} on ${new Date(job.authorization_signed_at).toLocaleDateString()}`
                          : `on ${new Date(job.hs_consent_signed_at).toLocaleDateString()}`}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {/* View PDF button */}
                    {form.pdf && (
                      <a href={form.pdf} target="_blank" rel="noopener noreferrer"
                        style={{
                          padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4,
                          background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1',
                          textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-block',
                        }}>
                        View PDF
                      </a>
                    )}
                    {/* Inline sign button for auth/hs forms */}
                    {form.hasInline && canEdit && !isAutoSigned && (
                      <button type="button"
                        style={{
                          padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4,
                          background: form.inlineType === 'auth' ? 'var(--color-primary)' : '#ea580c',
                          color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                        onClick={() => form.inlineType === 'auth' ? setShowAuthInline(true) : setShowHSInline(true)}>
                        Sign Now
                      </button>
                    )}
                    <select value={isAutoSigned ? 'signed' : formStatus} disabled={!canEdit || isAutoSigned}
                      onChange={e => handleFormStatusChange(form.key, e.target.value)}
                      style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--color-border)' }}>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="signed">Signed/Complete</option>
                      <option value="na">N/A</option>
                    </select>
                  </div>
                </div>

                {/* Photo uploads row */}
                {(photos.length > 0 || canEdit) && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {photos.map(p => (
                      <div key={p.id} style={{ position: 'relative', width: 56, height: 56, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                        <img src={p.photo_src} alt={form.name}
                          onClick={() => setViewPhoto(p.photo_src)}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--color-border)', borderRadius: 6 }} />
                        {canEdit && (
                          <button type="button" onClick={() => handlePhotoDelete(form.key, p)} style={{
                            position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer',
                            fontSize: 10, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>&times;</button>
                        )}
                      </div>
                    ))}
                    {canEdit && (
                      <>
                        <label style={{
                          width: 56, height: 56, borderRadius: 6, border: '2px dashed var(--color-border)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', background: 'var(--color-surface)', fontSize: 11,
                          color: 'var(--color-text-muted)', flexShrink: 0,
                        }} title="Take photo of signed form">
                          {isUploading ? <span className="photo-slot-spinner" style={{ width: 18, height: 18 }} /> : <>{'\uD83D\uDCF7'}<span style={{ fontSize: 9 }}>Photo</span></>}
                          <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(form.key, f); e.target.value = ''; }} />
                        </label>
                        <label style={{
                          width: 56, height: 56, borderRadius: 6, border: '1px solid var(--color-border)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', background: 'var(--color-surface)', fontSize: 11,
                          color: 'var(--color-text-muted)', flexShrink: 0,
                        }} title="Upload from gallery">
                          {'\uD83D\uDCC1'}<span style={{ fontSize: 9 }}>Upload</span>
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(form.key, f); e.target.value = ''; }} />
                        </label>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Inline Customer Auth Form ── */}
      {showAuthInline && (
        <div className="jd-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="jd-card-title" style={{ margin: 0 }}>Customer Authorization Form</div>
            <button type="button" onClick={() => setShowAuthInline(false)}
              style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--color-text-muted)' }}>&times;</button>
          </div>
          <CustomerAuthForm job={job} user={user} inline
            onClose={() => setShowAuthInline(false)}
            onSigned={() => { setShowAuthInline(false); onUpdate({}); }} />
        </div>
      )}

      {/* ── Inline H&S Consent Form ── */}
      {showHSInline && (
        <div className="jd-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="jd-card-title" style={{ margin: 0 }}>H&S Consent Form</div>
            <button type="button" onClick={() => setShowHSInline(false)}
              style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--color-text-muted)' }}>&times;</button>
          </div>
          <HSConsentForm job={job} user={user} inline hsConditions={[]}
            onClose={() => setShowHSInline(false)}
            onSigned={() => { setShowHSInline(false); onUpdate({}); }} />
        </div>
      )}

      {/* ── Documentation Checklist ── */}
      <div className="jd-card">
        <div className="jd-card-title">Documentation Checklist</div>
        {['job_paperwork', 'photo', 'paperwork'].map(type => {
          const items = (job.checklist || []).filter(c => c.item_type === type);
          if (items.length === 0) return null;
          return (
            <div key={type} style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, marginBottom: 8, textTransform: 'capitalize', color: 'var(--color-text-muted)' }}>
                {type === 'job_paperwork' ? 'Job Documentation' : type === 'photo' ? 'Photo Requirements' : 'Measure Paperwork'}
              </h4>
              {items.map(item => (
                <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 0', cursor: canEdit ? 'pointer' : 'default' }}>
                  <input type="checkbox" checked={!!item.completed} disabled={!canEdit}
                    style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
                    onChange={async () => {
                      await api.updateChecklist(item.id, { completed: !item.completed, completed_by: role });
                      onUpdate({});
                    }} />
                  <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                    {item.description}
                  </span>
                  {item.completed_date && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>({item.completed_date})</span>}
                </label>
              ))}
            </div>
          );
        })}
        {!(job.checklist || []).length && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: 16 }}>
            No checklist items yet. Items are added as the project progresses.
          </p>
        )}
      </div>

      {/* ── Photo lightbox ── */}
      {viewPhoto && (
        <div onClick={() => setViewPhoto(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <img src={viewPhoto} alt="Full size" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}
