import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';

export async function POST(req) {
  try {
    await dbConnect();
    const { orderId } = await req.json();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const totalAmount = order.totalAmount || (order.agreedPrice * order.quantity);
    const amountInPaise = Math.round(totalAmount * 100);

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `agrolink_exist_${Date.now()}`,
      notes: { orderId: order._id.toString() },
    });

    order.payment = {
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      currency: 'INR',
      status: 'pending',
    };
    await order.save();

    return NextResponse.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        orderId: order._id,
        keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        prefill: {
          name: order.buyerName || 'Buyer',
          email: 'buyer@agrolink.in',
          contact: '9999999999'
        },
        description: `Payment for ${order.quantity}${order.unit} of ${order.crop}`,
      },
    });
  } catch (err) {
    console.error('[create-order-for-existing]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
