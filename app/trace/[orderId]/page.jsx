'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SupplyChainTracker from '@/components/SupplyChainTracker/SupplyChainTracker';

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

        <div style={{ background: 'var(--mist)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--bark)' }}>
            Supplier: <strong>{order.farmerName}</strong> • Buyer: <strong>{order.buyerName}</strong>
          </p>
        </div>

        <SupplyChainTracker steps={steps} readOnly />
      </div>
    </div>
  );
}
