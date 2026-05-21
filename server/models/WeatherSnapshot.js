const mongoose = require("mongoose");

const weatherSnapshotSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true
  },

  location: {
    city: String,
    lat: Number,
    lng: Number
  },

  weather: {
    temp: Number,
    feelsLike: Number,
    humidity: Number,
    windSpeed: Number,
    condition: String,
    description: String
  },

  context: {
    mood: String,
    suggestion: String
  },

  fetchedAt: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

// Fast lookup per shop
weatherSnapshotSchema.index({ shopId: 1, fetchedAt: -1 });

// Auto delete after 30 days
weatherSnapshotSchema.index(
  { fetchedAt: 1 },
  { expireAfterSeconds: 2592000 }
);

module.exports = mongoose.model("WeatherSnapshot", weatherSnapshotSchema);