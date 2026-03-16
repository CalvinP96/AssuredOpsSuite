import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../../api';
import CustomerAuthForm from '../CustomerAuthForm';
import HSConsentForm from '../HSConsentForm';
import { PHOTO_ZONES, TIMING_COLORS } from './photoZonesData';

const today = () => new Date().toISOString().slice(0, 10);

const WX_OPTIONS = [
  'Attic Insulation', 'Attic Hatch', 'Attic Hatch Thermal Dome',
  'Air Seal', 'Bath Fan - No Light', 'Bath Fan - With Light',
  'Bath Fan Vent Kit', 'Kneewall Insulation', 'Tyvek',
  'Injection Foam Walls', 'Basement Blanket', 'Rim Joist Basement',
  'Crawlspace Wall Insulation', 'Rim Joist Crawlspace', 'Visqueen',
  'Dense Pack ULA (Garage Ceiling)', 'Dryer Vent Replacement', 'Dryer Vent Termination Cap',
  'Thermostat Replacement', 'Duct Seal', 'Roof Caps',
  'Weatherstrip', 'Door Sweep', 'Gutter Downspouts', 'Other',
];
const HS_OPTIONS = ['Gas Mechanical Repair', 'Mold Remediation', 'Water/Sewage Issues', 'Asbestos Abatement', 'Electrical Issues', 'Other'];

const DEFAULTS = {
  assessor_name: '', assessment_date: today(), num_occupants: '', tenant_type: '',
  roof_age: '', thermostat_type: '', drywall_ceiling: '', drywall_wall: '',
  walls_need_insulation: '', bath_fan_1_cfm: '', bath_fan_2_cfm: '', bath_fan_3_cfm: '',
  kitchen_fan_cfm: '', smoke_detectors_present: '', smoke_detectors_to_install: '',
  co_detectors_present: '', co_detectors_to_install: '', house_foundation: [],
  house_foundation_material: '', weatherization_recs: [], tenmats_needed: '',
  exterior_doors_needing_sweeps: '', health_safety: [], project_deferred: '', additional_notes: '',
};

