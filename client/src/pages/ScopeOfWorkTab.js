import React, { useState } from 'react';
import * as api from '../api';
import ScopeMeasureBuilder from './ScopeMeasureBuilder';
import ScopeInsulationSpec from './ScopeInsulationSpec';
import ScopeMechanicalSpec from './ScopeMechanicalSpec';
import ScopeASHRAECalc from './ScopeASHRAECalc';

const REC_MAP = {
  attic_insulation: ['Attic Insulation (0-R11)', 'Attic Insulation (R12-19)'],
  wall_insulation: ['Injection Foam Walls'],
  basement_insulation: ['Basement Wall Insulation', 'Crawl Space Wall Insulation'],
  air_sealing: ['Air Sealing'],
  duct_sealing: ['Air Sealing'],
  rim_joist: ['Rim Joist Insulation'],
  hvac_tune_clean: ['Furnace Tune-Up'],
  hvac_replacement: ['Furnace Replacement', 'Boiler Replacement'],
  thermostat: ['Thermostat'],
  exhaust_fans: ['Exhaust Fan', 'Exhaust Fan w/ Light'],
  detectors: ['CO Detector (Hardwired)', 'Smoke Detector (Hardwired)', 'CO/Smoke Combo'],
};

const getUnit = (name) => {
  if (name.includes('Insulation') && !name.includes('Rim')) return 'sqft';
  if (name.includes('Rim Joist')) return 'lnft';
  if (name.includes('Foam Walls')) return 'sqft';
  return 'ea';
};

const SUB_TABS = [
  { key: 'measures', label: 'Measures' },
  { key: 'insulation', label: 'Insulation' },
  { key: 'mechanical', label: 'Mechanical' },
  { key: 'ashrae', label: 'ASHRAE' },
  { key: 'summary', label: 'Summary' },
];

export default function ScopeOfWorkTab({ job, program, canEdit, onUpdate, user }) {
  const [subTab, setSubTab] = useState('measures');

  const parseJSON = (raw) => {
    try { return typeof raw === 'string' ? JSON.parse(raw) : (raw || {}); } catch { return {}; }
  };

  const scopeData = parseJSON(job.scope_data);
  const assessmentData = parseJSON(job.assessment_data);

  // Build assessment recommendation names for ScopeMeasureBuilder
  let rawRecs = assessmentData.weatherization_recommendations || assessmentData.recommendations || {};
  if (Array.isArray(rawRecs)) {
    const obj = {};
    rawRecs.forEach(r => { obj[r] = 'yes'; });
    rawRecs = obj;
  }
  const assessmentRecs = [];
  Object.entries(REC_MAP).forEach(([key, names]) => {
    if (rawRecs[key] === 'yes' || rawRecs[key] === true) {
      names.forEach(n => { if (!assessmentRecs.includes(n)) assessmentRecs.push(n); });
    }
  });

  // Persist scope data via updateJob
  const saveScope = async (updated) => {
    try {
      await api.updateJob(job.id, { scope_data: JSON.stringify(updated) });
      if (onUpdate) onUpdate('_reload');
    } catch (err) {
      alert('Failed to save scope: ' + err.message);
    }
  };

  const handleMeasuresChange = (measures) => {
    saveScope({ ...scopeData, measures });
  };

  const handleNestedChange = (section, field, value) => {
    saveScope({ ...scopeData, [section]: { ...(scopeData[section] || {}), [field]: value } });
  };

  // Summary helpers
  const measures = (scopeData.measures || []).filter(m => m.type !== 'meta');
  const pricing = scopeData.pricing || {};
  const totalCost = measures.reduce((sum, m) => sum + (parseFloat(pricing[m.name]?.cost) || 0), 0);

  return (
    <div>
      {/* Sub-tab bar */}
      <div className="jd-tabs" style={{ marginBottom: 16 }}>
        {SUB_TABS.map(t => (
          <button key={t.key} className={`jd-tab${subTab === t.key ? ' active' : ''}`} onClick={() => setSubTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'measures' && (
        <ScopeMeasureBuilder
          measures={scopeData.measures || []}
          onChange={handleMeasuresChange}
          assessmentRecs={assessmentRecs}
          canEdit={canEdit}
        />
      )}

      {subTab === 'insulation' && (
        <ScopeInsulationSpec
          job={job}
          scopeData={scopeData}
          onChange={handleNestedChange}
          canEdit={canEdit}
        />
      )}

      {subTab === 'mechanical' && (
        <ScopeMechanicalSpec
          job={job}
          scopeData={scopeData}
          onChange={handleNestedChange}
          canEdit={canEdit}
        />
      )}

      {subTab === 'ashrae' && (
        <ScopeASHRAECalc
          job={job}
          scopeData={scopeData}
          onChange={handleNestedChange}
          canEdit={canEdit}
        />
      )}

      {subTab === 'summary' && (
        <div className="jd-card">
          <div className="jd-card-title">Scope Summary ({measures.length} measures)</div>
          {measures.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: 12 }}>
              No measures selected. Go to the Measures tab to add measures.
            </p>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 1fr', gap: '4px 8px', fontSize: 12, padding: '0 12px 12px', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: 4 }}>Measure</div>
                <div style={{ fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: 4 }}>Qty</div>
                <div style={{ fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: 4 }}>Unit</div>
                <div style={{ fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: 4 }}>Cost ($)</div>
                {measures.map(m => (
                  <React.Fragment key={m.name}>
                    <div>{m.name}</div>
                    <div>{m.qty || '\u2014'}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{getUnit(m.name)}</div>
                    <input
                      style={{ fontSize: 12, padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                      defaultValue={pricing[m.name]?.cost || ''}
                      disabled={!canEdit}
                      onBlur={e => {
                        saveScope({
                          ...scopeData,
                          pricing: { ...pricing, [m.name]: { ...(pricing[m.name] || {}), cost: e.target.value } },
                        });
                      }}
                      placeholder="0.00"
                    />
                  </React.Fragment>
                ))}
              </div>
              <div style={{ padding: 12, textAlign: 'right', fontSize: 14, fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                Total Estimate: ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </>
          )}

          {scopeData.notes && (
            <div style={{ padding: '0 12px 12px', fontSize: 12, color: 'var(--color-text-muted)' }}>
              <strong>Notes:</strong> {scopeData.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
