'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './GovtAnnouncements.module.css';

const FALLBACK_ANNOUNCEMENTS = [
  {
    title: 'PM-KISAN 18th Installment Released',
    description:
      'The 18th installment of PM-KISAN scheme has been released, benefiting over 9 crore farmer families across India with direct benefit transfer.',
    link: 'https://pib.gov.in',
    pubDate: new Date().toISOString(),
    farmerImpact: '₹2000 transferred to farmer accounts',
  },
  {
    title: 'MSP Hike Approved for Kharif Crops 2024',
    description:
      'Cabinet Committee on Economic Affairs approves increase in Minimum Support Prices for all mandated Kharif crops for the marketing season.',
    link: 'https://pib.gov.in',
    pubDate: new Date().toISOString(),
    farmerImpact: 'Higher minimum price for your harvest',
  },
  {
    title: 'Digital Agriculture Mission Launched',
    description:
      'Ministry of Agriculture launches Digital Agriculture Mission to create digital identities for farmers and digitize agricultural practices.',
    link: 'https://pib.gov.in',
    pubDate: new Date().toISOString(),
    farmerImpact: 'Free digital ID for all farmers',
  },
];

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function GovtAnnouncements({ condensed = false }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/govt-announcements');
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      } catch {
        setError(true);
        setAnnouncements(FALLBACK_ANNOUNCEMENTS);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const displayItems = condensed
    ? announcements.slice(0, 2)
    : announcements;

  return (
    <div className={styles.section}>
      {/* --- Header --- */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>🏛️</span>
          <div>
            <h2 className={styles.headerTitle}>Government Announcements</h2>
            <p className={styles.headerSub}>
              Official releases · Ministry of Agriculture, GoI
            </p>
          </div>
        </div>
        <span className={styles.liveBadge}>📡 Live Feed</span>
      </div>

      {/* --- Loading Skeletons --- */}
      {loading && (
        <div className={styles.grid}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={styles.skeleton} />
          ))}
        </div>
      )}

      {/* --- Cards Grid --- */}
      {!loading && (
        <div className={styles.grid}>
          {displayItems.map((item, i) => (
            <div
              key={i}
              className={styles.card}
              onClick={() => window.open(item.link, '_blank')}
            >
              <div className={styles.cardInner}>
                <div className={styles.cardIconWrap}>
                  <span>📋</span>
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardTitle}>{item.title}</p>
                  {item.farmerImpact && (
                    <span className={styles.impactBadge}>
                      ✅ {item.farmerImpact}
                    </span>
                  )}
                  <p className={styles.cardDesc}>{item.description}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.cardDate}>
                      {formatDate(item.pubDate)}
                    </span>
                    <span className={styles.cardLink}>Read more →</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Condensed view: link to full page --- */}
      {condensed && !loading && (
        <Link href="/buyer/market-prices" className={styles.viewAll}>
          View all announcements →
        </Link>
      )}
    </div>
  );
}
