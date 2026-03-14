import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api';

export default function EmployeeDetail({ role }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [costSummary, setCostSummary] = useState(null);

  useEffect(() => {
    api.getEmployee(id).then(setEmployee).catch(() => {});
    api.getCostSummary(id).then(setCostSummary).catch(() => {});
  }, [id]);

  if (!employee) return <div className="card"><p>Loading...</p></div>;

  return (
    <div>
      <div className="section-header">
        <h2>{employee.first_name} {employee.last_name}</h2>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 18 }}>{employee.department}</div>
          <div className="stat-label">Department</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 18 }}>{employee.position}</div>
          <div className="stat-label">Position</div>
        </div>
        <div className={`stat-card ${employee.status === 'active' ? 'green' : 'red'}`}>
          <div className="stat-value" style={{ fontSize: 18 }}>{employee.status}</div>
          <div className="stat-label">Status</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-value" style={{ fontSize: 18 }}>{employee.hire_date}</div>
          <div className="stat-label">Hire Date</div>
        </div>
      </div>

      <div className="card">
        <h3>Contact Info</h3>
        <p><strong>Email:</strong> {employee.email || 'N/A'}</p>
        <p><strong>Phone:</strong> {employee.phone || 'N/A'}</p>
        {employee.termination_date && <p><strong>Termination Date:</strong> {employee.termination_date}</p>}
        {employee.notes && <p><strong>Notes:</strong> {employee.notes}</p>}
      </div>

      {costSummary && (
        <div className="card">
          <h3>Equipment Cost Summary</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{costSummary.total_items}</div>
              <div className="stat-label">Total Items Issued</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-value">${costSummary.total_cost_issued?.toFixed(2)}</div>
              <div className="stat-label">Total Cost Issued</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-value">{costSummary.items_unreturned}</div>
              <div className="stat-label">Items Unreturned</div>
            </div>
            <div className="stat-card red">
              <div className="stat-value">${costSummary.unreturned_cost?.toFixed(2)}</div>
              <div className="stat-label">Unreturned Cost</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Equipment History</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Equipment</th><th>Category</th><th>Cost</th><th>Assigned</th><th>Returned</th><th>Status</th></tr>
            </thead>
            <tbody>
              {employee.equipment?.map(eq => (
                <tr key={eq.id}>
                  <td><strong>{eq.equipment_name}</strong></td>
                  <td>{eq.category}</td>
                  <td className="money">${eq.unit_cost?.toFixed(2)}</td>
                  <td>{eq.assigned_date}</td>
                  <td>{eq.returned_date || '-'}</td>
                  <td>{eq.returned_date ? <span className="badge paid">Returned</span> : <span className="badge active">Active</span>}</td>
                </tr>
              ))}
              {(!employee.equipment || employee.equipment.length === 0) && (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#888', padding: 30 }}>No equipment assigned</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
