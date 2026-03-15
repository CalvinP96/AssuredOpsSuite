import React, { useState, useRef, useCallback, useMemo } from 'react';

// ── Constants ported from hes-tracker ──

const FI_SAFETY = [
  { k: 'ambient_co', l: 'Ambient carbon monoxide', r: true, u: 'PPM' },
  { k: 'gas_sniff', l: 'Gas Sniffing — all exposed gas lines', yn: true },
  { k: 'caz_test', l: 'CAZ testing' },
  { k: 'spillage', l: 'Spillage Test', sub: true },
  { k: 'worst_case', l: 'Worst Case Depressurization', sub: true, r: true, u: 'PA' },
  { k: 'oven_co', l: 'Gas oven CO level', r: true, u: 'PPM' },
  { k: 'heat_co', l: 'Heating system CO level', r: true, u: 'PPM' },
  { k: 'wh_co', l: 'Water heater CO level', r: true, u: 'PPM' },
  { k: 'dryer', l: 'Is dryer properly vented to outside?', yn: true },
  { k: 'combust_vent', l: 'Are combustion appliances properly vented to the outside?', yn: true },
];

const FI_INSUL = [
  { k: 'walls', l: 'Walls', q: 'Were walls insulated?' },
  { k: 'attic', l: 'Attic', q: 'Was attic(s) insulated?' },
  { k: 'foundation', l: 'Foundation Walls (Basement/Crawlspace)', q: 'Were walls insulated?' },
  { k: 'rim', l: 'Rim Joist', q: 'Was rim joist insulated?' },
];

const FI_CONTRACTOR_CK = [
  'Upload energy audit document to the Data Collection Tool',
  'Upload invoice to the Data Collection Tool',
  'Upload final inspection form to the Data Collection Tool',
  'Upload project pictures, or link to pictures, to the Data Collection Tool',
];

const QAQC_SECTIONS = {
  'H&S Combustion': ['ASHRAE 62.2 met?', 'Ambient CO within BPI?', 'Oven/range CO within BPI?', 'Heating CO within BPI?', 'WH CO within BPI?', 'Heating spillage OK?', 'WH spillage OK?'],
  'Documentation': ['Pre/post photos uploaded?', 'Pre/post CAZ uploaded?', 'Fan flow rates uploaded?', 'Assessment form uploaded?', 'Post invoice uploaded?'],
  'H&S Misc': ['Vapor barrier per BPI?', 'Exhaust terminations per BPI?', 'Equipment qty matches?', 'Professional install?', 'H&S issues addressed?', 'H&S issues missed?'],
  'Air Sealing': ['Min 20% reduction?', 'Qty matches invoice?', 'Proper thermal boundary?', 'Proper materials?', 'Professional install?', 'Proper measures (can lights, fire dam)?', 'All opps identified?'],
  'Attic Insulation': ['Meets standards?', 'Qty matches?', 'Proper materials?', 'Baffles per BPI?', 'Continuous insulation (hatch)?', 'Proper boundary?', 'All opps identified?'],
  'Foundation Insulation': ['Meets standards?', 'Qty matches?', 'Location matches?', 'Proper materials?', 'Professional install?', 'Proper boundary?', 'All opps?'],
  'Wall Insulation': ['Meets standards?', 'Qty matches?', 'Location matches?', 'Proper type?', 'Professional install?', 'Proper boundary?', 'All opps?'],
  'Thermostats': ['All eligible changed?', 'Smart offered?', 'Programmable offered?', 'Correctly installed?'],
  'Customer Interview': ['Courteous/respectful?', 'Errors addressed timely?', 'Clear communication?', 'Satisfied with install?', 'Satisfied with quality?', 'Satisfied overall?', 'Would recommend?', 'Additional comments?'],
};

// ── Shared inline styles (light theme, CSS vars) ──

