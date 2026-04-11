'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import styles from '../auth.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(phone, password);
      toast.success(`Welcome back, ${user.name || user.ownerName || 'there'}! 🌾`);
      router.push(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authSplit}>
        {/* Left illustration panel */}
        <div className={styles.authIllustration}>
          <div className={styles.illBg} />
          <div className={styles.illContent}>
            <div className={styles.illLogo}>🌾 AgroLink</div>
            <h2 className={styles.illTitle}>India's trusted farm-to-buyer network</h2>
            <p className={styles.illText}>Connect directly with buyers, get fair prices, and track every step of your produce's journey.</p>
            <div className={styles.illStats}>
              <div className={styles.illStat}><strong>10,000+</strong><span>Farmers</span></div>
              <div className={styles.illStat}><strong>5,000+</strong><span>Buyers</span></div>
              <div className={styles.illStat}><strong>28</strong><span>States</span></div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className={styles.authFormPanel}>
          <form className={styles.authCard} onSubmit={handleSubmit} noValidate>
            <div className={styles.authHeader}>
              <div className={styles.authIcon}>🔐</div>
              <h1 className={styles.authTitle}>Welcome back</h1>
              <p className={styles.authSubtitle}>Sign in to your AgroLink account</p>
            </div>

            {error && (
              <div className="alert-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                required
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number"
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className={styles.passwordWrap}>
                <input
                  id="password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <p className={styles.forgotText}>
              <Link href="/forgot-password">Forgot password?</Link>
            </p>

            <button
              type="submit"
              className={`btn-primary ${styles.submitBtn}`}
              disabled={submitting}
              id="login-submit-btn"
            >
              {submitting ? (
                <><span className={styles.spinner} /> Signing in...</>
              ) : (
                'Sign In →'
              )}
            </button>

            <p className={styles.switchLink}>
              New to AgroLink? Register as{' '}
              <Link href="/farmer/register">Farmer</Link>
              {' '}or{' '}
              <Link href="/buyer/register">Buyer</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
