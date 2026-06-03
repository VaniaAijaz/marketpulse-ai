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
    enum: ["new", "active", "regular", "vip", "inactive", "blocked"],
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
  firstVisit:    { type: Date, default: Date.now },
  lastVisit:     { type: Date, default: Date.now, index: true },
  lastOrderDate: { type: Date, index: true },  // set only on paid orders

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
customerSchema.index({ shopId: 1, 'stats.totalSpent': -1 });
customerSchema.index({ shopId: 1, lastOrderDate: 1 }); // for cron inactive sweep

// ── pre-save: recalculate avgOrderValue + segment ────────
customerSchema.pre('save', function () {
  // Keep avgOrderValue in sync
  if (this.stats.totalOrders > 0) {
    this.stats.avgOrderValue = this.stats.totalSpent / this.stats.totalOrders;
  }

  // Only recalculate segment when relevant fields changed
  const tracked = ['isBlocked', 'stats.totalOrders', 'stats.totalSpent', 'lastOrderDate'];
  const changed = this.isNew || tracked.some(f => this.isModified(f));

  if (changed) {
    const { calculateSegment } = require('../utils/customerSegment');
    this.segment = calculateSegment({
      isBlocked:     this.isBlocked,
      totalOrders:   this.stats.totalOrders,
      totalSpent:    this.stats.totalSpent,
      lastOrderDate: this.lastOrderDate ?? this.lastVisit ?? null,
    });
  }
  // No next() needed — promise-based hook
});

// ── updateActivity: called on every paid order ───────────
customerSchema.methods.updateActivity = function (orderAmount) {
  this.stats.totalOrders    += 1;
  this.stats.totalSpent     += orderAmount;
  this.stats.lastOrderAmount = orderAmount;
  this.stats.visitCount     += 1;
  this.lastVisit             = new Date();
  this.lastOrderDate         = new Date();
  // segment recalculated automatically in pre('save')
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