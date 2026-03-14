import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

const ALL_NAV_ITEMS = [
  { path: '/', icon: '📊', label: 'Dashboard', category: 'Overview', roles: null },
  { path: '/hes-ie', icon: '📋', label: 'HES IE Program', category: 'Programs', roles: null },
  { path: '/hr', icon: '👥', label: 'HR - Employees', category: 'Management', roles: ['Admin', 'HR'] },
  { path: '/it', icon: '💻', label: 'IT - Equipment', category: 'Management', roles: ['Admin', 'IT'] },
  { path: '/warehouse', icon: '📦', label: 'Warehouse', category: 'Operations', roles: ['Admin', 'Warehouse'] },
  { path: '/kpi', icon: '🎯', label: 'KPI Management', category: 'Operations', roles: ['Admin', 'HR', 'IT', 'Warehouse', 'Finance', 'Operations', 'Program Manager'] },
  { path: '/finance', icon: '💰', label: 'Finance', category: 'Management', roles: ['Admin', 'Finance'] },
  { path: '/billing', icon: '🧾', label: 'Termination Billing', category: 'Management', roles: ['Admin', 'Finance', 'HR'] },
];

const CATEGORY_ORDER = ['Overview', 'Programs', 'Operations', 'Management'];

export default function Sidebar({ currentRoles, setCurrentRoles, allRoles, open, toggle }) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Filter nav items based on selected roles
  const visibleItems = ALL_NAV_ITEMS.filter(item => {
    if (!item.roles) return true;
    return currentRoles.includes('Admin') || item.roles.some(r => currentRoles.includes(r));
  });

  // Group by category
  const grouped = {};
  visibleItems.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const toggleRole = (role) => {
    setCurrentRoles(prev => {
      if (prev.includes(role)) {
        if (prev.length === 1) return prev;
        return prev.filter(r => r !== role);
      }
      return [...prev, role];
    });
  };

  const roleDisplayText = currentRoles.length <= 2
    ? currentRoles.join(', ')
    : `${currentRoles.length} roles selected`;

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={toggle} />}
      <nav className={`sidebar ${open ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>AssuredOpsSuite</h2>
          <p>Company Operations Portal</p>
        </div>

        <div className="role-selector" ref={dropdownRef}>
          <label>Active Roles</label>
          <button
            type="button"
            className="role-dropdown-toggle"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
          >
            <span className="role-dropdown-text">{roleDisplayText}</span>
            <span className="role-dropdown-arrow">{roleDropdownOpen ? '\u25B2' : '\u25BC'}</span>
          </button>
          {roleDropdownOpen && (
            <div className="role-dropdown-menu">
              {allRoles.map(r => (
                <label key={r} className={`role-checkbox-label ${currentRoles.includes(r) ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={currentRoles.includes(r)}
                    onChange={() => toggleRole(r)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-nav">
          {CATEGORY_ORDER.filter(cat => grouped[cat]).map(cat => (
            <div className="nav-section" key={cat}>
              <div className="nav-section-title">{cat}</div>
              {grouped[cat].map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => { if (window.innerWidth <= 768) toggle(); }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
