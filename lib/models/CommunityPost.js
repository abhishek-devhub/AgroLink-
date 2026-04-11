import mongoose from 'mongoose';

const CommunityPostSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, enum: ['farmer', 'buyer'], default: 'farmer' },
  type: { type: String, enum: ['text', 'voice', 'tip', 'question'], default: 'text' },
  category: { type: String, enum: ['pest-control', 'techniques', 'market-tips', 'weather', 'success-story', 'general'], default: 'general' },
  title: { type: String, required: true },
  content: { type: String, default: '' },
  audioTranscript: { type: String, default: '' },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId }],
  replies: [{
    authorId: { type: mongoose.Schema.Types.ObjectId },
    authorName: { type: String },
    authorRole: { type: String },
    content: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  isExpert: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.CommunityPost || mongoose.model('CommunityPost', CommunityPostSchema);
