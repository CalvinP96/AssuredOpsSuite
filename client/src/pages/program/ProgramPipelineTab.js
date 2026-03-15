import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../api';

const JOB_STATUSES = ['assessment_scheduled', 'assessment_complete', 'pre_approval', 'approved', 'install_scheduled', 'install_in_progress', 'inspection', 'submitted', 'invoiced', 'complete', 'deferred'];

export default function ProgramPipelineTab({ program }) {
  const [forecast, setForecast] = useState(null);
  const [forecastFrom, setForecastFrom] = useState('');
  const [forecastTo, setForecastTo] = useState('');

  const loadForecast = useCallback((from, to) => {
    api.getForecast(program.id, from, to).then(setForecast).catch(() => {});
  }, [program.id]);

  useEffect(() => { loadForecast(forecastFrom, forecastTo); }, []); // eslint-disable-line

  return (
    <div>
      {/* Date Range Filter */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Job Forecast & Pipeline</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13 }}>
            From: <input type="date" value={forecastFrom} onChange={e => setForecastFrom(e.target.value)} style={{ marginLeft: 4 }} />
          </label>
          <label style={{ fontSize: 13 }}>
            To: <input type="date" value={forecastTo} onChange={e => setForecastTo(e.target.value)} style={{ marginLeft: 4 }} />
          </label>
          <button className="btn btn-primary btn-sm" onClick={() => loadForecast(forecastFrom, forecastTo)}>Load Forecast</button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setForecastFrom(''); setForecastTo(''); loadForecast('', ''); }}>Show All</button>
        </div>
      </div>

      {forecast && (
        <>
          {/* Pipeline Summary */}
          <div className="stats-grid" style={{ marginBottom: 16 }}>
            <div className="stat-card green">
              <div className="stat-value">{forecast.submitted?.count || 0}</div>
              <div className="stat-label">Submitted{forecastFrom ? ` (${forecastFrom} - ${forecastTo || 'now'})` : ''}</div>
              {forecast.submitted?.total_estimate > 0 && <div style={{ fontSize: 12, color: '#27ae60', marginTop: 4 }}>${Number(forecast.submitted.total_estimate).toLocaleString()}</div>}
            </div>
            <div className="stat-card blue">
              <div className="stat-value">{forecast.projected?.count || 0}</div>
              <div className="stat-label">Projected Submissions</div>
              {forecast.projected?.total_estimate > 0 && <div style={{ fontSize: 12, color: '#2980b9', marginTop: 4 }}>${Number(forecast.projected.total_estimate).toLocaleString()}</div>}
            </div>
            <div className="stat-card orange">
              <div className="stat-value">{(forecast.ready_to_submit || []).length}</div>
              <div className="stat-label">Ready to Submit</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{forecast.permit_summary?.total_needing_permit || 0}</div>
              <div className="stat-label">Need Permits</div>
            </div>
          </div>

          {/* Pipeline Buckets */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>Pipeline by Status</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {Object.entries(forecast.pipeline || {}).sort((a, b) => {
                return JOB_STATUSES.indexOf(a[0]) - JOB_STATUSES.indexOf(b[0]);
              }).map(([status, count]) => (
                <div key={status} style={{ padding: '10px 16px', background: status === 'complete' ? '#e8fde8' : status === 'deferred' ? '#fde8e8' : '#f0f4ff', borderRadius: 8, textAlign: 'center', minWidth: 100, border: '1px solid #ddd' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#0f3460' }}>{count}</div>
                  <div style={{ fontSize: 11, color: '#666', textTransform: 'capitalize' }}>{status.replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Permit Summary */}
          {forecast.permit_summary?.total_needing_permit > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3>Permit Summary</h3>
              <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                <div style={{ padding: '8px 14px', background: '#fff3e0', borderRadius: 6, fontSize: 13 }}>
                  <strong>Not Applied:</strong> {forecast.permit_summary.not_applied}
                </div>
                <div style={{ padding: '8px 14px', background: '#e3f2fd', borderRadius: 6, fontSize: 13 }}>
                  <strong>Applied:</strong> {forecast.permit_summary.applied}
                </div>
                <div style={{ padding: '8px 14px', background: '#e8f5e9', borderRadius: 6, fontSize: 13 }}>
                  <strong>Received:</strong> {forecast.permit_summary.received}
                </div>
                {forecast.permit_summary.issues > 0 && (
                  <div style={{ padding: '8px 14px', background: '#ffebee', borderRadius: 6, fontSize: 13 }}>
                    <strong>Issues:</strong> {forecast.permit_summary.issues}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ready to Submit */}
          {(forecast.ready_to_submit || []).length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ color: '#27ae60' }}>Ready to Submit ({forecast.ready_to_submit.length})</h3>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>All job types complete - these projects can be submitted for payment.</p>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>Job #</th>
                    <th style={{ padding: '6px 8px' }}>Customer</th>
                    <th style={{ padding: '6px 8px' }}>Address</th>
                    <th style={{ padding: '6px 8px' }}>Estimate</th>
                    <th style={{ padding: '6px 8px' }}>Projected Submission</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.ready_to_submit.map(j => (
                    <tr key={j.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '6px 8px' }}>{j.job_number || '-'}</td>
                      <td style={{ padding: '6px 8px' }}>{j.customer_name}</td>
                      <td style={{ padding: '6px 8px' }}>{j.address}, {j.city}</td>
                      <td style={{ padding: '6px 8px' }}>{j.estimate_amount ? `$${Number(j.estimate_amount).toLocaleString()}` : '-'}</td>
                      <td style={{ padding: '6px 8px' }}>{j.projected_submission || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* In-Progress Jobs */}
          <div className="card">
            <h3>In-Progress Jobs ({(forecast.all_in_progress || []).length})</h3>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>Job types must all be complete before project can be submitted for payment.</p>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Job #</th>
                  <th style={{ padding: '6px 8px' }}>Customer</th>
                  <th style={{ padding: '6px 8px' }}>Status</th>
                  <th style={{ padding: '6px 8px' }}>Progress</th>
                  <th style={{ padding: '6px 8px' }}>Completed</th>
                  <th style={{ padding: '6px 8px' }}>Pending</th>
                  <th style={{ padding: '6px 8px' }}>Est. Submission</th>
                </tr>
              </thead>
              <tbody>
                {(forecast.all_in_progress || []).map(j => (
                  <tr key={j.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '6px 8px' }}>{j.job_number || '-'}</td>
                    <td style={{ padding: '6px 8px' }}>{j.customer_name}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <span className={`badge ${j.status === 'deferred' ? 'terminated' : 'pending'}`}>{j.status?.replace(/_/g, ' ')}</span>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ width: 80, height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }}>
                        <div style={{ width: `${j.completion_pct}%`, height: '100%', background: j.completion_pct === 100 ? '#27ae60' : '#2980b9', borderRadius: 4 }} />
                      </div>
                      <span>{j.completion_pct}%</span>
                    </td>
                    <td style={{ padding: '6px 8px', fontSize: 11, color: '#27ae60' }}>{(j.completed_types || []).join(', ') || '-'}</td>
                    <td style={{ padding: '6px 8px', fontSize: 11, color: '#c0392b' }}>{(j.pending_types || []).join(', ') || '-'}</td>
                    <td style={{ padding: '6px 8px' }}>{j.projected_submission || 'TBD'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!forecast && (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: '#888' }}>
          <p>Click "Load Forecast" or "Show All" to view your job pipeline and submission projections.</p>
        </div>
      )}
    </div>
  );
}
