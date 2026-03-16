export { generatePreWorkSOW, generatePostWorkSOW, printSOW } from './sowTemplate';

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateInput(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
}

export function daysAgo(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
