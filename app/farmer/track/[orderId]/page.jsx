'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import SupplyChainTracker from '@/components/SupplyChainTracker/SupplyChainTracker';
import { QRCodeSVG } from 'qrcode.react';

export default function FarmerTrackOrder() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [poolFarmers, setPoolFarmers] = useState(3);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'farmer')) router.push('/login');
  }, [user, loading, router]);

  const fetchOrder = () => {
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

  useEffect(() => { if (user) fetchOrder(); }, [user, params.orderId]);

  const handleAdvance = async (stepIndex) => {
    await fetch(`/api/orders/${params.orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ advanceStep: stepIndex }),
    });
    fetchOrder();
  };

  const handleSimulateTransit = async () => {
    if (!order) return;
    const transitStepIdx = 3;
    const deliveryStepIdx = 4;
    const steps = Array.isArray(order.supplyChainSteps) ? order.supplyChainSteps : [];
    if (steps[transitStepIdx]?.status === 'active') {
      await handleAdvance(transitStepIdx);
      setTimeout(() => handleAdvance(deliveryStepIdx), 3000);
    }
  };

  const handleCopyTraceLink = async () => {
    if (!order?.traceability?.traceLink) return;
    try {
      await navigator.clipboard.writeText(order.traceability.traceLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (loading || !user) return null;
  if (error) return <div className="page-container"><div className="card">{error}</div></div>;
  if (!order) return null;
  const steps = Array.isArray(order.supplyChainSteps) ? order.supplyChainSteps : [];
  const estimatedSoloFreight = Math.max(400, order.quantity * 40);
  const pooledFreight = Math.round(estimatedSoloFreight / Math.max(poolFarmers, 1));

  return (
    <div className="page-container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '1.5rem', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--soil)', marginBottom: '0.2rem' }}>Track Shipment</h1>
            <p style={{ color: 'var(--bark)', fontSize: '0.9rem' }}>OrderID: {order._id} • Batch: {order.batchId}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--soil)' }}>{order.crop} ({order.quantity}q)</p>
            <p style={{ color: 'var(--leaf)', fontWeight: 700 }}>₹{order.agreedPrice?.toLocaleString('en-IN')}/q</p>
          </div>
        </div>

        <div style={{ background: 'var(--mist)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--soil)', marginBottom: '0.2rem' }}>Buyer Details</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--bark)' }}>{order.buyerName}</p>
        </div>

        <SupplyChainTracker 
          steps={steps} 
          onAdvance={handleAdvance}
          readOnly={false} 
        />

        <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1rem' }}>
          <div style={{ border: '1px solid #e9ecef', borderRadius: '12px', padding: '1rem', background: 'linear-gradient(160deg, #ffffff 0%, #f8fff6 100%)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--soil)', fontSize: '1rem' }}>💹 Fair Price AI</h3>
            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--bark)', fontSize: '0.85rem' }}>
              Grade {order.fairPricing?.grade} with market benchmark ({order.fairPricing?.mandiMarket}).
            </p>
            <p style={{ margin: '0.3rem 0', fontSize: '0.9rem' }}>Recommended: <strong>₹{order.fairPricing?.recommended}/q</strong></p>
            <p style={{ margin: '0.3rem 0', fontSize: '0.9rem' }}>Fair range: ₹{order.fairPricing?.fairRange?.min} - ₹{order.fairPricing?.fairRange?.max}/q</p>
            <p style={{ margin: '0.3rem 0', fontSize: '0.9rem' }}>Deal score: <strong>{order.fairPricing?.dealScore}/100</strong> ({order.fairPricing?.verdict})</p>
          </div>

          <div style={{ border: '1px solid #e9ecef', borderRadius: '12px', padding: '1rem', background: 'linear-gradient(160deg, #ffffff 0%, #f4f9ff 100%)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--soil)', fontSize: '1rem' }}>📱 Shareable QR Proof</h3>
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
            <h3 style={{ marginTop: 0, color: 'var(--soil)', fontSize: '1rem' }}>🚚 Community Logistics Pooling</h3>
            <p style={{ color: 'var(--bark)', fontSize: '0.85rem' }}>
              Join nearby farmers to split transport and improve margins.
            </p>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.4rem' }}>Farmers in pool: {poolFarmers}</label>
            <input
              type="range"
              min="1"
              max="6"
              value={poolFarmers}
              onChange={(e) => setPoolFarmers(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
              Solo freight: <strong>₹{estimatedSoloFreight}</strong>
            </p>
            <p style={{ margin: '0.3rem 0', fontSize: '0.9rem', color: 'var(--leaf)' }}>
              Pooled freight estimate: <strong>₹{pooledFreight}</strong> (save ₹{estimatedSoloFreight - pooledFreight})
            </p>
          </div>
        </div>

        {steps[3]?.status === 'active' && (
          <div style={{ marginTop: '2rem', textAlign: 'center', background: '#e8f4fd', padding: '1.5rem', borderRadius: '12px' }}>
            <p style={{ marginBottom: '1rem', color: '#2980b9', fontSize: '0.9rem' }}>
              🚚 <em>Demo action: Simulate logistics partner updating the transit status.</em>
            </p>
            <button className="btn-secondary" onClick={handleSimulateTransit}>
              Simulate Transit & Delivery
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
