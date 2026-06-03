const model = require('../config/gemini');
const Shop = require('../models/Shop');
const AiRequestLog = require('../models/AiRequestLog');
const RecommendationLog = require('../models/RecommendationLog');
const { getNearbyPlaces } = require('./locationService');
const {
  getInventorySummary,
  getAiEligibleProducts,
  sanitizeAiRecommendations,
} = require('./inventoryService');
const { getBusinessConfig } = require('../utils/businessCatalog');
const { extractGeminiUsage, extractJsonFromGeminiResponse } = require('../utils/tokenUsage');

const generateProductRecommendations = async ({ shopId, weather }) => {
  const start = Date.now();
  let promptTokens = 0;
  let completionTokens = 0;

  const shop = await Shop.findById(shopId).select('name location businessType');
  if (!shop) throw new Error('Shop not found');
  if (!weather) throw new Error('Weather data missing');

  const lat = shop.location.coordinates[1];
  const lng = shop.location.coordinates[0];

  // Cached Overpass call
  const nearbyPlaces = await getNearbyPlaces(lat, lng);
  const safeNearbyPlaces = (nearbyPlaces && Object.keys(nearbyPlaces).length > 0)
    ? nearbyPlaces
    : { school: 0, university: 0, office: 0, hospital: 0, gym: 0, shop: 0, restaurant: 0 };

  const inventory = await getInventorySummary(shopId);
  if (!inventory.aiReady) {
    throw new Error(
      inventory.total === 0
        ? 'No products in inventory. Add products with stock first.'
        : `No in-stock products (${inventory.outOfStockCount} out of stock). Update inventory quantities.`
    );
  }

  const products = await getAiEligibleProducts(shopId, 25);
  const biz = getBusinessConfig(shop.businessType);

  // Build a numbered product list so Gemini can reference by index as fallback
  const productLines = products.map((p, i) =>
    `${i + 1}. ID="${p._id}" NAME="${p.name}" CAT="${p.category}" PRICE=${p.pricing?.sellingPrice || 0} STOCK=${p.stock?.quantity}`
  ).join('\n');

  const prompt = `You are a retail advisor for Pakistani shopkeepers. Return ONLY valid JSON. No explanation. No markdown. No extra text. If you cannot comply, return empty recommendations array.

Shop: ${shop.name} (${biz.label})
City: ${weather.location?.city || 'Pakistan'}
Weather: ${weather.weather.temp}C, ${weather.weather.condition}. ${weather.context.suggestion}
Nearby (1km): Schools=${safeNearbyPlaces.school} Universities=${safeNearbyPlaces.university} Offices=${safeNearbyPlaces.office} Hospitals=${safeNearbyPlaces.hospital} Restaurants=${safeNearbyPlaces.restaurant}

AVAILABLE PRODUCTS (recommend ONLY from this list, max 3):
${productLines}

Rules:
- productId: copy EXACTLY from ID="..." above
- productName: copy EXACTLY from NAME="..." above
- reason: max 20 words in Hinglish
- expectedUplift: format "+X%"
- insight: 1 line business tip
- dominantCustomers: array of customer types from nearby area
- confidenceScore: number 0-100`;

  try {
    const result = await model.generateStructured(prompt);
    if (result._fallback) throw new Error('AI service temporarily unavailable. Please try again later.');

    const responseText = result.response.text();
    console.log('[AI] Raw response length:', responseText.length);
    console.log('[AI] Raw response FULL:', responseText);

    const aiData = extractJsonFromGeminiResponse(responseText);
    console.log('[AI] Parsed recommendations:', JSON.stringify(aiData.recommendations));

    const sanitized = await sanitizeAiRecommendations(shopId, aiData.recommendations || []);
    console.log('[AI] Sanitized count:', sanitized.length);

    if (!sanitized.length) {
      throw new Error('AI suggestions did not match in-stock inventory. Refresh and try again.');
    }

    // Normalize confidenceScore: Gemini may return 0.85 (decimal) or 85 (integer)
    const rawScore = aiData.confidenceScore ?? 85;
    const confidenceScore = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);

    const usage = extractGeminiUsage(result?.response?.usageMetadata);
    promptTokens = usage.promptTokens;
    completionTokens = usage.completionTokens;

    const recLog = await RecommendationLog.create({
      shopId,
      weatherContext: {
        temp: weather.weather.temp,
        condition: weather.weather.condition,
        mood: weather.context.mood,
        city: weather.location?.city,
      },
      nearbyPlaces: safeNearbyPlaces,
      recommendations: sanitized,
      insight: aiData.insight,
      dominantCustomers: aiData.dominantCustomers,
      confidenceScore,
    });

    await AiRequestLog.logRequest({
      shopId,
      endpoint: 'recommend_products',
      promptTokens,
      completionTokens,
      status: 'success',
      responseTimeMs: Date.now() - start,
    });

    return {
      success: true,
      data: {
        logId: recLog._id,
        weather: weather.weather,
        weatherContext: weather.context,
        location: weather.location,
        nearbyPlaces: safeNearbyPlaces,
        recommendations: sanitized.map((r) => ({
          productId: r.productId,
          productName: r.productName,
          reason: r.reason,
          expectedUplift: r.expectedUplift,
        })),
        insight: aiData.insight,
        dominantCustomers: aiData.dominantCustomers,
        confidenceScore,
        generatedAt: recLog.generatedAt,
        inventory: {
          inStockCount: inventory.inStockCount,
          lowStockCount: inventory.lowStockCount,
          outOfStockCount: inventory.outOfStockCount,
        },
      },
    };
  } catch (err) {
    await AiRequestLog.logRequest({
      shopId,
      endpoint: 'recommend_products',
      promptTokens,
      completionTokens,
      status: 'failed',
      errorMessage: err.message,
      responseTimeMs: Date.now() - start,
    });
    throw err;
  }
};

module.exports = { generateProductRecommendations };
