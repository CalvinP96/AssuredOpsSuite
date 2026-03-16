import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

export function useJob(jobId) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      const data = await api.getJob(jobId);
      setJob(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (fields) => {
    try {
      const updated = await api.updateJob(jobId, fields);
      setJob(prev => ({ ...prev, ...updated }));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [jobId]);

  const updateNestedData = useCallback(async (key, data) => {
    return update({ [key]: data });
  }, [update]);

  return { job, loading, error, reload: load, update, updateNestedData };
}
