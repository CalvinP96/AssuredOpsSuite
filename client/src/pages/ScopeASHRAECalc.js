import React from 'react';

// ═══ Program constants for ASHRAE ═══
const PROGRAM = {
  airSealGoal: 25,
  airSealMinCFM50pct: 1.1,
  fanMinCFM: 15,
};

// ═══ UI Helpers (light theme) ═══
const Sec = ({ title, children }) => (
  <div className="jd-card">
    <div className="jd-card-title">{title}</div>
    {children}
  </div>
);

export default function ScopeASHRAECalc({ job, scopeData, onChange, canEdit }) {
  const s = scopeData || {};
  const a = job?.audit || {};

  // Helper: update ashrae sub-object and call onChange with full scopeData
  const sn = (key, value) => {
    const updated = { ...s.ashrae, [key]: value };
    onChange({ ...s, ashrae: updated });
  };

  const baseSqft = Number(job?.sqft) || 0;
  const finBasement = s.fnd?.type === 'Finished' ? (Number(s.fnd?.aboveSqft) || 0) + (Number(s.fnd?.belowSqft) || 0) : 0;
  const Afl = baseSqft + finBasement;
  const Nbr = Number(s.bedrooms) || 0;
  const preQ50 = Number(job?.preCFM50) || 0;
  const sqft = Number(job?.sqft) || 0;
  const canAirSeal = s.ashrae?.canAirSeal !== undefined ? s.ashrae.canAirSeal : (preQ50 > 0 && sqft > 0 && preQ50 >= sqft * PROGRAM.airSealMinCFM50pct);
  const Q50 = canAirSeal ? Math.round(preQ50 * (1 - PROGRAM.airSealGoal / 100)) : preQ50;
  const st = Number(job?.stories) || 1;
  const H = st >= 2 ? 16 : st >= 1.5 ? 14 : 8;
  const Hr = 8.202;
  const wsf = 0.56;

  // Fan flows from assessment, overridable
  // Raw values to check presence (blank = no fan = no requirement)
  const kRaw = s.ashrae?.kitchenCFM ?? a.kitchenFan ?? '';
  const b1Raw = s.ashrae?.bath1CFM ?? a.bathFan1 ?? '';
  const b2Raw = s.ashrae?.bath2CFM ?? a.bathFan2 ?? '';
  const b3Raw = s.ashrae?.bath3CFM ?? a.bathFan3 ?? '';
  const kPresent = String(kRaw).trim() !== '';
  const b1Present = String(b1Raw).trim() !== '';
  const b2Present = String(b2Raw).trim() !== '';
  const b3Present = String(b3Raw).trim() !== '';
  const kCFM = Number(kRaw) || 0;
  const b1 = Number(b1Raw) || 0;
  const b2 = Number(b2Raw) || 0;
  const b3 = Number(b3Raw) || 0;
  const kWin = s.ashrae?.kWin || false;
  const b1Win = s.ashrae?.b1Win || false;
  const b2Win = s.ashrae?.b2Win || false;
  const b3Win = s.ashrae?.b3Win || false;

  /* ══ ASHRAE 62.2-2016 CALCULATIONS ══
     Section 4.1.1 — Total Required Ventilation Rate
     Qtot = 0.03 × Afl + 7.5 × (Nbr + 1)
     (Nbr = number of bedrooms, Nocc = Nbr + 1)

     Infiltration Credit
     Qinf = 0.052 × Q50 × wsf × (H / 8.2)^0.4

     Local Ventilation — Alternative Compliance:
     Intermittent exhaust rates: Kitchen 100 CFM, Bath 50 CFM
     Deficit = max(0, required - measured). Window = 20 CFM credit.
     Blank = no fan = no requirement.
     Alternative compliance supplement = totalDeficit × 0.25
     (converts intermittent deficit to continuous equivalent)

     Qfan = Qtot + supplement - Qinf
  */

  // Infiltration credit
  const Qinf_eff = Q50 > 0 ? 0.052 * Q50 * wsf * Math.pow(H / 8.2, 0.4) : 0;

  // Qtot (Eq 4.1a)
  const Qtot = (Afl > 0) ? 0.03 * Afl + 7.5 * (Nbr + 1) : 0;

  // Local ventilation deficits — Alternative Compliance
  // Intermittent rates: Kitchen 100 CFM, Bath 50 CFM
  // Window = 20 CFM credit. Blank = no fan = no requirement.
  const kReq = kPresent ? 100 : 0;
  const b1Req = b1Present ? 50 : 0;
  const b2Req = b2Present ? 50 : 0;
  const b3Req = b3Present ? 50 : 0;
  const kDef = !kPresent ? 0 : Math.max(0, kReq - (kWin ? 20 : kCFM));
  const b1Def = !b1Present ? 0 : Math.max(0, b1Req - (b1Win ? 20 : b1));
  const b2Def = !b2Present ? 0 : Math.max(0, b2Req - (b2Win ? 20 : b2));
  const b3Def = !b3Present ? 0 : Math.max(0, b3Req - (b3Win ? 20 : b3));
  const totalDef = kDef + b1Def + b2Def + b3Def;

  // Alternative compliance supplement (intermittent → continuous: ×0.25)
  const supplement = totalDef * 0.25;

  // Infiltration credit — existing: FULL credit
  const Qinf_credit = Qinf_eff;

  // Required mechanical ventilation rate
  const Qfan = Qtot + supplement - Qinf_credit;

  // Fan setting selector (continuous run: 50 / 80 / 110 CFM)
  const FAN_SETTINGS = [50, 80, 110];
  const recFan = FAN_SETTINGS.find(f => f >= Qfan) || FAN_SETTINGS[FAN_SETTINGS.length - 1];

  const R = v => Math.round(v * 100) / 100;
  const Ri = v => Math.round(v);

  // Styles — light theme using CSS vars
  const hdr = { fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', margin: '14px 0 6px', borderBottom: '1px solid var(--color-border)', paddingBottom: 4 };
  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: 12, borderBottom: '1px solid var(--color-border)' };
  const lbl = { color: 'var(--color-text-muted)', flex: 1 };
  const val = { fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--color-text)', textAlign: 'right' };
  const eq = { fontSize: 10, color: 'var(--color-text-muted)', padding: '1px 0 5px 12px', fontFamily: "'JetBrains Mono', monospace", borderLeft: '2px solid var(--color-border)' };
  const autoBox = { background: 'var(--color-surface-alt)', borderRadius: 6, padding: '6px 10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 13, color: 'var(--color-text)', textAlign: 'center', border: '1px solid var(--color-border)' };
  const autoSub = { fontSize: 9, color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 2 };
  const resultBox = { background: 'var(--color-surface-alt)', border: '2px solid var(--color-border)', borderRadius: 8, padding: 12, marginTop: 8 };
  const solverBox = { background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 10, marginTop: 10 };
  const inp = { height: 36, padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 12, background: 'var(--color-surface)', color: 'var(--color-text)', textAlign: 'center', width: '100%' };

  return (
    <Sec title="ASHRAE 62.2-2016 Ventilation">
      <div>
        {/* ══ CONFIGURATION ══ */}
        <div style={hdr}>Configuration</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px', fontSize: 12 }}>
          <div style={row}><span style={lbl}>Construction</span><span style={val}>Existing</span></div>
          <div style={row}><span style={lbl}>Dwelling unit</span><span style={val}>Detached</span></div>
          <div style={row}><span style={lbl}>Infiltration credit</span><span style={val}>Yes</span></div>
          <div style={row}><span style={lbl}>Alt. compliance</span><span style={val}>Yes</span></div>
          <div style={row}><span style={lbl}>Weather station</span><span style={val}>Chicago Midway AP</span></div>
          <div style={row}><span style={lbl}>wsf [1/hr]</span><span style={{ ...val, color: 'var(--color-primary)' }}>{wsf}</span></div>
        </div>

        {/* ══ BUILDING INPUTS ══ */}
        <div style={hdr}>Building Inputs</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
          <div><div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 3 }}>Floor area [ft²]</div><div style={autoBox}>{Afl || '—'}</div><div style={autoSub}>{finBasement > 0 ? `${baseSqft} + ${finBasement} fin. bsmt` : '← Sq Footage'}</div></div>
          <div><div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 3 }}>Nocc (occupants)</div><div style={autoBox}>{Nbr + 1}</div><div style={autoSub}>{Nbr} bedrooms + 1 = {Nbr + 1}</div></div>
          <div><div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 3 }}>Height [ft]</div><div style={autoBox}>{H}</div><div style={autoSub}>{st >= 2 ? '2-story' : '1' + (st >= 1.5 ? '.5' : '') + '-story'}</div></div>
          <div><div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 3 }}>Q50 [CFM] — est. post</div><div style={{ ...autoBox, color: canAirSeal ? 'var(--color-warning)' : 'var(--color-text)' }}>{Q50 || '—'}</div><div style={autoSub}>{canAirSeal ? `${preQ50} × 0.75 (25% reduction)` : `${preQ50} (no air seal)`}</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, color: canAirSeal ? 'var(--color-warning)' : 'var(--color-text-muted)', cursor: 'pointer', justifyContent: 'center' }}>
              <input type="checkbox" checked={!!canAirSeal} disabled={!canEdit} onChange={e => sn('canAirSeal', e.target.checked)} style={{ accentColor: 'var(--color-primary)', width: 13, height: 13 }} />
              Air seal eligible
            </label>
          </div>
        </div>

        {/* ══ LOCAL VENTILATION ══ */}
        <div style={hdr}>Local Ventilation — Alternative Compliance</div>
        <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginBottom: 2 }}>Blank = no fan = no requirement. Openable window = 20 CFM credit. Kitchen: 100 CFM · Bath: 50 CFM (intermittent rates)</div>
        <div style={{ fontSize: 9, color: 'var(--color-warning)', marginBottom: 6 }}>If a fan is present but not operational or CFM is unknown, enter 0.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 50px 55px', gap: '2px 6px', fontSize: 11, alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}></span>
          <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center' }}>Fan Flow [CFM]</span>
          <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center', fontSize: 9 }}>Window</span>
          <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center' }}>Req'd</span>
          <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center' }}>Deficit</span>
        </div>
        {[
          { n: 'Kitchen', v: kCFM, k: 'kitchenCFM', ak: 'kitchenFan', w: kWin, wk: 'kWin', r: kReq, d: kDef, present: kPresent },
          { n: 'Bath #1', v: b1, k: 'bath1CFM', ak: 'bathFan1', w: b1Win, wk: 'b1Win', r: b1Req, d: b1Def, present: b1Present },
          { n: 'Bath #2', v: b2, k: 'bath2CFM', ak: 'bathFan2', w: b2Win, wk: 'b2Win', r: b2Req, d: b2Def, present: b2Present },
          { n: 'Bath #3', v: b3, k: 'bath3CFM', ak: 'bathFan3', w: b3Win, wk: 'b3Win', r: b3Req, d: b3Def, present: b3Present },
        ].map(f => (
          <div key={f.n} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 50px 55px', gap: '2px 6px', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text)' }}>{f.n}</span>
            <input style={inp} value={s.ashrae?.[f.k] ?? a[f.ak] ?? ''} disabled={!canEdit} onChange={e => sn(f.k, e.target.value)} placeholder="blank = none" />
            <div style={{ textAlign: 'center' }}><input type="checkbox" checked={f.w} disabled={!canEdit} onChange={e => sn(f.wk, e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} /></div>
            <div style={{ textAlign: 'center', fontSize: 11, color: f.present ? 'var(--color-text-muted)' : '#ccc' }}>{f.present ? f.r : '—'}</div>
            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: !f.present ? '#ccc' : f.d > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>{f.present ? f.d : '—'}</div>
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 50px 55px', gap: '2px 6px', borderTop: '1px solid var(--color-border)', paddingTop: 4, marginTop: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>Total</span>
          <span></span><span></span><span></span>
          <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: totalDef > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>{Ri(totalDef)}</div>
        </div>

        {/* ══ RESULTS ══ */}
        <div style={resultBox}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>Dwelling-Unit Ventilation Results</div>
          <div style={{ fontSize: 9, color: canAirSeal ? 'var(--color-warning)' : 'var(--color-text-muted)', marginBottom: 8 }}>Using {canAirSeal ? `estimated post Q50: ${preQ50} × 0.75 = ${Q50} CFM` : `pre-work Q50: ${preQ50} CFM (no air seal)`}</div>

          <div style={row}><span style={lbl}>Infiltration credit, Qinf [CFM]</span><span style={val}>{R(Qinf_eff)}</span></div>
          <div style={eq}>= 0.052 × Q50 × wsf × (H / 8.2)^0.4<br />= 0.052 × {Q50} × {wsf} × ({H} / 8.2)^0.4</div>

          <div style={row}><span style={lbl}>Total required ventilation rate, Qtot [CFM]</span><span style={val}>{R(Qtot)}</span></div>
          <div style={eq}>= 0.03 × Afl + 7.5 × (Nbr + 1)<br />= 0.03 × {Afl} + 7.5 × ({Nbr} + 1)<br />= {R(0.03 * Afl)} + {R(7.5 * (Nbr + 1))}</div>

          <div style={row}><span style={lbl}>Total local ventilation deficit [CFM]</span><span style={val}>{Ri(totalDef)}</span></div>
          <div style={eq}>= Σ max(0, req − measured) per fan<br />Kitchen {kReq} − {kCFM} = {kDef} · Bath1 {b1Req} − {b1} = {b1Def} · Bath2 {b2Req} − {b2} = {b2Def} · Bath3 {b3Req} − {b3} = {b3Def}</div>

          <div style={row}><span style={lbl}>Alternative compliance supplement [CFM]</span><span style={val}>{R(supplement)}</span></div>
          <div style={eq}>= totalDeficit × 0.25 (intermittent → continuous)<br />= {Ri(totalDef)} × 0.25</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 4px', borderTop: '2px solid var(--color-primary)', marginTop: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: 13 }}>Required mech. ventilation, Qfan [CFM]</span>
            <span style={{ fontWeight: 800, color: Qfan < PROGRAM.fanMinCFM ? 'var(--color-success)' : 'var(--color-primary)', fontSize: 18, fontFamily: "'JetBrains Mono', monospace" }}>{R(Qfan)}</span>
          </div>
          <div style={eq}>= Qtot + supplement − Qinf<br />= {R(Qtot)} + {R(supplement)} − {R(Qinf_credit)}</div>
          {Qfan < PROGRAM.fanMinCFM && <div style={{ marginTop: 6, padding: '8px 12px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, fontSize: 12, color: '#166534', fontWeight: 600 }}>Qfan below {PROGRAM.fanMinCFM} CFM — no mechanical ventilation fan required</div>}
        </div>

        {/* ══ DWELLING-UNIT VENTILATION RUN-TIME SOLVER ══ */}
        {Qfan >= PROGRAM.fanMinCFM && <div style={solverBox}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 6 }}>Dwelling-Unit Ventilation Run-Time Solver</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 8 }}>Select fan setting. Recommended = lowest setting ≥ Qfan ({R(Qfan)} CFM). All fans run continuous.</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {FAN_SETTINGS.map(cfm => {
              const meets = cfm >= Qfan && Qfan > 0;
              const isRec = cfm === recFan && Qfan > 0;
              const sel = Number(s.ashrae?.fanSetting) === cfm;
              return <button key={cfm} type="button" disabled={!canEdit} onClick={() => sn('fanSetting', cfm)} style={{
                flex: 1, padding: '10px 8px', borderRadius: 8, cursor: canEdit ? 'pointer' : 'default', fontFamily: 'inherit',
                border: sel ? `2px solid ${isRec ? 'var(--color-success)' : 'var(--color-primary)'}` : `1px solid ${meets ? '#86efac' : 'var(--color-border)'}`,
                background: sel ? (isRec ? '#dcfce7' : '#eff6ff') : 'var(--color-surface)',
                color: sel ? (isRec ? 'var(--color-success)' : 'var(--color-primary)') : meets ? 'var(--color-success)' : 'var(--color-text-muted)', textAlign: 'center'
              }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{cfm}</div>
                <div style={{ fontSize: 10 }}>CFM</div>
                {isRec && <div style={{ fontSize: 9, marginTop: 2, color: 'var(--color-success)', fontWeight: 600 }}>REC</div>}
                {!meets && Qfan > 0 && <div style={{ fontSize: 9, marginTop: 2, color: 'var(--color-danger)' }}>Below Qfan</div>}
              </button>;
            })}
          </div>
          {Number(s.ashrae?.fanSetting) > 0 && Qfan > 0 && (() => {
            const fan = Number(s.ashrae.fanSetting);
            const minPerHr = R(Qfan / fan * 60);
            return <div style={{ background: 'var(--color-surface)', borderRadius: 8, padding: 10, border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--color-text)' }}>Fan capacity</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{fan} CFM</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--color-text)' }}>Min. run-time per hour</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{minPerHr} min/hr</span>
              </div>
              <div style={eq}>= Qfan ÷ fan capacity × 60<br />= {R(Qfan)} ÷ {fan} × 60 = {minPerHr} min/hr</div>
              <div style={{ marginTop: 6, fontSize: 10, color: fan >= Qfan ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 600 }}>
                {fan >= Qfan ? `Continuous (60 min/hr) exceeds minimum ${minPerHr} min/hr` : 'Fan setting below Qfan — does not meet requirement'}
              </div>
            </div>;
          })()}
        </div>}

        <p style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 10, textAlign: 'right' }}>ASHRAE 62.2-2016 · Local Ventilation Alternative Compliance · basc.pnnl.gov/redcalc</p>
      </div>
    </Sec>
  );
}
