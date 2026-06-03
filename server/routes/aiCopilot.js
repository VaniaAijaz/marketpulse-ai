const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { generateMessage } = require('../services/aiService');
const Order    = require('../models/Order');
const Customer = require('../models/Customer');
const Product  = require('../models/Product');
const mongoose = require('mongoose');

router.use(auth);

// ── Helper: gather shop context (reused by all endpoints) ─
async function buildShopContext(shopId) {
  const sid = new mongoose.Types.ObjectId(shopId);
  const since7  = new Date(Date.now() - 7  * 86400000);
  const since30 = new Date(Date.now() - 30 * 86400000);

  const [orders7, orders30, customers, products] = await Promise.all([
    Order.aggregate([
      { $match: { shopId: sid, createdAt: { $gte: since7 } } },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } },
    ]),
    Order.aggregate([
      { $match: { shopId: sid, createdAt: { $gte: since30 } } },
      { $group: { _id: null, total: { $sum: 1 }, revenue: { $sum: '$pricing.total' }, cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } } } },
    ]),
    Customer.aggregate([
      { $match: { shopId: sid, isActive: true } },
      { $group: { _id: '$segment', count: { $sum: 1 } } },
    ]),
    Product.aggregate([
      { $match: { shopId: sid, isActive: true } },
      { $group: { _id: null, total: { $sum: 1 }, inStock: { $sum: { $cond: [{ $gt: ['$stock.quantity', 0] }, 1, 0] } }, lowStock: { $sum: { $cond: [{ $and: [{ $gt: ['$stock.quantity', 0] }, { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] }] }, 1, 0] } }, outOfStock: { $sum: { $cond: [{ $eq: ['$stock.quantity', 0] }, 1, 0] } } } },
    ]),
  ]);

  const statsMap7  = orders7.reduce((a, s) => { a[s._id] = { count: s.count, revenue: s.revenue }; return a; }, {});
  const stats30    = orders30[0] || { total: 0, revenue: 0, cancelled: 0 };
  const custMap    = customers.reduce((a, s) => { a[s._id] = s.count; return a; }, {});
  const inv        = products[0] || { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 };

  const rev7       = orders7.filter(s => s._id !== 'cancelled').reduce((s, o) => s + o.revenue, 0);
  const orders7cnt = orders7.reduce((s, o) => s + o.count, 0);

  return {
    revenue7d:     Math.round(rev7),
    orders7d:      orders7cnt,
    revenue30d:    Math.round(stats30.revenue),
    orders30d:     stats30.total,
    cancelled30d:  stats30.cancelled,
    cancelRate:    stats30.total > 0 ? ((stats30.cancelled / stats30.total) * 100).toFixed(1) : '0',
    customers:     custMap,
    totalCustomers: Object.values(custMap).reduce((a, b) => a + b, 0),
    inventory:     inv,
    pendingOrders: statsMap7['pending']?.count  || 0,
    deliveredOrders: statsMap7['completed']?.count || statsMap7['delivered']?.count || 0,
  };
}

// ── POST /api/ai/copilot/chat ─────────────────────────────
// Contextual Q&A — enriches user question with real store data
router.post('/copilot/chat', asyncHandler(async (req, res) => {
  const { shopId, question } = req.body;
  if (!shopId || !question) return res.status(400).json({ success: false, error: 'shopId and question required' });

  const ctx = await buildShopContext(shopId);

  const prompt = `You are MarketPulse AI — a business copilot for a Pakistani retail shop.

CURRENT STORE DATA (real-time):
- Revenue last 7 days: Rs.${ctx.revenue7d}
- Orders last 7 days: ${ctx.orders7d}
- Revenue last 30 days: Rs.${ctx.revenue30d}
- Cancellation rate: ${ctx.cancelRate}%
- Customers: VIP=${ctx.customers.vip || 0}, Active=${ctx.customers.active || 0}, Inactive=${ctx.customers.inactive || 0}, New=${ctx.customers.new || 0}
- Inventory: ${ctx.inventory.inStock} in stock, ${ctx.inventory.lowStock} low stock, ${ctx.inventory.outOfStock} out of stock
- Pending orders: ${ctx.pendingOrders}

SHOPKEEPER'S QUESTION: ${question}

Answer in Hinglish (Urdu + English mix). Be specific, practical, and brief (max 150 words). Reference the actual numbers above where relevant.`;

  const result = await generateMessage({ shopId, prompt });
  res.json({ success: true, data: { answer: result.message, context: ctx } });
}));

