import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const PHOTO_SLOTS = [
  { key: 'front_of_home', label: 'Front of Home', timing: 'PRE' },
  { key: 'attic_insulation', label: 'Attic Insulation', timing: 'PRE', hint: 'wide angle' },
  { key: 'furnace', label: 'Furnace / Heating System', timing: 'PRE', hint: 'venting visible' },
  { key: 'water_heater', label: 'Water Heater', timing: 'PRE', hint: 'venting visible' },
  { key: 'thermostat', label: 'Thermostat', timing: 'PRE' },
  { key: 'smoke_co_detectors', label: 'Smoke / CO Detectors', timing: 'PRE' },
];

const today = () => new Date().toISOString().slice(0, 10);

const DEFAULTS = {
  assessor_name: '',
  assessment_date: today(),
  num_occupants: '',
  tenant_type: '',
  roof_age: '',
  thermostat_type: '',
  drywall_ceiling: '',
  drywall_wall: '',
  walls_need_insulation: '',
  bath_fan_1_cfm: '',
  bath_fan_2_cfm: '',
  kitchen_fan_cfm: '',
  smoke_detectors_present: '',
  smoke_detectors_to_install: '',
  co_detectors_present: '',
  co_detectors_to_install: '',
  house_foundation: [],
  house_foundation_material: '',
  weatherization_recs: [],
  tenmats_needed: '',
  exterior_doors_needing_sweeps: '',
  health_safety: [],
  project_deferred: '',
  additional_notes: '',
};

const WX_OPTIONS = [
  'Attic Insulation', 'Attic Hatch', 'Attic Hatch Thermal Dome',
  'Air Seal', 'Bath Fan - No Light', 'Bath Fan - With Light',
  'Bath Fan Vent Kit', 'Kneewall Insulation', 'Tyvek',
  'Injection Foam Walls', 'Basement Blanket', 'Rim Joist Basement',
  'Crawlspace Wall Insulation', 'Rim Joist Crawlspace', 'Visqueen',
  'Dense Pack ULA (Garage Ceiling)', 'Dryer Vent Replacement', 'Dryer Vent Termination Cap',
  'Thermostat Replacement', 'Duct Seal', 'Roof Caps',
  'Weatherstrip', 'Door Sweep', 'Gutter Downspouts',
  'Other',
];

const HS_OPTIONS = [
  'Gas Mechanical Repair', 'Mold Remediation', 'Water/Sewage Issues',
  'Asbestos Abatement', 'Electrical Issues', 'Other',
];

/* ── shared inline styles using CSS vars ── */
const styles = {
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    margin: '28px 0 14px',
    paddingBottom: 8,
    borderBottom: '1px solid var(--color-border)',
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 38,
    padding: '6px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 16,
  },
  pillGroup: { display: 'inline-flex', gap: 0, flexWrap: 'wrap' },
  req: { color: 'var(--color-danger)', marginLeft: 2 },
};

