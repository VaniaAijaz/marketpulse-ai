const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  shopId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  name:     { type: String, required: true },
  segment:  { type: String, enum: ['all', 'vip', 'active', 'regular', 'new', 'inactive'], default: 'all' },
  message:  { type: String, required: true },
  couponCode:   { type: String },
  couponExpiry: { type: Date },

  status: {
    type: String,
    enum: ['draft', 'sending', 'sent', 'scheduled', 'failed'],
    default: 'draft',
    index: true,
  },

  // Scheduling
  scheduledAt: { type: Date, index: true },

  // Stats (denormalized)
  stats: {
    recipientCount: { type: Number, default: 0 },
    sentCount:      { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    readCount:      { type: Number, default: 0 },
    failedCount:    { type: Number, default: 0 },
  },

  // Automation rule (if created by automation)
  automation: {
    trigger: { type: String, enum: ['manual', 'new_customer', 'inactive', 'vip_reward', 'order_complete', 'welcome'], default: 'manual' },
  },

  sentAt:    { type: Date },
  createdBy: { type: String, enum: ['manual', 'ai', 'system'], default: 'manual' },
}, { timestamps: true });

campaignSchema.index({ shopId: 1, status: 1, createdAt: -1 });
campaignSchema.index({ shopId: 1, scheduledAt: 1 }, { sparse: true });

module.exports = mongoose.model('Campaign', campaignSchema);
