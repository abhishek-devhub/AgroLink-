'use client';

import React from 'react';
import styles from './MarketPrices.module.css';
import { useMandiPrices } from '@/hooks/useMandiPrices';
import { BASE_PRICES, SEVEN_DAY_HISTORY } from '@/lib/mandiData';

// Generates an SVG sparkline path
function Sparkline({ data, width, height, isCard = false }) {
  if (!data || data.length === 0) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const lastPrice = data[data.length - 1];
  const firstPrice = data[0];
  const strokeColor = lastPrice >= firstPrice ? '#27AE60' : '#E74C3C';

  // Calculate points
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    // Add small padding so stroke doesn't get cut off
    const safeY = Math.max(2, Math.min(height - 2, y));
    return { x, y: safeY };
  });

  // Create smooth bezier curve path
  let pathD = `M ${points[0].x},${points[0].y} `;
  if (points.length > 2) {
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
      
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      
      pathD += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y} `;
    }
  } else {
    pathD += `L ${points[1].x},${points[1].y}`;
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth={isCard ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


export default function MarketPrices() {
  const { prices, changes, flashing, lastUpdated, source } = useMandiPrices();
  const cropKeys = Object.keys(BASE_PRICES);

  return (
    <div className="page-container">
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Today's Mandi Prices</h1>
          <p className={styles.subtitle}>Sourced from APMC mandis across India</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div className={styles.liveBadge}>
            <span className={styles.dot}></span>
            Live
            <span className={styles.timestamp}>• {lastUpdated}</span>
          </div>
          {source === 'fallback' && (
            <span className={styles.fallbackNotice}>Showing estimated prices — live data temporarily unavailable</span>
          )}
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Crop</th>
              <th>Mandi Location</th>
              <th>Today's Price</th>
              <th>Change (₹)</th>
              <th>Change (%)</th>
              <th>7-Day Trend</th>
            </tr>
          </thead>
          <tbody>
            {cropKeys.map(crop => {
              const currentPrice = prices[crop] || BASE_PRICES[crop].base;
              const mandi = BASE_PRICES[crop].mandi;
              const change = changes[crop] || { diff: 0, pct: '0.00', direction: 'up' };
              const isUp = change.direction === 'up';
              const isFlashing = flashing[crop];
              
              // Add today's fake live price to history just for the sparkline rendering shape
              const historyArray = [...(SEVEN_DAY_HISTORY[crop] || []), currentPrice];

              return (
                <tr key={crop}>
                  <td className={styles.cropName}>{crop}</td>
                  <td className={styles.mandiLocation}>{mandi}</td>
                  <td className={`${styles.currentPrice} ${isFlashing ? styles.flashItem : ''}`}>
                    ₹{currentPrice.toLocaleString('en-IN')}/q
                  </td>
                  <td className={isUp ? styles.up : styles.down}>
                    {isUp ? '+' : '-'}₹{Math.abs(change.diff)}
                  </td>
                  <td className={isUp ? styles.up : styles.down}>
                    {isUp ? '▲' : '▼'} {change.pct}%
                  </td>
                  <td>
                    <Sparkline data={historyArray} width={80} height={32} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className={styles.cardsSectionTitle}>Price Breakdown by Crop</h2>
      
      <div className={styles.cardsGrid}>
        {cropKeys.map(crop => {
          const currentPrice = prices[crop] || BASE_PRICES[crop].base;
          const mandi = BASE_PRICES[crop].mandi;
          const change = changes[crop] || { diff: 0, pct: '0.00', direction: 'up' };
          const isUp = change.direction === 'up';
          const isFlashing = flashing[crop];
          
          const historyArray = [...(SEVEN_DAY_HISTORY[crop] || [])];
          const minTracker = Math.min(...historyArray, currentPrice);
          const maxTracker = Math.max(...historyArray, currentPrice);

          return (
            <div key={crop} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardCrop}>{crop}</h3>
                  <p className={styles.mandiLocation}>{mandi}</p>
                </div>
                <div className={`${styles.cardBadge} ${isUp ? styles.badgeUp : styles.badgeDown}`}>
                  {isUp ? '▲' : '▼'} {change.pct}%
                </div>
              </div>
              
              <h4 className={`${styles.cardPrice} ${isFlashing ? styles.flashItem : ''}`}>
                ₹{currentPrice.toLocaleString('en-IN')}
              </h4>
              
              <div className={styles.svgContainer}>
                <Sparkline data={[...historyArray, currentPrice]} width={300} height={60} isCard={true} />
              </div>

              <p className={styles.cardRange}>
                Week low ₹{minTracker.toLocaleString('en-IN')} — Week high ₹{maxTracker.toLocaleString('en-IN')}
              </p>
            </div>
          );
        })}
      </div>
    </div>

  );
}
