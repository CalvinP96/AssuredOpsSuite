import React, { useState, useEffect } from 'react';

// ── Constants (from HES tracker) ──
const HVAC_BRANDS = [
  '', 'Amana', 'American Standard', 'Armstrong', 'Bryant', 'Carrier', 'Coleman',
  'Comfortmaker', 'Daikin', 'Day & Night', 'Ducane', 'Frigidaire', 'Goodman',
  'Heil', 'Keeprite', 'Lennox', 'Luxaire', 'Maytag', 'Mitsubishi', 'Nordyne',
  'Payne', 'Rheem', 'Ruud', 'Tempstar', 'Trane', 'York', 'Other'
];

const WATER_HEATER_BRANDS = [
  '', 'A.O. Smith', 'Bradford White', 'Rheem', 'State', 'Kenmore',
  'Rinnai', 'Navien', 'Noritz', 'Other'
];

const YN_OPTS = ['', 'Yes', 'No'];

const FURNACE_FINDINGS = [
  'System operating normally', 'Needs minor repair', 'Needs major repair',
  'Recommend replacement \u2014 age', 'Recommend replacement \u2014 cracked HX',
  'Recommend replacement \u2014 safety concern', 'Cleaned and serviced \u2014 good condition',
  'Parts ordered \u2014 follow-up needed'
];

const WH_FINDINGS = [
  'Good condition \u2014 no action', 'Cleaned and serviced', 'Needs minor repair',
  'Needs T&P valve replacement', 'Venting needs repair',
  'Recommend replacement \u2014 age', 'Recommend replacement \u2014 leaking',
  'Recommend replacement \u2014 safety', 'Sediment flush recommended', 'Follow-up needed'
];

const SYSTEM_FINDINGS = [
  'All systems operating \u2014 good condition', 'Furnace needs replacement',
  'A/C needs replacement', 'Water heater needs replacement',
  'Minor repairs needed \u2014 see notes', 'Safety concern identified',
  'Follow-up visit required', 'Customer declined recommended repairs', 'Parts on order'
];

const REPLACEMENT_PRIORITY = ['', 'Urgent \u2014 safety issue', 'Soon \u2014 failing equipment', 'Planned \u2014 end of life', 'Customer request'];
const REPLACEMENT_TYPE = ['', 'Furnace only', 'A/C only', 'Furnace + A/C', 'Water heater only', 'Full system'];

// ── Shared inline styles (light theme via CSS vars) ──
const S = {
  sectionTitle: {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px',
    color: 'var(--color-text-muted)', margin: '28px 0 14px', paddingBottom: 8,
    borderBottom: '1px solid var(--color-border)',
  },
  hint: {
    fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, fontStyle: 'italic',
  },
  photoHint: {
    fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 10, padding: '8px 12px',
    background: 'var(--color-surface-alt)', borderRadius: 'var(--radius)',
    border: '1px solid var(--color-border)',
  },
  warningBox: {
    padding: '8px 12px', marginTop: 8, marginBottom: 8, borderRadius: 'var(--radius)',
    background: '#fef3c7', border: '1px solid #fde68a', fontSize: 12, color: '#92400e',
  },
  dangerBox: {
    padding: '8px 12px', marginTop: 8, borderRadius: 'var(--radius)',
    background: '#fee2e2', border: '1px solid #fecaca', fontSize: 12, color: '#991b1b',
  },
  successBox: {
    padding: '8px 12px', borderRadius: 'var(--radius)',
    background: '#dcfce7', border: '1px solid #86efac', fontSize: 12, color: '#166534',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  pendingBox: {
    padding: '8px 12px', borderRadius: 'var(--radius)',
    background: '#fef3c7', border: '1px solid #fde68a', fontSize: 12,
  },
  approvedBox: {
    padding: '8px 12px', borderRadius: 'var(--radius)',
    background: '#dcfce7', border: '1px solid #86efac', fontSize: 12,
  },
  deniedBox: {
    padding: '8px 12px', borderRadius: 'var(--radius)',
    background: '#fee2e2', border: '1px solid #fecaca', fontSize: 12,
  },
  replaceSection: {
    marginTop: 12, padding: '14px 16px',
    background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius)',
  },
};

