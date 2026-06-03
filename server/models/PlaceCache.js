const mongoose = require('mongoose');

const placeCacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
    // Format: "lat_lng" rounded to 3 decimals e.g. "24.861_67.001"
  },
  data: {
    school: { type: Number, default: 0 },
    university: { type: Number, default: 0 },
    office: { type: Number, default: 0 },
    hospital: { type: Number, default: 0 },
    gym: { type: Number, default: 0 },
    shop: { type: Number, default: 0 },
    restaurant: { type: Number, default: 0 },
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  fetchedAt: { type: Date, default: Date.now }
});

// Static: get from cache or return null
placeCacheSchema.statics.getCache = async function(lat, lng) {
  const key = `${parseFloat(lat).toFixed(3)}_${parseFloat(lng).toFixed(3)}`;
  const cached = await this.findOne({ key, expiresAt: { $gt: new Date() } });
  return cached ? cached.data : null;
};

// Static: save to cache with 24h TTL
placeCacheSchema.statics.setCache = async function(lat, lng, data) {
  const key = `${parseFloat(lat).toFixed(3)}_${parseFloat(lng).toFixed(3)}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await this.findOneAndUpdate(
    { key },
    { key, data, expiresAt, fetchedAt: new Date() },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('PlaceCache', placeCacheSchema);
