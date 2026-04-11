'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import styles from '../../auth.module.css';

const TYPES = ['Retailer', 'Wholesaler', 'Restaurant', 'Exporter'];
const STATES = ['Maharashtra', 'Karnataka', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan', 'Gujarat', 'Punjab', 'Haryana', 'Tamil Nadu', 'Andhra Pradesh'];

export default function BuyerRegister() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    businessName: '', ownerName: '', phone: '', email: '',
    businessType: '', gstin: '', city: '', state: '', password: '',
    address: '', pincode: '',
  });

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const passwordStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: 'Weak', color: '#e74c3c' };
    if (score <= 3) return { level: 2, label: 'Medium', color: '#f39c12' };
    return { level: 3, label: 'Strong', color: '#27ae60' };
  };

  const pwStrength = passwordStrength(form.password);

  const canProceedStep1 = form.businessName && form.ownerName && form.phone && form.email;
  const canProceedStep2 = form.businessType && form.city && form.state;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register('buyer', form);
      router.push('/buyer/dashboard');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <form className={styles.authCard} onSubmit={handleSubmit}>
        {/* Progress Indicator */}
        <div className={styles.progressBar}>
          {[1, 2, 3].map((s) => (
            <div key={s} className={styles.progressStep}>
              <div className={`${styles.progressDot} ${step >= s ? styles.progressDotActive : ''} ${step > s ? styles.progressDotDone : ''}`}>
                {step > s ? '✓' : s}
              </div>
              <span className={styles.progressLabel}>
                {s === 1 ? 'Business Info' : s === 2 ? 'Location' : 'Security'}
              </span>
              {s < 3 && <div className={`${styles.progressLine} ${step > s ? styles.progressLineActive : ''}`} />}
            </div>
          ))}
        </div>

        <h1>🏪 Register as Buyer</h1>
        <p className={styles.subtitle}>Source fresh produce directly from verified farmers</p>

        {error && <div className={styles.error}>{error}</div>}

        {/* Step 1: Business Info */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <div className="form-group">
              <label>Business Name <span className={styles.required}>*</span></label>
              <input required value={form.businessName} onChange={(e) => update('businessName', e.target.value)} placeholder="Fresh Basket Retail" />
            </div>

            <div className={styles.row}>
              <div className="form-group">
                <label>Owner Name <span className={styles.required}>*</span></label>
                <input required value={form.ownerName} onChange={(e) => update('ownerName', e.target.value)} placeholder="Ankit Sharma" />
              </div>
              <div className="form-group">
                <label>Phone Number <span className={styles.required}>*</span></label>
                <input required type="tel" maxLength={10} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="9988776655" />
              </div>
            </div>

            <div className="form-group">
              <label>Email <span className={styles.required}>*</span></label>
              <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@business.com" />
            </div>

            <div className={styles.row}>
              <div className="form-group">
                <label>Business Type <span className={styles.required}>*</span></label>
                <select required value={form.businessType} onChange={(e) => update('businessType', e.target.value)}>
                  <option value="">Select type</option>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>GSTIN</label>
                <input value={form.gstin} onChange={(e) => update('gstin', e.target.value)} placeholder="27AABCF1234E1Z5" maxLength={15} />
              </div>
            </div>

            <button
              type="button"
              className={`btn-primary ${styles.submitBtn}`}
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              style={{ opacity: canProceedStep1 ? 1 : 0.5 }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Location & Address */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <div className={styles.row}>
              <div className="form-group">
                <label>City <span className={styles.required}>*</span></label>
                <input required value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Mumbai" />
              </div>
              <div className="form-group">
                <label>State <span className={styles.required}>*</span></label>
                <select required value={form.state} onChange={(e) => update('state', e.target.value)}>
                  <option value="">Select state</option>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Full Delivery Address <span className={styles.infoTag}>For produce delivery</span></label>
              <textarea 
                value={form.address} 
                onChange={(e) => update('address', e.target.value)} 
                placeholder="Shop no., Building, Street, Area, Landmark..."
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label>Pincode</label>
              <input type="text" maxLength={6} value={form.pincode} onChange={(e) => update('pincode', e.target.value.replace(/\D/g, ''))} placeholder="400001" />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className={`btn-secondary ${styles.submitBtn}`} onClick={() => setStep(1)} style={{ flex: 1 }}>
                ← Back
              </button>
              <button
                type="button"
                className={`btn-primary ${styles.submitBtn}`}
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                style={{ flex: 1, opacity: canProceedStep2 ? 1 : 0.5 }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Security & Review */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <div className="form-group">
              <label>Password <span className={styles.required}>*</span></label>
              <input required type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Create a password" minLength={6} />
              {form.password && (
                <div className={styles.strengthBar}>
                  <div className={styles.strengthTrack}>
                    <div
                      className={styles.strengthFill}
                      style={{ width: `${(pwStrength.level / 3) * 100}%`, background: pwStrength.color }}
                    />
                  </div>
                  <span style={{ color: pwStrength.color, fontSize: '0.75rem', fontWeight: 600 }}>{pwStrength.label}</span>
                </div>
              )}
            </div>

            <div className={styles.summaryBox}>
              <h4>📋 Registration Summary</h4>
              <p><strong>Business:</strong> {form.businessName} ({form.businessType})</p>
              <p><strong>Owner:</strong> {form.ownerName}</p>
              <p><strong>Location:</strong> {form.city}, {form.state} {form.pincode && `- ${form.pincode}`}</p>
              <p><strong>Phone:</strong> {form.phone} | <strong>Email:</strong> {form.email}</p>
              {form.address && <p><strong>Address:</strong> {form.address}</p>}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className={`btn-secondary ${styles.submitBtn}`} onClick={() => setStep(2)} style={{ flex: 1 }}>
                ← Back
              </button>
              <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={submitting} style={{ flex: 1 }}>
                {submitting ? '🔄 Creating...' : '🏪 Create Business Account'}
              </button>
            </div>
          </div>
        )}

        <p className={styles.switchLink}>
          Already registered? <Link href="/login">Log in here</Link>
        </p>
      </form>
    </div>
  );
}
