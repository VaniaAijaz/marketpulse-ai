const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
    index: true
  },

  date: {
    type: Date,
    required: true,
    index: true
  },

  period: {
    type: String,
    enum: ["daily", "weekly", "monthly"],
    default: "daily",
    index: true
  },

  // Sales & Revenue
  sales: {
    totalRevenue: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    avgOrderValue: { type: Number, default: 0 },
    cashSales: { type: Number, default: 0 },
    digitalSales: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 }
  },

  // Customers
  customers: {
    newCustomers: { type: Number, default: 0 },
    returningCustomers: { type: Number, default: 0 },
    activeCustomers: { type: Number, default: 0 },
    churnedCustomers: { type: Number, default: 0 },
    topCustomerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    topCustomerSpent: { type: Number, default: 0 }
  },

  // AI & Messaging
  ai: {
    messagesGenerated: { type: Number, default: 0 },
    messagesSent: { type: Number, default: 0 },
    messagesDelivered: { type: Number, default: 0 },
    messagesRead: { type: Number, default: 0 },
    deliveryRate: { type: Number, default: 0 }, // %
    readRate: { type: Number, default: 0 }, // %
    tokensUsed: { type: Number, default: 0 },
    aiCost: { type: Number, default: 0 } // PKR
  },

  // Posts & Social
  social: {
    postsCreated: { type: Number, default: 0 },
    postsPublished: { type: Number, default: 0 },
    fbReach: { type: Number, default: 0 },
    fbEngagement: { type: Number, default: 0 },
    fbLikes: { type: Number, default: 0 },
    fbComments: { type: Number, default: 0 },
    fbShares: { type: Number, default: 0 }
  },

  // Products
  products: {
    topSellingProductId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    topSellingProductQty: { type: Number, default: 0 },
    lowStockCount: { type: Number, default: 0 },
    outOfStockCount: { type: Number, default: 0 }
  },

  // Metadata
  generatedAt: { type: Date, default: Date.now },
  isFinal: { type: Boolean, default: false } // false = partial day, true = day ended

}, { timestamps: true });

// Compound unique index - one doc per shop per day per period
analyticsSchema.index({ shopId: 1, date: 1, period: 1 }, { unique: true });
analyticsSchema.index({ shopId: 1, period: 1, date: -1 });

// Statics: Generate daily snapshot
analyticsSchema.statics.generateDailySnapshot = async function(shopId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Parallel aggregation for speed
  const [salesData, customerData, messageData, postData] = await Promise.all([
    this.aggregateSales(shopId, startOfDay, endOfDay),
    this.aggregateCustomers(shopId, startOfDay, endOfDay),
    this.aggregateMessages(shopId, startOfDay, endOfDay),
    this.aggregatePosts(shopId, startOfDay, endOfDay)
  ]);

  const doc = {
    shopId,
    date: startOfDay,
    period: "daily",
    sales: salesData,
    customers: customerData,
    ai: messageData,
    social: postData,
    generatedAt: new Date(),
    isFinal: true
  };

  return this.findOneAndUpdate(
    { shopId, date: startOfDay, period: "daily" },
    doc,
    { upsert: true, new: true }
  );
};

// Aggregation pipelines
analyticsSchema.statics.aggregateSales = async function(shopId, start, end) {
  const Order = mongoose.model("Order");

  const result = await Order.aggregate([
    {
      $match: {
        shopId: new mongoose.Types.ObjectId(shopId),
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: "$totalAmount" }
      }
    }
  ]);

  return result[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
};

analyticsSchema.statics.aggregateMessages = async function(shopId, start, end) {
  const MessageLog = mongoose.model("MessageLog");
  const result = await MessageLog.aggregate([
    { $match: { shopId: shopId, createdAt: { $gte: start, $lte: end } } },
    { $group: {
      _id: null,
      messagesSent: { $sum: 1 },
      messagesDelivered: {
        $sum: { $cond: [{ $in: ["$whatsapp.status", ["delivered", "read"]] }, 1, 0] }
      },
      messagesRead: {
        $sum: { $cond: [{ $eq: ["$whatsapp.status", "read"] }, 1, 0] }
      }
    }}
  ]);

  const data = result[0] || { messagesSent: 0, messagesDelivered: 0, messagesRead: 0 };
  data.deliveryRate = data.messagesSent > 0
   ? ((data.messagesDelivered / data.messagesSent) * 100).toFixed(2)
    : 0;
  data.readRate = data.messagesDelivered > 0
   ? ((data.messagesRead / data.messagesDelivered) * 100).toFixed(2)
    : 0;
  return data;
};

// Virtual for dashboard summary
analyticsSchema.virtual('summary').get(function() {
  return {
    revenue: this.sales.totalRevenue,
    orders: this.sales.totalOrders,
    newCustomers: this.customers.newCustomers,
    deliveryRate: this.ai.deliveryRate + "%",
    readRate: this.ai.readRate + "%"
  };
});

module.exports = mongoose.model("Analytics", analyticsSchema);