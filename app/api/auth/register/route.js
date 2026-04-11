import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Farmer from '@/lib/models/Farmer';
import Buyer from '@/lib/models/Buyer';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { role, ...data } = body;

    if (role === 'farmer') {
      const existing = await Farmer.findOne({ phone: data.phone });
      if (existing) return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });

      const farmer = await Farmer.create(data);
      return NextResponse.json({
        user: {
          id: farmer._id,
          role: 'farmer',
          name: farmer.name,
          phone: farmer.phone,
          village: farmer.village,
          district: farmer.district,
          state: farmer.state,
          address: farmer.address,
          pincode: farmer.pincode,
          crops: farmer.crops,
        },
      }, { status: 201 });
    }

    if (role === 'buyer') {
      const existing = await Buyer.findOne({ phone: data.phone });
      if (existing) return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });

      const buyer = await Buyer.create(data);
      return NextResponse.json({
        user: {
          id: buyer._id,
          role: 'buyer',
          businessName: buyer.businessName,
          ownerName: buyer.ownerName,
          phone: buyer.phone,
          email: buyer.email,
          city: buyer.city,
          state: buyer.state,
          address: buyer.address,
          pincode: buyer.pincode,
        },
      }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
