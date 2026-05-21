const Analytics = require('../models/Analytics');
const mongoose = require('mongoose');

// @desc Get today's analytics snapshot
// @route GET /api/analytics/today/:shopId
// @access Private
const getTodayAnalytics = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let analytics = await Analytics.findOne({
      shopId,
      date: today,
      period: 'daily'
    });

    // Agar doc nahi hai to generate kar do
    if (!analytics) {
      analytics = await Analytics.generateDailySnapshot(shopId, today);
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get analytics for date range
// @route GET /api/analytics/range/:shopId?start=2025-10-01&end=2025-10-07&period=daily
// @access Private
const getAnalyticsRange = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { start, end, period = 'daily' } = req.query;

    if (!start ||!end) {
      return res.status(400).json({ error: 'start and end date required' });
    }

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const data = await Analytics.find({
      shopId,
      date: { $gte: startDate, $lte: endDate },
      period
    }).sort({ date: 1 });

    // Totals calculate karo
    const totals = data.reduce((acc, doc) => ({
      revenue: acc.revenue + doc.sales.totalRevenue,
      orders: acc.orders + doc.sales.totalOrders,
      messagesSent: acc.messagesSent + doc.ai.messagesSent,
      newCustomers: acc.newCustomers + doc.customers.newCustomers
    }), { revenue: 0, orders: 0, messagesSent: 0, newCustomers: 0 });

    res.json({
      success: true,
      data: {
        range: data,
        totals,
        days: data.length
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get last 7 days summary for dashboard chart
// @route GET /api/analytics/summary/:shopId
// @access Private
const getDashboardSummary = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    const data = await Analytics.find({
      shopId,
      date: { $gte: startDate },
      period: 'daily'
    }).sort({ date: 1 }).select('date sales.totalRevenue sales.totalOrders ai.deliveryRate ai.readRate customers.newCustomers');

    // Last 7 days ka trend
    const chartData = data.map(d => ({
      date: d.date.toISOString().split('T')[0],
      revenue: d.sales.totalRevenue,
      orders: d.sales.totalOrders,
      deliveryRate: d.ai.deliveryRate,
      readRate: d.ai.readRate,
      newCustomers: d.customers.newCustomers
    }));

    res.json({
      success: true,
      data: chartData
    });
  } catch (err) {
    next(err);
  }
};

// @desc Manually regenerate analytics for a date
// @route POST /api/analytics/regenerate
// @access Private
const regenerateAnalytics = async (req, res, next) => {
  try {
    const { shopId, date } = req.body;

    if (!shopId ||!date) {
      return res.status(400).json({ error: 'shopId and date required' });
    }

    const analytics = await Analytics.generateDailySnapshot(shopId, new Date(date));

    res.json({
      success: true,
      message: 'Analytics regenerated successfully',
      data: analytics
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get top metrics for KPI cards
// @route GET /api/analytics/kpi/:shopId
// @access Private
const getKPIMetrics = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [todayData, yesterdayData] = await Promise.all([
      Analytics.findOne({ shopId, date: today, period: 'daily' }),
      Analytics.findOne({ shopId, date: yesterday, period: 'daily' })
    ]);

    const calcChange = (today, yesterday) => {
      if (!yesterday || yesterday === 0) return 0;
      return (((today - yesterday) / yesterday) * 100).toFixed(1);
    };

    res.json({
      success: true,
      data: {
        revenue: {
          today: todayData?.sales.totalRevenue || 0,
          change: calcChange(todayData?.sales.totalRevenue || 0, yesterdayData?.sales.totalRevenue || 0)
        },
        orders: {
          today: todayData?.sales.totalOrders || 0,
          change: calcChange(todayData?.sales.totalOrders || 0, yesterdayData?.sales.totalOrders || 0)
        },
        deliveryRate: {
          today: todayData?.ai.deliveryRate || 0,
          change: calcChange(todayData?.ai.deliveryRate || 0, yesterdayData?.ai.deliveryRate || 0)
        },
        newCustomers: {
          today: todayData?.customers.newCustomers || 0,
          change: calcChange(todayData?.customers.newCustomers || 0, yesterdayData?.customers.newCustomers || 0)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTodayAnalytics,
  getAnalyticsRange,
  getDashboardSummary,
  regenerateAnalytics,
  getKPIMetrics
};