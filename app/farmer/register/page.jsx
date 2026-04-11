'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import styles from '../../auth.module.css';

const CROPS = ['Wheat', 'Rice', 'Tomato', 'Onion', 'Sugarcane', 'Soybean', 'Other'];
const STATES = ['Maharashtra', 'Karnataka', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan', 'Gujarat', 'Punjab', 'Haryana', 'Tamil Nadu', 'Andhra Pradesh'];

export default function FarmerRegister() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', village: '', district: '', state: '',
    phone: '', crops: [], landSize: '', aadhaar: '', password: '',
    address: '', pincode: '',
  });

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const toggleCrop = (crop) => {
    setForm((p) => ({
      ...p,
      crops: p.crops.includes(crop) ? p.crops.filter((c) => c !== crop) : [...p.crops, crop],
    }));
  };

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

  const canProceedStep1 = form.name && form.village && form.district && form.state && form.phone;
  const canProceedStep2 = form.crops.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register('farmer', { ...form, landSize: Number(form.landSize) || 0 });
      router.push('/farmer/dashboard');
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
                {s === 1 ? 'Personal' : s === 2 ? 'Farm Details' : 'Security'}
              </span>
              {s < 3 && <div className={`${styles.progressLine} ${step > s ? styles.progressLineActive : ''}`} />}
            </div>
          ))}
        </div>

        <h1>🧑‍🌾 Register as Farmer</h1>
        <p className={styles.subtitle}>Join farmers across India getting fair deals</p>

        {error && <div className={styles.error}>{error}</div>}

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <div className="form-group">
              <label>Full Name <span className={styles.required}>*</span></label>
              <input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Ramesh Patil" />
            </div>

            <div className={styles.row}>
              <div className="form-group">
                <label>Village / Town <span className={styles.required}>*</span></label>
                <input required value={form.village} onChange={(e) => update('village', e.target.value)} placeholder="Shirur" />
              </div>
              <div className="form-group">
                <label>District <span className={styles.required}>*</span></label>
                <input required value={form.district} onChange={(e) => update('district', e.target.value)} placeholder="Pune" />
              </div>
            </div>

            <div className={styles.row}>
              <div className="form-group">
                <label>State <span className={styles.required}>*</span></label>
                <select required value={form.state} onChange={(e) => update('state', e.target.value)}>
                  <option value="">Select state</option>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Phone Number <span className={styles.required}>*</span></label>
                <input required type="tel" maxLength={10} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="9876543210" />
              </div>
            </div>

            <div className="form-group">
              <label>Full Address <span className={styles.infoTag}>For pickup & delivery</span></label>
              <textarea 
                value={form.address} 
                onChange={(e) => update('address', e.target.value)} 
                placeholder="House no., Street, Landmark, Village/Town..."
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label>Pincode</label>
              <input type="text" maxLength={6} value={form.pincode} onChange={(e) => update('pincode', e.target.value.replace(/\D/g, ''))} placeholder="411033" />
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

        {/* Step 2: Farm Details */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <div className="form-group">
              <label>Crop Specialisation <span className={styles.required}>*</span></label>
              <div className={styles.multiSelect}>
                {CROPS.map((crop) => (
                  <label key={crop}>
                    <input type="checkbox" checked={form.crops.includes(crop)} onChange={() => toggleCrop(crop)} />
                    {crop}
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.row}>
              <div className="form-group">
                <label>Land Size (acres)</label>
                <input type="number" value={form.landSize} onChange={(e) => update('landSize', e.target.value)} placeholder="12" />
              </div>
              <div className="form-group">
                <label>Aadhaar Number</label>
                <input value={form.aadhaar} onChange={(e) => update('aadhaar', e.target.value)} placeholder="XXXX-XXXX-1234" maxLength={14} />
              </div>
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

        {/* Step 3: Security */}
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
              <p><strong>Name:</strong> {form.name}</p>
              <p><strong>Location:</strong> {form.village}, {form.district}, {form.state} {form.pincode && `- ${form.pincode}`}</p>
              <p><strong>Phone:</strong> {form.phone}</p>
              <p><strong>Crops:</strong> {form.crops.join(', ')}</p>
              {form.address && <p><strong>Address:</strong> {form.address}</p>}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className={`btn-secondary ${styles.submitBtn}`} onClick={() => setStep(2)} style={{ flex: 1 }}>
                ← Back
              </button>
              <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={submitting} style={{ flex: 1 }}>
                {submitting ? '🔄 Creating...' : '🌾 Create My Account'}
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
