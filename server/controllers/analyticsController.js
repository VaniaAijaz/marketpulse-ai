const Analytics  = require('../models/Analytics');
const Order      = require('../models/Order');
const Customer   = require('../models/Customer');
const Product    = require('../models/Product');
const mongoose   = require('mongoose');

// ── Timezone helper (Pakistan Standard Time = UTC+5) ─────
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

function startOfDayPKT(date) {
  // Convert to PKT, floor to midnight, convert back to UTC Date
  const pkt = new Date(date.getTime() + PKT_OFFSET_MS);
  pkt.setUTCHours(0, 0, 0, 0);
  return new Date(pkt.getTime() - PKT_OFFSET_MS);
}

function endOfDayPKT(date) {
  const pkt = new Date(date.getTime() + PKT_OFFSET_MS);
  pkt.setUTCHours(23, 59, 59, 999);
  return new Date(pkt.getTime() - PKT_OFFSET_MS);
}

// ── Today snapshot ────────────────────────────────────────
const getTodayAnalytics = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const today = startOfDayPKT(new Date());
    let analytics = await Analytics.findOne({ shopId, date: today, period: 'daily' });
    if (!analytics) analytics = await Analytics.generateDailySnapshot(shopId, today);
    res.json({ success: true, data: analytics });
  } catch (err) { next(err); }
};

// ── Date range ────────────────────────────────────────────
const getAnalyticsRange = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { start, end, period = 'daily' } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'start and end date required' });
    const startDate = new Date(start); startDate.setHours(0,0,0,0);
    const endDate   = new Date(end);   endDate.setHours(23,59,59,999);
    const data = await Analytics.find({ shopId, date: { $gte: startDate, $lte: endDate }, period }).sort({ date: 1 });
    const totals = data.reduce((acc, doc) => ({
      revenue:      acc.revenue      + doc.sales.totalRevenue,
      orders:       acc.orders       + doc.sales.totalOrders,
      messagesSent: acc.messagesSent + doc.ai.messagesSent,
      newCustomers: acc.newCustomers + doc.customers.newCustomers,
    }), { revenue: 0, orders: 0, messagesSent: 0, newCustomers: 0 });
    res.json({ success: true, data: { range: data, totals, days: data.length } });
  } catch (err) { next(err); }
};

// ── Dashboard summary (7-day chart + product sales) ───────
// Merges direct Orders (most accurate) with Analytics snapshots (fallback for days with no Orders)
const getDashboardSummary = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const now = new Date();
    const startDate = startOfDayPKT(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));

    const [directRevenue, productSalesRaw, totalCustomers, snapshots] = await Promise.all([
      // Direct from Orders — accurate & real-time
      Order.aggregate([
        { $match: { shopId: new mongoose.Types.ObjectId(shopId), status: { $ne: 'cancelled' }, createdAt: { $gte: startDate } } },
        { $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: '+05:00'   // group by PKT date
              }
            },
            revenue: { $sum: '$pricing.total' },
            orders:  { $sum: 1 }
        }},
        { $sort: { _id: 1 } },
      ]),

      // Product-level sales for leaderboard
      Order.aggregate([
        { $match: { shopId: new mongoose.Types.ObjectId(shopId), status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'prod' } },
        { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
        { $group: {
            _id:   { $ifNull: ['$prod.name', '$items.name'] },
            value: { $sum: { $multiply: ['$items.qty', '$items.price'] } },
            qty:   { $sum: '$items.qty' },
        }},
        { $sort: { value: -1 } },
        { $limit: 8 },
      ]),

      Customer.countDocuments({ shopId, isActive: true }),

      // Analytics snapshots — fallback data for days with no direct Orders
      Analytics.find({ shopId, date: { $gte: startDate }, period: 'daily' })
        .sort({ date: 1 })
        .select('date sales customers'),
    ]);

    // Build a map from date string → {revenue, orders} from direct orders
    const orderMap = {};
    directRevenue.forEach(d => { orderMap[d._id] = { revenue: d.revenue || 0, orders: d.orders || 0 }; });

    // Build chart data: prefer direct Orders, fall back to Analytics snapshot
    const chartMap = {};
    // First, insert all snapshot days
    snapshots.forEach(snap => {
      const dateStr = new Date(snap.date.getTime() + PKT_OFFSET_MS).toISOString().split('T')[0];
      chartMap[dateStr] = {
        date:    dateStr,
        revenue: snap.sales?.totalRevenue || 0,
        orders:  snap.sales?.totalOrders  || 0,
        deliveryRate: 0,
        readRate:     0,
        newCustomers: snap.customers?.newCustomers || 0,
        _source: 'snapshot',
      };
    });
    // Then overwrite with live Order data (more accurate)
    directRevenue.forEach(d => {
      chartMap[d._id] = {
        date:    d._id,
        revenue: d.revenue || 0,
        orders:  d.orders  || 0,
        deliveryRate: 0,
        readRate:     0,
        newCustomers: chartMap[d._id]?.newCustomers || 0,
        _source: 'orders',
      };
    });

    const chartData = Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date));

    const productSales = productSalesRaw.map(p => ({
      name:  p._id || 'Unknown',
      value: Math.round(p.value || 0),
      qty:   p.qty  || 0,
    }));

    res.json({ success: true, data: chartData, productSales, totalCustomers });
  } catch (err) { next(err); }
};

