import React, { useState, useRef, useEffect, useCallback } from 'react';
import ScopeMeasureBuilder from '../ScopeMeasureBuilder';
import ScopeASHRAECalc from '../ScopeASHRAECalc';
import { generatePreWorkSOW, printSOW } from '../../utils';

/* ── Program constants ── */
const INSUL_TARGETS = {
  attic: { target: 49, label: 'Attic insulation when existing <=R19, bring to R-49' },
  knee: { target: 20, label: 'Knee wall R-13+5 or R-20 (min R-11)' },
  ext_wall: { target: 13, label: 'Exterior walls, dense pack when possible' },
  fnd: { target: 10, label: 'Basement/crawl wall min R-10/13' },
};
const FURNACE_MIN_AFUE = 95;
const DHW_MIN_EF = 0.67;
const DHW_EFF = {
  'Natural Gas|Storage Tank': 60, 'Natural Gas|On Demand': 82, 'Natural Gas|Indirect': 80,
  'Electric|Storage Tank': 95, 'Electric|On Demand': 99, 'Electric|Heat Pump': 300,
  'Propane|Storage Tank': 60, 'Propane|On Demand': 82, 'Electric|Indirect': 90,
};

/* ── Shared UI helpers ── */
const optP = (sel) => ({
  padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 20,
  border: `1.5px solid ${sel ? 'var(--color-primary)' : 'var(--color-border)'}`,
  background: sel ? 'var(--color-primary)' : 'var(--color-surface)',
  color: sel ? '#fff' : 'var(--color-text)', transition: 'all 0.15s',
});

const F = ({ l, children }) => (
  <div className="jd-field"><label className="jd-field-label">{l}</label>{children}</div>
);
const Computed = ({ value, suffix }) => (
  <div style={{ padding: '6px 10px', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius)', fontSize: 14, color: 'var(--color-primary)', fontWeight: 600, height: 36, display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)' }}>
    {value || ''}{suffix && <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 6 }}>{suffix}</span>}
  </div>
);
const YN = ({ v, set, dis }) => (
  <div style={{ display: 'flex', gap: 6 }}>
    {['Yes', 'No'].map(o => <button key={o} type="button" disabled={dis} style={optP(v === o)} onClick={() => set(o)}>{o}</button>)}
  </div>
);
const Pills = ({ v, opts, set, dis }) => (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
    {opts.map(o => <button key={o} type="button" disabled={dis} style={optP(v === o)} onClick={() => set(o)}>{o}</button>)}
  </div>
);
const Chk = ({ l, c, set, dis }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: dis ? 'default' : 'pointer' }}>
    <input type="checkbox" checked={!!c} disabled={dis} onChange={e => set(e.target.checked)}
      style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />{l}
  </label>
);
const Notes = ({ value, onChange, dis, placeholder }) => (
  <textarea style={{ width: '100%', marginTop: 10, minHeight: 50, padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 13, resize: 'vertical', background: 'var(--color-surface)', color: 'var(--color-text)' }}
    value={value || ''} onChange={e => onChange(e.target.value)} disabled={dis} rows={2} placeholder={placeholder || 'Notes...'} />
);
const InsulRec = ({ label, preR, addR, target }) => {
  const pre = Number(preR) || 0;
  const add = Number(addR) || 0;
  const total = pre + add;
  if (!preR && !addR) return null;
  const meets = total >= target;
  return (
    <div style={{ padding: '6px 10px', background: meets ? '#dcfce7' : '#fef3c7', border: `1px solid ${meets ? '#86efac' : '#fcd34d'}`, borderRadius: 'var(--radius)', fontSize: 11, marginTop: 8 }}>
      <span style={{ color: meets ? '#166534' : '#92400e' }}>
        R-{pre} existing + R-{add} = R-{total} {meets ? `(meets target R-${target})` : `(target: R-${target}, needs R-${target - total} more)`}
      </span>
      {label && <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{label}</div>}
    </div>
  );
};
const Rec = ({ type, children }) => {
  const c = { rec: { bg: '#dcfce7', bd: '#86efac', fg: '#166534' }, info: { bg: '#eff6ff', bd: '#93c5fd', fg: '#1e40af' }, warn: { bg: '#fef3c7', bd: '#fcd34d', fg: '#92400e' }, flag: { bg: '#fee2e2', bd: '#fca5a5', fg: '#991b1b' } }[type] || { bg: '#eff6ff', bd: '#93c5fd', fg: '#1e40af' };
  return <div style={{ padding: '8px 12px', background: c.bg, border: `1px solid ${c.bd}`, borderRadius: 'var(--radius)', fontSize: 12, color: c.fg, marginTop: 6 }}>{children}</div>;
};

