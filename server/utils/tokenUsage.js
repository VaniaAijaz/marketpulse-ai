/** Coerce to non-negative integer; NaN/undefined → 0 */
function safeTokenCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

/** Normalize Gemini usageMetadata across SDK / model versions */
function extractGeminiUsage(usage = {}) {
  const promptTokens = safeTokenCount(
    usage.promptTokenCount ??
      usage.promptTokens ??
      usage.inputTokenCount
  );
  const completionTokens = safeTokenCount(
    usage.candidatesTokenCount ??
      usage.completionTokenCount ??
      usage.outputTokenCount ??
      usage.candidatesTokens
  );

  if (promptTokens === 0 && completionTokens === 0) {
    const total = safeTokenCount(usage.totalTokenCount ?? usage.totalTokens);
    if (total > 0) {
      const prompt = Math.floor(total * 0.45);
      return { promptTokens: prompt, completionTokens: total - prompt };
    }
  }

  return { promptTokens, completionTokens };
}

/**
 * Extract and parse JSON from a Gemini response string.
 * Option 1: tries raw text first (responseMimeType=application/json returns clean JSON)
 * Option 4: truncation-proof — finds the largest {...} block and attempts repair if needed
 */
function extractJsonFromGeminiResponse(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('AI returned empty response');
  }

  const attempts = [];

  // 1. Raw text (best case — responseMimeType=application/json)
  attempts.push(text.trim());

  // 2. Strip markdown fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) attempts.push(fenceMatch[1].trim());

  // 3. Largest {...} block (Option 4 — truncation-proof)
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) attempts.push(objectMatch[0]);

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch (_) {
      // try next
    }
  }

  // 4. Last resort: attempt to repair truncated JSON by closing open structures
  const objectStart = text.indexOf('{');
  if (objectStart !== -1) {
    try {
      const partial = text.slice(objectStart);
      // Count unclosed braces/brackets and close them
      let repaired = partial;
      const opens = (partial.match(/\{/g) || []).length - (partial.match(/\}/g) || []).length;
      const arrOpens = (partial.match(/\[/g) || []).length - (partial.match(/\]/g) || []).length;
      // Close any open string first (truncated mid-string)
      if ((partial.match(/"/g) || []).length % 2 !== 0) repaired += '"';
      for (let i = 0; i < arrOpens; i++) repaired += ']';
      for (let i = 0; i < opens; i++) repaired += '}';
      return JSON.parse(repaired);
    } catch (_) {
      // repair failed
    }
  }

  console.error('[AI] Could not parse JSON. Raw (first 400 chars):', text.substring(0, 400));
  throw new Error('AI returned invalid format');
}

module.exports = { safeTokenCount, extractGeminiUsage, extractJsonFromGeminiResponse };
