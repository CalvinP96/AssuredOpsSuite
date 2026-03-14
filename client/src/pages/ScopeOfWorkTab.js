import React from 'react';
import * as api from '../api';

export default function ScopeOfWorkTab({ job, program, canEdit, onUpdate, role }) {
  const getAssessment = () => {
    try { return JSON.parse(job.assessment_data || '{}'); } catch { return {}; }
  };
  const getScope = () => {
    try { return JSON.parse(job.scope_data || '{}'); } catch { return {}; }
  };

  const ad = getAssessment();
  const sc = getScope();
  const aVal = (section, field) => (ad[section] || {})[field] || '';

  const saveScope = async (data) => {
    try { await api.saveScopeData(job.id, data); } catch (err) { alert('Failed to save scope: ' + err.message); }
  };

  const canScope = ['Admin', 'Operations', 'Program Manager', 'Scope Creator'].includes(role);

  // Assessor recommendations banner
  const recs = ad.recommendations || {};
  const recItems = ['attic_insulation', 'wall_insulation', 'basement_insulation', 'air_sealing', 'duct_sealing', 'rim_joist', 'hvac_tune_clean', 'hvac_replacement', 'thermostat', 'exhaust_fans', 'detectors', 'hs_repairs'].filter(r => recs[r] === 'yes');

  // Build suggestion list from assessor recommendations
  const suggestions = [];
  if (aVal('recommendations', 'attic_insulation') === 'yes') suggestions.push('Attic Insulation');
  if (aVal('recommendations', 'wall_insulation') === 'yes') suggestions.push('Wall Insulation');
  if (aVal('recommendations', 'basement_insulation') === 'yes') suggestions.push('Basement/Crawlspace Wall Insulation');
  if (aVal('recommendations', 'air_sealing') === 'yes') suggestions.push('Air Sealing');
  if (aVal('recommendations', 'duct_sealing') === 'yes') suggestions.push('Duct Sealing');
  if (aVal('recommendations', 'rim_joist') === 'yes') suggestions.push('Rim Joist Insulation');
  if (aVal('recommendations', 'hvac_tune_clean') === 'yes') { suggestions.push('Gas Furnace Tune-Up'); suggestions.push('Boiler Tune-Up'); }
  if (aVal('recommendations', 'hvac_replacement') === 'yes') { suggestions.push('Furnace Replacement'); suggestions.push('Boiler Replacement'); }
  if (aVal('recommendations', 'thermostat') === 'yes') { suggestions.push('Programmable Thermostat'); suggestions.push('Advanced Thermostat'); }

  const selectedMeasures = sc.selected_measures || [];
  const toggleMeasure = (name) => {
    if (!canScope) return;
    const updated = selectedMeasures.includes(name) ? selectedMeasures.filter(m => m !== name) : [...selectedMeasures, name];
    saveScope({ ...sc, selected_measures: updated });
  };

  const measures = program?.measures || [];
  const categories = [...new Set(measures.map(m => m.category))];

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Assessor Recommendations Banner */}
      {(recItems.length > 0 || recs.details) && (
        <div style={{ padding: '10px 16px', background: '#fff3e0', borderBottom: '1px solid #ffe0b2' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#e65100', marginBottom: 4 }}>Assessor Recommended:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {recItems.map(r => (
              <span key={r} style={{ fontSize: 10, padding: '2px 6px', background: '#e8f5e9', borderRadius: 3, border: '1px solid #c8e6c9' }}>{r.replace(/_/g, ' ')}</span>
            ))}
          </div>
          {recs.details && <p style={{ fontSize: 10, color: '#666', margin: '4px 0 0' }}>{recs.details}</p>}
        </div>
      )}

      <div style={{ padding: '12px 16px', background: '#0f3460', color: '#fff' }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>Scope of Work {role === 'Scope Creator' ? '(You Have Final Say)' : ''}</h3>
        <p style={{ margin: '4px 0 0', fontSize: 11, opacity: 0.85 }}>Select measures and build the scope based on the 2026 HES IE form and assessor recommendations.</p>
      </div>

      {program && (
        <div style={{ padding: 16 }}>
          {suggestions.length > 0 && (
            <div style={{ background: '#fff3e0', padding: 10, borderRadius: 6, marginBottom: 12 }}>
              <strong style={{ fontSize: 12 }}>Auto-Suggested from Assessor Recommendations:</strong>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {suggestions.map(s => (
                  <button key={s} className={`btn btn-sm ${selectedMeasures.includes(s) ? 'btn-success' : 'btn-warning'}`}
                    style={{ fontSize: 11, padding: '3px 8px' }} disabled={!canScope} onClick={() => toggleMeasure(s)}>
                    {selectedMeasures.includes(s) ? '+ ' : ''}{s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {categories.map(cat => (
            <div key={cat} style={{ marginBottom: 12 }}>
              <h4 style={{ fontSize: 13, color: '#333', marginBottom: 6, borderBottom: '1px solid #eee', paddingBottom: 4 }}>{cat}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 4 }}>
                {measures.filter(m => m.category === cat).map(m => {
                  const isRec = suggestions.includes(m.name);
                  return (
                    <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '3px 6px', background: selectedMeasures.includes(m.name) ? '#e8f5e9' : isRec ? '#fff8e1' : '#f9f9f9', borderRadius: 4, cursor: canScope ? 'pointer' : 'default', border: isRec && !selectedMeasures.includes(m.name) ? '1px dashed #ff9800' : '1px solid transparent' }}>
                      <input type="checkbox" checked={selectedMeasures.includes(m.name)} disabled={!canScope} onChange={() => toggleMeasure(m.name)} />
                      {m.name} {isRec && !selectedMeasures.includes(m.name) && <span style={{ fontSize: 9, color: '#ff9800' }}>(recommended)</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {canScope && selectedMeasures.length > 0 && (
            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 6, border: '1px solid #ddd' }}>
              <h4 style={{ fontSize: 13, color: '#333', marginBottom: 8 }}>Weatherization Pricing Worksheet</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '4px 8px', fontSize: 11, alignItems: 'center' }}>
                <div style={{ fontWeight: 700, borderBottom: '1px solid #ccc', paddingBottom: 2 }}>Measure</div>
                <div style={{ fontWeight: 700, borderBottom: '1px solid #ccc', paddingBottom: 2 }}>Qty/SqFt</div>
                <div style={{ fontWeight: 700, borderBottom: '1px solid #ccc', paddingBottom: 2 }}>Unit</div>
                <div style={{ fontWeight: 700, borderBottom: '1px solid #ccc', paddingBottom: 2 }}>Cost</div>
                {selectedMeasures.map(m => (
                  <React.Fragment key={m}>
                    <div>{m}</div>
                    <input style={{ fontSize: 11, padding: '2px 4px', border: '1px solid #ccc', borderRadius: 3 }}
                      defaultValue={(sc.pricing || {})[m]?.qty || ''} placeholder="0"
                      onBlur={e => saveScope({ ...sc, pricing: { ...(sc.pricing || {}), [m]: { ...((sc.pricing || {})[m] || {}), qty: e.target.value } } })} />
                    <div style={{ color: '#666' }}>{m.includes('Insulation') || m.includes('Sealing') ? 'SF/LF' : 'Ea'}</div>
                    <input style={{ fontSize: 11, padding: '2px 4px', border: '1px solid #ccc', borderRadius: 3 }}
                      defaultValue={(sc.pricing || {})[m]?.cost || ''} placeholder="$0"
                      onBlur={e => saveScope({ ...sc, pricing: { ...(sc.pricing || {}), [m]: { ...((sc.pricing || {})[m] || {}), cost: e.target.value } } })} />
                  </React.Fragment>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, textAlign: 'right' }}>
                Total: ${Object.values(sc.pricing || {}).reduce((sum, p) => sum + (parseFloat(p.cost) || 0), 0).toLocaleString()}
              </div>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <strong style={{ fontSize: 12 }}>Scope Notes:</strong>
            <textarea style={{ width: '100%', fontSize: 11, padding: 4, minHeight: 60, marginTop: 4, border: '1px solid #ccc', borderRadius: 3 }}
              defaultValue={sc.notes} disabled={!canScope}
              onBlur={e => saveScope({ ...sc, notes: e.target.value })} />
          </div>
          {selectedMeasures.length > 0 && (
            <div style={{ marginTop: 12, padding: 10, background: '#e8f5e9', borderRadius: 6 }}>
              <strong style={{ fontSize: 12 }}>Selected Measures ({selectedMeasures.length}):</strong>
              <div style={{ marginTop: 4, fontSize: 12 }}>{selectedMeasures.join(' | ')}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