/* ── Section wrapper with anchor id ── */
function Section({ id, title, children }) {
  return (
    <div id={id} className="jd-card" style={{ scrollMarginTop: 80 }}>
      <div className="jd-card-title">{title}</div>
      {children}
    </div>
  );
}

/* ── Jump-to nav ── */
const SECTIONS = [
  { id: 'scope-a', label: 'Property' },
  { id: 'scope-b', label: 'Heating' },
  { id: 'scope-c', label: 'Cooling' },
  { id: 'scope-d', label: 'DHW' },
  { id: 'scope-e', label: 'Interior' },
  { id: 'scope-f', label: 'Doors & Exhaust' },
  { id: 'scope-g', label: 'Attic' },
  { id: 'scope-h', label: 'Knee Walls' },
  { id: 'scope-i', label: 'Ext Walls' },
  { id: 'scope-j', label: 'Foundation' },
  { id: 'scope-ashrae', label: 'ASHRAE' },
  { id: 'scope-summary', label: 'Summary' },
  { id: 'scope-measures', label: 'Measures' },
];

const jumpStyle = (active) => ({
  padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: 14,
  border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
  background: active ? 'var(--color-primary)' : 'transparent',
  color: active ? '#fff' : 'var(--color-text-muted)', transition: 'all 0.15s',
  whiteSpace: 'nowrap', textDecoration: 'none',
});

/* ── Constants ── */
const INT_ITEMS = ['Mold','Moisture','Knob & Tube','Electrical Issues','Broken Glass','Vermiculite',
  'Water Leaks','Roof Leaks','Dropped Ceiling','Drywall Repair','Recessed Lighting','CO Detector','Smoke Detector'];
const CLAD = ['Stucco','Wood Lap','Asbestos','Masonry','Aluminum','Vinyl','Other'];

