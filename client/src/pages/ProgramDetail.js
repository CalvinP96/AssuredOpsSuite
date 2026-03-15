import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as api from '../api';
import LazyPhoto from '../components/LazyPhoto';

const DOC_TYPES = ['Policy', 'Procedure', 'Form', 'Report', 'Audit', 'Compliance', 'Training', 'SOP', 'Manual', 'Checklist', 'Other'];
const DOC_STATUSES = ['draft', 'in_review', 'approved', 'active', 'archived'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const JOB_STATUSES = ['assessment_scheduled', 'assessment_complete', 'pre_approval', 'approved', 'install_scheduled', 'install_in_progress', 'inspection', 'submitted', 'invoiced', 'complete', 'deferred'];
const UTILITIES = ['ComEd', 'Nicor Gas', 'Peoples Gas', 'North Shore Gas'];

export default function ProgramDetail({ role, fixedProgramId }) {
  const params = useParams();
  const navigate = useNavigate();
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
  const [rulesFilter, setRulesFilter] = useState('all');
  const [rulesSubTab, setRulesSubTab] = useState('measures');
  const [jobs, setJobs] = useState([]);
  const [showHvacModal, setShowHvacModal] = useState(null);
  const [hvacForm, setHvacForm] = useState({ equipment_type: 'Gas Furnace', existing_make: '', existing_model: '', existing_condition: '', existing_efficiency: '', existing_age: '', decision_tree_result: '', notes: '' });

  const [docForm, setDocForm] = useState({ title: '', doc_type: 'SOP', assigned_to: '', due_date: '', notes: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '', category: '', notes: '' });
  const [msForm, setMsForm] = useState({ title: '', target_date: '', notes: '' });
  const [jobForm, setJobForm] = useState({ job_number: '', customer_name: '', phone: '', email: '', address: '', city: '', zip: '', utility: 'ComEd', notes: '' });


  const load = useCallback(() => {
    api.getProgram(id).then(setProgram).catch(() => {});
  }, [id]);

  const loadJobs = useCallback(() => {
    api.getJobs(id).then(setJobs).catch(() => {});
  }, [id]);

  useEffect(() => { load(); loadJobs(); }, [load, loadJobs]);
  useEffect(() => { if (tab === 'jobs') loadJobs(); }, [tab, loadJobs]);

  // Document handlers
  const submitDoc = async (e) => {
    e.preventDefault();
    try {
      if (editDoc) {
        await api.updateDocument(editDoc.id, { ...editDoc, ...docForm });
      } else {
        await api.createDocument(id, docForm);
      }
      closeDocModal();
      load();
    } catch (err) { alert('Failed to save document: ' + err.message); }
  };

  const updateDocStatus = async (doc, status) => {
    try { await api.updateDocument(doc.id, { ...doc, status }); load(); }
    catch (err) { alert('Failed to update document: ' + err.message); }
  };

  const deleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try { await api.deleteDocument(docId); load(); }
    catch (err) { alert('Failed to delete document: ' + err.message); }
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
    try {
      if (editTask) {
        await api.updateTask(editTask.id, { ...editTask, ...taskForm });
      } else {
        await api.createTask(id, taskForm);
      }
      closeTaskModal();
      load();
    } catch (err) { alert('Failed to save task: ' + err.message); }
  };

  const updateTaskStatus = async (task, status) => {
    try { await api.updateTask(task.id, { ...task, status }); load(); }
    catch (err) { alert('Failed to update task: ' + err.message); }
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
    try {
      await api.createMilestone(id, msForm);
      setShowMsModal(false);
      setMsForm({ title: '', target_date: '', notes: '' });
      load();
    } catch (err) { alert('Failed to create milestone: ' + err.message); }
  };

  const completeMilestone = async (ms) => {
    try { await api.updateMilestone(ms.id, { ...ms, status: 'completed', completed_date: new Date().toISOString().split('T')[0] }); load(); }
    catch (err) { alert('Failed to update milestone: ' + err.message); }
  };

  // Job handlers
  const submitJob = async (e) => {
    e.preventDefault();
    try {
      await api.createJob(id, jobForm);
      setShowJobModal(false);
      setJobForm({ job_number: '', customer_name: '', phone: '', email: '', address: '', city: '', zip: '', utility: 'ComEd', notes: '' });
      loadJobs();
    } catch (err) { alert('Failed to create job: ' + err.message); }
  };

  const updateJobStatus = async (job, status) => {
    try { await api.updateJob(job.id, { ...job, status }); loadJobs(); }
    catch (err) { alert('Failed to update job status: ' + err.message); }
  };

  const toggleChecklist = async (item) => {
    try { await api.updateChecklist(item.id, { completed: !item.completed, completed_by: role }); loadJobs(); }
    catch (err) { alert('Failed to update checklist: ' + err.message); }
  };

  // HVAC Replacement handlers
  const submitHvac = async (e) => {
    e.preventDefault();
    try {
      await api.createHvac(showHvacModal, hvacForm);
      setShowHvacModal(null);
      setHvacForm({ equipment_type: 'Gas Furnace', existing_make: '', existing_model: '', existing_condition: '', existing_efficiency: '', existing_age: '', decision_tree_result: '', notes: '' });
      loadJobs();
    } catch (err) { alert('Failed to create HVAC replacement: ' + err.message); }
  };

  const updateHvac = async (hvacId, updates) => {
    try { await api.updateHvac(hvacId, updates); loadJobs(); }
    catch (err) { alert('Failed to update HVAC: ' + err.message); }
  };

  const updateJobField = async (job, field, value) => {
    try { await api.updateJob(job.id, { ...job, [field]: value }); loadJobs(); }
    catch (err) { alert('Failed to update job: ' + err.message); }
  };

  // Forecast state
  const [forecast, setForecast] = useState(null);
  const [forecastFrom, setForecastFrom] = useState('');
  const [forecastTo, setForecastTo] = useState('');

  const loadForecast = useCallback((from, to) => {
    api.getForecast(id, from, to).then(setForecast).catch(() => {});
  }, [id]);

  // Auto-load forecast when pipeline tab opens
  useEffect(() => { if (tab === 'pipeline') loadForecast(forecastFrom, forecastTo); }, [tab]); // eslint-disable-line

  const saveAssessment = async (jobId, data) => {
    try { await api.saveAssessmentData(jobId, data); loadJobs(); }
    catch (err) { alert('Failed to save assessment: ' + err.message); }
  };

  const saveScope = async (jobId, data) => {
    try { await api.saveScopeData(jobId, data); loadJobs(); }
    catch (err) { alert('Failed to save scope: ' + err.message); }
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
              const checklist = job.checklist || [];
              const totalItems = checklist.length;
              const completedItems = checklist.filter(c => c.completed).length;
              const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

              return (
                <div key={job.id} className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
                  <div
                    style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <Link to={`/job/${job.id}`} onClick={e => e.stopPropagation()} style={{ cursor: 'pointer', color: '#1a73e8', textDecoration: 'none', fontWeight: 'bold' }}
                      >{job.customer_name || 'Unnamed'}</Link>
                      {job.job_number && <span className="badge active" style={{ marginLeft: 8, fontSize: 10 }}>#{job.job_number}</span>}
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>{job.address}{job.city ? `, ${job.city}` : ''} {job.zip || ''}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Link to={`/job/${job.id}`} className="btn btn-sm btn-primary" onClick={e => e.stopPropagation()} style={{ textDecoration: 'none', fontSize: 11, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                        Open Project
                      </Link>
                      {canEdit && (
                        <select className="btn btn-sm" value={job.status} onClick={e => e.stopPropagation()}
                          onChange={e => { e.stopPropagation(); updateJobStatus(job, e.target.value); }}
                          style={{ padding: '2px 6px', fontSize: 11, minWidth: 160 }}>
                          {JOB_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                      )}
                      <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: pct === 100 ? '#27ae60' : '#e94560' }}>{pct}% Complete</div>
                        <div style={{ width: 120, height: 6, background: '#eee', borderRadius: 3, marginTop: 4 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#27ae60' : '#e94560', borderRadius: 3 }} />
                        </div>
                      </div>
                    </div>
                  </div>
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
              const checklist = job.checklist || [];
              const totalItems = checklist.length;
              const completedItems = checklist.filter(c => c.completed).length;
              const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
              return (
                <div key={job.id} className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: job.status === 'assessment_scheduled' ? '#fff3e0' : '#e8f5e9' }}>
                    <div>
                      <Link to={`/job/${job.id}`} style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: 'bold' }}
                      >{job.customer_name || 'Unnamed'}</Link>
                      {job.job_number && <span className="badge active" style={{ marginLeft: 8, fontSize: 10 }}>#{job.job_number}</span>}
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>{job.address}, {job.city} {job.zip}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Link to={`/job/${job.id}`} className="btn btn-sm btn-primary" style={{ textDecoration: 'none', fontSize: 11, padding: '3px 10px', whiteSpace: 'nowrap' }}>Open Project</Link>
                      <span className={`badge ${job.status === 'assessment_scheduled' ? 'pending' : 'active'}`}>{job.status.replace(/_/g, ' ')}</span>
                      {job.assessment_date && <span style={{ fontSize: 12, color: '#666' }}>{job.assessment_date}</span>}
                      <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: pct === 100 ? '#27ae60' : '#e94560' }}>{pct}% Complete</div>
                        <div style={{ width: 120, height: 6, background: '#eee', borderRadius: 3, marginTop: 4 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#27ae60' : '#e94560', borderRadius: 3 }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===================== SCOPE CREATOR FIELD VIEW ===================== */}
      {tab === 'jobs' && role === 'Scope Creator' && (
        <div>
          <h3 style={{ marginBottom: 4 }}>Scope Creation</h3>
          <p style={{ fontSize: 11, color: '#666', margin: '0 0 12px' }}>Review assessor recommendations, fill out the 2026 HES Appendix D form, and build the scope of work. You have final say on scope.</p>
          {jobs.filter(j => ['assessment_complete', 'pre_approval', 'approved'].includes(j.status)).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 30, color: '#888' }}>No jobs ready for scoping.</div>
          ) : (
            jobs.filter(j => ['assessment_complete', 'pre_approval', 'approved'].includes(j.status)).map(job => {
              const ad = getAssessment(job);
              const sc = getScope(job);
              const recs = ad.recommendations || {};
              const selectedMeasures = sc.selected_measures || [];
              const isExpanded = expandedJob === job.id;
              const recItems = ['attic_insulation', 'wall_insulation', 'basement_insulation', 'air_sealing', 'duct_sealing', 'rim_joist', 'hvac_tune_clean', 'hvac_replacement', 'thermostat', 'exhaust_fans', 'detectors', 'hs_repairs'].filter(r => recs[r] === 'yes');
              const isDeferral = recs.deferral === 'yes';
              return (
                <div key={job.id} className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDeferral ? '#ffebee' : selectedMeasures.length > 0 ? '#e8f5e9' : '#fff8e1' }}
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}>
                    <div>
                      <Link to={`/job/${job.id}`} onClick={e => e.stopPropagation()} style={{ cursor: 'pointer', color: '#1a73e8', textDecoration: 'none', fontWeight: 'bold' }}
                      >{job.customer_name || 'Unnamed'}</Link>
                      {job.job_number && <span className="badge active" style={{ marginLeft: 8, fontSize: 10 }}>#{job.job_number}</span>}
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>{job.address}, {job.city}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {isDeferral && <span className="badge terminated" style={{ fontSize: 10 }}>Deferral Recommended</span>}
                      {selectedMeasures.length > 0 && <span style={{ fontSize: 11, color: '#27ae60', fontWeight: 600 }}>{selectedMeasures.length} measures scoped</span>}
                      <span className={`badge ${job.status === 'approved' ? 'active' : 'pending'}`}>{job.status.replace(/_/g, ' ')}</span>
                      <span style={{ color: '#888', fontSize: 18 }}>{isExpanded ? '\u25B2' : '\u25BC'}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #eee' }}>
                      {/* Assessor Recommendations - READ ONLY */}
                      <div style={{ padding: 10, background: '#fff3e0', borderRadius: 6, marginBottom: 12, border: '1px solid #ffe0b2' }}>
                        <h4 style={{ fontSize: 13, color: '#e65100', marginBottom: 6 }}>Assessor Recommendations (Read Only)</h4>
                        {recItems.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                            {recItems.map(r => (
                              <span key={r} style={{ fontSize: 11, padding: '3px 8px', background: '#e8f5e9', borderRadius: 4, border: '1px solid #c8e6c9' }}>{r.replace(/_/g, ' ')}</span>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>No specific recommendations yet.</p>
                        )}
                        {recs.details && <p style={{ fontSize: 11, margin: '4px 0 0', color: '#333' }}><strong>Notes:</strong> {recs.details}</p>}
                        {isDeferral && recs.deferral_reason && (
                          <p style={{ fontSize: 11, margin: '4px 0 0', color: '#c0392b' }}><strong>Deferral Reason:</strong> {recs.deferral_reason}</p>
                        )}
                        {/* MS Forms quick data summary */}
                        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 4, fontSize: 11, color: '#555' }}>
                          {ad.exterior?.style && <div><strong>Style:</strong> {ad.exterior.style}</div>}
                          {ad.exterior?.year_built && <div><strong>Year:</strong> {ad.exterior.year_built}</div>}
                          {ad.exterior?.stories && <div><strong>Stories:</strong> {ad.exterior.stories}</div>}
                          {ad.exterior?.sq_footage && <div><strong>SqFt:</strong> {ad.exterior.sq_footage}</div>}
                          {ad.mechanical?.heating_type && <div><strong>Heat:</strong> {ad.mechanical.heating_type} ({ad.mechanical.heating_condition || '?'})</div>}
                          {ad.diagnostics?.pre_cfm50 && <div><strong>Pre CFM50:</strong> {ad.diagnostics.pre_cfm50}</div>}
                        </div>
                      </div>

                      {/* Quick Scope Builder */}
                      <div style={{ padding: 10, background: '#e3f2fd', borderRadius: 6, marginBottom: 12, border: '1px solid #bbdefb' }}>
                        <h4 style={{ fontSize: 13, color: '#0f3460', marginBottom: 6 }}>Quick Scope Builder (You Have Final Say)</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 4 }}>
                          {['Attic Insulation', 'Wall Insulation', 'Basement/Crawlspace Wall Insulation', 'Air Sealing', 'Duct Sealing', 'Rim Joist Insulation', 'Gas Furnace Tune-Up', 'Boiler Tune-Up', 'Furnace Replacement', 'Boiler Replacement', 'Central Air Conditioning', 'Programmable Thermostat', 'Advanced Thermostat'].map(m => {
                            const isRec = recItems.some(r => m.toLowerCase().includes(r.replace(/_/g, ' ')));
                            return (
                              <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '3px 6px', background: selectedMeasures.includes(m) ? '#e8f5e9' : isRec ? '#fff3e0' : '#f9f9f9', borderRadius: 4, cursor: 'pointer', border: isRec && !selectedMeasures.includes(m) ? '1px dashed #ff9800' : '1px solid transparent' }}>
                                <input type="checkbox" checked={selectedMeasures.includes(m)} onChange={() => {
                                  const updated = selectedMeasures.includes(m) ? selectedMeasures.filter(x => x !== m) : [...selectedMeasures, m];
                                  saveScope(job.id, { ...sc, selected_measures: updated });
                                }} />
                                {m} {isRec && !selectedMeasures.includes(m) && <span style={{ fontSize: 9, color: '#ff9800' }}>(rec)</span>}
                              </label>
                            );
                          })}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <strong style={{ fontSize: 11 }}>Scope Notes:</strong>
                          <textarea style={{ width: '100%', fontSize: 11, padding: 4, minHeight: 40, marginTop: 2, border: '1px solid #ccc', borderRadius: 3 }}
                            defaultValue={sc.notes || sc.scope_notes || ''} placeholder="Scope notes, justifications, overrides from assessor recommendations..."
                            onBlur={e => saveScope(job.id, { ...sc, notes: e.target.value })} />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Link to={`/job/${job.id}`} className="btn btn-sm btn-primary" onClick={e => e.stopPropagation()} style={{ textDecoration: 'none', fontSize: 12, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                          Open Full Detail - Appendix D Form
                        </Link>
                        {job.status === 'assessment_complete' && (
                          <button className="btn btn-sm btn-success" style={{ fontSize: 12 }}
                            onClick={() => updateJobStatus(job, 'pre_approval')}>
                            Submit for Pre-Approval
                          </button>
                        )}
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
                      <Link to={`/job/${job.id}`} onClick={e => e.stopPropagation()} style={{ cursor: 'pointer', color: '#1a73e8', textDecoration: 'none', fontWeight: 'bold' }}
                      >{job.customer_name}</Link>
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
                        {/* Existing photos gallery */}
                        {(() => {
                          const instPhotos = (job.photos || []).filter(p => p.phase === 'post_install');
                          const SIDES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Interior', 'Other'];
                          const sideColors = { Alpha: '#e3f2fd', Bravo: '#fff3e0', Charlie: '#f3e5f5', Delta: '#e8f5e9', Interior: '#fce4ec', Other: '#f5f5f5' };
                          return (
                            <>
                              {instPhotos.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                                  {instPhotos.map(p => (
                                    <div key={p.id} style={{ width: 110, border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden', background: '#fff', fontSize: 10 }}>
                                      {p.has_photo ? (
                                        <LazyPhoto id={p.id} alt={p.description} style={{ width: '100%', height: 80, objectFit: 'cover' }} />
                                      ) : (
                                        <div style={{ width: '100%', height: 80, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>No image</div>
                                      )}
                                      <div style={{ padding: 4 }}>
                                        {p.house_side && <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: sideColors[p.house_side] || '#eee' }}>{p.house_side}</span>}
                                        <div style={{ marginTop: 2 }}>{p.description}</div>
                                        {p.measure_name && <div style={{ color: '#888' }}>{p.measure_name}</div>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {/* Upload controls per measure */}
                              {selectedMeasures.map(m => (
                                <div key={m} style={{ marginBottom: 8, padding: '6px 8px', background: '#fff', borderRadius: 4, border: '1px solid #ddd' }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{m} <span style={{ color: '#888', fontWeight: 400 }}>({instPhotos.filter(p => p.measure_name === m).length} photos)</span></div>
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <select id={`inst-side-${job.id}-${m}`} style={{ fontSize: 11, padding: '3px 4px' }}>
                                      {SIDES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <input id={`inst-desc-${job.id}-${m}`} style={{ flex: 1, minWidth: 120, fontSize: 11, padding: '3px 6px' }} placeholder={`Photo description`} />
                                    <label className="btn btn-sm btn-success" style={{ fontSize: 10, padding: '3px 8px', cursor: 'pointer', margin: 0 }}>
                                      Camera
                                      <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => {
                                        const file = e.target.files[0]; if (!file) return;
                                        const desc = document.getElementById(`inst-desc-${job.id}-${m}`).value || `${m} - post install`;
                                        const side = document.getElementById(`inst-side-${job.id}-${m}`).value;
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                          api.uploadPhoto(job.id, { uploaded_by: 'Installer', role: 'Installer', phase: 'post_install', measure_name: m, description: desc, house_side: side, photo_data: reader.result, file_name: file.name })
                                          .then(() => loadJobs());
                                        };
                                        reader.readAsDataURL(file); e.target.value = '';
                                      }} />
                                    </label>
                                    <label className="btn btn-sm btn-primary" style={{ fontSize: 10, padding: '3px 8px', cursor: 'pointer', margin: 0 }}>
                                      Upload
                                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                                        const file = e.target.files[0]; if (!file) return;
                                        const desc = document.getElementById(`inst-desc-${job.id}-${m}`).value || `${m} - post install`;
                                        const side = document.getElementById(`inst-side-${job.id}-${m}`).value;
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                          api.uploadPhoto(job.id, { uploaded_by: 'Installer', role: 'Installer', phase: 'post_install', measure_name: m, description: desc, house_side: side, photo_data: reader.result, file_name: file.name })
                                          .then(() => loadJobs());
                                        };
                                        reader.readAsDataURL(file); e.target.value = '';
                                      }} />
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </>
                          );
                        })()}
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
                            api.createChangeOrder(job.id, { requested_by: 'Installer', request_type: 'scope_change', description: desc, reason })
                            .then(() => { loadJobs(); document.getElementById(`co-desc-${job.id}`).value = ''; document.getElementById(`co-reason-${job.id}`).value = ''; });
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
                      <Link to={`/job/${job.id}`} onClick={e => e.stopPropagation()} style={{ cursor: 'pointer', color: '#1a73e8', textDecoration: 'none', fontWeight: 'bold' }}
                      >{job.customer_name}</Link>
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
                        {(() => {
                          const hvacPhotos = (job.photos || []).filter(p => p.role === 'HVAC');
                          return (
                            <>
                              {hvacPhotos.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                                  {hvacPhotos.map(p => (
                                    <div key={p.id} style={{ width: 110, border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden', background: '#fff', fontSize: 10 }}>
                                      {p.has_photo ? (
                                        <LazyPhoto id={p.id} alt={p.description} style={{ width: '100%', height: 80, objectFit: 'cover' }} />
                                      ) : (
                                        <div style={{ width: '100%', height: 80, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>No image</div>
                                      )}
                                      <div style={{ padding: 4 }}>
                                        <div>{p.description}</div>
                                        <div style={{ color: '#888' }}>{p.created_at?.split('T')[0]}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                <input id={`hvac-desc-${job.id}`} style={{ flex: 1, minWidth: 150, fontSize: 11, padding: '3px 6px' }} placeholder="Photo description (e.g., Furnace data tag, Combustion readings)" />
                                <label className="btn btn-sm btn-primary" style={{ fontSize: 10, cursor: 'pointer', margin: 0 }}>
                                  Camera
                                  <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => {
                                    const file = e.target.files[0]; if (!file) return;
                                    const desc = document.getElementById(`hvac-desc-${job.id}`).value || 'HVAC equipment photo';
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      api.uploadPhoto(job.id, { uploaded_by: 'HVAC Tech', role: 'HVAC', phase: 'hvac', description: desc, photo_data: reader.result, file_name: file.name })
                                      .then(() => loadJobs());
                                    };
                                    reader.readAsDataURL(file); e.target.value = '';
                                  }} />
                                </label>
                                <label className="btn btn-sm btn-success" style={{ fontSize: 10, cursor: 'pointer', margin: 0 }}>
                                  Upload
                                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                                    const file = e.target.files[0]; if (!file) return;
                                    const desc = document.getElementById(`hvac-desc-${job.id}`).value || 'HVAC equipment photo';
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      api.uploadPhoto(job.id, { uploaded_by: 'HVAC Tech', role: 'HVAC', phase: 'hvac', description: desc, photo_data: reader.result, file_name: file.name })
                                      .then(() => loadJobs());
                                    };
                                    reader.readAsDataURL(file); e.target.value = '';
                                  }} />
                                </label>
                              </div>
                            </>
                          );
                        })()}
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
                    api.updateChangeOrder(co.id, { status: 'approved', reviewed_by: role, review_notes: notes })
                    .then(() => loadJobs());
                  }}>Approve</button>
                  <button className="btn btn-sm btn-danger" style={{ fontSize: 11 }} onClick={() => {
                    const notes = document.getElementById(`co-review-${co.id}`).value;
                    api.updateChangeOrder(co.id, { status: 'denied', reviewed_by: role, review_notes: notes })
                    .then(() => loadJobs());
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
