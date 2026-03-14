import React, { useState } from 'react';
import * as api from '../api';

// ── HVAC Brands & Condition Options (from hes-tracker constants) ──
const HVAC_BRANDS = [
  '', 'Amana', 'American Standard', 'Armstrong', 'Bryant', 'Carrier', 'Coleman',
  'Comfortmaker', 'Daikin', 'Day & Night', 'Ducane', 'Frigidaire', 'Goodman',
  'Heil', 'Keeprite', 'Lennox', 'Luxaire', 'Maytag', 'Mitsubishi', 'Nordyne',
  'Payne', 'Rheem', 'Ruud', 'Tempstar', 'Trane', 'York', 'Other'
];

const WATER_HEATER_BRANDS = [
  '', 'A.O. Smith', 'Bradford White', 'Rheem', 'State', 'Kenmore', 'Rinnai', 'Navien', 'Noritz', 'Other'
];

const CONDITION_OPTS = [
  '', 'Excellent', 'Good', 'Fair', 'Poor — needs repair', 'Failed — needs replacement'
];

const REFRIGERANT_OPTS = ['', 'R-410A', 'R-22', 'R-407C', 'R-134a', 'Unknown'];

const REPLACEMENT_PRIORITY = ['', 'Urgent — safety issue', 'Soon — failing equipment', 'Planned — end of life', 'Customer request'];
const REPLACEMENT_TYPE = ['', 'Furnace only', 'A/C only', 'Furnace + A/C', 'Water heater only', 'Full system'];

const SYSTEM_FINDINGS = [
  'All systems operating — good condition', 'Furnace needs replacement', 'A/C needs replacement',
  'Water heater needs replacement', 'Minor repairs needed — see notes', 'Safety concern identified',
  'Follow-up visit required', 'Customer declined recommended repairs', 'Parts on order'
];

// ── Section Component ──
function Section({ title, children }) {
  return (
    <div className="jd-card">
      <div className="jd-card-title">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type, disabled, placeholder, options }) {
  if (options) {
    return (
      <div className="jd-field">
        <label className="jd-field-label">{label}</label>
        <select className="jd-date-input" value={value || ''} disabled={disabled}
          onChange={e => onChange(e.target.value)}>
          {options.map(o => <option key={o} value={o}>{o || '— Select —'}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div className="jd-field">
      <label className="jd-field-label">{label}</label>
      <input
        type={type || 'text'}
        className="jd-date-input"
        style={{ cursor: 'text' }}
        value={value || ''}
        disabled={disabled}
        placeholder={placeholder || ''}
        onChange={e => onChange(e.target.value)}
      />
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
            padding: '5px 12px', borderRadius: 'var(--radius)', fontSize: 12, cursor: disabled ? 'default' : 'pointer',
            border: has ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
            background: has ? 'rgba(37,99,235,0.08)' : 'var(--color-surface)',
            color: has ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: has ? 600 : 400
          }}>
            {has ? '✓ ' : ''}{tag}
          </button>
        );
      })}
    </div>
  );
}

