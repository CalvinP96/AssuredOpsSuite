import React from 'react';

export default function ProgramOverviewTab({ program, jobs }) {
  const measures = program.measures || [];
  const categories = [...new Set(measures.map(m => m.category))];
  const tasks = program.tasks || [];
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const reviewTasks = tasks.filter(t => t.status === 'review');

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card blue"><div className="stat-value">{measures.length}</div><div className="stat-label">Measures</div></div>
        <div className="stat-card orange"><div className="stat-value">{todoTasks.length + inProgressTasks.length + reviewTasks.length}</div><div className="stat-label">Open Tasks</div></div>
        <div className="stat-card green"><div className="stat-value">{jobs.length || 0}</div><div className="stat-label">Jobs</div></div>
        <div className="stat-card"><div className="stat-value">{program.documents?.length || 0}</div><div className="stat-label">Documents</div></div>
      </div>

      {measures.length > 0 && (
        <div className="card">
          <h3>Program Rules Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
            {categories.map(cat => {
              const catMeasures = measures.filter(m => m.category === cat);
              return (
                <div key={cat} style={{ padding: 12, background: '#f8f9fa', borderRadius: 8, border: '1px solid #eee' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{cat}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#0f3460' }}>{catMeasures.length}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>measures</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {inProgressTasks.length > 0 && (
        <div className="card" style={{ marginTop: 15 }}>
          <h3>In Progress Tasks</h3>
          {inProgressTasks.map(t => (
            <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <div><strong>{t.title}</strong> {t.assigned_to && <small style={{ color: '#888' }}>- {t.assigned_to}</small>}</div>
              <span className={`badge ${t.priority === 'critical' ? 'terminated' : t.priority === 'high' ? 'at_risk' : 'active'}`}>{t.priority}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
