import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CommunityPost from '@/lib/models/CommunityPost';

// Initial seed data — inserted into DB once, never returned inline
const SEED_POSTS = [
  {
    authorName: 'Ramesh Patil',
    authorRole: 'farmer',
    type: 'tip',
    category: 'pest-control',
    title: 'Neem oil spray saved my tomato crop from whitefly',
    content: 'I was losing 30% of my tomato yield to whitefly infestation. Started spraying 5ml neem oil per litre of water every 7 days. Within 2 weeks, the whitefly population dropped dramatically. Also added yellow sticky traps between rows. My yield is now back to normal. Total cost: ₹200 per acre per spray.',
    upvotes: [],
    views: 142,
    isExpert: false,
    replies: [
      { authorName: 'Suresh Kumar', authorRole: 'farmer', content: 'This worked for me too! I add a few drops of liquid soap to help it stick to leaves.', createdAt: new Date(Date.now() - 86400000) },
      { authorName: 'Dr. Meena (KVK)', authorRole: 'buyer', content: 'Excellent advice! For severe infestations, you can also try Beauveria bassiana bio-agent at 5g/litre.', createdAt: new Date(Date.now() - 43200000) },
    ],
  },
  {
    authorName: 'Lakshmi Devi',
    authorRole: 'farmer',
    type: 'question',
    category: 'techniques',
    title: 'Best time to apply urea for wheat crop in North India?',
    content: 'I have 5 acres of wheat (HD-2967 variety). The crop is 45 days old. When should I apply the second dose of urea? My soil test showed nitrogen is already moderate.',
    upvotes: [],
    views: 89,
    isExpert: false,
    replies: [
      { authorName: 'Ajay Singh', authorRole: 'farmer', content: 'For HD-2967, I apply second dose at CRI stage (21 days) and third at tillering (45-50 days). Since your soil nitrogen is moderate, use 30kg urea/acre instead of 40.', createdAt: new Date(Date.now() - 36000000) },
    ],
  },
  {
    authorName: 'Vijay Sharma',
    authorRole: 'farmer',
    type: 'text',
    category: 'market-tips',
    title: 'How I increased my onion price by ₹400/quintal using AgroLink',
    content: 'Earlier I used to sell to the local trader at whatever price he offered. This season I listed my Grade A onions on AgroLink. Got 3 buyer offers within 2 days. The competition between buyers pushed my price from ₹1800 to ₹2200 per quintal. On 50 quintals, I earned ₹20,000 extra! The key is to list early and add clear photos.',
    upvotes: [],
    views: 234,
    isExpert: false,
    replies: [],
  },
  {
    authorName: 'Kisan Seva Kendra',
    authorRole: 'buyer',
    type: 'tip',
    category: 'weather',
    title: '⚠️ Heavy rainfall alert for Maharashtra — protect your standing crop',
    content: 'IMD has issued orange alert for Vidarbha and Marathwada regions. Expected 60-80mm rainfall in next 48 hours. If you have standing soybean or cotton: 1) Ensure drainage channels are clear 2) Do not spray any pesticide before rain 3) Harvest mature pods immediately 4) Apply fungicide after rain stops. Stay safe!',
    upvotes: [],
    views: 567,
    isExpert: true,
    replies: [
      { authorName: 'Ganesh Rao', authorRole: 'farmer', content: 'Thank you for the warning! Started harvesting my soybean today.', createdAt: new Date(Date.now() - 7200000) },
    ],
  },
  {
    authorName: 'Priya Kumari',
    authorRole: 'farmer',
    type: 'voice',
    category: 'techniques',
    title: 'My experience with drip irrigation — voice note',
    content: '',
    audioTranscript: 'Namaste! I switched to drip irrigation 6 months ago on my 2-acre vegetable farm. Initially, installation cost ₹18,000 per acre but it reduced my water usage by 40% and my electricity bill went down significantly. The plants grow much better because water goes directly to roots. I highly recommend it for all vegetable farmers. Government also gives 50% subsidy under PMKSY scheme.',
    upvotes: [],
    views: 178,
    isExpert: false,
    replies: [],
  },
];

async function ensureSeeded() {
  const count = await CommunityPost.countDocuments();
  if (count === 0) {
    await CommunityPost.insertMany(SEED_POSTS);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'recent';

  try {
    await dbConnect();
    await ensureSeeded();

    let query = {};
    if (category && category !== 'all') query.category = category;

    let sortObj = {};
    if (sort === 'popular') sortObj = { views: -1 };
    else if (sort === 'upvoted') sortObj = { 'upvotes': -1 };
    else sortObj = { createdAt: -1 };

    const posts = await CommunityPost.find(query).sort(sortObj).limit(50).lean();
    return NextResponse.json(posts);
  } catch (err) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Handle upvote action
    if (body.action === 'upvote') {
      const post = await CommunityPost.findById(body.postId);
      if (post) {
        const idx = post.upvotes.indexOf(body.userId);
        if (idx > -1) post.upvotes.splice(idx, 1);
        else post.upvotes.push(body.userId);
        await post.save();
        return NextResponse.json({ upvotes: post.upvotes.length });
      }
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Handle reply action
    if (body.action === 'reply') {
      const post = await CommunityPost.findById(body.postId);
      if (post) {
        post.replies.push({
          authorId: body.authorId,
          authorName: body.authorName,
          authorRole: body.authorRole,
          content: body.content,
        });
        await post.save();
        return NextResponse.json({ success: true, replies: post.replies });
      }
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Create new post
    const { authorId, authorName, authorRole, type, category, title, content, audioTranscript } = body;
    const post = await CommunityPost.create({
      authorId, authorName, authorRole, type, category, title, content, audioTranscript,
    });
    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
