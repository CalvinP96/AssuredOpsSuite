import React, { useState, useEffect } from 'react';
import * as api from '../api';
import ProgramDetail from './ProgramDetail';

export default function HESIEPage({ role }) {
  const [programId, setProgramId] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.getHesIeProgram()
      .then(p => {
        if (p && p.id) setProgramId(p.id);
        else setError(true);
      })
      .catch(() => setError(true));
  }, []);

  if (error) return <div className="card"><p>HES IE program not found. Please restart the server.</p></div>;
  if (!programId) return <div className="card"><p>Loading HES IE program...</p></div>;

  return <ProgramDetail role={role} fixedProgramId={programId} />;
}
