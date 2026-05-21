const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
    index: true
  },

  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    index: true
  },

  orderNumber: {
    type: String,
    unique: true,
    index: true
  },

  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    total: Number
  }],

  pricing: {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },

  payment: {
    method: { 
      type: String, 
      enum: ["cash", "card", "jazzcash", "easypaisa", "bank", "credit"],
      default: "cash"
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true
    },
    transactionId: String
  },

  status: {
    type: String,
    enum: ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"],
    default: "pending",
    index: true
  },

  notes: String,
  deliveryAddress: String,
  deliveredAt: Date

}, { timestamps: true });

// Indexes
orderSchema.index({ shopId: 1, createdAt: -1 });
orderSchema.index({ shopId: 1, status: 1 });
orderSchema.index({ customerId: 1, createdAt: -1 });

// Auto generate order number before save
orderSchema.pre('save', async function() {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments({ shopId: this.shopId });
    this.orderNumber = `ORD-${Date.now()}-${count + 1}`;
  }
  
  // Calculate item totals
  this.items.forEach(item => {
    item.total = item.qty * item.price;
  });
});

// Method: Update customer stats after order
orderSchema.methods.markDelivered = async function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  
  if (this.payment.status !== 'paid') {
    this.payment.status = 'paid';
  }

  await this.save();

  // Update customer stats
  if (this.customerId) {
    const Customer = mongoose.model('Customer');
    const customer = await Customer.findById(this.customerId);
    if (customer) {
      await customer.updateActivity(this.pricing.total);
    }
  }

  return this;
};

module.exports = mongoose.model("Order", orderSchema);