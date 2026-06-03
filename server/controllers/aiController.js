const { generateProductRecommendations } = require('../services/aiRecommendationService');
const { fetchAndSaveWeather, getLatestWeather } = require('../services/weatherService');
const { generateMessage } = require('../services/aiService');
const { formatRecommendationForClient } = require('../utils/formatRecommendation');
const { getInventorySummary } = require('../services/inventoryService');
const RecommendationLog = require('../models/RecommendationLog');
const Customer = require('../models/Customer');
const asyncHandler = require('../middleware/asyncHandler');

// @desc  Get AI product recommendations (weather + OSM + inventory)
// @route POST /api/ai/recommendations
// @access Private
const getRecommendations = asyncHandler(async (req, res) => {
  const { shopId } = req.body;
  if (!shopId) return res.status(400).json({ success: false, error: 'shopId is required' });

  const inventory = await getInventorySummary(shopId);
  if (!inventory.aiReady) {
    return res.status(400).json({
      success: false,
      error: inventory.total === 0
        ? 'Add products to inventory before running AI.'
        : 'No in-stock products. Update stock quantities first.',
      data: inventory,
    });
  }

  // Refresh weather then generate
  await fetchAndSaveWeather(shopId).catch(() => {}); // non-blocking fail
  const weather = await getLatestWeather(shopId);

  let result;
  try {
    result = await generateProductRecommendations({ shopId, weather });
  } catch (err) {
    // Surface AI-specific errors as 503 (not 500) so the client can show a friendly message
    const isAiUnavailable =
      err.message?.includes('temporarily unavailable') ||
      err.message?.includes('Quota exceeded') ||
      err.message?.includes('Network error');
    return res.status(isAiUnavailable ? 503 : 400).json({
      success: false,
      error: err.message || 'AI recommendation failed',
    });
  }

  res.json(result);
});

// @desc  Get latest recommendation log for a shop
// @route GET /api/ai/recommendations/:shopId
// @access Private
const getLatestRecommendations = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const log = await RecommendationLog.findOne({ shopId })
    .sort({ generatedAt: -1 })
    .populate('recommendations.productId', 'name pricing.sellingPrice stock.quantity');

  if (!log) return res.json({ success: true, data: null });
  res.json({ success: true, data: formatRecommendationForClient(log) });
});

// @desc  Get recommendation history for a shop
// @route GET /api/ai/recommendations/:shopId/history
// @access Private
const getRecommendationHistory = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const { limit = 10 } = req.query;
  const logs = await RecommendationLog.find({ shopId })
    .sort({ generatedAt: -1 })
    .limit(parseInt(limit))
    .select('generatedAt insight confidenceScore recommendations.status weatherContext');
  res.json({ success: true, data: logs });
});

// @desc  Mark a recommendation item as displayed / acted / dismissed
// @route PATCH /api/ai/recommendations/:logId/status
// @access Private
const updateRecommendationStatus = asyncHandler(async (req, res) => {
  const { logId } = req.params;
  const { productId, status } = req.body;

  const log = await RecommendationLog.findById(logId);
  if (!log) return res.status(404).json({ success: false, error: 'Log not found' });

  const rec = log.recommendations.find(
    (r) => r.productId?.toString() === productId || r.productName === productId
  );
  if (!rec) return res.status(404).json({ success: false, error: 'Recommendation not found' });

  rec.status = status;
  if (status === 'acted' || status === 'displayed') rec.actedAt = new Date();
  if (status === 'displayed' && !log.displayedAt) log.displayedAt = new Date();

  await log.save();
  res.json({ success: true, data: formatRecommendationForClient(log) });
});

// @desc  Generate context-aware WhatsApp message
// @route POST /api/ai/whatsapp-message
// @access Private
const generateWhatsAppMessage = asyncHandler(async (req, res) => {
  const { shopId, messageType = 'promotion', customPrompt, customerSegment } = req.body;
  if (!shopId) return res.status(400).json({ success: false, error: 'shopId is required' });

  const shop = req.shop;

  // Get weather context
  const weather = await getLatestWeather(shopId).catch(() => null);

  // Get customer count for context
  const customerCount = await Customer.countDocuments({ shopId, isActive: true, whatsappOptIn: true });
  const inactiveCount = await Customer.countDocuments({
    shopId, isActive: true, whatsappOptIn: true,
    lastVisit: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });

  const weatherLine = weather
    ? `Weather: ${weather.weather.temp}°C, ${weather.weather.condition}. ${weather.context.suggestion}`
    : 'Weather: Not available';

  const messageTypePrompts = {
    promotion:    'Write a short promotional WhatsApp message for a flash sale or discount offer.',
    reengagement: `Write a friendly re-engagement message for ${inactiveCount} customers who haven't visited in 7+ days.`,
    newproduct:   'Write an exciting WhatsApp message announcing a new product arrival.',
    weather:      `Write a WhatsApp message that ties in the current weather (${weather?.weather?.condition || 'hot'}) to promote relevant products.`,
    custom:       customPrompt || 'Write a general business WhatsApp message.'
  };

  const prompt = `
You are a WhatsApp marketing expert for Pakistani small businesses.

Shop: ${shop.name} (${shop.businessType})
${weatherLine}
Opted-in customers: ${customerCount}
${customerSegment ? `Target segment: ${customerSegment}` : ''}

Task: ${messageTypePrompts[messageType] || messageTypePrompts.promotion}

Rules:
- Keep it under 160 characters
- Use Hinglish (mix of Urdu + English) — friendly tone
- Add 1-2 relevant emojis
- Include a clear call to action
- Do NOT use formal/corporate language

Return ONLY the message text, nothing else.`;

  const result = await generateMessage({ shopId, prompt });

  res.json({
    success: true,
    data: {
      message: result.message,
      messageType,
      shopName: shop.name,
      weatherContext: weather?.context,
      usage: result.usage
    }
  });
});

module.exports = {
  getRecommendations,
  getLatestRecommendations,
  getRecommendationHistory,
  updateRecommendationStatus,
  generateWhatsAppMessage
};
