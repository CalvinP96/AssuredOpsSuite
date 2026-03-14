import React, { useLayoutEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ALL_NAV_ITEMS = [
  { path: '/', icon: '📊', label: 'Dashboard', category: 'Overview', roles: null },
  { path: '/hes-ie', icon: '📋', label: 'HES IE Program', category: 'Programs', roles: null },
  { path: '/hr', icon: '👥', label: 'HR - Employees', category: 'Management', roles: ['Admin', 'HR'] },
  { path: '/it', icon: '💻', label: 'IT - Equipment', category: 'Management', roles: ['Admin', 'IT'] },
  { path: '/warehouse', icon: '📦', label: 'Warehouse', category: 'Operations', roles: ['Admin', 'Warehouse'] },
  { path: '/kpi', icon: '🎯', label: 'KPI Management', category: 'Operations', roles: ['Admin', 'HR', 'IT', 'Warehouse', 'Finance', 'Operations', 'Program Manager'] },
  { path: '/finance', icon: '💰', label: 'Finance', category: 'Management', roles: ['Admin', 'Finance'] },
  { path: '/billing', icon: '🧾', label: 'Termination Billing', category: 'Management', roles: ['Admin', 'Finance', 'HR'] },
  { path: '/audit', icon: '📋', label: 'Audit Log', category: 'Management', roles: ['Admin'] },
];

const CATEGORY_ORDER = ['Overview', 'Programs', 'Operations', 'Management'];

export default function Sidebar({ user, currentRoles, open, toggle }) {
  const visibleItems = ALL_NAV_ITEMS.filter(item => {
    if (!item.roles) return true;
    return currentRoles.includes('Admin') || item.roles.some(r => currentRoles.includes(r));
  });

  const grouped = {};
  visibleItems.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  // Close sidebar on mobile initial load
  useLayoutEffect(() => {
    if (window.innerWidth <= 768 && open) toggle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={toggle} />}
      <nav className={`sidebar ${open ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>AssuredOpsSuite</h2>
          <p>Company Operations Portal</p>
          <button className="sidebar-close-btn" onClick={toggle} aria-label="Close menu">&times;</button>
        </div>

        {user && (
          <div style={{
            padding: '12px 16px',
            margin: '0 12px 12px',
            background: 'var(--color-surface-alt, rgba(0,0,0,0.05))',
            borderRadius: 'var(--radius)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
              {user.full_name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
              {user.email}
            </div>
            <span style={{
              display: 'inline-block',
              marginTop: 6,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: 'var(--color-primary)',
              color: '#fff',
              borderRadius: 'var(--radius)',
            }}>
              Admin
            </span>
          </div>
        )}

        <div className="sidebar-nav" style={{ flex: 1 }}>
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

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 600,
              background: 'transparent',
              color: 'var(--color-danger, #dc2626)',
              border: '1px solid var(--color-danger, #dc2626)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.target.style.background = 'var(--color-danger, #dc2626)'; e.target.style.color = '#fff'; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--color-danger, #dc2626)'; }}
          >
            Sign Out
          </button>
        </div>
      </nav>
    </>
  );
}
