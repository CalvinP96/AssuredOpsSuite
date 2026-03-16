import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PhotoSlot } from '../../components/ui';
import * as api from '../../api';
import CustomerAuthForm from '../CustomerAuthForm';
import HSConsentForm from '../HSConsentForm';

const today = () => new Date().toISOString().slice(0, 10);

const PHOTO_SLOTS = [
  { key: 'front_of_home', label: 'Front of Home', timing: 'PRE', required: true },
  { key: 'attic_insulation', label: 'Attic Insulation', timing: 'PRE', required: true, note: 'Wide angle' },
  { key: 'furnace', label: 'Furnace / Heating System', timing: 'PRE', required: true, note: 'Venting must be visible' },
  { key: 'water_heater', label: 'Water Heater', timing: 'PRE', required: true, note: 'Venting must be visible' },
  { key: 'thermostat', label: 'Thermostat', timing: 'PRE', required: true },
  { key: 'smoke_co_detectors', label: 'Smoke / CO Detectors', timing: 'PRE', required: true },
];

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

const HS_OPTIONS = [
  'Gas Mechanical Repair', 'Mold Remediation', 'Water/Sewage Issues',
  'Asbestos Abatement', 'Electrical Issues', 'Other',
];

const DEFAULTS = {
  assessor_name: '', assessment_date: today(), num_occupants: '', tenant_type: '',
  roof_age: '', thermostat_type: '', drywall_ceiling: '', drywall_wall: '',
  walls_need_insulation: '', bath_fan_1_cfm: '', bath_fan_2_cfm: '', bath_fan_3_cfm: '',
  kitchen_fan_cfm: '', smoke_detectors_present: '', smoke_detectors_to_install: '',
  co_detectors_present: '', co_detectors_to_install: '', house_foundation: [],
  house_foundation_material: '', weatherization_recs: [], tenmats_needed: '',
  exterior_doors_needing_sweeps: '', health_safety: [], project_deferred: '',
  additional_notes: '',
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
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [showHSForm, setShowHSForm] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    try {
      const raw = job.assessment_data;
      const parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
      setForm(prev => ({ ...prev, ...parsed }));
      if (parsed.photos) setPhotos(parsed.photos);
    } catch { /* keep defaults */ }
  }, [job.assessment_data]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const toggleArray = (field, value) => setForm(prev => {
    const arr = Array.isArray(prev[field]) ? prev[field] : [];
    return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
  });

  const doSave = useCallback(async (f, p) => {
    let existing = {};
    try {
      const raw = job.assessment_data;
      existing = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
    } catch { /* ignore */ }
    await onUpdate({ assessment_data: { ...existing, ...f, photos: p } });
  }, [job.assessment_data, onUpdate]);

  const handleBlurSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(form, photos), 2000);
  }, [form, photos, doSave]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const handleSave = async () => {
    clearTimeout(saveTimer.current);
    setSaving(true);
    try { await doSave(form, photos); } catch { /* handled upstream */ }
    setSaving(false);
  };

  const handlePhotoUpload = async (slotKey, file) => {
    setUploading(prev => ({ ...prev, [slotKey]: true }));
    try {
      const slot = PHOTO_SLOTS.find(s => s.key === slotKey);
      const url = await api.uploadJobPhoto(job.id, 'assessment', slot.label, 'pre', file, user?.full_name);
      setPhotos(prev => ({ ...prev, [slotKey]: url }));
    } catch (err) { console.error('Photo upload failed:', err); }
    setUploading(prev => ({ ...prev, [slotKey]: false }));
  };

  const handlePhotoDelete = (slotKey) => {
    setPhotos(prev => { const n = { ...prev }; delete n[slotKey]; return n; });
  };

  /* ── Sub-components ── */
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
              onChange={() => toggleArray(field, opt)}
              style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
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
  const Banner = ({ bg, border, color, children }) => (
    <div style={{ marginBottom: 16, padding: '10px 14px', background: bg, border: `1px solid ${border}`,
      borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, color,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* ─── SECTION 1: Authorization Status ─── */}
      {job.authorization_signed_at ? (
        <Banner bg="#dcfce7" border="#86efac" color="#166534">
          <span>&#10003; Authorization signed by {job.authorization_signed_by} on {new Date(job.authorization_signed_at).toLocaleDateString()}</span>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAuthForm(true)}>View</button>
        </Banner>
      ) : (
        <Banner bg="#fee2e2" border="#fca5a5" color="#991b1b">
          <span>Customer Authorization Required</span>
          {canEdit && <button type="button" className="btn btn-sm"
            style={{ background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700 }}
            onClick={() => setShowAuthForm(true)}>Sign Authorization</button>}
        </Banner>
      )}

      {/* ─── SECTION 2: Site Information ─── */}
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

        {job.hs_consent_signed_at ? (
          <Banner bg="#dcfce7" border="#86efac" color="#166534">
            <span>&#10003; H&amp;S Consent signed on {new Date(job.hs_consent_signed_at).toLocaleDateString()}</span>
          </Banner>
        ) : Array.isArray(form.health_safety) && form.health_safety.length > 0 ? (
          <Banner bg="#fff7ed" border="#fdba74" color="#9a3412">
            <span>H&amp;S conditions identified &mdash; customer consent required</span>
            {canEdit && <button type="button" className="btn btn-sm"
              style={{ background: '#ea580c', color: '#fff', border: 'none', fontWeight: 700 }}
              onClick={() => setShowHSForm(true)}>Sign H&amp;S Consent</button>}
          </Banner>
        ) : null}

        <div style={{ marginBottom: 16 }}>
          <F label="Project Deferred?"><PillRadio field="project_deferred" options={['YES', 'NO']} /></F>
          {form.project_deferred === 'YES' && (
            <div style={{ marginTop: 10, padding: '10px 14px', background: '#fef3c7',
              border: '1px solid #fcd34d', borderRadius: 'var(--radius)', fontSize: 13,
              fontWeight: 600, color: '#92400e' }}>
              Project deferred &mdash; consider updating job status
            </div>
          )}
        </div>

        <F label="Additional Notes">
          <textarea value={form.additional_notes} disabled={!canEdit} rows={3}
            onChange={e => set('additional_notes', e.target.value)} onBlur={handleBlurSave} />
        </F>
      </div>

      {/* ─── SECTION 3: Assessment Photos ─── */}
      <div className="jd-card">
        <div className="jd-card-title">Assessment Photos</div>
        <div className="assess-photo-grid">
          {PHOTO_SLOTS.map(slot => (
            <PhotoSlot key={slot.key} label={slot.label} timing={slot.timing}
              required={slot.required} note={slot.note} canEdit={canEdit}
              photoUrl={photos[slot.key]} loading={uploading[slot.key]}
              onUpload={file => handlePhotoUpload(slot.key, file)}
              onDelete={() => handlePhotoDelete(slot.key)} />
          ))}
        </div>
      </div>

      {/* ─── Save ─── */}
      {canEdit && (
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}
          style={{ width: '100%', padding: '12px 24px', fontSize: 15, fontWeight: 700,
            opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Save Assessment'}
        </button>
      )}

      {showAuthForm && <CustomerAuthForm job={job} user={user}
        onClose={() => setShowAuthForm(false)}
        onSigned={() => { setShowAuthForm(false); window.location.reload(); }} />}
      {showHSForm && <HSConsentForm job={job} user={user}
        hsConditions={form.health_safety || []}
        onClose={() => setShowHSForm(false)}
        onSigned={() => { setShowHSForm(false); window.location.reload(); }} />}
    </div>
  );
}
