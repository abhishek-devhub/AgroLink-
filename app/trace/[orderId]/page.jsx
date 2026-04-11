'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SupplyChainTracker from '@/components/SupplyChainTracker/SupplyChainTracker';
import JourneyMap from '@/components/JourneyMap/JourneyMap';

export default function PublicTracePage() {
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/orders/${params.orderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) {
          setError(data.error);
          setOrder(null);
          return;
        }
        setError('');
        setOrder(data);
      })
      .catch(() => setError('Unable to load trace details.'));
  }, [params.orderId]);

  if (error) return <div className="page-container"><div className="card">{error}</div></div>;
  if (!order) return null;
  const steps = Array.isArray(order.supplyChainSteps) ? order.supplyChainSteps : [];

  return (
    <div className="page-container">
      <div className="card">
        <h1 style={{ fontSize: '1.5rem', color: 'var(--soil)', marginBottom: '0.75rem' }}>
          🔎 Public Produce Traceability
        </h1>
        <p style={{ color: 'var(--bark)', marginBottom: '1rem' }}>
          Batch {order.batchId} • {order.crop} • {order.quantity}
          {order.unit === 'kg' ? 'kg' : 'q'}
        </p>

        {/* Route info with addresses */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(74, 124, 63, 0.06) 0%, rgba(123, 175, 212, 0.06) 100%)',
          border: '1px solid rgba(74, 124, 63, 0.12)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--leaf)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>📍 Origin</div>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--soil)' }}>{order.farmerName}</p>
              <p style={{ margin: '0.1rem 0', fontSize: '0.82rem', color: 'var(--bark)' }}>
                {order.farmerDistrict}{order.farmerState ? `, ${order.farmerState}` : ''}
              </p>
            </div>
            <div style={{ fontSize: '1.3rem', color: 'var(--harvest)' }}>→</div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sky)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>📍 Destination</div>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--soil)' }}>{order.buyerName}</p>
              <p style={{ margin: '0.1rem 0', fontSize: '0.82rem', color: 'var(--bark)' }}>
                {order.buyerCity}{order.buyerState ? `, ${order.buyerState}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Courier info if available */}
        {order.shipmentId && (
          <div style={{
            background: 'rgba(39, 174, 96, 0.06)',
            border: '1px solid rgba(39, 174, 96, 0.15)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--bark)' }}>
              🚚 <strong>{order.courierPartner}</strong> — Tracking: <code style={{ background: 'rgba(0,0,0,0.04)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.85rem' }}>{order.shipmentId}</code>
            </span>
            {order.courierTrackingUrl && (
              <a href={order.courierTrackingUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                Track on {order.courierPartner}
              </a>
            )}
          </div>
        )}

        {/* Interactive Journey Map — fixed: pass buyerCity instead of buyerName */}
        <JourneyMap
          steps={steps}
          harvestDate={order.createdAt}
          orderId={order._id}
          farmerDistrict={order.farmerDistrict}
          buyerDistrict={order.buyerCity || order.buyerName}
        />

        {/* Detailed Supply Chain Steps */}
        <h3 style={{ fontSize: '1.1rem', color: 'var(--soil)', marginBottom: '1rem', marginTop: '0.5rem' }}>📋 Detailed Timeline</h3>
        <SupplyChainTracker steps={steps} readOnly />
      </div>
    </div>
  );
}
