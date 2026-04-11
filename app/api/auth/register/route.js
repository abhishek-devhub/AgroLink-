import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import Farmer from '@/lib/models/Farmer';
import Buyer from '@/lib/models/Buyer';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { role, ...data } = body;

    // Basic validation
    if (!data.phone || !/^\d{10}$/.test(data.phone)) {
      return NextResponse.json({ error: 'A valid 10-digit phone number is required' }, { status: 400 });
    }
    if (!data.password || data.password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    if (role === 'farmer') {
      if (!data.name || !data.village || !data.district || !data.state) {
        return NextResponse.json({ error: 'All personal details are required' }, { status: 400 });
      }

      const existing = await Farmer.findOne({ phone: data.phone });
      if (existing) return NextResponse.json({ error: 'Phone number already registered as a farmer' }, { status: 400 });

      const farmer = await Farmer.create({ ...data, password: hashedPassword });
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
      if (!data.businessName || !data.ownerName || !data.city || !data.state) {
        return NextResponse.json({ error: 'All business details are required' }, { status: 400 });
      }

      const existing = await Buyer.findOne({ phone: data.phone });
      if (existing) return NextResponse.json({ error: 'Phone number already registered as a buyer' }, { status: 400 });

      const buyer = await Buyer.create({ ...data, password: hashedPassword });
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

    return NextResponse.json({ error: 'Invalid role. Must be farmer or buyer.' }, { status: 400 });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
