import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

export default function ITPage({ role }) {
  const [catalog, setCatalog] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [tab, setTab] = useState('assignments');
  const [catalogForm, setCatalogForm] = useState({ name: '', category: 'Laptop', unit_cost: '', description: '' });
  const [assignForm, setAssignForm] = useState({ employee_id: '', equipment_catalog_id: '', serial_number: '', assigned_date: '', assigned_by: '', notes: '' });

  const IT_CATEGORIES = ['Laptop', 'Desktop', 'Monitor', 'Phone', 'Tablet', 'Software License', 'Peripheral', 'Network Equipment', 'Other IT'];

  const load = useCallback(() => {
    api.getCatalog().then(setCatalog).catch(() => {});
    api.getAssignments({ department: 'IT' }).then(setAssignments).catch(() => {});
    api.getEmployees('active').then(setEmployees).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCatalogItem = async (e) => {
    e.preventDefault();
    await api.createCatalogItem({ ...catalogForm, unit_cost: parseFloat(catalogForm.unit_cost) });
    setShowCatalogModal(false);
    setCatalogForm({ name: '', category: 'Laptop', unit_cost: '', description: '' });
    load();
  };

  const assignEquipment = async (e) => {
    e.preventDefault();
    await api.createAssignment({ ...assignForm, department: 'IT' });
    setShowAssignModal(false);
    setAssignForm({ employee_id: '', equipment_catalog_id: '', serial_number: '', assigned_date: '', assigned_by: '', notes: '' });
    load();
  };

  const returnEquipment = async (id) => {
    await api.returnAssignment(id, { returned_date: new Date().toISOString().split('T')[0] });
    load();
  };

  const itCatalog = catalog.filter(c => IT_CATEGORIES.includes(c.category));

  return (
    <div>
      <div className="section-header">
        <h2>IT Equipment Management</h2>
        <div className="btn-group" style={{ margin: 0 }}>
          <button className="btn btn-primary" onClick={() => setShowAssignModal(true)}>+ Assign Equipment</button>
          <button className="btn btn-secondary" onClick={() => setShowCatalogModal(true)}>+ Add to Catalog</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className={`btn btn-sm ${tab === 'assignments' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('assignments')}>Active Assignments</button>
        <button className={`btn btn-sm ${tab === 'catalog' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('catalog')}>Equipment Catalog</button>
      </div>

      {tab === 'assignments' && (
        <div className="card">
          <h3>IT Equipment Assignments</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Employee</th><th>Equipment</th><th>Serial #</th><th>Cost</th><th>Assigned</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id}>
                    <td>{a.first_name} {a.last_name}</td>
                    <td>{a.equipment_name}<br/><small style={{color:'#888'}}>{a.category}</small></td>
                    <td>{a.serial_number || '-'}</td>
                    <td className="money">${a.unit_cost?.toFixed(2)}</td>
                    <td>{a.assigned_date}</td>
                    <td>{a.returned_date ? <span className="badge paid">Returned</span> : <span className="badge active">Active</span>}</td>
                    <td>
                      {!a.returned_date && (
                        <button className="btn btn-sm btn-success" onClick={() => returnEquipment(a.id)}>Return</button>
                      )}
                    </td>
                  </tr>
                ))}
                {assignments.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: '#888', padding: 30 }}>No IT equipment assigned yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'catalog' && (
        <div className="card">
          <h3>IT Equipment Catalog</h3>
          <div className="table-container">
            <table>
              <thead><tr><th>Name</th><th>Category</th><th>Unit Cost</th><th>Description</th></tr></thead>
              <tbody>
                {itCatalog.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.category}</td>
                    <td className="money">${c.unit_cost?.toFixed(2)}</td>
                    <td>{c.description || '-'}</td>
                  </tr>
                ))}
                {itCatalog.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: '#888', padding: 30 }}>No IT catalog items yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Catalog Modal */}
      {showCatalogModal && (
        <div className="modal-overlay" onClick={() => setShowCatalogModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add IT Equipment to Catalog</h3>
            <form onSubmit={addCatalogItem}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Equipment Name *</label>
                  <input required value={catalogForm.name} onChange={e => setCatalogForm({...catalogForm, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select value={catalogForm.category} onChange={e => setCatalogForm({...catalogForm, category: e.target.value})}>
                    {IT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit Cost ($) *</label>
                  <input type="number" step="0.01" required value={catalogForm.unit_cost} onChange={e => setCatalogForm({...catalogForm, unit_cost: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} value={catalogForm.description} onChange={e => setCatalogForm({...catalogForm, description: e.target.value})} />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-success">Add to Catalog</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCatalogModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Assign IT Equipment to Employee</h3>
            <form onSubmit={assignEquipment}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Employee *</label>
                  <select required value={assignForm.employee_id} onChange={e => setAssignForm({...assignForm, employee_id: e.target.value})}>
                    <option value="">Select employee...</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.department})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Equipment *</label>
                  <select required value={assignForm.equipment_catalog_id} onChange={e => setAssignForm({...assignForm, equipment_catalog_id: e.target.value})}>
                    <option value="">Select equipment...</option>
                    {itCatalog.map(c => <option key={c.id} value={c.id}>{c.name} - ${c.unit_cost}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Serial Number</label>
                  <input value={assignForm.serial_number} onChange={e => setAssignForm({...assignForm, serial_number: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Assigned Date *</label>
                  <input type="date" required value={assignForm.assigned_date} onChange={e => setAssignForm({...assignForm, assigned_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Assigned By</label>
                  <input value={assignForm.assigned_by} onChange={e => setAssignForm({...assignForm, assigned_by: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} value={assignForm.notes} onChange={e => setAssignForm({...assignForm, notes: e.target.value})} />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-success">Assign Equipment</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
