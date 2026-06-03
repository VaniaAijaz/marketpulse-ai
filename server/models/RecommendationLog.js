const mongoose = require('mongoose');

const recommendationLogSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true
  },

  // Weather context at time of recommendation
  weatherContext: {
    temp: Number,
    condition: String,
    mood: String,
    city: String
  },

  // Nearby places context
  nearbyPlaces: {
    school: Number,
    university: Number,
    office: Number,
    hospital: Number,
    restaurant: Number,
    shop: Number
  },

  // AI output
  recommendations: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      productName: String,
      reason: String,
      expectedUplift: String,
      status: {
        type: String,
        enum: ['pending', 'displayed', 'acted', 'dismissed'],
        default: 'pending'
      },
      actedAt: Date
    }
  ],

  insight: String,
  dominantCustomers: [String],
  confidenceScore: Number,

  // Tracking
  generatedAt: { type: Date, default: Date.now },
  displayedAt: Date,

}, { timestamps: true });

recommendationLogSchema.index({ shopId: 1, generatedAt: -1 });

// Auto delete after 90 days
recommendationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('RecommendationLog', recommendationLogSchema);
