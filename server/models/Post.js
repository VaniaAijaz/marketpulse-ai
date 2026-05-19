const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
    index: true
  },

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    index: true
  },

  // AI Generated Content
  content: {
    urduText: { type: String, required: true },
    englishText: String,
    fullPost: { type: String, required: true }, // final combined post
    hashtags: [String],
    emojis: [String]
  },

  // Generation Metadata
  generation: {
    modelUsed: { type: String, default: "gemini-1.5-flash" },
    promptTokens: Number,
    completionTokens: Number,
    temperature: { type: Number, default: 0.7 },
    personality: String, // friendly, professional, sales
    languageMode: { type: String, default: "ur-en" }
  },

  // Publishing Status
  status: {
    type: String,
    enum: ["draft", "scheduled", "published", "failed"],
    default: "draft",
    index: true
  },

  // Publishing Records
  publishedTo: [{
    platform: { type: String, enum: ["facebook", "instagram", "whatsapp"] },
    postId: String, // FB post ID, WA message ID
    publishedAt: Date,
    status: { type: String, enum: ["success", "failed"] },
    errorMessage: String
  }],

  // Engagement Tracking
  analytics: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    lastUpdated: Date
  },

  // Scheduling
  scheduledFor: Date,
  createdBy: {
    type: String,
    enum: ["ai", "manual"],
    default: "ai"
  }

}, { timestamps: true });

// Indexes for dashboard queries
postSchema.index({ shopId: 1, status: 1, createdAt: -1 });
postSchema.index({ shopId: 1, scheduledFor: 1 });

// Method: Mark as published
postSchema.methods.markPublished = function(platform, postId) {
  this.status = "published";
  this.publishedTo.push({
    platform,
    postId,
    publishedAt: new Date(),
    status: "success"
  });
  return this.save();
};

// Virtual: Check if publishable
postSchema.virtual('isPublishable').get(function() {
  return this.status === "draft" && this.content.fullPost.length > 10;
});

module.exports = mongoose.model("Post", postSchema);