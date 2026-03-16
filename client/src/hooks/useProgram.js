import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

export function useProgram(programId) {
  const [program, setProgram] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProgram = useCallback(async () => {
    if (!programId) return;
    try {
      const data = await api.getProgram(programId);
      setProgram(data);
    } catch (err) {
      setError(err.message);
    }
  }, [programId]);

  const loadJobs = useCallback(async () => {
    if (!programId) return;
    try {
      setLoading(true);
      const data = await api.getJobs(programId);
      setJobs(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    loadProgram();
    loadJobs();
  }, [loadProgram, loadJobs]);

  return { program, jobs, loading, error, reloadJobs: loadJobs, reloadProgram: loadProgram };
}
