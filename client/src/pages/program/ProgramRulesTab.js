import React, { useState } from 'react';

export default function ProgramRulesTab({ program }) {
  const [rulesSubTab, setRulesSubTab] = useState('measures');
  const [rulesFilter, setRulesFilter] = useState('all');
  const [expandedMeasure, setExpandedMeasure] = useState(null);

  const measures = program.measures || [];
  const categories = [...new Set(measures.map(m => m.category))];
  const filteredMeasures = rulesFilter === 'all' ? measures : measures.filter(m => m.category === rulesFilter);
  const eligibilityRules = program.eligibility_rules || program.eligibilityRules || [];
  const deferralRules = program.deferral_rules || program.deferralRules || [];

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {['measures', 'eligibility', 'deferrals'].map(st => (
          <button key={st} className={`btn btn-sm ${rulesSubTab === st ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setRulesSubTab(st)}>{st.charAt(0).toUpperCase() + st.slice(1)}</button>
        ))}
      </div>

      {/* Measures */}
      {rulesSubTab === 'measures' && (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            <button className={`btn btn-sm ${rulesFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setRulesFilter('all')}>All ({measures.length})</button>
            {categories.map(cat => (
              <button key={cat} className={`btn btn-sm ${rulesFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRulesFilter(cat)}>{cat} ({measures.filter(m => m.category === cat).length})</button>
            ))}
          </div>

          {filteredMeasures.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 30, color: 'var(--color-text-muted)' }}>No measures defined.</div>
          )}

          {filteredMeasures.map(m => (
            <div key={m.id} className="card" style={{ marginBottom: 8, padding: 0, overflow: 'hidden' }}>
              <div
                style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedMeasure === m.id ? 'var(--color-surface-alt)' : 'var(--color-surface)' }}
                onClick={() => setExpandedMeasure(expandedMeasure === m.id ? null : m.id)}
              >
                <div>
                  <strong>{m.name}</strong>
                  <span className="badge active" style={{ marginLeft: 8, fontSize: 10 }}>{m.category}</span>
                  {m.is_emergency_only && <span className="badge terminated" style={{ marginLeft: 6, fontSize: 10 }}>Emergency Only</span>}
                </div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 16 }}>{expandedMeasure === m.id ? '\u25B2' : '\u25BC'}</span>
              </div>

              {expandedMeasure === m.id && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--color-border)' }}>
                  {m.description && <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 12 }}>{m.description}</p>}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                    {m.baseline_requirements && (
                      <div style={{ padding: 12, background: '#eff6ff', borderRadius: 6 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: '#1e40af', marginBottom: 6 }}>Baseline Requirements</div>
                        <div style={{ fontSize: 13 }}>{m.baseline_requirements}</div>
                      </div>
                    )}
                    {m.efficiency_requirements && (
                      <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 6 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: '#166534', marginBottom: 6 }}>Efficiency Requirements</div>
                        <div style={{ fontSize: 13 }}>{m.efficiency_requirements}</div>
                      </div>
                    )}
                  </div>

                  {m.installation_standards && (
                    <div style={{ padding: 12, background: '#fffbeb', borderRadius: 6, marginTop: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#92400e', marginBottom: 6 }}>Installation Standards</div>
                      <div style={{ fontSize: 13 }}>{m.installation_standards}</div>
                    </div>
                  )}

                  {m.photo_requirements?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--color-danger)', marginBottom: 8 }}>Required Photos ({m.photo_requirements.length})</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {m.photo_requirements.map((pr, i) => (
                          <span key={i} style={{ padding: '4px 10px', background: '#fef2f2', borderRadius: 4, fontSize: 12 }}>
                            {pr.photo_description}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.paperwork_requirements?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#1e40af', marginBottom: 8 }}>Required Paperwork ({m.paperwork_requirements.length})</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {m.paperwork_requirements.map((pr, i) => (
                          <span key={i} style={{ padding: '4px 10px', background: '#eff6ff', borderRadius: 4, fontSize: 12 }}>
                            {pr.document_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Eligibility */}
      {rulesSubTab === 'eligibility' && (
        <div>
          {eligibilityRules.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 30, color: 'var(--color-text-muted)' }}>No eligibility rules defined.</div>
          )}
          {['property', 'customer', 'prioritization', 'compliance'].map(type => {
            const rules = eligibilityRules.filter(r => r.rule_type === type);
            if (rules.length === 0) return null;
            return (
              <div key={type} style={{ marginBottom: 20 }}>
                <h4 style={{ textTransform: 'capitalize', marginBottom: 10, fontSize: 14, fontWeight: 650 }}>
                  {type === 'compliance' ? 'Protected Utility Documents' : `${type} Eligibility`}
                </h4>
                {rules.map(r => (
                  <div key={r.id} className="card" style={{ marginBottom: 8, padding: '12px 16px' }}>
                    <strong style={{ fontSize: 13 }}>{r.title}</strong>
                    <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: 13 }}>{r.description}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Deferrals */}
      {rulesSubTab === 'deferrals' && (
        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Deferral / Walk Away Conditions</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 14 }}>
            Conditions that must be resolved before work can proceed.
          </p>
          {deferralRules.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No deferral rules defined.</p>
          )}
          {deferralRules.map((d, i) => (
            <div key={d.id} style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 13 }}>{d.condition_text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
