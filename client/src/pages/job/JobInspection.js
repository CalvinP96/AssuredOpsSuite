import React, { useState, useEffect, useRef } from 'react';
import { SignaturePad } from '../../components/ui';

const CHECKLIST_ITEMS = [
  'Attic insulation complete',
  'Attic air sealed',
  'Wall insulation complete',
  'Foundation insulation complete',
  'All penetrations sealed',
  'New thermostat installed',
  'Dryer vent repaired',
  'Exhaust fans installed',
  'CO/Smoke detectors installed',
  'Safety issues resolved',
];

const YNA = ['Yes', 'No', 'N/A'];

function Field({ label, value, onChange, disabled, type }) {
  return (
    <div className="jd-field">
      <label className="jd-field-label">{label}</label>
      <input type={type || 'text'} value={value || ''} disabled={disabled}
        onChange={e => onChange(e.target.value)} />
    </div>
  );
}

export default function JobInspection({ job, canEdit, isAdmin, onUpdate, user }) {
  const [form, setForm] = useState(() => {
    const d = job.inspection_data || {};
    return {
      date: d.date || '',
      inspector: d.inspector || '',
      pre_cfm50: d.pre_cfm50 || '',
      post_cfm50: d.post_cfm50 || '',
      duct_pre: d.duct_pre || '',
      duct_post: d.duct_post || '',
      smoke_qty: d.smoke_qty || '',
      co_qty: d.co_qty || '',
      ashrae_cfm: d.ashrae_cfm || '',
      new_fan: d.new_fan || '',
      hs_addressed: d.hs_addressed || '',
      checklist: d.checklist || {},
      inspector_sig: d.inspector_sig || null,
      inspector_printed: d.inspector_printed || '',
      signoff_date: d.signoff_date || '',
    };
  });

  const saveTimer = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onUpdate({ inspection_data: form }), 800);
    return () => clearTimeout(saveTimer.current);
  }, [form]); // eslint-disable-line

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const setCheck = (item, field, value) =>
    setForm(prev => ({ ...prev, checklist: { ...prev.checklist, [item]: { ...(prev.checklist[item] || {}), [field]: value } } }));

  const dis = !canEdit;

  // Auto-calc blower door reduction
  const pre = parseFloat(form.pre_cfm50) || 0;
  const post = parseFloat(form.post_cfm50) || 0;
  const reduction = pre > 0 ? Math.round(((pre - post) / pre) * 100) : null;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* FINAL INSPECTION */}
      <div className="jd-card">
        <div className="jd-card-title">Final Inspection</div>
        <div className="jd-field-grid">
          <Field label="Date" value={form.date} onChange={v => set('date', v)} disabled={dis} type="date" />
          <Field label="Inspector Name" value={form.inspector} onChange={v => set('inspector', v)} disabled={dis} />
        </div>
      </div>

      {/* BLOWER DOOR RESULTS */}
      <div className="jd-card">
        <div className="jd-card-title">Blower Door Results</div>
        <div className="jd-field-grid">
          <Field label="Pre CFM50" value={form.pre_cfm50} onChange={v => set('pre_cfm50', v)} disabled={dis} type="number" />
          <Field label="Post CFM50" value={form.post_cfm50} onChange={v => set('post_cfm50', v)} disabled={dis} type="number" />
          <div className="jd-field">
            <label className="jd-field-label">% Reduction</label>
            <input value={reduction !== null ? reduction + '%' : '—'} disabled
              style={{ background: 'var(--color-surface-alt)', fontWeight: 600, color: reduction > 0 ? 'var(--color-success)' : 'var(--color-text)' }} />
          </div>
        </div>
      </div>

      {/* DUCT LEAKAGE */}
      <div className="jd-card">
        <div className="jd-card-title">Duct Leakage</div>
        <div className="jd-field-grid">
          <Field label="Pre CFM" value={form.duct_pre} onChange={v => set('duct_pre', v)} disabled={dis} type="number" />
          <Field label="Post CFM" value={form.duct_post} onChange={v => set('duct_post', v)} disabled={dis} type="number" />
        </div>
      </div>

      {/* DETECTORS & VENTILATION */}
      <div className="jd-card">
        <div className="jd-card-title">Detectors & Ventilation</div>
        <div className="jd-field-grid">
          <Field label="Smoke Installed Qty" value={form.smoke_qty} onChange={v => set('smoke_qty', v)} disabled={dis} type="number" />
          <Field label="CO Installed Qty" value={form.co_qty} onChange={v => set('co_qty', v)} disabled={dis} type="number" />
          <Field label="ASHRAE Required CFM" value={form.ashrae_cfm} onChange={v => set('ashrae_cfm', v)} disabled={dis} type="number" />
          <div className="jd-field">
            <label className="jd-field-label">New Fan Installed</label>
            <select value={form.new_fan} disabled={dis} onChange={e => set('new_fan', e.target.value)}>
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div className="jd-field">
            <label className="jd-field-label">All H&S Addressed</label>
            <select value={form.hs_addressed} disabled={dis} onChange={e => set('hs_addressed', e.target.value)}>
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* INSPECTION CHECKLIST */}
      <div className="jd-card">
        <div className="jd-card-title">Inspection Checklist</div>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Item</th><th>Result</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {CHECKLIST_ITEMS.map(item => {
                const ck = form.checklist[item] || {};
                return (
                  <tr key={item}>
                    <td style={{ fontSize: 13 }}>{item}</td>
                    <td>
                      <select value={ck.result || ''} disabled={dis}
                        onChange={e => setCheck(item, 'result', e.target.value)}
                        style={{ padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 13 }}>
                        <option value="">—</option>
                        {YNA.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td>
                      <input value={ck.notes || ''} disabled={dis}
                        onChange={e => setCheck(item, 'notes', e.target.value)}
                        placeholder="Notes..." style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FINAL SIGN-OFF */}
      <div className="jd-card">
        <div className="jd-card-title">Final Sign-Off</div>
        <SignaturePad label="Inspector Signature" existingSig={form.inspector_sig}
          readOnly={dis} onSign={v => set('inspector_sig', v)} />
        <div className="jd-field-grid" style={{ marginTop: 12 }}>
          <Field label="Printed Name" value={form.inspector_printed} onChange={v => set('inspector_printed', v)} disabled={dis} />
          <Field label="Date" value={form.signoff_date} onChange={v => set('signoff_date', v)} disabled={dis} type="date" />
        </div>
      </div>

    </div>
  );
}