const S = {
  sectionTitle: {
    fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
    color: 'var(--color-text-muted)', paddingBottom: 10, marginBottom: 16,
    borderBottom: '1px solid var(--color-border)',
  },
  inp: {
    width: '100%', height: 36, padding: '6px 10px',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    fontSize: 14, background: 'var(--color-surface)', color: 'var(--color-text)',
  },
  ta: {
    width: '100%', padding: '10px 12px', fontSize: 13,
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    background: 'var(--color-surface)', color: 'var(--color-text)',
    minHeight: 60, resize: 'vertical',
  },
  fl: {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: 'var(--color-text-muted)', textTransform: 'uppercase',
    letterSpacing: '0.3px', marginBottom: 4,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 14,
  },
  row: {
    borderBottom: '1px solid var(--color-border)', padding: '8px 0',
  },
};

// ── Reusable sub-components ──

function BtnGrp({ value, onChange, opts, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {opts.map(opt => (
        <button key={opt.v} type="button" disabled={disabled}
          onClick={() => onChange(value === opt.v ? '' : opt.v)}
          style={{
            padding: '4px 10px', borderRadius: 'var(--radius)', fontSize: 11, fontWeight: 600,
            cursor: disabled ? 'default' : 'pointer',
            border: value === opt.v
              ? `1px solid ${opt.c}`
              : '1px solid var(--color-border)',
            background: value === opt.v
              ? (opt.c === '#22c55e' || opt.c === '#16a34a' ? '#dcfce7'
                : opt.c === '#ef4444' || opt.c === '#dc2626' ? '#fee2e2'
                : opt.c === '#f59e0b' ? '#fef3c7' : '#f1f5f9')
              : 'var(--color-surface)',
            color: value === opt.v
              ? (opt.c === '#22c55e' || opt.c === '#16a34a' ? '#166534'
                : opt.c === '#ef4444' || opt.c === '#dc2626' ? '#991b1b'
                : opt.c === '#f59e0b' ? '#92400e' : '#475569')
              : 'var(--color-text-muted)',
          }}>
          {opt.l}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="jd-card">
      <div className="jd-card-title">{title}</div>
      {children}
    </div>
  );
}

function FieldGroup({ children }) {
  return <div style={S.grid}>{children}</div>;
}

function Field({ label, value, onChange, type, num, suffix, computed, disabled }) {
  if (computed !== undefined) {
    return (
      <div className="jd-field">
        <label className="jd-field-label">{label}</label>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', padding: '6px 0' }}>{computed}</div>
      </div>
    );
  }
  return (
    <div className="jd-field">
      <label className="jd-field-label">{label}{suffix ? ` (${suffix})` : ''}</label>
      <input
        type={type || (num ? 'number' : 'text')}
        className="jd-date-input"
        style={{ cursor: 'text' }}
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function Sel({ label, value, onChange, opts, disabled }) {
  return (
    <div className="jd-field">
      <label className="jd-field-label">{label}</label>
      <select className="jd-date-input" value={value} disabled={disabled}
        onChange={e => onChange(e.target.value)}>
        <option value="">— Select —</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function CK({ checked, onChange, label, disabled }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0',
      cursor: disabled ? 'default' : 'pointer', fontSize: 13,
    }}>
      <input type="checkbox" checked={!!checked} disabled={disabled}
        style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
        onChange={() => onChange(!checked)} />
      <span style={{ color: 'var(--color-text)' }}>{label}</span>
    </label>
  );
}

function SigPad({ label, value, onChange, disabled }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  const startDraw = useCallback((e) => {
    if (disabled) return;
    setDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [disabled]);

  const draw = useCallback((e) => {
    if (!drawing || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [drawing, disabled]);

  const endDraw = useCallback(() => {
    if (!drawing) return;
    setDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL());
  }, [drawing, onChange]);

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onChange('');
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <label className="jd-field-label">{label}</label>
      {value ? (
        <div style={{ position: 'relative' }}>
          <img src={value} alt="Signature" style={{
            width: '100%', maxWidth: 400, height: 80, objectFit: 'contain',
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
            background: '#fff',
          }} />
          {!disabled && (
            <button type="button" onClick={clear} style={{
              position: 'absolute', top: 4, right: 4,
              padding: '2px 8px', fontSize: 11, fontWeight: 600,
              background: 'var(--color-danger)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer',
            }}>Clear</button>
          )}
        </div>
      ) : (
        <div>
          <canvas ref={canvasRef} width={400} height={80}
            style={{
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
              background: '#fff', cursor: disabled ? 'default' : 'crosshair',
              touchAction: 'none', width: '100%', maxWidth: 400,
            }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
          />
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Draw signature above
          </p>
        </div>
      )}
    </div>
  );
}

// ── Parse helper ──
function getData(job) {
  try { return JSON.parse(job.qaqc_data || '{}'); } catch { return {}; }
}

// ══════════════════════════════════════════════════════════════
// InspectionTab — complete port of QAQCTab from HES tracker
// ══════════════════════════════════════════════════════════════

export default function InspectionTab({ job, canEdit, onUpdate, user }) {
  const data = useMemo(() => getData(job), [job.qaqc_data]);

  // Top-level QAQC data
  const q = data;
  const uq = (k, v) => onUpdate('qaqc_data', JSON.stringify({ ...q, [k]: v }));

  // Final inspection sub-object
  const fi = q.fi || {};
  const ufi = (k, v) => uq('fi', { ...fi, [k]: v });

  // QAQC section results
  const sr = (cat, idx, f, v) => {
    const key = `${cat}-${idx}`;
    uq('results', { ...(q.results || {}), [key]: { ...(q.results?.[key] || {}), [f]: v } });
  };

  // ── PFRow: Pass/Fail row for Health & Safety items ──
  const PFRow = ({ item }) => {
    const d = fi[item.k] || {};
    const ud = (f, v) => ufi(item.k, { ...d, [f]: v });
    return (
      <div style={S.row}>
        <div style={{
          fontSize: 13, marginBottom: 6,
          ...(item.sub
            ? { paddingLeft: 12, fontWeight: 400, color: 'var(--color-text-muted)' }
            : { fontWeight: 600, color: 'var(--color-text)' }),
        }}>{item.l}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {item.r && (
            <input style={{ ...S.inp, width: 80, fontSize: 12, padding: '6px 8px' }}
              value={d.reading || ''} disabled={!canEdit}
              onChange={e => ud('reading', e.target.value)}
              placeholder={item.u || ''} />
          )}
          {item.yn && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 8, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Result</span>
              <BtnGrp value={d.yn || ''} onChange={v => ud('yn', v)} disabled={!canEdit}
                opts={[{ v: 'Y', l: 'Yes', c: '#22c55e' }, { v: 'N', l: 'No', c: '#ef4444' }, { v: 'NA', l: 'N/A', c: '#64748b' }]} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 8, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Pass/Fail</span>
            <BtnGrp value={d.pf || ''} onChange={v => ud('pf', v)} disabled={!canEdit}
              opts={[{ v: 'P', l: 'Pass', c: '#22c55e' }, { v: 'F', l: 'Fail', c: '#ef4444' }, { v: 'NA', l: 'N/A', c: '#64748b' }]} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 8, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Follow-up</span>
            <BtnGrp value={d.fu || ''} onChange={v => ud('fu', v)} disabled={!canEdit}
              opts={[{ v: 'Y', l: 'Yes', c: '#f59e0b' }, { v: 'N', l: 'No', c: '#64748b' }, { v: 'NA', l: 'N/A', c: '#475569' }]} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* ── FINAL INSPECTION FORM ── */}
      <Section title="Home Energy Savings — Retrofits Final Inspection Form">
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>Appendix F</p>
      </Section>

      {/* ── INSPECTION INFO ── */}
      <Section title="Inspection Info">
        <FieldGroup>
          <Field label="Homeowner Name" computed={job.customer_name || job.customerName || '—'} />
          <Field label="Home Address" computed={job.address || '—'} />
        </FieldGroup>
        <FieldGroup>
          <Field label="Date of Final Inspection" value={fi.date || ''} onChange={v => ufi('date', v)} type="date" disabled={!canEdit} />
          <Field label="Installation Contractor" value={fi.contractor || 'Assured Energy Solutions'} onChange={v => ufi('contractor', v)} disabled={!canEdit} />
        </FieldGroup>
        <SigPad label="Customer Signature" value={fi.custSig || ''} onChange={v => ufi('custSig', v)} disabled={!canEdit} />
      </Section>

      {/* ── INSTALLATION CONTRACTOR CHECKLIST ── */}
      <Section title="Installation Contractor Checklist">
        <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: 0 }}>Complete all sections below</p>
      </Section>

      {/* ── HEALTH & SAFETY ── */}
      <Section title="Health & Safety">
        {FI_SAFETY.map(item => <PFRow key={item.k} item={item} />)}

        <div style={{ marginTop: 10, borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
          <FieldGroup>
            <Field label="# Smoke Detectors Installed" value={fi.smokeQty || ''} onChange={v => ufi('smokeQty', v)} num disabled={!canEdit} />
            <Field label="# CO Detectors Installed" value={fi.coQty || ''} onChange={v => ufi('coQty', v)} num disabled={!canEdit} />
          </FieldGroup>
          <FieldGroup>
            <Field label="Required Ventilation Rate (ASHRAE 62.2)" value={fi.ventCFM || ''} onChange={v => ufi('ventCFM', v)} num suffix="CFM" disabled={!canEdit} />
            <Sel label="New Exhaust Fan Installed?" value={fi.newFan || ''} onChange={v => ufi('newFan', v)} opts={['Yes', 'No']} disabled={!canEdit} />
          </FieldGroup>
          <div style={{ marginTop: 8 }}>
            <Sel label="Were all H&S issues addressed at home?" value={fi.hsAddressed || ''} onChange={v => ufi('hsAddressed', v)} opts={['Yes', 'No']} disabled={!canEdit} />
            {fi.hsAddressed === 'No' && (
              <div style={{ marginTop: 6 }}>
                <label style={S.fl}>If no, why not:</label>
                <textarea style={S.ta} value={fi.hsWhyNot || ''} disabled={!canEdit}
                  onChange={e => ufi('hsWhyNot', e.target.value)} rows={2} />
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ── INSULATION ── */}
      <Section title="Insulation">
        {FI_INSUL.map(ins => {
          const d = fi[ins.k] || {};
          const ud = (f, v) => ufi(ins.k, { ...d, [f]: v });
          return (
            <div key={ins.k} style={S.row}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>{ins.l}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                <Field label="Pre R-value" value={d.preR || ''} onChange={v => ud('preR', v)} num disabled={!canEdit} />
                <Field label="Post R-value" value={d.postR || ''} onChange={v => ud('postR', v)} num disabled={!canEdit} />
                <Sel label={ins.q} value={d.done || ''} onChange={v => ud('done', v)} opts={['Yes', 'No']} disabled={!canEdit} />
              </div>
            </div>
          );
        })}
      </Section>

      {/* ── SPACE HEATING & DHW ── */}
      <Section title="Combustion Appliances (not including oven/stove) — Space Heating and DHW">
        {[1, 2, 3].map(n => {
          const d = fi[`equip${n}`] || {};
          const ud = (f, v) => ufi(`equip${n}`, { ...d, [f]: v });
          return (
            <div key={n} style={S.row}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>Equipment {n}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <Field label="Equipment Type" value={d.type || ''} onChange={v => ud('type', v)} disabled={!canEdit} />
                <Sel label="Vent Type" value={d.vent || ''} onChange={v => ud('vent', v)} opts={['Natural Draft', 'Sealed']} disabled={!canEdit} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
                <Sel label="Replaced?" value={d.replaced || ''} onChange={v => ud('replaced', v)} opts={['Yes', 'No']} disabled={!canEdit} />
                <Sel label="Follow-up needed?" value={d.fu || ''} onChange={v => ud('fu', v)} opts={['Yes', 'No']} disabled={!canEdit} />
              </div>
            </div>
          );
        })}
      </Section>

      {/* ── BLOWER DOOR ── */}
      <Section title="Blower Door">
        <FieldGroup>
          <Field label="Pre CFM50" computed={job.pre_cfm50 || job.preCFM50 || '—'} />
          <Field label="Post CFM50" computed={job.post_cfm50 || job.postCFM50 || '—'} />
        </FieldGroup>
      </Section>

      {/* ── DIRECT INSTALLS ── */}
      <Section title="Direct Installs">
        <Sel label="Was a new thermostat installed?" value={fi.thermostat || ''} onChange={v => ufi('thermostat', v)} opts={['Yes', 'No']} disabled={!canEdit} />
      </Section>

      {/* ── FOLLOW-UP ── */}
      <Section title="Follow-up Needed">
        <CK checked={fi.followUpNA} onChange={v => ufi('followUpNA', v)} label="N/A" disabled={!canEdit} />
        {!fi.followUpNA && (
          <textarea style={{ ...S.ta, marginTop: 6 }} value={fi.followUp || ''} disabled={!canEdit}
            onChange={e => ufi('followUp', e.target.value)} rows={3}
            placeholder="Please list any follow-up needed for this customer's home…" />
        )}
      </Section>

      {/* ── CONTRACTOR CHECKLIST ── */}
      <Section title="Contractor Checklist">
        <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 6, fontStyle: 'italic' }}>To be completed by the contractor:</p>
        {FI_CONTRACTOR_CK.map(ck => (
          <CK key={ck} checked={fi.ck?.[ck]} disabled={!canEdit}
            onChange={v => ufi('ck', { ...(fi.ck || {}), [ck]: v })} label={ck} />
        ))}
      </Section>

      {/* ── INSPECTOR SIGNATURE ── */}
      <Section title="Inspector Sign-off">
        <SigPad label="Inspector Signature" value={fi.inspectorSig || ''} onChange={v => ufi('inspectorSig', v)} disabled={!canEdit} />
      </Section>

      {/* ── QAQC OBSERVATION FORM (Appendix G) ── */}
      <Section title="QAQC Observation Form">
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>Per Appendix G — post-installation observation</p>
      </Section>

      <Section title="Observation Info">
        <FieldGroup>
          <Field label="Date" value={q.date || ''} onChange={v => uq('date', v)} type="date" disabled={!canEdit} />
          <Field label="Inspector" value={q.inspector || ''} onChange={v => uq('inspector', v)} disabled={!canEdit} />
        </FieldGroup>
        <div style={{ marginTop: 6 }}>
          <CK checked={q.scheduled} onChange={v => uq('scheduled', v)} label="QAQC Scheduled" disabled={!canEdit} />
        </div>
      </Section>

      {Object.entries(QAQC_SECTIONS).map(([cat, items]) => (
        <Section key={cat} title={cat}>
          {items.map((item, i) => {
            const r = q.results?.[`${cat}-${i}`] || {};
            return (
              <div key={i} style={S.row}>
                <div style={{ fontSize: 13, color: 'var(--color-text)', marginBottom: 6 }}>{i + 1}. {item}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <BtnGrp value={r.v || ''} onChange={v => sr(cat, i, 'v', v)} disabled={!canEdit}
                    opts={[{ v: 'Y', l: 'Yes', c: '#22c55e' }, { v: 'N', l: 'No', c: '#ef4444' }, { v: 'NA', l: 'N/A', c: '#64748b' }]} />
                  <input style={{ ...S.inp, flex: 1, fontSize: 11, minWidth: 0 }}
                    value={r.c || ''} disabled={!canEdit}
                    onChange={e => sr(cat, i, 'c', e.target.value)}
                    placeholder="Comment…" />
                </div>
              </div>
            );
          })}
        </Section>
      ))}

      <Section title="Overall Result">
        <Sel label="Result" value={q.passed === true ? 'pass' : q.passed === false ? 'fail' : ''}
          onChange={v => uq('passed', v === 'pass' ? true : v === 'fail' ? false : null)}
          opts={['pass', 'fail']} disabled={!canEdit} />
        <textarea style={{ ...S.ta, marginTop: 8 }} value={q.notes || ''} disabled={!canEdit}
          onChange={e => uq('notes', e.target.value)} rows={3} placeholder="Overall notes…" />
        <SigPad label="QAQC Inspector Signature" value={q.inspectorSig || ''} onChange={v => uq('inspectorSig', v)} disabled={!canEdit} />
      </Section>
    </div>
  );
}
