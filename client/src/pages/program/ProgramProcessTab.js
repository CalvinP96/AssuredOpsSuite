import React from 'react';

export default function ProgramProcessTab({ program }) {
  const processSteps = program.processSteps || [];
  const phases = [...new Set(processSteps.map(s => s.phase))];
  const phaseColors = { Intake: '#0f3460', Assessment: '#e94560', Scope: '#f39c12', Installation: '#27ae60', Closeout: '#8e44ad', 'QA/QC': '#2c3e50' };

  if (processSteps.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 30, color: '#888' }}>
        No process steps loaded. Load HES IE rules from the Overview tab.
      </div>
    );
  }

  return (
    <div>
      {phases.map(phase => {
        const phaseSteps = processSteps.filter(s => s.phase === phase);
        const color = phaseColors[phase] || '#666';
        return (
          <div key={phase} style={{ marginBottom: 20 }}>
            <h3 style={{ color, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: color, color: 'white', borderRadius: '50%', width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                {phase.charAt(0)}
              </span>
              {phase}
            </h3>
            {phaseSteps.map(step => (
              <div key={step.id} className="card" style={{ marginBottom: 8, padding: '14px 16px', borderLeft: `4px solid ${color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong>Step {step.step_number}: {step.title}</strong>
                    <p style={{ margin: '6px 0 0', color: '#666', fontSize: 13 }}>{step.description}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                  {step.required_certification && (
                    <div style={{ padding: '4px 10px', background: '#e8f4fd', borderRadius: 4, fontSize: 12 }}>
                      <strong>Cert:</strong> {step.required_certification}
                    </div>
                  )}
                  {step.required_forms && (
                    <div style={{ padding: '4px 10px', background: '#f0f0fe', borderRadius: 4, fontSize: 12 }}>
                      <strong>Forms:</strong> {step.required_forms}
                    </div>
                  )}
                  {step.timeline && (
                    <div style={{ padding: '4px 10px', background: '#fff3cd', borderRadius: 4, fontSize: 12 }}>
                      <strong>Timeline:</strong> {step.timeline}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
