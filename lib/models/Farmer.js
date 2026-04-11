import mongoose from 'mongoose';

const FarmerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  village: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  address: { type: String, default: '' },
  pincode: { type: String, default: '' },
  phone: { type: String, required: true, unique: true },
  crops: [{ type: String }],
  landSize: { type: Number },
  aadhaar: { type: String },
  password: { type: String, required: true },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  completedOrders: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  memberSince: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Farmer || mongoose.model('Farmer', FarmerSchema);