export default function HVACTab({ job, program, canEdit, onUpdate, user }) {
  const hvacRecords = job.hvac_replacements || [];
  const [editing, setEditing] = useState(null); // hvac record id being edited
  const [form, setForm] = useState({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({});
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'Admin';

  // ── Save HVAC record ──
  const saveHvac = async (hvacId, data) => {
    try {
      setSaving(true);
      await api.updateHvac(hvacId, data);
      onUpdate('_reload');
      setEditing(null);
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const createHvac = async () => {
    try {
      setSaving(true);
      await api.createHvac(job.id, {
        equipment_type: newForm.equipment_type || 'Furnace',
        existing_make: newForm.existing_make || '',
        existing_model: newForm.existing_model || '',
        existing_serial: newForm.existing_serial || '',
        existing_age: newForm.existing_age || null,
        existing_condition: newForm.existing_condition || '',
        existing_efficiency: newForm.existing_efficiency || '',
        existing_btu: newForm.existing_btu || '',
        decision_tree_result: newForm.decision_tree_result || '',
        approval_status: 'pending',
        notes: newForm.notes || '',
        tune_clean_date: newForm.tune_clean_date || null,
        tune_clean_tech: newForm.tune_clean_tech || '',
        combustion_test: newForm.combustion_test || '',
        new_make: newForm.new_make || '',
        new_model: newForm.new_model || '',
        new_serial: newForm.new_serial || '',
        new_efficiency: newForm.new_efficiency || '',
        replacement_priority: newForm.replacement_priority || '',
        replacement_type: newForm.replacement_type || '',
        system_findings: newForm.system_findings || ''
      });
      setShowNew(false);
      setNewForm({});
      onUpdate('_reload');
    } catch (err) {
      alert('Create failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (hvac) => {
    setEditing(hvac.id);
    setForm({ ...hvac });
  };

  return (
    <div>
      {/* ── Scheduling ── */}
      <Section title="HVAC Schedule">
        <div className="jd-schedule-grid" style={{ marginBottom: 12 }}>
          {[
            { label: 'Tune & Clean Date', field: 'hvac_tune_clean_date' },
            { label: 'Replacement Date', field: 'hvac_replacement_date' },
          ].map(d => (
            <div key={d.field} className="jd-field">
              <label className="jd-field-label">{d.label}</label>
              <input type="date" className="jd-date-input" value={job[d.field] || ''} disabled={!canEdit}
                onChange={e => onUpdate(d.field, e.target.value)} />
            </div>
          ))}
        </div>
      </Section>

      {/* ── HVAC Records ── */}
      {hvacRecords.map(hvac => {
        const isEditing = editing === hvac.id;
        const f = isEditing ? form : hvac;
        const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

        return (
          <Section key={hvac.id} title={`${hvac.equipment_type || 'Equipment'} Record`}>
            {/* Status badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span className={`badge ${hvac.approval_status === 'approved' ? 'active' : 'pending'}`}>
                {hvac.approval_status || 'pending'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {!isEditing && canEdit && (
                  <button className="btn btn-secondary btn-sm" onClick={() => startEdit(hvac)}>Edit</button>
                )}
                {isEditing && (
                  <>
                    <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => saveHvac(hvac.id, form)}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                  </>
                )}
              </div>
            </div>

            {/* ── Existing Equipment ── */}
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
              Existing Equipment Details
            </h4>
            <div className="jd-field-grid">
              <Field label="Equipment Type" value={f.equipment_type} disabled={!isEditing}
                options={['Furnace', 'Air Conditioner', 'Water Heater', 'Heat Pump', 'Boiler']}
                onChange={v => set('equipment_type', v)} />
              <Field label="Make" value={f.existing_make} disabled={!isEditing}
                options={f.equipment_type === 'Water Heater' ? WATER_HEATER_BRANDS : HVAC_BRANDS}
                onChange={v => set('existing_make', v)} />
              <Field label="Model" value={f.existing_model} disabled={!isEditing}
                onChange={v => set('existing_model', v)} placeholder="Model #" />
              <Field label="Serial #" value={f.existing_serial} disabled={!isEditing}
                onChange={v => set('existing_serial', v)} placeholder="Serial #" />
              <Field label="Age (years)" value={f.existing_age} disabled={!isEditing} type="number"
                onChange={v => set('existing_age', v)} />
              <Field label="Condition" value={f.existing_condition} disabled={!isEditing}
                options={CONDITION_OPTS} onChange={v => set('existing_condition', v)} />
              <Field label="Efficiency (AFUE/SEER)" value={f.existing_efficiency} disabled={!isEditing}
                onChange={v => set('existing_efficiency', v)} placeholder="e.g. 80% AFUE" />
              <Field label="BTU Rating" value={f.existing_btu} disabled={!isEditing}
                onChange={v => set('existing_btu', v)} placeholder="BTU" />
            </div>

            {/* Age warning */}
            {Number(f.existing_age) >= 15 && (
              <div style={{
                padding: '8px 12px', marginTop: 10, borderRadius: 'var(--radius)',
                background: '#fef3c7', border: '1px solid #fde68a', fontSize: 12, color: '#92400e'
              }}>
                Equipment is {f.existing_age}+ years old — document thoroughly and consider replacement.
              </div>
            )}

            {/* ── Tune & Clean ── */}
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: '20px 0 10px' }}>
              Tune & Clean Record
            </h4>
            <div className="jd-field-grid">
              <Field label="Date Completed" value={f.tune_clean_date} disabled={!isEditing} type="date"
                onChange={v => set('tune_clean_date', v)} />
              <Field label="Technician" value={f.tune_clean_tech} disabled={!isEditing}
                onChange={v => set('tune_clean_tech', v)} placeholder="Tech name" />
            </div>

            {/* ── Combustion Safety ── */}
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: '20px 0 10px' }}>
              Combustion Safety Test Results
            </h4>
            <div className="jd-field-grid">
              <Field label="Combustion Test Result" value={f.combustion_test} disabled={!isEditing}
                onChange={v => set('combustion_test', v)} placeholder="Pass/Fail + readings" />
              {f.equipment_type !== 'Air Conditioner' && (
                <>
                  <Field label="CO Reading (ppm)" value={f.co_reading} disabled={!isEditing} type="number"
                    onChange={v => set('co_reading', v)} />
                  <Field label="Draft Reading" value={f.draft_reading} disabled={!isEditing}
                    onChange={v => set('draft_reading', v)} placeholder="Pa or WC" />
                  <Field label="Spillage Test" value={f.spillage_test} disabled={!isEditing}
                    options={['', 'Pass', 'Fail', 'N/A']} onChange={v => set('spillage_test', v)} />
                </>
              )}
              {(f.equipment_type === 'Air Conditioner' || f.equipment_type === 'Heat Pump') && (
                <>
                  <Field label="Refrigerant Type" value={f.refrigerant_type} disabled={!isEditing}
                    options={REFRIGERANT_OPTS} onChange={v => set('refrigerant_type', v)} />
                  <Field label="Suction PSI" value={f.suction_psi} disabled={!isEditing} type="number"
                    onChange={v => set('suction_psi', v)} />
                  <Field label="Discharge PSI" value={f.discharge_psi} disabled={!isEditing} type="number"
                    onChange={v => set('discharge_psi', v)} />
                </>
              )}
            </div>

            {f.refrigerant_type === 'R-22' && (
              <div style={{
                padding: '8px 12px', marginTop: 10, borderRadius: 'var(--radius)',
                background: '#fee2e2', border: '1px solid #fecaca', fontSize: 12, color: '#991b1b'
              }}>
                R-22 is phased out — if system needs refrigerant charge, recommend replacement to R-410A system.
              </div>
            )}

            {/* ── Replacement Workflow ── */}
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: '20px 0 10px' }}>
              Replacement Workflow
            </h4>
            <div className="jd-field-grid">
              <Field label="Decision Tree Result" value={f.decision_tree_result} disabled={!isEditing}
                options={['', 'Replace — age/efficiency', 'Replace — safety', 'Replace — customer request',
                  'Repair — still serviceable', 'No action needed', 'Manual J required']}
                onChange={v => set('decision_tree_result', v)} />
              <Field label="Replacement Priority" value={f.replacement_priority} disabled={!isEditing}
                options={REPLACEMENT_PRIORITY} onChange={v => set('replacement_priority', v)} />
              <Field label="Replacement Type" value={f.replacement_type} disabled={!isEditing}
                options={REPLACEMENT_TYPE} onChange={v => set('replacement_type', v)} />
              <Field label="Manual J Load (BTU)" value={f.manual_j_load} disabled={!isEditing}
                onChange={v => set('manual_j_load', v)} placeholder="Manual J heating load" />
            </div>

            {/* System Findings Tags */}
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: '20px 0 10px' }}>
              System Assessment & Findings
            </h4>
            <TagSelector
              tags={SYSTEM_FINDINGS}
              selected={f.system_findings || ''}
              disabled={!isEditing}
              onChange={v => set('system_findings', v)}
            />

            {/* ── New Equipment (Post-Install) ── */}
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: '20px 0 10px' }}>
              New Equipment (Post-Install)
            </h4>
            <div className="jd-field-grid">
              <Field label="New Make" value={f.new_make} disabled={!isEditing}
                options={f.equipment_type === 'Water Heater' ? WATER_HEATER_BRANDS : HVAC_BRANDS}
                onChange={v => set('new_make', v)} />
              <Field label="New Model" value={f.new_model} disabled={!isEditing}
                onChange={v => set('new_model', v)} placeholder="New model #" />
              <Field label="New Serial #" value={f.new_serial} disabled={!isEditing}
                onChange={v => set('new_serial', v)} placeholder="New serial #" />
              <Field label="New Efficiency" value={f.new_efficiency} disabled={!isEditing}
                onChange={v => set('new_efficiency', v)} placeholder="e.g. 96% AFUE" />
            </div>

            {/* Notes */}
            <div style={{ marginTop: 14 }}>
              <label className="jd-field-label">Notes</label>
              <textarea style={{
                width: '100%', padding: '10px 12px', fontSize: 13,
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
                background: 'var(--color-surface)', color: 'var(--color-text)',
                minHeight: 60, resize: 'vertical'
              }}
                value={f.notes || ''}
                disabled={!isEditing}
                onChange={e => set('notes', e.target.value)}
                placeholder="Additional notes, observations..."
              />
            </div>

            {/* Admin approval for replacement */}
            {hvac.approval_status === 'pending' && isAdmin && (
              <div style={{
                marginTop: 14, padding: 14, background: '#fef3c7', borderRadius: 'var(--radius)',
                border: '1px solid #fde68a'
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>
                  Replacement Approval Required
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-success btn-sm" style={{ flex: 1 }}
                    onClick={() => saveHvac(hvac.id, { ...hvac, approval_status: 'approved' })}>
                    Approve Replacement
                  </button>
                  <button className="btn btn-danger btn-sm" style={{ flex: 1 }}
                    onClick={() => saveHvac(hvac.id, { ...hvac, approval_status: 'denied' })}>
                    Deny
                  </button>
                </div>
              </div>
            )}
          </Section>
        );
      })}

      {/* ── No records yet ── */}
      {hvacRecords.length === 0 && !showNew && (
        <div className="jd-card">
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
            No HVAC records yet.
          </p>
        </div>
      )}

      {/* ── Add New HVAC Record ── */}
      {showNew && (
        <Section title="New HVAC Record">
          <div className="jd-field-grid">
            <Field label="Equipment Type" value={newForm.equipment_type}
              options={['Furnace', 'Air Conditioner', 'Water Heater', 'Heat Pump', 'Boiler']}
              onChange={v => setNewForm(p => ({ ...p, equipment_type: v }))} />
            <Field label="Make" value={newForm.existing_make}
              options={newForm.equipment_type === 'Water Heater' ? WATER_HEATER_BRANDS : HVAC_BRANDS}
              onChange={v => setNewForm(p => ({ ...p, existing_make: v }))} />
            <Field label="Model" value={newForm.existing_model} placeholder="Model #"
              onChange={v => setNewForm(p => ({ ...p, existing_model: v }))} />
            <Field label="Serial #" value={newForm.existing_serial} placeholder="Serial #"
              onChange={v => setNewForm(p => ({ ...p, existing_serial: v }))} />
            <Field label="Age (years)" value={newForm.existing_age} type="number"
              onChange={v => setNewForm(p => ({ ...p, existing_age: v }))} />
            <Field label="Condition" value={newForm.existing_condition}
              options={CONDITION_OPTS}
              onChange={v => setNewForm(p => ({ ...p, existing_condition: v }))} />
            <Field label="Efficiency" value={newForm.existing_efficiency} placeholder="e.g. 80% AFUE"
              onChange={v => setNewForm(p => ({ ...p, existing_efficiency: v }))} />
            <Field label="BTU" value={newForm.existing_btu} placeholder="BTU"
              onChange={v => setNewForm(p => ({ ...p, existing_btu: v }))} />
          </div>
          <div style={{ marginTop: 10 }}>
            <label className="jd-field-label">Notes</label>
            <textarea style={{
              width: '100%', padding: '10px 12px', fontSize: 13,
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              minHeight: 50, resize: 'vertical'
            }}
              value={newForm.notes || ''}
              onChange={e => setNewForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Notes..."
            />
          </div>
          <div className="btn-group">
            <button className="btn btn-primary" disabled={saving} onClick={createHvac}>
              {saving ? 'Saving...' : 'Create Record'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setShowNew(false); setNewForm({}); }}>
              Cancel
            </button>
          </div>
        </Section>
      )}

      {/* Add button */}
      {canEdit && !showNew && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            + Add HVAC Record
          </button>
        </div>
      )}
    </div>
  );
}
