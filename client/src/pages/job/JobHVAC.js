import React, { useState, useEffect, useRef } from 'react';
import { filterSections } from './photoSectionsData';
import PhotoChecklist from './PhotoChecklist';

const HVAC_SECTIONS = filterSections('hvac', 'repl');

const FUEL_TYPES = ['Natural Gas', 'Propane', 'Oil', 'Electric'];
const CONDITION_OPTS = ['Good', 'Fair', 'Poor', 'Needs Replacement'];
const VENT_TYPES = ['Natural Draft', 'Direct Vent', 'Power Vent', 'Sealed Combustion'];
const EQUIP_TYPES = ['Gas Furnace', 'Gas Boiler', 'Central AC', 'Water Heater', 'Room AC', 'Heat Pump'];
const PRIORITY_OPTS = ['Immediate', 'Standard'];
const REPLACE_STATUSES = ['Pending', 'Submitted to RI', 'Approved by RI', 'Denied'];

// Program minimum efficiency standards (HES Retrofits Ops Manual 2026)
const MIN_EFFICIENCY = {
  'Gas Furnace':  { label: 'Min. AFUE', value: '≥ 95% AFUE' },
  'Gas Boiler':   { label: 'Min. AFUE', value: '≥ 95% AFUE' },
  'Central AC':   { label: 'Min. SEER2', value: '≥ 15.2 SEER2 (16 SEER equivalent)' },
  'Water Heater': { label: 'Min. EF', value: '≥ 0.67 EF (gas) · Energy Star (electric/HPWH)' },
  'Room AC':      { label: 'Requirement', value: 'Energy Star rated' },
  'Heat Pump':    { label: 'Requirement', value: 'See program guidelines' },
};

