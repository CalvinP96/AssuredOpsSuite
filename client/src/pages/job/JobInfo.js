import React, { useState, useEffect, useRef } from 'react';
import { UTILITIES } from '../../constants';

export default function JobInfo({ job, canEdit, isAdmin, onUpdate, onDelete }) {
  const [form, setForm] = useState({
    customer_name: job.customer_name || '',
    address: job.address || '',
    city: job.city || '',
    state: job.state || '',
    zip: job.zip || '',
    phone: job.phone || '',
    email: job.email || '',
    rise_id: job.rise_id || '',
    st_id: job.st_id || '',
    utility: job.utility || '',
    flagged: !!job.flagged,
    flag_reason: job.flag_reason || '',
    notes: job.notes || '',
  });
  const [confirmDel, setConfirmDel] = useState(false);
  const saveTimer = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onUpdate(form), 800);
    return () => clearTimeout(saveTimer.current);
  }, [form]); // eslint-disable-line

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* CUSTOMER */}
      <div className="jd-card">
        <div className="jd-card-title">Customer</div>
        <div className="jd-field-grid">
          <div className="jd-field">
            <label className="jd-field-label">Name</label>
            <input value={form.customer_name} disabled={!canEdit}
              onChange={e => set('customer_name', e.target.value)} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Address</label>
            <input value={form.address} disabled={!canEdit}
              onChange={e => set('address', e.target.value)} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">City</label>
            <input value={form.city} disabled={!canEdit}
              onChange={e => set('city', e.target.value)} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">State</label>
            <input value={form.state} disabled={!canEdit}
              onChange={e => set('state', e.target.value)} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Zip</label>
            <input value={form.zip} disabled={!canEdit}
              onChange={e => set('zip', e.target.value)} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Phone</label>
            <input value={form.phone} disabled={!canEdit}
              onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Email</label>
            <input value={form.email} disabled={!canEdit}
              onChange={e => set('email', e.target.value)} />
          </div>
        </div>
      </div>

      {/* SYSTEM IDs */}
      <div className="jd-card">
        <div className="jd-card-title">System IDs</div>
        <div className="jd-field-grid">
          <div className="jd-field">
            <label className="jd-field-label">RISE PID</label>
            <input value={form.rise_id} disabled={!canEdit}
              onChange={e => set('rise_id', e.target.value)} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">ServiceTitan ID</label>
            <input value={form.st_id} disabled={!canEdit}
              onChange={e => set('st_id', e.target.value)} />
          </div>
          <div className="jd-field">
            <label className="jd-field-label">Utility</label>
            <select value={form.utility} disabled={!canEdit}
              onChange={e => set('utility', e.target.value)}>
              <option value="">Select utility...</option>
              {UTILITIES.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* FLAGS & NOTES */}
      <div className="jd-card">
        <div className="jd-card-title">Flags & Notes</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: canEdit ? 'pointer' : 'default' }}>
          <input type="checkbox" checked={form.flagged} disabled={!canEdit}
            onChange={e => set('flagged', e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
          <span>Flag this project</span>
        </label>
        {form.flagged && (
          <div className="jd-field" style={{ marginTop: 6 }}>
            <label className="jd-field-label">Reason</label>
            <input value={form.flag_reason} disabled={!canEdit}
              onChange={e => set('flag_reason', e.target.value)} />
          </div>
        )}
        <div className="jd-field" style={{ marginTop: 8 }}>
          <label className="jd-field-label">Notes</label>
          <textarea value={form.notes} disabled={!canEdit}
            onChange={e => set('notes', e.target.value)} rows={3} />
        </div>
      </div>

      {/* DANGER ZONE */}
      {isAdmin && (
        <div className="jd-card" style={{ borderColor: '#fca5a5' }}>
          <div className="jd-card-title" style={{ color: '#dc2626' }}>Danger Zone</div>
          {!confirmDel ? (
            <button className="btn btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444' }}
              onClick={() => setConfirmDel(true)}>Delete Project</button>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn btn-danger" onClick={onDelete}>Confirm Delete</button>
              <button className="btn btn-secondary" onClick={() => setConfirmDel(false)}>Cancel</button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
