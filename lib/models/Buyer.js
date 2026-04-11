import mongoose from 'mongoose';

const BuyerSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  ownerName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  businessType: { type: String, enum: ['Retailer', 'Wholesaler', 'Restaurant', 'Exporter'], required: true },
  gstin: { type: String },
  address: { type: String, default: '' },
  pincode: { type: String, default: '' },
  city: { type: String, required: true },
  state: { type: String, required: true },
  password: { type: String, required: true },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  completedOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  memberSince: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Buyer || mongoose.model('Buyer', BuyerSchema);
