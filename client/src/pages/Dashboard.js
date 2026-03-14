import React, { useState, useEffect } from 'react';
import * as api from '../api';

export default function Dashboard({ role }) {
  const [empStats, setEmpStats] = useState(null);
  const [kpiStats, setKpiStats] = useState(null);
  const [billStats, setBillStats] = useState(null);

  useEffect(() => {
    api.getEmployeeStats().then(setEmpStats).catch(() => {});
    api.getKpiDashboard().then(setKpiStats).catch(() => {});
    api.getBillStats().then(setBillStats).catch(() => {});
  }, []);

  return (
    <div>
      <div className="section-header">
        <h2>{role === 'Admin' ? 'Admin Dashboard - Full Overview' : `${role} Dashboard`}</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-value">{empStats?.active ?? '-'}</div>
          <div className="stat-label">Active Employees</div>
        </div>
        <div className="stat-card red">
          <div className="stat-value">{empStats?.terminated ?? '-'}</div>
          <div className="stat-label">Terminated</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{kpiStats?.on_track ?? '-'}</div>
          <div className="stat-label">KPIs On Track</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">{kpiStats?.at_risk ?? '-'}</div>
          <div className="stat-label">KPIs At Risk</div>
        </div>
      </div>

      {(role === 'Admin' || role === 'Finance') && billStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{billStats.total_bills}</div>
            <div className="stat-label">Total Termination Bills</div>
          </div>
          <div className="stat-card red">
            <div className="stat-value">${billStats.total_amount_due?.toLocaleString() ?? '0'}</div>
            <div className="stat-label">Total Amount Due</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-value">{billStats.pending}</div>
            <div className="stat-label">Pending Bills</div>
          </div>
          <div className="stat-card green">
            <div className="stat-value">{billStats.paid}</div>
            <div className="stat-label">Paid Bills</div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Department Headcount</h3>
        {empStats?.by_department?.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Department</th><th>Active Employees</th></tr>
              </thead>
              <tbody>
                {empStats.by_department.map(d => (
                  <tr key={d.department}>
                    <td>{d.department}</td>
                    <td><strong>{d.count}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#888' }}>No employees yet. Head to HR to add employees.</p>
        )}
      </div>

      {kpiStats && (
        <div className="card">
          <h3>KPI Overview</h3>
          <div className="stats-grid">
            <div className="stat-card green">
              <div className="stat-value">{kpiStats.on_track}</div>
              <div className="stat-label">On Track</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-value">{kpiStats.at_risk}</div>
              <div className="stat-label">At Risk</div>
            </div>
            <div className="stat-card red">
              <div className="stat-value">{kpiStats.off_track}</div>
              <div className="stat-label">Off Track</div>
            </div>
          </div>
          {kpiStats.by_category?.length > 0 && (
            <div className="table-container">
              <table>
                <thead><tr><th>Category</th><th>Count</th></tr></thead>
                <tbody>
                  {kpiStats.by_category.map(c => (
                    <tr key={c.category}><td>{c.category}</td><td>{c.count}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
