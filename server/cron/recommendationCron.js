const cron = require('node-cron');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const { fetchAndSaveWeather, getLatestWeather } = require('../services/weatherService');
const { generateProductRecommendations } = require('../services/aiRecommendationService');

async function runAutoRecommendations() {
  console.log('[Cron] Auto recommendations starting...');

  const shops = await Shop.find({ isActive: true })
    .select('_id name')
    .limit(100)
    .lean();

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const shop of shops) {
    try {
      const productCount = await Product.countDocuments({
        shopId: shop._id,
        isActive: true,
        'stock.quantity': { $gt: 0 },
      });

      if (productCount === 0) {
        skip++;
        continue;
      }

      await fetchAndSaveWeather(shop._id).catch(() => {});
      const weather = await getLatestWeather(shop._id);
      await generateProductRecommendations({ shopId: shop._id, weather });
      ok++;
      console.log(`[Cron] Recommendations OK: ${shop.name}`);
    } catch (err) {
      fail++;
      console.error(`[Cron] Recommendations fail ${shop.name}:`, err.message);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`[Cron] Auto recommendations done — ok: ${ok}, skip: ${skip}, fail: ${fail}`);
}

// Every 6 hours
cron.schedule('0 */6 * * *', runAutoRecommendations, {
  timezone: 'Asia/Karachi',
});

module.exports = { runAutoRecommendations };
