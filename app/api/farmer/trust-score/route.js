import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Rating from '@/lib/models/Rating';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const farmerId = searchParams.get('farmerId');

  if (!farmerId) {
    return NextResponse.json({ error: 'farmerId required' }, { status: 400 });
  }

  try {
    await dbConnect();

    // Fetch farmer's orders
    const orders = await Order.find({ farmerId }).lean();
    const ratings = await Rating.find({ farmerId }).lean();

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const inProgressOrders = orders.filter(o => ['confirmed', 'in_progress'].includes(o.status)).length;

    // 1. Delivery Score (0-100): Based on completion rate and supply chain step completion
    let deliveryScore = 50; // Base
    if (totalOrders > 0) {
      const completionRate = completedOrders / totalOrders;
      deliveryScore = Math.round(completionRate * 100);
      
      // Bonus for on-time completion (check if steps have reasonable timestamps)
      const onTimeOrders = completedOrders; // Simplified: count completed as on-time
      if (completedOrders > 0) {
        deliveryScore = Math.min(100, deliveryScore + 10);
      }
    }

    // 2. Quality Score (0-100): Based on grades in listings and ratings
    let qualityScore = 50;
    const gradeScores = { A: 95, B: 70, C: 45 };
    if (orders.length > 0) {
      const gradeValues = orders.map(o => gradeScores[o.grade] || 70);
      qualityScore = Math.round(gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length);
    }
    // Factor in buyer ratings
    if (ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
      qualityScore = Math.round((qualityScore * 0.6) + ((avgRating / 5) * 100 * 0.4));
    }

    // 3. Consistency Score (0-100): Based on regularity of listings and order patterns
    let consistencyScore = 40; // Base for new users
    if (totalOrders >= 3) consistencyScore = 60;
    if (totalOrders >= 5) consistencyScore = 75;
    if (totalOrders >= 10) consistencyScore = 85;
    if (completedOrders >= 10) consistencyScore = 95;

    // 4. Volume Score (0-100): Based on total trade volume
    let volumeScore = 30;
    const totalVolume = orders.reduce((sum, o) => sum + (o.totalAmount || o.quantity * o.agreedPrice), 0);
    if (totalVolume > 10000) volumeScore = 50;
    if (totalVolume > 50000) volumeScore = 70;
    if (totalVolume > 200000) volumeScore = 85;
    if (totalVolume > 500000) volumeScore = 95;

    // 5. Community Score (0-100): Based on ratings received
    let communityScore = 40;
    if (ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
      communityScore = Math.round((avgRating / 5) * 100);
    }
    if (ratings.length >= 5) communityScore = Math.min(100, communityScore + 10);

    // Overall Trust Score (weighted average)
    const overallScore = Math.round(
      deliveryScore * 0.25 +
      qualityScore * 0.25 +
      consistencyScore * 0.20 +
      volumeScore * 0.15 +
      communityScore * 0.15
    );

    // Determine badge level
    let badge = 'Bronze';
    let badgeColor = '#CD7F32';
    let nextBadge = 'Silver';
    let pointsToNext = 50 - overallScore;
    
    if (overallScore >= 90) {
      badge = 'Platinum';
      badgeColor = '#E5E4E2';
      nextBadge = null;
      pointsToNext = 0;
    } else if (overallScore >= 75) {
      badge = 'Gold';
      badgeColor = '#FFD700';
      nextBadge = 'Platinum';
      pointsToNext = 90 - overallScore;
    } else if (overallScore >= 50) {
      badge = 'Silver';
      badgeColor = '#C0C0C0';
      nextBadge = 'Gold';
      pointsToNext = 75 - overallScore;
    } else {
      pointsToNext = 50 - overallScore;
    }

    // Unlock opportunities based on score
    const opportunities = [];
    if (overallScore >= 30) opportunities.push({ name: 'Basic Marketplace Access', unlocked: true, icon: '🏪' });
    if (overallScore >= 40) opportunities.push({ name: 'Priority Listing Placement', unlocked: overallScore >= 40, icon: '📌' });
    if (overallScore >= 50) opportunities.push({ name: 'Platform Fee Discount (5%)', unlocked: overallScore >= 50, icon: '💰' });
    if (overallScore >= 60) opportunities.push({ name: 'Kisan Credit Card Pre-approval', unlocked: overallScore >= 60, icon: '💳' });
    if (overallScore >= 70) opportunities.push({ name: 'Government PM-KISAN Fast Track', unlocked: overallScore >= 70, icon: '🏛️' });
    if (overallScore >= 80) opportunities.push({ name: 'Crop Insurance Discount (15%)', unlocked: overallScore >= 80, icon: '🛡️' });
    if (overallScore >= 90) opportunities.push({ name: 'AgroLink Ambassador Program', unlocked: overallScore >= 90, icon: '⭐' });

    // Add locked opportunities for motivation
    const allOpportunities = [
      { name: 'Basic Marketplace Access', threshold: 30, icon: '🏪' },
      { name: 'Priority Listing Placement', threshold: 40, icon: '📌' },
      { name: 'Platform Fee Discount (5%)', threshold: 50, icon: '💰' },
      { name: 'Kisan Credit Card Pre-approval', threshold: 60, icon: '💳' },
      { name: 'Government PM-KISAN Fast Track', threshold: 70, icon: '🏛️' },
      { name: 'Crop Insurance Discount (15%)', threshold: 80, icon: '🛡️' },
      { name: 'AgroLink Ambassador Program', threshold: 90, icon: '⭐' },
    ].map(op => ({
      ...op,
      unlocked: overallScore >= op.threshold,
    }));

    // Score improvement tips
    const tips = [];
    if (deliveryScore < 80) tips.push('Complete more orders and update supply chain steps promptly to boost your delivery score.');
    if (qualityScore < 80) tips.push('Maintain Grade A produce quality consistently to improve your quality rating.');
    if (consistencyScore < 80) tips.push('List produce regularly — consistent activity builds higher trust.');
    if (volumeScore < 80) tips.push('Increasing your trade volume unlocks better opportunities and improves your score.');
    if (communityScore < 80) tips.push('Encourage buyers to leave positive ratings after every completed transaction.');

    return NextResponse.json({
      overallScore,
      breakdown: {
        delivery: deliveryScore,
        quality: qualityScore,
        consistency: consistencyScore,
        volume: volumeScore,
        community: communityScore,
      },
      badge,
      badgeColor,
      nextBadge,
      pointsToNext,
      stats: {
        totalOrders,
        completedOrders,
        totalVolume,
        avgRating: ratings.length > 0 ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1) : 'N/A',
        ratingsCount: ratings.length,
      },
      opportunities: allOpportunities,
      tips,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Unable to compute trust score. Please try again.' }, { status: 500 });
  }
}
