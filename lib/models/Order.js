import mongoose from 'mongoose';

const SupplyChainStepSchema = new mongoose.Schema({
  label: { type: String, required: true },
  status: { type: String, enum: ['complete', 'active', 'pending'], default: 'pending' },
  timestamp: { type: Date },
});

const PaymentSubSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, default: null },
  razorpayPaymentId: { type: String, default: null },
  razorpaySignature: { type: String, default: null },
  amount: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paidAt: { type: Date, default: null },
  method: { type: String, default: null },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
  farmerName: { type: String, required: true },
  buyerName: { type: String, required: true },
  crop: { type: String, required: true },
  variety: { type: String, default: '' },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'quintal' },
  agreedPrice: { type: Number, required: true },
  totalAmount: { type: Number, default: 0 },
  grade: { type: String, default: 'A' },
  status: { type: String, enum: ['pending', 'payment_pending', 'checkout_pending', 'confirmed', 'in_progress', 'completed'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  payment: { type: PaymentSubSchema, default: () => ({}) },
  supplyChainSteps: [SupplyChainStepSchema],
  batchId: { type: String },
  // Address snapshots
  farmerDistrict: { type: String, default: '' },
  farmerState: { type: String, default: '' },
  farmerAddress: { type: String, default: '' },
  farmerPincode: { type: String, default: '' },
  buyerCity: { type: String, default: '' },
  buyerState: { type: String, default: '' },
  buyerAddress: { type: String, default: '' },
  buyerPincode: { type: String, default: '' },
  // Courier / Shipment tracking
  shipmentId: { type: String, default: null },
  courierPartner: { type: String, enum: ['Delhivery', 'BlueDart', 'DTDC', 'India Post', 'Ekart', 'Professional Couriers', 'Other', null], default: null },
  courierTrackingUrl: { type: String, default: null },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
