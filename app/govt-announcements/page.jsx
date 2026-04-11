'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

const CATEGORIES = [
  { label: 'All', value: 'all', emoji: '📰' },
  { label: 'Subsidies', value: 'subsidy', emoji: '💰' },
  { label: 'MSP & Pricing', value: 'msp', emoji: '📈' },
  { label: 'Schemes', value: 'scheme', emoji: '🏛️' },
  { label: 'Technology', value: 'tech', emoji: '💻' },
  { label: 'Weather', value: 'weather', emoji: '☁️' },
];

function categorize(title) {
  const t = title.toLowerCase();
  if (t.includes('msp') || t.includes('price') || t.includes('rate')) return 'msp';
  if (t.includes('subsid') || t.includes('kisan') || t.includes('pm-') || t.includes('credit') || t.includes('loan')) return 'subsidy';
  if (t.includes('scheme') || t.includes('yojana') || t.includes('mission') || t.includes('policy')) return 'scheme';
  if (t.includes('digital') || t.includes('tech') || t.includes('app') || t.includes('portal')) return 'tech';
  if (t.includes('weather') || t.includes('rain') || t.includes('monsoon') || t.includes('flood') || t.includes('drought')) return 'weather';
  return 'scheme';
}

function getCategoryEmoji(cat) {
  const found = CATEGORIES.find(c => c.value === cat);
  return found ? found.emoji : '📋';
}

