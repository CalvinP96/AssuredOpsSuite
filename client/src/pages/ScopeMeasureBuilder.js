import React, { useState } from 'react';

// ═══ Measure constants (exact from hes-tracker) ═══
const EE_MEASURES = [
  'Air Sealing',
  'Attic Insulation (0-R11)',
  'Attic Insulation (R12-19)',
  'Basement Wall Insulation',
  'Crawl Space Wall Insulation',
  'Knee Wall Insulation',
  'Floor Insulation Above Crawl',
  'Rim Joist Insulation',
  'Injection Foam Walls',
  'Furnace Replacement',
  'Boiler Replacement',
  'Central AC Replacement',
  'Water Heater Replacement',
  'Furnace Tune-Up',
  'Thermostat',
  'Low-e Storm Windows',
  'EC Motor',
  'AC Cover',
];

const HS_MEASURES = [
  'CO Detector (Hardwired)',
  'Smoke Detector (Hardwired)',
  'CO/Smoke Combo',
  'Exhaust Fan',
  'Exhaust Fan w/ Light',
  'Exhaust Fan Vent Kit',
  'Door Sweeps',
  'Weather Stripping',
  'Dryer Vent Kit',
  'Flue Repairs',
  'Gas Mechanical Repairs',
  'Mold Remediation',
  'Electrical Issues',
  'Water/Sewage Issues',
  'Asbestos Abatement',
  'Building Permit',
  'Other Repairs',
];

// ═══ Unit logic (exact from hes-tracker) ═══
const getUnit = (name) => {
  if (name.includes('Insulation') && !name.includes('Rim')) return 'sqft';
  if (name.includes('Rim Joist')) return 'lnft';
  if (name.includes('Foam Walls')) return 'sqft';
  return 'ea';
};

// ═══ UI Helpers (light theme) ═══
const Sec = ({ title, children }) => (
  <div className="jd-card">
    <div className="jd-card-title">{title}</div>
    {children}
  </div>
);

const CK = ({ checked, onChange, label, disabled }) => (
  <label style={{
    display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
    cursor: disabled ? 'default' : 'pointer', padding: '3px 0',
    color: 'var(--color-text)', opacity: disabled ? 0.6 : 1,
  }}>
    <input
      type="checkbox"
      checked={!!checked}
      onChange={onChange}
      disabled={disabled}
      style={{ accentColor: 'var(--color-primary)', width: 15, height: 15 }}
    />
    {label}
  </label>
);

export default function ScopeMeasureBuilder({ measures = [], onChange, assessmentRecs = [], canEdit = true }) {
  const [uncheckedRecs, setUncheckedRecs] = useState({});

  // ── Helpers ──
  const realMeasures = measures.filter(m => m.type !== 'meta');
  const getMeta = (key) => measures.find(m => m.name === key && m.type === 'meta');
  const findMeasure = (name) => realMeasures.find(m => m.name === name);
  const isRec = (name) => assessmentRecs.includes(name);
  const isChecked = (name) => !!findMeasure(name) || (isRec(name) && !uncheckedRecs[name]);
  const isAutoOnly = (name) => isRec(name) && !uncheckedRecs[name] && !findMeasure(name);

  // ── Mutations ──
  const fire = (next) => onChange(next);

  const setMeta = (key, text) => {
    const ex = getMeta(key);
    if (ex) fire(measures.map(m => m.name === key && m.type === 'meta' ? { ...m, notes: text } : m));
    else fire([...measures, { name: key, type: 'meta', qty: '', specs: '', notes: text }]);
  };

  const updateField = (name, type, field, value) => {
    const ex = findMeasure(name);
    if (ex) {
      fire(measures.map(m => m.name === name && m.type !== 'meta' ? { ...m, [field]: value } : m));
    } else {
      fire([...measures, { name, type, qty: '', specs: '', notes: '', [field]: value }]);
    }
  };

  const toggle = (name, type) => {
    if (!canEdit) return;
    const ex = findMeasure(name);
    const rec = isRec(name);
    const checked = isChecked(name);

    if (checked && !ex && rec) {
      // Auto-only (from assessmentRecs) → dismiss recommendation
      setUncheckedRecs(p => ({ ...p, [name]: true }));
    } else if (checked && ex && rec) {
      // Manual + rec → remove from measures and dismiss rec
      fire(measures.filter(m => !(m.name === name && m.type !== 'meta')));
      setUncheckedRecs(p => ({ ...p, [name]: true }));
    } else if (checked && ex) {
      // Manual only → remove from measures
      fire(measures.filter(m => !(m.name === name && m.type !== 'meta')));
    } else {
      // Unchecked → check (clear rec dismissal if any, add to measures)
      const next = { ...uncheckedRecs };
      delete next[name];
      setUncheckedRecs(next);
      if (!ex) fire([...measures, { name, type, qty: '', specs: '', notes: '' }]);
    }
  };

  // ── Counts ──
  const eeCount = EE_MEASURES.filter(isChecked).length;
  const hsCount = HS_MEASURES.filter(isChecked).length;

  // ── Meta values ──
  const workNotes = getMeta('_workNotes')?.notes || '';
  const hsNotes = getMeta('_hsNotes')?.notes || '';

  // ── Styles ──
  const qtyInput = {
    width: 70, textAlign: 'center', fontSize: 11,
    height: 28, padding: '4px 6px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
  };
  const ta = {
    width: '100%', minHeight: 50, padding: '6px 10px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    fontSize: 13, resize: 'vertical',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontFamily: 'inherit',
  };
  const recBadge = { fontSize: 8, color: 'var(--color-primary)', fontWeight: 600 };
  const unitLabel = { fontSize: 9, color: 'var(--color-text-muted)', minWidth: 28 };

  // ── Render measure row ──
  const renderRow = (name, type) => {
    const checked = isChecked(name);
    const auto = isAutoOnly(name);
    const m = findMeasure(name);
    const qty = m?.qty || '';
    const unit = type === 'ee' ? getUnit(name) : 'ea';

    return (
      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CK checked={checked} onChange={() => toggle(name, type)} label={name} disabled={!canEdit} />
        {auto && <span style={recBadge}>rec</span>}
        {checked && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            <input
              style={qtyInput}
              inputMode="decimal"
              value={qty}
              disabled={!canEdit}
              onChange={e => {
                const v = e.target.value;
                if (v === '' || /^-?\d*\.?\d*$/.test(v)) updateField(name, type, 'qty', v);
              }}
              placeholder="qty"
            />
            <span style={unitLabel}>{unit}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Sec title={`Energy Efficiency Measures (${eeCount})`}>
        <div style={{ display: 'grid', gap: 4 }}>
          {EE_MEASURES.map(m => renderRow(m, 'ee'))}
        </div>
      </Sec>

      <Sec title={`Health & Safety Measures (${hsCount})`}>
        <div style={{ display: 'grid', gap: 4 }}>
          {HS_MEASURES.map(m => renderRow(m, 'hs'))}
        </div>
      </Sec>

      <Sec title="Notes on Work">
        <textarea
          style={ta}
          value={workNotes}
          disabled={!canEdit}
          onChange={e => setMeta('_workNotes', e.target.value)}
          rows={2}
          placeholder="Notes on work to be performed…"
        />
      </Sec>

      <Sec title="Notes on Health & Safety">
        <textarea
          style={ta}
          value={hsNotes}
          disabled={!canEdit}
          onChange={e => setMeta('_hsNotes', e.target.value)}
          rows={2}
          placeholder="H&S notes…"
        />
      </Sec>
    </>
  );
}
