import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Farmer from '@/lib/models/Farmer';
import Buyer from '@/lib/models/Buyer';
import { addActivity } from '@/lib/activityServer';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');
    const buyerId = searchParams.get('buyerId');
    const status = searchParams.get('status');

    const filter = {};
    if (farmerId) filter.farmerId = farmerId;
    if (buyerId) filter.buyerId = buyerId;
    if (status) filter.status = status;

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const batchPrefix = body.farmerDistrict ? body.farmerDistrict.substring(0, 3).toUpperCase() : 'AGR';
    const batchId = `${batchPrefix}-2024-${Math.floor(1000 + Math.random() * 9000)}`;

    // Lookup farmer and buyer addresses from DB
    let farmerAddress = body.farmerAddress || '';
    let farmerPincode = body.farmerPincode || '';
    let farmerDistrict = body.farmerDistrict || '';
    let farmerState = body.farmerState || '';
    let buyerAddress = body.buyerAddress || '';
    let buyerPincode = body.buyerPincode || '';
    let buyerCity = body.buyerCity || '';
    let buyerState = body.buyerState || '';

    try {
      const farmer = await Farmer.findById(body.farmerId);
      if (farmer) {
        farmerAddress = farmerAddress || farmer.address || '';
        farmerPincode = farmerPincode || farmer.pincode || '';
        farmerDistrict = farmerDistrict || farmer.district || '';
        farmerState = farmerState || farmer.state || '';
      }
    } catch {}

    try {
      const buyer = await Buyer.findById(body.buyerId);
      if (buyer) {
        buyerAddress = buyerAddress || buyer.address || '';
        buyerPincode = buyerPincode || buyer.pincode || '';
        buyerCity = buyerCity || buyer.city || '';
        buyerState = buyerState || buyer.state || '';
      }
    } catch {}

    const order = await Order.create({
      ...body,
      batchId,
      farmerAddress,
      farmerPincode,
      farmerDistrict,
      farmerState,
      buyerAddress,
      buyerPincode,
      buyerCity,
      buyerState,
      supplyChainSteps: [
        { label: 'Harvested', status: 'complete', timestamp: new Date() },
        { label: 'Quality Checked', status: 'active', timestamp: null },
        { label: 'Packed & Loaded', status: 'pending', timestamp: null },
        { label: 'In Transit', status: 'pending', timestamp: null },
        { label: 'Delivered', status: 'pending', timestamp: null },
      ],
    });

    await addActivity({
      userId:  order.farmerId,
      role:    'farmer',
      type:    'order_confirmed',
      message: `New order from ${order.buyerName} for ${order.quantity}q of ${order.crop} at ₹${order.agreedPrice}/q`,
      meta:    { orderId: order._id, crop: order.crop, qty: order.quantity }
    });
    
    await addActivity({
      userId:  order.buyerId,
      role:    'buyer',
      type:    'order_placed',
      message: `Order placed for ${order.quantity}q of ${order.crop} from ${order.farmerName} at ₹${order.agreedPrice}/q. Total: ₹${order.quantity * order.agreedPrice}`,
      meta:    { orderId: order._id, crop: order.crop, qty: order.quantity, total: order.quantity * order.agreedPrice }
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
