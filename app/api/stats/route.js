import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Farmer from '@/lib/models/Farmer';
import Buyer from '@/lib/models/Buyer';
import Order from '@/lib/models/Order';
import Listing from '@/lib/models/Listing';

let cache = { data: null, ts: 0 };

export async function GET() {
  // 5 minute cache
  if (cache.data && Date.now() - cache.ts < 300000) {
    return NextResponse.json(cache.data);
  }

  try {
    await dbConnect();

    const [farmerCount, buyerCount, orders, listings] = await Promise.all([
      Farmer.countDocuments(),
      Buyer.countDocuments(),
      Order.find({}, 'totalAmount agreedPrice quantity status').lean(),
      Listing.find({}, 'farmerState').lean(),
    ]);

    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalTradeValue = orders.reduce((sum, o) => sum + (o.totalAmount || o.agreedPrice * o.quantity || 0), 0);

    const uniqueStates = new Set(listings.map(l => l.farmerState).filter(Boolean));

    const result = {
      farmers: farmerCount,
      buyers: buyerCount,
      tradeValue: totalTradeValue,
      states: uniqueStates.size,
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({
      farmers: 0,
      buyers: 0,
      tradeValue: 0,
      states: 0,
      totalOrders: 0,
      completedOrders: 0,
    });
  }
}
