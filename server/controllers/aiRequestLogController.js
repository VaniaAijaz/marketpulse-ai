const AiRequestLog = require('../models/AiRequestLog');

// @desc    Check remaining AI limit for today
// @route   GET /api/ai/limit/:shopId
// @access  Private
const getDailyLimit = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    
    const check = await AiRequestLog.checkDailyLimit(shopId);
    
    res.json({
      success: true,
      data: check
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get AI usage stats for last N days
// @route   GET /api/ai/stats/:shopId?days=7
// @access  Private
const getUsageStats = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const days = parseInt(req.query.days) || 7;
    
    const stats = await AiRequestLog.getDailyStats(shopId, days);
    
    // Calculate totals
    const totals = stats.reduce((acc, day) => ({
      requests: acc.requests + day.requests,
      tokens: acc.tokens + day.tokens,
      costPKR: acc.costPKR + day.costPKR
    }), { requests: 0, tokens: 0, costPKR: 0 });
    
    res.json({
      success: true,
      data: {
        daily: stats,
        totals: {
          ...totals,
          costPKR: parseFloat(totals.costPKR.toFixed(2))
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get recent AI request logs
// @route   GET /api/ai/logs/:shopId?page=1&limit=20
// @access  Private
const getRequestLogs = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const [logs, total] = await Promise.all([
      AiRequestLog.find({ shopId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      AiRequestLog.countDocuments({ shopId })
    ]);
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get cost breakdown for current month
// @route   GET /api/ai/cost/:shopId
// @access  Private
const getMonthlyCost = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const result = await AiRequestLog.aggregate([
      {
        $match: {
          shopId: new mongoose.Types.ObjectId(shopId),
          createdAt: { $gte: startOfMonth },
          status: 'success'
        }
      },
      {
        $group: {
          _id: '$endpoint',
          requests: { $sum: 1 },
          tokens: { $sum: '$totalTokens' },
          costPKR: { $sum: '$costPKR' }
        }
      },
      { $sort: { costPKR: -1 } }
    ]);
    
    const totalCost = result.reduce((sum, item) => sum + item.costPKR, 0);
    
    res.json({
      success: true,
      data: {
        breakdown: result,
        totalCostPKR: parseFloat(totalCost.toFixed(2)),
        month: startOfMonth.toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDailyLimit,
  getUsageStats,
  getRequestLogs,
  getMonthlyCost
};