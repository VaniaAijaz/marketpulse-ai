const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
    index: true
  },

  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  category: {
    type: String,
    enum: ["food", "beverage", "grocery", "mobile", "clothing", "other"],
    default: "other",
    index: true
  },

  description: String,

  pricing: {
    costPrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, required: true },
    currency: { type: String, default: "PKR" }
  },

  stock: {
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: "pcs" }, // pcs, kg, ltr
    lowStockThreshold: { type: Number, default: 5 }
  },

  aiMeta: {
    keywords: [String], // AI post ke liye keywords
    isTrending: { type: Boolean, default: false },
    lastGeneratedPostAt: Date
  },

  isActive: { type: Boolean, default: true },
  imageUrl: String

}, { timestamps: true });

// Compound index for fast shop product queries
productSchema.index({ shopId: 1, name: 1 }, { unique: true });
productSchema.index({ shopId: 1, category: 1 });

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (!this.pricing.costPrice ||!this.pricing.sellingPrice) return 0;
  return ((this.pricing.sellingPrice - this.pricing.costPrice) / this.pricing.sellingPrice * 100).toFixed(2);
});

// Method: Check low stock
productSchema.methods.isLowStock = function() {
  return this.stock.quantity <= this.stock.lowStockThreshold;
};

module.exports = mongoose.model("Product", productSchema);