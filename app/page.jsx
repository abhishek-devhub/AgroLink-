'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import WaveDivider from '@/components/WaveDivider/WaveDivider';
import styles from './page.module.css';

function AnimatedCounter({ end, suffix = '', prefix = '' }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (end === 0 || hasAnimated.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const start = Date.now();
          const animate = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(end * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  const fmt = end >= 100000
    ? `${prefix}${(value / 100000).toFixed(1)}L${suffix}`
    : `${prefix}${value.toLocaleString('en-IN')}${suffix}`;

  return <span ref={ref} className={styles.counterVal}>{end === 0 ? '—' : fmt}</span>;
}

const FEATURES = [
  {
    icon: '🌦️',
    title: 'Weather-Smart Pricing',
    desc: 'Live weather from your PIN-code combined with mandi rates — tells you exactly when to sell each crop for maximum profit.',
    accent: 'var(--sky)',
    bg: 'linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%)',
  },
  {
    icon: '⭐',
    title: 'Farmer Trust Score',
    desc: 'Build real reputation from real transactions. Higher scores unlock microfinance pre-approval and insurance discounts.',
    accent: 'var(--harvest)',
    bg: 'linear-gradient(135deg, #FFF8EE 0%, #FEF3C7 100%)',
  },
  {
    icon: '🎙️',
    title: 'Voice-First Community',
    desc: 'Post farming tips using voice — no typing needed. Auto-transcription and category tagging for an inclusive forum.',
    accent: '#9C27B0',
    bg: 'linear-gradient(135deg, #F5EEFF 0%, #EDE9F9 100%)',
  },
  {
    icon: '🗺️',
    title: 'Live Supply Chain',
    desc: 'Animated tracking from farm to buyer with real-time freshness scoring and Razorpay-secured instant payments.',
    accent: 'var(--leaf)',
    bg: 'linear-gradient(135deg, #EDFBF0 0%, #D1FAE5 100%)',
  },
];

const HOW_STEPS = [
  {
    num: '01', title: 'List Your Produce',
    desc: 'Upload crop details, photos, and set a fair asking price with live mandi benchmarks. Or just speak — our AI fills the form.',
    icon: '📋',
  },
  {
    num: '02', title: 'Buyers Make Offers',
    desc: 'Verified buyers browse listings, check quality grades, and place offers or buy at your asking price directly.',
    icon: '🤝',
  },
  {
    num: '03', title: 'Track & Get Paid',
    desc: 'Track the supply chain from harvest to delivery. Payment lands via Razorpay the moment goods are confirmed received.',
    icon: '💰',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Pehle middleman 30% le jaata tha. AgroLink se direct buyers milte hain aur pura paisa mujhe milta hai.',
    name: 'Ramesh Patil', location: 'Shirur, Pune', crop: 'Onion farmer', emoji: '🧑‍🌾',
  },
  {
    quote: 'Weather-smart pricing ne bataya ki ek hafte baad baarish ayegi — main ne soya bean ussi waqt becha, 12% zyada mila.',
    name: 'Sunil Kumar', location: 'Indore, MP', crop: 'Soybean farmer', emoji: '👨‍🌾',
  },
  {
    quote: 'As a buyer, AgroLink gives me Grade-A tomatoes directly from Kolar farms. Freshness and supply chain transparency is unmatched.',
    name: 'Priya Mehta', location: 'Bangalore', crop: 'Retail buyer', emoji: '🏪',
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user) router.push(`/${user.role}/dashboard`);
  }, [user, router]);

  useEffect(() => {
    fetch('/api/seed').catch(() => {});
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <>
      {/* ─── Hero ─────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true">
          <div className={styles.blob1} />
          <div className={styles.blob2} />
          <div className={styles.blob3} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            <span>India's Fastest-Growing Farm-to-Buyer Network</span>
          </div>

          <h1 className={styles.heroTitle}>
            Fair deals,{' '}
            <span className={styles.heroGradient}>straight from<br />the field</span>
          </h1>

          <p className={styles.heroSubtitle}>
            AgroLink connects Indian farmers directly with verified buyers.
            No middlemen. Real prices. Transparent supply chain from harvest to doorstep.
          </p>

          <div className={styles.heroCta}>
            <Link href="/farmer/register" className={`btn-primary ${styles.ctaBtn}`}>
              <span>🧑‍🌾</span>
              <div>
                <div className={styles.ctaBtnLabel}>Join as Farmer</div>
                <div className={styles.ctaBtnDesc}>List produce, get fair prices</div>
              </div>
            </Link>
            <Link href="/buyer/register" className={`btn-harvest ${styles.ctaBtn}`}>
              <span>🏪</span>
              <div>
                <div className={styles.ctaBtnLabel}>Join as Buyer</div>
                <div className={styles.ctaBtnDesc}>Buy fresh, direct from farms</div>
              </div>
            </Link>
          </div>

          <p className={styles.heroLogin}>
            Already have an account?{' '}
            <Link href="/login" className="link">Sign in here →</Link>
          </p>
        </div>

        {/* Floating crop cards */}
        <div className={styles.heroFloating} aria-hidden="true">
          <div className={`${styles.floatCard} ${styles.floatCard1}`}>
            <span className={styles.floatEmoji}>🌾</span>
            <div>
              <div className={styles.floatLabel}>Wheat — Grade A</div>
              <div className={styles.floatPrice}>₹2,180 / quintal</div>
            </div>
          </div>
          <div className={`${styles.floatCard} ${styles.floatCard2}`}>
            <span className={styles.floatEmoji}>🍅</span>
            <div>
              <div className={styles.floatLabel}>Tomato — Fresh</div>
              <div className={styles.floatPrice}>₹1,450 / quintal</div>
            </div>
          </div>
          <div className={`${styles.floatCard} ${styles.floatCard3}`}>
            <span className={styles.floatEmoji}>🧅</span>
            <div>
              <div className={styles.floatLabel}>Onion — Lasalgaon</div>
              <div className={styles.floatPrice}>₹1,820 / quintal</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────── */}
      <section className={styles.statsSection}>
        <div className={styles.statsInner}>
          {[
            { label: 'Farmers Onboarded', value: stats?.farmers, suffix: '+' },
            { label: 'Direct Trade Value', value: stats?.tradeValue, prefix: '₹' },
            { label: 'Verified Buyers', value: stats?.buyers, suffix: '+' },
            { label: 'States Covered', value: stats?.states },
          ].map(({ label, value, suffix, prefix }) => (
            <div key={label} className={styles.statItem}>
              <AnimatedCounter end={value || 0} suffix={suffix || ''} prefix={prefix || ''} />
              <p className={styles.statLabel}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      <WaveDivider color="var(--cream)" bg="var(--soil)" />

      {/* ─── How It Works ───────────────────────────── */}
      <section className={styles.howSection}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionBadge}>Simple Process</div>
          <h2 className={styles.sectionTitle}>How it works — simple as sowing seeds</h2>
          <p className={styles.sectionSubtitle}>From listing to payment in 3 easy steps — no middlemen, no confusion.</p>

          <div className={styles.howGrid}>
            {HOW_STEPS.map((step, i) => (
              <div key={i} className={styles.howCard}>
                <div className={styles.howIconWrap}>
                  <span className={styles.howIcon}>{step.icon}</span>
                  <span className={styles.howNum}>{step.num}</span>
                </div>
                <h3 className={styles.howTitle}>{step.title}</h3>
                <p className={styles.howDesc}>{step.desc}</p>
                {i < HOW_STEPS.length - 1 && (
                  <div className={styles.howConnector} aria-hidden="true">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider color="var(--mist)" bg="var(--cream)" />

      {/* ─── Features ───────────────────────────────── */}
      <section className={styles.featSection}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionBadge} style={{ color: 'var(--sky)', background: 'var(--sky-glow)' }}>
            Unique Features
          </div>
          <h2 className={styles.sectionTitle}>What makes AgroLink different</h2>
          <p className={styles.sectionSubtitle}>Real tools, real data — built for Indian farmers and buyers</p>

          <div className={styles.featGrid}>
            {FEATURES.map((feat, i) => (
              <div key={i} className={styles.featCard} style={{ '--accent': feat.accent, '--feat-bg': feat.bg }}>
                <div className={styles.featIconBox}>
                  <span className={styles.featIcon}>{feat.icon}</span>
                </div>
                <h3 className={styles.featTitle}>{feat.title}</h3>
                <p className={styles.featDesc}>{feat.desc}</p>
                <div className={styles.featAccentBar} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider color="var(--soil)" bg="var(--mist)" />

      {/* ─── Testimonials ─────────────────────────── */}
      <section className={styles.testimonialSection}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionBadge} style={{ color: 'var(--harvest)', background: 'var(--harvest-glow)' }}>
            Real Stories
          </div>
          <h2 className={styles.sectionTitle} style={{ color: 'var(--cream)' }}>Trusted by farmers across India</h2>

          <div className={styles.testimonialGrid}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={styles.testimonialCard}>
                <div className={styles.testimonialQuote}>&ldquo;</div>
                <p className={styles.testimonialText}>{t.quote}</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar}>{t.emoji}</div>
                  <div>
                    <div className={styles.testimonialName}>{t.name}</div>
                    <div className={styles.testimonialMeta}>{t.crop} · {t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─────────────────────────────── */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBannerContent}>
          <h2 className={styles.ctaBannerTitle}>Ready to get fair prices for your produce?</h2>
          <p className={styles.ctaBannerDesc}>Join thousands of farmers already earning more — directly.</p>
          <div className={styles.ctaBannerBtns}>
            <Link href="/farmer/register" className="btn-primary">🌾 Register as Farmer</Link>
            <Link href="/buyer/register" className="btn-secondary" style={{ color: 'var(--cream)', borderColor: 'rgba(248,244,238,0.4)' }}>
              🏪 Register as Buyer
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>🌾 AgroLink</div>
            <p className={styles.footerMission}>
              Built for the people who feed the nation. Fair prices, no middlemen, real transparency.
            </p>
            <div className={styles.footerSocials}>
              <a href="mailto:namaste@agrolink.in" className={styles.socialBtn} aria-label="Email">📧</a>
              <a href="tel:1800276054" className={styles.socialBtn} aria-label="Phone">📞</a>
            </div>
          </div>

          <div className={styles.footerLinks}>
            <h4>Platform</h4>
            <Link href="/farmer/register">Register as Farmer</Link>
            <Link href="/buyer/register">Register as Buyer</Link>
            <Link href="/login">Login</Link>
            <Link href="/community">Community Hub</Link>
          </div>

          <div className={styles.footerLinks}>
            <h4>Resources</h4>
            <Link href="/community">Farming Tips</Link>
            <Link href="/buyer/market-prices">Market Prices</Link>
            <a href="#">Help Centre</a>
            <a href="#">Privacy Policy</a>
          </div>

          <div className={styles.footerContact}>
            <h4>Contact Us</h4>
            <p>📞 1800-AGRO-LINK</p>
            <p>📧 namaste@agrolink.in</p>
            <p>📍 Pune, Maharashtra</p>
            <div className={styles.footerTrust}>
              <span>🔒 SSL Secured</span>
              <span>✅ RBI Compliant</span>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} AgroLink — Made with ❤️ for Indian farms</span>
          <span className={styles.footerBottomLinks}>
            <a href="#">Terms</a> · <a href="#">Privacy</a>
          </span>
        </div>
      </footer>
    </>
  );
}
