import React from 'react';
import { getStaleBadge } from '../../constants';

export default function StaleBadge({ job, className }) {
  if (!job?.updated_at) return null;

  const { level, label } = getStaleBadge(job);

  const baseClass = 'stale-badge stale-badge--' + level;
  const cls = className ? baseClass + ' ' + className : baseClass;

  return <span className={cls}>{label}</span>;
}
