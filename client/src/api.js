// API client — calls Express REST backend (proxied via package.json in dev)

const API = '/api';

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ========== EMPLOYEES ==========

export async function getEmployees(status, department) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (department) params.set('department', department);
  const qs = params.toString();
  return request(`${API}/employees${qs ? '?' + qs : ''}`);
}

export async function getEmployeeStats() {
  return request(`${API}/employees/stats/summary`);
}

export async function getEmployee(id) {
  return request(`${API}/employees/${id}`);
}

export async function createEmployee(data) {
  return request(`${API}/employees`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateEmployee(id, data) {
  return request(`${API}/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function terminateEmployee(id, terminationData) {
  return request(`${API}/employees/${id}/terminate`, { method: 'POST', body: JSON.stringify(terminationData) });
}

// ========== EQUIPMENT ==========

export async function getCatalog() {
  return request(`${API}/equipment/catalog`);
}

export async function createCatalogItem(data) {
  return request(`${API}/equipment/catalog`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateCatalogItem(id, data) {
  return request(`${API}/equipment/catalog/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteCatalogItem(id) {
  return request(`${API}/equipment/catalog/${id}`, { method: 'DELETE' });
}

export async function getAssignments(filters = {}) {
  const params = new URLSearchParams();
  if (filters.department) params.set('department', filters.department);
  if (filters.employee_id) params.set('employee_id', filters.employee_id);
  if (filters.status) params.set('status', filters.status);
  const qs = params.toString();
  return request(`${API}/equipment/assignments${qs ? '?' + qs : ''}`);
}

export async function createAssignment(data) {
  return request(`${API}/equipment/assignments`, { method: 'POST', body: JSON.stringify(data) });
}

export async function returnAssignment(id, data) {
  return request(`${API}/equipment/assignments/${id}/return`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function getCostSummary(employeeId) {
  return request(`${API}/equipment/cost-summary/${employeeId}`);
}

// ========== KPIS ==========

export async function getKpis(filters = {}) {
  const params = new URLSearchParams();
  if (filters.department) params.set('department', filters.department);
  if (filters.category) params.set('category', filters.category);
  const qs = params.toString();
  return request(`${API}/kpis${qs ? '?' + qs : ''}`);
}

export async function getKpiDashboard() {
  return request(`${API}/kpis/stats/dashboard`);
}

export async function getKpi(id) {
  return request(`${API}/kpis/${id}`);
}

export async function createKpi(data) {
  return request(`${API}/kpis`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateKpi(id, data) {
  return request(`${API}/kpis/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteKpi(id) {
  return request(`${API}/kpis/${id}`, { method: 'DELETE' });
}

// ========== BILLING ==========

export async function getBills() {
  return request(`${API}/billing`);
}

export async function getBillStats() {
  return request(`${API}/billing/stats/summary`);
}

export async function getBill(id) {
  return request(`${API}/billing/${id}`);
}

export async function updateBill(id, data) {
  return request(`${API}/billing/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// ========== PROGRAMS ==========

export async function getPrograms() {
  return request(`${API}/programs`);
}

export async function getProgram(id) {
  return request(`${API}/programs/${id}`);
}

export async function createProgram(data) {
  return request(`${API}/programs`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateProgram(id, data) {
  return request(`${API}/programs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteProgram(id) {
  return request(`${API}/programs/${id}`, { method: 'DELETE' });
}

// --- Documents ---
export async function createDocument(programId, data) {
  return request(`${API}/programs/${programId}/documents`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateDocument(docId, data) {
  return request(`${API}/programs/documents/${docId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteDocument(docId) {
  return request(`${API}/programs/documents/${docId}`, { method: 'DELETE' });
}

// --- Tasks ---
export async function createTask(programId, data) {
  return request(`${API}/programs/${programId}/tasks`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTask(taskId, data) {
  return request(`${API}/programs/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) });
}

// --- Milestones ---
export async function createMilestone(programId, data) {
  return request(`${API}/programs/${programId}/milestones`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateMilestone(msId, data) {
  return request(`${API}/programs/milestones/${msId}`, { method: 'PUT', body: JSON.stringify(data) });
}

// --- Jobs ---
export async function getJobs(programId) {
  return request(`${API}/programs/${programId}/jobs`);
}

export async function createJob(programId, data) {
  return request(`${API}/programs/${programId}/jobs`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateJob(jobId, data) {
  return request(`${API}/programs/jobs/${jobId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function saveAssessmentData(jobId, assessmentData) {
  return request(`${API}/programs/jobs/${jobId}/assessment`, {
    method: 'PUT',
    body: JSON.stringify({ assessment_data: assessmentData }),
  });
}

export async function saveScopeData(jobId, scopeData) {
  return request(`${API}/programs/jobs/${jobId}/scope`, {
    method: 'PUT',
    body: JSON.stringify({ scope_data: scopeData }),
  });
}

export async function updateChecklist(itemId, data) {
  return request(`${API}/programs/jobs/checklist/${itemId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function getJobDetail(jobId) {
  return request(`${API}/programs/jobs/${jobId}/detail`);
}

export async function getJobExport(jobId) {
  return request(`${API}/programs/jobs/${jobId}/export`);
}

export async function getForecast(programId, from, to) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return request(`${API}/programs/${programId}/jobs/forecast${qs ? '?' + qs : ''}`);
}

// --- HVAC ---
export async function createHvac(jobId, data) {
  return request(`${API}/programs/jobs/${jobId}/hvac`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateHvac(hvacId, data) {
  return request(`${API}/programs/hvac/${hvacId}`, { method: 'PUT', body: JSON.stringify(data) });
}

// --- Photos ---
export async function uploadPhoto(jobId, data) {
  return request(`${API}/programs/jobs/${jobId}/photos`, { method: 'POST', body: JSON.stringify(data) });
}

export async function getPhotoData(photoId) {
  const data = await request(`${API}/programs/photos/${photoId}/image`);
  return data?.photo_data || '';
}

export async function deletePhoto(photoId) {
  return request(`${API}/programs/photos/${photoId}`, { method: 'DELETE' });
}

// --- Change Orders ---
export async function createChangeOrder(jobId, data) {
  return request(`${API}/programs/jobs/${jobId}/change-orders`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateChangeOrder(coId, data) {
  return request(`${API}/programs/change-orders/${coId}`, { method: 'PUT', body: JSON.stringify(data) });
}

// --- HES-IE ---
export async function getHesIeProgram() {
  return request(`${API}/hes-ie-program`);
}

// --- Job Measures ---
export async function createJobMeasure(jobId, data) {
  return request(`${API}/programs/jobs/${jobId}/measures`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateJobMeasure(jmId, data) {
  return request(`${API}/programs/jobs/measures/${jmId}`, { method: 'PUT', body: JSON.stringify(data) });
}
