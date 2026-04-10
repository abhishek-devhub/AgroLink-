'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SupplyChainTracker from '@/components/SupplyChainTracker/SupplyChainTracker';

export default function PublicTracePage() {
  const params = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetch(`/api/orders/${params.orderId}`).then((r) => r.json()).then(setOrder).catch(() => {});
  }, [params.orderId]);

  if (!order) return null;

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

        <SupplyChainTracker steps={order.supplyChainSteps} readOnly />
      </div>
    </div>
  );
}
