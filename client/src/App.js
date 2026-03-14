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
  const [currentRole, setCurrentRole] = useState('Admin');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="app">
        <Sidebar
          currentRole={currentRole}
          setCurrentRole={setCurrentRole}
          roles={ROLES}
          open={sidebarOpen}
          toggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className={`main-content ${sidebarOpen ? '' : 'expanded'}`}>
          <header className="top-bar">
            <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
            <h1 className="page-title">AssuredOpsSuite</h1>
            <div className="role-badge">{currentRole}</div>
          </header>
          <div className="page-container">
            <Routes>
              <Route path="/" element={<Dashboard role={currentRole} />} />
              {(currentRole === 'Admin' || currentRole === 'HR') && (
                <Route path="/hr" element={<HRPage role={currentRole} />} />
              )}
              {(currentRole === 'Admin' || currentRole === 'IT') && (
                <Route path="/it" element={<ITPage role={currentRole} />} />
              )}
              {(currentRole === 'Admin' || currentRole === 'Warehouse') && (
                <Route path="/warehouse" element={<WarehousePage role={currentRole} />} />
              )}
              <Route path="/kpi" element={<KPIPage role={currentRole} />} />
              {(currentRole === 'Admin' || currentRole === 'Finance') && (
                <Route path="/finance" element={<FinancePage role={currentRole} />} />
              )}
              {(currentRole === 'Admin' || currentRole === 'Finance' || currentRole === 'HR') && (
                <Route path="/billing" element={<BillingPage role={currentRole} />} />
              )}
              <Route path="/hes-ie" element={<HESIEPage role={currentRole} />} />
              <Route path="/job/:jobId" element={<JobDetail role={currentRole} />} />
              <Route path="/programs" element={<Navigate to="/hes-ie" />} />
              <Route path="/program/:id" element={<Navigate to="/hes-ie" />} />
              <Route path="/employee/:id" element={<EmployeeDetail role={currentRole} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
