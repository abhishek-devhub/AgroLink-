'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import SupplyChainTracker from '@/components/SupplyChainTracker/SupplyChainTracker';
import { QRCodeSVG } from 'qrcode.react';

export default function BuyerTrackOrder() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'buyer')) router.push('/login');
  }, [user, loading, router]);

  const fetchOrder = () => {
    if (!user) return;
    fetch(`/api/orders/${params.orderId}`)
      .then(r => r.json())
      .then((data) => {
        if (data?.error) {
          setError(data.error);
          setOrder(null);
          return;
        }
        setError('');
        setOrder(data);
      })
      .catch(() => setError('Unable to load order details.'));
  };

  useEffect(() => {
    fetchOrder();
    // Auto-refresh every 30s for live tracking updates
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [user, params.orderId]);

  if (loading || !user) return null;
  if (error) return <div className="page-container"><div className="card">{error}</div></div>;
  if (!order) return null;
  const steps = Array.isArray(order.supplyChainSteps) ? order.supplyChainSteps : [];

  const handleCopyTraceLink = async () => {
    if (!order?.traceability?.traceLink) return;
    try {
      await navigator.clipboard.writeText(order.traceability.traceLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };


  return (
    <div className="page-container">
      <div className="card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '1.5rem', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--soil)', marginBottom: '0.2rem' }}>🚚 Track Delivery</h1>
            <p style={{ color: 'var(--bark)', fontSize: '0.9rem' }}>OrderID: {order._id} • Batch: {order.batchId}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--soil)' }}>{order.crop} ({order.quantity}q)</p>
            <p style={{ color: 'var(--leaf)', fontWeight: 700 }}>₹{order.agreedPrice?.toLocaleString('en-IN')}/q</p>
          </div>
        </div>

        {/* Route Info — Farmer → Buyer */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(74, 124, 63, 0.06) 0%, rgba(123, 175, 212, 0.06) 100%)',
          border: '1px solid rgba(74, 124, 63, 0.12)',
          padding: '1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Origin */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--leaf)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>📍 Origin (Farmer)</div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--soil)', margin: 0 }}>{order.farmerName}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--bark)', margin: '0.15rem 0' }}>
                {order.farmerAddress && `${order.farmerAddress}, `}
                {order.farmerDistrict}{order.farmerState ? `, ${order.farmerState}` : ''}
              </p>
              {order.farmerPincode && <p style={{ fontSize: '0.8rem', color: 'var(--bark)', margin: 0 }}>PIN: {order.farmerPincode}</p>}
            </div>
            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--harvest)', padding: '0 0.5rem' }}>→</div>
            {/* Destination */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sky)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>📍 Delivery (You)</div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--soil)', margin: 0 }}>{order.buyerName}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--bark)', margin: '0.15rem 0' }}>
                {order.buyerAddress && `${order.buyerAddress}, `}
                {order.buyerCity}{order.buyerState ? `, ${order.buyerState}` : ''}
              </p>
              {order.buyerPincode && <p style={{ fontSize: '0.8rem', color: 'var(--bark)', margin: 0 }}>PIN: {order.buyerPincode}</p>}
            </div>
          </div>
        </div>

        {/* Courier Tracking Section */}
        {order.shipmentId && (
          <div style={{
            border: '1.5px solid rgba(39, 174, 96, 0.3)',
            borderRadius: '14px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            background: 'linear-gradient(160deg, #ffffff 0%, #f0fff4 100%)',
          }}>
            <h3 style={{ marginTop: 0, color: 'var(--soil)', fontSize: '1.05rem', marginBottom: '0.75rem' }}>
              📦 Courier Tracking
            </h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ flex: 1, minWidth: '140px', background: 'rgba(74, 124, 63, 0.06)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--bark)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Courier Partner</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--soil)' }}>{order.courierPartner}</div>
              </div>
              <div style={{ flex: 2, minWidth: '200px', background: 'rgba(74, 124, 63, 0.06)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--bark)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Tracking ID</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--soil)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{order.shipmentId}</div>
              </div>
            </div>
            {order.courierTrackingUrl && (
              <a
                href={order.courierTrackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ fontSize: '0.9rem', display: 'inline-flex', gap: '0.4rem' }}
              >
                🔗 Track on {order.courierPartner}
              </a>
            )}
            {!order.courierTrackingUrl && order.courierPartner === 'Other' && (
              <p style={{ fontSize: '0.85rem', color: 'var(--bark)', fontStyle: 'italic' }}>
                Contact the farmer for courier tracking details.
              </p>
            )}
          </div>
        )}

        {/* No shipment ID yet */}
        {!order.shipmentId && (steps[2]?.status === 'complete' || steps[3]?.status === 'active' || steps[3]?.status === 'complete') && (
          <div style={{
            border: '1.5px dashed rgba(212, 140, 45, 0.4)',
            borderRadius: '14px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            background: 'rgba(212, 140, 45, 0.04)',
            textAlign: 'center',
          }}>
            <p style={{ color: 'var(--bark)', fontSize: '0.9rem', margin: 0 }}>
              ⏳ Waiting for farmer to add courier tracking details...
            </p>
          </div>
        )}

        {/* Supply Chain Tracker */}
        <SupplyChainTracker 
          steps={steps} 
          readOnly={true}
        />

        {/* Info Cards */}
        <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1rem' }}>
          <div style={{ border: '1px solid #e9ecef', borderRadius: '12px', padding: '1rem', background: 'linear-gradient(160deg, #ffffff 0%, #f8fff6 100%)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--soil)', fontSize: '1rem' }}>💹 Fair Price AI</h3>
            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--bark)', fontSize: '0.85rem' }}>
              Based on mandi benchmark ({order.fairPricing?.mandiMarket}).
            </p>
            <p style={{ margin: '0.3rem 0', fontSize: '0.9rem' }}>Recommended: <strong>₹{order.fairPricing?.recommended}/q</strong></p>
            <p style={{ margin: '0.3rem 0', fontSize: '0.9rem' }}>Fair range: ₹{order.fairPricing?.fairRange?.min} - ₹{order.fairPricing?.fairRange?.max}/q</p>
            <p style={{ margin: '0.3rem 0', fontSize: '0.9rem' }}>Deal score: <strong>{order.fairPricing?.dealScore}/100</strong> ({order.fairPricing?.verdict})</p>
          </div>

          <div style={{ border: '1px solid #e9ecef', borderRadius: '12px', padding: '1rem', background: 'linear-gradient(160deg, #ffffff 0%, #f4f9ff 100%)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--soil)', fontSize: '1rem' }}>📱 QR Traceability</h3>
            {order.traceability?.traceLink && <QRCodeSVG value={order.traceability.traceLink} size={120} includeMargin />}
            <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a href={order.traceability?.traceLink} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                Open public trace
              </a>
              <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={handleCopyTraceLink}>
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>

          <div style={{ border: '1px solid #e9ecef', borderRadius: '12px', padding: '1rem', background: 'linear-gradient(160deg, #ffffff 0%, #fffaf3 100%)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--soil)', fontSize: '1rem' }}>🛡️ Farmer Trust Profile</h3>
            <p style={{ margin: '0.2rem 0', fontSize: '1.4rem', color: 'var(--leaf)', fontWeight: 700 }}>
              {order.trustProfile?.score || 0}/100
            </p>
            <p style={{ margin: '0.2rem 0 0.6rem 0', fontSize: '0.85rem', color: 'var(--bark)' }}>
              Composite score from quality grade, fulfillment progress and delivery reliability.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {(order.trustProfile?.badges || []).map((badge) => (
                <span
                  key={badge}
                  style={{ background: 'rgba(212, 140, 45, 0.15)', color: 'var(--soil)', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {steps[4]?.status === 'complete' && order.paymentStatus === 'pending' && (
          <div style={{ marginTop: '2.5rem', textAlign: 'center', background: 'rgba(212, 140, 45, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px dashed var(--harvest)' }}>
            <p style={{ marginBottom: '1rem', color: 'var(--soil)' }}>
              🚚 <strong>Delivery Complete!</strong> Please inspect the produce and release payment to the farmer.
            </p>
            <button className="btn-primary" onClick={() => router.push('/buyer/orders')} style={{ background: 'var(--harvest)' }}>
              Go to Orders to Pay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