// ── POST /api/ai/copilot/report ───────────────────────────
router.post('/copilot/report', asyncHandler(async (req, res) => {
  const { shopId, period = 'weekly' } = req.body;
  const ctx = await buildShopContext(shopId);

  const periods = { daily: '24 hours', weekly: '7 days', monthly: '30 days' };
  const rev     = period === 'monthly' ? ctx.revenue30d : ctx.revenue7d;
  const orders  = period === 'monthly' ? ctx.orders30d  : ctx.orders7d;

  const prompt = `You are a business report generator for a Pakistani retail shop.

PERIOD: Last ${periods[period]}
STORE DATA:
- Total Revenue: Rs.${rev}
- Total Orders: ${orders}
- Cancelled Orders: ${period === 'monthly' ? ctx.cancelled30d : Math.round(ctx.cancelled30d / 4)}
- Cancellation Rate: ${ctx.cancelRate}%
- Pending Orders: ${ctx.pendingOrders}
- Customers — VIP: ${ctx.customers.vip || 0}, Active: ${ctx.customers.active || 0}, New: ${ctx.customers.new || 0}, Inactive: ${ctx.customers.inactive || 0}
- Inventory — In Stock: ${ctx.inventory.inStock}, Low Stock: ${ctx.inventory.lowStock}, Out of Stock: ${ctx.inventory.outOfStock}

Generate a structured ${period} business report in Hinglish with these sections:
1. 📊 Sales Summary
2. 👥 Customer Overview
3. 📦 Inventory Status
4. ⚠️ Key Issues (if any)
5. ✅ Recommended Actions (3 specific, actionable)

Keep each section to 2-3 sentences. Be practical and specific to the numbers above.`;

  const result = await generateMessage({ shopId, prompt });
  res.json({ success: true, data: { report: result.message, period, generatedAt: new Date(), context: ctx } });
}));

// ── POST /api/ai/copilot/advise ───────────────────────────
router.post('/copilot/advise', asyncHandler(async (req, res) => {
  const { shopId, topic } = req.body;
  const ctx = await buildShopContext(shopId);

  const topicPrompts = {
    weekend_sales:    'How can I increase weekend sales?',
    customer_retention: 'How can I retain more customers and reduce churn?',
    inventory_optimization: 'How should I optimize my inventory based on current data?',
    pricing_strategy: 'What pricing strategies should I use to maximize revenue?',
    inactive_customers: 'How should I re-engage my inactive customers?',
  };

  const question = topicPrompts[topic] || topic || 'What should I focus on this week to improve my business?';

  const prompt = `You are a senior retail business advisor for Pakistani small shops.

STORE PERFORMANCE DATA:
- Revenue 7d: Rs.${ctx.revenue7d} | Revenue 30d: Rs.${ctx.revenue30d}
- Orders 7d: ${ctx.orders7d} | Cancellation rate: ${ctx.cancelRate}%
- VIP customers: ${ctx.customers.vip || 0} | Inactive: ${ctx.customers.inactive || 0} | New: ${ctx.customers.new || 0}
- Low stock items: ${ctx.inventory.lowStock} | Out of stock: ${ctx.inventory.outOfStock}

QUESTION: ${question}

Give 3-5 specific, actionable recommendations in Hinglish. Each point should:
- Start with an action verb
- Be specific to the numbers shown above
- Be realistic for a small Pakistani retail shop
Format as numbered list.`;

  const result = await generateMessage({ shopId, prompt });
  res.json({ success: true, data: { advice: result.message, topic, context: ctx } });
}));

