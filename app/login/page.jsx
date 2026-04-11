'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import styles from '../auth.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(phone, password);
      router.push(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <form className={styles.authCard} onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.25rem' }}>🌾</div>
        </div>
        <h1 style={{ textAlign: 'center' }}>Welcome Back</h1>
        <p className={styles.subtitle} style={{ textAlign: 'center' }}>Log in to your AgroLink account</p>

        {error && <div className={styles.error}>{error}</div>}

        <div style={{
          background: 'linear-gradient(135deg, var(--mist) 0%, rgba(234, 242, 234, 0.5) 100%)',
          borderRadius: '10px',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          fontSize: '0.85rem',
          color: 'var(--bark)',
          border: '1px solid rgba(74, 124, 63, 0.12)',
        }}>
          <strong style={{ color: 'var(--soil)' }}>🔑 Demo accounts:</strong><br />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '140px', background: 'rgba(74, 124, 63, 0.06)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--leaf)' }}>🧑‍🌾 FARMER</span><br />
              <code style={{ fontSize: '0.8rem' }}>9876543210 / farmer123</code>
            </div>
            <div style={{ flex: 1, minWidth: '140px', background: 'rgba(123, 175, 212, 0.06)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--sky)' }}>🏪 BUYER</span><br />
              <code style={{ fontSize: '0.8rem' }}>9988776655 / buyer123</code>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input required type="tel" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone number" />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
        </div>

        <p className={styles.forgotText}>
          <Link href="/forgot-password">Forgot password?</Link>
        </p>

        <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={submitting}>
          {submitting ? '🔄 Logging in...' : 'Log In'}
        </button>

        <p className={styles.switchLink}>
          New here? Register as <Link href="/farmer/register">Farmer</Link> or <Link href="/buyer/register">Buyer</Link>
        </p>
      </form>
    </div>
  );
}
