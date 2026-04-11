'use client';

import { useEffect, useState } from 'react';
import styles from './JourneyMap.module.css';

const CHECKPOINT_POSITIONS = [
  { x: 80, y: 220, label: 'Farm' },
  { x: 230, y: 160, label: 'Quality Check' },
  { x: 400, y: 100, label: 'Packed' },
  { x: 580, y: 160, label: 'In Transit' },
  { x: 720, y: 220, label: 'Delivered' },
];

function formatStepDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Consistent hash from string — same input always gives same output
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function JourneyMap({ steps = [], harvestDate, orderId = '', farmerDistrict = '', buyerDistrict = '' }) {
  const [animReady, setAnimReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const completedSteps = steps.filter(s => s.status === 'complete').length;
  const activeStep = steps.findIndex(s => s.status === 'active');

  // Consistent distance derived from order ID — same order always shows same distance
  const seed = hashCode(orderId || 'default');
  const distance = 50 + (seed % 250); // 50-300 km range
  const estimatedHours = Math.round(distance / 40);
  const carbonKg = (distance * 0.12).toFixed(1);

  // Freshness score based on time since harvest
  const hoursSinceHarvest = harvestDate
    ? Math.floor((Date.now() - new Date(harvestDate).getTime()) / 3600000)
    : 24;
  const freshnessPct = Math.max(5, Math.min(95, 100 - (hoursSinceHarvest / 72) * 100));

  const pathD = `M 80,220 C 130,180 180,180 230,160 S 350,80 400,100 S 530,190 580,160 S 670,210 720,220`;

  const vehicleIdx = activeStep >= 0 ? activeStep : completedSteps >= steps.length ? steps.length - 1 : 0;
  const vehiclePos = CHECKPOINT_POSITIONS[Math.min(vehicleIdx, CHECKPOINT_POSITIONS.length - 1)];

  return (
    <div className={styles.mapWrap}>
      <h3 className={styles.mapTitle}>🗺️ Live Journey Map</h3>

      <div className={styles.mapContainer}>
        <svg className={styles.mapSvg} viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(74, 124, 63, 0.07)" strokeWidth="1" />
            </pattern>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4A7C3F" />
              <stop offset="50%" stopColor="#6cc25e" />
              <stop offset="100%" stopColor="#4A7C3F" />
            </linearGradient>
          </defs>
          <rect width="800" height="300" fill="url(#grid)" />

          {/* Location labels */}
          <text x={CHECKPOINT_POSITIONS[0].x} y={CHECKPOINT_POSITIONS[0].y + 45} textAnchor="middle" fontSize="11" fill="var(--bark)" fontWeight="600">
            {farmerDistrict ? `📍 ${farmerDistrict}` : '🏡 Farm'}
          </text>
          <text x={CHECKPOINT_POSITIONS[4].x} y={CHECKPOINT_POSITIONS[4].y + 45} textAnchor="middle" fontSize="11" fill="var(--bark)" fontWeight="600">
            {buyerDistrict ? `📍 ${buyerDistrict}` : '🏪 Buyer'}
          </text>

          <path d={pathD} className={styles.routePathBg} />

          {animReady && (
            <path d={pathD} className={styles.routePath} stroke="url(#routeGradient)" />
          )}

          {CHECKPOINT_POSITIONS.map((pos, i) => {
            const step = steps[i] || { status: 'pending' };
            return (
              <g key={i} className={styles.checkpoint}>
                {step.status === 'active' && (
                  <circle cx={pos.x} cy={pos.y} r="18" fill="rgba(212, 140, 45, 0.15)">
                    <animate attributeName="r" values="15;22;15" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                <circle
                  cx={pos.x} cy={pos.y} r="10"
                  className={`${styles.checkpointCircle} ${styles[step.status]}`}
                />

                {step.status === 'complete' && (
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">✓</text>
                )}

                <text x={pos.x} y={pos.y - 18} className={styles.checkpointLabel}>
                  {step.label || pos.label}
                </text>

                {step.timestamp && (
                  <text x={pos.x} y={pos.y - 30} className={styles.checkpointTime}>
                    {formatStepDate(step.timestamp)}
                  </text>
                )}
              </g>
            );
          })}

          {activeStep >= 0 && (
            <text x={vehiclePos.x + 20} y={vehiclePos.y - 15} fontSize="22" className={styles.vehicleIcon}>
              🚛
            </text>
          )}

          <text x="400" y="280" textAnchor="middle" fontSize="12" fill="var(--bark)" fontWeight="600">
            Total Distance: {distance} km • Est. Time: {estimatedHours}h
          </text>
        </svg>
      </div>

      <div className={styles.mapInfoGrid}>
        <div className={styles.mapInfoCard}>
          <div className={`${styles.mapInfoValue} ${styles.distance}`}>📏 {distance} km</div>
          <div className={styles.mapInfoLabel}>Total Distance</div>
        </div>
        <div className={styles.mapInfoCard}>
          <div className={`${styles.mapInfoValue} ${styles.time}`}>⏱️ {estimatedHours}h</div>
          <div className={styles.mapInfoLabel}>Estimated Transit</div>
        </div>
        <div className={styles.mapInfoCard}>
          <div className={`${styles.mapInfoValue} ${styles.carbon}`}>🌿 {carbonKg} kg</div>
          <div className={styles.mapInfoLabel}>CO₂ Footprint</div>
        </div>
      </div>

      <div className={styles.freshnessWrap}>
        <div className={styles.freshnessTitle}>🥬 Freshness Score</div>
        <div className={styles.freshnessBar}>
          <div className={styles.freshnessMarker} style={{ left: `${freshnessPct}%` }}></div>
        </div>
        <div className={styles.freshnessLabels}>
          <span>Needs Attention</span>
          <span>Good</span>
          <span>Very Fresh</span>
        </div>
      </div>
    </div>
  );
}