// ── GET /api/ai/copilot/alerts/:shopId ────────────────────
// Pure DB query — no AI tokens used
router.get('/copilot/alerts/:shopId', asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const ctx    = await buildShopContext(shopId);
  const alerts = [];

  // Low stock alert
  if (ctx.inventory.lowStock > 0) {
    const lowItems = await Product.find({ shopId, isActive: true, 'stock.quantity': { $gt: 0 } })
      .where('stock.quantity').lte(5).select('name stock.quantity stock.lowStockThreshold').limit(5).lean();
    alerts.push({
      id: 'low_stock', type: 'warning', icon: 'inventory_2', color: '#f59e0b',
      title: `${ctx.inventory.lowStock} Products Running Low`,
      desc: `Restock soon: ${lowItems.map(p => p.name).join(', ')}`,
      action: 'View Inventory', actionPath: `/dashboard/shops/${shopId}/inventory`,
    });
  }

  // Out of stock alert
  if (ctx.inventory.outOfStock > 0) {
    alerts.push({
      id: 'out_of_stock', type: 'critical', icon: 'warning', color: '#f43f5e',
      title: `${ctx.inventory.outOfStock} Products Out of Stock`,
      desc: 'Customers cannot order these items. Restock immediately.',
      action: 'Fix Now', actionPath: `/dashboard/shops/${shopId}/inventory`,
    });
  }

  // High cancellation rate
  if (parseFloat(ctx.cancelRate) > 15) {
    alerts.push({
      id: 'high_cancellation', type: 'warning', icon: 'cancel', color: '#f43f5e',
      title: `High Cancellation Rate: ${ctx.cancelRate}%`,
      desc: 'More than 15% of orders are being cancelled. Review pricing or delivery.',
      action: 'View Orders', actionPath: '/dashboard/orders',
    });
  }

  // Revenue drop (compare 7d vs expected from 30d average)
  const avgDailyRev30 = ctx.revenue30d / 30;
  const avgDailyRev7  = ctx.revenue7d  / 7;
  if (avgDailyRev30 > 0 && avgDailyRev7 < avgDailyRev30 * 0.7) {
    const drop = Math.round((1 - avgDailyRev7 / avgDailyRev30) * 100);
    alerts.push({
      id: 'revenue_drop', type: 'warning', icon: 'trending_down', color: '#f43f5e',
      title: `Revenue Down ${drop}% This Week`,
      desc: `Daily avg this week: Rs.${Math.round(avgDailyRev7)} vs last 30d avg: Rs.${Math.round(avgDailyRev30)}`,
      action: 'View Analytics', actionPath: '/dashboard/analytics',
    });
  }

  // Inactive customers
  if ((ctx.customers.inactive || 0) > 3) {
    alerts.push({
      id: 'inactive_customers', type: 'info', icon: 'person_off', color: '#1390ff',
      title: `${ctx.customers.inactive} Inactive Customers`,
      desc: 'These customers haven\'t visited in 30+ days. Send a re-engagement campaign.',
      action: 'Send Campaign', actionPath: '/dashboard/whatsapp',
    });
  }

  // Pending orders
  if (ctx.pendingOrders > 5) {
    alerts.push({
      id: 'pending_orders', type: 'info', icon: 'schedule', color: '#f59e0b',
      title: `${ctx.pendingOrders} Pending Orders`,
      desc: 'Multiple orders are waiting. Process them to improve customer experience.',
      action: 'View Orders', actionPath: '/dashboard/orders',
    });
  }

  res.json({ success: true, data: { alerts, generatedAt: new Date(), context: { ...ctx } } });
}));

module.exports = router;
