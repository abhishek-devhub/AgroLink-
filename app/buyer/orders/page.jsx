'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import StatusBadge from '@/components/StatusBadge/StatusBadge';

export default function BuyerOrders() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('active');
  const [paymentLoadingId, setPaymentLoadingId] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to dynamically load Razorpay script
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== 'buyer')) router.push('/login');
  }, [user, loading, router]);

  const fetchOrders = () => {
    if (!user) return;
    fetch(`/api/orders?buyerId=${user.id}`)
      .then(r => r.json())
      .then(setOrders)
      .catch(() => { });
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading || !user) return null;

  const tabFilter = (order) => {
    if (tab === 'active') return order.status === 'confirmed' || order.status === 'in_progress';
    if (tab === 'pending') return order.status === 'pending' || order.status === 'checkout_pending';
    if (tab === 'completed') return order.status === 'completed';
    return false;
  };

  const tabCount = (t) => {
    if (t === 'active') return orders.filter(o => o.status === 'confirmed' || o.status === 'in_progress').length;
    if (t === 'pending') return orders.filter(o => o.status === 'pending' || o.status === 'checkout_pending').length;
    if (t === 'completed') return orders.filter(o => o.status === 'completed').length;
    return 0;
  };

  // Apply search filter on top of tab filter
  const searchFilter = (order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.crop?.toLowerCase().includes(q) ||
      order.farmerName?.toLowerCase().includes(q) ||
      order.batchId?.toLowerCase().includes(q) ||
      order.shipmentId?.toLowerCase().includes(q) ||
      order.courierPartner?.toLowerCase().includes(q)
    );
  };

  const filtered = orders.filter(tabFilter).filter(searchFilter);

  const TAB_LABELS = {
    active: 'Active Deliveries',
    pending: 'Pending',
    completed: 'Completed',
  };

  const handlePayNow = async (order) => {
    setPaymentError(null);
    setPaymentLoadingId(order._id);
    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your connection.');
      }
      const res = await fetch('/api/payment/create-order-for-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id }),
      });
      const { success, data, error } = await res.json();
      if (!success) throw new Error(error);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: 'AgroLink',
        description: data.description,
        prefill: data.prefill,
        theme: { color: '#4A7C3F' },
        handler: async (response) => {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId:           data.orderId,
              paymentMethod:     response.razorpay_payment_method || null,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setPaymentLoadingId(null);
            fetchOrders();
          } else {
            setPaymentLoadingId(null);
            setPaymentError(verifyData.error || 'Payment verification failed');
          }
        },
        modal: { ondismiss: () => setPaymentLoadingId(null) },
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setPaymentError(response.error.description);
        setPaymentLoadingId(null);
      });
      rzp.open();
    } catch (err) {
      setPaymentError(err.message);
      setPaymentLoadingId(null);
    }
  };

  const getStatusLabel = (status, paymentStatus) => {
    if (status === 'pending') return 'Waiting for Farmer Approval';
    if (status === 'checkout_pending') return 'Awaiting Payment';
    if (status === 'confirmed') return 'Confirmed — In Processing';
    if (status === 'in_progress') return 'In Transit';
    if (status === 'completed') return 'Delivered';
    return status;
  };

  return (
    <div className="page-container">
      <h1 className="page-title">📦 Procurement Orders</h1>

      {/* Search bar */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="🔍 Search orders by crop, farmer, batch ID, courier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', maxWidth: '450px' }}
        />
      </div>

      <div className="tabs">
        {['active', 'pending', 'completed'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {TAB_LABELS[t]}
            <span style={{ marginLeft: '0.4rem', fontSize: '0.8rem', opacity: 0.6 }}>
              ({tabCount(t)})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--bark)' }}>
          {searchQuery ? `No results for "${searchQuery}"` : `No ${TAB_LABELS[tab].toLowerCase()} orders right now.`}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(order => {
            const totalAmount = order.totalAmount || (order.agreedPrice * order.quantity);
            return (
              <div key={order._id} className="card card-order">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--soil)' }}>{order.crop} supplied by {order.farmerName}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--bark)' }}>
                      📍 {order.farmerAddress ? `${order.farmerAddress}, ` : ''}{order.farmerDistrict}{order.farmerState ? `, ${order.farmerState}` : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <StatusBadge status={getStatusLabel(order.status, order.paymentStatus)} />
                    {order.paymentStatus === 'paid' ? (
                      <span style={{
                        background: '#d4edda', color: '#155724',
                        padding: '2px 10px', borderRadius: '12px',
                        fontSize: '0.75rem', fontWeight: 600,
                      }}>Paid</span>
                    ) : (
                      <StatusBadge status="Pending Payment" />
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: 'var(--bark)', marginBottom: '0.5rem', flexWrap: 'wrap', padding: '0.5rem 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
                  <span>Qty: <strong>{order.quantity}{order.unit === 'kg' ? 'kg' : 'q'}</strong></span>
                  <span>Price: <strong>₹{order.agreedPrice?.toLocaleString('en-IN')}/{order.unit === 'kg' ? 'kg' : 'q'}</strong></span>
                  <span>Total: <strong style={{ color: 'var(--leaf)' }}>₹{totalAmount.toLocaleString('en-IN')}</strong></span>
                </div>

                {/* Courier tracking badge */}
                {order.shipmentId && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
                    marginBottom: '0.75rem', marginTop: '0.5rem',
                  }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      background: 'rgba(39, 174, 96, 0.08)', padding: '0.35rem 0.7rem',
                      borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: '#27ae60',
                    }}>
                      🚚 {order.courierPartner}: <code style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{order.shipmentId}</code>
                    </span>
                    {order.courierTrackingUrl && (
                      <a
                        href={order.courierTrackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.78rem', color: 'var(--sky)', fontWeight: 600, textDecoration: 'none' }}
                      >
                        Track on {order.courierPartner} →
                      </a>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {tab === 'pending' && order.status === 'checkout_pending' && (
                    <button 
                      className="btn-primary" 
                      onClick={() => handlePayNow(order)}
                      disabled={paymentLoadingId === order._id}
                      style={{ fontSize: '0.85rem' }}
                    >
                      {paymentLoadingId === order._id ? 'Processing...' : '💳 Pay Now'}
                    </button>
                  )}
                  <Link href={`/buyer/track/${order._id}`} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                    🚚 Track Delivery
                  </Link>
                  {tab === 'completed' && order.paymentStatus === 'paid' && (
                    <Link href={`/buyer/rate/${order._id}`} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                      ⭐ Rate Farmer
                    </Link>
                  )}
                  {tab === 'completed' && order.paymentStatus === 'paid' && (
                    <Link href={`/buyer/invoice/${order._id}`} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                      🧾 View Invoice
                    </Link>
                  )}
                </div>
                {paymentError && paymentLoadingId === order._id && (
                  <div style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.5rem' }}>{paymentError}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
