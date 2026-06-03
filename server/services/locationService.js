const axios = require('axios');
const PlaceCache = require('../models/PlaceCache');

const getNearbyPlaces = async (lat, lng) => {
  // 1. Check cache first
  const cached = await PlaceCache.getCache(lat, lng);
  if (cached) {
    console.log(`PlaceCache HIT for ${lat},${lng}`);
    return cached;
  }

  console.log(`PlaceCache MISS for ${lat},${lng} — calling Overpass API`);

  const radius = 1000;
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"school|university|hospital|restaurant"](around:${radius},${lat},${lng});
      node["leisure"="fitness_centre"](around:${radius},${lat},${lng});
      node["shop"](around:${radius},${lat},${lng});
      node["office"](around:${radius},${lat},${lng});
    );
    out body;
  `;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await axios.post(
        'https://overpass-api.de/api/interpreter',
        `data=${encodeURIComponent(query)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'User-Agent': 'MarketPulseAI/1.0',
          },
          timeout: 30000,
        }
      );

      const elements = res.data.elements || [];
      const counts = {
        school:     elements.filter(e => e.tags?.amenity === 'school').length,
        university: elements.filter(e => e.tags?.amenity === 'university').length,
        office:     elements.filter(e => e.tags?.office).length,
        hospital:   elements.filter(e => e.tags?.amenity === 'hospital').length,
        gym:        elements.filter(e => e.tags?.leisure === 'fitness_centre').length,
        shop:       elements.filter(e => e.tags?.shop).length,
        restaurant: elements.filter(e => e.tags?.amenity === 'restaurant').length,
      };

      console.log(`Overpass attempt ${attempt} success:`, counts);

      // 2. Save to cache (24h TTL)
      await PlaceCache.setCache(lat, lng, counts);

      return counts;

    } catch (err) {
      console.error(`Overpass attempt ${attempt} failed:`, err.code || err.message);
      if (attempt === 3) {
        // Return empty fallback — don't crash the recommendation flow
        return { school: 0, university: 0, office: 0, hospital: 0, gym: 0, shop: 0, restaurant: 0 };
      }
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
};

module.exports = { getNearbyPlaces };