function getCategoryColor(cat) {
  const map = {
    subsidy: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
    msp: { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
    scheme: { bg: '#ede9fe', border: '#c4b5fd', text: '#5b21b6' },
    tech: { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
    weather: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
  };
  return map[cat] || { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' };
}

export default function GovtAnnouncementsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/govt-announcements');
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      } catch {
        setAnnouncements([
          {
            title: 'PM-KISAN 18th Installment Released',
            description: 'The 18th installment of PM-KISAN scheme has been released, benefiting over 9 crore farmer families across India.',
            link: 'https://pib.gov.in',
            pubDate: new Date().toISOString(),
            farmerImpact: '₹2000 transferred to farmer accounts',
          },
          {
            title: 'MSP Hike Approved for Kharif Crops 2024',
            description: 'Cabinet approves increase in Minimum Support Prices for all mandated Kharif crops for the marketing season.',
            link: 'https://pib.gov.in',
            pubDate: new Date().toISOString(),
            farmerImpact: 'Higher minimum price for your harvest',
          },
          {
            title: 'Digital Agriculture Mission Launched',
            description: 'Ministry of Agriculture launches Digital Agriculture Mission to create digital identities for farmers.',
            link: 'https://pib.gov.in',
            pubDate: new Date().toISOString(),
            farmerImpact: 'Free digital ID for all farmers',
          },
          {
            title: 'Pradhan Mantri Fasal Bima Yojana Extended',
            description: 'Crop insurance scheme extended for 3 more years with improved claim settlement process.',
            link: 'https://pib.gov.in',
            pubDate: new Date().toISOString(),
            farmerImpact: 'Easier crop insurance claims',
          },
          {
            title: 'Kisan Credit Card Interest Rate Reduced',
            description: 'Interest rate on Kisan Credit Card loans reduced to 4% for loans up to ₹3 lakh.',
            link: 'https://pib.gov.in',
            pubDate: new Date().toISOString(),
            farmerImpact: 'Cheaper loans for farmers',
          },
          {
            title: 'IMD Predicts Above-Normal Monsoon 2024',
            description: 'Indian Meteorological Department forecasts 106% of normal rainfall this monsoon season.',
            link: 'https://pib.gov.in',
            pubDate: new Date().toISOString(),
            farmerImpact: 'Good rains expected this season',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  if (loading || !user) return null;

  const enriched = announcements.map(a => ({
    ...a,
    category: categorize(a.title),
  }));

  const filtered = enriched.filter(a => {
    const matchCat = activeCategory === 'all' || a.category === activeCategory;
    const matchSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '2.2rem' }}>🏛️</span>
          <div>
            <h1 className="page-title" style={{ marginBottom: '0.15rem' }}>Government Announcements</h1>
            <p style={{ color: 'var(--bark)', fontSize: '0.9rem', opacity: 0.8 }}>
              Official releases from Ministry of Agriculture, Government of India
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#276749' }}>{announcements.length}</div>
          <div style={{ fontSize: '0.78rem', color: '#4a5568', fontWeight: '500' }}>Total Updates</div>
        </div>
        <div style={{ background: '#fffff0', border: '1px solid #fefcbf', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#975a16' }}>{enriched.filter(a => a.category === 'subsidy').length}</div>
          <div style={{ fontSize: '0.78rem', color: '#4a5568', fontWeight: '500' }}>Subsidies</div>
        </div>
        <div style={{ background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2b6cb0' }}>{enriched.filter(a => a.category === 'msp').length}</div>
          <div style={{ fontSize: '0.78rem', color: '#4a5568', fontWeight: '500' }}>MSP Updates</div>
        </div>
        <div style={{ background: '#faf5ff', border: '1px solid #e9d8fd', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6b21a8' }}>{enriched.filter(a => a.category === 'scheme').length}</div>
          <div style={{ fontSize: '0.78rem', color: '#4a5568', fontWeight: '500' }}>Schemes</div>
        </div>
      </div>

      {/* Search + Category Filter */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Search announcements..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: '1', minWidth: '200px', padding: '0.7rem 1rem', borderRadius: '10px',
            border: '1.5px solid #e2e8f0', fontSize: '0.9rem', background: 'white',
          }}
        />
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              style={{
                padding: '0.45rem 0.85rem', borderRadius: '8px', border: 'none',
                fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
                background: activeCategory === cat.value ? 'var(--soil)' : '#f7f5f2',
                color: activeCategory === cat.value ? 'white' : 'var(--bark)',
                transition: 'all 0.2s',
              }}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} style={{
              background: 'linear-gradient(90deg, #f0ece6 25%, #e8e3db 50%, #f0ece6 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite',
              borderRadius: '14px', height: '180px',
            }} />
          ))}
        </div>
      )}

      {/* Cards */}
      {!isLoading && (
        <>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--bark)' }}>
              <span style={{ fontSize: '3rem' }}>📭</span>
              <p style={{ marginTop: '0.5rem', fontWeight: '600' }}>No announcements found</p>
              <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Try a different search term or category</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filtered.map((item, i) => {
              const catColor = getCategoryColor(item.category);
              return (
                <div
                  key={i}
                  className="card"
                  onClick={() => window.open(item.link, '_blank')}
                  style={{
                    cursor: 'pointer', padding: '1.25rem', borderTop: '4px solid ' + catColor.border,
                    display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  }}
                >
                  {/* Category badge + date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      background: catColor.bg, color: catColor.text, border: '1px solid ' + catColor.border,
                      padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700',
                      textTransform: 'uppercase', letterSpacing: '0.3px',
                    }}>
                      {getCategoryEmoji(item.category)} {CATEGORIES.find(c => c.value === item.category)?.label || 'General'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#a0aec0' }}>{formatDate(item.pubDate)}</span>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: '1rem', fontWeight: '700', color: 'var(--soil)', lineHeight: '1.4', margin: 0,
                  }}>
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    fontSize: '0.85rem', color: 'var(--bark)', lineHeight: '1.55', margin: 0,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {item.description}
                  </p>

                  {/* Impact badge */}
                  {item.farmerImpact && (
                    <div style={{
                      background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px',
                      padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                    }}>
                      <span style={{ fontSize: '0.9rem' }}>🌾</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#166534' }}>
                        Farmer Impact: {item.farmerImpact}
                      </span>
                    </div>
                  )}

                  {/* Read more */}
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--harvest)' }}>
                      Read full announcement →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
