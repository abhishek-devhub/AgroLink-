import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Farmer from '@/lib/models/Farmer';
import Buyer from '@/lib/models/Buyer';

export async function POST(request) {
  try {
    await dbConnect();
    const { phone, password } = await request.json();

    let farmer = await Farmer.findOne({ phone, password });
    if (farmer) {
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
      });
    }

    let buyer = await Buyer.findOne({ phone, password });
    if (buyer) {
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
      });
    }

    return NextResponse.json({ error: 'Wrong phone number or password' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
