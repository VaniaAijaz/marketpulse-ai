/**
 * gemini.js — Production-ready Gemini AI client
 * Uses axios directly (bypasses SDK fetch issues)
 * Free tier: 15 req/min per model
 */

const axios = require('axios');

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY not set in env');
}

const API_KEY  = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

if (!global._geminiCache) global._geminiCache = {};

// ── Schema for AI recommendations (Option 3: schema lock) ──
const RECOMMENDATION_SCHEMA = {
  type: 'object',
  properties: {
    recommendations: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          productId:      { type: 'string' },
          productName:    { type: 'string' },
          reason:         { type: 'string' },
          expectedUplift: { type: 'string' },
        },
        required: ['productId', 'productName', 'reason', 'expectedUplift'],
      },
    },
    insight:           { type: 'string' },
    dominantCustomers: { type: 'array', items: { type: 'string' } },
    confidenceScore:   { type: 'integer', minimum: 0, maximum: 100 },
  },
  required: ['recommendations', 'insight', 'dominantCustomers', 'confidenceScore'],
};

// ── Single API call ────────────────────────────────────────
// options.schema — pass RECOMMENDATION_SCHEMA for structured output
async function callModel(modelName, prompt, options = {}) {
  const url = `${BASE_URL}/${modelName}:generateContent?key=${API_KEY}`;

  const generationConfig = {
    temperature:     options.schema ? 0.7 : 0.9,
    maxOutputTokens: options.schema ? 8192 : 1024,
  };

  // Only force JSON mode for structured calls (recommendations, analytics)
  // Chat/message calls must stay as plain text
  if (options.schema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema   = options.schema;
  }

  const body = {
    contents: [{ parts: [{ text: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) }] }],
    generationConfig,
  };

  const res = await axios.post(url, body, {
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  const text  = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const usage = res.data?.usageMetadata || {};

  return {
    response: {
      text: () => text,
      usageMetadata: {
        promptTokenCount:     usage.promptTokenCount     || 0,
        candidatesTokenCount: usage.candidatesTokenCount || 0,
        totalTokenCount:      usage.totalTokenCount      || 0,
      },
    },
  };
}

// ── Main: try each model, fall back on quota/404 ──────────
async function generateWithFallback(prompt, cacheKey, options = {}) {
  if (cacheKey && global._geminiCache[cacheKey]) {
    const cached = global._geminiCache[cacheKey];
    if (Date.now() - cached.ts < 60 * 60 * 1000) {
      console.log('[Gemini] Cache hit:', cacheKey);
      return cached.result;
    }
  }

  for (const modelName of MODELS) {
    try {
      console.log('[Gemini] Trying:', modelName);
      const result = await callModel(modelName, prompt, options);
      console.log('[Gemini] OK:', modelName);
      if (cacheKey) global._geminiCache[cacheKey] = { result, ts: Date.now() };
      return result;
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.error?.message || err.message;

      if (status === 429) {
        console.warn(`[Gemini] ${modelName} quota (429) — trying next model`);
        continue;
      }
      if (status === 404) {
        console.warn(`[Gemini] ${modelName} not found (404) — trying next model`);
        continue;
      }
      if (!err.response) {
        console.error(`[Gemini] Network error: ${err.code || err.message}`);
        throw new Error(`Network error: ${err.code || err.message}`);
      }

      console.error(`[Gemini] ${modelName} error ${status}: ${msg}`);
      continue;
    }
  }

  console.error('[Gemini] All models failed. Returning fallback response.');
  return {
    _fallback: true,
    response: {
      text: () => '',
      usageMetadata: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
    },
  };
}

// ── Export ────────────────────────────────────────────────
const geminiClient = {
  // General use (chat, messages) — no schema
  generateContent: (prompt) =>
    generateWithFallback(prompt, null),

  // Schema-locked structured output (recommendations)
  generateStructured: (prompt, schema = RECOMMENDATION_SCHEMA) =>
    generateWithFallback(prompt, null, { schema }),

  generateWithCache: (prompt, cacheKey) =>
    generateWithFallback(prompt, cacheKey),

  clearCache: (key) => {
    if (key) delete global._geminiCache[key];
    else global._geminiCache = {};
  },

  RECOMMENDATION_SCHEMA,
};

module.exports = geminiClient;
