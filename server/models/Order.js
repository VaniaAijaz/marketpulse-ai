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

  customerPhone: {
    type: String,
    index: true
  },

  customerName: String,

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
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
    index: true
  },

  // Cancellation
  cancelReason: String,

  // Timestamps per state
  confirmedAt:  Date,
  completedAt:  Date,
  cancelledAt:  Date,

  // Immutable audit trail — one entry per transition
  statusHistory: [{
    from:      { type: String },
    to:        { type: String },
    changedAt: { type: Date, default: Date.now },
    note:      { type: String },
  }],

  notes: String,
  deliveryAddress: String,
  deliveredAt: Date   // kept for backward compat

}, { timestamps: true });

// Indexes
orderSchema.index({ shopId: 1, createdAt: -1 });
orderSchema.index({ shopId: 1, status: 1 });
orderSchema.index({ customerId: 1, createdAt: -1 });

// Auto generate order number before save
orderSchema.pre('save', async function () {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments({ shopId: this.shopId });
    this.orderNumber = `ORD-${Date.now()}-${count + 1}`;
  }

  // Calculate item totals
  this.items.forEach(item => {
    item.total = item.qty * item.price;
  });
});

// Method: complete order via state machine (replaces markDelivered)
orderSchema.methods.markDelivered = async function() {
  const { transitionOrderStatus, STATUS } = require('../utils/orderStateMachine');
  return transitionOrderStatus(this, STATUS.COMPLETED);
};

module.exports = mongoose.model("Order", orderSchema);