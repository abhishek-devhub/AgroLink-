'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import SupplyChainTracker from '@/components/SupplyChainTracker/SupplyChainTracker';
import { QRCodeSVG } from 'qrcode.react';

const COURIER_PARTNERS = [
  { id: 'Delhivery', label: '🚚 Delhivery', color: '#e74c3c' },
  { id: 'BlueDart', label: '📦 BlueDart', color: '#2980b9' },
  { id: 'DTDC', label: '📬 DTDC', color: '#8e44ad' },
  { id: 'India Post', label: '🏤 India Post', color: '#d35400' },
  { id: 'Ekart', label: '🛒 Ekart', color: '#27ae60' },
  { id: 'Professional Couriers', label: '📮 Professional Couriers', color: '#2c3e50' },
  { id: 'Other', label: '📋 Other', color: '#7f8c8d' },
];

export default function FarmerTrackOrder() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedShipment, setCopiedShipment] = useState(false);
  const [poolFarmers, setPoolFarmers] = useState(3);
  const [error, setError] = useState('');
  // Shipment form
  const [shipmentForm, setShipmentForm] = useState({ shipmentId: '', courierPartner: '' });
  const [shipmentSaving, setShipmentSaving] = useState(false);
  const [shipmentSaved, setShipmentSaved] = useState(false);

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
        // Pre-fill shipment form if already set
        if (data.shipmentId) setShipmentForm({ shipmentId: data.shipmentId, courierPartner: data.courierPartner || '' });
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

  const handleSaveShipment = async () => {
    if (!shipmentForm.shipmentId || !shipmentForm.courierPartner) return;
    setShipmentSaving(true);
    try {
      await fetch(`/api/orders/${params.orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: shipmentForm.shipmentId,
          courierPartner: shipmentForm.courierPartner,
        }),
      });
      setShipmentSaved(true);
      setTimeout(() => setShipmentSaved(false), 3000);
      fetchOrder();
    } catch {
    } finally {
      setShipmentSaving(false);
    }
  };

  const handleCopyShipmentInfo = async () => {
    if (!order) return;
    const text = `🚚 AgroLink Shipment Info\nOrder: ${order.batchId}\nCourier: ${order.courierPartner || shipmentForm.courierPartner}\nTracking ID: ${order.shipmentId || shipmentForm.shipmentId}\n${order.courierTrackingUrl ? `Track: ${order.courierTrackingUrl}` : ''}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedShipment(true);
      setTimeout(() => setCopiedShipment(false), 2000);
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '1.5rem', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--soil)', marginBottom: '0.2rem' }}>📦 Track Shipment</h1>
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
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--leaf)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>📍 Pickup (You)</div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--soil)', margin: 0 }}>{user.name}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--bark)', margin: '0.15rem 0' }}>
                {order.farmerAddress || user.address || ''}{order.farmerAddress || user.address ? ', ' : ''}
                {user.village || ''}{user.village ? ', ' : ''}{order.farmerDistrict || user.district}, {order.farmerState || user.state}
              </p>
              {(order.farmerPincode || user.pincode) && <p style={{ fontSize: '0.8rem', color: 'var(--bark)', margin: 0 }}>PIN: {order.farmerPincode || user.pincode}</p>}
            </div>
            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--harvest)', padding: '0 0.5rem' }}>→</div>
            {/* Destination */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sky)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>📍 Delivery (Buyer)</div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--soil)', margin: 0 }}>{order.buyerName}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--bark)', margin: '0.15rem 0' }}>
                {order.buyerAddress || ''}{order.buyerAddress ? ', ' : ''}
                {order.buyerCity || ''}{order.buyerCity ? ', ' : ''}{order.buyerState || ''}
              </p>
              {order.buyerPincode && <p style={{ fontSize: '0.8rem', color: 'var(--bark)', margin: 0 }}>PIN: {order.buyerPincode}</p>}
            </div>
          </div>
        </div>

        {/* Supply Chain Tracker */}
        <SupplyChainTracker 
          steps={steps} 
          onAdvance={handleAdvance}
          readOnly={false} 
        />

        {/* Shipment ID Section — visible after packing step */}
        <div style={{
          marginTop: '2rem',
          border: '1.5px solid rgba(123, 175, 212, 0.3)',
          borderRadius: '14px',
          padding: '1.5rem',
          background: 'linear-gradient(160deg, #ffffff 0%, #f0f7ff 100%)',
        }}>
          <h3 style={{ marginTop: 0, color: 'var(--soil)', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            🚚 Courier / Shipment Tracking
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--bark)', marginBottom: '1rem' }}>
            Enter your courier tracking ID so the buyer can track the delivery on the courier's website.
          </p>

          {order.shipmentId ? (
            /* Already saved — show read-only with copy */
            <div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div style={{ flex: 1, minWidth: '150px', background: 'rgba(74, 124, 63, 0.06)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--bark)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Courier Partner</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--soil)' }}>{order.courierPartner || 'N/A'}</div>
                </div>
                <div style={{ flex: 2, minWidth: '200px', background: 'rgba(74, 124, 63, 0.06)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--bark)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Tracking ID</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--soil)', fontFamily: 'monospace' }}>{order.shipmentId}</div>
                </div>
              </div>
              {order.courierTrackingUrl && (
                <a href={order.courierTrackingUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: '0.85rem', marginRight: '0.5rem' }}>
                  🔗 Open Tracking Page
                </a>
              )}
              <button className="btn-secondary" style={{ fontSize: '0.85rem' }} onClick={handleCopyShipmentInfo}>
                {copiedShipment ? '✅ Copied!' : '📋 Share with Buyer'}
              </button>
              <button className="btn-secondary" style={{ fontSize: '0.85rem', marginLeft: '0.5rem' }} onClick={() => { setShipmentForm({ shipmentId: '', courierPartner: '' }); /* Allow re-edit by clearing the saved state triggering the else branch */ }}>
                ✏️ Update
              </button>
            </div>
          ) : (
            /* Entry form */
            <div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem' }}>Courier Partner</label>
                  <select value={shipmentForm.courierPartner} onChange={(e) => setShipmentForm(p => ({ ...p, courierPartner: e.target.value }))}>
                    <option value="">Select courier</option>
                    {COURIER_PARTNERS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 2, minWidth: '200px', marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem' }}>Tracking / AWB Number</label>
                  <input
                    value={shipmentForm.shipmentId}
                    onChange={(e) => setShipmentForm(p => ({ ...p, shipmentId: e.target.value }))}
                    placeholder="e.g. 12345678901234"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={handleSaveShipment}
                disabled={!shipmentForm.shipmentId || !shipmentForm.courierPartner || shipmentSaving}
                style={{ fontSize: '0.9rem', opacity: (!shipmentForm.shipmentId || !shipmentForm.courierPartner) ? 0.5 : 1 }}
              >
                {shipmentSaving ? '⏳ Saving...' : shipmentSaved ? '✅ Saved!' : '💾 Save & Share with Buyer'}
              </button>
            </div>
          )}
        </div>

        {/* Existing info cards */}
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
