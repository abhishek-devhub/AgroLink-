'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import MandiTicker from '@/components/MandiTicker/MandiTicker';
import ActivityFeed from '@/components/ActivityFeed/ActivityFeed';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import GovtAnnouncements from '@/components/GovtAnnouncements/GovtAnnouncements';
import styles from '../../dashboard.module.css';

export default function FarmerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ activeListings: 0, pendingOrders: 0, completedSales: 0, totalEarnings: 0 });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'farmer')) router.push('/login');
  }, [user, loading, router]);

  const fetchData = () => {
    if (!user) return;
    fetch(`/api/farmer/stats?farmerId=${user.id}`)
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {});
  };

  const fetchRecentOrders = () => {
    if (!user) return;
    fetch(`/api/orders/recent?farmerId=${user.id}`)
      .then(r => r.json())
      .then(res => setRecentOrders(res.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
    fetchRecentOrders();
    const statsInterval = setInterval(fetchData, 60000);
    const ordersInterval = setInterval(fetchRecentOrders, 30000);
    return () => {
      clearInterval(statsInterval);
      clearInterval(ordersInterval);
    };
  }, [user]);

  const getNextStepName = (order) => {
    const nextStep = order.supplyChainSteps?.find(s => s.status === 'active' || s.status === 'pending');
    if (!nextStep) return null;
    const BUTTON_LABELS = {
      'Quality Checked': 'Mark Quality Checked',
      'Packed & Loaded': 'Mark Packed',
      'In Transit': 'Mark In Transit',
      'Delivered': 'Mark Delivered',
    };
    return BUTTON_LABELS[nextStep.label] || null;
  };

  if (loading || !user) return null;

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className={styles.dashWrap}>
      <div className="page-container">
        {/* Welcome Banner */}
        <div className={styles.welcome}>
          <h1>{greeting}, {user.name} 🌾</h1>
          <p>{today}</p>
          {(user.village || user.district) && (
            <p style={{ opacity: 0.7, fontSize: '0.85rem', marginTop: '0.25rem' }}>
              📍 {user.village}{user.village ? ', ' : ''}{user.district}, {user.state} {user.pincode && `- ${user.pincode}`}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid-4">
          <div className="stat-card">
            <h3>{stats.activeListings}</h3>
            <p>Active Listings</p>
          </div>
          <div className="stat-card">
            <h3>{stats.pendingOrders}</h3>
            <p>Pending Orders</p>
          </div>
          <div className="stat-card">
            <h3>{stats.completedSales}</h3>
            <p>Completed Sales</p>
          </div>
          <div className="stat-card">
            <h3>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.totalEarnings)}</h3>
            <p>Total Earnings</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <Link href="/farmer/list-produce" className="btn-primary">+ List New Produce</Link>
          <Link href="/farmer/orders" className="btn-secondary">View Orders</Link>
          <Link href="/farmer/my-listings" className="btn-secondary">My Listings</Link>
          <Link href="/farmer/skills" className="btn-secondary">Browse Skill Courses</Link>
        </div>

        {/* Mandi Ticker */}
        <MandiTicker />

        {/* Smart Tools */}
        <h3 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>🚀 Smart Tools</h3>
        <div className="grid-3">
          <Link href="/farmer/trust-score" className="card" style={{ textDecoration: 'none', textAlign: 'center', cursor: 'pointer', borderLeft: '4px solid var(--harvest)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⭐</div>
            <h4 style={{ color: 'var(--soil)', marginBottom: '0.3rem', fontSize: '1rem' }}>Trust Score</h4>
            <p style={{ color: 'var(--bark)', fontSize: '0.82rem' }}>Your reputation credit profile</p>
          </Link>
          <Link href="/farmer/smart-pricing" className="card" style={{ textDecoration: 'none', textAlign: 'center', cursor: 'pointer', borderLeft: '4px solid var(--sky)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌦️</div>
            <h4 style={{ color: 'var(--soil)', marginBottom: '0.3rem', fontSize: '1rem' }}>Smart Pricing</h4>
            <p style={{ color: 'var(--bark)', fontSize: '0.82rem' }}>Live weather-aware price insights</p>
          </Link>
          <Link href="/community" className="card" style={{ textDecoration: 'none', textAlign: 'center', cursor: 'pointer', borderLeft: '4px solid #9C27B0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌾</div>
            <h4 style={{ color: 'var(--soil)', marginBottom: '0.3rem', fontSize: '1rem' }}>Community Hub</h4>
            <p style={{ color: 'var(--bark)', fontSize: '0.82rem' }}>Share tips, ask questions</p>
          </Link>
        </div>

        {/* Recent Orders */}
        <h3 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--bark)' }}>
            No orders yet. Once a buyer confirms your produce, orders will appear here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentOrders.map((order) => {
              const nextButtonLabel = getNextStepName(order);
              const totalAmount = order.totalAmount || (order.quantity * order.agreedPrice);
              
              const isConfirmed = order.status === 'confirmed';
              const isInProgress = order.status === 'in_progress';
              const isCompleted = order.status === 'completed';
              const isPaymentPending = order.status === 'payment_pending';
              
              let badgeColor = 'var(--mist)';
              let textColor = 'var(--soil)';
              let badgeLabel = order.status.toUpperCase().replace('_', ' ');
              if (isPaymentPending) { badgeColor = '#fff3cd'; textColor = '#856404'; badgeLabel = 'AWAITING PAYMENT'; }
              if (isConfirmed)      { badgeColor = 'var(--harvest)'; textColor = '#fff'; badgeLabel = 'PAID — PENDING'; }
              if (isInProgress)     { badgeColor = 'var(--sky)'; textColor = '#fff'; badgeLabel = 'IN PROGRESS'; }
              if (isCompleted)      { badgeColor = 'var(--leaf)'; textColor = '#fff'; badgeLabel = 'COMPLETED'; }

              return (
                <div key={order._id} className="card card-order" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--bark)' }}>{order.batchId || order._id}</div>
                    <div style={{ padding: '4px 8px', borderRadius: '4px', background: badgeColor, color: textColor, fontSize: '0.75rem', fontWeight: 600 }}>
                      {badgeLabel}
                    </div>
                  </div>
                  
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--soil)', marginBottom: '0.2rem' }}>{order.crop} — {order.variety || ''}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--bark)', marginBottom: '0.25rem' }}>Buyer: {order.buyerName}</p>
                  {order.buyerCity && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--bark)', marginBottom: '0.75rem', opacity: 0.7 }}>
                      📍 {order.buyerCity}{order.buyerState ? `, ${order.buyerState}` : ''}
                    </p>
                  )}
                  
                  {/* Shipment badge */}
                  {order.shipmentId && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--sky)', fontWeight: 600, marginBottom: '0.75rem' }}>
                      🚚 {order.courierPartner}: {order.shipmentId}
                    </p>
                  )}
                  
                  <p style={{ fontSize: '0.9rem', color: 'var(--bark)', marginBottom: '1.5rem', fontWeight: 500 }}>
                    {order.quantity} quintal &middot; ₹{order.agreedPrice}/q &middot; Total: <span style={{ color: 'var(--leaf)' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0', position: 'relative', marginBottom: '1.5rem', padding: '0 10px' }}>
                    {order.supplyChainSteps?.map((step, idx) => {
                      const isComplete = step.status === 'complete';
                      const isActive = step.status === 'active';
                      const isPending = step.status === 'pending';
                      
                      const circleColor = isComplete ? 'var(--leaf)' : (isActive ? 'var(--harvest)' : 'transparent');
                      const borderCol = isPending ? 'solid 2px var(--bark)' : 'none';
                      const pulseClass = isActive ? 'pulse-anim' : '';

                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', flex: idx < 4 ? 1 : 0 }}>
                          <div style={{ position: 'relative' }}>
                            <div className={pulseClass} style={{
                              width: '14px', height: '14px', borderRadius: '50%',
                              background: circleColor,
                              border: borderCol,
                              zIndex: 2, position: 'relative'
                            }}></div>
                            {(idx === 0 || idx === 4) && (
                              <div style={{ position: 'absolute', top: '18px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem', color: 'var(--bark)', whiteSpace: 'nowrap' }}>
                                {step.label}
                              </div>
                            )}
                          </div>
                          {idx < 4 && (
                            <div style={{ height: '2px', background: isComplete ? 'var(--leaf)' : 'var(--mist)', flex: 1 }}></div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--mist)' }}>
                    {nextButtonLabel ? (
                      <Link href={`/farmer/track/${order._id}`} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                        {nextButtonLabel}
                      </Link>
                    ) : (
                      <div style={{ color: 'var(--leaf)', fontWeight: 600, fontSize: '0.9rem' }}>Completed ✓</div>
                    )}
                    <Link href={`/farmer/track/${order._id}`} className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'transparent' }}>
                      View Full Track →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '2rem' }}>
          <Link href="/farmer/orders" style={{ color: 'var(--leaf)', fontSize: '14px', textDecoration: 'none', fontWeight: 600 }}>View all orders →</Link>
        </div>

        <h3 className={styles.sectionTitle}>Recent Activity</h3>
        <ActivityFeed userId={user.id} role={user.role} limit={10} />

        {/* Government Announcements — condensed view */}
        <GovtAnnouncements condensed />
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse-dot { 0% { box-shadow: 0 0 0 0 rgba(230, 161, 92, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(230, 161, 92, 0); } 100% { box-shadow: 0 0 0 0 rgba(230, 161, 92, 0); } }
          .pulse-anim { animation: pulse-dot 2s infinite; }
        `}} />
      </div>
    </div>
  );
}
