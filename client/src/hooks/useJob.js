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
      // If fields is empty or just a reload signal, do a full reload
      const keys = Object.keys(fields || {});
      if (keys.length === 0 || (keys.length === 1 && keys[0] === '_reload')) {
        await load();
        return;
      }
      await api.updateJob(jobId, fields);
      // Full reload to get formatted job with relations
      await load();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [jobId, load]);

  const updateNestedData = useCallback(async (key, data) => {
    return update({ [key]: data });
  }, [update]);

  return { job, loading, error, reload: load, update, updateNestedData };
}
