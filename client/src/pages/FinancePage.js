import React, { useState, useEffect } from 'react';
import * as api from '../api';

export default function FinancePage({ role }) {
  const [assignments, setAssignments] = useState([]);
  const [billStats, setBillStats] = useState(null);

  useEffect(() => {
    api.getAssignments().then(setAssignments).catch(() => {});
    api.getBillStats().then(setBillStats).catch(() => {});
  }, []);

  const totalEquipCost = assignments.reduce((sum, a) => sum + (a.unit_cost || 0), 0);
  const activeEquipCost = assignments.filter(a => !a.returned_date).reduce((sum, a) => sum + (a.unit_cost || 0), 0);
  const byDept = {};
  assignments.forEach(a => {
    if (!byDept[a.department]) byDept[a.department] = { total: 0, active: 0, count: 0 };
    byDept[a.department].total += a.unit_cost || 0;
    byDept[a.department].count++;
    if (!a.returned_date) byDept[a.department].active += a.unit_cost || 0;
  });

  return (
    <div>
      <div className="section-header">
        <h2>Finance Overview</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-value">${totalEquipCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          <div className="stat-label">Total Equipment Issued (All Time)</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">${activeEquipCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          <div className="stat-label">Currently Deployed Equipment Value</div>
        </div>
        <div className="stat-card red">
          <div className="stat-value">${billStats?.total_amount_due?.toLocaleString(undefined, {minimumFractionDigits: 2}) ?? '0.00'}</div>
          <div className="stat-label">Total Termination Amount Due</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{billStats?.paid ?? 0}</div>
          <div className="stat-label">Bills Settled</div>
        </div>
      </div>

      <div className="card">
        <h3>Equipment Cost by Department</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Department</th><th>Items Issued</th><th>Total Cost</th><th>Currently Active Cost</th></tr>
            </thead>
            <tbody>
              {Object.entries(byDept).map(([dept, data]) => (
                <tr key={dept}>
                  <td><strong>{dept}</strong></td>
                  <td>{data.count}</td>
                  <td className="money">${data.total.toFixed(2)}</td>
                  <td className="money due">${data.active.toFixed(2)}</td>
                </tr>
              ))}
              {Object.keys(byDept).length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#888', padding: 30 }}>No equipment data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>All Equipment Assignments</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Employee</th><th>Equipment</th><th>Department</th><th>Cost</th><th>Assigned</th><th>Returned</th></tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id}>
                  <td>{a.first_name} {a.last_name}</td>
                  <td>{a.equipment_name}</td>
                  <td>{a.department}</td>
                  <td className="money">${a.unit_cost?.toFixed(2)}</td>
                  <td>{a.assigned_date}</td>
                  <td>{a.returned_date || <span className="badge active">Active</span>}</td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#888', padding: 30 }}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