/* ══ MAIN ══ */
export default function JobScope({ job, canEdit, onUpdate, user }) {
  const [scopeData, setScopeData] = useState(job.scope_data || {});
  const [activeSection, setActiveSection] = useState(null);
  const scrollRef = useRef(null);
  const saveTimer = useRef(null);
  const latestData = useRef(scopeData);

  // Debounced save: update local state immediately, persist after 800ms idle
  const save = useCallback((d) => {
    setScopeData(d);
    latestData.current = d;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onUpdate({ scope_data: latestData.current }), 800);
  }, [onUpdate]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const bd = scopeData.building || {};
  const setBd = (k, val) => save({ ...scopeData, building: { ...bd, [k]: val } });
  const measures = scopeData.measures || [];
  const dis = !canEdit;
  const v = k => bd[k] ?? '';
  const I = ({ k, type = 'text' }) => <input type={type} value={v(k)} disabled={dis} onChange={e => setBd(k, e.target.value)} />;

  /* ── Auto-calculations ── */
  const num = k => Number(bd[k]) || 0;
  const afue = num('btu_in') && num('btu_out') ? (num('btu_out') / num('btu_in') * 100).toFixed(1) + '%' : '';
  const heatAge = num('heat_year') ? (new Date().getFullYear() - num('heat_year')) : '';
  const coolAge = num('cool_year') ? (new Date().getFullYear() - num('cool_year')) : '';
  const dhwAge = num('dhw_year') ? (new Date().getFullYear() - num('dhw_year')) : '';
  const dhwEffKey = `${v('dhw_fuel')}|${v('dhw_system')}`;
  const dhwEff = DHW_EFF[dhwEffKey] || '';
  const dhwOutputBtu = dhwEff && num('dhw_input_btu') ? Math.round(num('dhw_input_btu') * dhwEff / 100) : '';
  const atticTotalR = (num('attic_pre_r') || num('attic_r_add')) ? num('attic_pre_r') + num('attic_r_add') : '';
  const kneeTotalR = (num('knee_pre_r') || num('knee_r_add')) ? num('knee_pre_r') + num('knee_r_add') : '';
  const extWall1stTotalR = (num('ext_wall_1st_pre_r') || num('ext_wall_1st_r_add')) ? num('ext_wall_1st_pre_r') + num('ext_wall_1st_r_add') : '';
  const extWall2ndTotalR = (num('ext_wall_2nd_pre_r') || num('ext_wall_2nd_r_add')) ? num('ext_wall_2nd_pre_r') + num('ext_wall_2nd_r_add') : '';
  const extWall1stWinDoor = num('ext_wall_1st_sqft') ? Math.round(num('ext_wall_1st_sqft') * 0.16) : '';
  const extWall2ndWinDoor = num('ext_wall_2nd_sqft') ? Math.round(num('ext_wall_2nd_sqft') * 0.14) : '';
  const bdPostGoal = num('bd_in') ? (num('bd_in') * 1.1).toFixed(0) : '';
  const cleanTuneAuto = heatAge > 3 && v('heat_fuel') === 'Natural Gas' && v('heat_replace_rec_') !== 'Yes';

  const jumpTo = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={scrollRef} style={{ display: 'grid', gap: 16 }}>
      {/* ── Jump-to Navigation ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 0', position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-background, #f8fafc)' }}>
        {SECTIONS.map(s => (
          <button key={s.id} type="button" style={jumpStyle(activeSection === s.id)} onClick={() => jumpTo(s.id)}>{s.label}</button>
        ))}
      </div>

      {/* ── BUILDING PROPERTY TYPE ── */}
      <Section id="scope-a" title="Building Property Type">
        <div className="jd-field-grid">
          <F l="Style"><I k="style"/></F>
          <F l="Year Built"><I k="year_built" type="number"/></F>
          <F l="Stories"><I k="stories" type="number"/></F>
          <F l="Bedrooms"><I k="bedrooms" type="number"/></F>
          <F l="Occupants"><I k="occupants" type="number"/></F>
          <F l="Sq Footage"><I k="sq_footage" type="number"/></F>
          <F l="Volume"><I k="volume" type="number"/></F>
          <F l="Tenant"><Pills v={v('tenant')} opts={['Own','Rent']} set={x=>setBd('tenant',x)} dis={dis}/></F>
        </div>
        <div className="jd-field-grid" style={{marginTop:14}}>
          {['Gutter Exist','Downspouts','Gutter Repairs'].map(x=>{const k=x.toLowerCase().replace(/ /g,'_');
            return <F key={k} l={x}><YN v={v(k)} set={val=>setBd(k,val)} dis={dis}/></F>;})}
        </div>
        <div className="jd-field-grid" style={{marginTop:14}}>
          <F l="Roof Condition"><Pills v={v('roof_condition')} opts={['Good','Average','Poor']} set={x=>setBd('roof_condition',x)} dis={dis}/></F>
          <F l="Roof Repairs"><YN v={v('roof_repairs')} set={x=>setBd('roof_repairs',x)} dis={dis}/></F>
          <F l="Roof Type"><Pills v={v('roof_type')} opts={['Architecture','3-Tab','Flat']} set={x=>setBd('roof_type',x)} dis={dis}/></F>
          <F l="Roof Age"><I k="roof_age"/></F>
          <F l="High Roof Venting"><YN v={v('high_roof_venting')} set={x=>setBd('high_roof_venting',x)} dis={dis}/></F>
          <F l="Vent Type"><Pills v={v('vent_type')} opts={['Static','Ridge']} set={x=>setBd('vent_type',x)} dis={dis}/></F>
          <F l="Vent Repairs"><YN v={v('vent_repairs')} set={x=>setBd('vent_repairs',x)} dis={dis}/></F>
        </div>
        <Notes value={v('notes_a')} onChange={val=>setBd('notes_a',val)} dis={dis} placeholder="Section A notes..." />
      </Section>

      {/* ── HEATING SYSTEM ── */}
      <Section id="scope-b" title="Heating System">
        <div className="jd-field-grid">
          <F l="Thermostat"><Pills v={v('thermostat')} opts={['Manual','Programmable','Smart']} set={x=>setBd('thermostat',x)} dis={dis}/></F>
          <F l="Fuel"><Pills v={v('heat_fuel')} opts={['Natural Gas','Electric','Propane','Oil']} set={x=>setBd('heat_fuel',x)} dis={dis}/></F>
          <F l="System"><Pills v={v('heat_system')} opts={['Forced Air','Boiler','Other']} set={x=>setBd('heat_system',x)} dis={dis}/></F>
          <F l="Flue Condition"><Pills v={v('flue_condition')} opts={['Good','Average','Poor']} set={x=>setBd('flue_condition',x)} dis={dis}/></F>
        </div>
        <div className="jd-field-grid" style={{marginTop:14}}>
          <F l="Manufacturer"><I k="heat_mfr"/></F>
          <F l="Install Year"><I k="heat_year" type="number"/></F>
          <F l="Age"><Computed value={heatAge ? heatAge + ' yrs' : ''} suffix="auto" /></F>
          <F l="Condition"><I k="heat_condition"/></F>
        </div>
        <div className="jd-field-grid" style={{marginTop:14}}>
          <F l="BTU In"><I k="btu_in" type="number"/></F>
          <F l="BTU Out"><I k="btu_out" type="number"/></F>
          <F l="AFUE"><Computed value={afue} suffix="auto" /></F>
          <F l="Draft"><I k="draft"/></F>
        </div>
        <div className="jd-field-grid" style={{marginTop:14}}>
          {['Gas Shutoff','Asbestos Pipes','Clean & Tune','Replace Rec','Duct Seal'].map(x=>{const k='heat_'+x.toLowerCase().replace(/[^a-z]/g,'_');
            return <F key={k} l={x}><YN v={v(k)} set={val=>setBd(k,val)} dis={dis}/></F>;})}
        </div>
        {/* Auto-recommendations */}
        {cleanTuneAuto && <Rec type="rec">Furnace is {heatAge} yrs old (&gt;3 yrs), Natural Gas - Clean &amp; Tune recommended per program rules.</Rec>}
        {afue && parseFloat(afue) < FURNACE_MIN_AFUE && v('heat_fuel') === 'Natural Gas' && (
          <Rec type="info">AFUE {afue} is below {FURNACE_MIN_AFUE}% program minimum. Replacement only if failed/H&amp;S risk and repair &gt;$950.</Rec>
        )}
        {afue && parseFloat(afue) >= FURNACE_MIN_AFUE && <Rec type="rec">AFUE {afue} meets the {FURNACE_MIN_AFUE}% program standard.</Rec>}
        {v('heat_fuel') === 'Electric' && <Rec type="rec">Electric resistance heat - eligible for heat pump replacement regardless of age/condition.</Rec>}
        <Notes value={v('notes_b')} onChange={val=>setBd('notes_b',val)} dis={dis} placeholder="Heating system notes..." />
      </Section>

      {/* ── COOLING SYSTEM ── */}
      <Section id="scope-c" title="Cooling System">
        <div className="jd-field-grid">
          <F l="Type"><Pills v={v('cool_type')} opts={['Central','Window','Mini-Split','Heat Pump','None']} set={x=>setBd('cool_type',x)} dis={dis}/></F>
          <F l="Manufacturer"><I k="cool_mfr"/></F>
          <F l="Install Year"><I k="cool_year" type="number"/></F>
          <F l="Age"><Computed value={coolAge ? coolAge + ' yrs' : ''} suffix="auto" /></F>
          <F l="SEER"><I k="cool_seer" type="number"/></F>
          <F l="Condition"><I k="cool_condition"/></F>
          <F l="BTU Size"><Pills v={v('cool_btu_size')} opts={['2T','2.5T','3T','3.5T']} set={x=>setBd('cool_btu_size',x)} dis={dis}/></F>
          <F l="Replace Rec"><YN v={v('cool_replace_rec')} set={x=>setBd('cool_replace_rec',x)} dis={dis}/></F>
        </div>
        <Notes value={v('notes_c')} onChange={val=>setBd('notes_c',val)} dis={dis} placeholder="Cooling system notes..." />
      </Section>

      {/* ── DOMESTIC HOT WATER ── */}
      <Section id="scope-d" title="Domestic Hot Water">
        <div className="jd-field-grid">
          <F l="Fuel"><Pills v={v('dhw_fuel')} opts={['Natural Gas','Electric','Propane']} set={x=>setBd('dhw_fuel',x)} dis={dis}/></F>
          <F l="System"><Pills v={v('dhw_system')} opts={['On Demand','Storage Tank','Indirect','Heat Pump']} set={x=>setBd('dhw_system',x)} dis={dis}/></F>
          <F l="Manufacturer"><I k="dhw_mfr"/></F>
          <F l="Install Year"><I k="dhw_year" type="number"/></F>
          <F l="Age"><Computed value={dhwAge ? dhwAge + ' yrs' : ''} suffix="auto" /></F>
          <F l="Condition"><I k="dhw_condition"/></F>
          <F l="Input BTU"><I k="dhw_input_btu" type="number"/></F>
          <F l="Output BTU"><Computed value={dhwOutputBtu ? dhwOutputBtu.toLocaleString() : ''} suffix={dhwEff ? dhwEff + '% avg' : ''} /></F>
          <F l="Efficiency"><Computed value={dhwEff ? dhwEff + '%' : ''} suffix={dhwEff ? `${v('dhw_fuel')} ${v('dhw_system')}` : ''} /></F>
        </div>
        <div className="jd-field-grid" style={{marginTop:14}}>
          {['Insulated Pipes','Flue Repair','Replace Rec'].map(x=>{const k='dhw_'+x.toLowerCase().replace(/ /g,'_');
            return <F key={k} l={x}><YN v={v(k)} set={val=>setBd(k,val)} dis={dis}/></F>;})}
        </div>
        {v('dhw_fuel') === 'Electric' && v('dhw_system') !== 'Heat Pump' && (
          <Rec type="rec">Electric resistance - eligible for Heat Pump WH replacement regardless of age/condition. Must be Energy Star rated.</Rec>
        )}
        {v('dhw_fuel') === 'Natural Gas' && dhwEff && dhwEff / 100 < DHW_MIN_EF && (
          <Rec type="warn">Avg efficiency {dhwEff}% (EF ~{(dhwEff / 100).toFixed(2)}) is below program minimum EF {DHW_MIN_EF}. If failed/H&amp;S risk and repair &gt;$650, eligible for replacement.</Rec>
        )}
        <Notes value={v('notes_d')} onChange={val=>setBd('notes_d',val)} dis={dis} placeholder="Domestic hot water notes..." />
      </Section>

      {/* ── INTERIOR INSPECTION ── */}
      <Section id="scope-e" title="Interior Inspection">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 16px'}}>
          {INT_ITEMS.map(x=>{const k='int_'+x.toLowerCase().replace(/[^a-z]/g,'_');
            return <Chk key={k} l={x} c={bd[k]} set={val=>setBd(k,val)} dis={dis}/>;})}
        </div>
        <div className="jd-field-grid" style={{marginTop:14}}>
          <F l="Ceiling Condition"><Pills v={v('ceiling_condition')} opts={['Good','Poor']} set={x=>setBd('ceiling_condition',x)} dis={dis}/></F>
          <F l="Wall Condition"><I k="wall_condition"/></F>
        </div>
        {bd.int_knob___tube && <Rec type="flag">Knob &amp; Tube wiring found - insulation cannot proceed in affected areas until remediated by licensed electrician.</Rec>}
        {bd.int_vermiculite && <Rec type="flag">Vermiculite found - do NOT disturb. Abatement required before insulation.</Rec>}
        {bd.int_mold && <Rec type="flag">Mold found - remediation required before insulation work.</Rec>}
        <Notes value={v('notes_e')} onChange={val=>setBd('notes_e',val)} dis={dis} placeholder="Interior inspection notes..." />
      </Section>

      {/* ── DOORS & EXHAUST ── */}
      <Section id="scope-f" title="Doors & Exhaust">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 16px'}}>
          {['Front','Back','Basement','Attic'].map(d=>
            <Chk key={d} l={`${d} - existing weather strips`} c={bd['door_'+d.toLowerCase()]} set={val=>setBd('door_'+d.toLowerCase(),val)} dis={dis}/>)}
        </div>
        <div className="jd-field-grid" style={{marginTop:14}}>
          <F l="Total Sweeps Needed"><I k="sweeps_needed" type="number"/></F>
          {['Exhaust Fan Replace','Bath Fan w/Light','Vent Kit','Term Cap','Dryer Proper','Dryer Repair'].map(x=>{
            const k=x.toLowerCase().replace(/[^a-z/]/g,'_').replace(/\/+/g,'_');
            return <F key={k} l={x}><YN v={v(k)} set={val=>setBd(k,val)} dis={dis}/></F>;})}
        </div>
        <div className="jd-field-grid" style={{marginTop:14}}>
          <F l="Blower Door IN (CFM50)"><I k="bd_in" type="number"/>
            {bdPostGoal && <div style={{fontSize:12,fontWeight:600,color:'var(--color-primary)',marginTop:4}}>Post goal: {bdPostGoal} CFM (10% reduction)</div>}
          </F>
          <F l="Blower Door OUT (CFM50)"><I k="bd_out" type="number"/>
            {num('bd_in') > 0 && num('bd_out') > 0 && (() => {
              const reduction = ((1 - num('bd_out') / num('bd_in')) * 100).toFixed(1);
              const meets = Number(reduction) >= 10;
              return <div style={{fontSize:12,fontWeight:600,color: meets ? 'var(--color-success)' : 'var(--color-warning)',marginTop:4}}>
                {reduction}% reduction {meets ? '(meets 10% goal)' : '(below 10% goal)'}
              </div>;
            })()}
          </F>
        </div>
        <div style={{marginTop:10}}><Chk l="No blower door (asbestos/vermiculite only)" c={bd.no_blower_door} set={val=>setBd('no_blower_door',val)} dis={dis}/></div>
        <Notes value={v('notes_f')} onChange={val=>setBd('notes_f',val)} dis={dis} placeholder="Doors & exhaust notes..." />
      </Section>

      {/* ── ATTIC ── */}
      <Section id="scope-g" title="Attic">
        <div className="jd-field-grid">
          <F l="Type"><Pills v={v('attic_type')} opts={['Finished','Unfinished','Flat']} set={x=>setBd('attic_type',x)} dis={dis}/></F>
          <F l="Sq Ft"><I k="attic_sqft" type="number"/></F>
          <F l="Pre R"><I k="attic_pre_r" type="number"/></F>
          <F l="R to Add"><I k="attic_r_add" type="number"/></F>
          <F l="Total R"><Computed value={atticTotalR ? 'R-' + atticTotalR : ''} suffix="auto" /></F>
          <F l="Ductwork"><YN v={v('attic_ductwork')} set={x=>setBd('attic_ductwork',x)} dis={dis}/></F>
          <F l="Floor Boards"><YN v={v('attic_floor_boards')} set={x=>setBd('attic_floor_boards',x)} dis={dis}/></F>
          <F l="Recessed Lighting Qty"><I k="attic_recess_qty" type="number"/></F>
          <F l="Access Location"><I k="attic_access_loc"/></F>
          <F l="Existing Ventilation"><I k="attic_exist_vent"/></F>
          <F l="Needed Ventilation"><I k="attic_need_vent"/></F>
        </div>
        <div style={{display:'flex',gap:16,marginTop:10}}>
          {['Mold','Vermiculite','K&T'].map(x=>{const k='attic_'+x.toLowerCase().replace(/&/,'').replace(/ /g,'');
            return <Chk key={k} l={x} c={bd[k]} set={val=>setBd(k,val)} dis={dis}/>;})}
        </div>
        <InsulRec preR={v('attic_pre_r')} addR={v('attic_r_add')} target={INSUL_TARGETS.attic.target} label={INSUL_TARGETS.attic.label} />
        {bd.attic_kt && <Rec type="flag">Knob &amp; Tube in attic - insulation CANNOT proceed until remediated by licensed electrician.</Rec>}
        {bd.attic_vermiculite && <Rec type="flag">Vermiculite in attic - do NOT disturb. Abatement required before insulation.</Rec>}
        {bd.attic_mold && <Rec type="flag">Mold in attic - remediation required before insulation work.</Rec>}
        {bd.attic_floor_boards === 'Yes' && <Rec type="info">Floor boards present - dense pack at 3.5 lbs/ft3 unless homeowner agrees to remove flooring and blow to R-49.</Rec>}
        <Notes value={v('notes_g')} onChange={val=>setBd('notes_g',val)} dis={dis} placeholder="Attic notes..." />
      </Section>

      {/* ── KNEE WALLS ── */}
      <Section id="scope-h" title="Knee Walls">
        <div className="jd-field-grid">
          <F l="Sq Ft"><I k="knee_sqft" type="number"/></F>
          <F l="Pre R"><I k="knee_pre_r" type="number"/></F>
          <F l="R to Add"><I k="knee_r_add" type="number"/></F>
          <F l="Total R"><Computed value={kneeTotalR ? 'R-' + kneeTotalR : ''} suffix="auto" /></F>
          <F l="Dense Pack"><YN v={v('knee_dense_pack')} set={x=>setBd('knee_dense_pack',x)} dis={dis}/></F>
          <F l="Rigid Foam"><YN v={v('knee_rigid_foam')} set={x=>setBd('knee_rigid_foam',x)} dis={dis}/></F>
          <F l="Tyvek Needed"><YN v={v('knee_tyvek')} set={x=>setBd('knee_tyvek',x)} dis={dis}/></F>
          <F l="Fiberglass Batts"><YN v={v('knee_fg_batts')} set={x=>setBd('knee_fg_batts',x)} dis={dis}/></F>
          <F l="Wall Type"><Pills v={v('knee_wall_type')} opts={['Drywall','Plaster']} set={x=>setBd('knee_wall_type',x)} dis={dis}/></F>
          {v('knee_tyvek') === 'Yes' && <F l="Tyvek Sq Ft"><I k="knee_tyvek_sqft" type="number"/></F>}
        </div>
        <InsulRec preR={v('knee_pre_r')} addR={v('knee_r_add')} target={INSUL_TARGETS.knee.target} label={INSUL_TARGETS.knee.label} />
        <Notes value={v('notes_h')} onChange={val=>setBd('notes_h',val)} dis={dis} placeholder="Knee wall notes..." />
      </Section>

      {/* ── EXTERIOR WALLS ── */}
      <Section id="scope-i" title="Exterior Walls">
        {['1st','2nd'].map(fl => {
          const totalR = fl === '1st' ? extWall1stTotalR : extWall2ndTotalR;
          const winDoor = fl === '1st' ? extWall1stWinDoor : extWall2ndWinDoor;
          return (
            <div key={fl} style={{marginBottom: fl === '1st' ? 20 : 0}}>
              <div style={{fontSize:13,fontWeight:700,color:'var(--color-text-muted)',marginBottom:8}}>{fl} Floor</div>
              <div className="jd-field-grid">
                <F l="Sq Ft"><I k={`ext_wall_${fl}_sqft`} type="number"/></F>
                <F l="Win/Door SqFt"><Computed value={winDoor || ''} /></F>
                <F l="Pre R"><I k={`ext_wall_${fl}_pre_r`} type="number"/></F>
                <F l="R to Add"><I k={`ext_wall_${fl}_r_add`} type="number"/></F>
                <F l="Total R"><Computed value={totalR ? 'R-' + totalR : ''} suffix="auto" /></F>
                <F l="Dense Pack"><YN v={v(`ext_wall_${fl}_dense_pack`)} set={x=>setBd(`ext_wall_${fl}_dense_pack`,x)} dis={dis}/></F>
                <F l="Insulate From"><Pills v={v(`ext_wall_${fl}_insul_from`)} opts={['Interior','Exterior']} set={x=>setBd(`ext_wall_${fl}_insul_from`,x)} dis={dis}/></F>
                <F l="Wall Type"><Pills v={v(`ext_wall_${fl}_wall_type`)} opts={['Drywall','Plaster']} set={x=>setBd(`ext_wall_${fl}_wall_type`,x)} dis={dis}/></F>
                <F l="Drill Hole Location"><I k={`ext_wall_${fl}_drill_loc`}/></F>
              </div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:10}}>
                {CLAD.map(c=><Chk key={c} l={c} c={(bd[`ext_wall_${fl}_cladding`]||[]).includes(c)}
                  set={val=>{const a=bd[`ext_wall_${fl}_cladding`]||[];setBd(`ext_wall_${fl}_cladding`,val?[...a,c]:a.filter(x=>x!==c));}} dis={dis}/>)}
              </div>
              <div style={{marginTop:6}}><Chk l="Informed owner about prep" c={bd[`ext_wall_${fl}_owner_prep`]} set={val=>setBd(`ext_wall_${fl}_owner_prep`,val)} dis={dis}/></div>
              <InsulRec preR={v(`ext_wall_${fl}_pre_r`)} addR={v(`ext_wall_${fl}_r_add`)} target={INSUL_TARGETS.ext_wall.target} label={INSUL_TARGETS.ext_wall.label} />
              {num(`ext_wall_${fl}_pre_r`) > 0 && <Rec type="info">Walls may only be insulated if no existing insulation or existing is in poor condition.</Rec>}
            </div>
          );
        })}
        <Notes value={v('notes_i')} onChange={val=>setBd('notes_i',val)} dis={dis} placeholder="Exterior wall notes..." />
      </Section>

      {/* ── FOUNDATION ── */}
      <Section id="scope-j" title="Foundation">
        <div className="jd-field-grid">
          <F l="Type"><Pills v={v('fnd_type')} opts={['None','Basement','Crawlspace']} set={x=>setBd('fnd_type',x)} dis={dis}/></F>
          <F l="Sq Ft Above Grade"><I k="fnd_sqft_above" type="number"/></F>
          <F l="Sq Ft Below Grade"><I k="fnd_sqft_below" type="number"/></F>
          <F l="Pre R"><I k="fnd_pre_r" type="number"/></F>
          <F l="Insulation Type"><Pills v={v('fnd_insul_type')} opts={['Fiberglass','Rigid Foam Board','None']} set={x=>setBd('fnd_insul_type',x)} dis={dis}/></F>
        </div>

        {/* Band Joists */}
        <div style={{ marginTop: 14, fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Band Joists</div>
        <div className="jd-field-grid" style={{marginTop:6}}>
          <F l="Band Joist Access"><YN v={v('fnd_band_joist')} set={x=>setBd('fnd_band_joist',x)} dis={dis}/></F>
          {v('fnd_band_joist') === 'Yes' && <>
            <F l="Band Lin Ft"><I k="fnd_band_linft" type="number"/></F>
            <F l="Band Pre R"><I k="fnd_band_r" type="number"/></F>
            <F l="Band Insulation"><Pills v={v('fnd_band_insul')} opts={['Fiberglass','Rigid Foam Board','None']} set={x=>setBd('fnd_band_insul',x)} dis={dis}/></F>
          </>}
        </div>

        {/* Crawlspace */}
        {v('fnd_type') === 'Crawlspace' && <>
          <div style={{ marginTop: 14, fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Crawlspace</div>
          <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            <Chk l="Vented" c={bd.fnd_vented} set={val=>setBd('fnd_vented',val)} dis={dis}/>
            <Chk l="Vapor Barrier Needed" c={bd.fnd_vapor_barrier} set={val=>setBd('fnd_vapor_barrier',val)} dis={dis}/>
            <Chk l="Water Issues" c={bd.fnd_water_issues} set={val=>setBd('fnd_water_issues',val)} dis={dis}/>
            <Chk l="Ductwork" c={bd.fnd_crawl_duct} set={val=>setBd('fnd_crawl_duct',val)} dis={dis}/>
          </div>
          <div className="jd-field-grid" style={{marginTop:8}}>
            <F l="Crawl Floor"><Pills v={v('fnd_crawl_floor')} opts={['Concrete','Dirt/Gravel']} set={x=>setBd('fnd_crawl_floor',x)} dis={dis}/></F>
            {bd.fnd_vented && <F l="# of Vents"><I k="fnd_vent_count" type="number"/></F>}
            {bd.fnd_vapor_barrier && <F l="Barrier SqFt"><I k="fnd_barrier_sqft" type="number"/></F>}
            <F l="Crawl Above Grade SqFt"><I k="fnd_crawl_above" type="number"/></F>
            <F l="Crawl Below Grade SqFt"><I k="fnd_crawl_below" type="number"/></F>
            <F l="Crawl Pre R"><I k="fnd_crawl_r" type="number"/></F>
          </div>
          {bd.fnd_water_issues && <Rec type="flag">Water issues present - must be resolved before insulation work can proceed.</Rec>}
          {bd.fnd_vapor_barrier && v('fnd_crawl_floor') === 'Dirt/Gravel' && <Rec type="rec">Dirt/gravel crawl floor - vapor barrier (min 6 mil) required before wall insulation.</Rec>}
        </>}

        <InsulRec preR={v('fnd_pre_r')} addR="" target={INSUL_TARGETS.fnd.target} label={INSUL_TARGETS.fnd.label} />
        {v('fnd_band_joist') === 'Yes' && num('fnd_band_r') === 0 && <Rec type="rec">Rim joist has no insulation - insulate to min R-10. Batt insulation NOT allowed for rim joist.</Rec>}
        <Notes value={v('notes_j')} onChange={val=>setBd('notes_j',val)} dis={dis} placeholder="Foundation notes..." />
      </Section>

      {/* ── ASHRAE 62.2 ── */}
      <div id="scope-ashrae" style={{ scrollMarginTop: 80 }}>
        <ScopeASHRAECalc job={job} scopeData={scopeData}
          onChange={d => save({ ...scopeData, ...d })} canEdit={canEdit} />
      </div>

      {/* ── SUMMARY ── */}
      <Section id="scope-summary" title="Scope Summary">
        <div className="jd-field-grid">
          <div className="jd-field"><label className="jd-field-label">Selected Measures</label>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>{measures.length}</div></div>
          <div className="jd-field"><label className="jd-field-label">Sq Footage</label>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{bd.sq_footage || ''}</div></div>
          <div className="jd-field"><label className="jd-field-label">BD IN</label>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{bd.bd_in || ''}</div></div>
          <div className="jd-field"><label className="jd-field-label">BD OUT</label>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{bd.bd_out || ''}</div></div>
          <div className="jd-field"><label className="jd-field-label">AFUE</label>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{afue}</div></div>
          {bdPostGoal && <div className="jd-field"><label className="jd-field-label">BD Post Goal</label>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{bdPostGoal} CFM</div></div>}
          {num('bd_in') > 0 && num('bd_out') > 0 && <div className="jd-field"><label className="jd-field-label">BD Reduction</label>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{((1 - num('bd_out') / num('bd_in')) * 100).toFixed(1)}%</div></div>}
        </div>
        <div style={{ marginTop: 20 }}>
          <button type="button" className="btn btn-primary"
            onClick={() => printSOW(generatePreWorkSOW(job, measures, user?.full_name))}>Print Scope</button>
        </div>
      </Section>

      {/* ── MEASURES ── */}
      <div id="scope-measures" style={{ scrollMarginTop: 80 }}>
        <ScopeMeasureBuilder job={job} measures={measures}
          onChange={m => save({ ...scopeData, measures: m })}
          assessmentRecs={job.assessment_data?.weatherization_recommendations || []} canEdit={canEdit} />
      </div>
    </div>
  );
}
