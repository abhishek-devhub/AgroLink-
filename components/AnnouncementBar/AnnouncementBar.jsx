'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './AnnouncementBar.module.css';

const ANNOUNCEMENTS = [
  {
    id: 1,
    emoji: '🏛️',
    text: 'PM-KISAN 18th Installment Released — ₹2000 transferred to 9 crore farmer accounts',
    tag: 'PM-KISAN',
    tagColor: '#38a169',
  },
  {
    id: 2,
    emoji: '📈',
    text: 'MSP for Kharif 2024 increased — Paddy ₹2300/q, Jowar ₹3371/q, Bajra ₹2625/q',
    tag: 'MSP Update',
    tagColor: '#d97706',
  },
  {
    id: 3,
    emoji: '🌱',
    text: 'Digital Agriculture Mission launched — Free digital ID for all farmers across India',
    tag: 'New Scheme',
    tagColor: '#3182ce',
  },
  {
    id: 4,
    emoji: '💧',
    text: 'Pradhan Mantri Krishi Sinchayee Yojana extended — Apply for micro-irrigation subsidy now',
    tag: 'Irrigation',
    tagColor: '#319795',
  },
  {
    id: 5,
    emoji: '🏦',
    text: 'Kisan Credit Card limit increased to ₹3 lakh at 4% interest — Apply at your nearest bank',
    tag: 'KCC',
    tagColor: '#805ad5',
  },
  {
    id: 6,
    emoji: '☁️',
    text: 'Weather Alert — IMD predicts above-normal monsoon rainfall in 2024. Plan crops accordingly',
    tag: 'Weather',
    tagColor: '#e53e3e',
  },
];

export default function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ANNOUNCEMENTS.length);
    }, 5000);

    return () => clearInterval(timerRef.current);
  }, [isPaused]);

  if (!isVisible) return null;

  const current = ANNOUNCEMENTS[currentIndex];

  return (
    <div
      className={styles.bar}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.inner}>
        {/* Left: live dot + tag */}
        <div className={styles.left}>
          <span className={styles.liveDot} />
          <span className={styles.tag} style={{ backgroundColor: current.tagColor }}>
            {current.tag}
          </span>
        </div>

        {/* Center: announcement text */}
        <div className={styles.center}>
          <span className={styles.emoji}>{current.emoji}</span>
          <span className={styles.text} key={current.id}>
            {current.text}
          </span>
        </div>

        {/* Right: nav arrows + close */}
        <div className={styles.right}>
          <button
            className={styles.navBtn}
            onClick={() => setCurrentIndex(prev => (prev - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length)}
            aria-label="Previous announcement"
          >
            ‹
          </button>
          <span className={styles.counter}>
            {currentIndex + 1}/{ANNOUNCEMENTS.length}
          </span>
          <button
            className={styles.navBtn}
            onClick={() => setCurrentIndex(prev => (prev + 1) % ANNOUNCEMENTS.length)}
            aria-label="Next announcement"
          >
            ›
          </button>
          <button
            className={styles.closeBtn}
            onClick={() => setIsVisible(false)}
            aria-label="Close announcement bar"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
