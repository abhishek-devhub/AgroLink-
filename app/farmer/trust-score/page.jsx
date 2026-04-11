'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import styles from './trust-score.module.css';

const BREAKDOWN_META = [
  { key: 'delivery', label: 'Delivery Reliability', icon: '🚚', bg: '#e8f5e9' },
  { key: 'quality', label: 'Quality Consistency', icon: '⭐', bg: '#fff3e0' },
  { key: 'consistency', label: 'Platform Activity', icon: '📊', bg: '#e3f2fd' },
  { key: 'volume', label: 'Trade Volume', icon: '📦', bg: '#f3e5f5' },
  { key: 'community', label: 'Community Rating', icon: '👥', bg: '#fce4ec' },
];

export default function TrustScorePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'farmer')) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetch(`/api/farmer/trust-score?farmerId=${user.id}`)
        .then(r => {
          if (!r.ok) throw new Error('Failed to load');
          return r.json();
        })
        .then(d => {
          if (d.error) { setError(d.error); return; }
          setData(d);
        })
        .catch(() => setError('Unable to load trust score.'));
    }
  }, [user]);

  // Animate score counter
  useEffect(() => {
    if (!data) return;
    const target = data.overallScore;
    const duration = 2000;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [data]);

  if (loading || !user) return null;
  if (error) return (
    <div className={styles.trustWrap}>
      <div className="page-container">
        <div className={styles.header}>
          <h1>⭐ Farmer Trust Score</h1>
          <p>{error}</p>
        </div>
      </div>
    </div>
  );
  if (!data) return null;

  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference - (circumference * animatedScore) / 100;

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    if (score >= 40) return '#FFC107';
    return '#F44336';
  };

  const getBadgeEmoji = (badge) => {
    switch (badge) {
      case 'Platinum': return '💎';
      case 'Gold': return '🥇';
      case 'Silver': return '🥈';
      default: return '🥉';
    }
  };

  const badgeProgressPct = data.nextBadge
    ? ((data.overallScore % 25) / 25) * 100
    : 100;

  return (
    <div className={styles.trustWrap}>
      <div className="page-container">
        {/* Header */}
        <div className={styles.header}>
          <h1>⭐ Farmer Trust Score</h1>
          <p>Your reputation credit profile — built from your transaction history, quality, and community trust</p>
        </div>

        {/* Score Circle */}
        <div className={styles.scoreSection}>
          <div className={styles.scoreCircleWrap}>
            <svg className={styles.scoreCircleSvg} viewBox="0 0 200 200">
              <circle className={styles.scoreTrack} cx="100" cy="100" r="90" />
              <circle
                className={styles.scoreFill}
                cx="100" cy="100" r="90"
                stroke={getScoreColor(data.overallScore)}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className={styles.scoreInner}>
              <div className={styles.scoreNumber}>{animatedScore}</div>
              <div className={styles.scoreLabel}>Trust Score</div>
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className={styles.badgeSection}>
          <div className={styles.badgeWrap}>
            <div className={styles.badgeIcon} style={{ background: data.badgeColor, borderColor: data.badgeColor }}>
              {getBadgeEmoji(data.badge)}
            </div>
            <div className={styles.badgeName}>{data.badge} Farmer</div>
            {data.nextBadge ? (
              <>
                <div className={styles.badgeProgress}>
                  {data.pointsToNext} points to {data.nextBadge}
                </div>
                <div className={styles.badgeProgressBar}>
                  <div className={styles.badgeProgressFill} style={{ width: `${badgeProgressPct}%` }}></div>
                </div>
              </>
            ) : (
              <div className={styles.badgeProgress}>🎉 Highest rank achieved!</div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{data.stats.completedOrders}</div>
            <div className={styles.statLabel}>Orders Completed</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>₹{(data.stats.totalVolume / 1000).toFixed(0)}K</div>
            <div className={styles.statLabel}>Total Volume</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{data.stats.avgRating}</div>
            <div className={styles.statLabel}>Avg Rating</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{data.stats.ratingsCount}</div>
            <div className={styles.statLabel}>Reviews</div>
          </div>
        </div>

        {/* Breakdown */}
        <div className={styles.breakdownSection}>
          <div className={styles.radarCard}>
            <h3>📊 Score Breakdown</h3>
            <div className={styles.breakdownList}>
              {BREAKDOWN_META.map(({ key, label, icon, bg }) => (
                <div key={key} className={styles.breakdownItem}>
                  <div className={styles.breakdownIcon} style={{ background: bg }}>{icon}</div>
                  <div className={styles.breakdownInfo}>
                    <div className={styles.breakdownLabel}>{label}</div>
                    <div className={styles.breakdownBarWrap}>
                      <div
                        className={`${styles.breakdownBar} ${styles[key]}`}
                        style={{ width: `${data.breakdown[key]}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className={styles.breakdownScore}>{data.breakdown[key]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Opportunities */}
          <div className={styles.radarCard}>
            <h3>🔓 Unlocked Opportunities</h3>
            <div className={styles.opportunityGrid}>
              {data.opportunities.map((op, i) => (
                <div key={i} className={`${styles.opportunityItem} ${op.unlocked ? styles.unlocked : styles.locked}`}>
                  <span className={styles.oppIcon}>{op.icon}</span>
                  <div className={styles.oppInfo}>
                    <div className={styles.oppName}>{op.name}</div>
                    <div className={styles.oppThreshold}>Score ≥ {op.threshold}</div>
                  </div>
                  <span className={`${styles.oppStatus} ${op.unlocked ? styles.unlocked : styles.locked}`}>
                    {op.unlocked ? '✅' : '🔒'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tips */}
        {data.tips.length > 0 && (
          <div className={styles.tipsCard}>
            <h3>💡 Improve Your Score</h3>
            <ul className={styles.tipsList}>
              {data.tips.map((tip, i) => (
                <li key={i} className={styles.tipItem}>
                  <span>📈</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
