import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../api';

const POLL_INTERVAL = 15000; // 15 seconds

export function useJob(jobId) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

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

  // Silent poll — doesn't set loading state so UI doesn't flash
  const poll = useCallback(async () => {
    if (!jobId) return;
    try {
      const data = await api.getJob(jobId);
      setJob(data);
    } catch { /* ignore poll errors */ }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  // Poll every 10s for cross-device sync
  useEffect(() => {
    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [poll]);

  const update = useCallback(async (fields) => {
    // If fields is empty or just a reload signal, do a silent reload
    const keys = Object.keys(fields || {});
    if (keys.length === 0 || (keys.length === 1 && keys[0] === '_reload')) {
      await poll();
      return;
    }
    await api.updateJob(jobId, fields);
    // Merge the saved fields into local state so UI updates immediately
    setJob(prev => prev ? { ...prev, ...fields } : prev);
  }, [jobId]);

  const updateNestedData = useCallback(async (key, data) => {
    return update({ [key]: data });
  }, [update]);

  return { job, loading, error, reload: load, update, updateNestedData };
}
