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

  useEffect(() => {
    if (!loading && (!user || user.role !== 'buyer')) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/orders/${params.orderId}`).then(r => r.json()).then(setOrder).catch(() => {});
  }, [user, params.orderId]);

  if (loading || !user || !order) return null;

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
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '1.5rem', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--soil)', marginBottom: '0.2rem' }}>Track Delivery</h1>
            <p style={{ color: 'var(--bark)', fontSize: '0.9rem' }}>OrderID: {order._id} • Batch: {order.batchId}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--soil)' }}>{order.crop} ({order.quantity}q)</p>
            <p style={{ color: 'var(--leaf)', fontWeight: 700 }}>₹{order.agreedPrice?.toLocaleString('en-IN')}/q</p>
          </div>
        </div>

        <div style={{ background: 'var(--mist)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--soil)', marginBottom: '0.2rem' }}>Supplier Details</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--bark)', fontWeight: 500 }}>{order.farmerName}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--bark)' }}>{order.farmerDistrict}</p>
        </div>

        <SupplyChainTracker 
          steps={order.supplyChainSteps} 
          readOnly={true} // Buyer only views tracking, farmer/logistics updates it
        />

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

        {order.supplyChainSteps[4].status === 'complete' && order.paymentStatus === 'pending' && (
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
