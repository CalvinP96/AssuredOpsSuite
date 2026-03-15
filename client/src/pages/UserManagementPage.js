import React, { useState, useEffect, useCallback } from 'react';
import {
  adminListUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeactivateUser,
  adminReactivateUser,
  adminResetPassword
} from '../api';

const ROLE_OPTIONS = ['Admin', 'HR', 'IT', 'Warehouse', 'Finance', 'Operations', 'Program Manager', 'Assessor', 'Scope Creator', 'Installer', 'HVAC'];

const ROLE_COLORS = {
  admin: { bg: '#fee2e2', color: '#991b1b' },
  hr: { bg: '#fce7f3', color: '#9d174d' },
  it: { bg: '#e0e7ff', color: '#3730a3' },
  warehouse: { bg: '#fef3c7', color: '#92400e' },
  finance: { bg: '#d1fae5', color: '#065f46' },
  operations: { bg: '#ccfbf1', color: '#115e59' },
  'program manager': { bg: '#ede9fe', color: '#5b21b6' },
  assessor: { bg: '#dbeafe', color: '#1e40af' },
  'scope creator': { bg: '#e9d5ff', color: '#6b21a8' },
  installer: { bg: '#dcfce7', color: '#166534' },
  hvac: { bg: '#ffedd5', color: '#9a3412' },
};

function RoleBadge({ role }) {
  const key = (role || '').toLowerCase();
  const colors = ROLE_COLORS[key] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'capitalize',
      background: colors.bg,
      color: colors.color,
    }}>
      {role || 'Assessor'}
    </span>
  );
}

function StatusDot({ active }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: active ? '#16a34a' : '#94a3b8',
        display: 'inline-block',
      }} />
      {active ? 'Active' : 'Deactivated'}
    </span>
  );
}

export default function UserManagementPage({ session, user, previewRole, setPreviewRole }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'reset' | null
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'Assessor', department: '' });
  const [resetForm, setResetForm] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminListUsers(session);
      if (data.error) { setError(data.error); return; }
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openAdd = () => {
    setForm({ full_name: '', email: '', password: '', role: 'Assessor', department: '' });
    setShowPassword(false);
    setModal('add');
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ full_name: u.full_name, email: u.email, role: u.role || 'Assessor', department: u.department || '' });
    setModal('edit');
  };

  const openReset = (u) => {
    setEditUser(u);
    setResetForm({ password: '', confirm: '' });
    setShowPassword(false);
    setModal('reset');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) return;
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setSaving(true);
    setError('');
    const res = await adminCreateUser(session, form);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setModal(null);
    loadUsers();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    setError('');
    const res = await adminUpdateUser(session, {
      userId: editUser.id,
      full_name: form.full_name,
      role: form.role,
      department: form.department
    });
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setModal(null);
    loadUsers();
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    if (resetForm.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (resetForm.password !== resetForm.confirm) { setError('Passwords do not match'); return; }
    setSaving(true);
    setError('');
    const res = await adminResetPassword(session, editUser.id, resetForm.password);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setModal(null);
  };

  const handleToggleActive = async (u) => {
    const isActive = !u.banned_until || new Date(u.banned_until) < new Date();
    if (isActive) {
      if (!window.confirm(`Deactivate ${u.full_name || u.email}?`)) return;
      await adminDeactivateUser(session, u.id);
    } else {
      await adminReactivateUser(session, u.id);
    }
    loadUsers();
  };

  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (u.full_name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.role || '').toLowerCase().includes(term) ||
      (u.department || '').toLowerCase().includes(term);
  });

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      {/* Role Preview Dropdown */}
      {setPreviewRole && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
          padding: '12px 16px', background: 'var(--color-surface)', borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)', boxShadow: 'var(--shadow)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>Preview Role:</span>
          <select
            value={previewRole || ''}
            onChange={e => setPreviewRole(e.target.value || null)}
            style={{
              padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-border)',
              fontSize: 13, background: 'var(--color-surface)', color: 'var(--color-text)',
            }}
          >
            <option value="">Admin (yourself)</option>
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {previewRole && (
            <span style={{ fontSize: 12, color: 'var(--color-warning)', fontWeight: 600 }}>
              UI-only preview - does not change actual permissions
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="section-header">
        <h2>User Management</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Add User</button>
      </div>

      {error && (
        <div style={{
          padding: '10px 16px', marginBottom: 16, background: '#fee2e2',
          color: '#991b1b', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 500,
        }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#991b1b' }}>&times;</button>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search users by name, email, role, or department..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%', maxWidth: 400, padding: '10px 12px',
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
            fontSize: 14, background: 'var(--color-surface)', color: 'var(--color-text)',
          }}
        />
      </div>

      {/* User Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Last Sign In</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No users found</td></tr>
              ) : filteredUsers.map(u => {
                const isActive = !u.banned_until || new Date(u.banned_until) < new Date();
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.full_name || '-'}</td>
                    <td>{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>{u.department || '-'}</td>
                    <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{formatDate(u.last_sign_in)}</td>
                    <td><StatusDot active={isActive} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(u)}
                          title="Edit user"
                        >
                          &#9998;
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openReset(u)}
                          title="Reset password"
                        >
                          &#128273;
                        </button>
                        <button
                          className={`btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleActive(u)}
                          title={isActive ? 'Deactivate' : 'Reactivate'}
                          style={{ fontSize: 11, minWidth: 80 }}
                        >
                          {isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {modal === 'add' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add New User</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text" required value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email" required value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Temporary Password * (min 8 characters)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} required minLength={8}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 13,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text" value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create User'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {modal === 'edit' && editUser && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Edit User</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>{editUser.email}</p>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text" required value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text" value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                  />
                </div>
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {modal === 'reset' && editUser && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Reset Password</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              {editUser.full_name} ({editUser.email})
            </p>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>New Password (min 8 characters)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} required minLength={8}
                    value={resetForm.password}
                    onChange={e => setResetForm({ ...resetForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 13,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'} required minLength={8}
                  value={resetForm.confirm}
                  onChange={e => setResetForm({ ...resetForm, confirm: e.target.value })}
                />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
