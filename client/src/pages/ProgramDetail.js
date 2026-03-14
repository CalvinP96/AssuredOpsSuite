import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

const DOC_TYPES = ['Policy', 'Procedure', 'Form', 'Report', 'Audit', 'Compliance', 'Training', 'SOP', 'Manual', 'Checklist', 'Other'];
const DOC_STATUSES = ['draft', 'in_review', 'approved', 'active', 'archived'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const JOB_STATUSES = ['assessment_scheduled', 'assessment_complete', 'pre_approval', 'approved', 'install_scheduled', 'install_in_progress', 'inspection', 'submitted', 'invoiced', 'complete', 'deferred'];
const UTILITIES = ['ComEd', 'Nicor Gas', 'Peoples Gas', 'North Shore Gas'];

export default function ProgramDetail({ role, fixedProgramId }) {
  const params = useParams();
  const id = fixedProgramId || params.id;
  const [program, setProgram] = useState(null);
  const [tab, setTab] = useState('jobs');
  const [showDocModal, setShowDocModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMsModal, setShowMsModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [expandedMeasure, setExpandedMeasure] = useState(null);
  const [expandedJob, setExpandedJob] = useState(null);
  const [rulesFilter, setRulesFilter] = useState('all');
  const [rulesSubTab, setRulesSubTab] = useState('measures');
  const [jobs, setJobs] = useState([]);
  const [showHvacModal, setShowHvacModal] = useState(null);
  const [hvacForm, setHvacForm] = useState({ equipment_type: 'Gas Furnace', existing_make: '', existing_model: '', existing_condition: '', existing_efficiency: '', existing_age: '', decision_tree_result: '', notes: '' });

  const [docForm, setDocForm] = useState({ title: '', doc_type: 'SOP', assigned_to: '', due_date: '', notes: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '', category: '', notes: '' });
  const [msForm, setMsForm] = useState({ title: '', target_date: '', notes: '' });
  const [jobForm, setJobForm] = useState({ job_number: '', customer_name: '', phone: '', email: '', address: '', city: '', zip: '', utility: 'ComEd', notes: '' });
  const [assessmentOpen, setAssessmentOpen] = useState(null);
  const [scopeOpen, setScopeOpen] = useState(null);

  const load = useCallback(() => {
    fetch(`/api/programs/${id}`).then(r => r.json()).then(setProgram).catch(() => {});
  }, [id]);

  const loadJobs = useCallback(() => {
    fetch(`/api/programs/${id}/jobs`).then(r => r.json()).then(setJobs).catch(() => {});
  }, [id]);

  useEffect(() => { load(); loadJobs(); }, [load, loadJobs]);
  useEffect(() => { if (tab === 'jobs') loadJobs(); }, [tab, loadJobs]);

  // Document handlers
  const submitDoc = async (e) => {
    e.preventDefault();
    if (editDoc) {
      await fetch(`/api/programs/documents/${editDoc.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editDoc, ...docForm })
      });
    } else {
      await fetch(`/api/programs/${id}/documents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docForm)
      });
    }
    closeDocModal();
    load();
  };

  const updateDocStatus = async (doc, status) => {
    await fetch(`/api/programs/documents/${doc.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...doc, status })
    });
    load();
  };

  const deleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    await fetch(`/api/programs/documents/${docId}`, { method: 'DELETE' });
    load();
  };

  const openEditDoc = (doc) => {
    setEditDoc(doc);
    setDocForm({ title: doc.title, doc_type: doc.doc_type, assigned_to: doc.assigned_to || '', due_date: doc.due_date || '', notes: doc.notes || '' });
    setShowDocModal(true);
  };

  const closeDocModal = () => { setShowDocModal(false); setEditDoc(null); setDocForm({ title: '', doc_type: 'SOP', assigned_to: '', due_date: '', notes: '' }); };

  // Task handlers
  const submitTask = async (e) => {
    e.preventDefault();
    if (editTask) {
      await fetch(`/api/programs/tasks/${editTask.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editTask, ...taskForm })
      });
    } else {
      await fetch(`/api/programs/${id}/tasks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm)
      });
    }
    closeTaskModal();
    load();
  };

  const updateTaskStatus = async (task, status) => {
    await fetch(`/api/programs/tasks/${task.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, status })
    });
    load();
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({ title: task.title, description: task.description || '', priority: task.priority, assigned_to: task.assigned_to || '', due_date: task.due_date || '', category: task.category || '', notes: task.notes || '' });
    setShowTaskModal(true);
  };

  const closeTaskModal = () => { setShowTaskModal(false); setEditTask(null); setTaskForm({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '', category: '', notes: '' }); };

  // Milestone handlers
  const submitMs = async (e) => {
    e.preventDefault();
    await fetch(`/api/programs/${id}/milestones`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msForm)
    });
    setShowMsModal(false);
    setMsForm({ title: '', target_date: '', notes: '' });
    load();
  };

  const completeMilestone = async (ms) => {
    await fetch(`/api/programs/milestones/${ms.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ms, status: 'completed', completed_date: new Date().toISOString().split('T')[0] })
    });
    load();
  };

  // Job handlers
  const submitJob = async (e) => {
    e.preventDefault();
    await fetch(`/api/programs/${id}/jobs`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobForm)
    });
    setShowJobModal(false);
    setJobForm({ job_number: '', customer_name: '', phone: '', email: '', address: '', city: '', zip: '', utility: 'ComEd', notes: '' });
    loadJobs();
  };

  const updateJobStatus = async (job, status) => {
    await fetch(`/api/programs/jobs/${job.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...job, status })
    });
    loadJobs();
  };

  const toggleChecklist = async (item) => {
    await fetch(`/api/programs/jobs/checklist/${item.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !item.completed, completed_by: role })
    });
    loadJobs();
  };

  // HVAC Replacement handlers
  const submitHvac = async (e) => {
    e.preventDefault();
    await fetch(`/api/programs/jobs/${showHvacModal}/hvac`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hvacForm)
    });
    setShowHvacModal(null);
    setHvacForm({ equipment_type: 'Gas Furnace', existing_make: '', existing_model: '', existing_condition: '', existing_efficiency: '', existing_age: '', decision_tree_result: '', notes: '' });
    loadJobs();
  };

  const updateHvac = async (hvacId, updates) => {
    await fetch(`/api/programs/hvac/${hvacId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    loadJobs();
  };

  const updateJobField = async (job, field, value) => {
    await fetch(`/api/programs/jobs/${job.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...job, [field]: value })
    });
    loadJobs();
  };

  // Forecast state
  const [forecast, setForecast] = useState(null);
  const [forecastFrom, setForecastFrom] = useState('');
  const [forecastTo, setForecastTo] = useState('');

  const loadForecast = useCallback((from, to) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    fetch(`/api/programs/${id}/jobs/forecast?${params}`).then(r => r.json()).then(setForecast).catch(() => {});
  }, [id]);

  // Auto-load forecast when pipeline tab opens
  useEffect(() => { if (tab === 'pipeline') loadForecast(forecastFrom, forecastTo); }, [tab]); // eslint-disable-line

  const saveAssessment = async (jobId, data) => {
    await fetch(`/api/programs/jobs/${jobId}/assessment`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessment_data: data })
    });
    loadJobs();
  };

  const saveScope = async (jobId, data) => {
    await fetch(`/api/programs/jobs/${jobId}/scope`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope_data: data })
    });
    loadJobs();
  };

  const getAssessment = (job) => {
    try { return JSON.parse(job.assessment_data || '{}'); } catch { return {}; }
  };

  const getScope = (job) => {
    try { return JSON.parse(job.scope_data || '{}'); } catch { return {}; }
  };

  if (!program) return <div className="card"><p>Loading...</p></div>;

  const canEdit = role === 'Admin' || role === 'Operations';
  const todoTasks = program.tasks?.filter(t => t.status === 'todo') || [];
  const inProgressTasks = program.tasks?.filter(t => t.status === 'in_progress') || [];
  const reviewTasks = program.tasks?.filter(t => t.status === 'review') || [];
  const doneTasks = program.tasks?.filter(t => t.status === 'done') || [];

  const measures = program.measures || [];
  const categories = [...new Set(measures.map(m => m.category))];
  const filteredMeasures = rulesFilter === 'all' ? measures : measures.filter(m => m.category === rulesFilter);

  const processSteps = program.processSteps || [];
  const phases = [...new Set(processSteps.map(s => s.phase))];

  const tabs = ['overview', 'rules', 'process', 'jobs', 'pipeline', 'documents', 'tasks', 'milestones'];

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>{program.name} <span className="badge active">{program.code}</span></h2>
          {program.manager_name && <p style={{ color: '#888', marginTop: 4 }}>Manager: {program.manager_name} {program.manager_title ? `(${program.manager_title})` : ''}</p>}
        </div>
      </div>

      {program.description && <div className="card"><p>{program.description}</p></div>}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div>
          <div className="stats-grid">
            <div className="stat-card blue"><div className="stat-value">{measures.length}</div><div className="stat-label">Measures</div></div>
            <div className="stat-card orange"><div className="stat-value">{todoTasks.length + inProgressTasks.length + reviewTasks.length}</div><div className="stat-label">Open Tasks</div></div>
            <div className="stat-card green"><div className="stat-value">{jobs.length || 0}</div><div className="stat-label">Jobs</div></div>
            <div className="stat-card"><div className="stat-value">{program.documents?.length || 0}</div><div className="stat-label">Documents</div></div>
          </div>

          {measures.length > 0 && (
            <div className="card">
              <h3>Program Rules Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
                {categories.map(cat => {
                  const catMeasures = measures.filter(m => m.category === cat);
                  return (
                    <div key={cat} style={{ padding: 12, background: '#f8f9fa', borderRadius: 8, border: '1px solid #eee' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{cat}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#0f3460' }}>{catMeasures.length}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>measures</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {inProgressTasks.length > 0 && (
            <div className="card" style={{ marginTop: 15 }}>
              <h3>In Progress Tasks</h3>
              {inProgressTasks.map(t => (
                <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                  <div><strong>{t.title}</strong> {t.assigned_to && <small style={{ color: '#888' }}>- {t.assigned_to}</small>}</div>
                  <span className={`badge ${t.priority === 'critical' ? 'terminated' : t.priority === 'high' ? 'at_risk' : 'active'}`}>{t.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RULES TAB */}
      {tab === 'rules' && (
        <div>
          {measures.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 15, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['measures', 'eligibility', 'deferrals', 'h&s'].map(st => (
                    <button key={st} className={`btn btn-sm ${rulesSubTab === st ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setRulesSubTab(st)}>{st.charAt(0).toUpperCase() + st.slice(1)}</button>
                  ))}
                </div>
              </div>

              {/* MEASURES SUB-TAB */}
              {rulesSubTab === 'measures' && (
                <>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 15, flexWrap: 'wrap' }}>
                    <button className={`btn btn-sm ${rulesFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setRulesFilter('all')}>All ({measures.length})</button>
                    {categories.map(cat => (
                      <button key={cat} className={`btn btn-sm ${rulesFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setRulesFilter(cat)}>{cat} ({measures.filter(m => m.category === cat).length})</button>
                    ))}
                  </div>

                  {filteredMeasures.map(m => (
                    <div key={m.id} className="card" style={{ marginBottom: 10, padding: 0, overflow: 'hidden' }}>
                      <div
                        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedMeasure === m.id ? '#f0f2f5' : 'white' }}
                        onClick={() => setExpandedMeasure(expandedMeasure === m.id ? null : m.id)}
                      >
                        <div>
                          <strong>{m.name}</strong>
                          <span className="badge active" style={{ marginLeft: 8, fontSize: 10 }}>{m.category}</span>
                          {m.is_emergency_only ? <span className="badge terminated" style={{ marginLeft: 6, fontSize: 10 }}>Emergency Only</span> : null}
                        </div>
                        <span style={{ color: '#888', fontSize: 18 }}>{expandedMeasure === m.id ? '\u25B2' : '\u25BC'}</span>
                      </div>

                      {expandedMeasure === m.id && (
                        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #eee' }}>
                          <p style={{ color: '#666', fontSize: 13, marginTop: 12 }}>{m.description}</p>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                            <div style={{ padding: 12, background: '#e8f4fd', borderRadius: 6 }}>
                              <div style={{ fontWeight: 600, fontSize: 12, color: '#0f3460', marginBottom: 6 }}>Baseline Requirements</div>
                              <div style={{ fontSize: 13 }}>{m.baseline_requirements}</div>
                            </div>
                            <div style={{ padding: 12, background: '#e8fde8', borderRadius: 6 }}>
                              <div style={{ fontWeight: 600, fontSize: 12, color: '#27ae60', marginBottom: 6 }}>Efficiency Requirements</div>
                              <div style={{ fontSize: 13 }}>{m.efficiency_requirements}</div>
                            </div>
                          </div>

                          <div style={{ padding: 12, background: '#fff8e8', borderRadius: 6, marginTop: 12 }}>
                            <div style={{ fontWeight: 600, fontSize: 12, color: '#f39c12', marginBottom: 6 }}>Installation Standards</div>
                            <div style={{ fontSize: 13 }}>{m.installation_standards}</div>
                          </div>

                          {m.photo_requirements?.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                              <div style={{ fontWeight: 600, fontSize: 12, color: '#e94560', marginBottom: 8 }}>Required Photos ({m.photo_requirements.length})</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 6 }}>
                                {m.photo_requirements.map((pr, i) => (
                                  <div key={i} style={{ padding: '6px 10px', background: '#fef0f0', borderRadius: 4, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: '#e94560' }}>&#128247;</span> {pr.photo_description}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {m.paperwork_requirements?.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                              <div style={{ fontWeight: 600, fontSize: 12, color: '#0f3460', marginBottom: 8 }}>Required Paperwork ({m.paperwork_requirements.length})</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 6 }}>
                                {m.paperwork_requirements.map((pr, i) => (
                                  <div key={i} style={{ padding: '6px 10px', background: '#f0f0fe', borderRadius: 4, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: '#0f3460' }}>&#128196;</span> {pr.document_name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* ELIGIBILITY SUB-TAB */}
              {rulesSubTab === 'eligibility' && (
                <div>
                  {['property', 'customer', 'prioritization', 'compliance'].map(type => {
                    const rules = (program.eligibilityRules || []).filter(r => r.rule_type === type);
                    if (rules.length === 0) return null;
                    const isCompliance = type === 'compliance';
                    return (
                      <div key={type} style={{ marginBottom: 20 }}>
                        <h3 style={{ textTransform: 'capitalize', marginBottom: 10, color: isCompliance ? '#c0392b' : undefined }}>
                          {isCompliance ? 'Protected Utility Documents' : `${type} Eligibility`}
                        </h3>
                        {isCompliance && (
                          <div style={{ padding: '12px 16px', background: '#f8d7da', border: '1px solid #c0392b', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
                            <strong>DO NOT ALTER.</strong> Any form with ComEd, Nicor Gas, Peoples Gas, or North Shore Gas logos is utility-owned. Cannot be edited, reprinted, or modified in any way. Must be signed by customer. Customer must receive a copy.
                          </div>
                        )}
                        {rules.map(r => (
                          <div key={r.id} className="card" style={{ marginBottom: 8, padding: '12px 16px', borderLeft: isCompliance ? '4px solid #c0392b' : undefined }}>
                            <strong>{r.title}</strong>
                            <p style={{ margin: '6px 0 0', color: '#666', fontSize: 13 }}>{r.description}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DEFERRALS SUB-TAB */}
              {rulesSubTab === 'deferrals' && (
                <div className="card">
                  <h3 style={{ marginBottom: 12 }}>Deferral / Walk Away Conditions</h3>
                  <p style={{ color: '#888', fontSize: 13, marginBottom: 15 }}>
                    If any of these conditions are encountered, they must be resolved before work can proceed. Use the Hazardous Conditions Form (Appendix I) to document and present to the customer.
                  </p>
                  {(program.deferralRules || []).map((d, i) => (
                    <div key={d.id} style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ background: '#f8d7da', color: '#c0392b', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: 13 }}>{d.condition_text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* H&S SUB-TAB */}
              {rulesSubTab === 'h&s' && (
                <div>
                  <div className="card" style={{ marginBottom: 15, padding: '16px', background: '#fff3cd', border: '1px solid #f39c12' }}>
                    <strong>H&S Budget Cap: $1,000 per home</strong>
                    <p style={{ margin: '6px 0 0', fontSize: 13 }}>
                      For jointly funded projects (gas/electric): exhaust fans and mechanical replacements are NOT included in the cap.
                      Mechanical repairs ARE included. Tune-ups are NOT included.
                      For gas-only projects: exhaust fans ARE included in the cap.
                    </p>
                    <p style={{ margin: '8px 0 0', fontSize: 13 }}>
                      <strong>Exception Policy:</strong> Up to 25 exceptions per program year for H&S costs up to $2,000 where project savings exceed 2,100 kWh or 750 therms.
                    </p>
                  </div>

                  <div className="card" style={{ marginBottom: 15 }}>
                    <h3 style={{ marginBottom: 10 }}>Gas Leak & CO Emergency Thresholds</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ padding: 12, background: '#f8d7da', borderRadius: 6 }}>
                        <strong style={{ color: '#c0392b' }}>Methane / Gas Leak</strong>
                        <p style={{ fontSize: 13, margin: '6px 0 0' }}>Ambient methane reading on CGD of 10% LEL / 5,000ppm or higher, or increasing over time. Evacuate, call gas utility, notify RI.</p>
                      </div>
                      <div style={{ padding: 12, background: '#f8d7da', borderRadius: 6 }}>
                        <strong style={{ color: '#c0392b' }}>Carbon Monoxide</strong>
                        <p style={{ fontSize: 13, margin: '6px 0 0' }}>Ambient CO above 70ppm: evacuate home, call gas utility, notify RI. Above 35ppm: immediate action required.</p>
                      </div>
                    </div>
                    <div style={{ marginTop: 12, padding: 12, background: '#f0f0f0', borderRadius: 6 }}>
                      <strong>Emergency Lines:</strong>
                      <div style={{ fontSize: 13, marginTop: 6 }}>
                        Nicor Gas: 888.642.6748 | North Shore Gas: 866.556.6005 | Peoples Gas: 866.556.6002
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ marginBottom: 15 }}>
                    <h3 style={{ marginBottom: 10 }}>Mechanical Replacement Decision Trees</h3>
                    <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>Emergency replacement is the only condition under which mechanical systems can be replaced. If equipment is NOT failed and can be repaired within the threshold, it is NOT eligible for replacement.</p>
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr><th>Equipment</th><th>Failed?</th><th>H&S Risk?</th><th>Repair Threshold</th><th>Result</th></tr>
                        </thead>
                        <tbody>
                          <tr><td><strong>Gas Furnace</strong></td><td>YES</td><td>-</td><td>-</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                          <tr style={{ background: '#f8f9fa' }}><td></td><td>NO</td><td>YES</td><td>&lt; $950</td><td><span className="badge terminated">Not Eligible (Repair)</span></td></tr>
                          <tr><td></td><td>NO</td><td>YES</td><td>&ge; $950</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                          <tr style={{ background: '#e8f4fd' }}><td><strong>Electric Resistance Heat</strong></td><td>Any</td><td>Any</td><td>N/A</td><td><span className="badge active">Eligible for Heat Pump</span></td></tr>
                          <tr><td><strong>Boiler</strong></td><td>YES</td><td>-</td><td>-</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                          <tr style={{ background: '#f8f9fa' }}><td></td><td>NO</td><td>YES</td><td>&lt; $700</td><td><span className="badge terminated">Not Eligible (Repair)</span></td></tr>
                          <tr><td></td><td>NO</td><td>YES</td><td>&ge; $700</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                          <tr><td><strong>Water Heater (Gas)</strong></td><td>YES</td><td>-</td><td>-</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                          <tr style={{ background: '#f8f9fa' }}><td></td><td>NO</td><td>YES</td><td>&lt; $650</td><td><span className="badge terminated">Not Eligible (Repair)</span></td></tr>
                          <tr><td></td><td>NO</td><td>YES</td><td>&ge; $650</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                          <tr style={{ background: '#e8f4fd' }}><td><strong>Electric Water Heater</strong></td><td>Any</td><td>Any</td><td>N/A</td><td><span className="badge active">Eligible for Heat Pump WH</span></td></tr>
                          <tr><td><strong>Central AC</strong></td><td>YES</td><td>-</td><td>-</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                          <tr style={{ background: '#f8f9fa' }}><td></td><td>NO</td><td>YES</td><td>&lt; $190/ton</td><td><span className="badge terminated">Not Eligible (Repair)</span></td></tr>
                          <tr><td></td><td>NO</td><td>YES</td><td>&ge; $190/ton</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                          <tr><td><strong>Room AC</strong></td><td>YES</td><td>-</td><td>-</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                          <tr style={{ background: '#f8f9fa' }}><td></td><td>NO</td><td>-</td><td>-</td><td><span className="badge terminated">Not Eligible</span></td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <h3 style={{ marginBottom: 10 }}>Health & Safety Measures</h3>
                  {measures.filter(m => m.category === 'Health & Safety').map(m => (
                    <div key={m.id} className="card" style={{ marginBottom: 8, padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{m.name}</strong>
                        {m.h_and_s_cap_exempt ? <span className="badge active" style={{ fontSize: 10 }}>Cap Exempt (Joint)</span> : null}
                      </div>
                      <p style={{ margin: '6px 0 0', color: '#666', fontSize: 13 }}>{m.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* PROCESS TAB */}
      {tab === 'process' && (
        <div>
          {processSteps.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 30, color: '#888' }}>
              No process steps loaded. Load HES IE rules from the Overview tab.
            </div>
          ) : (
            phases.map(phase => {
              const phaseSteps = processSteps.filter(s => s.phase === phase);
              const phaseColors = { Intake: '#0f3460', Assessment: '#e94560', Scope: '#f39c12', Installation: '#27ae60', Closeout: '#8e44ad', 'QA/QC': '#2c3e50' };
              const color = phaseColors[phase] || '#666';
              return (
                <div key={phase} style={{ marginBottom: 20 }}>
                  <h3 style={{ color, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: color, color: 'white', borderRadius: '50%', width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                      {phase.charAt(0)}
                    </span>
                    {phase}
                  </h3>
                  {phaseSteps.map(step => (
                    <div key={step.id} className="card" style={{ marginBottom: 8, padding: '14px 16px', borderLeft: `4px solid ${color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong>Step {step.step_number}: {step.title}</strong>
                          <p style={{ margin: '6px 0 0', color: '#666', fontSize: 13 }}>{step.description}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                        {step.required_certification && (
                          <div style={{ padding: '4px 10px', background: '#e8f4fd', borderRadius: 4, fontSize: 12 }}>
                            <strong>Cert:</strong> {step.required_certification}
                          </div>
                        )}
                        {step.required_forms && (
                          <div style={{ padding: '4px 10px', background: '#f0f0fe', borderRadius: 4, fontSize: 12 }}>
                            <strong>Forms:</strong> {step.required_forms}
                          </div>
                        )}
                        {step.timeline && (
                          <div style={{ padding: '4px 10px', background: '#fff3cd', borderRadius: 4, fontSize: 12 }}>
                            <strong>Timeline:</strong> {step.timeline}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* JOBS TAB - Admin/Operations full view */}
      {tab === 'jobs' && !['Assessor', 'Installer', 'HVAC'].includes(role) && (
        <div>
          {canEdit && (
            <div style={{ marginBottom: 15, display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => setShowJobModal(true)}>+ New Job</button>
            </div>
          )}

          {jobs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 30, color: '#888' }}>
              No jobs yet. Create a job to start tracking measures, photos, and paperwork.
            </div>
          ) : (
            jobs.map(job => {
              const isExpanded = expandedJob === job.id;
              const checklist = job.checklist || [];
              const totalItems = checklist.length;
              const completedItems = checklist.filter(c => c.completed).length;
              const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

              const photoItems = checklist.filter(c => c.item_type === 'photo');
              const paperItems = checklist.filter(c => c.item_type === 'paperwork');
              const jobPaperItems = checklist.filter(c => c.item_type === 'job_paperwork');

              return (
                <div key={job.id} className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
                  <div
                    style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                  >
                    <div>
                      <strong>{job.customer_name || 'Unnamed'}</strong>
                      {job.job_number && <span className="badge active" style={{ marginLeft: 8, fontSize: 10 }}>#{job.job_number}</span>}
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>{job.address}{job.city ? `, ${job.city}` : ''} {job.zip || ''}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: pct === 100 ? '#27ae60' : '#e94560' }}>{pct}% Complete</div>
                        <div style={{ width: 120, height: 6, background: '#eee', borderRadius: 3, marginTop: 4 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#27ae60' : '#e94560', borderRadius: 3 }} />
                        </div>
                      </div>
                      {canEdit && (
                        <select className="btn btn-sm" value={job.status} onClick={e => e.stopPropagation()}
                          onChange={e => { e.stopPropagation(); updateJobStatus(job, e.target.value); }}
                          style={{ padding: '2px 6px', fontSize: 11, maxWidth: 140 }}>
                          {JOB_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                      )}
                      <span style={{ color: '#888', fontSize: 18 }}>{isExpanded ? '\u25B2' : '\u25BC'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid #eee' }}>
                      {/* Basic Info */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 12 }}>
                        <div style={{ fontSize: 12 }}><strong>Contractor:</strong> Assured Energy Solutions</div>
                        <div style={{ fontSize: 12 }}><strong>Utility:</strong> {job.utility || '-'}</div>
                        <div style={{ fontSize: 12 }}><strong>Phone:</strong> {canEdit ? <input style={{ width: 120, fontSize: 11, padding: '2px 4px' }} defaultValue={job.phone || ''} placeholder="Phone" onBlur={e => updateJobField(job, 'phone', e.target.value)} /> : (job.phone || '-')}</div>
                        <div style={{ fontSize: 12 }}><strong>Email:</strong> {canEdit ? <input style={{ width: 160, fontSize: 11, padding: '2px 4px' }} defaultValue={job.email || ''} placeholder="Email" onBlur={e => updateJobField(job, 'email', e.target.value)} /> : (job.email || '-')}</div>
                        <div style={{ fontSize: 12 }}><strong>Estimate:</strong> {job.estimate_amount ? `$${Number(job.estimate_amount).toLocaleString()}` :
                          (canEdit ? <input type="number" style={{ width: 100, fontSize: 11, padding: '2px 4px' }} placeholder="$0.00"
                            onBlur={e => e.target.value && updateJobField(job, 'estimate_amount', parseFloat(e.target.value))} /> : '-')}</div>
                      </div>

                      {/* Scheduling Dates */}
                      <div style={{ marginTop: 14 }}>
                        <h4 style={{ fontSize: 13, color: '#0f3460', marginBottom: 8 }}>Scheduling & Install Dates</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                          {[
                            { label: 'Assessment Date', field: 'assessment_date' },
                            { label: 'Submission Date', field: 'submission_date' },
                            { label: 'ABC Install (Attic/Basement/Crawl)', field: 'abc_install_date' },
                            { label: 'Wall Injection Install', field: 'wall_injection_date' },
                            { label: 'Patch Job Date', field: 'patch_date' },
                            { label: 'HVAC Tune & Clean', field: 'hvac_tune_clean_date' },
                            { label: 'HVAC Replacement', field: 'hvac_replacement_date' },
                            { label: 'Final Inspection', field: 'inspection_date' },
                          ].map(({ label, field }) => (
                            <div key={field} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <strong style={{ minWidth: 180 }}>{label}:</strong>
                              {canEdit ? (
                                <input type="date" value={job[field] || ''} style={{ fontSize: 11, padding: '2px 4px' }}
                                  onChange={e => updateJobField(job, field, e.target.value)} />
                              ) : (
                                <span>{job[field] || '-'}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Permit Tracking */}
                      <div style={{ marginTop: 14, padding: 12, background: job.needs_permit ? '#fff8e1' : '#f9f9f9', borderRadius: 6, border: `1px solid ${job.needs_permit ? '#ffe082' : '#eee'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <h4 style={{ fontSize: 13, color: '#e65100', margin: 0 }}>Permit Tracking</h4>
                          {canEdit && (
                            <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                              <input type="checkbox" checked={!!job.needs_permit}
                                onChange={() => updateJobField(job, 'needs_permit', job.needs_permit ? 0 : 1)} />
                              Permit Required
                            </label>
                          )}
                        </div>
                        {job.needs_permit ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: 12 }}>
                            <div>
                              <strong>Status:</strong>{' '}
                              {canEdit ? (
                                <select value={job.permit_status || 'not_applied'} style={{ fontSize: 11, padding: '2px 4px' }}
                                  onChange={e => updateJobField(job, 'permit_status', e.target.value)}>
                                  <option value="not_applied">Not Applied</option>
                                  <option value="applied">Applied</option>
                                  <option value="received">Received</option>
                                  <option value="issue">Issue</option>
                                </select>
                              ) : (
                                <span className={`badge ${job.permit_status === 'received' ? 'active' : job.permit_status === 'issue' ? 'terminated' : 'pending'}`}>
                                  {(job.permit_status || 'not_applied').replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                            <div>
                              <strong>Applied:</strong>{' '}
                              {canEdit ? <input type="date" value={job.permit_applied_date || ''} style={{ fontSize: 11, padding: '2px 4px' }}
                                onChange={e => updateJobField(job, 'permit_applied_date', e.target.value)} /> : (job.permit_applied_date || '-')}
                            </div>
                            <div>
                              <strong>Received:</strong>{' '}
                              {canEdit ? <input type="date" value={job.permit_received_date || ''} style={{ fontSize: 11, padding: '2px 4px' }}
                                onChange={e => updateJobField(job, 'permit_received_date', e.target.value)} /> : (job.permit_received_date || '-')}
                            </div>
                            <div>
                              <strong>Permit #:</strong>{' '}
                              {canEdit ? <input value={job.permit_number || ''} style={{ width: 100, fontSize: 11, padding: '2px 4px' }} placeholder="Permit #"
                                onBlur={e => updateJobField(job, 'permit_number', e.target.value)} defaultValue={job.permit_number || ''} /> : (job.permit_number || '-')}
                            </div>
                            <div>
                              <strong>Jurisdiction:</strong>{' '}
                              {canEdit ? <input style={{ width: 120, fontSize: 11, padding: '2px 4px' }} placeholder="City/County"
                                onBlur={e => e.target.value && updateJobField(job, 'permit_jurisdiction', e.target.value)} defaultValue={job.permit_jurisdiction || ''} /> : (job.permit_jurisdiction || '-')}
                            </div>
                            {job.permit_notes && <div style={{ gridColumn: '1 / -1' }}><strong>Notes:</strong> {job.permit_notes}</div>}
                            {canEdit && !job.permit_notes && (
                              <div style={{ gridColumn: '1 / -1' }}>
                                <input style={{ width: '100%', fontSize: 11, padding: '2px 4px' }} placeholder="Permit notes..."
                                  onBlur={e => e.target.value && updateJobField(job, 'permit_notes', e.target.value)} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: '#888' }}>No permit needed for this job. Check the box above during scope creation if one is identified.</div>
                        )}
                      </div>

                      {/* ASSESSMENT DATA - Energy Assessment Field Data Tool */}
                      <div style={{ marginTop: 14 }}>
                        <div
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#4a6741', color: '#fff', borderRadius: assessmentOpen === job.id ? '6px 6px 0 0' : 6, cursor: 'pointer' }}
                          onClick={() => setAssessmentOpen(assessmentOpen === job.id ? null : job.id)}
                        >
                          <h4 style={{ margin: 0, fontSize: 14 }}>Energy Assessment Field Data</h4>
                          <span>{assessmentOpen === job.id ? '\u25B2' : '\u25BC'}</span>
                        </div>
                        {assessmentOpen === job.id && (() => {
                          const ad = getAssessment(job);
                          const set = (section, field, val) => {
                            const updated = { ...ad, [section]: { ...(ad[section] || {}), [field]: val } };
                            saveAssessment(job.id, updated);
                          };
                          const v = (section, field) => (ad[section] || {})[field] || '';
                          const yn = (section, field) => (
                            <span style={{ display: 'inline-flex', gap: 4 }}>
                              <label style={{ fontSize: 11 }}><input type="radio" name={`${job.id}-${section}-${field}`} checked={v(section, field) === 'yes'} onChange={() => set(section, field, 'yes')} disabled={!canEdit} /> yes</label>
                              <label style={{ fontSize: 11 }}><input type="radio" name={`${job.id}-${section}-${field}`} checked={v(section, field) === 'no'} onChange={() => set(section, field, 'no')} disabled={!canEdit} /> no</label>
                            </span>
                          );
                          const txt = (section, field, placeholder, width) => (
                            <input style={{ width: width || 100, fontSize: 11, padding: '2px 4px', border: '1px solid #ccc', borderRadius: 3 }}
                              defaultValue={v(section, field)} placeholder={placeholder} disabled={!canEdit}
                              onBlur={e => set(section, field, e.target.value)} />
                          );
                          const sel = (section, field, options) => (
                            <select style={{ fontSize: 11, padding: '2px 4px' }} value={v(section, field)} disabled={!canEdit}
                              onChange={e => set(section, field, e.target.value)}>
                              <option value="">--</option>
                              {options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          );
                          const sectionStyle = { padding: '10px 12px', borderBottom: '1px solid #ddd' };
                          const headerStyle = { background: '#8a8a8a', color: '#fff', padding: '6px 12px', fontWeight: 700, fontSize: 13 };
                          const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px 16px', fontSize: 12 };
                          const fieldStyle = { display: 'flex', alignItems: 'center', gap: 4, padding: '3px 0' };

                          return (
                            <div style={{ border: '1px solid #ccc', borderTop: 'none', borderRadius: '0 0 6px 6px', background: '#fff' }}>
                              {/* Header Info */}
                              <div style={sectionStyle}>
                                <div style={gridStyle}>
                                  <div style={fieldStyle}><strong>Completed By:</strong> {txt('header', 'completed_by', 'Name', 140)}</div>
                                  <div style={fieldStyle}><strong>Date:</strong> <input type="date" style={{ fontSize: 11, padding: '2px 4px' }} value={v('header', 'date')} disabled={!canEdit} onChange={e => set('header', 'date', e.target.value)} /></div>
                                </div>
                              </div>

                              {/* EXTERIOR INSPECTION */}
                              <div style={headerStyle}>EXTERIOR INSPECTION</div>
                              <div style={sectionStyle}>
                                <div style={gridStyle}>
                                  <div style={fieldStyle}><strong>Style:</strong> {txt('exterior', 'style', 'Ranch, Colonial...', 120)}</div>
                                  <div style={fieldStyle}><strong>Est. Year Built:</strong> {txt('exterior', 'year_built', 'Year', 60)}</div>
                                  <div style={fieldStyle}><strong>Stories:</strong> {txt('exterior', 'stories', '#', 40)}</div>
                                  <div style={fieldStyle}><strong># Bedrooms:</strong> {txt('exterior', 'bedrooms', '#', 40)}</div>
                                  <div style={fieldStyle}><strong>Sq Footage:</strong> {txt('exterior', 'sq_footage', 'sqft', 70)}</div>
                                  <div style={fieldStyle}><strong>Volume:</strong> {txt('exterior', 'volume', 'cuft', 70)}</div>
                                </div>
                                <div style={{ ...gridStyle, marginTop: 8 }}>
                                  <div style={fieldStyle}><strong>Gutters:</strong> {yn('exterior', 'gutters')} <strong style={{ marginLeft: 8 }}>Condition:</strong> {sel('exterior', 'gutter_condition', ['good', 'poor'])}</div>
                                  <div style={fieldStyle}><strong>Downspouts:</strong> {yn('exterior', 'downspouts')} <strong style={{ marginLeft: 8 }}>Repairs:</strong> {yn('exterior', 'gutter_repairs')}</div>
                                  <div style={fieldStyle}><strong>Roof Condition:</strong> {sel('exterior', 'roof_condition', ['good', 'average', 'poor'])}</div>
                                  <div style={fieldStyle}><strong>Roof Type:</strong> {sel('exterior', 'roof_type', ['Architecture', '3-Tab', 'Flat'])}</div>
                                  <div style={fieldStyle}><strong>Roof Age:</strong> {txt('exterior', 'roof_age', 'years', 50)}</div>
                                  <div style={fieldStyle}><strong>Roof Repair:</strong> {yn('exterior', 'roof_repair')}</div>
                                  <div style={fieldStyle}><strong>High Roof Venting:</strong> {yn('exterior', 'high_roof_venting')} <strong style={{ marginLeft: 6 }}>Type:</strong> {sel('exterior', 'vent_type', ['static', 'ridge'])}</div>
                                  <div style={fieldStyle}><strong>Chimney:</strong> {sel('exterior', 'chimney', ['brick', 'metal', 'none'])}</div>
                                  <div style={fieldStyle}><strong>Soffit Present:</strong> {yn('exterior', 'soffit')} <strong style={{ marginLeft: 6 }}>Condition:</strong> {sel('exterior', 'soffit_condition', ['good', 'poor'])}</div>
                                  <div style={fieldStyle}><strong>Soffit Vents:</strong> {yn('exterior', 'soffit_vents')}</div>
                                  <div style={fieldStyle}><strong>Soffit Chutes/Baffles:</strong> {txt('exterior', 'soffit_chutes', 'Qty needed', 80)}</div>
                                </div>
                                <div style={{ marginTop: 6 }}><strong style={{ fontSize: 12 }}>Exterior Notes:</strong> {txt('exterior', 'notes', 'Notes...', '100%')}</div>
                              </div>

                              {/* INTERIOR INSPECTION */}
                              <div style={headerStyle}>INTERIOR INSPECTION</div>
                              <div style={sectionStyle}>
                                <div style={gridStyle}>
                                  <div style={fieldStyle}><strong>Mold:</strong> {yn('interior', 'mold')}</div>
                                  <div style={fieldStyle}><strong>Broken Glass:</strong> {yn('interior', 'broken_glass')}</div>
                                  <div style={fieldStyle}><strong>Live Knob & Tube:</strong> {yn('interior', 'knob_tube')}</div>
                                  <div style={fieldStyle}><strong>Wiring Issues:</strong> {yn('interior', 'wiring_issues')}</div>
                                  <div style={fieldStyle}><strong>Moisture Problems:</strong> {yn('interior', 'moisture')}</div>
                                  <div style={fieldStyle}><strong>Water Leaks:</strong> {yn('interior', 'water_leaks')}</div>
                                  <div style={fieldStyle}><strong>Roof Leaks:</strong> {yn('interior', 'roof_leaks')}</div>
                                  <div style={fieldStyle}><strong>Drop Ceiling:</strong> {yn('interior', 'drop_ceiling')}</div>
                                  <div style={fieldStyle}><strong>Ceiling Condition:</strong> {sel('interior', 'ceiling_condition', ['good', 'poor'])}</div>
                                  <div style={fieldStyle}><strong>Wall Condition:</strong> {txt('interior', 'wall_condition', 'Condition', 100)}</div>
                                  <div style={fieldStyle}><strong>Smoke Detector:</strong> {yn('interior', 'smoke_detector')}</div>
                                  <div style={fieldStyle}><strong>Drywall Repair:</strong> {yn('interior', 'drywall_repair')}</div>
                                  <div style={fieldStyle}><strong>CO Detector:</strong> {yn('interior', 'co_detector')}</div>
                                  <div style={fieldStyle}><strong>Recessed Lighting:</strong> {yn('interior', 'recessed_lighting')}</div>
                                  <div style={fieldStyle}><strong>Dryer Vented Properly:</strong> {yn('interior', 'dryer_vented')}</div>
                                </div>
                                <div style={{ marginTop: 6 }}><strong style={{ fontSize: 12 }}>Interior Notes:</strong> {txt('interior', 'notes', 'Notes...', '100%')}</div>
                              </div>

                              {/* DIRECT INSTALLS */}
                              <div style={headerStyle}>DIRECT INSTALLS</div>
                              <div style={sectionStyle}>
                                <div style={gridStyle}>
                                  <div style={fieldStyle}><strong>Smoke Detector Qty:</strong> {txt('direct_install', 'smoke_qty', '#', 40)}</div>
                                  <div style={fieldStyle}><strong>CO Detector Qty:</strong> {txt('direct_install', 'co_qty', '#', 40)}</div>
                                  <div style={fieldStyle}><strong>Total:</strong> {txt('direct_install', 'total', '#', 40)}</div>
                                </div>
                              </div>

                              {/* DOOR TYPES */}
                              <div style={headerStyle}>DOOR TYPES</div>
                              <div style={sectionStyle}>
                                <div style={gridStyle}>
                                  {['Front', 'Back', 'Basement', 'Attic'].map(door => (
                                    <div key={door} style={fieldStyle}><strong>{door}:</strong> {yn('doors', door.toLowerCase())} <span style={{ marginLeft: 6 }}>Weather Strip:</span> {yn('doors', `${door.toLowerCase()}_strip`)}</div>
                                  ))}
                                  <div style={fieldStyle}><strong>Other:</strong> {txt('doors', 'other', 'Type', 80)}</div>
                                  <div style={fieldStyle}><strong>Total WS/Sweep Needed:</strong> {txt('doors', 'total_ws', '#', 40)}</div>
                                </div>
                              </div>

                              {/* HATCHES */}
                              <div style={headerStyle}>HATCHES</div>
                              <div style={sectionStyle}>
                                {['Scuttle', 'Knee Wall', 'Pull Down', 'Walk Up'].map(h => (
                                  <div key={h} style={{ ...fieldStyle, marginBottom: 4 }}>
                                    <strong style={{ minWidth: 80 }}>{h}:</strong>
                                    <span>Loc:</span> {txt('hatches', `${h.toLowerCase().replace(/ /g,'_')}_loc`, 'Location', 80)}
                                    <span>Qty:</span> {txt('hatches', `${h.toLowerCase().replace(/ /g,'_')}_qty`, '#', 30)}
                                    <span>R-Val:</span> {txt('hatches', `${h.toLowerCase().replace(/ /g,'_')}_rval`, 'R', 40)}
                                    <span>Add:</span> {txt('hatches', `${h.toLowerCase().replace(/ /g,'_')}_add`, 'R', 40)}
                                  </div>
                                ))}
                                <div style={{ marginTop: 4 }}><strong style={{ fontSize: 12 }}>Hatches Notes:</strong> {txt('hatches', 'notes', 'Notes...', '100%')}</div>
                              </div>

                              {/* ATTIC */}
                              <div style={headerStyle}>ATTIC</div>
                              <div style={sectionStyle}>
                                <div style={gridStyle}>
                                  <div style={fieldStyle}><strong>Type:</strong> {sel('attic', 'type', ['Finished', 'Unfinished', 'Flat'])}</div>
                                  <div style={fieldStyle}><strong>Pre R-Value:</strong> {txt('attic', 'pre_r_value', 'R', 40)}</div>
                                  <div style={fieldStyle}><strong>Sq Footage:</strong> {txt('attic', 'sq_footage', 'sqft', 60)}</div>
                                  <div style={fieldStyle}><strong>R to Add:</strong> {txt('attic', 'r_to_add', 'R', 40)}</div>
                                  <div style={fieldStyle}><strong>Recessed Lights:</strong> {yn('attic', 'recessed_lights')} Qty: {txt('attic', 'recessed_qty', '#', 30)}</div>
                                  <div style={fieldStyle}><strong>Ductwork:</strong> {yn('attic', 'ductwork')} <strong style={{ marginLeft: 6 }}>Condition:</strong> {sel('attic', 'duct_condition', ['good', 'poor'])}</div>
                                  <div style={fieldStyle}><strong>Lin Ft Duct to Seal:</strong> {txt('attic', 'duct_lin_ft', 'ft', 50)}</div>
                                  <div style={fieldStyle}><strong>Floor Boards:</strong> {yn('attic', 'floor_boards')}</div>
                                </div>
                                <div style={{ marginTop: 6 }}><strong style={{ fontSize: 12 }}>Attic Notes:</strong> {txt('attic', 'notes', 'Notes...', '100%')}</div>
                              </div>

                              {/* FOUNDATION */}
                              <div style={headerStyle}>FOUNDATION</div>
                              <div style={sectionStyle}>
                                <div style={gridStyle}>
                                  <div style={fieldStyle}><strong>Basement:</strong> {sel('foundation', 'basement_type', ['Finished', 'Unfinished w/framing', 'Unfinished', 'No basement/slab'])}</div>
                                  <div style={fieldStyle}><strong>Above Grade SqFt:</strong> {txt('foundation', 'above_grade_sqft', 'sqft', 60)}</div>
                                  <div style={fieldStyle}><strong>Below Grade SqFt:</strong> {txt('foundation', 'below_grade_sqft', 'sqft', 60)}</div>
                                  <div style={fieldStyle}><strong>Pre R-Value:</strong> {txt('foundation', 'pre_r_value', 'R', 40)}</div>
                                  <div style={fieldStyle}><strong>Insulation:</strong> {sel('foundation', 'insulation_type', ['Fiberglass', 'Rigid Foam Board', 'None'])}</div>
                                  <div style={fieldStyle}><strong>Band Joints Access:</strong> {yn('foundation', 'band_joints')}</div>
                                  <div style={fieldStyle}><strong>Linear Ft:</strong> {txt('foundation', 'linear_ft', 'ft', 50)}</div>
                                  <div style={fieldStyle}><strong>Plaster/Lath:</strong> {yn('foundation', 'plaster_lath')}</div>
                                  <div style={fieldStyle}><strong>Balloon Const:</strong> {yn('foundation', 'balloon_const')}</div>
                                  <div style={fieldStyle}><strong>Asbestos Pipe:</strong> {yn('foundation', 'asbestos')} {v('foundation', 'asbestos') === 'yes' && <span>Tested: {txt('foundation', 'asbestos_tested', 'Result', 80)}</span>}</div>
                                  <div style={fieldStyle}><strong>Ductwork:</strong> {yn('foundation', 'ductwork')} <strong style={{ marginLeft: 6 }}>Condition:</strong> {sel('foundation', 'duct_condition', ['good', 'poor'])}</div>
                                  <div style={fieldStyle}><strong>Lin Ft Duct to Seal:</strong> {txt('foundation', 'duct_lin_ft', 'ft', 50)}</div>
                                </div>
                                <div style={{ marginTop: 6 }}><strong style={{ fontSize: 12 }}>Foundation Notes:</strong> {txt('foundation', 'notes', 'Notes...', '100%')}</div>
                              </div>

                              {/* CRAWLSPACE */}
                              <div style={headerStyle}>CRAWLSPACE</div>
                              <div style={sectionStyle}>
                                <div style={gridStyle}>
                                  <div style={fieldStyle}><strong>Vented:</strong> {yn('crawlspace', 'vented')} # Vents: {txt('crawlspace', 'num_vents', '#', 30)}</div>
                                  <div style={fieldStyle}><strong>Floor:</strong> {sel('crawlspace', 'floor_type', ['Concrete', 'Dirt/Gravel'])}</div>
                                  <div style={fieldStyle}><strong>Vapor Barrier:</strong> {yn('crawlspace', 'vapor_barrier')} SqFt: {txt('crawlspace', 'vapor_sqft', 'sqft', 50)}</div>
                                  <div style={fieldStyle}><strong>Water Issues:</strong> {yn('crawlspace', 'water_issues')}</div>
                                  <div style={fieldStyle}><strong>Ductwork:</strong> {yn('crawlspace', 'ductwork')} <strong style={{ marginLeft: 6 }}>Condition:</strong> {sel('crawlspace', 'duct_condition', ['good', 'poor'])}</div>
                                  <div style={fieldStyle}><strong>Lin Ft Duct to Seal:</strong> {txt('crawlspace', 'duct_lin_ft', 'ft', 50)}</div>
                                  <div style={fieldStyle}><strong>Above Grade SqFt:</strong> {txt('crawlspace', 'above_grade', 'sqft', 60)}</div>
                                  <div style={fieldStyle}><strong>Below Grade SqFt:</strong> {txt('crawlspace', 'below_grade', 'sqft', 60)}</div>
                                  <div style={fieldStyle}><strong>Pre R-Value:</strong> {txt('crawlspace', 'pre_r_value', 'R', 40)}</div>
                                  <div style={fieldStyle}><strong>Insulation:</strong> {sel('crawlspace', 'insulation_type', ['Fiberglass', 'Rigid Foam Board', 'None'])}</div>
                                  <div style={fieldStyle}><strong>Band Joints Access:</strong> {yn('crawlspace', 'band_joints')}</div>
                                </div>
                                <div style={{ marginTop: 6 }}><strong style={{ fontSize: 12 }}>Crawlspace Notes:</strong> {txt('crawlspace', 'notes', 'Notes...', '100%')}</div>
                              </div>

                              {/* EXTERIOR WALLS */}
                              <div style={headerStyle}>EXTERIOR WALLS</div>
                              <div style={sectionStyle}>
                                {['1st Floor', '2nd Floor'].map(floor => (
                                  <div key={floor} style={{ marginBottom: 10 }}>
                                    <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{floor}</div>
                                    <div style={gridStyle}>
                                      <div style={fieldStyle}><strong>Pre R-Value:</strong> {txt('walls', `${floor}_r_value`, 'R', 40)}</div>
                                      <div style={fieldStyle}><strong>Wall SqFt:</strong> {txt('walls', `${floor}_wall_sqft`, 'sqft', 60)}</div>
                                      <div style={fieldStyle}><strong>R to Add:</strong> {txt('walls', `${floor}_r_add`, 'R', 40)}</div>
                                      <div style={fieldStyle}><strong>Window/Door SqFt:</strong> {txt('walls', `${floor}_window_sqft`, 'sqft', 60)}</div>
                                      <div style={fieldStyle}><strong>Cladding:</strong> {sel('walls', `${floor}_cladding`, ['Stucco', 'Wood Lap', 'Asbestos Shingle', 'Masonry', 'Aluminum', 'Vinyl', 'Other'])}</div>
                                      <div style={fieldStyle}><strong>Wall Type:</strong> {sel('walls', `${floor}_wall_type`, ['Drywall', 'Plaster'])}</div>
                                      <div style={fieldStyle}><strong>Insulate From:</strong> {sel('walls', `${floor}_insulate_from`, ['Interior', 'Exterior'])}</div>
                                      <div style={fieldStyle}><strong>Dense Pack:</strong> {yn('walls', `${floor}_dense_pack`)}</div>
                                    </div>
                                  </div>
                                ))}
                                <div style={{ marginTop: 4 }}>
                                  <div style={fieldStyle}><strong>Spoke to Owner re: Wall Prep:</strong> {yn('walls', 'spoke_owner')}</div>
                                  <div style={fieldStyle}><strong>Drilled Hole Location:</strong> {txt('walls', 'drill_location', 'Location', 200)}</div>
                                </div>
                                <div style={{ marginTop: 6 }}><strong style={{ fontSize: 12 }}>Wall Notes:</strong> {txt('walls', 'notes', 'Notes...', '100%')}</div>
                              </div>

                              {/* KNEE WALLS */}
                              <div style={headerStyle}>KNEE WALLS</div>
                              <div style={sectionStyle}>
                                <div style={gridStyle}>
                                  <div style={fieldStyle}><strong>Pre R-Value:</strong> {txt('knee_walls', 'pre_r_value', 'R', 40)}</div>
                                  <div style={fieldStyle}><strong>Sq Footage:</strong> {txt('knee_walls', 'sq_footage', 'sqft', 60)}</div>
                                  <div style={fieldStyle}><strong>Plumbing Wall:</strong> {yn('knee_walls', 'plumbing_wall')}</div>
                                  <div style={fieldStyle}><strong>R to Add:</strong> {txt('knee_walls', 'r_to_add', 'R', 40)}</div>
                                  <div style={fieldStyle}><strong>Dense Pack:</strong> {yn('knee_walls', 'dense_pack')}</div>
                                  <div style={fieldStyle}><strong>Rigid Foam:</strong> {yn('knee_walls', 'rigid_foam')}</div>
                                  <div style={fieldStyle}><strong>Fiberglass:</strong> {yn('knee_walls', 'fiberglass')}</div>
                                  <div style={fieldStyle}><strong>Wall Type:</strong> {sel('knee_walls', 'wall_type', ['Drywall', 'Plaster'])}</div>
                                </div>
                              </div>

                              {/* MECHANICAL EQUIPMENT */}
                              <div style={headerStyle}>MECHANICAL EQUIPMENT</div>
                              <div style={sectionStyle}>
                                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Furnace / Boiler</div>
                                <div style={gridStyle}>
                                  <div style={fieldStyle}><strong>Type:</strong> {sel('mechanical', 'heating_type', ['Gas Furnace', 'Boiler', 'Electric', 'Heat Pump', 'Other'])}</div>
                                  <div style={fieldStyle}><strong>Make:</strong> {txt('mechanical', 'heating_make', 'Make', 100)}</div>
                                  <div style={fieldStyle}><strong>Model:</strong> {txt('mechanical', 'heating_model', 'Model', 100)}</div>
                                  <div style={fieldStyle}><strong>Age/Year:</strong> {txt('mechanical', 'heating_age', 'Year', 60)}</div>
                                  <div style={fieldStyle}><strong>Condition:</strong> {sel('mechanical', 'heating_condition', ['Good', 'Fair', 'Poor', 'Failed'])}</div>
                                  <div style={fieldStyle}><strong>Efficiency:</strong> {txt('mechanical', 'heating_efficiency', '%', 50)}</div>
                                  <div style={fieldStyle}><strong>Last Serviced:</strong> {txt('mechanical', 'heating_last_service', 'Year or N/A', 80)}</div>
                                  <div style={fieldStyle}><strong>Tune & Clean Recommended:</strong> {yn('mechanical', 'tune_clean_recommended')}</div>
                                </div>
                                <div style={{ fontWeight: 600, fontSize: 12, marginTop: 10, marginBottom: 6 }}>Water Heater</div>
                                <div style={gridStyle}>
                                  <div style={fieldStyle}><strong>Type:</strong> {sel('mechanical', 'wh_type', ['Gas', 'Electric', 'Tankless', 'Heat Pump WH'])}</div>
                                  <div style={fieldStyle}><strong>Make:</strong> {txt('mechanical', 'wh_make', 'Make', 100)}</div>
                                  <div style={fieldStyle}><strong>Model:</strong> {txt('mechanical', 'wh_model', 'Model', 100)}</div>
                                  <div style={fieldStyle}><strong>Age/Year:</strong> {txt('mechanical', 'wh_age', 'Year', 60)}</div>
                                  <div style={fieldStyle}><strong>Condition:</strong> {sel('mechanical', 'wh_condition', ['Good', 'Fair', 'Poor', 'Failed'])}</div>
                                </div>
                                <div style={{ fontWeight: 600, fontSize: 12, marginTop: 10, marginBottom: 6 }}>Central Air / Cooling</div>
                                <div style={gridStyle}>
                                  <div style={fieldStyle}><strong>Type:</strong> {sel('mechanical', 'cooling_type', ['Central AC', 'Room AC', 'Heat Pump', 'None'])}</div>
                                  <div style={fieldStyle}><strong>Make:</strong> {txt('mechanical', 'cooling_make', 'Make', 100)}</div>
                                  <div style={fieldStyle}><strong>SEER:</strong> {txt('mechanical', 'cooling_seer', 'SEER', 50)}</div>
                                  <div style={fieldStyle}><strong>Age/Year:</strong> {txt('mechanical', 'cooling_age', 'Year', 60)}</div>
                                  <div style={fieldStyle}><strong>Condition:</strong> {sel('mechanical', 'cooling_condition', ['Good', 'Fair', 'Poor', 'Failed'])}</div>
                                </div>
                                <div style={{ fontWeight: 600, fontSize: 12, marginTop: 10, marginBottom: 6 }}>Thermostat</div>
                                <div style={gridStyle}>
                                  <div style={fieldStyle}><strong>Type:</strong> {sel('mechanical', 'thermostat_type', ['Manual', 'Programmable', 'Smart/Advanced'])}</div>
                                  <div style={fieldStyle}><strong>Condition:</strong> {sel('mechanical', 'thermostat_condition', ['Good', 'Poor'])}</div>
                                </div>
                                <div style={{ marginTop: 6 }}><strong style={{ fontSize: 12 }}>Mechanical Notes:</strong> {txt('mechanical', 'notes', 'Notes...', '100%')}</div>
                              </div>

                              {/* BLOWER DOOR / DIAGNOSTICS */}
                              <div style={headerStyle}>DIAGNOSTIC TESTING</div>
                              <div style={sectionStyle}>
                                <div style={gridStyle}>
                                  <div style={fieldStyle}><strong>Pre Blower Door (CFM50):</strong> {txt('diagnostics', 'pre_cfm50', 'CFM50', 70)}</div>
                                  <div style={fieldStyle}><strong>Post Blower Door (CFM50):</strong> {txt('diagnostics', 'post_cfm50', 'CFM50', 70)}</div>
                                  <div style={fieldStyle}><strong>% Reduction:</strong> {txt('diagnostics', 'cfm50_reduction', '%', 50)}</div>
                                  <div style={fieldStyle}><strong>Pre Duct Blaster (CFM25):</strong> {txt('diagnostics', 'pre_cfm25', 'CFM25', 70)}</div>
                                  <div style={fieldStyle}><strong>Post Duct Blaster (CFM25):</strong> {txt('diagnostics', 'post_cfm25', 'CFM25', 70)}</div>
                                  <div style={fieldStyle}><strong>Combustion Pre:</strong> {txt('diagnostics', 'combustion_pre', 'Efficiency %', 70)}</div>
                                  <div style={fieldStyle}><strong>Combustion Post:</strong> {txt('diagnostics', 'combustion_post', 'Efficiency %', 70)}</div>
                                  <div style={fieldStyle}><strong>CO Test Result:</strong> {txt('diagnostics', 'co_test', 'ppm', 60)}</div>
                                </div>
                              </div>

                              {/* ASSESSOR RECOMMENDATIONS */}
                              <div style={{ ...headerStyle, background: '#4a6741' }}>ASSESSOR RECOMMENDATIONS</div>
                              <div style={{ ...sectionStyle, borderBottom: 'none' }}>
                                <div style={gridStyle}>
                                  <div style={fieldStyle}><strong>Attic Insulation:</strong> {yn('recommendations', 'attic_insulation')}</div>
                                  <div style={fieldStyle}><strong>Wall Insulation:</strong> {yn('recommendations', 'wall_insulation')}</div>
                                  <div style={fieldStyle}><strong>Basement/Crawl Insulation:</strong> {yn('recommendations', 'basement_insulation')}</div>
                                  <div style={fieldStyle}><strong>Air Sealing:</strong> {yn('recommendations', 'air_sealing')}</div>
                                  <div style={fieldStyle}><strong>Duct Sealing:</strong> {yn('recommendations', 'duct_sealing')}</div>
                                  <div style={fieldStyle}><strong>Rim Joist:</strong> {yn('recommendations', 'rim_joist')}</div>
                                  <div style={fieldStyle}><strong>HVAC Tune & Clean:</strong> {yn('recommendations', 'hvac_tune_clean')}</div>
                                  <div style={fieldStyle}><strong>Thermostat Upgrade:</strong> {yn('recommendations', 'thermostat')}</div>
                                  <div style={fieldStyle}><strong>Exhaust Fans:</strong> {yn('recommendations', 'exhaust_fans')}</div>
                                  <div style={fieldStyle}><strong>Smoke/CO Detectors:</strong> {yn('recommendations', 'detectors')}</div>
                                  <div style={fieldStyle}><strong>H&S Repairs Needed:</strong> {yn('recommendations', 'hs_repairs')}</div>
                                  <div style={fieldStyle}><strong>Deferral Conditions:</strong> {yn('recommendations', 'deferral')}</div>
                                </div>
                                <div style={{ marginTop: 8 }}>
                                  <strong style={{ fontSize: 12 }}>Recommendation Details / Notes:</strong>
                                  <textarea style={{ width: '100%', fontSize: 11, padding: 4, minHeight: 80, marginTop: 4, border: '1px solid #ccc', borderRadius: 3 }}
                                    defaultValue={v('recommendations', 'details')} placeholder="Assessor notes, recommendations, concerns, deferral reasons..."
                                    disabled={!canEdit} onBlur={e => set('recommendations', 'details', e.target.value)} />
                                </div>
                                <div style={{ marginTop: 6 }}>
                                  <strong style={{ fontSize: 12 }}>Deferral Reason (if applicable):</strong>
                                  <textarea style={{ width: '100%', fontSize: 11, padding: 4, minHeight: 40, marginTop: 4, border: '1px solid #ccc', borderRadius: 3 }}
                                    defaultValue={v('recommendations', 'deferral_reason')} placeholder="Cite specific deferral condition..."
                                    disabled={!canEdit} onBlur={e => set('recommendations', 'deferral_reason', e.target.value)} />
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* SCOPE OF WORK BUILDER */}
                      <div style={{ marginTop: 14 }}>
                        <div
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#0f3460', color: '#fff', borderRadius: scopeOpen === job.id ? '6px 6px 0 0' : 6, cursor: 'pointer' }}
                          onClick={() => setScopeOpen(scopeOpen === job.id ? null : job.id)}
                        >
                          <h4 style={{ margin: 0, fontSize: 14 }}>Scope of Work</h4>
                          <span>{scopeOpen === job.id ? '\u25B2' : '\u25BC'}</span>
                        </div>
                        {scopeOpen === job.id && (() => {
                          const sc = getScope(job);
                          const ad = getAssessment(job);
                          const setScope = (field, val) => {
                            const updated = { ...sc, [field]: val };
                            saveScope(job.id, updated);
                          };
                          const toggleMeasure = (measureName) => {
                            const current = sc.selected_measures || [];
                            const updated = current.includes(measureName)
                              ? current.filter(m => m !== measureName)
                              : [...current, measureName];
                            setScope('selected_measures', updated);
                          };
                          const selected = sc.selected_measures || [];

                          // Auto-suggest based on assessment data
                          const suggestions = [];
                          if (ad.attic && Number(ad.attic.pre_r_value) <= 19 && Number(ad.attic.pre_r_value) > 0) suggestions.push('Attic Insulation');
                          if (ad.foundation && ad.foundation.insulation_type === 'None') suggestions.push('Basement/Crawlspace Wall Insulation');
                          if (ad.foundation && ad.foundation.band_joints === 'yes') suggestions.push('Rim Joist Insulation');
                          if (ad.crawlspace && ad.crawlspace.insulation_type === 'None') suggestions.push('Floor Insulation Above Crawlspace');
                          if (ad.walls && (ad.walls['1st Floor_r_value'] === '0' || ad.walls['1st Floor_r_value'] === '')) suggestions.push('Wall Insulation');
                          if (ad.knee_walls && ad.knee_walls.pre_r_value && Number(ad.knee_walls.pre_r_value) < 11) suggestions.push('Wall Insulation (Knee Wall)');
                          if (ad.exterior && Number(ad.exterior.sq_footage) >= 110) suggestions.push('Air Sealing');
                          if (ad.attic && ad.attic.ductwork === 'yes' && ad.attic.duct_condition === 'poor') suggestions.push('Duct Sealing');
                          if (ad.foundation && ad.foundation.ductwork === 'yes' && ad.foundation.duct_condition === 'poor') suggestions.push('Duct Sealing');
                          if (ad.interior && ad.interior.smoke_detector === 'no') suggestions.push('Smoke Detector - Change Out');
                          if (ad.interior && ad.interior.co_detector === 'no') suggestions.push('CO Detector');
                          if (ad.interior && ad.interior.dryer_vented === 'no') suggestions.push('Dryer Vent Pipe');

                          return (
                            <div style={{ border: '1px solid #ccc', borderTop: 'none', borderRadius: '0 0 6px 6px', padding: 12, background: '#fff' }}>
                              {suggestions.length > 0 && (
                                <div style={{ marginBottom: 12, padding: 10, background: '#fff8e1', borderRadius: 6, border: '1px solid #ffe082' }}>
                                  <div style={{ fontWeight: 600, fontSize: 12, color: '#e65100', marginBottom: 6 }}>Suggested from Assessment:</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {suggestions.map(s => (
                                      <button key={s} className={`btn btn-sm ${selected.includes(s) ? 'btn-success' : 'btn-secondary'}`}
                                        style={{ fontSize: 11, padding: '3px 8px' }}
                                        onClick={() => toggleMeasure(s)} disabled={!canEdit}>
                                        {selected.includes(s) ? '\u2713 ' : '+ '}{s}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>All Available Measures:</div>
                              {categories.map(cat => (
                                <div key={cat} style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#666', padding: '4px 0', borderBottom: '1px solid #eee' }}>{cat}</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                    {measures.filter(m => m.category === cat).map(m => (
                                      <label key={m.id} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', background: selected.includes(m.name) ? '#e8fde8' : '#f5f5f5', borderRadius: 4, cursor: canEdit ? 'pointer' : 'default', border: selected.includes(m.name) ? '1px solid #27ae60' : '1px solid #ddd' }}>
                                        <input type="checkbox" checked={selected.includes(m.name)} onChange={() => toggleMeasure(m.name)} disabled={!canEdit} style={{ margin: 0 }} />
                                        {m.name}
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}

                              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                  <strong style={{ fontSize: 12 }}>Scope Notes:</strong>
                                  <textarea style={{ width: '100%', fontSize: 11, padding: 4, minHeight: 60, marginTop: 4 }}
                                    defaultValue={sc.scope_notes || ''} placeholder="Additional scope notes..."
                                    disabled={!canEdit} onBlur={e => setScope('scope_notes', e.target.value)} />
                                </div>
                                <div>
                                  <strong style={{ fontSize: 12 }}>Selected ({selected.length}):</strong>
                                  <div style={{ marginTop: 4, fontSize: 11, color: '#333' }}>
                                    {selected.length > 0 ? selected.map((m, i) => <div key={i} style={{ padding: '2px 0' }}>- {m}</div>) : <span style={{ color: '#888' }}>No measures selected</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Job-Level Paperwork */}
                      {jobPaperItems.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <h4 style={{ fontSize: 13, color: '#0f3460', marginBottom: 8 }}>
                            Job Paperwork ({jobPaperItems.filter(c => c.completed).length}/{jobPaperItems.length})
                          </h4>
                          {jobPaperItems.map(item => (
                            <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', fontSize: 13 }}>
                              <input type="checkbox" checked={!!item.completed} onChange={() => toggleChecklist(item)} disabled={!canEdit} />
                              <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#888' : '#333' }}>
                                {item.description}
                              </span>
                              {item.completed_date && <span style={{ fontSize: 11, color: '#888', marginLeft: 'auto' }}>{item.completed_date}</span>}
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Measure-Level Photo Requirements */}
                      {photoItems.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <h4 style={{ fontSize: 13, color: '#e94560', marginBottom: 8 }}>
                            Photo Checklist ({photoItems.filter(c => c.completed).length}/{photoItems.length})
                          </h4>
                          {(() => {
                            const grouped = {};
                            photoItems.forEach(item => {
                              const measureName = measures.find(m => m.id === item.measure_id)?.name || 'General';
                              if (!grouped[measureName]) grouped[measureName] = [];
                              grouped[measureName].push(item);
                            });
                            return Object.entries(grouped).map(([measureName, items]) => (
                              <div key={measureName} style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#666', padding: '4px 0' }}>{measureName}</div>
                                {items.map(item => (
                                  <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 4px 12px', cursor: 'pointer', fontSize: 13 }}>
                                    <input type="checkbox" checked={!!item.completed} onChange={() => toggleChecklist(item)} disabled={!canEdit} />
                                    <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#888' : '#333' }}>
                                      {item.description}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            ));
                          })()}
                        </div>
                      )}

                      {/* Measure-Level Paperwork Requirements */}
                      {paperItems.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <h4 style={{ fontSize: 13, color: '#0f3460', marginBottom: 8 }}>
                            Measure Paperwork ({paperItems.filter(c => c.completed).length}/{paperItems.length})
                          </h4>
                          {(() => {
                            const grouped = {};
                            paperItems.forEach(item => {
                              const measureName = measures.find(m => m.id === item.measure_id)?.name || 'General';
                              if (!grouped[measureName]) grouped[measureName] = [];
                              grouped[measureName].push(item);
                            });
                            return Object.entries(grouped).map(([measureName, items]) => (
                              <div key={measureName} style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#666', padding: '4px 0' }}>{measureName}</div>
                                {items.map(item => (
                                  <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 4px 12px', cursor: 'pointer', fontSize: 13 }}>
                                    <input type="checkbox" checked={!!item.completed} onChange={() => toggleChecklist(item)} disabled={!canEdit} />
                                    <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#888' : '#333' }}>
                                      {item.description}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            ));
                          })()}
                        </div>
                      )}

                      {/* HVAC Replacement Tracking */}
                      <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <h4 style={{ fontSize: 13, color: '#c0392b' }}>
                            HVAC Replacements ({(job.hvac_replacements || []).length})
                          </h4>
                          {canEdit && (
                            <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); setShowHvacModal(job.id); }}>
                              + Replacement Request
                            </button>
                          )}
                        </div>

                        {(job.hvac_replacements || []).map(hvac => (
                          <div key={hvac.id} style={{ padding: 12, background: '#fef8f0', borderRadius: 6, marginBottom: 8, border: '1px solid #f0e0c0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <strong>{hvac.equipment_type}</strong>
                              <span className={`badge ${hvac.approval_status === 'approved' ? 'active' : hvac.approval_status === 'denied' ? 'terminated' : 'pending'}`}>
                                {hvac.approval_status}
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, fontSize: 12 }}>
                              <div><strong>Existing:</strong> {hvac.existing_make} {hvac.existing_model}</div>
                              <div><strong>Condition:</strong> {hvac.existing_condition || '-'}</div>
                              <div><strong>Efficiency:</strong> {hvac.existing_efficiency || '-'}</div>
                              <div><strong>Age:</strong> {hvac.existing_age || '-'}</div>
                              <div><strong>Decision Tree:</strong> {hvac.decision_tree_result || '-'}</div>
                            </div>

                            {/* Tech Report Status */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                              <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: canEdit ? 'pointer' : 'default' }}>
                                <input type="checkbox" checked={!!hvac.tech_report_sent} disabled={!canEdit}
                                  onChange={() => updateHvac(hvac.id, { tech_report_sent: hvac.tech_report_sent ? 0 : 1, tech_report_date: hvac.tech_report_sent ? null : new Date().toISOString().split('T')[0] })} />
                                Tech Report Sent
                              </label>
                              {hvac.tech_report_date && <span style={{ fontSize: 11, color: '#888' }}>{hvac.tech_report_date}</span>}

                              {canEdit && hvac.approval_status === 'pending' && (
                                <>
                                  <button className="btn btn-sm btn-success" style={{ padding: '2px 8px', fontSize: 11 }}
                                    onClick={() => updateHvac(hvac.id, { approval_status: 'approved', approval_date: new Date().toISOString().split('T')[0] })}>
                                    Approve
                                  </button>
                                  <button className="btn btn-sm btn-danger" style={{ padding: '2px 8px', fontSize: 11 }}
                                    onClick={() => updateHvac(hvac.id, { approval_status: 'denied', approval_date: new Date().toISOString().split('T')[0] })}>
                                    Deny
                                  </button>
                                </>
                              )}
                            </div>

                            {/* Manual J & New Equipment (shown after approval) */}
                            {hvac.approval_status === 'approved' && (
                              <div style={{ marginTop: 10, padding: 10, background: '#e8fde8', borderRadius: 4 }}>
                                <div style={{ fontWeight: 600, fontSize: 12, color: '#27ae60', marginBottom: 6 }}>Approved - Equipment & Manual J</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 6, fontSize: 12 }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <input type="checkbox" checked={!!hvac.manual_j_complete} disabled={!canEdit}
                                      onChange={() => updateHvac(hvac.id, { manual_j_complete: hvac.manual_j_complete ? 0 : 1 })} />
                                    Manual J Complete
                                  </label>
                                  <div><strong>BTU:</strong> {hvac.manual_j_btu || <input style={{ width: 80, fontSize: 11, padding: '2px 4px' }} placeholder="BTU" disabled={!canEdit}
                                    onBlur={e => e.target.value && updateHvac(hvac.id, { manual_j_btu: e.target.value })} />}</div>
                                  <div><strong>New Make:</strong> {hvac.new_make || <input style={{ width: 80, fontSize: 11, padding: '2px 4px' }} placeholder="Make" disabled={!canEdit}
                                    onBlur={e => e.target.value && updateHvac(hvac.id, { new_make: e.target.value })} />}</div>
                                  <div><strong>New Model:</strong> {hvac.new_model || <input style={{ width: 80, fontSize: 11, padding: '2px 4px' }} placeholder="Model" disabled={!canEdit}
                                    onBlur={e => e.target.value && updateHvac(hvac.id, { new_model: e.target.value })} />}</div>
                                  <div><strong>Efficiency:</strong> {hvac.new_efficiency || <input style={{ width: 80, fontSize: 11, padding: '2px 4px' }} placeholder="%" disabled={!canEdit}
                                    onBlur={e => e.target.value && updateHvac(hvac.id, { new_efficiency: e.target.value })} />}</div>
                                  <div><strong>Size:</strong> {hvac.new_size || <input style={{ width: 80, fontSize: 11, padding: '2px 4px' }} placeholder="Tons/BTU" disabled={!canEdit}
                                    onBlur={e => e.target.value && updateHvac(hvac.id, { new_size: e.target.value })} />}</div>
                                  <div><strong>Billing:</strong> {hvac.billing_amount ? `$${hvac.billing_amount}` : <input style={{ width: 80, fontSize: 11, padding: '2px 4px' }} placeholder="$" disabled={!canEdit}
                                    onBlur={e => e.target.value && updateHvac(hvac.id, { billing_amount: parseFloat(e.target.value) })} />}</div>
                                </div>
                              </div>
                            )}

                            {hvac.notes && <p style={{ marginTop: 6, fontSize: 12, color: '#666' }}>{hvac.notes}</p>}
                          </div>
                        ))}
                      </div>

                      {job.notes && <p style={{ marginTop: 12, fontSize: 13, color: '#666' }}><strong>Notes:</strong> {job.notes}</p>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===================== ASSESSOR FIELD VIEW ===================== */}
      {tab === 'jobs' && role === 'Assessor' && (
        <div>
          <h3 style={{ marginBottom: 12 }}>My Assessments</h3>
          {jobs.filter(j => ['assessment_scheduled', 'assessment_complete'].includes(j.status)).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 30, color: '#888' }}>No assessments assigned to you.</div>
          ) : (
            jobs.filter(j => ['assessment_scheduled', 'assessment_complete', 'pre_approval'].includes(j.status)).map(job => {
              const isExpanded = expandedJob === job.id;
              const ad = getAssessment(job);
              return (
                <div key={job.id} className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: job.status === 'assessment_scheduled' ? '#fff3e0' : '#e8f5e9' }}
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}>
                    <div>
                      <strong>{job.customer_name || 'Unnamed'}</strong>
                      {job.job_number && <span className="badge active" style={{ marginLeft: 8, fontSize: 10 }}>#{job.job_number}</span>}
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>{job.address}, {job.city} {job.zip}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={`badge ${job.status === 'assessment_scheduled' ? 'pending' : 'active'}`}>{job.status.replace(/_/g, ' ')}</span>
                      {job.assessment_date && <span style={{ fontSize: 12, color: '#666' }}>{job.assessment_date}</span>}
                      <span style={{ color: '#888', fontSize: 18 }}>{isExpanded ? '\u25B2' : '\u25BC'}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #eee' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12, marginBottom: 12 }}>
                        <div><strong>Phone:</strong> {job.phone || '-'}</div>
                        <div><strong>Email:</strong> {job.email || '-'}</div>
                        <div><strong>Utility:</strong> {job.utility}</div>
                      </div>

                      {/* Assessment Date */}
                      <div style={{ marginBottom: 12, fontSize: 12 }}>
                        <strong>Assessment Date:</strong>{' '}
                        <input type="date" value={job.assessment_date || ''} style={{ fontSize: 11, padding: '2px 4px' }}
                          onChange={e => updateJobField(job, 'assessment_date', e.target.value)} />
                        <button className="btn btn-sm btn-success" style={{ marginLeft: 8, fontSize: 11, padding: '3px 10px' }}
                          onClick={() => updateJobField(job, 'status', 'assessment_complete')}>
                          Mark Assessment Complete
                        </button>
                      </div>

                      {/* Collapsible Assessment Form */}
                      <div
                        style={{ padding: '10px 12px', background: '#4a6741', color: '#fff', borderRadius: '6px 6px 0 0', cursor: 'pointer', marginTop: 8 }}
                        onClick={() => setAssessmentOpen(assessmentOpen === job.id ? null : job.id)}>
                        <h4 style={{ margin: 0, fontSize: 14 }}>Energy Assessment Field Data {assessmentOpen === job.id ? '\u25B2' : '\u25BC'}</h4>
                      </div>
                      {assessmentOpen === job.id && (() => {
                        const set = (section, field, val) => {
                          const updated = { ...ad, [section]: { ...(ad[section] || {}), [field]: val } };
                          saveAssessment(job.id, updated);
                        };
                        const v = (section, field) => (ad[section] || {})[field] || '';
                        const yn = (section, field) => (
                          <span style={{ display: 'inline-flex', gap: 4 }}>
                            <label style={{ fontSize: 11 }}><input type="radio" name={`a-${job.id}-${section}-${field}`} checked={v(section, field) === 'yes'} onChange={() => set(section, field, 'yes')} /> yes</label>
                            <label style={{ fontSize: 11 }}><input type="radio" name={`a-${job.id}-${section}-${field}`} checked={v(section, field) === 'no'} onChange={() => set(section, field, 'no')} /> no</label>
                          </span>
                        );
                        const txt = (section, field, placeholder, width) => (
                          <input style={{ width: width || 100, fontSize: 11, padding: '2px 4px', border: '1px solid #ccc', borderRadius: 3 }}
                            defaultValue={v(section, field)} placeholder={placeholder}
                            onBlur={e => set(section, field, e.target.value)} />
                        );
                        const sel = (section, field, options) => (
                          <select style={{ fontSize: 11, padding: '2px 4px' }} value={v(section, field)}
                            onChange={e => set(section, field, e.target.value)}>
                            <option value="">--</option>
                            {options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        );
                        const gs = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px 16px', fontSize: 12 };
                        const fs = { display: 'flex', alignItems: 'center', gap: 4, padding: '3px 0' };
                        const hs = { background: '#8a8a8a', color: '#fff', padding: '6px 12px', fontWeight: 700, fontSize: 13 };
                        const ss = { padding: '10px 12px', borderBottom: '1px solid #ddd' };

                        return (
                          <div style={{ border: '1px solid #ccc', borderTop: 'none', borderRadius: '0 0 6px 6px', background: '#fff' }}>
                            <div style={hs}>EXTERIOR</div>
                            <div style={ss}>
                              <div style={gs}>
                                <div style={fs}><strong>Style:</strong> {txt('exterior', 'style', 'Ranch...', 100)}</div>
                                <div style={fs}><strong>Year Built:</strong> {txt('exterior', 'year_built', 'Year', 60)}</div>
                                <div style={fs}><strong>Stories:</strong> {txt('exterior', 'stories', '#', 40)}</div>
                                <div style={fs}><strong>Bedrooms:</strong> {txt('exterior', 'bedrooms', '#', 40)}</div>
                                <div style={fs}><strong>SqFt:</strong> {txt('exterior', 'sq_footage', 'sqft', 70)}</div>
                                <div style={fs}><strong>Roof:</strong> {sel('exterior', 'roof_condition', ['good', 'average', 'poor'])}</div>
                              </div>
                            </div>
                            <div style={hs}>INTERIOR</div>
                            <div style={ss}>
                              <div style={gs}>
                                <div style={fs}><strong>Mold:</strong> {yn('interior', 'mold')}</div>
                                <div style={fs}><strong>Knob & Tube:</strong> {yn('interior', 'knob_tube')}</div>
                                <div style={fs}><strong>Moisture:</strong> {yn('interior', 'moisture')}</div>
                                <div style={fs}><strong>Roof Leaks:</strong> {yn('interior', 'roof_leaks')}</div>
                                <div style={fs}><strong>Ceiling:</strong> {sel('interior', 'ceiling_condition', ['good', 'poor'])}</div>
                                <div style={fs}><strong>Dryer Vented:</strong> {yn('interior', 'dryer_vented')}</div>
                              </div>
                            </div>
                            <div style={hs}>ATTIC</div>
                            <div style={ss}>
                              <div style={gs}>
                                <div style={fs}><strong>Type:</strong> {sel('attic', 'type', ['Finished', 'Unfinished', 'Flat'])}</div>
                                <div style={fs}><strong>Pre R-Value:</strong> {txt('attic', 'pre_r_value', 'R', 40)}</div>
                                <div style={fs}><strong>SqFt:</strong> {txt('attic', 'sq_footage', 'sqft', 60)}</div>
                                <div style={fs}><strong>Ductwork:</strong> {yn('attic', 'ductwork')}</div>
                              </div>
                            </div>
                            <div style={hs}>FOUNDATION / CRAWLSPACE</div>
                            <div style={ss}>
                              <div style={gs}>
                                <div style={fs}><strong>Basement:</strong> {sel('foundation', 'basement_type', ['Finished', 'Unfinished w/framing', 'Unfinished', 'No basement/slab'])}</div>
                                <div style={fs}><strong>Pre R-Value:</strong> {txt('foundation', 'pre_r_value', 'R', 40)}</div>
                                <div style={fs}><strong>Insulation:</strong> {sel('foundation', 'insulation_type', ['Fiberglass', 'Rigid Foam Board', 'None'])}</div>
                                <div style={fs}><strong>Band Joints:</strong> {yn('foundation', 'band_joints')}</div>
                              </div>
                            </div>
                            <div style={hs}>MECHANICAL</div>
                            <div style={ss}>
                              <div style={gs}>
                                <div style={fs}><strong>Heat Type:</strong> {sel('mechanical', 'heating_type', ['Gas Furnace', 'Boiler', 'Electric', 'Heat Pump'])}</div>
                                <div style={fs}><strong>Make:</strong> {txt('mechanical', 'heating_make', 'Make', 80)}</div>
                                <div style={fs}><strong>Age:</strong> {txt('mechanical', 'heating_age', 'Year', 50)}</div>
                                <div style={fs}><strong>Condition:</strong> {sel('mechanical', 'heating_condition', ['Good', 'Fair', 'Poor', 'Failed'])}</div>
                                <div style={fs}><strong>Tune & Clean Rec:</strong> {yn('mechanical', 'tune_clean_recommended')}</div>
                                <div style={fs}><strong>Thermostat:</strong> {sel('mechanical', 'thermostat_type', ['Manual', 'Programmable', 'Smart/Advanced'])}</div>
                              </div>
                            </div>
                            <div style={{ ...hs, background: '#4a6741' }}>RECOMMENDATIONS</div>
                            <div style={{ ...ss, borderBottom: 'none' }}>
                              <div style={gs}>
                                {['attic_insulation', 'wall_insulation', 'basement_insulation', 'air_sealing', 'duct_sealing', 'rim_joist', 'hvac_tune_clean', 'thermostat', 'exhaust_fans', 'detectors', 'hs_repairs', 'deferral'].map(r => (
                                  <div key={r} style={fs}><strong>{r.replace(/_/g, ' ')}:</strong> {yn('recommendations', r)}</div>
                                ))}
                              </div>
                              <textarea style={{ width: '100%', fontSize: 11, padding: 4, minHeight: 60, marginTop: 8, border: '1px solid #ccc', borderRadius: 3 }}
                                defaultValue={v('recommendations', 'details')} placeholder="Recommendation details, concerns, deferral reasons..."
                                onBlur={e => set('recommendations', 'details', e.target.value)} />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Assessor Photo Log */}
                      <div style={{ marginTop: 14, padding: 12, background: '#f0f4ff', borderRadius: 6 }}>
                        <h4 style={{ fontSize: 13, color: '#0f3460', marginBottom: 8 }}>Assessment Photos</h4>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                          {(job.photos || []).filter(p => p.phase === 'assessment').map(p => (
                            <div key={p.id} style={{ fontSize: 11, padding: '4px 8px', background: '#e8fde8', borderRadius: 4, border: '1px solid #c8e6c9' }}>
                              {p.description} {p.photo_ref && <span style={{ color: '#888' }}>({p.photo_ref})</span>}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input id={`assess-photo-desc-${job.id}`} style={{ flex: 1, fontSize: 11, padding: '4px 6px' }} placeholder="Photo description (e.g., Front of home, Furnace data tag)" />
                          <input id={`assess-photo-ref-${job.id}`} style={{ width: 160, fontSize: 11, padding: '4px 6px' }} placeholder="Company Cam ref" />
                          <button className="btn btn-sm btn-primary" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => {
                            const desc = document.getElementById(`assess-photo-desc-${job.id}`).value;
                            if (!desc) return;
                            const ref = document.getElementById(`assess-photo-ref-${job.id}`).value;
                            fetch(`/api/programs/jobs/${job.id}/photos`, {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ uploaded_by: 'Assessor', role: 'Assessor', phase: 'assessment', description: desc, photo_ref: ref })
                            }).then(() => { loadJobs(); document.getElementById(`assess-photo-desc-${job.id}`).value = ''; document.getElementById(`assess-photo-ref-${job.id}`).value = ''; });
                          }}>+ Log Photo</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===================== INSTALLER FIELD VIEW ===================== */}
      {tab === 'jobs' && role === 'Installer' && (
        <div>
          <h3 style={{ marginBottom: 12 }}>My Install Jobs</h3>
          {jobs.filter(j => ['approved', 'install_scheduled', 'install_in_progress', 'inspection'].includes(j.status)).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 30, color: '#888' }}>No install jobs assigned.</div>
          ) : (
            jobs.filter(j => ['approved', 'install_scheduled', 'install_in_progress', 'inspection'].includes(j.status)).map(job => {
              const isExpanded = expandedJob === job.id;
              const sc = getScope(job);
              const selectedMeasures = sc.selected_measures || [];
              return (
                <div key={job.id} className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e3f2fd' }}
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}>
                    <div>
                      <strong>{job.customer_name}</strong>
                      {job.job_number && <span className="badge active" style={{ marginLeft: 8, fontSize: 10 }}>#{job.job_number}</span>}
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>{job.address}, {job.city}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge pending">{job.status.replace(/_/g, ' ')}</span>
                      <span style={{ color: '#888', fontSize: 18 }}>{isExpanded ? '\u25B2' : '\u25BC'}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #eee' }}>
                      {/* Customer info - read only */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12, marginBottom: 12 }}>
                        <div><strong>Phone:</strong> {job.phone || '-'}</div>
                        <div><strong>Utility:</strong> {job.utility}</div>
                        <div><strong>Permit:</strong> {job.needs_permit ? <span className={`badge ${job.permit_status === 'received' ? 'active' : 'pending'}`}>{job.permit_status}</span> : 'Not needed'}</div>
                      </div>

                      {/* Scheduled Dates - installer can see but not edit most */}
                      <div style={{ marginBottom: 12 }}>
                        <h4 style={{ fontSize: 13, color: '#0f3460', marginBottom: 6 }}>Schedule</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 6, fontSize: 12 }}>
                          <div><strong>ABC Install:</strong> {job.abc_install_date || 'TBD'}</div>
                          <div><strong>Wall Injection:</strong> {job.wall_injection_date || 'TBD'}</div>
                          <div><strong>Patch Job:</strong> {job.patch_date || 'TBD'}</div>
                        </div>
                      </div>

                      {/* Scope of Work - READ ONLY for installer */}
                      <div style={{ marginBottom: 12, padding: 10, background: '#f0f4ff', borderRadius: 6 }}>
                        <h4 style={{ fontSize: 13, color: '#0f3460', marginBottom: 6 }}>Scope of Work ({selectedMeasures.length} measures)</h4>
                        {selectedMeasures.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {selectedMeasures.map(m => (
                              <span key={m} style={{ fontSize: 11, padding: '4px 10px', background: '#e8fde8', borderRadius: 4, border: '1px solid #c8e6c9' }}>{m}</span>
                            ))}
                          </div>
                        ) : <span style={{ fontSize: 12, color: '#888' }}>No scope built yet</span>}
                        {sc.scope_notes && <p style={{ marginTop: 6, fontSize: 11, color: '#666' }}>{sc.scope_notes}</p>}
                      </div>

                      {/* Post-Install Photo Log */}
                      <div style={{ marginBottom: 12, padding: 10, background: '#e8f5e9', borderRadius: 6 }}>
                        <h4 style={{ fontSize: 13, color: '#2e7d32', marginBottom: 8 }}>Post-Install Photos</h4>
                        {selectedMeasures.map(m => {
                          const photosForMeasure = (job.photos || []).filter(p => p.phase === 'post_install' && p.measure_name === m);
                          return (
                            <div key={m} style={{ marginBottom: 8, padding: '6px 8px', background: '#fff', borderRadius: 4, border: '1px solid #ddd' }}>
                              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{m}</div>
                              {photosForMeasure.map(p => (
                                <div key={p.id} style={{ fontSize: 11, color: '#27ae60', padding: '2px 0' }}>
                                  {p.description} {p.photo_ref && <span style={{ color: '#888' }}>({p.photo_ref})</span>} - {p.created_at?.split('T')[0]}
                                </div>
                              ))}
                              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                <input id={`inst-photo-${job.id}-${m}`} style={{ flex: 1, fontSize: 11, padding: '3px 6px' }} placeholder={`Post-install photo for ${m}`} />
                                <input id={`inst-ref-${job.id}-${m}`} style={{ width: 120, fontSize: 11, padding: '3px 6px' }} placeholder="Cam ref" />
                                <button className="btn btn-sm btn-success" style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => {
                                  const desc = document.getElementById(`inst-photo-${job.id}-${m}`).value;
                                  if (!desc) return;
                                  const ref = document.getElementById(`inst-ref-${job.id}-${m}`).value;
                                  fetch(`/api/programs/jobs/${job.id}/photos`, {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ uploaded_by: 'Installer', role: 'Installer', phase: 'post_install', measure_name: m, description: desc, photo_ref: ref })
                                  }).then(() => { loadJobs(); document.getElementById(`inst-photo-${job.id}-${m}`).value = ''; document.getElementById(`inst-ref-${job.id}-${m}`).value = ''; });
                                }}>+ Photo</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Change Order Request */}
                      <div style={{ marginBottom: 12, padding: 10, background: '#fff3e0', borderRadius: 6 }}>
                        <h4 style={{ fontSize: 13, color: '#e65100', marginBottom: 8 }}>Change Orders</h4>
                        {(job.change_orders || []).map(co => (
                          <div key={co.id} style={{ padding: 8, background: '#fff', borderRadius: 4, marginBottom: 6, border: '1px solid #ddd', fontSize: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong>{co.description}</strong>
                              <span className={`badge ${co.status === 'approved' ? 'active' : co.status === 'denied' ? 'terminated' : 'pending'}`}>{co.status}</span>
                            </div>
                            {co.reason && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#666' }}>Reason: {co.reason}</p>}
                            {co.review_notes && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#2e7d32' }}>Review: {co.review_notes}</p>}
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 6, flexDirection: 'column', marginTop: 6 }}>
                          <input id={`co-desc-${job.id}`} style={{ fontSize: 11, padding: '4px 6px' }} placeholder="What needs to change? (e.g., Add attic baffles, Remove wall insulation 2nd floor)" />
                          <input id={`co-reason-${job.id}`} style={{ fontSize: 11, padding: '4px 6px' }} placeholder="Why? (e.g., Found mold behind wall, customer request)" />
                          <button className="btn btn-sm btn-primary" style={{ alignSelf: 'flex-start', fontSize: 11 }} onClick={() => {
                            const desc = document.getElementById(`co-desc-${job.id}`).value;
                            if (!desc) return;
                            const reason = document.getElementById(`co-reason-${job.id}`).value;
                            fetch(`/api/programs/jobs/${job.id}/change-orders`, {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ requested_by: 'Installer', request_type: 'scope_change', description: desc, reason })
                            }).then(() => { loadJobs(); document.getElementById(`co-desc-${job.id}`).value = ''; document.getElementById(`co-reason-${job.id}`).value = ''; });
                          }}>Submit Change Order</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===================== HVAC TECH FIELD VIEW ===================== */}
      {tab === 'jobs' && role === 'HVAC' && (
        <div>
          <h3 style={{ marginBottom: 12 }}>HVAC Jobs - Tune & Clean</h3>
          {jobs.filter(j => {
            const ad = getAssessment(j);
            return (ad.mechanical || {}).tune_clean_recommended === 'yes' || (j.hvac_replacements || []).length > 0;
          }).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 30, color: '#888' }}>No HVAC jobs requiring tune & clean or replacement.</div>
          ) : (
            jobs.filter(j => {
              const ad = getAssessment(j);
              return (ad.mechanical || {}).tune_clean_recommended === 'yes' || (j.hvac_replacements || []).length > 0;
            }).map(job => {
              const isExpanded = expandedJob === job.id;
              const ad = getAssessment(job);
              const mech = ad.mechanical || {};
              return (
                <div key={job.id} className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fce4ec' }}
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}>
                    <div>
                      <strong>{job.customer_name}</strong>
                      {job.job_number && <span className="badge active" style={{ marginLeft: 8, fontSize: 10 }}>#{job.job_number}</span>}
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>{job.address}, {job.city}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {mech.tune_clean_recommended === 'yes' && <span className="badge pending">Tune & Clean</span>}
                      {job.hvac_tune_clean_date && <span style={{ fontSize: 12, color: '#666' }}>Scheduled: {job.hvac_tune_clean_date}</span>}
                      <span style={{ color: '#888', fontSize: 18 }}>{isExpanded ? '\u25B2' : '\u25BC'}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #eee' }}>
                      {/* Equipment Info from Assessment - READ ONLY */}
                      <div style={{ marginBottom: 12, padding: 10, background: '#f5f5f5', borderRadius: 6 }}>
                        <h4 style={{ fontSize: 13, color: '#333', marginBottom: 6 }}>Equipment Info (from Assessment)</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 6, fontSize: 12 }}>
                          <div><strong>Type:</strong> {mech.heating_type || '-'}</div>
                          <div><strong>Make:</strong> {mech.heating_make || '-'}</div>
                          <div><strong>Model:</strong> {mech.heating_model || '-'}</div>
                          <div><strong>Age:</strong> {mech.heating_age || '-'}</div>
                          <div><strong>Condition:</strong> {mech.heating_condition || '-'}</div>
                          <div><strong>Efficiency:</strong> {mech.heating_efficiency || '-'}</div>
                          <div><strong>Last Serviced:</strong> {mech.heating_last_service || '-'}</div>
                        </div>
                      </div>

                      {/* Tune & Clean Date */}
                      <div style={{ marginBottom: 12, fontSize: 12 }}>
                        <strong>Tune & Clean Date:</strong>{' '}
                        <input type="date" value={job.hvac_tune_clean_date || ''} style={{ fontSize: 11, padding: '2px 4px' }}
                          onChange={e => updateJobField(job, 'hvac_tune_clean_date', e.target.value)} />
                      </div>

                      {/* Tech Report - HVAC fills this out */}
                      <div style={{ marginBottom: 12, padding: 10, background: '#fff8e1', borderRadius: 6 }}>
                        <h4 style={{ fontSize: 13, color: '#e65100', marginBottom: 8 }}>Tech Report (IL TRM 2026)</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <strong>Combustion Pre:</strong>
                            <input style={{ width: 60, fontSize: 11, padding: '2px 4px' }} defaultValue={(ad.diagnostics || {}).combustion_pre || ''} placeholder="%"
                              onBlur={e => { const u = { ...ad, diagnostics: { ...(ad.diagnostics || {}), combustion_pre: e.target.value } }; saveAssessment(job.id, u); }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <strong>Combustion Post:</strong>
                            <input style={{ width: 60, fontSize: 11, padding: '2px 4px' }} defaultValue={(ad.diagnostics || {}).combustion_post || ''} placeholder="%"
                              onBlur={e => { const u = { ...ad, diagnostics: { ...(ad.diagnostics || {}), combustion_post: e.target.value } }; saveAssessment(job.id, u); }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <strong>CO Test (ppm):</strong>
                            <input style={{ width: 60, fontSize: 11, padding: '2px 4px' }} defaultValue={(ad.diagnostics || {}).co_test || ''} placeholder="ppm"
                              onBlur={e => { const u = { ...ad, diagnostics: { ...(ad.diagnostics || {}), co_test: e.target.value } }; saveAssessment(job.id, u); }} />
                          </div>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <strong style={{ fontSize: 12 }}>Issues Found / Decision Tree Result:</strong>
                          <textarea style={{ width: '100%', fontSize: 11, padding: 4, minHeight: 60, marginTop: 4, border: '1px solid #ccc', borderRadius: 3 }}
                            defaultValue={(ad.mechanical || {}).tech_report_notes || ''} placeholder="Document findings, decision tree results, replacement recommendations if any..."
                            onBlur={e => { const u = { ...ad, mechanical: { ...(ad.mechanical || {}), tech_report_notes: e.target.value } }; saveAssessment(job.id, u); }} />
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                          <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input type="radio" name={`hvac-result-${job.id}`} checked={(ad.mechanical || {}).tech_report_result === 'no_issues'}
                              onChange={() => { const u = { ...ad, mechanical: { ...(ad.mechanical || {}), tech_report_result: 'no_issues' } }; saveAssessment(job.id, u); }} />
                            No Issues - Tune & Clean Complete
                          </label>
                          <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input type="radio" name={`hvac-result-${job.id}`} checked={(ad.mechanical || {}).tech_report_result === 'replacement_needed'}
                              onChange={() => { const u = { ...ad, mechanical: { ...(ad.mechanical || {}), tech_report_result: 'replacement_needed' } }; saveAssessment(job.id, u); }} />
                            Replacement Recommended
                          </label>
                        </div>
                      </div>

                      {/* HVAC Photos */}
                      <div style={{ marginBottom: 12, padding: 10, background: '#f0f4ff', borderRadius: 6 }}>
                        <h4 style={{ fontSize: 13, color: '#0f3460', marginBottom: 8 }}>HVAC Photos</h4>
                        {(job.photos || []).filter(p => p.role === 'HVAC').map(p => (
                          <div key={p.id} style={{ fontSize: 11, padding: '3px 0', color: '#333' }}>
                            {p.description} {p.photo_ref && <span style={{ color: '#888' }}>({p.photo_ref})</span>} - {p.created_at?.split('T')[0]}
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <input id={`hvac-photo-${job.id}`} style={{ flex: 1, fontSize: 11, padding: '3px 6px' }} placeholder="Photo description (e.g., Furnace data tag, Combustion readings)" />
                          <input id={`hvac-ref-${job.id}`} style={{ width: 120, fontSize: 11, padding: '3px 6px' }} placeholder="Cam ref" />
                          <button className="btn btn-sm btn-primary" style={{ fontSize: 10 }} onClick={() => {
                            const desc = document.getElementById(`hvac-photo-${job.id}`).value;
                            if (!desc) return;
                            const ref = document.getElementById(`hvac-ref-${job.id}`).value;
                            fetch(`/api/programs/jobs/${job.id}/photos`, {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ uploaded_by: 'HVAC Tech', role: 'HVAC', phase: 'hvac', description: desc, photo_ref: ref })
                            }).then(() => { loadJobs(); document.getElementById(`hvac-photo-${job.id}`).value = ''; document.getElementById(`hvac-ref-${job.id}`).value = ''; });
                          }}>+ Photo</button>
                        </div>
                      </div>

                      {/* HVAC Replacements - existing section */}
                      {(job.hvac_replacements || []).length > 0 && (
                        <div style={{ padding: 10, background: '#fef8f0', borderRadius: 6 }}>
                          <h4 style={{ fontSize: 13, color: '#c0392b', marginBottom: 6 }}>Replacement Requests</h4>
                          {job.hvac_replacements.map(hvac => (
                            <div key={hvac.id} style={{ padding: 8, background: '#fff', borderRadius: 4, marginBottom: 6, border: '1px solid #ddd', fontSize: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong>{hvac.equipment_type}</strong>
                                <span className={`badge ${hvac.approval_status === 'approved' ? 'active' : hvac.approval_status === 'denied' ? 'terminated' : 'pending'}`}>{hvac.approval_status}</span>
                              </div>
                              <div style={{ marginTop: 4, color: '#666' }}>
                                {hvac.existing_make} {hvac.existing_model} | {hvac.existing_condition} | Decision: {hvac.decision_tree_result || '-'}
                              </div>
                              {hvac.approval_status === 'approved' && (
                                <div style={{ marginTop: 4, color: '#27ae60' }}>
                                  Approved - {hvac.new_make} {hvac.new_model} ({hvac.new_efficiency})
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Change Order Review (Admin/Ops only) */}
      {tab === 'jobs' && canEdit && (() => {
        const pendingCOs = jobs.flatMap(j => (j.change_orders || []).filter(co => co.status === 'pending').map(co => ({ ...co, job })));
        if (pendingCOs.length === 0) return null;
        return (
          <div className="card" style={{ marginBottom: 16, border: '2px solid #ff9800', background: '#fff8e1' }}>
            <h4 style={{ color: '#e65100', marginBottom: 8 }}>Pending Change Orders ({pendingCOs.length})</h4>
            {pendingCOs.map(co => (
              <div key={co.id} style={{ padding: 10, background: '#fff', borderRadius: 6, marginBottom: 8, border: '1px solid #ddd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: 13 }}>{co.job.customer_name}</strong>
                    <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>#{co.job.job_number}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#888' }}>By: {co.requested_by} | {co.created_at?.split('T')[0]}</span>
                </div>
                <p style={{ margin: '6px 0', fontSize: 12 }}><strong>Request:</strong> {co.description}</p>
                {co.reason && <p style={{ margin: '2px 0', fontSize: 11, color: '#666' }}><strong>Reason:</strong> {co.reason}</p>}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <input id={`co-review-${co.id}`} style={{ flex: 1, fontSize: 11, padding: '3px 6px' }} placeholder="Review notes..." />
                  <button className="btn btn-sm btn-success" style={{ fontSize: 11 }} onClick={() => {
                    const notes = document.getElementById(`co-review-${co.id}`).value;
                    fetch(`/api/programs/change-orders/${co.id}`, {
                      method: 'PUT', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'approved', reviewed_by: role, review_notes: notes })
                    }).then(() => loadJobs());
                  }}>Approve</button>
                  <button className="btn btn-sm btn-danger" style={{ fontSize: 11 }} onClick={() => {
                    const notes = document.getElementById(`co-review-${co.id}`).value;
                    fetch(`/api/programs/change-orders/${co.id}`, {
                      method: 'PUT', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'denied', reviewed_by: role, review_notes: notes })
                    }).then(() => loadJobs());
                  }}>Deny</button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* PIPELINE / FORECAST TAB */}
      {tab === 'pipeline' && (
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
                    const order = JOB_STATUSES;
                    return order.indexOf(a[0]) - order.indexOf(b[0]);
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

              {/* In-Progress Jobs with Completion Tracking */}
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
      )}

      {/* DOCUMENTS TAB */}
      {tab === 'documents' && (
        <div>
          {canEdit && (
            <div style={{ marginBottom: 15 }}>
              <button className="btn btn-primary" onClick={() => setShowDocModal(true)}>+ Add Document</button>
            </div>
          )}
          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Version</th><th>Assigned To</th><th>Due Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {program.documents?.map(doc => (
                    <tr key={doc.id}>
                      <td><strong>{doc.title}</strong></td>
                      <td>{doc.doc_type}</td>
                      <td>
                        {canEdit ? (
                          <select className="btn btn-sm" value={doc.status} onChange={e => updateDocStatus(doc, e.target.value)}
                            style={{ padding: '2px 6px', fontSize: 12 }}>
                            {DOC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span className={`badge ${doc.status === 'approved' || doc.status === 'active' ? 'active' : doc.status === 'draft' ? 'pending' : 'at_risk'}`}>{doc.status}</span>
                        )}
                      </td>
                      <td>{doc.version}</td>
                      <td>{doc.assigned_to || '-'}</td>
                      <td>{doc.due_date || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {canEdit && <button className="btn btn-sm btn-secondary" onClick={() => openEditDoc(doc)}>Edit</button>}
                          {canEdit && <button className="btn btn-sm btn-danger" onClick={() => deleteDoc(doc.id)}>Del</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!program.documents || program.documents.length === 0) && (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: '#888', padding: 30 }}>No documents yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TASKS TAB - Kanban style */}
      {tab === 'tasks' && (
        <div>
          {canEdit && (
            <div style={{ marginBottom: 15 }}>
              <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>+ Add Task</button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15 }}>
            {[{ title: 'To Do', items: todoTasks, status: 'todo' },
              { title: 'In Progress', items: inProgressTasks, status: 'in_progress' },
              { title: 'Review', items: reviewTasks, status: 'review' },
              { title: 'Done', items: doneTasks, status: 'done' }].map(col => (
              <div key={col.status}>
                <h4 style={{ marginBottom: 10, color: '#666', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
                  {col.title} ({col.items.length})
                </h4>
                {col.items.map(task => (
                  <div key={task.id} className="card" style={{ marginBottom: 10, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <strong style={{ fontSize: 13 }}>{task.title}</strong>
                      <span className={`badge ${task.priority === 'critical' ? 'terminated' : task.priority === 'high' ? 'at_risk' : 'active'}`}
                        style={{ fontSize: 10 }}>{task.priority}</span>
                    </div>
                    {task.assigned_to && <div style={{ fontSize: 12, color: '#888' }}>{task.assigned_to}</div>}
                    {task.due_date && <div style={{ fontSize: 11, color: '#e94560' }}>Due: {task.due_date}</div>}
                    {canEdit && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                        {TASK_STATUSES.filter(s => s !== task.status).map(s => (
                          <button key={s} className="btn btn-sm btn-secondary" style={{ padding: '2px 6px', fontSize: 10 }}
                            onClick={() => updateTaskStatus(task, s)}>{s.replace('_', ' ')}</button>
                        ))}
                        <button className="btn btn-sm btn-secondary" style={{ padding: '2px 6px', fontSize: 10 }}
                          onClick={() => openEditTask(task)}>Edit</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MILESTONES TAB */}
      {tab === 'milestones' && (
        <div>
          {canEdit && (
            <div style={{ marginBottom: 15 }}>
              <button className="btn btn-primary" onClick={() => setShowMsModal(true)}>+ Add Milestone</button>
            </div>
          )}
          <div className="card">
            {program.milestones?.map(ms => (
              <div key={ms.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{ms.title}</strong>
                  {ms.target_date && <span style={{ marginLeft: 10, color: '#888', fontSize: 13 }}>Target: {ms.target_date}</span>}
                  {ms.notes && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>{ms.notes}</p>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${ms.status === 'completed' ? 'active' : 'pending'}`}>{ms.status}</span>
                  {canEdit && ms.status !== 'completed' && (
                    <button className="btn btn-sm btn-success" onClick={() => completeMilestone(ms)}>Complete</button>
                  )}
                </div>
              </div>
            ))}
            {(!program.milestones || program.milestones.length === 0) && (
              <p style={{ textAlign: 'center', color: '#888', padding: 20 }}>No milestones yet</p>
            )}
          </div>
        </div>
      )}

      {/* Doc Modal */}
      {showDocModal && (
        <div className="modal-overlay" onClick={closeDocModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editDoc ? 'Edit Document' : 'Add Document'}</h3>
            <form onSubmit={submitDoc}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Document Title *</label>
                  <input required value={docForm.title} onChange={e => setDocForm({...docForm, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Document Type *</label>
                  <select value={docForm.doc_type} onChange={e => setDocForm({...docForm, doc_type: e.target.value})}>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assigned To</label>
                  <input value={docForm.assigned_to} onChange={e => setDocForm({...docForm, assigned_to: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={docForm.due_date} onChange={e => setDocForm({...docForm, due_date: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} value={docForm.notes} onChange={e => setDocForm({...docForm, notes: e.target.value})} />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-success">{editDoc ? 'Update' : 'Add Document'}</button>
                <button type="button" className="btn btn-secondary" onClick={closeDocModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={closeTaskModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editTask ? 'Edit Task' : 'Add Task'}</h3>
            <form onSubmit={submitTask}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Task Title *</label>
                  <input required value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                    {TASK_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assigned To</label>
                  <input value={taskForm.assigned_to} onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input placeholder="e.g. Compliance, Outreach, QA" value={taskForm.category} onChange={e => setTaskForm({...taskForm, category: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-success">{editTask ? 'Update' : 'Add Task'}</button>
                <button type="button" className="btn btn-secondary" onClick={closeTaskModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Modal */}
      {showMsModal && (
        <div className="modal-overlay" onClick={() => setShowMsModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Milestone</h3>
            <form onSubmit={submitMs}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Milestone Title *</label>
                  <input required value={msForm.title} onChange={e => setMsForm({...msForm, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Target Date</label>
                  <input type="date" value={msForm.target_date} onChange={e => setMsForm({...msForm, target_date: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} value={msForm.notes} onChange={e => setMsForm({...msForm, notes: e.target.value})} />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-success">Add Milestone</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMsModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HVAC Replacement Modal */}
      {showHvacModal && (
        <div className="modal-overlay" onClick={() => setShowHvacModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3>New HVAC Replacement Request</h3>
            <form onSubmit={submitHvac}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Equipment Type *</label>
                  <select value={hvacForm.equipment_type} onChange={e => setHvacForm({...hvacForm, equipment_type: e.target.value})}>
                    <option value="Gas Furnace">Gas Furnace</option>
                    <option value="Boiler">Boiler</option>
                    <option value="Natural Gas Water Heater">Natural Gas Water Heater</option>
                    <option value="Electric Water Heater (Heat Pump)">Electric Water Heater (Heat Pump)</option>
                    <option value="Central Air Conditioner">Central Air Conditioner</option>
                    <option value="Room Air Conditioner">Room Air Conditioner</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Decision Tree Result</label>
                  <select value={hvacForm.decision_tree_result} onChange={e => setHvacForm({...hvacForm, decision_tree_result: e.target.value})}>
                    <option value="">Select...</option>
                    <option value="Replace">Replace</option>
                    <option value="Repair">Repair</option>
                    <option value="Tune-Up">Tune-Up</option>
                    <option value="No Action">No Action</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Existing Make</label>
                  <input value={hvacForm.existing_make} onChange={e => setHvacForm({...hvacForm, existing_make: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Existing Model</label>
                  <input value={hvacForm.existing_model} onChange={e => setHvacForm({...hvacForm, existing_model: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Existing Condition</label>
                  <input value={hvacForm.existing_condition} onChange={e => setHvacForm({...hvacForm, existing_condition: e.target.value})} placeholder="e.g., cracked heat exchanger, no heat" />
                </div>
                <div className="form-group">
                  <label>Existing Efficiency</label>
                  <input value={hvacForm.existing_efficiency} onChange={e => setHvacForm({...hvacForm, existing_efficiency: e.target.value})} placeholder="e.g., 80% AFUE, SEER 8" />
                </div>
                <div className="form-group">
                  <label>Equipment Age</label>
                  <input value={hvacForm.existing_age} onChange={e => setHvacForm({...hvacForm, existing_age: e.target.value})} placeholder="e.g., 25 years, manufactured 1998" />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={3} value={hvacForm.notes} onChange={e => setHvacForm({...hvacForm, notes: e.target.value})} placeholder="Document condition details, safety concerns, customer situation..." />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-success">Submit Replacement Request</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowHvacModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job Modal */}
      {showJobModal && (
        <div className="modal-overlay" onClick={() => setShowJobModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3>New Job</h3>
            <form onSubmit={submitJob}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Job Number</label>
                  <input value={jobForm.job_number} onChange={e => setJobForm({...jobForm, job_number: e.target.value})} placeholder="e.g. HES-2026-001" />
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
                  <label>Utility</label>
                  <select value={jobForm.utility} onChange={e => setJobForm({...jobForm, utility: e.target.value})}>
                    {UTILITIES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
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