function pillStyle(selected, pos) {
  const base = {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    border: `1.5px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
    background: selected ? 'var(--color-primary)' : 'var(--color-surface)',
    color: selected ? '#fff' : 'var(--color-text)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    borderRadius: 0,
    marginLeft: pos === 'first' ? 0 : -1,
  };
  if (pos === 'first') base.borderRadius = 'var(--radius) 0 0 var(--radius)';
  if (pos === 'last') base.borderRadius = '0 var(--radius) var(--radius) 0';
  if (pos === 'only') base.borderRadius = 'var(--radius)';
  return base;
}

/* ── component ── */
export default function AssessmentTab({ job, onSave }) {
  const [form, setForm] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState({});
  const [uploading, setUploading] = useState({});
  const fileInputRefs = useRef({});

  useEffect(() => {
    try {
      const parsed = JSON.parse(job.assessment_data || '{}');
      setForm(prev => ({ ...prev, ...parsed }));
      if (parsed.photos) setPhotos(parsed.photos);
    } catch { /* keep defaults */ }
  }, [job.assessment_data]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleArray = (field, value) => {
    setForm(prev => {
      const arr = Array.isArray(prev[field]) ? prev[field] : [];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // merge with any existing assessment_data keys (e.g. old audit fields, recommendations)
      let existing = {};
      try { existing = JSON.parse(job.assessment_data || '{}'); } catch { /* ignore */ }
      await onSave({ ...existing, ...form, photos });
    } catch { /* handled upstream */ }
    setSaving(false);
  };

  const handlePhotoUpload = async (slotKey, file) => {
    const ext = file.name.split('.').pop();
    const path = `assessment/${job.id}/${slotKey}/${Date.now()}.${ext}`;
    setUploading(prev => ({ ...prev, [slotKey]: true }));
    try {
      const { error } = await supabase.storage.from('job-photos').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('job-photos').getPublicUrl(path);
      setPhotos(prev => ({ ...prev, [slotKey]: publicUrl }));
    } catch (err) {
      console.error('Photo upload failed:', err);
    }
    setUploading(prev => ({ ...prev, [slotKey]: false }));
  };

  const handlePhotoRemove = (slotKey) => {
    setPhotos(prev => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  };

  /* ── helpers ── */
  const PillRadio = ({ field, options }) => (
    <div style={styles.pillGroup}>
      {options.map((opt, i) => {
        const pos = options.length === 1 ? 'only' : i === 0 ? 'first' : i === options.length - 1 ? 'last' : 'mid';
        return (
          <button key={opt} type="button" style={pillStyle(form[field] === opt, pos)}
            onClick={() => set(field, opt)}>
            {opt}
          </button>
        );
      })}
    </div>
  );

  const CheckboxGrid = ({ field, options, cols = 3 }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${Math.floor(100 / cols) - 2}%, 1fr))`, gap: '8px 16px' }}>
      {options.map(opt => {
        const arr = Array.isArray(form[field]) ? form[field] : [];
        return (
          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={arr.includes(opt)} onChange={() => toggleArray(field, opt)}
              style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
            {opt}
          </label>
        );
      })}
    </div>
  );

  const Field = ({ label, required, children }) => (
    <div>
      <label style={styles.label}>{label}{required && <span style={styles.req}>*</span>}</label>
      {children}
    </div>
  );

  return (
    <div className="jd-card" style={{ padding: 24 }}>

      {/* ─── SECTION 1: Site Information ─── */}
      <div style={styles.sectionTitle}>Site Information</div>

      <div style={styles.grid}>
        <Field label="Assessor Name" required>
          <input style={styles.input} type="text" value={form.assessor_name}
            onChange={e => set('assessor_name', e.target.value)} />
        </Field>

        <Field label="Date of Assessment" required>
          <input style={styles.input} type="date" value={form.assessment_date}
            onChange={e => set('assessment_date', e.target.value)} />
        </Field>

        <Field label="Number of Occupants" required>
          <input style={styles.input} type="number" min="0" value={form.num_occupants}
            onChange={e => set('num_occupants', e.target.value)} />
        </Field>

        <Field label="Tenant Type">
          <PillRadio field="tenant_type" options={['Owned', 'Rented']} />
        </Field>

        <Field label="Roof Age — guesstimate if unknown" required>
          <input style={styles.input} type="number" min="0" value={form.roof_age}
            onChange={e => set('roof_age', e.target.value)} />
        </Field>

        <Field label="Thermostat Type">
          <PillRadio field="thermostat_type" options={['Non-programmable', 'Programmable', 'Smart', 'Other']} />
          <p style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--color-text-muted)', marginTop: 6 }}>
            Capture photo in CompanyCam
          </p>
        </Field>

        <Field label="Drywall Ceiling Condition">
          <PillRadio field="drywall_ceiling" options={['Good', 'Poor']} />
        </Field>

        <Field label="Drywall Wall Condition">
          <PillRadio field="drywall_wall" options={['Good', 'Fair', 'Poor']} />
        </Field>

        <Field label="Walls Need Insulation?">
          <PillRadio field="walls_need_insulation" options={['Yes', 'No', 'Other']} />
        </Field>

        <Field label="Bath Fan 1 CFM — Pressure Pan Test">
          <input style={styles.input} type="number" min="0" value={form.bath_fan_1_cfm}
            onChange={e => set('bath_fan_1_cfm', e.target.value)} />
        </Field>

        <Field label="Bath Fan 2 CFM — only if 2 full baths">
          <input style={styles.input} type="number" min="0" value={form.bath_fan_2_cfm}
            onChange={e => set('bath_fan_2_cfm', e.target.value)} />
        </Field>

        <Field label="Kitchen Fan CFM">
          <input style={styles.input} type="number" min="0" value={form.kitchen_fan_cfm}
            onChange={e => set('kitchen_fan_cfm', e.target.value)} />
        </Field>

        <Field label="Smoke Detectors Present">
          <input style={styles.input} type="number" min="0" value={form.smoke_detectors_present}
            onChange={e => set('smoke_detectors_present', e.target.value)} />
        </Field>

        <Field label="Smoke Detectors to Install by Assured">
          <input style={styles.input} type="number" min="0" value={form.smoke_detectors_to_install}
            onChange={e => set('smoke_detectors_to_install', e.target.value)} />
        </Field>

        <Field label="CO Detectors Present">
          <input style={styles.input} type="number" min="0" value={form.co_detectors_present}
            onChange={e => set('co_detectors_present', e.target.value)} />
        </Field>

        <Field label="CO Detectors to Install by Assured">
          <input style={styles.input} type="number" min="0" value={form.co_detectors_to_install}
            onChange={e => set('co_detectors_to_install', e.target.value)} />
        </Field>
      </div>

      <div style={{ marginTop: 16 }}>
        <Field label="House Foundation">
          <CheckboxGrid field="house_foundation" options={['Slab', 'Basement', 'Crawlspace']} cols={3} />
        </Field>
      </div>

      <div style={{ marginTop: 16 }}>
        <Field label="House Foundation Material">
          <PillRadio field="house_foundation_material" options={['Poured Cement', 'Cement Block', 'Other']} />
        </Field>
      </div>

      {/* ─── SECTION 2: Recommendations & Health/Safety ─── */}
      <div style={styles.sectionTitle}>Recommendations &amp; Health/Safety</div>

      <div style={{ marginBottom: 20 }}>
        <Field label="Weatherization Recommendations">
          <CheckboxGrid field="weatherization_recs" options={WX_OPTIONS} cols={3} />
        </Field>
      </div>

      <div style={styles.grid}>
        <Field label="Number of Tenmats Needed">
          <input style={styles.input} type="number" min="0" value={form.tenmats_needed}
            onChange={e => set('tenmats_needed', e.target.value)} />
        </Field>

        <Field label="Number of Exterior Doors needing Door Sweeps/Weather Stripping">
          <input style={styles.input} type="number" min="0" value={form.exterior_doors_needing_sweeps}
            onChange={e => set('exterior_doors_needing_sweeps', e.target.value)} />
        </Field>
      </div>

      <div style={{ marginTop: 16, marginBottom: 20 }}>
        <Field label="Health &amp; Safety Conditions">
          <CheckboxGrid field="health_safety" options={HS_OPTIONS} cols={3} />
        </Field>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Field label="Project Deferred?">
          <PillRadio field="project_deferred" options={['YES', 'NO']} />
        </Field>
        {form.project_deferred === 'YES' && (
          <div style={{
            marginTop: 10, padding: '10px 14px',
            background: '#fef3c7', border: '1px solid #fcd34d',
            borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, color: '#92400e',
          }}>
            Consider updating job status to Deferred
          </div>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <Field label="Additional Notes">
          <textarea style={{ ...styles.input, height: 'auto', minHeight: 80, resize: 'vertical' }}
            value={form.additional_notes} onChange={e => set('additional_notes', e.target.value)} />
        </Field>
      </div>

      {/* ─── SECTION 3: Assessment Photos ─── */}
      <div style={styles.sectionTitle}>Assessment Photos</div>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
        Attach key photos from the assessment. Full photo documentation is available in the Photos tab after saving.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        {PHOTO_SLOTS.map(slot => (
          <div key={slot.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                {slot.label}{slot.hint ? ` — ${slot.hint}` : ''}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px',
                borderRadius: 4, background: 'var(--color-border)', color: 'var(--color-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>{slot.timing}</span>
            </div>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              ref={el => { fileInputRefs.current[slot.key] = el; }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(slot.key, file);
                e.target.value = '';
              }}
            />

            {uploading[slot.key] ? (
              <div style={{
                width: '100%', aspectRatio: '4/3', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                border: '2px dashed var(--color-border)', borderRadius: 'var(--radius)',
                background: 'var(--color-surface)',
              }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Uploading...</div>
              </div>
            ) : photos[slot.key] ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={photos[slot.key]}
                  alt={slot.label}
                  style={{
                    width: '100%', aspectRatio: '4/3', objectFit: 'cover',
                    borderRadius: 'var(--radius)', display: 'block',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handlePhotoRemove(slot.key)}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', color: '#fff',
                    border: 'none', cursor: 'pointer', fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}>✕</button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRefs.current[slot.key]?.click()}
                style={{
                  width: '100%', aspectRatio: '4/3', display: 'flex',
                  flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                  border: '2px dashed var(--color-border)', borderRadius: 'var(--radius)',
                  background: 'var(--color-surface)', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}>
                <span style={{ fontSize: 28 }}>📷</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Tap to add photo</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={handleSave} disabled={saving}
        className="btn btn-primary"
        style={{
          width: '100%', padding: '12px 24px', fontSize: 15, fontWeight: 700,
          opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer',
        }}>
        {saving ? 'Saving...' : 'Save Assessment'}
      </button>
    </div>
  );
}
