import React, { useState, useEffect, useCallback } from 'react';

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

// ═══ Build initial selected map from existing measures + assessment recs ═══
function buildInitial(existingMeasures, recs) {
  const map = {};
  // Seed from saved measures
  if (Array.isArray(existingMeasures)) {
    existingMeasures.forEach(m => {
      map[m.name] = { checked: true, qty: m.qty || '' };
    });
  }
  // Pre-check assessment recommendations not already present
  if (Array.isArray(recs)) {
    recs.forEach(name => {
      if (!map[name]) map[name] = { checked: true, qty: '' };
    });
  }
  return map;
}

export default function ScopeMeasureBuilder({ job = {}, measures = [], onChange, canEdit = true }) {
  const recs = job.assessment_data?.weatherization_recommendations || [];
  const [selected, setSelected] = useState(() => buildInitial(measures, recs));

  // Emit changes upstream
  const emit = useCallback((next) => {
    if (!onChange) return;
    const out = [];
    for (const [name, v] of Object.entries(next)) {
      if (v.checked) {
        const section = EE_MEASURES.includes(name) ? 'ee' : 'hs';
        out.push({ name, type: section, qty: v.qty || '', unit: section === 'ee' ? getUnit(name) : 'ea' });
      }
    }
    onChange(out);
  }, [onChange]);

  // Re-seed if job recs change
  useEffect(() => {
    setSelected(prev => {
      const next = { ...prev };
      let changed = false;
      recs.forEach(name => {
        if (!next[name]) { next[name] = { checked: true, qty: '' }; changed = true; }
      });
      if (changed) emit(next);
      return changed ? next : prev;
    });
  }, [recs.join(',')]); // eslint-disable-next-line

  const toggle = (name) => {
    if (!canEdit) return;
    setSelected(prev => {
      const cur = prev[name];
      const next = { ...prev, [name]: { checked: !cur?.checked, qty: cur?.qty || '' } };
      emit(next);
      return next;
    });
  };

  const setQty = (name, qty) => {
    if (!canEdit) return;
    setSelected(prev => {
      const next = { ...prev, [name]: { ...prev[name], qty } };
      emit(next);
      return next;
    });
  };

  const isChecked = (name) => !!selected[name]?.checked;
  const isRec = (name) => recs.includes(name);

  // ── Counts ──
  const eeCount = EE_MEASURES.filter(isChecked).length;
  const hsCount = HS_MEASURES.filter(isChecked).length;
  const totalCount = eeCount + hsCount;

  // ── Styles (light theme CSS vars) ──
  const qtyInput = {
    width: 70, textAlign: 'center', fontSize: 11,
    height: 28, padding: '4px 6px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
  };
  const recBadge = {
    fontSize: 9, color: 'var(--color-primary)', fontWeight: 700,
    background: 'rgba(37,99,235,0.08)', padding: '1px 6px', borderRadius: 4,
  };
  const unitLabel = { fontSize: 9, color: 'var(--color-text-muted)', minWidth: 28 };
  const totalPill = {
    display: 'inline-block', padding: '4px 14px', borderRadius: 20,
    fontSize: 13, fontWeight: 700,
    background: totalCount > 0 ? 'var(--color-primary)' : 'var(--color-surface-alt)',
    color: totalCount > 0 ? '#fff' : 'var(--color-text-muted)',
    marginBottom: 16,
  };

  // ── Render measure row ──
  const renderRow = (name, section) => {
    const checked = isChecked(name);
    const rec = isRec(name);
    const qty = selected[name]?.qty || '';
    const unit = section === 'ee' ? getUnit(name) : 'ea';

    return (
      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          cursor: canEdit ? 'pointer' : 'default',
          color: 'var(--color-text)', opacity: canEdit ? 1 : 0.6, flex: 1, minWidth: 0,
        }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={() => toggle(name)}
            disabled={!canEdit}
            style={{ accentColor: 'var(--color-primary)', width: 15, height: 15, flexShrink: 0 }}
          />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        </label>
        {rec && <span style={recBadge}>rec</span>}
        {checked && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <input
              style={qtyInput}
              inputMode="decimal"
              value={qty}
              disabled={!canEdit}
              onChange={e => {
                const v = e.target.value;
                if (v === '' || /^-?\d*\.?\d*$/.test(v)) setQty(name, v);
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
      <div style={totalPill}>{totalCount} measure{totalCount !== 1 ? 's' : ''} selected</div>

      <div className="jd-card">
        <div className="jd-card-title">Energy Efficiency Measures ({eeCount})</div>
        <div style={{ display: 'grid', gap: 2 }}>
          {EE_MEASURES.map(m => renderRow(m, 'ee'))}
        </div>
      </div>

      <div className="jd-card">
        <div className="jd-card-title">Health &amp; Safety Measures ({hsCount})</div>
        <div style={{ display: 'grid', gap: 2 }}>
          {HS_MEASURES.map(m => renderRow(m, 'hs'))}
        </div>
      </div>
    </>
  );
}
