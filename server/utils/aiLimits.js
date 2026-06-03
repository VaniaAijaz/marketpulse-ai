/** Daily AI request caps per shop plan */
const PLAN_AI_LIMITS = {
  free: 50,
  basic: 150,
  pro: 500,
  enterprise: 2000,
};

/**
 * Resolve daily AI cap from shop.limits.aiMessagesPerDay or plan default.
 * (Legacy code used shop.dailyAiLimit which was never on the schema.)
 */
function getDailyAiLimit(shop) {
  const custom = shop?.limits?.aiMessagesPerDay;
  if (typeof custom === 'number' && custom > 0) {
    return custom;
  }
  return PLAN_AI_LIMITS[shop?.plan] ?? PLAN_AI_LIMITS.free;
}

module.exports = { PLAN_AI_LIMITS, getDailyAiLimit };
