import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { addActivity } from '@/lib/activityServer';
import { getFairPricingInsight } from '@/lib/fairPricing';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const order = await Order.findById(params.id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const origin = new URL(request.url).origin;
    const traceLink = `${origin}/trace/${order._id}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(traceLink)}`;
    const fairPricing = getFairPricingInsight(order);
    const completedSteps = order.supplyChainSteps.filter((step) => step.status === 'complete').length;
    const stepCompletionRatio = order.supplyChainSteps.length ? completedSteps / order.supplyChainSteps.length : 0;
    const qualityBoost = order.grade === 'A' ? 8 : order.grade === 'B' ? 4 : 0;
    const onTimeBoost = order.status === 'completed' ? 10 : order.status === 'in_progress' ? 5 : 0;
    const trustScore = Math.min(98, Math.round(60 + stepCompletionRatio * 25 + qualityBoost + onTimeBoost));
    const trustBadges = [
      order.grade === 'A' ? 'Premium Grade' : `Grade ${order.grade || 'B'}`,
      stepCompletionRatio >= 0.8 ? 'Traceability Verified' : 'Traceability In Progress',
      order.status === 'completed' ? 'Delivered Successfully' : 'Active Fulfillment',
    ];

    return NextResponse.json({
      ...order.toObject(),
      traceability: {
        traceLink,
        qrImageUrl,
      },
      fairPricing,
      trustProfile: {
        score: trustScore,
        badges: trustBadges,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const body = await request.json();

    if (body.advanceStep !== undefined) {
      const order = await Order.findById(params.id);
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

      const stepIndex = body.advanceStep;
      if (stepIndex >= 0 && stepIndex < order.supplyChainSteps.length) {
        order.supplyChainSteps[stepIndex].status = 'complete';
        order.supplyChainSteps[stepIndex].timestamp = new Date();

        if (stepIndex + 1 < order.supplyChainSteps.length) {
          order.supplyChainSteps[stepIndex + 1].status = 'active';
        }

        if (stepIndex === 2) order.status = 'in_progress';
        if (stepIndex === 4) {
          order.status = 'completed';
        }
      }
      await order.save();

      const stepName = order.supplyChainSteps[stepIndex].label;
      const farmerMessages = {
        'Quality Checked': `Quality check marked complete for your ${order.crop} order to ${order.buyerName}`,
        'Packed & Loaded': `${order.crop} order packed and loaded — ready for dispatch to ${order.buyerName}`,
        'In Transit':      `Your ${order.crop} shipment is now in transit to ${order.buyerName}`,
        'Delivered':       `${order.crop} order delivered to ${order.buyerName}. Payment of ₹${order.quantity * order.agreedPrice} is being processed`,
      };
      const buyerMessages = {
        'In Transit': `Your ${order.crop} order from ${order.farmerName} is now in transit`,
        'Delivered':  `Your ${order.crop} order from ${order.farmerName} has arrived. Please confirm receipt`,
      };

      if (farmerMessages[stepName]) {
        await addActivity({
          userId:  order.farmerId,
          role:    'farmer',
          type:    'supply_chain_update',
          message: farmerMessages[stepName],
          meta:    { orderId: order._id, step: stepName }
        });
      }

      if (buyerMessages[stepName]) {
        await addActivity({
          userId:  order.buyerId,
          role:    'buyer',
          type:    stepName === 'Delivered' ? 'delivery_arrived' : 'shipment_dispatched',
          message: buyerMessages[stepName],
          meta:    { orderId: order._id, step: stepName }
        });
      }

      return NextResponse.json(order);
    }

    const order = await Order.findByIdAndUpdate(params.id, body, { new: true });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (body.paymentStatus === 'paid') {
      const totalAmount = order.quantity * order.agreedPrice;
      await addActivity({
        userId:  order.buyerId,
        role:    'buyer',
        type:    'delivery_confirmed',
        message: `Delivery confirmed. Payment of ₹${totalAmount} released to ${order.farmerName}`,
        meta:    { orderId: order._id, totalAmount }
      });
      await addActivity({
        userId:  order.farmerId,
        role:    'farmer',
        type:    'payment_received',
        message: `Payment of ₹${totalAmount} received for ${order.crop} order from ${order.buyerName}`,
        meta:    { orderId: order._id, totalAmount }
      });
    }

    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
