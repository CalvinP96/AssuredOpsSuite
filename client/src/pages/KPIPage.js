import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

const CATEGORIES = ['Revenue', 'Operations', 'Customer', 'Employee', 'Safety', 'Quality', 'Efficiency'];
const DEPARTMENTS = ['IT', 'Warehouse', 'HR', 'Finance', 'Operations', 'Sales', 'HVAC', 'Insulation', 'Support', 'Company-Wide'];

export default function KPIPage({ role }) {
  const [kpis, setKpis] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editKpi, setEditKpi] = useState(null);
  const [filterDept, setFilterDept] = useState('');
  const [form, setForm] = useState({
    name: '', category: 'Operations', target_value: '', current_value: '', unit: '', department: 'Company-Wide', period: 'Monthly', notes: ''
  });

  const load = useCallback(() => {
    const filters = filterDept ? { department: filterDept } : {};
    api.getKpis(filters).then(setKpis).catch(() => {});
  }, [filterDept]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        target_value: parseFloat(form.target_value) || 0,
        current_value: parseFloat(form.current_value) || 0
      };

      if (editKpi) {
        await api.updateKpi(editKpi.id, payload);
      } else {
        await api.createKpi(payload);
      }
      closeModal();
      load();
    } catch (err) { alert('Failed to save KPI: ' + err.message); }
  };

  const handleDeleteKpi = async (id) => {
    if (!window.confirm('Delete this KPI?')) return;
    try {
      await api.deleteKpi(id);
      load();
    } catch (err) { alert('Failed to delete KPI: ' + err.message); }
  };

  const openEdit = (kpi) => {
    setEditKpi(kpi);
    setForm({
      name: kpi.name, category: kpi.category, target_value: kpi.target_value || '',
      current_value: kpi.current_value || '', unit: kpi.unit || '', department: kpi.department || 'Company-Wide',
      period: kpi.period || 'Monthly', notes: kpi.notes || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditKpi(null);
    setForm({ name: '', category: 'Operations', target_value: '', current_value: '', unit: '', department: 'Company-Wide', period: 'Monthly', notes: '' });
  };

  const getProgress = (kpi) => {
    if (!kpi.target_value) return 0;
    return Math.min(100, Math.round((kpi.current_value / kpi.target_value) * 100));
  };

  const canEdit = role === 'Admin' || role === 'Operations';

  return (
    <div>
      <div className="section-header">
        <h2>KPI Management</h2>
        {canEdit && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New KPI</button>}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${filterDept === '' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterDept('')}>All</button>
        {DEPARTMENTS.map(d => (
          <button key={d} className={`btn btn-sm ${filterDept === d ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterDept(d)}>{d}</button>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>KPI Name</th><th>Category</th><th>Department</th><th>Target</th><th>Current</th><th>Progress</th><th>Status</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {kpis.map(kpi => (
                <tr key={kpi.id}>
                  <td><strong>{kpi.name}</strong><br/><small style={{color:'#888'}}>{kpi.period}</small></td>
                  <td>{kpi.category}</td>
                  <td>{kpi.department}</td>
                  <td>{kpi.target_value} {kpi.unit}</td>
                  <td><strong>{kpi.current_value}</strong> {kpi.unit}</td>
                  <td>
                    <div style={{ background: '#eee', borderRadius: 10, height: 20, width: 100 }}>
                      <div style={{
                        background: getProgress(kpi) >= 90 ? '#27ae60' : getProgress(kpi) >= 70 ? '#f39c12' : '#e94560',
                        borderRadius: 10, height: 20, width: `${getProgress(kpi)}%`, transition: 'width 0.3s'
                      }} />
                    </div>
                    <small>{getProgress(kpi)}%</small>
                  </td>
                  <td><span className={`badge ${kpi.status}`}>{kpi.status?.replace('_', ' ')}</span></td>
                  {canEdit && (
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(kpi)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteKpi(kpi.id)}>Del</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {kpis.length === 0 && (
                <tr><td colSpan={canEdit ? 8 : 7} style={{ textAlign: 'center', color: '#888', padding: 30 }}>No KPIs yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editKpi ? 'Edit KPI' : 'Create New KPI'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>KPI Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Period</label>
                  <select value={form.period} onChange={e => setForm({...form, period: e.target.value})}>
                    {['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Value</label>
                  <input type="number" step="0.01" value={form.target_value} onChange={e => setForm({...form, target_value: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Current Value</label>
                  <input type="number" step="0.01" value={form.current_value} onChange={e => setForm({...form, current_value: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Unit (e.g., %, $, units)</label>
                  <input value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-success">{editKpi ? 'Update KPI' : 'Create KPI'}</button>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
