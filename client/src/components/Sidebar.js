import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = {
  Admin: [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/hes-ie', icon: '📋', label: 'HES IE Program' },
    { path: '/hr', icon: '👥', label: 'HR - Employees' },
    { path: '/it', icon: '💻', label: 'IT - Equipment' },
    { path: '/warehouse', icon: '📦', label: 'Warehouse' },
    { path: '/kpi', icon: '🎯', label: 'KPI Management' },
    { path: '/finance', icon: '💰', label: 'Finance' },
    { path: '/billing', icon: '🧾', label: 'Termination Billing' },
  ],
  HR: [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/hes-ie', icon: '📋', label: 'HES IE Program' },
    { path: '/hr', icon: '👥', label: 'HR - Employees' },
    { path: '/billing', icon: '🧾', label: 'Termination Billing' },
    { path: '/kpi', icon: '🎯', label: 'KPI Tracking' },
  ],
  IT: [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/hes-ie', icon: '📋', label: 'HES IE Program' },
    { path: '/it', icon: '💻', label: 'IT - Equipment' },
    { path: '/kpi', icon: '🎯', label: 'KPI Tracking' },
  ],
  Warehouse: [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/hes-ie', icon: '📋', label: 'HES IE Program' },
    { path: '/warehouse', icon: '📦', label: 'Warehouse' },
    { path: '/kpi', icon: '🎯', label: 'KPI Tracking' },
  ],
  Finance: [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/hes-ie', icon: '📋', label: 'HES IE Program' },
    { path: '/finance', icon: '💰', label: 'Finance' },
    { path: '/billing', icon: '🧾', label: 'Termination Billing' },
    { path: '/kpi', icon: '🎯', label: 'KPI Tracking' },
  ],
  Operations: [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/hes-ie', icon: '📋', label: 'HES IE Program' },
    { path: '/kpi', icon: '🎯', label: 'KPI Management' },
  ],
  'Program Manager': [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/hes-ie', icon: '📋', label: 'HES IE Program' },
    { path: '/kpi', icon: '🎯', label: 'KPI Tracking' },
  ],
  Assessor: [
    { path: '/hes-ie', icon: '📋', label: 'My Assessments' },
  ],
  Installer: [
    { path: '/hes-ie', icon: '📋', label: 'My Jobs' },
  ],
  HVAC: [
    { path: '/hes-ie', icon: '📋', label: 'HVAC Jobs' },
  ],
};

export default function Sidebar({ currentRole, setCurrentRole, roles, open, toggle }) {
  const items = NAV_ITEMS[currentRole] || NAV_ITEMS.Admin;

  return (
    <nav className={`sidebar ${open ? '' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>AssuredOpsSuite</h2>
        <p>Company Operations Portal</p>
      </div>

      <div className="role-selector">
        <label>Current Role View</label>
        <select value={currentRole} onChange={e => setCurrentRole(e.target.value)}>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="nav-section">
        <div className="nav-section-title">Navigation</div>
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