// ── Helper Components ──

function Section({ title, children }) {
  return (
    <div className="jd-card">
      <div className="jd-card-title">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type, disabled, placeholder }) {
  return (
    <div className="jd-field">
      <label className="jd-field-label">{label}</label>
      <input
        type={type || 'text'}
        className="jd-date-input"
        style={{ cursor: disabled ? 'default' : 'text' }}
        value={value || ''}
        disabled={disabled}
        placeholder={placeholder || ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, disabled, tip }) {
  return (
    <div className="jd-field">
      <label className="jd-field-label">{label}</label>
      <select className="jd-date-input" style={{ cursor: disabled ? 'default' : 'pointer' }}
        value={value || ''} disabled={disabled} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o || '\u2014 Select \u2014'}</option>)}
      </select>
      {tip && <div style={S.hint}>{tip}</div>}
    </div>
  );
}

function TagSelector({ tags, selected, onChange, disabled }) {
  const active = selected ? selected.split('; ').filter(Boolean) : [];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
      {tags.map(tag => {
        const has = active.includes(tag);
        return (
          <button key={tag} type="button" disabled={disabled} onClick={() => {
            const next = has ? active.filter(t => t !== tag) : [...active, tag];
            onChange(next.join('; '));
          }} style={{
            padding: '5px 12px', borderRadius: 'var(--radius)', fontSize: 12,
            cursor: disabled ? 'default' : 'pointer',
            border: has ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
            background: has ? 'rgba(37,99,235,0.08)' : 'var(--color-surface)',
            color: has ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: has ? 600 : 400,
          }}>
            {has ? '\u2713 ' : ''}{tag}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Component ──

export default function HVACTab({ job, canEdit, onUpdate, user }) {
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = job.hvac_data;
      const parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
      setData(parsed);
    } catch { setData({}); }
  }, [job.hvac_data]);

  // ── Update helpers ──
  const set = (key, val) => setData(prev => ({ ...prev, [key]: val }));
  const setSection = (section, key, val) => setData(prev => ({
    ...prev,
    [section]: { ...(prev[section] || {}), [key]: val },
  }));

  const handleSave = async () => {
    setSaving(true);
    try { await onUpdate('hvac_data', data); } catch { /* handled upstream */ }
    setSaving(false);
  };

  const dis = !canEdit;
  const f = data.furnace || {};
  const c = data.condenser || {};
  const w = data.waterHeater || {};
  const comb = data.combustion || {};
  const ne = data.newEquipment || {};

  const isAdmin = user?.role === 'admin' || user?.role === 'Admin';

  return (
    <div>

      {/* ════════════════════════════════════════════════
          1. EXISTING HEATING SYSTEM (Furnace)
         ════════════════════════════════════════════════ */}
      <Section title="Existing Heating System">
        <div style={S.photoHint}>
          <b>Photos required:</b> Furnace nameplate/tag, heat exchanger, any damage or issues found
        </div>
        <div className="jd-field-grid">
          <SelectField label="1. Furnace Make" value={f.make} disabled={dis}
            options={HVAC_BRANDS} onChange={v => setSection('furnace', 'make', v)} />
          <Field label="2. Model #" value={f.model} disabled={dis}
            onChange={v => setSection('furnace', 'model', v)} />
          <Field label="3. Serial #" value={f.serial} disabled={dis}
            onChange={v => setSection('furnace', 'serial', v)} />
          <Field label="4. Furnace Age (years)" value={f.age} disabled={dis} type="number"
            onChange={v => setSection('furnace', 'age', v)} />
        </div>

        {Number(f.age) >= 15 && (
          <div style={S.warningBox}>
            Furnace is {f.age}+ years old &mdash; document thoroughly and consider replacement recommendation
          </div>
        )}

        <SelectField label="5. Condition of Heat Exchanger" value={f.heatExchanger} disabled={dis}
          tip="Shine flashlight through burner ports. Any visible cracks = recommend replacement."
          options={['', 'Good \u2014 no cracks or corrosion', 'Fair \u2014 minor surface rust, no cracks',
            'Rust/corrosion present \u2014 monitor', 'Cracked \u2014 STOP, flag for replacement',
            'Compromised \u2014 visible holes or separation', 'Could not inspect']}
          onChange={v => setSection('furnace', 'heatExchanger', v)} />

        <SelectField label="6. Inducer Motor Operations & Condition" value={f.inducerMotor} disabled={dis}
          options={['', 'Operating normally \u2014 quiet', 'Noisy \u2014 grinding or rattling',
            'Vibrating excessively', 'Weak/slow operation', 'Not operating', 'N/A \u2014 not equipped']}
          onChange={v => setSection('furnace', 'inducerMotor', v)} />

        <div className="jd-field-grid">
          <SelectField label="7. Ignitor Condition" value={f.ignitorCond} disabled={dis}
            tip="Silicon nitride: 10-200\u03A9 normal. Silicon carbide: 40-90\u03A9 normal."
            options={['', 'Good \u2014 clean, no cracks', 'Cracked \u2014 needs replacement',
              'Weak glow \u2014 near end of life', 'Corroded', 'N/A \u2014 standing pilot']}
            onChange={v => setSection('furnace', 'ignitorCond', v)} />
          <Field label="7b. Ignitor OHM Reading" value={f.ignitorOhm} disabled={dis} type="number"
            onChange={v => setSection('furnace', 'ignitorOhm', v)} />
        </div>

        <SelectField label="8. Burner Condition & Operations" value={f.burnerCond} disabled={dis}
          tip="Blue/even flame = good. Yellow/orange/lifting = problem."
          options={['', 'Clean \u2014 blue even flame', 'Dirty \u2014 needs cleaning', 'Corroded burners',
            'Misaligned \u2014 flame rollout risk', 'Cracked burner tubes', 'Sooting/carbon buildup']}
          onChange={v => setSection('furnace', 'burnerCond', v)} />

        <SelectField label="9. Flame Sensor Condition" value={f.flameSensor} disabled={dis}
          tip="Clean with fine steel wool. Should read 2-6 microamps."
          options={['', 'Clean \u2014 good signal', 'Dirty \u2014 cleaned during service',
            'Corroded \u2014 cleaned, monitor', 'Weak signal \u2014 may need replacement soon',
            'Replaced', 'N/A \u2014 standing pilot']}
          onChange={v => setSection('furnace', 'flameSensor', v)} />

        <div className="jd-field-grid">
          <Field label="10. Filter Size" value={f.filterSize} disabled={dis}
            onChange={v => setSection('furnace', 'filterSize', v)} />
          <SelectField label="11. Filter Changed?" value={f.filterChanged} disabled={dis}
            options={YN_OPTS} onChange={v => setSection('furnace', 'filterChanged', v)} />
        </div>

        <SelectField label="12. Blower Motor Operations & Condition" value={f.blowerMotor} disabled={dis}
          options={['', 'Operating normally \u2014 quiet', 'Noisy \u2014 bearing wear', 'Vibrating',
            'Overheating \u2014 hot to touch', 'Weak airflow', 'Not operating',
            'ECM motor \u2014 operating normally', 'ECM motor \u2014 error codes']}
          onChange={v => setSection('furnace', 'blowerMotor', v)} />

        <SelectField label="13. Control Board Operations & Condition" value={f.controlBoard} disabled={dis}
          tip="Check for error/fault codes. Note any blinking LED patterns."
          options={['', 'Operating normally \u2014 no fault codes', 'Error codes present (note in findings)',
            'Burn marks or discoloration', 'Intermittent operation', 'Corroded connections', 'Needs replacement']}
          onChange={v => setSection('furnace', 'controlBoard', v)} />

        <SelectField label="14. Thermostat Location & Condition" value={f.thermostat} disabled={dis}
          tip="Take photo \u2014 offer smart thermostat upgrade."
          options={['', 'Digital programmable \u2014 working', 'Manual/dial \u2014 recommend upgrade',
            'Smart thermostat \u2014 working', 'Inaccurate readings',
            'Poor location (drafty/direct sun)', 'Not communicating with system']}
          onChange={v => setSection('furnace', 'thermostat', v)} />

        <div className="jd-field-grid">
          <Field label="AFUE Pre-Tune Up" value={f.afuePre} disabled={dis} type="number"
            onChange={v => setSection('furnace', 'afuePre', v)} />
          <Field label="AFUE Post-Tune Up" value={f.afuePost} disabled={dis} type="number"
            onChange={v => setSection('furnace', 'afuePost', v)} />
        </div>

        {f.afuePre && f.afuePost && Number(f.afuePost) > Number(f.afuePre) && (
          <div style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 6, fontWeight: 600 }}>
            &uarr; Improved {(Number(f.afuePost) - Number(f.afuePre)).toFixed(1)}% AFUE after tune-up
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <label className="jd-field-label">15. Furnace Findings & Recommendations</label>
          <TagSelector tags={FURNACE_FINDINGS} selected={f.findings || ''} disabled={dis}
            onChange={v => setSection('furnace', 'findings', v)} />
          <textarea style={{
            width: '100%', padding: '10px 12px', fontSize: 13,
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
            background: 'var(--color-surface)', color: 'var(--color-text)',
            minHeight: 50, resize: 'vertical',
          }}
            value={f.findingsNotes || ''} disabled={dis}
            onChange={e => setSection('furnace', 'findingsNotes', e.target.value)}
            placeholder="Additional notes (only if needed)..." />
        </div>
      </Section>

      {/* ════════════════════════════════════════════════
          2. COOLING SYSTEM (A/C Condenser)
         ════════════════════════════════════════════════ */}
      <Section title="Cooling System">
        <div style={S.photoHint}>
          <b>Photos required:</b> Condenser nameplate/tag, overall condition, any damage, electrical components
        </div>
        <div className="jd-field-grid">
          <SelectField label="24. Condenser Make" value={c.make} disabled={dis}
            options={HVAC_BRANDS} onChange={v => setSection('condenser', 'make', v)} />
          <Field label="25. Model #" value={c.model} disabled={dis}
            onChange={v => setSection('condenser', 'model', v)} />
          <Field label="26. Serial #" value={c.serial} disabled={dis}
            onChange={v => setSection('condenser', 'serial', v)} />
          <Field label="27. Age (years)" value={c.age} disabled={dis} type="number"
            onChange={v => setSection('condenser', 'age', v)} />
        </div>

        {Number(c.age) >= 12 && (
          <div style={S.warningBox}>
            A/C is {c.age}+ years old &mdash; check for R-22 refrigerant and consider replacement
          </div>
        )}

        <SelectField label="28. Condenser Condition" value={c.condition} disabled={dis}
          tip="Take photos of any damage, bent fins, corrosion."
          options={['', 'Good \u2014 clean and operational', 'Fair \u2014 minor fin damage',
            'Dirty \u2014 needs cleaning', 'Damaged fins \u2014 moderate', 'Rust/corrosion present',
            'Refrigerant leak suspected', 'Compressor noisy', 'Not operating', 'Recommend replacement']}
          onChange={v => setSection('condenser', 'condition', v)} />

        <SelectField label="29. Condenser Coils Cleaned?" value={c.coilsCleaned} disabled={dis}
          options={YN_OPTS} onChange={v => setSection('condenser', 'coilsCleaned', v)} />

        <SelectField label="30. Electrical Components, Whip & Disconnect" value={c.electrical} disabled={dis}
          tip="Check disconnect for burn marks. Check contactor for pitting. Check capacitor for bulging."
          options={['', 'All components good condition', 'Whip damaged/deteriorating',
            'Disconnect corroded', 'Contactor pitted \u2014 needs replacement',
            'Capacitor bulging \u2014 needs replacement', 'Wiring issues found',
            'Loose connections \u2014 tightened', 'Needs electrical repair']}
          onChange={v => setSection('condenser', 'electrical', v)} />

        <div style={{ marginTop: 8 }}>
          <label className="jd-field-label">31. Refrigerant Pressures</label>
          <div className="jd-field-grid">
            <Field label="Suction (low side) PSI" value={c.suctionPSI} disabled={dis} type="number"
              onChange={v => setSection('condenser', 'suctionPSI', v)} />
            <Field label="Discharge (high side) PSI" value={c.dischargePSI} disabled={dis} type="number"
              onChange={v => setSection('condenser', 'dischargePSI', v)} />
            <SelectField label="Refrigerant Type" value={c.refrigerant} disabled={dis}
              options={['', 'R-410A', 'R-22', 'R-407C', 'R-134a', 'Unknown']}
              onChange={v => setSection('condenser', 'refrigerant', v)} />
          </div>
          {c.refrigerant === 'R-22' && (
            <div style={S.dangerBox}>
              R-22 is phased out &mdash; if system needs charge, recommend replacement to R-410A system
            </div>
          )}
        </div>

        <SelectField label="32. Exposed Line Set Condition" value={c.lineSet} disabled={dis}
          tip="Check suction line insulation (larger line). Missing = efficiency loss."
          options={['', 'Good condition \u2014 insulation intact', 'Insulation damaged/missing',
            'Kinked line', 'Exposed/unsecured sections', 'Corroded fittings',
            'Oil stains \u2014 possible leak']}
          onChange={v => setSection('condenser', 'lineSet', v)} />

        <SelectField label="33. Other Issues (piping, venting, drainage)" value={c.otherIssues} disabled={dis}
          options={['', 'No other issues', 'Condensate drain clogged',
            'Condensate drain missing trap', 'Drain line damaged',
            'Piping needs support/securing', 'Venting issue found (note below)']}
          onChange={v => setSection('condenser', 'otherIssues', v)} />

        <SelectField label="34. Evaporator Coil Condition" value={c.evapCoil} disabled={dis}
          options={['', 'Clean \u2014 good condition', 'Dirty \u2014 needs cleaning', 'Corroded',
            'Leaking \u2014 refrigerant', 'Frozen/icing \u2014 airflow issue',
            'Could not access for inspection']}
          onChange={v => setSection('condenser', 'evapCoil', v)} />
      </Section>

      {/* ════════════════════════════════════════════════
          3. WATER HEATER
         ════════════════════════════════════════════════ */}
      <Section title="Water Heater">
        <div style={S.photoHint}>
          <b>Photos required:</b> Nameplate/tag, overall condition, venting, burners, any issues
        </div>
        <div className="jd-field-grid">
          <SelectField label="16. Water Heater Make" value={w.make} disabled={dis}
            options={WATER_HEATER_BRANDS} onChange={v => setSection('waterHeater', 'make', v)} />
          <Field label="17. Model #" value={w.model} disabled={dis}
            onChange={v => setSection('waterHeater', 'model', v)} />
          <Field label="18. Serial #" value={w.serial} disabled={dis}
            onChange={v => setSection('waterHeater', 'serial', v)} />
          <Field label="19. Age (years)" value={w.age} disabled={dis} type="number"
            onChange={v => setSection('waterHeater', 'age', v)} />
        </div>

        {Number(w.age) >= 12 && (
          <div style={S.warningBox}>
            Water heater is {w.age}+ years old &mdash; document thoroughly and consider replacement
          </div>
        )}

        <SelectField label="20. Water Heater Condition" value={w.condition} disabled={dis}
          tip="Take photos of overall condition, any rust/leaks."
          options={['', 'Good \u2014 no issues', 'Fair \u2014 minor surface rust',
            'Corroded \u2014 moderate to heavy', 'Leaking from tank',
            'Sediment buildup (heavy drain)', 'T&P valve releasing/weeping',
            'Pilot issues', 'Needs replacement']}
          onChange={v => setSection('waterHeater', 'condition', v)} />

        <SelectField label="21. Water Heater Venting" value={w.venting} disabled={dis}
          tip="Check pitch (\u00BC\u2033 per foot up), connections, corrosion. Draft test after 5 min operation."
          options={['', 'Proper pitch and connections \u2014 good', 'Minor corrosion \u2014 serviceable',
            'Corroded/deteriorating \u2014 needs repair', 'Disconnected joint(s)',
            'Improper pitch \u2014 condensation risk', 'Single-wall in attic \u2014 code issue',
            'Backdrafting \u2014 SAFETY CONCERN', 'Orphaned (no longer connected)',
            'Power vent \u2014 operating normally']}
          onChange={v => setSection('waterHeater', 'venting', v)} />

        <SelectField label="22. Water Heater Burners" value={w.burners} disabled={dis}
          tip="Take photo of burner assembly. Blue flame = good."
          options={['', 'Clean \u2014 operating normally', 'Dirty \u2014 needs cleaning', 'Corroded',
            'Flame irregular/yellow', 'Sooting present', 'Cleaned during service']}
          onChange={v => setSection('waterHeater', 'burners', v)} />

        <div style={{ marginTop: 12 }}>
          <label className="jd-field-label">23. Water Heater Recommendations</label>
          <TagSelector tags={WH_FINDINGS} selected={w.findings || ''} disabled={dis}
            onChange={v => setSection('waterHeater', 'findings', v)} />
          <textarea style={{
            width: '100%', padding: '10px 12px', fontSize: 13,
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
            background: 'var(--color-surface)', color: 'var(--color-text)',
            minHeight: 50, resize: 'vertical',
          }}
            value={w.findingsNotes || ''} disabled={dis}
            onChange={e => setSection('waterHeater', 'findingsNotes', e.target.value)}
            placeholder="Additional notes (only if needed)..." />
        </div>
      </Section>

      {/* ════════════════════════════════════════════════
          4. CLEAN & TUNE
         ════════════════════════════════════════════════ */}
      <Section title="Clean & Tune">
        <div className="jd-field-grid" style={{ marginBottom: 14 }}>
          <Field label="Technician" value={data.techName} disabled={dis}
            onChange={v => set('techName', v)} />
          <Field label="Manager" value={data.managerName} disabled={dis}
            onChange={v => set('managerName', v)} />
        </div>

        {!data.completed ? (
          <button type="button" className="btn btn-primary" disabled={dis || !data.techName?.trim()}
            style={{
              width: '100%', padding: 12, fontSize: 14, fontWeight: 700,
              opacity: data.techName?.trim()?.length > 0 ? 1 : 0.4,
            }}
            onClick={() => {
              setData(prev => ({
                ...prev,
                completed: true,
                completedDate: new Date().toISOString(),
              }));
            }}>
            Mark Tune & Clean Complete
          </button>
        ) : (
          <div style={S.successBox}>
            <span style={{ fontWeight: 600 }}>
              Completed{data.completedDate ? ' \u2014 ' + new Date(data.completedDate).toLocaleDateString() : ''}
              {data.techName ? ' by ' + data.techName : ''}
            </span>
            {canEdit && (
              <button type="button" className="btn btn-secondary btn-sm"
                onClick={() => set('completed', false)}>
                Undo
              </button>
            )}
          </div>
        )}
      </Section>

      {/* ════════════════════════════════════════════════
          5. COMBUSTION SAFETY TESTING
         ════════════════════════════════════════════════ */}
      <Section title="Combustion Safety Testing">
        <div className="jd-field-grid">
          <Field label="Combustion Test Result" value={comb.testResult} disabled={dis}
            placeholder="Pass/Fail + readings"
            onChange={v => setSection('combustion', 'testResult', v)} />
          <Field label="CO Reading (ppm)" value={comb.coReading} disabled={dis} type="number"
            onChange={v => setSection('combustion', 'coReading', v)} />
          <Field label="Draft Reading" value={comb.draftReading} disabled={dis}
            placeholder="Pa or WC"
            onChange={v => setSection('combustion', 'draftReading', v)} />
          <SelectField label="Spillage Test" value={comb.spillageTest} disabled={dis}
            options={['', 'Pass', 'Fail', 'N/A']}
            onChange={v => setSection('combustion', 'spillageTest', v)} />
          <Field label="Ambient CO (ppm)" value={comb.ambientCO} disabled={dis} type="number"
            onChange={v => setSection('combustion', 'ambientCO', v)} />
          <Field label="Flue CO (ppm)" value={comb.flueCO} disabled={dis} type="number"
            onChange={v => setSection('combustion', 'flueCO', v)} />
          <Field label="Gas Leak Check" value={comb.gasLeakCheck} disabled={dis}
            placeholder="Pass/Fail"
            onChange={v => setSection('combustion', 'gasLeakCheck', v)} />
        </div>

        {comb.spillageTest === 'Fail' && (
          <div style={S.dangerBox}>
            Spillage test FAILED &mdash; do not leave appliance in operation. Follow BPI protocols.
          </div>
        )}
      </Section>

      {/* ════════════════════════════════════════════════
          6. REPLACEMENT REQUEST
         ════════════════════════════════════════════════ */}
      <Section title="Replacement Request">
        <label className="jd-field-label">35. Overall Details, Notes & Recommendations</label>
        <TagSelector tags={SYSTEM_FINDINGS} selected={data.systemNotes || ''} disabled={dis}
          onChange={v => set('systemNotes', v)} />
        <textarea style={{
          width: '100%', padding: '10px 12px', fontSize: 13,
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
          background: 'var(--color-surface)', color: 'var(--color-text)',
          minHeight: 60, resize: 'vertical', marginBottom: 8,
        }}
          value={data.detailNotes || ''} disabled={dis}
          onChange={e => set('detailNotes', e.target.value)}
          placeholder="Any additional details, observations, or special circumstances..." />

        {/* Replacement form — shows when any replacement tag is selected */}
        {(data.systemNotes || '').includes('replacement') && (
          <div style={S.replaceSection}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
              Replacement Identified
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 10 }}>
              Fill in details below and submit a replacement request. Admin will review and approve/deny.
            </div>
            <div className="jd-field-grid">
              <SelectField label="Replacement Priority" value={data.replacePriority} disabled={dis}
                options={REPLACEMENT_PRIORITY} onChange={v => set('replacePriority', v)} />
              <SelectField label="Replacement Type" value={data.replaceType} disabled={dis}
                options={REPLACEMENT_TYPE} onChange={v => set('replaceType', v)} />
            </div>
            <textarea style={{
              width: '100%', padding: '10px 12px', fontSize: 13, marginTop: 8,
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              minHeight: 50, resize: 'vertical',
            }}
              value={data.replaceJustification || ''} disabled={dis}
              onChange={e => set('replaceJustification', e.target.value)}
              placeholder="Justification \u2014 describe why replacement is needed (condition, safety concerns, age, etc.)..." />

            {/* Submit button */}
            {!data.replaceRequestStatus && canEdit && (
              <button type="button" className="btn btn-secondary"
                disabled={!data.replacePriority || !data.replaceType}
                style={{
                  width: '100%', marginTop: 10, fontWeight: 700, fontSize: 13,
                  borderColor: '#d97706', color: '#92400e',
                  opacity: (data.replacePriority && data.replaceType) ? 1 : 0.4,
                }}
                onClick={() => setData(prev => ({
                  ...prev,
                  replaceRequestStatus: 'pending',
                  replaceRequestDate: new Date().toISOString(),
                  replaceRequestBy: user?.name || user?.email || 'Unknown',
                }))}>
                Submit Replacement Request
              </button>
            )}

            {/* Pending */}
            {data.replaceRequestStatus === 'pending' && (
              <div style={{ ...S.pendingBox, marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>
                  Replacement Request Pending
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Submitted by {data.replaceRequestBy}
                  {data.replaceRequestDate ? ' \u00b7 ' + new Date(data.replaceRequestDate).toLocaleString() : ''}
                </div>
                {isAdmin && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <textarea style={{
                      flex: 1, padding: '6px 10px', fontSize: 12,
                      border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)', color: 'var(--color-text)',
                      minHeight: 32, resize: 'vertical',
                    }}
                      value={data._replResp || ''}
                      onChange={e => set('_replResp', e.target.value)}
                      placeholder="Response (internal)..." />
                    <button type="button" className="btn btn-success btn-sm" style={{ whiteSpace: 'nowrap' }}
                      onClick={() => setData(prev => ({
                        ...prev,
                        replaceRequestStatus: 'approved',
                        replaceResponse: prev._replResp || '',
                      }))}>
                      Approve
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" style={{ whiteSpace: 'nowrap' }}
                      onClick={() => setData(prev => ({
                        ...prev,
                        replaceRequestStatus: 'denied',
                        replaceResponse: prev._replResp || '',
                      }))}>
                      Deny
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Approved */}
            {data.replaceRequestStatus === 'approved' && (
              <div style={{ ...S.approvedBox, marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>Replacement APPROVED</div>
                {data.replaceResponse && isAdmin && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Internal: {data.replaceResponse}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Scope team will build replacement into the project scope.
                </div>
              </div>
            )}

            {/* Denied */}
            {data.replaceRequestStatus === 'denied' && (
              <div style={{ ...S.deniedBox, marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b' }}>Replacement Denied</div>
                {data.replaceResponse && isAdmin && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Internal: {data.replaceResponse}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ════════════════════════════════════════════════
          7. NEW EQUIPMENT (Post-Install)
         ════════════════════════════════════════════════ */}
      <Section title="New Equipment (Post-Install)">
        <div className="jd-field-grid">
          <SelectField label="New Make" value={ne.make} disabled={dis}
            options={HVAC_BRANDS} onChange={v => setSection('newEquipment', 'make', v)} />
          <Field label="New Model #" value={ne.model} disabled={dis}
            onChange={v => setSection('newEquipment', 'model', v)} placeholder="New model #" />
          <Field label="New Serial #" value={ne.serial} disabled={dis}
            onChange={v => setSection('newEquipment', 'serial', v)} placeholder="New serial #" />
          <Field label="New Efficiency" value={ne.efficiency} disabled={dis}
            onChange={v => setSection('newEquipment', 'efficiency', v)} placeholder="e.g. 96% AFUE" />
          <Field label="New BTU Rating" value={ne.btu} disabled={dis}
            onChange={v => setSection('newEquipment', 'btu', v)} placeholder="BTU" />
          <Field label="Install Date" value={ne.installDate} disabled={dis} type="date"
            onChange={v => setSection('newEquipment', 'installDate', v)} />
          <Field label="Installer / Technician" value={ne.installer} disabled={dis}
            onChange={v => setSection('newEquipment', 'installer', v)} placeholder="Tech name" />
          <Field label="Warranty Info" value={ne.warranty} disabled={dis}
            onChange={v => setSection('newEquipment', 'warranty', v)} placeholder="Warranty details" />
        </div>
      </Section>

      {/* ── Save Button ── */}
      <button type="button" onClick={handleSave} disabled={saving || dis}
        className="btn btn-primary"
        style={{
          width: '100%', padding: '12px 24px', fontSize: 15, fontWeight: 700,
          opacity: saving ? 0.7 : 1, cursor: (saving || dis) ? 'not-allowed' : 'pointer',
        }}>
        {saving ? 'Saving...' : 'Save HVAC Data'}
      </button>
    </div>
  );
}
