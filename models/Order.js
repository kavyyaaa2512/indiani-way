const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    customerAddress: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    products: { type: Array, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'Pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
