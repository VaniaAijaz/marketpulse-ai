const mongoose = require("mongoose");

const messageLogSchema = new mongoose.Schema({
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

  // Recipient
  recipient: {
    phone: { type: String, required: true, index: true },
    name: String
  },

  // Message Content
  type: {
    type: String,
    enum: ["text", "template", "image", "document", "interactive"],
    default: "text"
  },
  message: {
    body: { type: String, required: true },
    header: String,
    footer: String,
    buttons: [{
      id: String,
      title: String
    }],
    mediaUrl: String
  },

  // Campaign & Trigger
  campaign: {
    id: mongoose.Schema.Types.ObjectId,
    name: String, // "Inactive Customer Reminder"
    trigger: {
      type: String,
      enum: ["manual", "auto_inactive", "auto_birthday", "auto_post_purchase", "ai_reply"],
      default: "manual"
    }
  },

  // WhatsApp API Response
  whatsapp: {
    messageId: String, // WA message ID for webhook tracking
    status: {
      type: String,
      enum: ["queued", "sent", "delivered", "read", "failed", "pending"],
      default: "queued",
      index: true
    },
    errorCode: String,
    errorMessage: String,
    cost: { type: Number, default: 0 } // per message cost if using official API
  },

  // Delivery Timeline
  timestamps: {
    queuedAt: { type: Date, default: Date.now },
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    failedAt: Date
  },

  // Retry Logic
  retry: {
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    nextRetryAt: Date,
    lastError: String
  },

  // Meta
  metadata: {
    createdBy: { type: String, enum: ["system", "admin", "ai"], default: "system" },
    ipAddress: String,
    userAgent: String
  }

}, { timestamps: true });

// Indexes for performance
messageLogSchema.index({ shopId: 1, "whatsapp.status": 1, createdAt: -1 });
messageLogSchema.index({ shopId: 1, "campaign.trigger": 1, createdAt: -1 });
messageLogSchema.index({ "recipient.phone": 1, createdAt: -1 });
messageLogSchema.index({ "retry.nextRetryAt": 1 }, { sparse: true }); // for cron retry jobs

// Methods
messageLogSchema.methods.markSent = function(messageId) {
  this.whatsapp.status = "sent";
  this.whatsapp.messageId = messageId;
  this.timestamps.sentAt = new Date();
  return this.save();
};

messageLogSchema.methods.markDelivered = function() {
  this.whatsapp.status = "delivered";
  this.timestamps.deliveredAt = new Date();
  return this.save();
};

messageLogSchema.methods.markRead = function() {
  this.whatsapp.status = "read";
  this.timestamps.readAt = new Date();
  return this.save();
};

messageLogSchema.methods.markFailed = function(errorCode, errorMessage) {
  this.whatsapp.status = "failed";
  this.whatsapp.errorCode = errorCode;
  this.whatsapp.errorMessage = errorMessage;
  this.timestamps.failedAt = new Date();
  
  // Handle retry
  if (this.retry.attempts < this.retry.maxAttempts) {
    this.retry.attempts += 1;
    this.retry.lastError = errorMessage;
    // Exponential backoff: 1min, 5min, 15min
    const delay = Math.pow(5, this.retry.attempts) * 60 * 1000;
    this.retry.nextRetryAt = new Date(Date.now() + delay);
    this.whatsapp.status = "pending";
  }
  
  return this.save();
};

// Statics
messageLogSchema.statics.getFailedForRetry = function() {
  return this.find({
    "whatsapp.status": "pending",
    "retry.nextRetryAt": { $lte: new Date() },
    "retry.attempts": { $lt: "$retry.maxAttempts" }
  }).limit(100);
};

messageLogSchema.statics.getStats = function(shopId, startDate, endDate) {
  return this.aggregate([
    { $match: { 
      shopId: new mongoose.Types.ObjectId(shopId),
      createdAt: { $gte: startDate, $lte: endDate }
    }},
    { $group: {
      _id: "$whatsapp.status",
      count: { $sum: 1 }
    }}
  ]);
};

// Virtual for delivery rate
messageLogSchema.virtual('isDelivered').get(function() {
  return ["delivered", "read"].includes(this.whatsapp.status);
});

module.exports = mongoose.model("MessageLog", messageLogSchema);