function pillStyle(selected, pos) {
  const base = {
    padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    border: `1.5px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
    background: selected ? 'var(--color-primary)' : 'var(--color-surface)',
    color: selected ? '#fff' : 'var(--color-text)', transition: 'all 0.15s',
    borderRadius: 0, marginLeft: pos === 'first' ? 0 : -1,
  };
  if (pos === 'first') base.borderRadius = 'var(--radius) 0 0 var(--radius)';
  if (pos === 'last') base.borderRadius = '0 var(--radius) var(--radius) 0';
  if (pos === 'only') base.borderRadius = 'var(--radius)';
  return base;
}

export default function JobAssess({ job, canEdit, onUpdate, user }) {
  const [form, setForm] = useState({ ...DEFAULTS, assessor_name: user?.full_name || '' });
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState({});
  const [uploading, setUploading] = useState({});
  const [showAuthInline, setShowAuthInline] = useState(false);
  const [showHSInline, setShowHSInline] = useState(false);
  const [expandedZones, setExpandedZones] = useState({});
  const [viewPhoto, setViewPhoto] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    try {
      const raw = job.assessment_data;
      const parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
      setForm(prev => ({ ...prev, ...parsed }));
    } catch { /* keep defaults */ }
  }, [job.assessment_data]);

  useEffect(() => {
    api.getJobPhotos(job.id).then(rows => {
      const grouped = {};
      for (const p of rows) { const k = `${p.zone}/${p.label}`; (grouped[k] ||= []).push(p); }
      setPhotos(grouped);
    }).catch(() => {});
  }, [job.id]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const toggleArray = (field, value) => setForm(prev => {
    const arr = Array.isArray(prev[field]) ? prev[field] : [];
    return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
  });

  const doSave = useCallback(async (f) => {
    let existing = {};
    try { const raw = job.assessment_data; existing = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {}); } catch {}
    await onUpdate({ assessment_data: { ...existing, ...f } });
  }, [job.assessment_data, onUpdate]);

  const handleBlurSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(form), 2000);
  }, [form, doSave]);
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const handleSave = async () => {
    clearTimeout(saveTimer.current); setSaving(true);
    try { await doSave(form); } catch {}
    setSaving(false);
  };

  const reloadPhotos = async () => {
    const rows = await api.getJobPhotos(job.id);
    const grouped = {};
    for (const p of rows) { const k = `${p.zone}/${p.label}`; (grouped[k] ||= []).push(p); }
    setPhotos(grouped);
  };

  const handlePhotoUpload = async (zone, item, file) => {
    const pk = `${zone}/${item.key}`;
    setUploading(prev => ({ ...prev, [pk]: true }));
    try {
      await api.uploadJobPhoto(job.id, zone, item.key, item.timing.toLowerCase(), file, user?.full_name);
      await reloadPhotos();
    } catch (err) { console.error('Photo upload failed:', err); }
    setUploading(prev => ({ ...prev, [pk]: false }));
  };

  const handlePhotoDelete = async (photo) => {
    try {
      await api.deleteJobPhoto(photo.id, photo.storage_path || photo.photo_url);
      setPhotos(prev => {
        const next = {};
        for (const k of Object.keys(prev)) { next[k] = prev[k].filter(p => p.id !== photo.id); if (!next[k].length) delete next[k]; }
        return next;
      });
    } catch (err) { console.error('Photo delete failed:', err); }
  };

  const toggleZone = (zone) => setExpandedZones(prev => ({ ...prev, [zone]: !prev[zone] }));

  const PillRadio = ({ field, options }) => (
    <div style={{ display: 'inline-flex', flexWrap: 'wrap' }}>
      {options.map((opt, i) => {
        const pos = options.length === 1 ? 'only' : i === 0 ? 'first' : i === options.length - 1 ? 'last' : 'mid';
        return <button key={opt} type="button" disabled={!canEdit}
          style={pillStyle(form[field] === opt, pos)} onClick={() => set(field, opt)}>{opt}</button>;
      })}
    </div>
  );
  const CheckGrid = ({ field, options }) => (
    <div className="assess-check-grid">
      {options.map(opt => {
        const arr = Array.isArray(form[field]) ? form[field] : [];
        return (
          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={arr.includes(opt)} disabled={!canEdit}
              onChange={() => toggleArray(field, opt)} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
            {opt}
          </label>
        );
      })}
    </div>
  );
  const F = ({ label, children }) => (
    <div className="jd-field"><label className="jd-field-label">{label}</label>{children}</div>
  );
  const Inp = ({ field, type = 'text', ...rest }) => (
    <input type={type} value={form[field]} disabled={!canEdit}
      onChange={e => set(field, e.target.value)} onBlur={handleBlurSave} {...rest} />
  );
  const TimingBadge = ({ t }) => (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
      background: `${TIMING_COLORS[t]}18`, color: TIMING_COLORS[t] }}>{t}</span>
  );
  const photoCount = (zone, key) => (photos[`${zone}/${key}`] || []).length;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* ─── STEP 1: Customer Authorization ─── */}
      {job.authorization_signed_at ? (
        <div style={{ padding: '12px 16px', background: '#dcfce7', borderLeft: '4px solid #16a34a',
          borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, color: '#166534' }}>
          Authorization signed &#10003; by {job.authorization_signed_by} on {new Date(job.authorization_signed_at).toLocaleDateString()}
        </div>
      ) : (
        <div style={{ borderLeft: '4px solid #dc2626', borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)', background: 'var(--color-surface)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>STEP 1 &mdash; Customer Authorization</div>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              Have the customer read and sign the authorization form before beginning the assessment.
            </p>
            {canEdit && !showAuthInline && (
              <button type="button" className="btn btn-primary" style={{ marginTop: 12 }}
                onClick={() => setShowAuthInline(true)}>Sign Authorization</button>
            )}
          </div>
          {showAuthInline && (
            <div style={{ borderTop: '1px solid var(--color-border)', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <button type="button" onClick={() => setShowAuthInline(false)}
                  style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-muted)' }}>&times;</button>
              </div>
              <CustomerAuthForm job={job} user={user} inline
                onClose={() => setShowAuthInline(false)}
                onSigned={() => { setShowAuthInline(false); onUpdate({}); }} />
            </div>
          )}
        </div>
      )}

      {/* ─── Site Information ─── */}
      <div className="jd-card">
        <div className="jd-card-title">Site Information</div>
        <div className="jd-field-grid">
          <F label="Assessor Name"><Inp field="assessor_name" /></F>
          <F label="Date of Assessment"><Inp field="assessment_date" type="date" /></F>
          <F label="Number of Occupants"><Inp field="num_occupants" type="number" min="0" /></F>
          <F label="Tenant Type"><PillRadio field="tenant_type" options={['Owned', 'Rented']} /></F>
          <F label="Roof Age — estimate if unknown"><Inp field="roof_age" type="number" min="0" /></F>
          <F label="Thermostat Type"><PillRadio field="thermostat_type" options={['Non-programmable', 'Programmable', 'Smart', 'Other']} /></F>
          <F label="Drywall Ceiling Condition"><PillRadio field="drywall_ceiling" options={['Good', 'Poor']} /></F>
          <F label="Drywall Wall Condition"><PillRadio field="drywall_wall" options={['Good', 'Fair', 'Poor']} /></F>
          <F label="Walls Need Insulation?"><PillRadio field="walls_need_insulation" options={['Yes', 'No', 'Other']} /></F>
          <F label="Bath Fan 1 CFM"><Inp field="bath_fan_1_cfm" type="number" min="0" /></F>
          <F label="Bath Fan 2 CFM — 2nd full bath only"><Inp field="bath_fan_2_cfm" type="number" min="0" /></F>
          <F label="Bath Fan 3 CFM — 3rd full bath only"><Inp field="bath_fan_3_cfm" type="number" min="0" /></F>
          <F label="Kitchen Fan CFM"><Inp field="kitchen_fan_cfm" type="number" min="0" /></F>
          <F label="Smoke Detectors Present"><Inp field="smoke_detectors_present" type="number" min="0" /></F>
          <F label="Smoke Detectors to Install"><Inp field="smoke_detectors_to_install" type="number" min="0" /></F>
          <F label="CO Detectors Present"><Inp field="co_detectors_present" type="number" min="0" /></F>
          <F label="CO Detectors to Install"><Inp field="co_detectors_to_install" type="number" min="0" /></F>
        </div>
        <div style={{ marginTop: 16 }}>
          <F label="House Foundation"><CheckGrid field="house_foundation" options={['Slab', 'Basement', 'Crawlspace']} /></F>
        </div>
        <div style={{ marginTop: 16 }}>
          <F label="Foundation Material"><PillRadio field="house_foundation_material" options={['Poured Cement', 'Cement Block', 'Other']} /></F>
        </div>
      </div>

      {/* ─── Recommendations & Health/Safety ─── */}
      <div className="jd-card">
        <div className="jd-card-title">Recommendations &amp; Health/Safety</div>
        <div style={{ marginBottom: 20 }}>
          <F label="Weatherization Recommendations"><CheckGrid field="weatherization_recs" options={WX_OPTIONS} /></F>
        </div>
        <div className="jd-field-grid">
          <F label="Number of Tenmats Needed"><Inp field="tenmats_needed" type="number" min="0" /></F>
          <F label="Exterior Doors needing Sweeps / Weather Stripping"><Inp field="exterior_doors_needing_sweeps" type="number" min="0" /></F>
        </div>
        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <F label="Health &amp; Safety Conditions"><CheckGrid field="health_safety" options={HS_OPTIONS} /></F>
        </div>

        {/* ─── STEP 2: H&S Consent ─── */}
        {job.hs_consent_signed_at ? (
          <div style={{ padding: '12px 16px', background: '#dcfce7', borderLeft: '4px solid #16a34a',
            borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 16 }}>
            H&amp;S Consent signed &#10003; on {new Date(job.hs_consent_signed_at).toLocaleDateString()}
          </div>
        ) : Array.isArray(form.health_safety) && form.health_safety.length > 0 ? (
          <div style={{ borderLeft: '4px solid #ea580c', borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border)', background: 'var(--color-surface)', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#9a3412', marginBottom: 6 }}>STEP 2 &mdash; H&amp;S Consent Required</div>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
                Health &amp; safety conditions identified. Customer consent is required before proceeding.
              </p>
              {canEdit && !showHSInline && (
                <button type="button" className="btn" style={{ marginTop: 12, background: '#ea580c', color: '#fff', border: 'none', fontWeight: 700 }}
                  onClick={() => setShowHSInline(true)}>Sign H&amp;S Consent</button>
              )}
            </div>
            {showHSInline && (
              <div style={{ borderTop: '1px solid var(--color-border)', padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <button type="button" onClick={() => setShowHSInline(false)}
                    style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-muted)' }}>&times;</button>
                </div>
                <HSConsentForm job={job} user={user} inline hsConditions={form.health_safety || []}
                  onClose={() => setShowHSInline(false)}
                  onSigned={() => { setShowHSInline(false); onUpdate({}); }} />
              </div>
            )}
          </div>
        ) : null}

        <div style={{ marginBottom: 16 }}>
          <F label="Project Deferred?"><PillRadio field="project_deferred" options={['YES', 'NO']} /></F>
          {form.project_deferred === 'YES' && (
            <div style={{ marginTop: 10, padding: '10px 14px', background: '#fef3c7',
              border: '1px solid #fcd34d', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, color: '#92400e' }}>
              Project deferred &mdash; consider updating job status
            </div>
          )}
        </div>
        <F label="Additional Notes">
          <textarea value={form.additional_notes} disabled={!canEdit} rows={3}
            onChange={e => set('additional_notes', e.target.value)} onBlur={handleBlurSave} />
        </F>
      </div>

      {/* ─── Photo Checklist by Zone ─── */}
      {PHOTO_ZONES.map(({ zone, title, items }) => (
        <div key={zone} className="jd-card" style={{ padding: 0, overflow: 'hidden' }}>
          <button type="button" onClick={() => toggleZone(zone)} style={{
            width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-text-muted)' }}>{title}</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {items.reduce((n, it) => n + photoCount(zone, it.key), 0)} photos {expandedZones[zone] ? '\u25B2' : '\u25BC'}
            </span>
          </button>
          {expandedZones[zone] && (
            <div style={{ padding: '12px 20px', display: 'grid', gap: 16, borderTop: '1px solid var(--color-border)' }}>
              {items.map(item => {
                const pk = `${zone}/${item.key}`;
                const itemPhotos = photos[pk] || [];
                return (
                  <div key={item.key} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{item.label}</span>
                      <TimingBadge t={item.timing} />
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{item.note}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {itemPhotos.map(p => (
                        <div key={p.id} style={{ position: 'relative', width: 80, height: 60, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                          <img src={p.photo_url} alt={item.label} onClick={() => setViewPhoto(p.photo_url)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
                          {canEdit && (
                            <button type="button" onClick={() => handlePhotoDelete(p)} style={{
                              position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%',
                              background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer',
                              fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                          )}
                        </div>
                      ))}
                      {canEdit && itemPhotos.length < 10 && (
                        <label style={{ width: 80, height: 60, borderRadius: 6, border: '2px dashed var(--color-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          background: 'var(--color-surface-alt)', fontSize: 20, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                          {uploading[pk] ? <div className="photo-slot-spinner" /> : '+'}
                          <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(zone, item, f); e.target.value = ''; }} />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {canEdit && (
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}
          style={{ width: '100%', padding: '12px 24px', fontSize: 15, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Save Assessment'}
        </button>
      )}

      {viewPhoto && (
        <div onClick={() => setViewPhoto(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <img src={viewPhoto} alt="Full size" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}
