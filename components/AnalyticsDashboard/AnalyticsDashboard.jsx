'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AnalyticsDashboard.module.css';
import { useAuth } from '@/lib/auth-context';

/* ────────────────────────────────────────────
   Tiny canvas helpers – no external chart lib
   ──────────────────────────────────────────── */

function drawLine(ctx, points, color, width = 2.5, fill = false) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const xc = (points[i].x + points[i - 1].x) / 2;
    const yc = (points[i].y + points[i - 1].y) / 2;
    ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  if (fill) {
    const last = points[points.length - 1];
    const first = points[0];
    ctx.lineTo(last.x, ctx.canvas.height - 30);
    ctx.lineTo(first.x, ctx.canvas.height - 30);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    grad.addColorStop(0, color + '40');
    grad.addColorStop(1, color + '05');
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

/* ── Revenue Line Chart ── */
function RevenueChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const pad = { top: 20, right: 20, bottom: 35, left: 10 };
    const w = rect.width - pad.left - pad.right;
    const h = rect.height - pad.top - pad.bottom;
    const max = Math.max(...data.map(d => d.revenue), 1);

    const points = data.map((d, i) => ({
      x: pad.left + (i / (data.length - 1 || 1)) * w,
      y: pad.top + h - (d.revenue / max) * h,
    }));

    // Grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + w, y);
      ctx.stroke();
    }

    drawLine(ctx, points, '#10b981', 3, true);

    // Dots
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // X labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    data.forEach((d, i) => {
      const x = pad.left + (i / (data.length - 1 || 1)) * w;
      ctx.fillText(d.month, x, rect.height - 10);
    });
  }, [data]);

  return <canvas ref={canvasRef} className={styles.chart} />;
}

