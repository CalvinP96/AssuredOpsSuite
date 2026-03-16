import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../api';
import ProgramDashboardTab from './program/ProgramDashboardTab';
import ProgramJobsTab from './program/ProgramJobsTab';
import ProgramPipelineTab from './program/ProgramPipelineTab';
import ProgramRulesTab from './program/ProgramRulesTab';
import ProgramDocsTasksTab from './program/ProgramDocsTasksTab';

const UTILITIES = ['ComEd', 'Nicor Gas', 'Peoples Gas', 'North Shore Gas'];

export default function ProgramDetail({ role, fixedProgramId }) {
  const params = useParams();
  const id = fixedProgramId || params.id;
  const [program, setProgram] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobForm, setJobForm] = useState({ job_number: '', customer_name: '', phone: '', email: '', address: '', city: '', zip: '', utility: 'ComEd', notes: '' });

  const load = useCallback(() => {
    api.getProgram(id).then(setProgram).catch(() => {});
  }, [id]);

  const loadJobs = useCallback(() => {
    api.getJobs(id).then(setJobs).catch(() => {});
  }, [id]);

  useEffect(() => { load(); loadJobs(); }, [load, loadJobs]);

  const submitJob = async (e) => {
    e.preventDefault();
    try {
      await api.createJob(id, jobForm);
      setShowJobModal(false);
      setJobForm({ job_number: '', customer_name: '', phone: '', email: '', address: '', city: '', zip: '', utility: 'ComEd', notes: '' });
      loadJobs();
    } catch (err) { alert('Failed to create job: ' + err.message); }
  };

  if (!program) return <div className="card"><p>Loading...</p></div>;

  const canEdit = role === 'Admin' || role === 'Operations';
  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'pipeline', label: 'Pipeline' },
    { key: 'rules', label: 'Rules' },
    { key: 'docs', label: 'Docs & Tasks' },
  ];

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>{program.name} <span className="badge active">{program.code}</span></h2>
          {program.manager_name && <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 13 }}>Manager: {program.manager_name}{program.manager_title ? ` (${program.manager_title})` : ''}</p>}
        </div>
      </div>

      <div className="tab-bar" style={{ marginBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.key} className={`tab-btn${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab === 'dashboard' && <ProgramDashboardTab program={program} jobs={jobs} onSwitchTab={setTab} />}
      {tab === 'jobs' && <ProgramJobsTab jobs={jobs} canEdit={canEdit} onRefresh={loadJobs} onNewJob={() => setShowJobModal(true)} />}
      {tab === 'pipeline' && <ProgramPipelineTab jobs={jobs} />}
      {tab === 'rules' && <ProgramRulesTab program={program} />}
      {tab === 'docs' && <ProgramDocsTasksTab program={program} canEdit={canEdit} onRefresh={load} />}

      {showJobModal && (
        <div className="modal-overlay" onClick={() => setShowJobModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3>New Job</h3>
            <form onSubmit={submitJob}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Job Number</label>
                  <input value={jobForm.job_number} onChange={e => setJobForm({...jobForm, job_number: e.target.value})} placeholder="Auto-generated (PID#-001)" />
                </div>
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input required value={jobForm.customer_name} onChange={e => setJobForm({...jobForm, customer_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input value={jobForm.address} onChange={e => setJobForm({...jobForm, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input value={jobForm.city} onChange={e => setJobForm({...jobForm, city: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>ZIP</label>
                  <input value={jobForm.zip} onChange={e => setJobForm({...jobForm, zip: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Utility (select all that apply)</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {UTILITIES.map(u => {
                      const selected = (jobForm.utility || '').split(', ').filter(Boolean);
                      return (
                        <label key={u} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                          <input type="checkbox" checked={selected.includes(u)}
                            onChange={e => {
                              const newUtils = e.target.checked ? [...selected, u] : selected.filter(x => x !== u);
                              setJobForm({ ...jobForm, utility: newUtils.join(', ') });
                            }} />
                          {u}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input value={jobForm.phone} onChange={e => setJobForm({...jobForm, phone: e.target.value})} placeholder="(555) 555-5555" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input value={jobForm.email} onChange={e => setJobForm({...jobForm, email: e.target.value})} placeholder="customer@email.com" />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} value={jobForm.notes} onChange={e => setJobForm({...jobForm, notes: e.target.value})} />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-success">Create Job</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowJobModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
