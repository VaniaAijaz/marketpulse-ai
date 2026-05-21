const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // 👤 IDENTITY (ONLY AUTH RELATED)
  phone: { type: String, required: true, unique: true, index: true },
  email: { type: String },

  // 🧑 BASIC PROFILE
  name: { type: String },
  password: { type: String }, // if not using OTP login

 
  plan: {
    type: String,
    enum: ["free", "basic", "pro", "enterprise"],
    default: "free"
  },

  // 📊 GLOBAL USAGE (OPTIONAL LIMIT CONTROL)
  usage: {
    aiMessagesUsed: { type: Number, default: 0 },
    lastReset: { type: Date, default: Date.now }
  },

  // 🔐 ACCOUNT STATUS
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },

  // 🔗 AUTH PROVIDERS (FUTURE READY)
  authProvider: {
    type: String,
    enum: ["local", "google", "facebook", "otp"],
    default: "otp"
  },

  // ⏱ TIMESTAMPS
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);