/* ── Donut Chart ── */
function DonutChart({ data }) {
  const canvasRef = useRef(null);
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
  const labels = ['Completed', 'Confirmed', 'In Progress', 'Pending'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const values = [
      data.completed || 0,
      data.confirmed || 0,
      data.in_progress || 0,
      data.pending || 0,
    ];
    const total = values.reduce((a, b) => a + b, 0);
    if (total === 0) return;

    const cx = rect.width / 2 - 50;
    const cy = rect.height / 2;
    const outerR = Math.min(cx, cy) - 10;
    const innerR = outerR * 0.6;

    let startAngle = -Math.PI / 2;
    values.forEach((val, i) => {
      if (val === 0) return;
      const slice = (val / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
      ctx.arc(cx, cy, innerR, startAngle + slice, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
      startAngle += slice;
    });

    // Center text
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy - 6);
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Total', cx, cy + 14);

    // Legend
    const legendX = rect.width / 2 + 20;
    let legendY = 20;
    values.forEach((val, i) => {
      if (val === 0) return;
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.roundRect(legendX, legendY, 10, 10, 2);
      ctx.fill();
      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${labels[i]}: ${val}`, legendX + 16, legendY + 9);
      legendY += 22;
    });
  }, [data]);

  return <canvas ref={canvasRef} className={styles.chart} />;
}

/* ── Bar Chart for Crop Performance ── */
function CropBarChart({ data }) {
  const canvasRef = useRef(null);
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const pad = { top: 15, right: 15, bottom: 40, left: 15 };
    const w = rect.width - pad.left - pad.right;
    const h = rect.height - pad.top - pad.bottom;
    const maxRev = Math.max(...data.map(d => d.revenue), 1);
    const barW = Math.min(50, (w / data.length) * 0.6);
    const gap = w / data.length;

    data.forEach((d, i) => {
      const barH = (d.revenue / maxRev) * h;
      const x = pad.left + gap * i + (gap - barW) / 2;
      const y = pad.top + h - barH;
      const col = colors[i % colors.length];

      // Bar with rounded top
      const radius = Math.min(6, barW / 2);
      ctx.beginPath();
      ctx.moveTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.arcTo(x + barW, y, x + barW, y + radius, radius);
      ctx.lineTo(x + barW, pad.top + h);
      ctx.lineTo(x, pad.top + h);
      ctx.closePath();

      const grad = ctx.createLinearGradient(x, y, x, pad.top + h);
      grad.addColorStop(0, col);
      grad.addColorStop(1, col + '60');
      ctx.fillStyle = grad;
      ctx.fill();

      // Value on top
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('₹' + (d.revenue / 1000).toFixed(d.revenue >= 1000 ? 1 : 0) + 'k', x + barW / 2, y - 6);

      // Label
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillText(d.crop, x + barW / 2, rect.height - 10);
    });
  }, [data]);

  return <canvas ref={canvasRef} className={styles.chart} />;
}

/* ── Rating Stars ── */
function RatingStars({ rating }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className={styles.stars}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < full || (i === full && half) ? '#f59e0b' : '#d1d5db' }}>
          {i < full ? '★' : i === full && half ? '★' : '☆'}
        </span>
      ))}
      <span className={styles.ratingNum}>{rating}</span>
    </span>
  );
}

/* ═════════════════════════════════════════════
   MAIN DASHBOARD
   ═════════════════════════════════════════════ */

export default function AnalyticsDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && user && user.role !== 'farmer') {
      router.push(`/${user.role}/dashboard`);
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadData() {
      if (role === 'farmer') {
        const [prices, demand, sales, orders, cropPerf, transp, forecast] = await Promise.all([
          farmerAPI.getPriceTrends(),
          farmerAPI.getDemand(),
          farmerAPI.getSalesPerformance(),
          farmerAPI.getOrdersTracking(),
          farmerAPI.getCropPerformance(),
          farmerAPI.getPriceTransparency(),
          farmerAPI.getDemandForecast()
        ]);
        setFData({ prices, demand, sales, orders, cropPerf, transp, forecast });
      } else {
        const [comp, history, purchases, farmers, delivery, near] = await Promise.all([
          buyerAPI.getPriceComparison(),
          buyerAPI.getPriceHistory(),
          buyerAPI.getPurchaseAnalytics(),
          buyerAPI.getFarmerPerformance(),
          buyerAPI.getDeliveryAnalytics(),
          buyerAPI.getNearbyFarmers()
        ]);
        setBData({ comp, history, purchases, farmers, delivery, near });
      }
    }
    fetchAnalytics();
  }, [user]);

  if (loading || fetching || !user) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingGrid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    overview,
    cropPerformance,
    statusBreakdown,
    revenueTrend,
    listingsOverview,
    paymentsOverview,
    ratingsOverview,
    topBuyers,
    recentOrders,
  } = data;

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>📊 Farm Analytics</h1>
          <p className={styles.subtitle}>
            Real-time insights from your farming business.
          </p>
        </div>
      </header>

      {role === 'farmer' ? (
        !fData ? loadingView : (
          <div className={styles.grid}>
            {/* 1. Price Trends */}
            <Widget title="Price Trends" icon="📈" theme="themeEmerald" insight="Wheat price ↑ 8% this week → Good time to sell!" insightIcon="✅">
              {Object.entries(fData.prices.prices).map(([crop, data]) => (
                <div key={crop} className={styles.statRow}>
                  <span className={styles.statLabel} style={{ textTransform: 'capitalize' }}>{crop}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className={styles.statValue}>₹{data.current}/q</span>
                    {data.change > 0
                      ? <span className={styles.trendUp}>↑ {data.change}%</span>
                      : <span className={styles.trendDown}>↓ {Math.abs(data.change)}%</span>
                    }
                  </div>
                </div>
              ))}
            </Widget>

            {/* 2. Profit Calculator */}
            <Widget title="Profit Calculator" icon="💰" theme="themeBlue" insight={profitResult && profitResult.profitMargin > 40 ? "Excellent ROI!" : "Lower risk crop but less profitable."} insightIcon={profitResult && profitResult.profitMargin > 40 ? "✅" : "⚠️"}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className={styles.inputGroup} style={{ flex: 1 }}>
                  <label className={styles.statLabel}>Crop</label>
                  <select className={styles.statValue} style={{ padding: '4px', borderRadius: '4px' }} value={profitCrop} onChange={e => setProfitCrop(e.target.value)}>
                    <option value="wheat">Wheat</option>
                    <option value="tomato">Tomato</option>
                    <option value="rice">Rice</option>
                  </select>
                </div>
                <div className={styles.inputGroup} style={{ flex: 1 }}>
                  <label className={styles.statLabel}>Cost (₹)</label>
                  <input type="number" value={profitCost} onChange={e => setProfitCost(Number(e.target.value))} />
                </div>
              </div>
              {profitResult && (
                <>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Net Profit</span>
                    <span className={styles.statValue} style={{ color: 'var(--leaf)' }}>₹{profitResult.netProfit.toLocaleString()}</span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Profit Margin</span>
                    <span className={styles.statValue}>{profitResult.profitMargin}%</span>
                  </div>
                </>
              )}
            </Widget>

            {/* 3. Demand Analytics */}
            <Widget title="Market Demand" icon="🔔" theme="themeRose" insight="Tomato demand is spiking locally." insightIcon="📈">
              {fData.demand.demand.map(d => (
                <div key={d.crop} className={styles.statRow}>
                  <div>
                    <span className={styles.statLabel}>{d.crop}</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--bark)' }}>{d.requests} requests</div>
                  </div>
                  <span className={`${styles.badge} ${d.demandLevel === 'High' ? styles.badgeHigh : d.demandLevel === 'Medium' ? styles.badgeMed : styles.badgeLow}`}>
                    {d.demandLevel}
                  </span>
                </div>
              ))}
            </Widget>

            {/* 4. Sales Metrics */}
            <Widget title="Sales Performance" icon="📊" theme="themeAmber" insight={`${fData.sales.sales.ordersCompleted} orders → ${(fData.sales.sales.successRate * 100).toFixed(0)}% success rate!`} insightIcon="✅">
              <div className={styles.statRow}><span className={styles.statLabel}>Total Sales</span><span className={styles.statValue}>{fData.sales.sales.totalSales.toLocaleString()} kg</span></div>
              <div className={styles.statRow}><span className={styles.statLabel}>Revenue</span><span className={styles.statValue}>₹{fData.sales.sales.revenue.toLocaleString()}</span></div>
              <div className={styles.statRow}><span className={styles.statLabel}>Orders</span><span className={styles.statValue}>{fData.sales.sales.ordersCompleted}</span></div>
            </Widget>

            {/* 4b. Demand Forecast */}
            <Widget title="Demand Forecast (2-4 Weeks)" icon="🔮" theme="themeTeal" insight="Use this board for crop planning before listing." insightIcon="📌">
              {fData.forecast.forecasts.map(item => (
                <div key={item.crop} className={styles.statRow}>
                  <div>
                    <span className={styles.statLabel}>{item.crop}</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--bark)' }}>{item.driver}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={styles.statValue}>₹{item.expectedPrice}/q</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--bark)' }}>
                      {item.expectedDemand} • {Math.round(item.confidence * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </Widget>

            {/* 5. Supply Chain */}
            <Widget title="Logistics" icon="🚚" theme="themeTeal" insight={`Avg delivery: ${fData.orders.avgDelivery} days → Fast & reliable!`} insightIcon="✅">
              {fData.orders.orders.map(o => (
                <div key={o.id} className={styles.statRow}>
                  <div>
                    <span className={styles.recentCrop}>{p.crop}</span>
                    <span className={styles.recentBuyer}>by {p.buyer}</span>
                  </div>
                  <span className={styles.recentAmount}>₹{p.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          {paymentsOverview.count === 0 && (
            <div className={styles.emptyState}>
              <span>💸</span>
              <p>No payments received yet.</p>
            </div>
          )}
        </div>

        {/* Ratings */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>⭐ Your Ratings</h3>
          </div>
          {ratingsOverview.total === 0 ? (
            <div className={styles.emptyState}>
              <span>⭐</span>
              <p>No ratings yet. Complete orders to get buyer reviews!</p>
            </div>
          ) : (
            <>
              <div className={styles.ratingBig}>
                <span className={styles.ratingBigNum}>{ratingsOverview.average}</span>
                <RatingStars rating={ratingsOverview.average} />
                <span className={styles.ratingCount}>{ratingsOverview.total} reviews</span>
              </div>
              <div className={styles.ratingBars}>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = ratingsOverview.distribution[star] || 0;
                  const pct = ratingsOverview.total > 0 ? (count / ratingsOverview.total) * 100 : 0;
                  return (
                    <div key={star} className={styles.ratingBarRow}>
                      <span className={styles.ratingBarLabel}>{star}★</span>
                      <div className={styles.ratingBarTrack}>
                        <div className={styles.ratingBarFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.ratingBarCount}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Top Buyers */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>👥 Top Buyers</h3>
          </div>
          {topBuyers.length === 0 ? (
            <div className={styles.emptyState}>
              <span>🤝</span>
              <p>Complete orders to see your top buyers.</p>
            </div>
          ) : (
            <div className={styles.buyerList}>
              {topBuyers.map((b, i) => (
                <div key={i} className={styles.buyerRow}>
                  <div className={styles.buyerRank}>#{i + 1}</div>
                  <div className={styles.buyerInfo}>
                    <span className={styles.buyerName}>{b.name}</span>
                    <span className={styles.buyerOrders}>{b.orders} orders</span>
                  </div>
                  <span className={styles.buyerSpent}>₹{b.totalSpent.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Orders Table ── */}
      <div className={styles.card} style={{ marginTop: '1.5rem' }}>
        <div className={styles.cardHeader}>
          <h3>🕐 Recent Orders</h3>
        </div>
        {recentOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <span>📋</span>
            <p>No orders yet. List your produce to start receiving orders!</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Buyer</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o, i) => (
                  <tr key={i}>
                    <td className={styles.cropCell}>
                      {o.crop}
                      {o.variety && <span className={styles.variety}>{o.variety}</span>}
                    </td>
                    <td>{o.buyer}</td>
                    <td>{o.quantity} {o.unit}</td>
                    <td>₹{o.agreedPrice.toLocaleString()}</td>
                    <td className={styles.totalCell}>₹{o.totalAmount.toLocaleString()}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles['status_' + o.status]}`}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className={styles.dateCell}>{new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