function Field({ label, value, onChange, disabled, type, children }) {
  return (
    <div className="jd-field">
      <label className="jd-field-label">{label}</label>
      {children || (
        <input type={type || 'text'} value={value || ''} disabled={disabled}
          onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

function Select({ label, value, onChange, disabled, options }) {
  return (
    <div className="jd-field">
      <label className="jd-field-label">{label}</label>
      <select value={value || ''} disabled={disabled} onChange={e => onChange(e.target.value)}>
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Check({ label, checked, onChange, disabled }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: disabled ? 'default' : 'pointer' }}>
      <input type="checkbox" checked={!!checked} disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
      <span>{label}</span>
    </label>
  );
}

export default function JobHVAC({ job, canEdit, isAdmin, onUpdate, user }) {
  const [form, setForm] = useState(() => {
    const d = job.hvac_data || {};
    return {
      heating: d.heating || {},
      cooling: d.cooling || {},
      water_heater: d.water_heater || {},
      tune_clean: d.tune_clean || {},
      combustion: d.combustion || {},
      replacement: d.replacement || {},
      new_equipment: d.new_equipment || {},
    };
  });

  const saveTimer = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onUpdate({ hvac_data: form }), 800);
    return () => clearTimeout(saveTimer.current);
  }, [form]); // eslint-disable-line

  const set = (section, field, value) =>
    setForm(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));

  const dis = !canEdit;
  const h = form.heating;
  const c = form.cooling;
  const w = form.water_heater;
  const tc = form.tune_clean;
  const cb = form.combustion;
  const rp = form.replacement;
  const ne = form.new_equipment;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* EXISTING HEATING SYSTEM */}
      <div className="jd-card">
        <div className="jd-card-title">Existing Heating System</div>
        <div className="jd-field-grid">
          <Field label="Make" value={h.make} onChange={v => set('heating', 'make', v)} disabled={dis} />
          <Field label="Model" value={h.model} onChange={v => set('heating', 'model', v)} disabled={dis} />
          <Field label="Serial" value={h.serial} onChange={v => set('heating', 'serial', v)} disabled={dis} />
          <Field label="Age (years)" value={h.age} onChange={v => set('heating', 'age', v)} disabled={dis} type="number" />
          <Select label="Fuel" value={h.fuel} onChange={v => set('heating', 'fuel', v)} disabled={dis} options={FUEL_TYPES} />
          <Field label="BTU Input" value={h.btu_input} onChange={v => set('heating', 'btu_input', v)} disabled={dis} type="number" />
          <Field label="BTU Output" value={h.btu_output} onChange={v => set('heating', 'btu_output', v)} disabled={dis} type="number" />
          <Field label="AFUE %" value={h.afue} onChange={v => set('heating', 'afue', v)} disabled={dis} type="number" />
          <Select label="Condition" value={h.condition} onChange={v => set('heating', 'condition', v)} disabled={dis} options={CONDITION_OPTS} />
          <Select label="Venting Type" value={h.venting} onChange={v => set('heating', 'venting', v)} disabled={dis} options={VENT_TYPES} />
          <Select label="Flue Condition" value={h.flue_condition} onChange={v => set('heating', 'flue_condition', v)} disabled={dis} options={CONDITION_OPTS} />
        </div>
      </div>

      {/* EXISTING COOLING SYSTEM */}
      <div className="jd-card">
        <div className="jd-card-title">Existing Cooling System</div>
        <div className="jd-field-grid">
          <Field label="Make" value={c.make} onChange={v => set('cooling', 'make', v)} disabled={dis} />
          <Field label="Model" value={c.model} onChange={v => set('cooling', 'model', v)} disabled={dis} />
          <Field label="Serial" value={c.serial} onChange={v => set('cooling', 'serial', v)} disabled={dis} />
          <Field label="Age (years)" value={c.age} onChange={v => set('cooling', 'age', v)} disabled={dis} type="number" />
          <Field label="SEER" value={c.seer} onChange={v => set('cooling', 'seer', v)} disabled={dis} type="number" />
          <Select label="Condition" value={c.condition} onChange={v => set('cooling', 'condition', v)} disabled={dis} options={CONDITION_OPTS} />
          <Select label="Refrigerant Type" value={c.refrigerant} onChange={v => set('cooling', 'refrigerant', v)} disabled={dis} options={['R-410A', 'R-22', 'R-407C', 'R-134a', 'Unknown']} />
        </div>
      </div>

      {/* EXISTING WATER HEATER */}
      <div className="jd-card">
        <div className="jd-card-title">Existing Water Heater</div>
        <div className="jd-field-grid">
          <Field label="Make" value={w.make} onChange={v => set('water_heater', 'make', v)} disabled={dis} />
          <Field label="Model" value={w.model} onChange={v => set('water_heater', 'model', v)} disabled={dis} />
          <Field label="Serial" value={w.serial} onChange={v => set('water_heater', 'serial', v)} disabled={dis} />
          <Field label="Age (years)" value={w.age} onChange={v => set('water_heater', 'age', v)} disabled={dis} type="number" />
          <Select label="Fuel" value={w.fuel} onChange={v => set('water_heater', 'fuel', v)} disabled={dis} options={FUEL_TYPES} />
          <Field label="Input BTU" value={w.input_btu} onChange={v => set('water_heater', 'input_btu', v)} disabled={dis} type="number" />
          <Select label="Condition" value={w.condition} onChange={v => set('water_heater', 'condition', v)} disabled={dis} options={CONDITION_OPTS} />
          <Select label="Venting" value={w.venting} onChange={v => set('water_heater', 'venting', v)} disabled={dis} options={VENT_TYPES} />
        </div>
      </div>

      {/* TUNE & CLEAN */}
      <div className="jd-card">
        <div className="jd-card-title">Tune & Clean</div>
        <div className="jd-field-grid">
          <Field label="Date Performed" value={tc.date} onChange={v => set('tune_clean', 'date', v)} disabled={dis} type="date" />
          <Field label="Technician" value={tc.technician} onChange={v => set('tune_clean', 'technician', v)} disabled={dis} />
          <Field label="Filter Size" value={tc.filter_size} onChange={v => set('tune_clean', 'filter_size', v)} disabled={dis} />
        </div>
        <div style={{ marginTop: 12 }}>
          <Check label="Filter Changed" checked={tc.filter_changed} onChange={v => set('tune_clean', 'filter_changed', v)} disabled={dis} />
        </div>
        <div className="jd-field" style={{ marginTop: 12 }}>
          <label className="jd-field-label">Findings</label>
          <textarea value={tc.findings || ''} disabled={dis}
            onChange={e => set('tune_clean', 'findings', e.target.value)} rows={3}
            placeholder="Findings and recommendations..." />
        </div>
      </div>

      {/* COMBUSTION SAFETY TESTING */}
      <div className="jd-card">
        <div className="jd-card-title">Combustion Safety Testing</div>
        <div className="jd-field-grid">
          <Field label="Ambient CO (ppm)" value={cb.ambient_co} onChange={v => set('combustion', 'ambient_co', v)} disabled={dis} type="number" />
          <Select label="Spillage Test (Heating)" value={cb.spillage_heating} onChange={v => set('combustion', 'spillage_heating', v)} disabled={dis} options={['Pass', 'Fail']} />
          <Select label="WH Spillage" value={cb.spillage_wh} onChange={v => set('combustion', 'spillage_wh', v)} disabled={dis} options={['Pass', 'Fail']} />
          <Field label="Flue CO (ppm)" value={cb.flue_co} onChange={v => set('combustion', 'flue_co', v)} disabled={dis} type="number" />
          <Field label="Oven CO (ppm)" value={cb.oven_co} onChange={v => set('combustion', 'oven_co', v)} disabled={dis} type="number" />
        </div>
      </div>

      {/* REPLACEMENT RECOMMENDATION */}
      <div className="jd-card">
        <div className="jd-card-title">Replacement Recommendation</div>
        <Check label="Replacement Recommended" checked={rp.recommended} onChange={v => set('replacement', 'recommended', v)} disabled={dis} />
        {rp.recommended && (
          <div style={{ marginTop: 12 }}>
            <div className="jd-field-grid">
              <Select label="Equipment Type" value={rp.equip_type} onChange={v => set('replacement', 'equip_type', v)} disabled={dis} options={EQUIP_TYPES} />
              <Select label="Priority" value={rp.priority} onChange={v => set('replacement', 'priority', v)} disabled={dis} options={PRIORITY_OPTS} />
              <Select label="Status" value={rp.status} onChange={v => set('replacement', 'status', v)} disabled={!isAdmin} options={REPLACE_STATUSES} />
            </div>

            {/* Program minimum efficiency reminder */}
            {rp.equip_type && MIN_EFFICIENCY[rp.equip_type] && (
              <div style={{ margin: '12px 0', padding: '10px 14px', background: '#eff6ff',
                border: '1px solid #bfdbfe', borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📋</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Program Minimum — {MIN_EFFICIENCY[rp.equip_type].label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1e40af' }}>
                    {MIN_EFFICIENCY[rp.equip_type].value}
                  </div>
                </div>
              </div>
            )}

            {/* What to replace with */}
            <div className="jd-field-grid" style={{ marginTop: 4 }}>
              <Field label="Recommended Make / Brand" value={rp.rec_make}
                onChange={v => set('replacement', 'rec_make', v)} disabled={dis} />
              <Field label="Recommended Model" value={rp.rec_model}
                onChange={v => set('replacement', 'rec_model', v)} disabled={dis} />
              <Field label="Recommended Efficiency (AFUE/SEER/EF)" value={rp.rec_efficiency}
                onChange={v => set('replacement', 'rec_efficiency', v)} disabled={dis}
                placeholder={rp.equip_type ? MIN_EFFICIENCY[rp.equip_type]?.value : 'e.g. 96% AFUE'} />
              <Field label="Recommended Size / Capacity" value={rp.rec_size}
                onChange={v => set('replacement', 'rec_size', v)} disabled={dis}
                placeholder="e.g. 80,000 BTU / 3 Ton" />
            </div>

            <div className="jd-field" style={{ marginTop: 4 }}>
              <label className="jd-field-label">Justification / Notes</label>
              <textarea value={rp.justification || ''} disabled={dis}
                onChange={e => set('replacement', 'justification', e.target.value)} rows={3}
                placeholder="Why is replacement needed, decision tree result..." />
            </div>
            {canEdit && rp.status !== 'Submitted to RI' && (
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }}
                onClick={() => {
                  set('replacement', 'status', 'Submitted to RI');
                  console.log('[Audit] Replacement submitted to RI by', user, new Date().toISOString());
                }}>Submit to RI</button>
            )}
          </div>
        )}
      </div>

      {/* NEW EQUIPMENT (post-install) */}
      {rp.status === 'Approved by RI' && (
        <div className="jd-card">
          <div className="jd-card-title">New Equipment (Post-Install)</div>
          <div className="jd-field-grid">
            <Field label="New Make" value={ne.make} onChange={v => set('new_equipment', 'make', v)} disabled={dis} />
            <Field label="New Model" value={ne.model} onChange={v => set('new_equipment', 'model', v)} disabled={dis} />
            <Field label="New Serial" value={ne.serial} onChange={v => set('new_equipment', 'serial', v)} disabled={dis} />
            <Field label="Install Date" value={ne.install_date} onChange={v => set('new_equipment', 'install_date', v)} disabled={dis} type="date" />
            <Field label="Installed By" value={ne.installed_by} onChange={v => set('new_equipment', 'installed_by', v)} disabled={dis} />
            <Field label="SEER / AFUE" value={ne.efficiency} onChange={v => set('new_equipment', 'efficiency', v)} disabled={dis} />
          </div>
        </div>
      )}

      {/* ─── HVAC Photo Checklist ─── */}
      <PhotoChecklist sections={HVAC_SECTIONS} job={job} canEdit={canEdit} user={user} />

    </div>
  );
}
