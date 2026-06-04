/** Daily AI request caps — free tool, generous limit */
const PLAN_AI_LIMITS = {
  free:       500,
  basic:      500,
  pro:        500,
  enterprise: 500,
};

/**
 * Resolve daily AI cap from shop.limits.aiMessagesPerDay or plan default.
 */
function getDailyAiLimit(shop) {
  const custom = shop?.limits?.aiMessagesPerDay;
  if (typeof custom === 'number' && custom > 0) {
    return custom;
  }
  return PLAN_AI_LIMITS[shop?.plan] ?? 500;
}

module.exports = { PLAN_AI_LIMITS, getDailyAiLimit };
