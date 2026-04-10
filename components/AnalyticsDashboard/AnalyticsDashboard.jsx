'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AnalyticsDashboard.module.css';
import { useAuth } from '@/lib/auth-context';
import { farmerAPI, buyerAPI } from '@/lib/analytics-service';

function Widget({ title, icon, theme, insight, insightIcon, children }) {
  return (
    <div className={`${styles.widget} ${styles[theme]}`}>
      <div className={styles.widgetHeader}>
        <div className={styles.widgetIcon}>{icon}</div>
        <h3 className={styles.widgetTitle}>{title}</h3>
      </div>
      <div className={styles.widgetContent}>{children}</div>
      {insight && (
        <div className={styles.insightBox}>
          <span>{insightIcon || '💡'}</span>
          <span>{insight}</span>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsDashboard({ defaultRole = 'farmer' }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fData, setFData] = useState(null);
  const [bData, setBData] = useState(null);

  // Force role based on user's actual role
  const role = user?.role || defaultRole;

  // Verify user is accessing their own role's analytics
  useEffect(() => {
    if (!loading && user && user.role !== defaultRole) {
      router.push(`/${user.role}/analytics`);
    }
  }, [user, loading, defaultRole, router]);

  // Profit Calc State
  const [profitCost, setProfitCost] = useState(200000);
  const [profitCrop, setProfitCrop] = useState('wheat');
  const [profitQty, setProfitQty] = useState(200);
  const [profitResult, setProfitResult] = useState(null);

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
    loadData();
  }, [role]);

  useEffect(() => {
    if (role === 'farmer' && fData?.prices) {
      farmerAPI.getProfitCalculator(profitCost, fData.prices.prices[profitCrop].current, profitQty)
        .then(setProfitResult);
    }
  }, [profitCost, profitCrop, profitQty, fData, role]);

  const loadingView = (
    <div className={styles.grid}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className={styles.widget} style={{ height: '250px', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⏳</span>
        </div>
      ))}
    </div>
  );

  if (loading || !user) return loadingView;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>📊 Intelligence Hub</h1>
          <p className={styles.subtitle}>Actionable insights for {role === 'farmer' ? 'maximizing profits' : 'smart procurement'}.</p>
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
                    <span className={styles.statLabel}>{o.crop} ({o.quantity}q)</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--bark)' }}>{o.status === 'Delivered' ? o.date : `Est: ${o.expectedDelivery}`}</div>
                  </div>
                  <span className={`${styles.badge} ${o.status === 'Delivered' ? styles.badgeHigh : styles.badgeMed}`}>
                    {o.status}
                  </span>
                </div>
              ))}
            </Widget>

            {/* 6. Crop Performance */}
            <Widget title="Crop ROI Analysis" icon="🏆" theme="themePurple" insight="Wheat tops your ROI this season." insightIcon="🏆">
              {fData.cropPerf.crops.map(c => (
                <div key={c.crop} className={styles.statRow}>
                  <div>
                    <span className={styles.statLabel}>{c.crop}</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--bark)' }}>{c.volume} units sold</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={styles.statValue}>₹{c.profit.toLocaleString()}</div>
                    <div className={styles.trendUp}>{c.roi}% ROI</div>
                  </div>
                </div>
              ))}
            </Widget>

            {/* 7. Price Transparency */}
            <Widget title="Market Match" icon="💎" theme="themeBlue" insight={fData.transp.recommendation} insightIcon={fData.transp.position === 'premium' ? "✅" : "⚠️"}>
              <div className={styles.statRow}><span className={styles.statLabel}>Your Avg Price</span><span className={styles.statValue}>₹{fData.transp.yourPrice}</span></div>
              <div className={styles.statRow}><span className={styles.statLabel}>Mandi Avg Price</span><span className={styles.statValue}>₹{fData.transp.marketPrice}</span></div>
              <div className={styles.statRow}><span className={styles.statLabel}>Difference</span>
                <span className={fData.transp.difference > 0 ? styles.trendUp : styles.trendDown}>
                  {fData.transp.difference > 0 ? '+' : ''}{fData.transp.difference}%
                </span>
              </div>
            </Widget>

          </div>
        )
      ) : (
        !bData ? loadingView : (
          <div className={styles.grid}>
            {/* 1. Price Comparison */}
            <Widget title="Best Deals" icon="🔍" theme="themeEmerald" insight={`Farmer C is offering ₹${bData.comp.savings.cheapest} - the BEST DEAL!`} insightIcon="✅">
              {bData.comp.comparison.map(c => (
                <div key={c.farmer} className={styles.statRow}>
                  <div>
                    <span className={styles.statLabel}>{c.farmer} </span><span style={{ fontSize: '0.8rem' }}>⭐ {c.rating}</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--bark)' }}>Delivers in: {c.delivery}</div>
                  </div>
                  <span className={styles.statValue}>₹{c.price}/q</span>
                </div>
              ))}
            </Widget>

            {/* 2. Price History */}
            <Widget title="Price Forecast" icon="📉" theme="themePurple" insight={bData.history.recommendation} insightIcon={bData.history.trend === 'falling' ? "✅" : "⚠️"}>
              {bData.history.priceHistory.map((h, i) => (
                <div key={i} className={styles.statRow}>
                  <span className={styles.statLabel}>{h.date}</span>
                  <span className={styles.statValue}>₹{h.price}</span>
                </div>
              ))}
            </Widget>

            {/* 3. Purchase Analytics */}
            <Widget title="Spend Analytics" icon="🛍️" theme="themeBlue" insight="Spending is up 40% this month." insightIcon="⚠️">
              <div className={styles.statRow}><span className={styles.statLabel}>Total Orders</span><span className={styles.statValue}>{bData.purchases.purchases.totalOrders}</span></div>
              <div className={styles.statRow}><span className={styles.statLabel}>Avg Order Value</span><span className={styles.statValue}>₹{bData.purchases.purchases.avgOrderValue.toLocaleString()}</span></div>
              <div className={styles.statRow}><span className={styles.statLabel}>Total Spent</span><span className={styles.statValue}>₹{bData.purchases.purchases.totalSpending.toLocaleString()}</span></div>
            </Widget>

            {/* 4. Farmer Performance */}
            <Widget title="Supplier Ratings" icon="⭐" theme="themeAmber" insight="Farmer X is highly trusted (4.8★)" insightIcon="✅">
              {bData.farmers.farmers.map(f => (
                <div key={f.farmer} className={styles.statRow}>
                  <div>
                    <span className={styles.statLabel}>{f.farmer}</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--bark)' }}>Avg del: {f.deliveryTime}d • {f.reviews} reviews</div>
                  </div>
                  <span className={styles.statValue}>⭐ {f.rating}</span>
                </div>
              ))}
            </Widget>

            {/* 5. Delivery Analytics */}
            <Widget title="Supply Chain" icon="📦" theme="themeTeal" insight="92% on-time delivery across network." insightIcon="🚚">
              <div className={styles.statRow}><span className={styles.statLabel}>On-Time %</span><span className={styles.statValue}>{bData.delivery.delivery.onTimePercent}%</span></div>
              <div className={styles.statRow}><span className={styles.statLabel}>Avg Duration</span><span className={styles.statValue}>{bData.delivery.delivery.avgDeliveryTime} days</span></div>
              <div className={styles.statRow}><span className={styles.statLabel}>Reliability Score</span><span className={styles.statValue}>{(bData.delivery.delivery.reliabilityScore * 10).toFixed(1)}/10</span></div>
            </Widget>

            {/* 6. Location Based */}
            <Widget title="Hyperlocal Sourcing" icon="📍" theme="themeRose" insight="Farmer A is closest (3 km)." insightIcon="🎯">
              {bData.near.farmers.map(f => (
                <div key={f.farmer} className={styles.statRow}>
                  <div>
                    <span className={styles.statLabel}>{f.farmer}</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--bark)' }}>Distance: {f.distance}</div>
                  </div>
                  <span className={styles.statValue}>+₹{f.transportCost} delivery</span>
                </div>
              ))}
            </Widget>

          </div>
        )
      )}
    </div>
  );
}
