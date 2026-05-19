const mongoose = require("mongoose");

const aiRequestLogSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
    index: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },

  endpoint: {
    type: String,
    required: true,
    enum: ["generate_message", "generate_post", "analyze_sentiment", "suggest_reply"],
    index: true
  },

  // Token usage
  promptTokens: { type: Number, default: 0 },
  completionTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 },
  
  model: {
    type: String,
    default: "gemini-1.5-flash"
  },

  // Cost in PKR - Gemini 1.5 Flash pricing
  costPKR: { type: Number, default: 0 },

  // Status
  status: {
    type: String,
    enum: ["success", "failed", "rate_limited", "timeout"],
    default: "success",
    index: true
  },

  responseTimeMs: { type: Number, default: 0 },
  errorMessage: { type: String },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
    expires: "90d" // Auto delete after 90 days
  }

}, { timestamps: true });

aiRequestLogSchema.index({ shopId: 1, createdAt: -1 });
aiRequestLogSchema.index({ shopId: 1, endpoint: 1, createdAt: -1 });

// Gemini 1.5 Flash pricing as of Sept 2025
// Input: $0.075 / 1M tokens, Output: $0.30 / 1M tokens
// 1 USD = 280 PKR approx
const GEMINI_PRICING = {
  inputPer1k: (0.075 / 1000) * 280,   // 0.021 PKR per 1k input tokens
  outputPer1k: (0.30 / 1000) * 280    // 0.084 PKR per 1k output tokens
};

// Statics: Check daily limit
aiRequestLogSchema.statics.checkDailyLimit = async function(shopId) {
  const Shop = mongoose.model("Shop");
  const shop = await Shop.findById(shopId).select("plan dailyAiLimit");

  if (!shop) return { allowed: false, reason: "Shop not found" };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const usedToday = await this.countDocuments({
    shopId,
    status: "success",
    createdAt: { $gte: startOfDay }
  });

  const allowed = usedToday < shop.dailyAiLimit;

  return {
    allowed,
    usedToday,
    limit: shop.dailyAiLimit,
    remaining: Math.max(0, shop.dailyAiLimit - usedToday),
    reason: allowed ? null : "Daily AI limit reached"
  };
};

// Statics: Log Gemini request
aiRequestLogSchema.statics.logRequest = async function(data) {
  const totalTokens = data.promptTokens + data.completionTokens;
  
  // Calculate cost for Gemini 1.5 Flash
  const inputCost = (data.promptTokens / 1000) * GEMINI_PRICING.inputPer1k;
  const outputCost = (data.completionTokens / 1000) * GEMINI_PRICING.outputPer1k;
  const costPKR = inputCost + outputCost;

  const log = await this.create({
    ...data,
    model: "gemini-1.5-flash",
    totalTokens,
    costPKR: parseFloat(costPKR.toFixed(6))
  });

  return log;
};

// Statics: Get daily stats
aiRequestLogSchema.statics.getDailyStats = async function(shopId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        shopId: new mongoose.Types.ObjectId(shopId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        requests: { $sum: 1 },
        tokens: { $sum: "$totalTokens" },
        costPKR: { $sum: "$costPKR" },
        avgResponseTime: { $avg: "$responseTimeMs" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return stats;
};

module.exports = mongoose.model("AiRequestLog", aiRequestLogSchema);