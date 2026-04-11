'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ActivityFeed from '@/components/ActivityFeed/ActivityFeed';
import MandiTicker from '@/components/MandiTicker/MandiTicker';
import GovtAnnouncements from '@/components/GovtAnnouncements/GovtAnnouncements';
import styles from '../../dashboard.module.css';

export default function BuyerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ active: 0, pending: 0, completed: 0, spent: 0 });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'buyer')) router.push('/login');
  }, [user, loading, router]);

  const fetchStats = () => {
    if (!user) return;
    fetch(`/api/buyer/stats?buyerId=${user.id}`)
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {});
  };

  const fetchRecentOrders = () => {
    if (!user) return;
    fetch(`/api/orders?buyerId=${user.id}`)
      .then(r => r.json())
      .then(data => setRecentOrders(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
    const statsInterval = setInterval(fetchStats, 60000);
    const ordersInterval = setInterval(fetchRecentOrders, 30000);
    return () => {
      clearInterval(statsInterval);
      clearInterval(ordersInterval);
    };
  }, [user]);

  if (loading || !user) return null;

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const getStatusStyle = (status) => {
    if (status === 'confirmed') return { bg: 'var(--harvest)', color: '#fff', label: 'CONFIRMED' };
    if (status === 'in_progress') return { bg: 'var(--sky)', color: '#fff', label: 'IN TRANSIT' };
    if (status === 'completed') return { bg: 'var(--leaf)', color: '#fff', label: 'DELIVERED' };
    if (status === 'checkout_pending') return { bg: '#fff3cd', color: '#856404', label: 'PAYMENT DUE' };
    return { bg: 'var(--mist)', color: 'var(--soil)', label: status?.toUpperCase().replace('_', ' ') };
  };

  return (
    <div className={styles.dashWrap}>
      <div className="page-container" style={{ paddingTop: '3rem' }}>
        {/* Welcome Banner */}
        <div className={styles.welcome}>
          <h1>{greeting}, {user.ownerName} 🏪</h1>
          <p>{user.businessName} • {today}</p>
          {user.address && (
            <p style={{ opacity: 0.7, fontSize: '0.85rem', marginTop: '0.25rem' }}>
              📍 {user.city}, {user.state} {user.pincode && `- ${user.pincode}`}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid-4">
          <div className="stat-card">
            <h3>{stats.activeOrders}</h3>
            <p>Active Deliveries</p>
          </div>
          <div className="stat-card">
            <h3>{stats.pendingDelivery}</h3>
            <p>Pending Orders</p>
          </div>
          <div className="stat-card">
            <h3>{stats.completed}</h3>
            <p>Completed Purchases</p>
          </div>
          <div className="stat-card">
            <h3>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.totalSpent)}</h3>
            <p>Total Spent</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <Link href="/buyer/browse" className="btn-primary">🛒 Browse Produce</Link>
          <Link href="/buyer/orders" className="btn-secondary">📦 My Orders</Link>
          <Link href="/buyer/market-prices" className="btn-secondary">📊 Market Prices</Link>
          <Link href="/community" className="btn-secondary">🌾 Community Hub</Link>
        </div>

        {/* Live Mandi Ticker */}
        <MandiTicker />

        {/* Recent Orders Preview */}
        <h3 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--bark)' }}>
            No orders yet. Browse produce to place your first order!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentOrders.map((order) => {
              const statusStyle = getStatusStyle(order.status);
              const totalAmount = order.totalAmount || (order.quantity * order.agreedPrice);
              return (
                <div key={order._id} className="card card-order" style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--soil)' }}>{order.crop} — {order.farmerName}</h4>
                      <p style={{ margin: '0.2rem 0', fontSize: '0.82rem', color: 'var(--bark)' }}>
                        {order.quantity}q · ₹{order.agreedPrice}/q · Total: <strong style={{ color: 'var(--leaf)' }}>₹{totalAmount.toLocaleString('en-IN')}</strong>
                      </p>
                      {order.shipmentId && (
                        <p style={{ margin: '0.2rem 0', fontSize: '0.78rem', color: 'var(--sky)', fontWeight: 600 }}>
                          🚚 {order.courierPartner}: {order.shipmentId}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}>{statusStyle.label}</span>
                      <Link href={`/buyer/track/${order._id}`} style={{ fontSize: '0.8rem', color: 'var(--leaf)', fontWeight: 600, textDecoration: 'none' }}>
                        Track →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: '0.75rem', marginBottom: '2rem' }}>
          <Link href="/buyer/orders" style={{ color: 'var(--leaf)', fontSize: '14px', textDecoration: 'none', fontWeight: 600 }}>View all orders →</Link>
        </div>

        {/* Activity Feed */}
        <h3 className={styles.sectionTitle}>Recent Activity</h3>
        <ActivityFeed userId={user.id} role={user.role} limit={10} />

        {/* Government Announcements */}
        <GovtAnnouncements condensed />
      </div>
    </div>
  );
}
