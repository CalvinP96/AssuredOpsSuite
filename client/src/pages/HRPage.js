import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';

const DEPARTMENTS = ['IT', 'Warehouse', 'HR', 'Finance', 'Operations', 'Sales', 'HVAC', 'Insulation', 'Support'];

export default function HRPage({ role }) {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showTerminate, setShowTerminate] = useState(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', department: 'IT', position: '', hire_date: '', notes: ''
  });
  const navigate = useNavigate();

  const load = useCallback(() => {
    const status = filter !== 'all' ? filter : undefined;
    api.getEmployees(status).then(setEmployees).catch(() => {});
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleHire = async (e) => {
    e.preventDefault();
    await api.createEmployee(form);
    setShowModal(false);
    setForm({ first_name: '', last_name: '', email: '', phone: '', department: 'IT', position: '', hire_date: '', notes: '' });
    load();
  };

  const handleTerminate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await api.terminateEmployee(showTerminate.id, {
      termination_date: formData.get('termination_date'),
      notes: formData.get('notes')
    });
    setShowTerminate(null);
    load();
  };

  return (
    <div>
      <div className="section-header">
        <h2>HR - Employee Management</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Hire New Employee</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
          {['all', 'active', 'terminated'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Department</th><th>Position</th><th>Hire Date</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td><strong>{emp.first_name} {emp.last_name}</strong><br/><small style={{color:'#888'}}>{emp.email}</small></td>
                  <td>{emp.department}</td>
                  <td>{emp.position}</td>
                  <td>{emp.hire_date}</td>
                  <td><span className={`badge ${emp.status}`}>{emp.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/employee/${emp.id}`)}>View</button>
                      {emp.status === 'active' && (
                        <button className="btn btn-sm btn-danger" onClick={() => setShowTerminate(emp)}>Terminate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#888', padding: 30 }}>No employees found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hire Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Hire New Employee</h3>
            <form onSubmit={handleHire}>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name *</label>
                  <input required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Department *</label>
                  <select required value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Position *</label>
                  <input required value={form.position} onChange={e => setForm({...form, position: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Hire Date *</label>
                  <input type="date" required value={form.hire_date} onChange={e => setForm({...form, hire_date: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-success">Hire Employee</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terminate Modal */}
      {showTerminate && (
        <div className="modal-overlay" onClick={() => setShowTerminate(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Terminate Employee: {showTerminate.first_name} {showTerminate.last_name}</h3>
            <p style={{ color: '#e94560', marginBottom: 15 }}>
              This will mark the employee as terminated and generate an equipment billing report.
            </p>
            <form onSubmit={handleTerminate}>
              <div className="form-group">
                <label>Termination Date *</label>
                <input type="date" name="termination_date" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label>Reason / Notes</label>
                <textarea name="notes" rows={3} />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-danger">Confirm Termination</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTerminate(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