// ── Regenerate ────────────────────────────────────────────
const regenerateAnalytics = async (req, res, next) => {
  try {
    const { shopId, date } = req.body;
    if (!shopId || !date) return res.status(400).json({ error: 'shopId and date required' });
    const analytics = await Analytics.generateDailySnapshot(shopId, new Date(date));
    res.json({ success: true, message: 'Analytics regenerated', data: analytics });
  } catch (err) { next(err); }
};

// ── KPI metrics — uses PKT timezone so "today" matches Pakistan ──
const getKPIMetrics = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const now = new Date();

    // Today in PKT
    const todayStart = startOfDayPKT(now);
    const todayEnd   = endOfDayPKT(now);

    // Yesterday in PKT
    const yesterdayStart = startOfDayPKT(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    const yesterdayEnd   = endOfDayPKT(new Date(now.getTime() - 24 * 60 * 60 * 1000));

    const [todayOrders, yesterdayOrders, todayCustomers, yesterdayCustomers, todaySnap, yestSnap] = await Promise.all([
      Order.aggregate([{ $match: { shopId: new mongoose.Types.ObjectId(shopId), createdAt: { $gte: todayStart, $lte: todayEnd }, status: { $ne: 'cancelled' } } }, { $group: { _id: null, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } }]),
      Order.aggregate([{ $match: { shopId: new mongoose.Types.ObjectId(shopId), createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd }, status: { $ne: 'cancelled' } } }, { $group: { _id: null, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } }]),
      // Use firstVisit (always explicitly set on creation) instead of createdAt (unreliable with upserts)
      Customer.countDocuments({ shopId, firstVisit: { $gte: todayStart, $lte: todayEnd } }),
      Customer.countDocuments({ shopId, firstVisit: { $gte: yesterdayStart, $lte: yesterdayEnd } }),
      Analytics.findOne({ shopId, date: { $gte: todayStart, $lte: todayEnd }, period: 'daily' }),
      Analytics.findOne({ shopId, date: { $gte: yesterdayStart, $lte: yesterdayEnd }, period: 'daily' }),
    ]);

    const todayRev = todayOrders[0]?.revenue || 0;
    const todayOrd = todayOrders[0]?.orders  || 0;
    const yestRev  = yesterdayOrders[0]?.revenue || 0;
    const yestOrd  = yesterdayOrders[0]?.orders  || 0;

    const calcChange = (now, prev) => {
      if (!prev || prev === 0) return now > 0 ? 100 : 0;
      return Number((((now - prev) / prev) * 100).toFixed(1));
    };

    res.json({
      success: true,
      data: {
        revenue:      { today: todayRev,       change: calcChange(todayRev, yestRev) },
        orders:       { today: todayOrd,       change: calcChange(todayOrd, yestOrd) },
        deliveryRate: { today: todaySnap?.ai?.deliveryRate || 0, change: calcChange(todaySnap?.ai?.deliveryRate || 0, yestSnap?.ai?.deliveryRate || 0) },
        newCustomers: { today: todayCustomers, change: calcChange(todayCustomers, yesterdayCustomers) },
      },
    });
  } catch (err) { next(err); }
};

