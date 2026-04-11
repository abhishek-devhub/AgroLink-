import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import Farmer from '@/lib/models/Farmer';
import Buyer from '@/lib/models/Buyer';

export async function POST(request) {
  try {
    await dbConnect();
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone number and password are required' }, { status: 400 });
    }

    // Try farmer first
    const farmer = await Farmer.findOne({ phone });
    if (farmer) {
      // Support both hashed and legacy plain-text passwords
      const isValidHash = farmer.password.startsWith('$2') 
        ? await bcrypt.compare(password, farmer.password)
        : farmer.password === password;

      if (!isValidHash) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
      }

      // Migrate plain-text password to hash on login
      if (!farmer.password.startsWith('$2')) {
        const hashed = await bcrypt.hash(password, 10);
        await Farmer.findByIdAndUpdate(farmer._id, { password: hashed });
      }

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

    // Try buyer
    const buyer = await Buyer.findOne({ phone });
    if (buyer) {
      const isValidHash = buyer.password.startsWith('$2')
        ? await bcrypt.compare(password, buyer.password)
        : buyer.password === password;

      if (!isValidHash) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
      }

      // Migrate plain-text password to hash on login
      if (!buyer.password.startsWith('$2')) {
        const hashed = await bcrypt.hash(password, 10);
        await Buyer.findByIdAndUpdate(buyer._id, { password: hashed });
      }

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

    return NextResponse.json({ error: 'No account found with this phone number' }, { status: 401 });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
