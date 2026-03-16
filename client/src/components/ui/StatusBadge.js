import React from 'react';

const STATUS_LABELS = {
  assessment_scheduled: 'Assessment Scheduled',
  assessment_complete: 'Assessment Complete',
  pre_approval: 'Pre-Approval',
  in_review: 'In Review',
  approved: 'Approved',
  install_scheduled: 'Install Scheduled',
  install_in_progress: 'Install In Progress',
  inspection: 'Inspection',
  submitted: 'Submitted',
  invoiced: 'Invoiced',
  complete: 'Complete',
  deferred: 'Deferred',
};

export default function StatusBadge({ status, size }) {
  const normalized = (status || '').replace(/\s+/g, '_').toLowerCase();
  const label = STATUS_LABELS[normalized] || status;
  const className =
    'status-badge status-badge--' + normalized +
    (size === 'sm' ? ' status-badge--sm' : '');

  return <span className={className}>{label}</span>;
}
