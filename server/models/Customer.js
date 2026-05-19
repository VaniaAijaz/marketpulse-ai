const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
    index: true
  },

  // Contact Info
  phone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    trim: true,
    default: "Guest"
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },

  // Customer Profile
  segment: {
    type: String,
    enum: ["new", "regular", "vip", "inactive", "blocked"],
    default: "new",
    index: true
  },
  tags: [String], // ["chai_lover", "morning_customer", "high_spender"]

  // Activity & Stats - denormalized for speed
  stats: {
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0, index: true },
    avgOrderValue: { type: Number, default: 0 },
    lastOrderAmount: { type: Number, default: 0 },
    visitCount: { type: Number, default: 0 }
  },

  // Timeline
  firstVisit: { type: Date, default: Date.now },
  lastVisit: { type: Date, default: Date.now, index: true },
  lastOrderDate: Date,

  // Communication
  whatsappOptIn: { type: Boolean, default: true },
  preferredLanguage: {
    type: String,
    enum: ["ur", "en", "ur-en"],
    default: "ur-en"
  },
  notes: String, // "Always asks for extra sugar"

  // Status
  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  blockReason: String

}, { timestamps: true });

// Compound indexes for performance
customerSchema.index({ shopId: 1, phone: 1 }, { unique: true });
customerSchema.index({ shopId: 1, segment: 1, lastVisit: -1 });
customerSchema.index({ shopId: 1, "stats.totalSpent": -1 });

// Auto-update avgOrderValue before save
customerSchema.pre('save', function(next) {
  if (this.stats.totalOrders > 0) {
    this.stats.avgOrderValue = this.stats.totalSpent / this.stats.totalOrders;
  }

  // Auto-segment based on activity
  const daysSinceLastVisit = (Date.now() - this.lastVisit) / (1000 * 60 * 60 * 24);

  if (this.isBlocked) {
    this.segment = "blocked";
  } else if (daysSinceLastVisit > 30) {
    this.segment = "inactive";
  } else if (this.stats.totalSpent > 5000) {
    this.segment = "vip";
  } else if (this.stats.totalOrders > 5) {
    this.segment = "regular";
  } else {
    this.segment = "new";
  }

  next();
});

// Methods
customerSchema.methods.updateActivity = function(orderAmount) {
  this.stats.totalOrders += 1;
  this.stats.totalSpent += orderAmount;
  this.stats.lastOrderAmount = orderAmount;
  this.stats.visitCount += 1;
  this.lastVisit = new Date();
  this.lastOrderDate = new Date();
  return this.save();
};

customerSchema.methods.isInactive = function(days = 7) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);
  return this.lastVisit < threshold;
};

customerSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
  }
  return this.save();
};

// Statics for queries
customerSchema.statics.getInactiveCustomers = function(shopId, days = 7) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);
  return this.find({
    shopId,
    lastVisit: { $lt: threshold },
    isActive: true,
    isBlocked: false,
    whatsappOptIn: true
  });
};

customerSchema.statics.getTopCustomers = function(shopId, limit = 10) {
  return this.find({ shopId, isActive: true })
   .sort({ "stats.totalSpent": -1 })
   .limit(limit);
};

module.exports = mongoose.model("Customer", customerSchema);