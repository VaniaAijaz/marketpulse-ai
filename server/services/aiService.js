const model = require('../config/gemini');
const Shop = require('../models/Shop');
const AiRequestLog = require('../models/AiRequestLog');
const { getBusinessConfig } = require('../utils/businessCatalog');
const { extractGeminiUsage } = require('../utils/tokenUsage');

const generateMessage = async ({ shopId, prompt }) => {
  const start = Date.now();

  const shop = shopId
    ? await Shop.findById(shopId).select('name businessType')
    : null;
  const biz = getBusinessConfig(shop?.businessType);
  const fullPrompt = shop
    ? `You are MarketPulse AI for the Pakistani shop "${shop.name}" (${biz.label}). ${biz.aiFocus}\nAnswer in Urdu-English mix if helpful. Be practical and brief.\n\nShopkeeper asks: ${prompt}`
    : prompt;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();
    const tokens = extractGeminiUsage(result.response.usageMetadata);

    try {
      await AiRequestLog.logRequest({
        shopId,
        endpoint: 'generate_message',
        promptTokens: tokens.promptTokens,
        completionTokens: tokens.completionTokens,
        status: 'success',
        responseTimeMs: Date.now() - start,
      });
    } catch (logErr) {
      console.error('[AI] usage log failed:', logErr.message);
    }

    return {
      success: true,
      message: response,
      usage: tokens,
    };
  } catch (err) {
    try {
      await AiRequestLog.logRequest({
        shopId,
        endpoint: 'generate_message',
        promptTokens: 0,
        completionTokens: 0,
        status: 'failed',
        errorMessage: err.message,
        responseTimeMs: Date.now() - start,
      });
    } catch (logErr) {
      console.error('[AI] failure log failed:', logErr.message);
    }
    throw err;
  }
};

module.exports = { generateMessage };