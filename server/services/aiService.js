const model = require('../config/gemini');
const AiRequestLog = require('../models/AiRequestLog');

const generateMessage = async ({ shopId, prompt }) => {
  const start = Date.now();
  
  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const usage = result.response.usageMetadata || {};

    await AiRequestLog.logRequest({
      shopId,
      endpoint: 'generate_message',
      promptTokens: usage.promptTokenCount || 0,
      completionTokens: usage.candidatesTokenCount || 0,
      status: 'success',
      responseTimeMs: Date.now() - start
    });

    return {
      success: true,
      message: response,
      usage: {
        promptTokens: usage.promptTokenCount || 0,
        completionTokens: usage.candidatesTokenCount || 0
      }
    };
  } catch (err) {
    await AiRequestLog.logRequest({
      shopId,
      endpoint: 'generate_message',
      status: 'failed',
      errorMessage: err.message,
      responseTimeMs: Date.now() - start
    });
    throw err;
  }
};

module.exports = { generateMessage };