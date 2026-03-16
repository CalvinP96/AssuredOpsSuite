import React, { useState } from 'react';
import ScopeMeasureBuilder from '../ScopeMeasureBuilder';
import ScopeASHRAECalc from '../ScopeASHRAECalc';
import { generatePreWorkSOW, printSOW } from '../../utils';

const SUB_TABS = ['Measures', 'Building Data', 'ASHRAE', 'Summary'];
const pill = (sel) => ({
  padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 20,
  border: `1.5px solid ${sel ? 'var(--color-primary)' : 'var(--color-border)'}`,
  background: sel ? 'var(--color-primary)' : 'transparent',
  color: sel ? '#fff' : 'var(--color-text-muted)', transition: 'all 0.15s',
});
const optP = (sel) => ({
  padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 20,
  border: `1.5px solid ${sel ? 'var(--color-primary)' : 'var(--color-border)'}`,
  background: sel ? 'var(--color-primary)' : 'var(--color-surface)',
  color: sel ? '#fff' : 'var(--color-text)', transition: 'all 0.15s',
});

const F = ({ l, children }) => (
  <div className="jd-field"><label className="jd-field-label">{l}</label>{children}</div>
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

function Acc({ title, open, toggle, children }) {
  return (
    <div className="jd-card" style={{ marginBottom: 12 }}>
      <button type="button" onClick={toggle} style={{ width: '100%', background: 'none', border: 'none',
        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0, textAlign: 'left' }}>
        <span className="jd-card-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>{title}</span>
        <span style={{ fontSize: 18, color: 'var(--color-text-muted)' }}>{open ? '\u25B2' : '\u25BC'}</span>
      </button>
      {open && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  );
}

/* ── Building Data ── */
function BuildingData({ bd, s, dis }) {
  const [op, setOp] = useState({});
  const t = k => setOp(p => ({ ...p, [k]: !p[k] }));
  const v = k => bd[k] ?? '';
  const I = ({ k, type = 'text' }) => <input type={type} value={v(k)} disabled={dis} onChange={e => s(k, e.target.value)} />;
  const afue = bd.btu_in && bd.btu_out ? (Number(bd.btu_out) / Number(bd.btu_in) * 100).toFixed(1) + '%' : '\u2014';
  const INT_ITEMS = ['Mold','Moisture','Knob & Tube','Electrical Issues','Broken Glass','Vermiculite',
    'Water Leaks','Roof Leaks','Dropped Ceiling','Drywall Repair','Recessed Lighting','CO Detector','Smoke Detector'];
  const CLAD = ['Stucco','Wood Lap','Asbestos','Masonry','Aluminum','Vinyl','Other'];

  return (<>
    <Acc title="A \u2014 Building Property Type" open={op.a} toggle={() => t('a')}>
      <div className="jd-field-grid">
        <F l="Style"><I k="style"/></F><F l="Year Built"><I k="year_built" type="number"/></F>
        <F l="Stories"><I k="stories" type="number"/></F><F l="Bedrooms"><I k="bedrooms" type="number"/></F>
        <F l="Occupants"><I k="occupants" type="number"/></F><F l="Sq Footage"><I k="sq_footage" type="number"/></F>
        <F l="Volume"><I k="volume" type="number"/></F>
        <F l="Tenant"><Pills v={v('tenant')} opts={['Own','Rent']} set={x=>s('tenant',x)} dis={dis}/></F>
      </div>
      <div className="jd-field-grid" style={{marginTop:14}}>
        {['Gutter Exist','Downspouts','Gutter Repairs'].map(x=>{const k=x.toLowerCase().replace(/ /g,'_');
          return <F key={k} l={x}><YN v={v(k)} set={val=>s(k,val)} dis={dis}/></F>;})}
      </div>
      <div className="jd-field-grid" style={{marginTop:14}}>
        <F l="Roof Condition"><Pills v={v('roof_condition')} opts={['Good','Average','Poor']} set={x=>s('roof_condition',x)} dis={dis}/></F>
        <F l="Roof Repairs"><YN v={v('roof_repairs')} set={x=>s('roof_repairs',x)} dis={dis}/></F>
        <F l="Roof Type"><Pills v={v('roof_type')} opts={['Architecture','3-Tab','Flat']} set={x=>s('roof_type',x)} dis={dis}/></F>
        <F l="Roof Age"><I k="roof_age"/></F>
        <F l="High Roof Venting"><YN v={v('high_roof_venting')} set={x=>s('high_roof_venting',x)} dis={dis}/></F>
        <F l="Vent Type"><Pills v={v('vent_type')} opts={['Static','Ridge']} set={x=>s('vent_type',x)} dis={dis}/></F>
        <F l="Vent Repairs"><YN v={v('vent_repairs')} set={x=>s('vent_repairs',x)} dis={dis}/></F>
      </div>
    </Acc>

    <Acc title="B \u2014 Heating System" open={op.b} toggle={() => t('b')}>
      <div className="jd-field-grid">
        <F l="Thermostat"><Pills v={v('thermostat')} opts={['Manual','Programmable','Smart']} set={x=>s('thermostat',x)} dis={dis}/></F>
        <F l="Fuel"><Pills v={v('heat_fuel')} opts={['Natural Gas','Electric','Propane','Oil']} set={x=>s('heat_fuel',x)} dis={dis}/></F>
        <F l="System"><Pills v={v('heat_system')} opts={['Forced Air','Boiler','Other']} set={x=>s('heat_system',x)} dis={dis}/></F>
        <F l="Flue Condition"><Pills v={v('flue_condition')} opts={['Good','Average','Poor']} set={x=>s('flue_condition',x)} dis={dis}/></F>
        <F l="Manufacturer"><I k="heat_mfr"/></F><F l="Year"><I k="heat_year" type="number"/></F>
        <F l="Condition"><I k="heat_condition"/></F><F l="BTU In"><I k="btu_in" type="number"/></F>
        <F l="BTU Out"><I k="btu_out" type="number"/></F>
        <F l="AFUE"><div style={{padding:'8px 0',fontSize:14,fontWeight:700,color:'var(--color-primary)'}}>{afue}</div></F>
        <F l="Draft"><I k="draft"/></F>
        {['Gas Shutoff','Asbestos Pipes','Clean & Tune','Replace Rec','Duct Seal'].map(x=>{const k='heat_'+x.toLowerCase().replace(/[^a-z]/g,'_');
          return <F key={k} l={x}><YN v={v(k)} set={val=>s(k,val)} dis={dis}/></F>;})}
      </div>
    </Acc>

    <Acc title="C \u2014 Cooling System" open={op.c} toggle={() => t('c')}>
      <div className="jd-field-grid">
        <F l="Type"><Pills v={v('cool_type')} opts={['Central','Window','Mini-Split','Heat Pump','None']} set={x=>s('cool_type',x)} dis={dis}/></F>
        <F l="Manufacturer"><I k="cool_mfr"/></F><F l="Age"><I k="cool_age" type="number"/></F>
        <F l="SEER"><I k="cool_seer" type="number"/></F><F l="Condition"><I k="cool_condition"/></F>
        <F l="BTU Size"><Pills v={v('cool_btu_size')} opts={['2T','2.5T','3T','3.5T']} set={x=>s('cool_btu_size',x)} dis={dis}/></F>
        <F l="Replace Rec"><YN v={v('cool_replace_rec')} set={x=>s('cool_replace_rec',x)} dis={dis}/></F>
      </div>
    </Acc>

    <Acc title="D \u2014 Domestic Hot Water" open={op.d} toggle={() => t('d')}>
      <div className="jd-field-grid">
        <F l="Fuel"><Pills v={v('dhw_fuel')} opts={['Natural Gas','Electric','Propane']} set={x=>s('dhw_fuel',x)} dis={dis}/></F>
        <F l="Manufacturer"><I k="dhw_mfr"/></F><F l="Age"><I k="dhw_age" type="number"/></F>
        <F l="Condition"><I k="dhw_condition"/></F>
        <F l="System"><Pills v={v('dhw_system')} opts={['On Demand','Storage Tank','Indirect','Heat Pump']} set={x=>s('dhw_system',x)} dis={dis}/></F>
        <F l="Input BTU"><I k="dhw_input_btu" type="number"/></F>
        {['Insulated Pipes','Flue Repair','Replace Rec'].map(x=>{const k='dhw_'+x.toLowerCase().replace(/ /g,'_');
          return <F key={k} l={x}><YN v={v(k)} set={val=>s(k,val)} dis={dis}/></F>;})}
      </div>
    </Acc>

    <Acc title="E \u2014 Interior Inspection" open={op.e} toggle={() => t('e')}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 16px'}}>
        {INT_ITEMS.map(x=>{const k='int_'+x.toLowerCase().replace(/[^a-z]/g,'_');
          return <Chk key={k} l={x} c={bd[k]} set={val=>s(k,val)} dis={dis}/>;})}
      </div>
      <div className="jd-field-grid" style={{marginTop:14}}>
        <F l="Ceiling Condition"><Pills v={v('ceiling_condition')} opts={['Good','Poor']} set={x=>s('ceiling_condition',x)} dis={dis}/></F>
        <F l="Wall Condition"><I k="wall_condition"/></F>
      </div>
    </Acc>

    <Acc title="F \u2014 Doors & Exhaust" open={op.f} toggle={() => t('f')}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 16px'}}>
        {['Front','Back','Basement','Attic'].map(d=>
          <Chk key={d} l={`${d} \u2014 existing weather strips`} c={bd['door_'+d.toLowerCase()]} set={val=>s('door_'+d.toLowerCase(),val)} dis={dis}/>)}
      </div>
      <div className="jd-field-grid" style={{marginTop:14}}>
        <F l="Total Sweeps Needed"><I k="sweeps_needed" type="number"/></F>
        {['Exhaust Fan Replace','Bath Fan w/Light','Vent Kit','Term Cap','Dryer Proper','Dryer Repair'].map(x=>{
          const k=x.toLowerCase().replace(/[^a-z/]/g,'_').replace(/\/+/g,'_');
          return <F key={k} l={x}><YN v={v(k)} set={val=>s(k,val)} dis={dis}/></F>;})}
      </div>
      <div className="jd-field-grid" style={{marginTop:14}}>
        <F l="Blower Door IN"><I k="bd_in" type="number"/>
          {bd.bd_in && <div style={{fontSize:12,fontWeight:600,color:'var(--color-primary)',marginTop:4}}>Post goal: {(Number(bd.bd_in)*1.1).toFixed(0)} CFM</div>}
        </F>
        <F l="Blower Door OUT"><I k="bd_out" type="number"/></F>
      </div>
      <div style={{marginTop:10}}><Chk l="No blower door (asbestos/vermiculite only)" c={bd.no_blower_door} set={val=>s('no_blower_door',val)} dis={dis}/></div>
    </Acc>

    <Acc title="G \u2014 Attic" open={op.g} toggle={() => t('g')}>
      <div className="jd-field-grid">
        <F l="Type"><Pills v={v('attic_type')} opts={['Finished','Unfinished','Flat']} set={x=>s('attic_type',x)} dis={dis}/></F>
        <F l="Sq Ft"><I k="attic_sqft" type="number"/></F><F l="Pre R"><I k="attic_pre_r" type="number"/></F>
        <F l="R to Add"><I k="attic_r_add" type="number"/></F>
        <F l="Ductwork"><YN v={v('attic_ductwork')} set={x=>s('attic_ductwork',x)} dis={dis}/></F>
        <F l="Floor Boards"><YN v={v('attic_floor_boards')} set={x=>s('attic_floor_boards',x)} dis={dis}/></F>
      </div>
      <div style={{display:'flex',gap:16,marginTop:10}}>
        {['Mold','Vermiculite','K&T'].map(x=>{const k='attic_'+x.toLowerCase().replace(/&/,'').replace(/ /g,'');
          return <Chk key={k} l={x} c={bd[k]} set={val=>s(k,val)} dis={dis}/>;})}
      </div>
    </Acc>

    <Acc title="H \u2014 Knee Walls" open={op.h} toggle={() => t('h')}>
      <div className="jd-field-grid">
        <F l="Sq Ft"><I k="knee_sqft" type="number"/></F><F l="Pre R"><I k="knee_pre_r" type="number"/></F>
        <F l="R to Add"><I k="knee_r_add" type="number"/></F>
        <F l="Dense Pack"><YN v={v('knee_dense_pack')} set={x=>s('knee_dense_pack',x)} dis={dis}/></F>
        <F l="Rigid Foam"><YN v={v('knee_rigid_foam')} set={x=>s('knee_rigid_foam',x)} dis={dis}/></F>
      </div>
    </Acc>

    <Acc title="I \u2014 Exterior Walls" open={op.i} toggle={() => t('i')}>
      {['1st','2nd'].map(fl=><div key={fl} style={{marginBottom:fl==='1st'?16:0}}>
        <div style={{fontSize:13,fontWeight:700,color:'var(--color-text-muted)',marginBottom:8}}>{fl} Floor</div>
        <div className="jd-field-grid">
          <F l="Sq Ft"><I k={`ext_wall_${fl}_sqft`} type="number"/></F><F l="Pre R"><I k={`ext_wall_${fl}_pre_r`} type="number"/></F>
          <F l="R to Add"><I k={`ext_wall_${fl}_r_add`} type="number"/></F>
          <F l="Dense Pack"><YN v={v(`ext_wall_${fl}_dense_pack`)} set={x=>s(`ext_wall_${fl}_dense_pack`,x)} dis={dis}/></F>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:10}}>
          {CLAD.map(c=><Chk key={c} l={c} c={(bd[`ext_wall_${fl}_cladding`]||[]).includes(c)}
            set={val=>{const a=bd[`ext_wall_${fl}_cladding`]||[];s(`ext_wall_${fl}_cladding`,val?[...a,c]:a.filter(x=>x!==c));}} dis={dis}/>)}
        </div>
      </div>)}
    </Acc>

    <Acc title="J \u2014 Foundation" open={op.j} toggle={() => t('j')}>
      <div className="jd-field-grid">
        <F l="Type"><Pills v={v('fnd_type')} opts={['None','Basement','Crawlspace']} set={x=>s('fnd_type',x)} dis={dis}/></F>
        <F l="Sq Ft Above"><I k="fnd_sqft_above" type="number"/></F><F l="Sq Ft Below"><I k="fnd_sqft_below" type="number"/></F>
        <F l="Pre R"><I k="fnd_pre_r" type="number"/></F>
        <F l="Band Joist Access"><YN v={v('fnd_band_joist')} set={x=>s('fnd_band_joist',x)} dis={dis}/></F>
        <F l="Band Lin Ft"><I k="fnd_band_linft" type="number"/></F>
      </div>
    </Acc>
  </>);
}

