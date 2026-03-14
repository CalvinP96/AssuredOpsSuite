import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api';

const STATUS_LABELS = {
  assessment_scheduled: 'Assessment',
  assessment_complete: 'Assessed',
  pre_approval: 'Pre-Approval',
  approved: 'Approved',
  install_scheduled: 'Install Sched.',
  install_in_progress: 'Installing',
  inspection: 'Inspection',
  submitted: 'Submitted',
  invoiced: 'Invoiced',
  complete: 'Complete',
  deferred: 'Deferred',
};

export default function Dashboard({ roles }) {
  const [empStats, setEmpStats] = useState(null);
  const [kpiStats, setKpiStats] = useState(null);
  const [billStats, setBillStats] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [itSummary, setItSummary] = useState(null);

  const hasRole = (...r) => roles.includes('Admin') || r.some(x => roles.includes(x));

  useEffect(() => {
    api.getEmployeeStats().then(setEmpStats).catch(() => {});
    api.getKpiDashboard().then(setKpiStats).catch(() => {});
    api.getBillStats().then(setBillStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (roles.includes('Admin') || roles.includes('Program Manager')) {
      api.getProgramsSummary().then(setPrograms).catch(() => {});
    } else {
      setPrograms([]);
    }
    if (roles.includes('Admin') || roles.includes('IT')) {
      api.getITSummary().then(setItSummary).catch(() => {});
    } else {
      setItSummary(null);
    }
  }, [roles]);

  const dashTitle = hasRole('Admin')
    ? 'Overview Dashboard'
    : roles.length > 1
      ? `${roles.join(' / ')} Dashboard`
      : `${roles[0]} Dashboard`;

  return (
    <div>
      <div className="section-header">
        <h2>{dashTitle}</h2>
      </div>

      {/* Programs Section */}
      {hasRole('Program Manager') && programs.length > 0 && (
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">Programs</h3>
          <div className="program-cards-grid">
            {programs.map(p => (
              <Link to="/hes-ie" key={p.id} className="program-card">
                <div className="program-card-header">
                  <h4>{p.name}</h4>
                  <span className={`badge ${p.status === 'active' ? 'active' : 'pending'}`}>
                    {p.status}
                  </span>
                </div>
                <div className="program-card-stat">
                  <span className="program-card-count">{p.job_count}</span>
                  <span className="program-card-label">Active Jobs</span>
                </div>
                {Object.keys(p.pipeline).length > 0 && (
                  <div className="pipeline-breakdown">
                    {Object.entries(p.pipeline).map(([status, count]) => (
                      <div key={status} className="pipeline-item">
                        <span className="pipeline-label">{STATUS_LABELS[status] || status}</span>
                        <span className="pipeline-count">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* IT Equipment Summary */}
      {hasRole('IT') && itSummary && (
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">IT Equipment</h3>
          <div className="stats-grid" style={{ maxWidth: 480 }}>
            <div className="stat-card blue">
              <div className="stat-value">{itSummary.total_assigned}</div>
              <div className="stat-label">Devices Assigned</div>
            </div>
            <div className="stat-card green">
              <div className="stat-value">${itSummary.total_cost.toLocaleString()}</div>
              <div className="stat-label">Total Cost Deployed</div>
            </div>
          </div>
        </div>
      )}

      {/* Employee & KPI Stats */}
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

      {/* Finance Stats */}
      {hasRole('Finance') && billStats && (
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

      {/* Department Headcount */}
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
          <p className="empty-text">No employees yet. Head to HR to add employees.</p>
        )}
      </div>

      {/* KPI Overview */}
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
