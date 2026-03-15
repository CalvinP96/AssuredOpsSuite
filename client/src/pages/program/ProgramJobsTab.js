import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as api from '../../api';

const JOB_STATUSES = ['assessment_scheduled', 'assessment_complete', 'pre_approval', 'approved', 'install_scheduled', 'install_in_progress', 'inspection', 'submitted', 'invoiced', 'complete', 'deferred'];

export default function ProgramJobsTab({ jobs, canEdit, onRefresh, onNewJob }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const updateJobStatus = async (job, status) => {
    try { await api.updateJob(job.id, { ...job, status }); onRefresh(); }
    catch (err) { alert('Failed to update job status: ' + err.message); }
  };

  const filtered = jobs.filter(job => {
    if (statusFilter !== 'all' && job.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (job.customer_name || '').toLowerCase().includes(q) ||
             (job.address || '').toLowerCase().includes(q) ||
             (job.job_number || '').includes(q);
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <div style={{ fontSize: 14, color: '#666' }}>
          {filtered.length} job{filtered.length !== 1 ? 's' : ''}
          {statusFilter !== 'all' ? ` (${statusFilter.replace(/_/g, ' ')})` : ''}
          {search ? ` matching "${search}"` : ''}
        </div>
        {canEdit && <button className="btn btn-primary" onClick={onNewJob}>+ New Job</button>}
      </div>

      {/* Search & Filter */}
      <div className="card" style={{ marginBottom: 15, padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by name, address, or job #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}>
            <option value="all">All Statuses</option>
            {JOB_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Job List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 30, color: '#888' }}>
          {jobs.length === 0 ? 'No jobs yet. Create a job to start tracking measures, photos, and paperwork.' : 'No jobs match your search/filter.'}
        </div>
      ) : (
        filtered.map(job => {
          const checklist = job.checklist || [];
          const totalItems = checklist.length;
          const completedItems = checklist.filter(c => c.completed).length;
          const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

          return (
            <div key={job.id} className="card" style={{ marginBottom: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => navigate(`/job/${job.id}`)}>
              <div>
                <Link to={`/job/${job.id}`} onClick={e => e.stopPropagation()} style={{ color: '#1a73e8', fontWeight: 'bold', textDecoration: 'none' }}>
                  {job.customer_name || 'Unnamed'}
                </Link>
                {job.job_number && <span className="badge active" style={{ marginLeft: 8, fontSize: 10 }}>#{job.job_number}</span>}
                <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>{job.address}{job.city ? `, ${job.city}` : ''} {job.zip || ''}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link to={`/job/${job.id}`} className="btn btn-sm btn-primary" onClick={e => e.stopPropagation()}
                  style={{ textDecoration: 'none', fontSize: 11, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                  Open Project
                </Link>
                {canEdit && (
                  <select className="btn btn-sm" value={job.status}
                    onClick={e => e.stopPropagation()}
                    onChange={e => { e.stopPropagation(); updateJobStatus(job, e.target.value); }}
                    style={{ padding: '2px 6px', fontSize: 11, minWidth: 160 }}>
                    {JOB_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                )}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: pct === 100 ? '#27ae60' : '#e94560' }}>{pct}% Complete</div>
                  <div style={{ width: 120, height: 6, background: '#eee', borderRadius: 3, marginTop: 4 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#27ae60' : '#e94560', borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
