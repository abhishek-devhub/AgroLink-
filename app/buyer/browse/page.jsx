'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import { CROPS } from '@/lib/config';

export default function BrowseListings() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState({ crop: '', minPrice: '', maxPrice: '' });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'buyer')) router.push('/login');
  }, [user, loading, router]);

  const fetchListings = () => {
    const params = new URLSearchParams();
    if (filters.crop) params.append('crop', filters.crop);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

    fetch(`/api/listings?${params.toString()}`)
      .then(r => r.json())
      .then(data => setListings(data.filter(l => l.status === 'active' || l.status === 'bid_received')))
      .catch(() => { });
  };

  useEffect(() => { if (user) fetchListings(); }, [user, filters]);

  if (loading || !user) return null;

  return (
    <div className="page-container" style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>

      {/* Sidebar Filters */}
      <div style={{ width: '100%', maxWidth: '300px', flexShrink: 0, minWidth: '300px' }}>
        <h1 style={{ fontSize: '1.4rem', color: 'var(--soil)', marginBottom: '1.75rem', fontWeight: 700, lineHeight: 1.3 }}>Browse Produce</h1>
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--soil)', marginBottom: '1.5rem', fontWeight: 700 }}>Filters</h3>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label style={{ marginBottom: '0.5rem' }}>Crop Type</label>
            <select value={filters.crop} onChange={e => setFilters(f => ({ ...f, crop: e.target.value }))} style={{ padding: '0.9rem 1.1rem' }}>
              <option value="">All Crops</option>
              {CROPS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--bark)', marginBottom: '0.5rem' }}>Price Range (₹/q)</label>
            <div style={{ display: 'flex', gap: '0.6rem', width: '100%' }}>
              <input type="number" placeholder="Min" value={filters.minPrice} onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))} style={{ flex: 1, padding: '0.9rem 1rem', fontSize: '0.95rem', border: '1.5px solid #d0c8be', borderRadius: '8px', boxSizing: 'border-box' }} />
              <input type="number" placeholder="Max" value={filters.maxPrice} onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))} style={{ flex: 1, padding: '0.9rem 1rem', fontSize: '0.95rem', border: '1.5px solid #d0c8be', borderRadius: '8px', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: '1rem', color: 'var(--bark)', fontSize: '0.9rem' }}>
          Showing {listings.length} live listings
        </div>

        {listings.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--bark)' }}>
            No listings match your filters.
          </div>
        ) : (
          <div className="grid-2">
            {listings.map(listing => (
              <div key={listing._id} className="card card-produce" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.85rem' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--soil)', fontWeight: 700, lineHeight: 1.3 }}>{listing.crop} <span style={{ fontSize: '0.95rem', color: 'var(--bark)', fontWeight: 'normal' }}>{listing.variety && `— ${listing.variety}`}</span></h3>
                  <StatusBadge status={listing.status} />
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--bark)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  🧑‍🌾 {listing.farmerName} • 📍 {listing.farmerDistrict}, {listing.farmerState}
                </p>

                <div style={{ display: 'flex', gap: '1.25rem', background: 'var(--mist)', padding: '1rem 1.1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--bark)', marginBottom: '0.35rem', fontWeight: 500 }}>Available</p>
                    <p style={{ fontWeight: 700, color: 'var(--soil)', fontSize: '1rem', lineHeight: 1.4 }}>{listing.quantity} {listing.unit}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--bark)', marginBottom: '0.35rem', fontWeight: 500 }}>Grade</p>
                    <p style={{ fontWeight: 700, color: 'var(--soil)', fontSize: '1rem', lineHeight: 1.4 }}>{listing.grade}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--bark)', marginBottom: '0.35rem', fontWeight: 500 }}>Price</p>
                    <p style={{ fontWeight: 700, color: 'var(--leaf)', fontSize: '1.05rem', lineHeight: 1.4 }}>₹{listing.price?.toLocaleString('en-IN')}/{listing.unit}</p>
                  </div>
                </div>

                <Link href={`/buyer/listing/${listing._id}`} className="btn-secondary" style={{ marginTop: 'auto', textAlign: 'center', width: '100%', display: 'block', padding: '0.9rem 1.5rem', fontSize: '1rem' }}>
                  View & Offer
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
