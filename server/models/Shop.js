const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  name: { type: String, required: true, trim: true },

  businessType: {
    type: String,
    enum: ["grocery", "clothing", "pharmacy", "restaurant", "electronics", "other"],
    default: "other"
  },

  description: String,

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    },
    address: String,
    city: String,
    area: String,
    street: String,
  },

  contact: {
    phone: String,
    whatsappNumber: String,
    email: String
  },

  ai: {
    autoReplyEnabled: { type: Boolean, default: true },
    personality: {
      type: String,
      enum: ["friendly", "professional", "sales", "support"],
      default: "friendly"
    },
    language: { type: String, default: "ur-en" },
    responseMode: {
      type: String,
      enum: ["fast", "balanced", "smart"],
      default: "balanced"
    },
    systemPrompt: String
  },

  whatsapp: {
    connected: { type: Boolean, default: false },
    sessionId: String,
    lastActive: Date
  },

  social: {
    facebookPageId: String,
    facebookPageToken: { type: String, select: false },
    instagramHandle: String
  },

  plan: {
    type: String,
    enum: ["free", "basic", "pro", "enterprise"],
    default: "free"
  },

  limits: {
    aiMessagesPerDay: { type: Number, default: 50 },
    customersLimit: { type: Number, default: 200 }
  },

  usage: {
    aiMessagesUsedToday: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now }
  },

  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false }

}, { timestamps: true });

// indexes
shopSchema.index({ location: "2dsphere" });
shopSchema.index({ ownerId: 1, name: 1 }, { unique: true });

// reset method
shopSchema.methods.resetDailyUsage = function () {
  const today = new Date().toDateString();
  const lastReset = new Date(this.usage.lastResetDate).toDateString();

  if (today !== lastReset) {
    this.usage.aiMessagesUsedToday = 0;
    this.usage.lastResetDate = new Date();
  }
};

module.exports = mongoose.model("Shop", shopSchema);