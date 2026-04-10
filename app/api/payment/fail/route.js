import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';

export async function POST(req) {
  try {
    await dbConnect();
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Only update to failed if it hasn't been paid already
    if (order.paymentStatus === 'pending') {
      order.paymentStatus = 'failed';
      order.payment.status = 'failed';
      await order.save();
    }

    return NextResponse.json({ success: true, message: 'Payment marked as failed' });
  } catch (err) {
    console.error('[payment/fail]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
