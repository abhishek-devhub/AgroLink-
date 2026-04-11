'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import StatusBadge from '@/components/StatusBadge/StatusBadge';

export default function MyListings() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'farmer')) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/listings?farmerId=${user.id}`)
      .then(r => r.json())
      .then(setListings)
      .catch(() => { });
  }, [user]);

  if (loading || !user) return null;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>🌾 My Listings</h1>
        <Link href="/farmer/list-produce" className="btn-primary">+ New Listing</Link>
      </div>

      {listings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌱</p>
          <p style={{ color: 'var(--bark)' }}>You haven&apos;t listed any produce yet.</p>
          <Link href="/farmer/list-produce" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>List Your First Crop</Link>
        </div>
      ) : (
        <div className="grid-3">
          {listings.map(listing => (
            <Link key={listing._id} href={`/farmer/listing/${listing._id}`} style={{ textDecoration: 'none' }}>
              <div className="card card-produce">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--soil)' }}>{listing.crop}</h3>
                  <StatusBadge status={listing.status} />
                </div>
                {listing.variety && <p style={{ fontSize: '0.85rem', color: 'var(--bark)', marginBottom: '0.5rem' }}>Variety: {listing.variety}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--bark)', marginBottom: '0.25rem' }}>
                  <span>{listing.quantity} {listing.unit}</span>
                  <span style={{ fontWeight: 700, color: 'var(--leaf)' }}>₹{listing.price?.toLocaleString('en-IN')}/{listing.unit}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--bark)', marginTop: '0.5rem' }}>
                  Listed {new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {listing.bids?.length > 0 && ` · ${listing.bids.length} bid${listing.bids.length > 1 ? 's' : ''}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
