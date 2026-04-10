import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const farmerId = searchParams.get('farmerId');

    if (!farmerId) {
      return NextResponse.json({ success: false, error: 'farmerId is required' }, { status: 400 });
    }

    // Fetch all orders for this farmer
    const orders = await Order.find({ farmerId })
      .sort({ updatedAt: -1 })
      .lean();

    // Map orders to the payment format expected by the frontend
    const payments = orders
      .filter(o => o.paymentStatus === 'paid' || o.paymentStatus === 'pending')
      .map(o => ({
        _id: o._id,
        paidAt: o.payment?.paidAt || o.updatedAt,
        orderId: o._id,
        buyerName: o.buyerName,
        crop: o.crop,
        quantity: o.quantity,
        unit: o.unit,
        amount: o.totalAmount || o.payment?.amount || 0,
        method: o.payment?.method || null,
        status: o.paymentStatus
      }));

    const totalReceived = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingAmount = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      success: true,
      data: { payments, totalReceived, pendingAmount },
    });
  } catch (err) {
    console.error('[farmer/payments]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
