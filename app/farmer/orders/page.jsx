'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import StatusBadge from '@/components/StatusBadge/StatusBadge';

export default function FarmerOrders() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('pending');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'farmer')) router.push('/login');
  }, [user, loading, router]);

  const fetchOrders = () => {
    if (!user) return;
    fetch(`/api/orders?farmerId=${user.id}`)
      .then(r => r.json())
      .then(setOrders)
      .catch(() => {});
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkPacked = async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;
    const nextStep = order.supplyChainSteps.findIndex(s => s.status === 'pending' || s.status === 'active');
    if (nextStep >= 0) {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advanceStep: nextStep }),
      });
      fetchOrders();
    }
  };

  if (loading || !user) return null;

  // Tab grouping:
  // "Pending" = confirmed (paid, awaiting farmer action) + payment_pending
  // "In Progress" = in_progress (packed/in transit)
  // "Completed" = completed (delivered)
  const tabFilter = (order) => {
    if (tab === 'pending')     return order.status === 'confirmed' || order.status === 'pending';
    if (tab === 'in_progress') return order.status === 'in_progress';
    if (tab === 'completed')   return order.status === 'completed';
    return false;
  };

  const tabCount = (t) => {
    if (t === 'pending')     return orders.filter(o => o.status === 'confirmed' || o.status === 'pending').length;
    if (t === 'in_progress') return orders.filter(o => o.status === 'in_progress').length;
    if (t === 'completed')   return orders.filter(o => o.status === 'completed').length;
    return 0;
  };

  const filtered = orders.filter(tabFilter);

  const getStatusLabel = (status) => {
    if (status === 'confirmed') return 'Paid — Awaiting Dispatch';
    if (status === 'payment_pending') return 'Awaiting Payment';
    return status;
  };

  return (
    <div className="page-container">
      <h1 className="page-title">📦 My Orders</h1>

      <div className="tabs">
        {['pending', 'in_progress', 'completed'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'in_progress' ? 'In Progress' : t.charAt(0).toUpperCase() + t.slice(1)}
            <span style={{ marginLeft: '0.4rem', fontSize: '0.8rem', opacity: 0.6 }}>
              ({tabCount(t)})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--bark)' }}>
          No {tab.replace('_', ' ')} orders right now.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(order => {
            const totalAmount = order.totalAmount || (order.quantity * order.agreedPrice);
            return (
              <div key={order._id} className="card card-order">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--soil)' }}>{order.crop}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--bark)' }}>Buyer: {order.buyerName}</p>
                    {(order.buyerCity || order.buyerAddress) && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--bark)', opacity: 0.7, marginTop: '0.15rem' }}>
                        📍 {order.buyerAddress ? `${order.buyerAddress}, ` : ''}{order.buyerCity}{order.buyerState ? `, ${order.buyerState}` : ''} {order.buyerPincode && `- ${order.buyerPincode}`}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <StatusBadge status={getStatusLabel(order.status)} />
                    {order.paymentStatus === 'paid' && (
                      <span style={{
                        background: '#d4edda', color: '#155724',
                        padding: '2px 10px', borderRadius: '12px',
                        fontSize: '0.75rem', fontWeight: 600,
                      }}>
                        ₹{totalAmount.toLocaleString('en-IN')} Paid
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: 'var(--bark)', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span>Qty: <strong>{order.quantity}{order.unit === 'kg' ? 'kg' : 'q'}</strong></span>
                  <span>Price: <strong>₹{order.agreedPrice?.toLocaleString('en-IN')}/{order.unit === 'kg' ? 'kg' : 'q'}</strong></span>
                  <span>Total: <strong style={{ color: 'var(--leaf)' }}>₹{totalAmount.toLocaleString('en-IN')}</strong></span>
                  <span>Date: {new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                </div>

                {/* Shipment badge */}
                {order.shipmentId && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: 'rgba(123, 175, 212, 0.1)', padding: '0.3rem 0.7rem',
                    borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
                    color: 'var(--sky)', marginBottom: '0.75rem',
                  }}>
                    🚚 {order.courierPartner}: <code style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{order.shipmentId}</code>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {tab === 'pending' && order.status === 'confirmed' && (
                    <button className="btn-primary" onClick={() => handleMarkPacked(order._id)} style={{ fontSize: '0.85rem' }}>
                      📦 Mark as Packed & Ready
                    </button>
                  )}
                  <Link href={`/farmer/track/${order._id}`} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                    🔍 Track Shipment
                  </Link>
                  {tab === 'completed' && (
                    <Link href={`/farmer/rate/${order._id}`} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                      ⭐ Rate Buyer
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
