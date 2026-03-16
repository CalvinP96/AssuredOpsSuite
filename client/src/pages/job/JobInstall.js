import React, { useState, useEffect, useRef } from 'react';
import { filterSections } from './photoSectionsData';
import PhotoChecklist from './PhotoChecklist';

const POST_SECTIONS = filterSections('post');

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

function Check({ label, checked, onChange, disabled }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: disabled ? 'default' : 'pointer', marginBottom: 6 }}>
      <input type="checkbox" checked={!!checked} disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
      <span>{label}</span>
    </label>
  );
}

const CO_STATUSES = ['Pending Review', 'Approved', 'Denied'];

export default function JobInstall({ job, canEdit, isAdmin, onUpdate, user }) {
  const [form, setForm] = useState(() => {
    const d = job.install_data || {};
    return {
      install_date: d.install_date || '',
      crew_lead: d.crew_lead || '',
      crew_members: d.crew_members || '',
      pre_sow_signed: !!d.pre_sow_signed,
      measures: d.measures || [],
      change_orders: d.change_orders || [],
      post_blower_door: d.post_blower_door || '',
      post_sow_signed: !!d.post_sow_signed,
    };
  });
  const [coDesc, setCoDesc] = useState('');
  const saveTimer = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onUpdate({ install_data: form }), 800);
    return () => clearTimeout(saveTimer.current);
  }, [form]); // eslint-disable-line

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Sync measures from scope
  const scopeMeasures = job.scope_data?.measures || [];

  // Build measure checklist from scope, merging with saved install state
  const getMeasureState = (idx) => form.measures[idx] || {};
  const setMeasure = (idx, field, value) => {
    setForm(prev => {
      const next = [...prev.measures];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, measures: next };
    });
  };

  const addCO = () => {
    if (!coDesc.trim()) return;
    const co = {
      id: Date.now().toString(36),
      description: coDesc.trim(),
      status: 'Pending Review',
      submitted_by: user,
      submitted_at: new Date().toISOString(),
    };
    set('change_orders', [...form.change_orders, co]);
    setCoDesc('');
  };

  const updateCO = (id, fields) => {
    set('change_orders', form.change_orders.map(c => c.id === id ? { ...c, ...fields } : c));
  };

  const dis = !canEdit;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* INSTALL SCHEDULING */}
      <div className="jd-card">
        <div className="jd-card-title">Install Scheduling</div>
        <div className="jd-field-grid">
          <Field label="Install Date" value={form.install_date} onChange={v => set('install_date', v)} disabled={dis} type="date" />
          <Field label="Crew Lead" value={form.crew_lead} onChange={v => set('crew_lead', v)} disabled={dis} />
        </div>
        <div className="jd-field" style={{ marginTop: 12 }}>
          <label className="jd-field-label">Crew Members</label>
          <textarea value={form.crew_members} disabled={dis}
            onChange={e => set('crew_members', e.target.value)} rows={2}
            placeholder="List crew members..." />
        </div>
      </div>

      {/* PRE-WORK AUTHORIZATION */}
      <div className="jd-card">
        <div className="jd-card-title">Pre-Work Authorization</div>
        <Check label="Customer has signed Pre-Work SOW" checked={form.pre_sow_signed}
          onChange={v => set('pre_sow_signed', v)} disabled={dis} />
        {!form.pre_sow_signed && canEdit && (
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}
            onClick={() => {
              console.log('[SOW] Generate Pre-Work SOW for', job.customer_name);
              window.alert('Pre-Work SOW generation placeholder — will open printable SOW.');
            }}>Get Signature</button>
        )}
      </div>

      {/* MEASURE CHECKLIST */}
      <div className="jd-card">
        <div className="jd-card-title">Measure Checklist</div>
        {scopeMeasures.length === 0 ? (
          <p className="empty-text">No measures in scope yet.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Measure</th><th>Qty</th><th>Unit</th><th>Installed</th><th>Notes</th><th></th>
                </tr>
              </thead>
              <tbody>
                {scopeMeasures.map((m, i) => {
                  const ms = getMeasureState(i);
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{m.name || m}</td>
                      <td>{m.qty || '—'}</td>
                      <td>{m.unit || '—'}</td>
                      <td>
                        <input type="checkbox" checked={!!ms.installed} disabled={dis}
                          onChange={e => setMeasure(i, 'installed', e.target.checked)}
                          style={{ width: 18, height: 18, accentColor: 'var(--color-success)' }} />
                      </td>
                      <td>
                        <input value={ms.notes || ''} disabled={dis}
                          onChange={e => setMeasure(i, 'notes', e.target.value)}
                          placeholder="Notes..." style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
                      </td>
                      <td>
                        {m.photos_required && (
                          <span className="badge pending" style={{ fontSize: 10 }}>Photos req.</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CHANGE ORDERS */}
      <div className="jd-card">
        <div className="jd-card-title">Change Orders</div>
        {form.change_orders.map(co => (
          <div key={co.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 13, marginBottom: 4 }}>{co.description}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
              <span className={`badge ${co.status === 'Approved' ? 'active' : co.status === 'Denied' ? 'terminated' : 'pending'}`}>
                {co.status}
              </span>
              <span>by {co.submitted_by} — {new Date(co.submitted_at).toLocaleDateString()}</span>
            </div>
            {isAdmin && co.status === 'Pending Review' && (
              <div className="btn-group" style={{ marginTop: 8 }}>
                <button className="btn btn-success btn-sm" onClick={() => updateCO(co.id, { status: 'Approved' })}>Approve</button>
                <button className="btn btn-danger btn-sm" onClick={() => updateCO(co.id, { status: 'Denied' })}>Deny</button>
              </div>
            )}
          </div>
        ))}
        {canEdit && (
          <div style={{ marginTop: 12 }}>
            <div className="jd-field">
              <label className="jd-field-label">New Change Order</label>
              <textarea value={coDesc} onChange={e => setCoDesc(e.target.value)} rows={2}
                placeholder="Describe the change order..." />
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}
              disabled={!coDesc.trim()} onClick={addCO}>Submit Change Order</button>
          </div>
        )}
      </div>

      {/* POST-WORK */}
      <div className="jd-card">
        <div className="jd-card-title">Post-Work</div>
        <div className="jd-field-grid">
          <Field label="Blower Door Post (CFM50)" value={form.post_blower_door}
            onChange={v => set('post_blower_door', v)} disabled={dis} type="number" />
        </div>
        <div style={{ marginTop: 12 }}>
          <Check label="Post-Work SOW Signed" checked={form.post_sow_signed}
            onChange={v => set('post_sow_signed', v)} disabled={dis} />
        </div>
      </div>

      {/* ─── Post-Install Photo Checklist ─── */}
      <PhotoChecklist sections={POST_SECTIONS} job={job} canEdit={canEdit} user={user} />

    </div>
  );
}
