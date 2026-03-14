import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
    } else if (onLogin) {
      onLogin();
    }
    setLoading(false);
  };

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h1 style={styles.title}>AssuredOpsSuite</h1>
        <p style={styles.subtitle}>Company Operations Portal</p>

        {error && <div style={styles.error}>{error}</div>}

        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading} className="btn btn-primary" style={styles.button}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={styles.note}>Need access? Contact your IT administrator.</p>
      </form>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'var(--color-surface-alt)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-md)',
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--color-primary)',
    textAlign: 'center',
  },
  subtitle: {
    margin: '4px 0 24px',
    fontSize: 14,
    color: 'var(--color-text-muted)',
    textAlign: 'center',
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    width: '100%',
    height: 40,
    padding: '6px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px 24px',
    fontSize: 15,
    fontWeight: 700,
    marginTop: 24,
    cursor: 'pointer',
  },
  error: {
    padding: '10px 14px',
    background: '#fef2f2',
    border: '1px solid var(--color-danger)',
    borderRadius: 'var(--radius)',
    fontSize: 13,
    color: 'var(--color-danger)',
    marginBottom: 8,
  },
  note: {
    marginTop: 20,
    fontSize: 12,
    color: 'var(--color-text-muted)',
    textAlign: 'center',
  },
};
