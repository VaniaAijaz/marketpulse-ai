const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
    index: true
  },

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    index: true
  },

  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer"
  },

  amount: { type: Number, required: true },
  currency: { type: String, default: "PKR" },

  method: {
    type: String,
    enum: ["cash", "card", "jazzcash", "easypaisa", "bank", "online"],
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "success", "failed", "refunded"],
    default: "pending",
    index: true
  },

  gateway: {
    name: String,           // easypaisa, jazzcash
    transactionId: String,
    response: Object
  },

  paidAt: Date,
  failedReason: String

}, { timestamps: true });
  
paymentSchema.index({ shopId: 1, status: 1, createdAt: -1 });

// Method: Mark success
paymentSchema.methods.markSuccess = function(transactionId, gatewayResponse) {
  this.status = 'success';
  this.paidAt = new Date();
  this.gateway.transactionId = transactionId;
  this.gateway.response = gatewayResponse;
  return this.save();
};

// Method: Mark failed
paymentSchema.methods.markFailed = function(reason) {
  this.status = 'failed';
  this.failedReason = reason;
  return this.save();
};

module.exports = mongoose.model("Payment", paymentSchema);