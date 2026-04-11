import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Listing from '@/lib/models/Listing';
import { addActivity } from '@/lib/activityServer';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');
    const crop = searchParams.get('crop');
    const grade = searchParams.get('grade');
    const state = searchParams.get('state');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minQty = searchParams.get('minQty');

    const filter = {};
    if (farmerId) filter.farmerId = farmerId;
    if (crop) filter.crop = { $in: crop.split(',') };
    if (grade) filter.grade = { $in: grade.split(',') };
    if (state) filter.farmerState = state;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (minQty) filter.quantity = { $gte: Number(minQty) };

    const listings = await Listing.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(listings);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const listing = await Listing.create(body);

    await addActivity({
      userId: listing.farmerId,
      role: 'farmer',
      type: 'listing_created',
      message: `Your ${listing.variety || ''} ${listing.crop} listing (${listing.quantity}${listing.unit}) is now live on the marketplace`,
      meta: { listingId: listing._id, crop: listing.crop, quantity: listing.quantity }
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
