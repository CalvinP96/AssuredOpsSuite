import { supabase } from './supabaseClient';

// ========== EMPLOYEES ==========

export async function getEmployees(status, department) {
  let query = supabase.from('employees').select('*');
  if (status) query = query.eq('status', status);
  if (department) query = query.eq('department', department);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getEmployeeStats() {
  const { data, error } = await supabase.from('employees').select('*');
  if (error) throw error;
  const employees = data || [];
  const active = employees.filter(e => e.status === 'active');
  const terminated = employees.filter(e => e.status === 'terminated');
  const byDept = {};
  active.forEach(e => { byDept[e.department] = (byDept[e.department] || 0) + 1; });
  return {
    total: employees.length,
    active: active.length,
    terminated: terminated.length,
    by_department: Object.entries(byDept).map(([department, count]) => ({ department, count }))
  };
}

export async function getEmployee(id) {
  const { data: employee, error } = await supabase.from('employees').select('*').eq('id', id).single();
  if (error) throw error;
  const { data: assignments } = await supabase
    .from('equipment_assignments')
    .select('*, equipment_catalog(name, category, unit_cost)')
    .eq('employee_id', id);
  employee.equipment = (assignments || []).map(a => ({
    ...a,
    equipment_name: a.equipment_catalog?.name,
    category: a.equipment_catalog?.category,
    unit_cost: a.equipment_catalog?.unit_cost,
    equipment_catalog: undefined
  }));
  return employee;
}

export async function createEmployee(data) {
  const { error } = await supabase.from('employees').insert(data);
  if (error) throw error;
}

export async function updateEmployee(id, data) {
  const { updated_at, ...rest } = data;
  const { error } = await supabase.from('employees').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function terminateEmployee(id, terminationData) {
  // Update employee status
  const { error: empErr } = await supabase.from('employees')
    .update({
      status: 'terminated',
      termination_date: terminationData.termination_date,
      notes: terminationData.notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  if (empErr) throw empErr;

  // Find unreturned equipment and calculate cost
  const { data: unreturned } = await supabase
    .from('equipment_assignments')
    .select('*, equipment_catalog(unit_cost, name)')
    .eq('employee_id', id)
    .is('returned_date', null);
  const items = unreturned || [];
  const totalCost = items.reduce((sum, a) => sum + (a.equipment_catalog?.unit_cost || 0), 0);

  // Create termination bill
  const { error: billErr } = await supabase.from('termination_bills').insert({
    employee_id: id,
    total_equipment_cost: totalCost,
    items_not_returned: items.length,
    amount_due: totalCost,
    notes: terminationData.notes || null
  });
  if (billErr) throw billErr;
}

// ========== EQUIPMENT ==========

export async function getCatalog() {
  const { data, error } = await supabase.from('equipment_catalog').select('*').order('category').order('name');
  if (error) throw error;
  return data || [];
}

export async function createCatalogItem(data) {
  const { error } = await supabase.from('equipment_catalog').insert(data);
  if (error) throw error;
}

export async function updateCatalogItem(id, data) {
  const { error } = await supabase.from('equipment_catalog').update(data).eq('id', id);
  if (error) throw error;
}

export async function deleteCatalogItem(id) {
  const { error } = await supabase.from('equipment_catalog').delete().eq('id', id);
  if (error) throw error;
}

export async function getAssignments(filters = {}) {
  let query = supabase.from('equipment_assignments')
    .select('*, equipment_catalog(name, category, unit_cost), employees(first_name, last_name, department)');
  if (filters.department) query = query.eq('department', filters.department);
  if (filters.employee_id) query = query.eq('employee_id', filters.employee_id);
  if (filters.status === 'active') query = query.is('returned_date', null);
  if (filters.status === 'returned') query = query.not('returned_date', 'is', null);
  const { data, error } = await query.order('assigned_date', { ascending: false });
  if (error) throw error;
  return (data || []).map(a => ({
    ...a,
    equipment_name: a.equipment_catalog?.name,
    category: a.equipment_catalog?.category,
    unit_cost: a.equipment_catalog?.unit_cost,
    first_name: a.employees?.first_name,
    last_name: a.employees?.last_name,
    emp_department: a.employees?.department,
    equipment_catalog: undefined,
    employees: undefined
  }));
}

export async function createAssignment(data) {
  const { data: inserted, error } = await supabase.from('equipment_assignments').insert(data).select().single();
  if (error) throw error;
  return inserted;
}

export async function returnAssignment(id, data) {
  const { error } = await supabase.from('equipment_assignments').update(data).eq('id', id);
  if (error) throw error;
}

export async function getCostSummary(employeeId) {
  const { data, error } = await supabase
    .from('equipment_assignments')
    .select('*, equipment_catalog(name, category, unit_cost)')
    .eq('employee_id', employeeId);
  if (error) throw error;
  const assignments = (data || []).map(a => ({
    ...a,
    equipment_name: a.equipment_catalog?.name,
    category: a.equipment_catalog?.category,
    unit_cost: a.equipment_catalog?.unit_cost,
    equipment_catalog: undefined
  }));
  const totalCost = assignments.reduce((sum, a) => sum + (a.unit_cost || 0), 0);
  const unreturned = assignments.filter(a => !a.returned_date);
  return {
    total_items: assignments.length,
    total_cost_issued: totalCost,
    items_unreturned: unreturned.length,
    unreturned_cost: unreturned.reduce((sum, a) => sum + (a.unit_cost || 0), 0),
    assignments
  };
}

// ========== KPIS ==========

export async function getKpis(filters = {}) {
  let query = supabase.from('kpis').select('*');
  if (filters.department) query = query.eq('department', filters.department);
  if (filters.category) query = query.eq('category', filters.category);
  const { data, error } = await query.order('category').order('name');
  if (error) throw error;
  return data || [];
}

export async function getKpiDashboard() {
  const { data, error } = await supabase.from('kpis').select('*');
  if (error) throw error;
  const kpis = data || [];
  const byCategory = {};
  const byDept = {};
  kpis.forEach(k => {
    byCategory[k.category] = (byCategory[k.category] || 0) + 1;
    if (k.department) byDept[k.department] = (byDept[k.department] || 0) + 1;
  });
  return {
    total: kpis.length,
    on_track: kpis.filter(k => k.status === 'on_track').length,
    at_risk: kpis.filter(k => k.status === 'at_risk').length,
    off_track: kpis.filter(k => k.status === 'off_track').length,
    by_category: Object.entries(byCategory).map(([category, count]) => ({ category, count })),
    by_department: Object.entries(byDept).map(([department, count]) => ({ department, count }))
  };
}

export async function getKpi(id) {
  const { data: kpi, error } = await supabase.from('kpis').select('*').eq('id', id).single();
  if (error) throw error;
  const { data: history } = await supabase.from('kpi_history')
    .select('*')
    .eq('kpi_id', id)
    .order('recorded_date', { ascending: false })
    .limit(30);
  kpi.history = history || [];
  return kpi;
}

export async function createKpi(data) {
  const { error } = await supabase.from('kpis').insert(data);
  if (error) throw error;
}

export async function updateKpi(id, data) {
  // Auto-calculate status if not provided
  let status = data.status;
  if (!status && data.current_value != null && data.target_value) {
    const pct = (data.current_value / data.target_value) * 100;
    if (pct >= 90) status = 'on_track';
    else if (pct >= 70) status = 'at_risk';
    else status = 'off_track';
  }

  const { error: updateErr } = await supabase.from('kpis')
    .update({ ...data, status: status || data.status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (updateErr) throw updateErr;

  // Record history
  if (data.current_value != null) {
    await supabase.from('kpi_history').insert({
      kpi_id: id,
      value: data.current_value,
      recorded_date: new Date().toISOString().split('T')[0],
      notes: data.notes || null
    });
  }
}

export async function deleteKpi(id) {
  await supabase.from('kpi_history').delete().eq('kpi_id', id);
  const { error } = await supabase.from('kpis').delete().eq('id', id);
  if (error) throw error;
}

// ========== BILLING ==========

export async function getBills() {
  const { data, error } = await supabase
    .from('termination_bills')
    .select('*, employees(first_name, last_name, department, position)')
    .order('bill_date', { ascending: false });
  if (error) throw error;
  return (data || []).map(b => ({
    ...b,
    first_name: b.employees?.first_name,
    last_name: b.employees?.last_name,
    department: b.employees?.department,
    position: b.employees?.position,
    employees: undefined
  }));
}

export async function getBillStats() {
  const { data, error } = await supabase.from('termination_bills').select('*');
  if (error) throw error;
  const bills = data || [];
  return {
    total_bills: bills.length,
    total_amount_due: bills.reduce((sum, b) => sum + (b.amount_due || 0), 0),
    pending: bills.filter(b => b.status === 'pending').length,
    paid: bills.filter(b => b.status === 'paid').length
  };
}

export async function getBill(id) {
  const { data: bill, error } = await supabase
    .from('termination_bills')
    .select('*, employees(first_name, last_name, department, position, hire_date, termination_date)')
    .eq('id', id)
    .single();
  if (error) throw error;
  const result = {
    ...bill,
    first_name: bill.employees?.first_name,
    last_name: bill.employees?.last_name,
    department: bill.employees?.department,
    position: bill.employees?.position,
    hire_date: bill.employees?.hire_date,
    termination_date: bill.employees?.termination_date,
    employees: undefined
  };
  // Get equipment for the employee
  const { data: equipment } = await supabase
    .from('equipment_assignments')
    .select('*, equipment_catalog(name, category, unit_cost)')
    .eq('employee_id', bill.employee_id);
  result.equipment = (equipment || []).map(a => ({
    ...a,
    equipment_name: a.equipment_catalog?.name,
    category: a.equipment_catalog?.category,
    unit_cost: a.equipment_catalog?.unit_cost,
    equipment_catalog: undefined
  }));
  return result;
}

export async function updateBill(id, data) {
  const { error } = await supabase.from('termination_bills').update(data).eq('id', id);
  if (error) throw error;
}

// ========== PROGRAMS ==========

export async function getPrograms() {
  const { data: programs, error } = await supabase.from('programs').select('*').order('name');
  if (error) throw error;
  // Get counts for each program
  for (const p of (programs || [])) {
    const { count: docCount } = await supabase.from('program_documents').select('*', { count: 'exact', head: true }).eq('program_id', p.id);
    const { count: taskCount } = await supabase.from('program_tasks').select('*', { count: 'exact', head: true }).eq('program_id', p.id);
    const { count: openTasks } = await supabase.from('program_tasks').select('*', { count: 'exact', head: true }).eq('program_id', p.id).neq('status', 'done');
    p.doc_count = docCount || 0;
    p.task_count = taskCount || 0;
    p.open_tasks = openTasks || 0;
  }
  return programs || [];
}

export async function getProgram(id) {
  const { data, error } = await supabase.from('programs').select(`
    *,
    program_documents(*),
    program_tasks(*),
    program_milestones(*),
    program_measures(*, measure_photo_requirements(*), measure_paperwork_requirements(*)),
    program_process_steps(*),
    program_eligibility_rules(*),
    program_deferral_rules(*)
  `).eq('id', id).single();
  if (error) throw error;

  return {
    ...data,
    documents: (data.program_documents || []).sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')),
    tasks: (data.program_tasks || []).sort((a, b) => {
      const priOrder = { high: 0, medium: 1, low: 2 };
      return (priOrder[a.priority] || 1) - (priOrder[b.priority] || 1) || (a.due_date || '').localeCompare(b.due_date || '');
    }),
    milestones: (data.program_milestones || []).sort((a, b) => (a.target_date || '').localeCompare(b.target_date || '')),
    measures: (data.program_measures || [])
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.category.localeCompare(b.category))
      .map(m => ({
        ...m,
        photo_requirements: (m.measure_photo_requirements || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
        paperwork_requirements: (m.measure_paperwork_requirements || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
        measure_photo_requirements: undefined,
        measure_paperwork_requirements: undefined
      })),
    process_steps: (data.program_process_steps || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.step_number - b.step_number),
    eligibility_rules: (data.program_eligibility_rules || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    deferral_rules: (data.program_deferral_rules || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    program_documents: undefined,
    program_tasks: undefined,
    program_milestones: undefined,
    program_measures: undefined,
    program_process_steps: undefined,
    program_eligibility_rules: undefined,
    program_deferral_rules: undefined
  };
}

export async function createProgram(data) {
  const { error } = await supabase.from('programs').insert(data);
  if (error) throw error;
}

export async function updateProgram(id, data) {
  const { error } = await supabase.from('programs').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function deleteProgram(id) {
  await supabase.from('program_milestones').delete().eq('program_id', id);
  await supabase.from('program_tasks').delete().eq('program_id', id);
  await supabase.from('program_documents').delete().eq('program_id', id);
  const { error } = await supabase.from('programs').delete().eq('id', id);
  if (error) throw error;
}

// --- Documents ---
export async function createDocument(programId, data) {
  const { error } = await supabase.from('program_documents').insert({ ...data, program_id: programId });
  if (error) throw error;
}

export async function updateDocument(docId, data) {
  const { id, program_id, created_at, ...rest } = data;
  const { error } = await supabase.from('program_documents').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', docId);
  if (error) throw error;
}

export async function deleteDocument(docId) {
  const { error } = await supabase.from('program_documents').delete().eq('id', docId);
  if (error) throw error;
}

// --- Tasks ---
export async function createTask(programId, data) {
  const { error } = await supabase.from('program_tasks').insert({ ...data, program_id: programId });
  if (error) throw error;
}

export async function updateTask(taskId, data) {
  const { id, program_id, created_at, ...rest } = data;
  // Auto-set completed_date
  if (rest.status === 'done' && !rest.completed_date) {
    rest.completed_date = new Date().toISOString().split('T')[0];
  }
  const { error } = await supabase.from('program_tasks').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', taskId);
  if (error) throw error;
}

// --- Milestones ---
export async function createMilestone(programId, data) {
  const { error } = await supabase.from('program_milestones').insert({ ...data, program_id: programId });
  if (error) throw error;
}

export async function updateMilestone(msId, data) {
  const { id, program_id, created_at, ...rest } = data;
  const { error } = await supabase.from('program_milestones').update(rest).eq('id', msId);
  if (error) throw error;
}

// --- Jobs ---
export async function getJobs(programId) {
  const { data, error } = await supabase
    .from('program_jobs')
    .select(`
      *,
      job_measures(*, program_measures(name, category)),
      job_checklist_items(*),
      hvac_replacements(*),
      change_orders(*),
      job_photos(id, uploaded_by, role, phase, measure_name, house_side, description, photo_ref, file_name, created_at)
    `)
    .eq('program_id', programId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map(formatJob);
}

function formatJob(job) {
  return {
    ...job,
    measures: (job.job_measures || []).map(jm => ({
      ...jm,
      name: jm.program_measures?.name,
      category: jm.program_measures?.category,
      program_measures: undefined,
    })),
    checklist: (job.job_checklist_items || []).sort((a, b) => {
      if (a.item_type !== b.item_type) return a.item_type.localeCompare(b.item_type);
      return a.id - b.id;
    }),
    hvac_replacements: (job.hvac_replacements || []).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    change_orders: (job.change_orders || []).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    photos: (job.job_photos || []).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    job_measures: undefined,
    job_checklist_items: undefined,
    job_photos: undefined
  };
}

export async function createJob(programId, data) {
  // Insert the job
  const { data: job, error } = await supabase
    .from('program_jobs')
    .insert({ ...data, program_id: programId })
    .select()
    .single();
  if (error) throw error;

  // Auto-generate checklist items from program measures
  const { data: measures } = await supabase
    .from('program_measures')
    .select('*, measure_photo_requirements(*), measure_paperwork_requirements(*)')
    .eq('program_id', programId);

  const checklistItems = [];
  (measures || []).forEach(m => {
    (m.measure_photo_requirements || []).forEach(pr => {
      checklistItems.push({
        job_id: job.id,
        item_type: 'photo',
        description: `${m.name}: ${pr.photo_description}`,
        measure_id: m.id
      });
    });
    (m.measure_paperwork_requirements || []).forEach(pr => {
      checklistItems.push({
        job_id: job.id,
        item_type: 'paperwork',
        description: `${m.name}: ${pr.document_name}`,
        measure_id: m.id
      });
    });
  });

  // Add job-level paperwork items
  const jobPaperwork = [
    'Assessment Report uploaded to RISE',
    'CAZ results documented in RISE',
    'Pre-installation photos uploaded (zip or Company Cam link)',
    'RISE data entry complete (all baseline data)',
    'LiDAR scan stored in SharePoint',
    'MS Forms assessment survey completed',
    'Customer Authorization Form signed and uploaded',
    'Scope of Work signed by customer',
    'Estimate with program pricing uploaded',
    'Post-installation photos uploaded',
    'Final Inspection Form signed (Appendix F)',
    'Customer Satisfaction Survey left with customer'
  ];
  jobPaperwork.forEach(desc => {
    checklistItems.push({ job_id: job.id, item_type: 'paperwork', description: desc });
  });

  if (checklistItems.length > 0) {
    await supabase.from('job_checklist_items').insert(checklistItems);
  }

  return job;
}

export async function updateJob(jobId, data) {
  const { id, program_id, created_at, measures, checklist, photos, hvac_replacements, change_orders, job_measures, job_checklist_items, job_photos, ...rest } = data;
  const { error } = await supabase.from('program_jobs').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', jobId);
  if (error) throw error;
}

export async function saveAssessmentData(jobId, assessmentData) {
  const { error } = await supabase.from('program_jobs')
    .update({ assessment_data: typeof assessmentData === 'string' ? assessmentData : JSON.stringify(assessmentData) })
    .eq('id', jobId);
  if (error) throw error;
}

export async function saveScopeData(jobId, scopeData) {
  const { error } = await supabase.from('program_jobs')
    .update({ scope_data: typeof scopeData === 'string' ? scopeData : JSON.stringify(scopeData) })
    .eq('id', jobId);
  if (error) throw error;
}

export async function updateChecklist(itemId, data) {
  const updates = { ...data };
  if (data.completed) {
    updates.completed_date = new Date().toISOString().split('T')[0];
  } else {
    updates.completed_date = null;
  }
  const { error } = await supabase.from('job_checklist_items').update(updates).eq('id', itemId);
  if (error) throw error;
}

export async function getJobDetail(jobId) {
  const { data, error } = await supabase
    .from('program_jobs')
    .select(`
      *,
      job_measures(*, program_measures(name, category)),
      job_checklist_items(*),
      hvac_replacements(*),
      change_orders(*),
      job_photos(id, uploaded_by, role, phase, measure_name, house_side, description, photo_ref, file_name, created_at)
    `)
    .eq('id', jobId)
    .single();
  if (error) throw error;
  return formatJob(data);
}

export async function getJobExport(jobId) {
  // Get job
  const { data: job } = await supabase.from('program_jobs').select('*').eq('id', jobId).single();

  // Get photos (metadata + has_photo flag)
  const { data: photos } = await supabase
    .from('job_photos')
    .select('id, uploaded_by, role, phase, measure_name, house_side, description, photo_ref, file_name, created_at, photo_data')
    .eq('job_id', jobId)
    .order('phase')
    .order('house_side')
    .order('created_at');

  // Get checklist
  const { data: checklist } = await supabase
    .from('job_checklist_items')
    .select('*')
    .eq('job_id', jobId)
    .order('item_type')
    .order('id');

  // Group photos by phase and house_side
  const grouped = {};
  const sides = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Interior', 'Other'];
  (photos || []).forEach(p => {
    const phase = ['assessment', 'pre_install'].includes(p.phase) ? 'pre_installation' : 'post_installation';
    const side = p.house_side || 'Other';
    if (!grouped[phase]) grouped[phase] = {};
    if (!grouped[phase][side]) grouped[phase][side] = [];
    grouped[phase][side].push({
      ...p,
      has_photo: !!(p.photo_data || p.photo_ref),
      photo_data: undefined
    });
  });

  return {
    job,
    photos_by_phase: grouped,
    photo_count: (photos || []).length,
    pre_installation_count: (photos || []).filter(p => ['assessment', 'pre_install'].includes(p.phase)).length,
    post_installation_count: (photos || []).filter(p => !['assessment', 'pre_install'].includes(p.phase)).length,
    checklist: checklist || [],
    house_sides: sides
  };
}

export async function getForecast(programId, from, to) {
  // Get all jobs
  const { data: allJobs } = await supabase.from('program_jobs').select('*').eq('program_id', programId);
  const jobs = allJobs || [];

  const submittedStatuses = ['submitted', 'invoiced', 'complete'];
  const submittedInRange = jobs.filter(j =>
    submittedStatuses.includes(j.status) &&
    j.submission_date &&
    (!from || j.submission_date >= from) &&
    (!to || j.submission_date <= to)
  );

  const inProgressJobs = jobs.filter(j =>
    !submittedStatuses.includes(j.status) && j.status !== 'deferred'
  );

  // For each in-progress job, get measures and calculate completion
  const projectedJobs = [];
  for (const j of inProgressJobs) {
    const { data: measures } = await supabase
      .from('job_measures')
      .select('*, program_measures(category, name)')
      .eq('job_id', j.id);

    const ms = measures || [];
    const hasInsulation = ms.some(m => ['Insulation', 'Air Sealing & Duct Sealing'].includes(m.program_measures?.category));
    const hasWallInjection = ms.some(m => m.program_measures?.name === 'Wall Insulation');
    const hasTuneUp = ms.some(m => m.program_measures?.name?.includes('Tune-Up'));
    const hasReplacement = ms.some(m => m.program_measures?.name?.includes('Replacement'));

    const completedTypes = [];
    const pendingTypes = [];

    if (hasInsulation) { (j.abc_install_date ? completedTypes : pendingTypes).push('ABC Install'); }
    if (hasWallInjection) { (j.wall_injection_date ? completedTypes : pendingTypes).push('Wall Injection'); }
    if (hasInsulation || hasWallInjection) { (j.patch_date ? completedTypes : pendingTypes).push('Patch'); }
    if (hasTuneUp) { (j.hvac_tune_clean_date ? completedTypes : pendingTypes).push('HVAC Tune & Clean'); }
    if (hasReplacement) { (j.hvac_replacement_date ? completedTypes : pendingTypes).push('HVAC Replacement'); }

    const totalTypes = completedTypes.length + pendingTypes.length;
    const completionPct = totalTypes > 0 ? Math.round((completedTypes.length / totalTypes) * 100) : 0;
    const scheduledDates = [j.abc_install_date, j.wall_injection_date, j.patch_date, j.hvac_tune_clean_date, j.hvac_replacement_date].filter(Boolean).sort();
    const latestScheduled = scheduledDates.length > 0 ? scheduledDates[scheduledDates.length - 1] : null;

    projectedJobs.push({
      ...j,
      measures_count: ms.length,
      completed_types: completedTypes,
      pending_types: pendingTypes,
      completion_pct: completionPct,
      projected_submission: latestScheduled,
      ready_to_submit: pendingTypes.length === 0 && totalTypes > 0
    });
  }

  const projectedInRange = projectedJobs.filter(j =>
    j.projected_submission &&
    (!from || j.projected_submission >= from) &&
    (!to || j.projected_submission <= to)
  );

  const pipeline = {};
  jobs.forEach(j => { pipeline[j.status] = (pipeline[j.status] || 0) + 1; });

  const permitJobs = jobs.filter(j => j.needs_permit);
  const permitSummary = {
    total_needing_permit: permitJobs.length,
    not_applied: permitJobs.filter(j => j.permit_status === 'not_applied' || j.permit_status === 'not_needed').length,
    applied: permitJobs.filter(j => j.permit_status === 'applied').length,
    received: permitJobs.filter(j => j.permit_status === 'received').length,
    issues: permitJobs.filter(j => j.permit_status === 'issue').length
  };

  return {
    date_range: { from: from || 'all', to: to || 'all' },
    submitted: {
      count: submittedInRange.length,
      total_estimate: submittedInRange.reduce((sum, j) => sum + (j.estimate_amount || 0), 0),
      jobs: submittedInRange
    },
    projected: {
      count: projectedInRange.length,
      total_estimate: projectedInRange.reduce((sum, j) => sum + (j.estimate_amount || 0), 0),
      jobs: projectedInRange
    },
    ready_to_submit: projectedJobs.filter(j => j.ready_to_submit),
    pipeline,
    permit_summary: permitSummary,
    all_in_progress: projectedJobs
  };
}

// --- HVAC ---
export async function createHvac(jobId, data) {
  const { error } = await supabase.from('hvac_replacements').insert({ ...data, job_id: jobId });
  if (error) throw error;
}

export async function updateHvac(hvacId, data) {
  const { id, job_id, created_at, ...rest } = data;
  const { error } = await supabase.from('hvac_replacements').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', hvacId);
  if (error) throw error;
}

// --- Photos ---
export async function uploadPhoto(jobId, data) {
  const { error } = await supabase.from('job_photos').insert({ ...data, job_id: jobId });
  if (error) throw error;
}

export async function getPhotoData(photoId) {
  const { data, error } = await supabase.from('job_photos').select('photo_data').eq('id', photoId).single();
  if (error) throw error;
  return data?.photo_data || '';
}

export async function deletePhoto(photoId) {
  const { error } = await supabase.from('job_photos').delete().eq('id', photoId);
  if (error) throw error;
}

// --- Change Orders ---
export async function createChangeOrder(jobId, data) {
  const { error } = await supabase.from('change_orders').insert({ ...data, job_id: jobId });
  if (error) throw error;
}

export async function updateChangeOrder(coId, data) {
  const { id, job_id, created_at, ...rest } = data;
  const updates = {
    ...rest,
    review_date: new Date().toISOString().split('T')[0]
  };
  const { error } = await supabase.from('change_orders').update(updates).eq('id', coId);
  if (error) throw error;
}

// --- HES-IE ---
export async function getHesIeProgram() {
  const { data, error } = await supabase.from('programs').select('*').eq('code', 'HES-IE').single();
  if (error) throw error;
  return data;
}

// --- Job Measures ---
export async function createJobMeasure(jobId, data) {
  const { data: result, error } = await supabase
    .from('job_measures')
    .insert({ ...data, job_id: jobId })
    .select('*, program_measures(name, category)')
    .single();
  if (error) throw error;
  return result;
}

export async function updateJobMeasure(jmId, data) {
  const { error } = await supabase.from('job_measures').update(data).eq('id', jmId);
  if (error) throw error;
}
