// Job phases in workflow order
export const JOB_PHASES = [
  { key: 'intake', label: 'Intake', icon: '\u{1F4E5}', statuses: ['assessment_scheduled'] },
  { key: 'schedule', label: 'Schedule', icon: '\u{1F4C5}', statuses: ['assessment_scheduled'] },
  { key: 'assess', label: 'Assess', icon: '\u{1F50D}', statuses: ['assessment_complete'] },
  { key: 'scope', label: 'Scope', icon: '\u{1F4CB}', statuses: ['pre_approval'] },
  { key: 'in_review', label: 'In Review', icon: '\u{1F504}', statuses: ['in_review'] },
  { key: 'pre_approved', label: 'Pre-Approved', icon: '\u2705', statuses: ['approved'] },
  { key: 'install', label: 'Install', icon: '\u{1F3D7}\uFE0F', statuses: ['install_scheduled', 'install_in_progress'] },
  { key: 'post_qc', label: 'Post-QC', icon: '\u{1F50E}', statuses: ['inspection'] },
  { key: 'closeout', label: 'Closeout', icon: '\u{1F4E6}', statuses: ['submitted', 'invoiced'] },
  { key: 'complete', label: 'Complete', icon: '\u{1F389}', statuses: ['complete'] },
];

// All valid job statuses
export const JOB_STATUSES = [
  'assessment_scheduled', 'assessment_complete', 'pre_approval', 'in_review',
  'approved', 'install_scheduled', 'install_in_progress', 'inspection',
  'submitted', 'invoiced', 'complete', 'deferred'
];

// Get phase for a given status
export function getPhaseForStatus(status) {
  return JOB_PHASES.find(p => p.statuses.includes(status)) || JOB_PHASES[0];
}

// Days in phase thresholds for stale badges
export const STALE_THRESHOLDS = { warning: 8, danger: 15 };

// Get stale level for a job
export function getStaleBadge(job) {
  const days = Math.floor((Date.now() - new Date(job.updated_at)) / 86400000);
  if (days >= STALE_THRESHOLDS.danger) return { level: 'danger', days, label: days + 'd' };
  if (days >= STALE_THRESHOLDS.warning) return { level: 'warning', days, label: days + 'd' };
  return { level: 'ok', days, label: days + 'd' };
}

// Utilities
export const UTILITIES = ['ComEd', 'Nicor Gas', 'Peoples Gas', 'North Shore Gas'];

// Roles
export const ROLES = ['admin', 'hr', 'it', 'warehouse', 'finance', 'operations', 'program_manager', 'assessor', 'scope_creator', 'installer', 'hvac'];

// Company info
export const COMPANY = {
  name: 'Assured Energy Solutions',
  address: '22530 S Center Road',
  city: 'Frankfort',
  state: 'IL',
  zip: '60423',
};
