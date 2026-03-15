import React, { useState } from 'react';

export default function ProgramRulesTab({ program }) {
  const [expandedMeasure, setExpandedMeasure] = useState(null);
  const [rulesFilter, setRulesFilter] = useState('all');
  const [rulesSubTab, setRulesSubTab] = useState('measures');

  const measures = program.measures || [];
  const categories = [...new Set(measures.map(m => m.category))];
  const filteredMeasures = rulesFilter === 'all' ? measures : measures.filter(m => m.category === rulesFilter);

  return (
    <div>
      {measures.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 15, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['measures', 'eligibility', 'deferrals', 'h&s'].map(st => (
                <button key={st} className={`btn btn-sm ${rulesSubTab === st ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setRulesSubTab(st)}>{st.charAt(0).toUpperCase() + st.slice(1)}</button>
              ))}
            </div>
          </div>

          {/* MEASURES SUB-TAB */}
          {rulesSubTab === 'measures' && (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 15, flexWrap: 'wrap' }}>
                <button className={`btn btn-sm ${rulesFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setRulesFilter('all')}>All ({measures.length})</button>
                {categories.map(cat => (
                  <button key={cat} className={`btn btn-sm ${rulesFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setRulesFilter(cat)}>{cat} ({measures.filter(m => m.category === cat).length})</button>
                ))}
              </div>

              {filteredMeasures.map(m => (
                <div key={m.id} className="card" style={{ marginBottom: 10, padding: 0, overflow: 'hidden' }}>
                  <div
                    style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedMeasure === m.id ? '#f0f2f5' : 'white' }}
                    onClick={() => setExpandedMeasure(expandedMeasure === m.id ? null : m.id)}
                  >
                    <div>
                      <strong>{m.name}</strong>
                      <span className="badge active" style={{ marginLeft: 8, fontSize: 10 }}>{m.category}</span>
                      {m.is_emergency_only ? <span className="badge terminated" style={{ marginLeft: 6, fontSize: 10 }}>Emergency Only</span> : null}
                    </div>
                    <span style={{ color: '#888', fontSize: 18 }}>{expandedMeasure === m.id ? '\u25B2' : '\u25BC'}</span>
                  </div>

                  {expandedMeasure === m.id && (
                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid #eee' }}>
                      <p style={{ color: '#666', fontSize: 13, marginTop: 12 }}>{m.description}</p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                        <div style={{ padding: 12, background: '#e8f4fd', borderRadius: 6 }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: '#0f3460', marginBottom: 6 }}>Baseline Requirements</div>
                          <div style={{ fontSize: 13 }}>{m.baseline_requirements}</div>
                        </div>
                        <div style={{ padding: 12, background: '#e8fde8', borderRadius: 6 }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: '#27ae60', marginBottom: 6 }}>Efficiency Requirements</div>
                          <div style={{ fontSize: 13 }}>{m.efficiency_requirements}</div>
                        </div>
                      </div>

                      <div style={{ padding: 12, background: '#fff8e8', borderRadius: 6, marginTop: 12 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: '#f39c12', marginBottom: 6 }}>Installation Standards</div>
                        <div style={{ fontSize: 13 }}>{m.installation_standards}</div>
                      </div>

                      {m.photo_requirements?.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: '#e94560', marginBottom: 8 }}>Required Photos ({m.photo_requirements.length})</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 6 }}>
                            {m.photo_requirements.map((pr, i) => (
                              <div key={i} style={{ padding: '6px 10px', background: '#fef0f0', borderRadius: 4, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: '#e94560' }}>&#128247;</span> {pr.photo_description}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {m.paperwork_requirements?.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: '#0f3460', marginBottom: 8 }}>Required Paperwork ({m.paperwork_requirements.length})</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 6 }}>
                            {m.paperwork_requirements.map((pr, i) => (
                              <div key={i} style={{ padding: '6px 10px', background: '#f0f0fe', borderRadius: 4, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: '#0f3460' }}>&#128196;</span> {pr.document_name}
                              </div>
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

          {/* ELIGIBILITY SUB-TAB */}
          {rulesSubTab === 'eligibility' && (
            <div>
              {['property', 'customer', 'prioritization', 'compliance'].map(type => {
                const rules = (program.eligibilityRules || []).filter(r => r.rule_type === type);
                if (rules.length === 0) return null;
                const isCompliance = type === 'compliance';
                return (
                  <div key={type} style={{ marginBottom: 20 }}>
                    <h3 style={{ textTransform: 'capitalize', marginBottom: 10, color: isCompliance ? '#c0392b' : undefined }}>
                      {isCompliance ? 'Protected Utility Documents' : `${type} Eligibility`}
                    </h3>
                    {isCompliance && (
                      <div style={{ padding: '12px 16px', background: '#f8d7da', border: '1px solid #c0392b', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
                        <strong>DO NOT ALTER.</strong> Any form with ComEd, Nicor Gas, Peoples Gas, or North Shore Gas logos is utility-owned. Cannot be edited, reprinted, or modified in any way. Must be signed by customer. Customer must receive a copy.
                      </div>
                    )}
                    {rules.map(r => (
                      <div key={r.id} className="card" style={{ marginBottom: 8, padding: '12px 16px', borderLeft: isCompliance ? '4px solid #c0392b' : undefined }}>
                        <strong>{r.title}</strong>
                        <p style={{ margin: '6px 0 0', color: '#666', fontSize: 13 }}>{r.description}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* DEFERRALS SUB-TAB */}
          {rulesSubTab === 'deferrals' && (
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Deferral / Walk Away Conditions</h3>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 15 }}>
                If any of these conditions are encountered, they must be resolved before work can proceed. Use the Hazardous Conditions Form (Appendix I) to document and present to the customer.
              </p>
              {(program.deferralRules || []).map((d, i) => (
                <div key={d.id} style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ background: '#f8d7da', color: '#c0392b', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13 }}>{d.condition_text}</span>
                </div>
              ))}
            </div>
          )}

          {/* H&S SUB-TAB */}
          {rulesSubTab === 'h&s' && (
            <div>
              <div className="card" style={{ marginBottom: 15, padding: '16px', background: '#fff3cd', border: '1px solid #f39c12' }}>
                <strong>H&S Budget Cap: $1,000 per home</strong>
                <p style={{ margin: '6px 0 0', fontSize: 13 }}>
                  For jointly funded projects (gas/electric): exhaust fans and mechanical replacements are NOT included in the cap.
                  Mechanical repairs ARE included. Tune-ups are NOT included.
                  For gas-only projects: exhaust fans ARE included in the cap.
                </p>
                <p style={{ margin: '8px 0 0', fontSize: 13 }}>
                  <strong>Exception Policy:</strong> Up to 25 exceptions per program year for H&S costs up to $2,000 where project savings exceed 2,100 kWh or 750 therms.
                </p>
              </div>

              <div className="card" style={{ marginBottom: 15 }}>
                <h3 style={{ marginBottom: 10 }}>Gas Leak & CO Emergency Thresholds</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ padding: 12, background: '#f8d7da', borderRadius: 6 }}>
                    <strong style={{ color: '#c0392b' }}>Methane / Gas Leak</strong>
                    <p style={{ fontSize: 13, margin: '6px 0 0' }}>Ambient methane reading on CGD of 10% LEL / 5,000ppm or higher, or increasing over time. Evacuate, call gas utility, notify RI.</p>
                  </div>
                  <div style={{ padding: 12, background: '#f8d7da', borderRadius: 6 }}>
                    <strong style={{ color: '#c0392b' }}>Carbon Monoxide</strong>
                    <p style={{ fontSize: 13, margin: '6px 0 0' }}>Ambient CO above 70ppm: evacuate home, call gas utility, notify RI. Above 35ppm: immediate action required.</p>
                  </div>
                </div>
                <div style={{ marginTop: 12, padding: 12, background: '#f0f0f0', borderRadius: 6 }}>
                  <strong>Emergency Lines:</strong>
                  <div style={{ fontSize: 13, marginTop: 6 }}>
                    Nicor Gas: 888.642.6748 | North Shore Gas: 866.556.6005 | Peoples Gas: 866.556.6002
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: 15 }}>
                <h3 style={{ marginBottom: 10 }}>Mechanical Replacement Decision Trees</h3>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>Emergency replacement is the only condition under which mechanical systems can be replaced. If equipment is NOT failed and can be repaired within the threshold, it is NOT eligible for replacement.</p>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>Equipment</th><th>Failed?</th><th>H&S Risk?</th><th>Repair Threshold</th><th>Result</th></tr>
                    </thead>
                    <tbody>
                      <tr><td><strong>Gas Furnace</strong></td><td>YES</td><td>-</td><td>-</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                      <tr style={{ background: '#f8f9fa' }}><td></td><td>NO</td><td>YES</td><td>&lt; $950</td><td><span className="badge terminated">Not Eligible (Repair)</span></td></tr>
                      <tr><td></td><td>NO</td><td>YES</td><td>&ge; $950</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                      <tr style={{ background: '#e8f4fd' }}><td><strong>Electric Resistance Heat</strong></td><td>Any</td><td>Any</td><td>N/A</td><td><span className="badge active">Eligible for Heat Pump</span></td></tr>
                      <tr><td><strong>Boiler</strong></td><td>YES</td><td>-</td><td>-</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                      <tr style={{ background: '#f8f9fa' }}><td></td><td>NO</td><td>YES</td><td>&lt; $700</td><td><span className="badge terminated">Not Eligible (Repair)</span></td></tr>
                      <tr><td></td><td>NO</td><td>YES</td><td>&ge; $700</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                      <tr><td><strong>Water Heater (Gas)</strong></td><td>YES</td><td>-</td><td>-</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                      <tr style={{ background: '#f8f9fa' }}><td></td><td>NO</td><td>YES</td><td>&lt; $650</td><td><span className="badge terminated">Not Eligible (Repair)</span></td></tr>
                      <tr><td></td><td>NO</td><td>YES</td><td>&ge; $650</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                      <tr style={{ background: '#e8f4fd' }}><td><strong>Electric Water Heater</strong></td><td>Any</td><td>Any</td><td>N/A</td><td><span className="badge active">Eligible for Heat Pump WH</span></td></tr>
                      <tr><td><strong>Central AC</strong></td><td>YES</td><td>-</td><td>-</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                      <tr style={{ background: '#f8f9fa' }}><td></td><td>NO</td><td>YES</td><td>&lt; $190/ton</td><td><span className="badge terminated">Not Eligible (Repair)</span></td></tr>
                      <tr><td></td><td>NO</td><td>YES</td><td>&ge; $190/ton</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                      <tr><td><strong>Room AC</strong></td><td>YES</td><td>-</td><td>-</td><td><span className="badge active">Eligible for Replacement</span></td></tr>
                      <tr style={{ background: '#f8f9fa' }}><td></td><td>NO</td><td>-</td><td>-</td><td><span className="badge terminated">Not Eligible</span></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <h3 style={{ marginBottom: 10 }}>Health & Safety Measures</h3>
              {measures.filter(m => m.category === 'Health & Safety').map(m => (
                <div key={m.id} className="card" style={{ marginBottom: 8, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{m.name}</strong>
                    {m.h_and_s_cap_exempt ? <span className="badge active" style={{ fontSize: 10 }}>Cap Exempt (Joint)</span> : null}
                  </div>
                  <p style={{ margin: '6px 0 0', color: '#666', fontSize: 13 }}>{m.description}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
