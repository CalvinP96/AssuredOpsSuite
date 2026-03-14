import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import HRPage from './pages/HRPage';
import ITPage from './pages/ITPage';
import WarehousePage from './pages/WarehousePage';
import KPIPage from './pages/KPIPage';
import FinancePage from './pages/FinancePage';
import BillingPage from './pages/BillingPage';
import EmployeeDetail from './pages/EmployeeDetail';
import HESIEPage from './pages/HESIEPage';
import JobDetail from './pages/JobDetail';
import './App.css';

const ROLES = ['Admin', 'HR', 'IT', 'Warehouse', 'Finance', 'Operations', 'Program Manager', 'Assessor', 'Scope Creator', 'Installer', 'HVAC'];

function App() {
  const [currentRoles, setCurrentRoles] = useState(['Admin']);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const hasRole = (...roles) => currentRoles.includes('Admin') || roles.some(r => currentRoles.includes(r));

  // Backward-compatible single role for pages not yet updated to multi-role
  const primaryRole = currentRoles.includes('Admin') ? 'Admin' : currentRoles[0];

  return (
    <Router>
      <div className="app">
        <Sidebar
          currentRoles={currentRoles}
          setCurrentRoles={setCurrentRoles}
          allRoles={ROLES}
          open={sidebarOpen}
          toggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className={`main-content ${sidebarOpen ? '' : 'expanded'}`}>
          <header className="top-bar">
            <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
            <h1 className="page-title">AssuredOpsSuite</h1>
            <div className="role-badge">
              {currentRoles.length <= 2 ? currentRoles.join(' · ') : `${currentRoles.length} Roles`}
            </div>
          </header>
          <div className="page-container">
            <Routes>
              <Route path="/" element={<Dashboard roles={currentRoles} />} />
              {hasRole('HR') && (
                <Route path="/hr" element={<HRPage role={primaryRole} />} />
              )}
              {hasRole('IT') && (
                <Route path="/it" element={<ITPage role={primaryRole} />} />
              )}
              {hasRole('Warehouse') && (
                <Route path="/warehouse" element={<WarehousePage role={primaryRole} />} />
              )}
              <Route path="/kpi" element={<KPIPage role={primaryRole} />} />
              {hasRole('Finance') && (
                <Route path="/finance" element={<FinancePage role={primaryRole} />} />
              )}
              {hasRole('Finance', 'HR') && (
                <Route path="/billing" element={<BillingPage role={primaryRole} />} />
              )}
              <Route path="/hes-ie" element={<HESIEPage role={primaryRole} />} />
              <Route path="/job/:jobId" element={<JobDetail role={primaryRole} />} />
              <Route path="/programs" element={<Navigate to="/hes-ie" />} />
              <Route path="/program/:id" element={<Navigate to="/hes-ie" />} />
              <Route path="/employee/:id" element={<EmployeeDetail role={primaryRole} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
