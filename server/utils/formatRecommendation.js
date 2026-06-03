/** Normalize RecommendationLog for frontend widgets (weather card, etc.) */
function formatRecommendationForClient(log) {
  if (!log) return null;

  const obj = log.toObject ? log.toObject() : { ...log };
  const wc = obj.weatherContext || {};

  return {
    ...obj,
    weather: obj.weather || {
      temp: wc.temp,
      condition: wc.condition,
      description: wc.condition,
      humidity: wc.humidity ?? null,
      windSpeed: wc.windSpeed ?? null,
    },
    weatherContext: obj.weatherContext || {
      mood: wc.mood,
      suggestion: obj.insight || '',
    },
    location: obj.location || (wc.city ? { city: wc.city } : null),
  };
}

module.exports = { formatRecommendationForClient };