// ── AI Insights ───────────────────────────────────────────
const getAnalyticsInsights = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const model        = require('../config/gemini');
    const { extractJsonFromGeminiResponse } = require('../utils/tokenUsage');
    const AiRequestLog = require('../models/AiRequestLog');

    const now       = new Date();
    const startDate = startOfDayPKT(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
    const today     = startOfDayPKT(now);
    const yesterday = startOfDayPKT(new Date(now.getTime() - 24 * 60 * 60 * 1000));

    const [weekData, todayData, yesterdayData, lowStockProducts, weekOrdersDirect] = await Promise.all([
      Analytics.find({ shopId, date: { $gte: startDate }, period: 'daily' }).sort({ date: 1 }).select('date sales customers ai'),
      Analytics.findOne({ shopId, date: { $gte: today, $lte: endOfDayPKT(now) }, period: 'daily' }),
      Analytics.findOne({ shopId, date: { $gte: yesterday, $lte: endOfDayPKT(new Date(now.getTime() - 24 * 60 * 60 * 1000)) }, period: 'daily' }),
      Product.find({ shopId, isActive: true, 'stock.quantity': { $lte: 5 } }).select('name stock.quantity stock.lowStockThreshold').limit(5),
      Order.aggregate([
        { $match: { shopId: new mongoose.Types.ObjectId(shopId), status: { $ne: 'cancelled' }, createdAt: { $gte: startDate } } },
        { $group: { _id: null, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } },
      ]),
    ]);

    const directWeekRevenue = weekOrdersDirect[0]?.revenue || 0;
    const directWeekOrders  = weekOrdersDirect[0]?.orders  || 0;

    const weekSummary = weekData.map(d => ({
      date:         d.date.toISOString().split('T')[0],
      revenue:      d.sales.totalRevenue,
      orders:       d.sales.totalOrders,
      newCustomers: d.customers.newCustomers,
      deliveryRate: d.ai.deliveryRate,
    }));

    const totalWeekRevenue = directWeekRevenue || weekSummary.reduce((s, d) => s + d.revenue, 0);
    const totalWeekOrders  = directWeekOrders  || weekSummary.reduce((s, d) => s + d.orders, 0);
    const avgDailyRevenue  = totalWeekRevenue / 7;

    const stockAlerts = lowStockProducts.map(p => ({
      severity: p.stock.quantity === 0 ? 'critical' : 'warning',
      message:  p.stock.quantity === 0
        ? `${p.name} is OUT OF STOCK`
        : `${p.name} is low on stock (${p.stock.quantity} remaining)`,
    }));

    // No orders yet — return onboarding response immediately
    if (totalWeekOrders === 0) {
      return res.json({
        success: true,
        data: {
          summary: 'Your shop is set up. Start adding orders to unlock AI-powered insights.',
          insights: [
            { type: 'neutral',  title: 'Getting Started', detail: 'No sales data yet. Create your first order to start tracking revenue and customer trends.' },
            { type: 'positive', title: 'Shop is Active',  detail: 'Your shop is configured. AI insights will appear once you have order history.' },
          ],
          predictions: [{ metric: 'Revenue', direction: 'stable', confidence: 50, detail: 'Add products and create orders to get revenue predictions.' }],
          suggestions: [
            { priority: 'high',   action: 'Add Products to Inventory', reason: 'AI recommendations need products in stock to suggest what to sell.' },
            { priority: 'high',   action: 'Create Your First Order',   reason: 'Sales data powers all AI insights, predictions, and analytics charts.' },
            { priority: 'medium', action: 'Enable WhatsApp',           reason: 'Connect WhatsApp to start sending AI-generated messages to customers.' },
          ],
          alerts: stockAlerts,
        },
      });
    }

    const forceAI = req.body?.forceAI === true;

    // Server-side in-memory cache (1 hour) — bypass when user forces AI refresh
    const cacheKey = `insights_${shopId}`;
    if (!global._insightsCache) global._insightsCache = {};
    const cached = global._insightsCache[cacheKey];
    if (!forceAI && cached && (Date.now() - cached.ts) < 60 * 60 * 1000) {
      console.log('[Analytics] Serving cached insights for', shopId);
      const cachedData = { ...cached.data };
      if (stockAlerts.length > 0) cachedData.alerts = [...(cachedData.alerts || []), ...stockAlerts];
      return res.json({ success: true, data: cachedData, cached: true });
    }

    // Fallback summary (no Gemini call) when user hasn't pressed AI Insights
    if (!forceAI) {
      const fallback = {
        summary: `Your shop has Rs.${totalWeekRevenue.toFixed(0)} revenue and ${totalWeekOrders} orders this week.`,
        insights: [{ type: 'neutral', title: 'Data Ready', detail: `You have ${totalWeekOrders} orders this week totalling Rs.${totalWeekRevenue.toFixed(0)}. Click "AI Insights" for a full AI-powered analysis.` }],
        predictions: [],
        suggestions: [{ priority: 'medium', action: 'Click AI Insights button', reason: 'Get personalised recommendations based on your sales data.' }],
        alerts: stockAlerts,
        _requiresAction: true,
      };
      return res.json({ success: true, data: fallback, cached: false });
    }

    // ── Gemini call ──────────────────────────────────────────
    const prompt = `You are a senior business analyst AI for Pakistani small businesses using MarketPulse AI.
Analyze this 7-day data and provide actionable intelligence.
Weekly: ${JSON.stringify(weekSummary)}
Today Revenue: Rs.${todayData?.sales.totalRevenue||0} | Orders: ${todayData?.sales.totalOrders||0}
Yesterday Revenue: Rs.${yesterdayData?.sales.totalRevenue||0} | Orders: ${yesterdayData?.sales.totalOrders||0}
Weekly Total: Rs.${totalWeekRevenue.toFixed(0)} | Orders: ${totalWeekOrders} | Avg/day: Rs.${avgDailyRevenue.toFixed(0)}
Low Stock: ${lowStockProducts.length > 0 ? lowStockProducts.map(p => p.name+'('+p.stock.quantity+')').join(', ') : 'None'}
Return ONLY valid JSON: {"insights":[{"type":"positive|negative|neutral","title":"string","detail":"string"}],"predictions":[{"metric":"Revenue|Orders|Customers","direction":"up|down|stable","confidence":75,"detail":"string"}],"suggestions":[{"priority":"high|medium|low","action":"string","reason":"string"}],"alerts":[{"severity":"critical|warning|info","message":"string"}],"summary":"string"}`;

    const start = Date.now();
    let aiData;

    try {
      let result;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          result = await model.generateContent(prompt);
          break;
        } catch (e) {
          if (e.message?.includes('429') && attempt === 1) {
            await new Promise(r => setTimeout(r, 35000));
          } else throw e;
        }
      }
      const text  = result.response.text();
      aiData = extractJsonFromGeminiResponse(text);
      const usage = result?.response?.usageMetadata || {};
      await AiRequestLog.logRequest({
        shopId,
        endpoint: 'analytics_insights',
        promptTokens:     usage.promptTokenCount     || 0,
        completionTokens: usage.candidatesTokenCount || 0,
        status: 'success',
        responseTimeMs: Date.now() - start,
      });
    } catch (aiErr) {
      console.error('[Analytics] Gemini insights error:', aiErr.message);
      aiData = {
        summary: `Your shop has Rs.${totalWeekRevenue.toFixed(0)} revenue and ${totalWeekOrders} orders this week.`,
        insights: [
          { type: totalWeekRevenue > 0 ? 'positive' : 'neutral', title: 'Weekly Performance', detail: `Total revenue: Rs.${totalWeekRevenue.toFixed(0)} across ${totalWeekOrders} orders.` },
          { type: 'neutral', title: 'AI Temporarily Unavailable', detail: 'AI insights could not be generated right now. Your data is still being tracked.' },
        ],
        predictions: [{ metric: 'Revenue', direction: totalWeekRevenue > 0 ? 'up' : 'stable', confidence: 60, detail: 'Based on current week trends.' }],
        suggestions: [{ priority: 'medium', action: 'Keep adding orders', reason: 'More data improves AI prediction accuracy.' }],
        alerts: [],
      };
    }

    // Save to cache
    global._insightsCache[cacheKey] = { data: aiData, ts: Date.now() };

    if (stockAlerts.length > 0) aiData.alerts = [...(aiData.alerts || []), ...stockAlerts];
    res.json({ success: true, data: aiData });
  } catch (err) { next(err); }
};

module.exports = { getTodayAnalytics, getAnalyticsRange, getDashboardSummary, regenerateAnalytics, getKPIMetrics, getAnalyticsInsights };
