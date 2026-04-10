'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import WaveDivider from '@/components/WaveDivider/WaveDivider';
import styles from './page.module.css';

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push(`/${user.role}/dashboard`);
  }, [user, router]);

  useEffect(() => {
    fetch('/api/seed').catch(() => {});
  }, []);

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.wheat}>🌾AgroLink</div>
        <h1 className={styles.title}>
          <span>Fair deals, straight from the field</span>
        </h1>
        <p className={styles.subtitle}>
          AgroLink connects farmers directly with buyers. No middlemen eating your profit.
          Real prices, real pay, and you can track every step from harvest to doorstep.
        </p>

        <div className={styles.roleButtons}>
          <Link href="/farmer/register" className={`${styles.roleBtn} ${styles.farmerBtn}`}>
            <span className={styles.emoji}>🧑‍🌾</span>
            <span className={styles.label}>I am a Farmer</span>
            <span className={styles.desc}>List your produce, get fair prices</span>
          </Link>
          <Link href="/buyer/register" className={`${styles.roleBtn} ${styles.buyerBtn}`}>
            <span className={styles.emoji}>🏪</span>
            <span className={styles.label}>I am a Buyer</span>
            <span className={styles.desc}>Buy fresh, direct from farms</span>
          </Link>
        </div>

        <p className={styles.loginLink}>
          Already have an account? <Link href="/login">Log in here</Link>
        </p>
      </section>

      {/* Stats Strip */}
      <section className={styles.statsStrip}>
        <div className={styles.statItem}>
          <h3>2,400+</h3>
          <p>Farmers Onboarded</p>
        </div>
        <div className={styles.statItem}>
          <h3>₹12Cr+</h3>
          <p>Direct Trade Value</p>
        </div>
        <div className={styles.statItem}>
          <h3>850+</h3>
          <p>Verified Buyers</p>
        </div>
        <div className={styles.statItem}>
          <h3>18</h3>
          <p>States Covered</p>
        </div>
      </section>

      {/* Wave Divider */}
      <WaveDivider color="var(--mist)" bg="var(--soil)" />

      {/* How It Works */}
      <section className={styles.howSection}>
        <h2>How it works — simple as sowing seeds</h2>
        <div className={styles.howCards}>
          <div className={styles.howCard}>
            <div className={styles.step}>1</div>
            <h3>List Your Produce</h3>
            <p>Farmer uploads crop details, photos, and sets a fair asking price based on live mandi rates.</p>
          </div>
          <div className={styles.howCard}>
            <div className={styles.step}>2</div>
            <h3>Buyers Make Offers</h3>
            <p>Verified buyers browse listings, check quality grades, and place offers or buy at asking price.</p>
          </div>
          <div className={styles.howCard}>
            <div className={styles.step}>3</div>
            <h3>Track & Get Paid</h3>
            <p>Track the supply chain from harvest to delivery. Payment lands the moment goods reach the buyer.</p>
          </div>
        </div>
      </section>

      {/* Wave Divider */}
      <WaveDivider color="var(--cream)" bg="var(--mist)" />

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerCol}>
            <h4>🌾 AgroLink</h4>
            <p>Built for the people who feed the nation. Fair prices, no middlemen, real transparency.</p>
          </div>
          <div className={styles.footerCol}>
            <h4>Quick Links</h4>
            <Link href="/farmer/register">Register as Farmer</Link>
            <Link href="/buyer/register">Register as Buyer</Link>
            <Link href="/login">Login</Link>
          </div>
          <div className={styles.footerCol}>
            <h4>Contact</h4>
            <p>📞 1800-AGRO-LINK</p>
            <p>📧 namaste@agrolink.in</p>
            <p>📍 Pune, Maharashtra</p>
          </div>
        </div>
        <p className={styles.footerBottom}>© 2024 AgroLink — Made with ❤️ for Indian farms</p>
      </footer>
    </>
  );
}
