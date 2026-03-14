import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const DOC_TYPES = ['Policy', 'Procedure', 'Form', 'Report', 'Audit', 'Compliance', 'Training', 'SOP', 'Manual', 'Checklist', 'Other'];
const DOC_STATUSES = ['draft', 'in_review', 'approved', 'active', 'archived'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const JOB_STATUSES = ['assessment_scheduled', 'assessment_complete', 'pre_approval', 'approved', 'install_scheduled', 'install_in_progress', 'inspection', 'submitted', 'invoiced', 'complete', 'deferred'];
const UTILITIES = ['ComEd', 'Nicor Gas', 'Peoples Gas', 'North Shore Gas'];

export default function ProgramDetail({ role }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [tab, setTab] = useState('overview');
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
  const [seeding, setSeeding] = useState(false);
  const [showHvacModal, setShowHvacModal] = useState(null);
  const [hvacForm, setHvacForm] = useState({ equipment_type: 'Gas Furnace', existing_make: '', existing_model: '', existing_condition: '', existing_efficiency: '', existing_age: '', decision_tree_result: '', notes: '' });

  const [docForm, setDocForm] = useState({ title: '', doc_type: 'SOP', assigned_to: '', due_date: '', notes: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '', category: '', notes: '' });
  const [msForm, setMsForm] = useState({ title: '', target_date: '', notes: '' });
  const [jobForm, setJobForm] = useState({ job_number: '', customer_name: '', address: '', city: '', zip: '', utility: 'ComEd', assigned_contractor: '', notes: '' });

  const load = useCallback(() => {
    fetch(`/api/programs/${id}`).then(r => r.json()).then(setProgram).catch(() => {});
  }, [id]);

  const loadJobs = useCallback(() => {
    fetch(`/api/programs/${id}/jobs`).then(r => r.json()).then(setJobs).catch(() => {});
  }, [id]);

  useEffect(() => { load(); }, [load]);
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
    setJobForm({ job_number: '', customer_name: '', address: '', city: '', zip: '', utility: 'ComEd', assigned_contractor: '', notes: '' });
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

  // Seed HES rules
  const seedRules = async () => {
    setSeeding(true);
    await fetch(`/api/programs/${id}/seed-hes-rules`, { method: 'POST' });
    setSeeding(false);
    load();
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

  const tabs = ['overview', 'rules', 'process', 'jobs', 'documents', 'tasks', 'milestones'];

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>{program.name} <span className="badge active">{program.code}</span></h2>
          {program.manager_name && <p style={{ color: '#888', marginTop: 4 }}>Manager: {program.manager_name} {program.manager_title ? `(${program.manager_title})` : ''}</p>}
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/programs')}>Back to Programs</button>
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

          {measures.length === 0 && canEdit && (
            <div className="card" style={{ textAlign: 'center', padding: 30 }}>
              <h3>No Program Rules Loaded</h3>
              <p style={{ color: '#888', margin: '10px 0 20px' }}>Load the HES IE program rules from the 2026 manual to get started.</p>
              <button className="btn btn-primary" onClick={seedRules} disabled={seeding}>
                {seeding ? 'Loading Rules...' : 'Load HES IE Rules'}
              </button>
            </div>
          )}

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
          {measures.length === 0 && canEdit && (
            <div className="card" style={{ textAlign: 'center', padding: 30 }}>
              <p style={{ color: '#888', marginBottom: 15 }}>No program rules loaded yet.</p>
              <button className="btn btn-primary" onClick={seedRules} disabled={seeding}>
                {seeding ? 'Loading Rules...' : 'Load HES IE Rules from Manual'}
              </button>
            </div>
          )}

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
                  {['property', 'customer', 'prioritization'].map(type => {
                    const rules = (program.eligibilityRules || []).filter(r => r.rule_type === type);
                    if (rules.length === 0) return null;
                    return (
                      <div key={type} style={{ marginBottom: 20 }}>
                        <h3 style={{ textTransform: 'capitalize', marginBottom: 10 }}>{type} Eligibility</h3>
                        {rules.map(r => (
                          <div key={r.id} className="card" style={{ marginBottom: 8, padding: '12px 16px' }}>
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

      {/* JOBS TAB */}
      {tab === 'jobs' && (
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
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 12 }}>
                        <div style={{ fontSize: 12 }}><strong>Utility:</strong> {job.utility || '-'}</div>
                        <div style={{ fontSize: 12 }}><strong>Contractor:</strong> {job.assigned_contractor || '-'}</div>
                        <div style={{ fontSize: 12 }}><strong>Assessment:</strong> {job.assessment_date || '-'}</div>
                        <div style={{ fontSize: 12 }}><strong>Install:</strong> {job.install_date || '-'}</div>
                        <div style={{ fontSize: 12 }}><strong>Inspection:</strong> {job.inspection_date || '-'}</div>
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
                  <label>Assigned Contractor</label>
                  <input value={jobForm.assigned_contractor} onChange={e => setJobForm({...jobForm, assigned_contractor: e.target.value})} />
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
