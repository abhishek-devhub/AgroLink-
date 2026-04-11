import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import dbConnect from '@/lib/mongodb';
import Listing from '@/lib/models/Listing';
import Order from '@/lib/models/Order';

export async function POST(req) {
  try {
    await dbConnect();
    const { listingId, quantity, buyerId, buyerName } = await req.json();

    // Load listing
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }
    if (listing.status !== 'active' && listing.status !== 'bid_received') {
      return NextResponse.json({ success: false, error: 'Listing is no longer available' }, { status: 400 });
    }

    const totalAmount = listing.price * quantity;   // in rupees
    const amountInPaise = totalAmount * 100;           // Razorpay uses paise

    // Create Razorpay order
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `agrolink_${Date.now()}`,
      notes: {
        listingId: listingId.toString(),
        buyerId: buyerId.toString(),
        buyerName,
        farmerId: listing.farmerId.toString(),
        crop: listing.crop,
        quantity: quantity.toString(),
      },
    });

    // Derive batchId just like the existing orders route
    const batchPrefix = listing.farmerDistrict
      ? listing.farmerDistrict.substring(0, 3).toUpperCase()
      : 'AGR';
    const batchId = `${batchPrefix}-2024-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create a pending order in MongoDB
    const order = await Order.create({
      listingId,
      farmerId: listing.farmerId,
      farmerName: listing.farmerName,
      buyerId,
      buyerName,
      crop: listing.crop,
      variety: listing.variety || '',
      quantity,
      unit: listing.unit,
      agreedPrice: listing.price,
      totalAmount,
      grade: listing.grade,
      batchId,
      status: 'payment_pending',
      paymentStatus: 'pending',
      payment: {
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        currency: 'INR',
        status: 'pending',
      },
      supplyChainSteps: [
        { label: 'Harvested', status: 'complete', timestamp: new Date() },
        { label: 'Quality Checked', status: 'active', timestamp: null },
        { label: 'Packed & Loaded', status: 'pending', timestamp: null },
        { label: 'In Transit', status: 'pending', timestamp: null },
        { label: 'Delivered', status: 'pending', timestamp: null },
      ],
    });

    return NextResponse.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        orderId: order._id,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        prefill: {
          name: buyerName,
          email: 'buyer@agrolink.in',
          contact: '9999999999'
        },
        description: `Payment for ${quantity} ${listing.unit} of ${listing.crop} from ${listing.farmerName}`,
      },
    });
  } catch (err) {
    console.error('[create-order]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
