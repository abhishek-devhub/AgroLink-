import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Listing from '@/lib/models/Listing';
import Payment from '@/lib/models/Payment';
import Rating from '@/lib/models/Rating';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');

    if (!farmerId) {
      return NextResponse.json({ error: 'farmerId is required' }, { status: 400 });
    }

    // ── 1. Revenue & Order Overview ──
    const allOrders = await Order.find({ farmerId }).lean();
    const completedOrders = allOrders.filter(o => o.status === 'completed');
    const pendingOrders = allOrders.filter(o => ['pending', 'payment_pending', 'checkout_pending'].includes(o.status));
    const confirmedOrders = allOrders.filter(o => o.status === 'confirmed');
    const inProgressOrders = allOrders.filter(o => o.status === 'in_progress');

    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || o.agreedPrice * o.quantity), 0);
    const totalQuantitySold = completedOrders.reduce((sum, o) => sum + o.quantity, 0);
    const avgOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

    const overview = {
      totalOrders: allOrders.length,
      completedOrders: completedOrders.length,
      pendingOrders: pendingOrders.length,
      confirmedOrders: confirmedOrders.length,
      inProgressOrders: inProgressOrders.length,
      totalRevenue,
      totalQuantitySold,
      avgOrderValue,
      successRate: allOrders.length > 0
        ? Number(((completedOrders.length / allOrders.length) * 100).toFixed(1))
        : 0,
    };

    // ── 2. Crop Performance (from completed orders) ──
    const cropMap = {};
    completedOrders.forEach(o => {
      const crop = o.crop || 'Unknown';
      if (!cropMap[crop]) {
        cropMap[crop] = { crop, revenue: 0, quantity: 0, orders: 0 };
      }
      cropMap[crop].revenue += (o.totalAmount || o.agreedPrice * o.quantity);
      cropMap[crop].quantity += o.quantity;
      cropMap[crop].orders += 1;
    });
    const cropPerformance = Object.values(cropMap)
      .sort((a, b) => b.revenue - a.revenue);

    // ── 3. Order Status Breakdown (for donut chart) ──
    const statusBreakdown = {
      completed: completedOrders.length,
      confirmed: confirmedOrders.length,
      in_progress: inProgressOrders.length,
      pending: pendingOrders.length,
    };

    // ── 4. Monthly Revenue Trend (last 6 months) ──
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyOrders = completedOrders.filter(o => new Date(o.createdAt) >= sixMonthsAgo);

    const monthlyRevenue = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyRevenue[key] = 0;
    }
    monthlyOrders.forEach(o => {
      const d = new Date(o.createdAt);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyRevenue[key] !== undefined) {
        monthlyRevenue[key] += (o.totalAmount || o.agreedPrice * o.quantity);
      }
    });
    const revenueTrend = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    // ── 5. Listings Overview ──
    const allListings = await Listing.find({ farmerId }).lean();
    const activeListings = allListings.filter(l => l.status === 'active');
    const soldListings = allListings.filter(l => l.status === 'sold');
    const totalBidsReceived = allListings.reduce((sum, l) => sum + (l.bids?.length || 0), 0);

    const listingsOverview = {
      total: allListings.length,
      active: activeListings.length,
      sold: soldListings.length,
      bidReceived: allListings.filter(l => l.status === 'bid_received').length,
      totalBidsReceived,
      avgPrice: allListings.length > 0
        ? Math.round(allListings.reduce((sum, l) => sum + l.price, 0) / allListings.length)
        : 0,
    };

    // ── 6. Payments Received ──
    const payments = await Payment.find({ farmerId }).sort({ paidAt: -1 }).lean();
    const totalPaymentsReceived = payments.reduce((sum, p) => sum + p.amount, 0);
    const recentPayments = payments.slice(0, 5).map(p => ({
      crop: p.crop,
      amount: p.amount,
      buyer: p.buyerName,
      date: p.paidAt,
      method: p.method,
    }));

    const paymentsOverview = {
      totalReceived: totalPaymentsReceived,
      count: payments.length,
      recentPayments,
    };

    // ── 7. Ratings & Reviews ──
    const ratings = await Rating.find({ toId: farmerId }).lean();
    const avgRating = ratings.length > 0
      ? Number((ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(1))
      : 0;
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(r => {
      ratingDistribution[r.stars] = (ratingDistribution[r.stars] || 0) + 1;
    });

    const ratingsOverview = {
      average: avgRating,
      total: ratings.length,
      distribution: ratingDistribution,
    };

    // ── 8. Top Buyers (by order value) ──
    const buyerMap = {};
    completedOrders.forEach(o => {
      const name = o.buyerName || 'Unknown';
      if (!buyerMap[name]) {
        buyerMap[name] = { name, totalSpent: 0, orders: 0 };
      }
      buyerMap[name].totalSpent += (o.totalAmount || o.agreedPrice * o.quantity);
      buyerMap[name].orders += 1;
    });
    const topBuyers = Object.values(buyerMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // ── 9. Recent Orders ──
    const recentOrders = allOrders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(o => ({
        id: o._id,
        crop: o.crop,
        variety: o.variety,
        quantity: o.quantity,
        unit: o.unit,
        agreedPrice: o.agreedPrice,
        totalAmount: o.totalAmount || o.agreedPrice * o.quantity,
        buyer: o.buyerName,
        status: o.status,
        paymentStatus: o.paymentStatus,
        date: o.createdAt,
      }));

    return NextResponse.json({
      overview,
      cropPerformance,
      statusBreakdown,
      revenueTrend,
      listingsOverview,
      paymentsOverview,
      ratingsOverview,
      topBuyers,
      recentOrders,
    });
  } catch (err) {
    console.error('Farmer analytics error:', err);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
