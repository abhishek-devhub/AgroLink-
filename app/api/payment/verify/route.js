import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Listing from '@/lib/models/Listing';
import Payment from '@/lib/models/Payment';
import { addActivity } from '@/lib/activityServer';

export async function POST(req) {
  try {
    await dbConnect();
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
      paymentMethod,
    } = await req.json();

    // Step 1: Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json(
        { success: false, error: 'Payment verification failed — invalid signature' },
        { status: 400 }
      );
    }

    // Step 2: Load the pending order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Step 3: Update order to confirmed + paid
    order.status        = 'confirmed';
    order.paymentStatus = 'paid';
    order.payment = {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount:   order.totalAmount,
      currency: 'INR',
      status:   'paid',
      paidAt:   new Date(),
      method:   paymentMethod || null,
    };
    await order.save();

    // Step 4: Mark listing as sold
    await Listing.findByIdAndUpdate(order.listingId, { status: 'sold' });

    // Step 5: (Removed) Payments are now tracked directly via the Order collection

    // Step 6: Fire activity events for buyer and farmer
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(order.totalAmount);

    await addActivity({
      userId:  order.buyerId.toString(),
      role:    'buyer',
      type:    'order_placed',
      message: `Order placed for ${order.quantity}${order.unit} of ${order.crop} from ${order.farmerName}. ${formattedAmount} paid successfully`,
      meta:    { orderId: order._id },
    });

    await addActivity({
      userId:  order.farmerId.toString(),
      role:    'farmer',
      type:    'payment_received',
      message: `${order.buyerName} paid ${formattedAmount} for ${order.quantity}${order.unit} of ${order.crop}. Order is confirmed`,
      meta:    { orderId: order._id },
    });

    return NextResponse.json({ success: true, data: { orderId: order._id } });
  } catch (err) {
    console.error('[verify]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