/* ══ MAIN ══ */
export default function JobScope({ job, canEdit, onUpdate, user }) {
  const [scopeData, setScopeData] = useState(job.scope_data || {});
  const [subTab, setSubTab] = useState('Measures');
  const save = d => { setScopeData(d); onUpdate({ scope_data: d }); };
  const bd = scopeData.building || {};
  const setBd = (k, val) => save({ ...scopeData, building: { ...bd, [k]: val } });
  const measures = scopeData.measures || [];
  const afue = bd.btu_in && bd.btu_out ? (Number(bd.btu_out)/Number(bd.btu_in)*100).toFixed(1)+'%' : '\u2014';

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {SUB_TABS.map(t => <button key={t} type="button" style={pill(subTab === t)} onClick={() => setSubTab(t)}>{t}</button>)}
      </div>

      {subTab === 'Measures' && <ScopeMeasureBuilder measures={measures}
        onChange={m => save({ ...scopeData, measures: m })}
        assessmentRecs={job.assessment_data?.weatherization_recommendations || []} canEdit={canEdit} />}

      {subTab === 'Building Data' && <BuildingData bd={bd} s={setBd} dis={!canEdit} />}

      {subTab === 'ASHRAE' && <ScopeASHRAECalc job={job} scopeData={scopeData}
        onChange={d => save({ ...scopeData, ...d })} canEdit={canEdit} />}

      {subTab === 'Summary' && (
        <div className="jd-card">
          <div className="jd-card-title">Scope Summary</div>
          <div className="jd-field-grid">
            {[['Selected Measures', measures.length, { fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }],
              ['Sq Footage', bd.sq_footage || '\u2014'], ['BD IN', bd.bd_in || '\u2014'],
              ['BD OUT', bd.bd_out || '\u2014'], ['AFUE', afue]].map(([l, val, st]) => (
              <div key={l} className="jd-field"><label className="jd-field-label">{l}</label>
                <div style={st || { fontSize: 16, fontWeight: 600 }}>{val}</div></div>))}
          </div>
          <div style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-primary"
              onClick={() => printSOW(generatePreWorkSOW(job, measures, user?.full_name))}>Print Scope</button>
          </div>
        </div>
      )}
    </div>
  );
}
