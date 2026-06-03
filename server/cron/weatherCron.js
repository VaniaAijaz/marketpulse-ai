const cron = require('node-cron');
const Shop = require('../models/Shop');
const { fetchAndSaveWeather } = require('../services/weatherService');

async function refreshAllShopWeather() {
  console.log('[Cron] Refreshing weather for active shops...');
  const shops = await Shop.find({ isActive: true }).select('_id name').limit(200);

  let ok = 0;
  let fail = 0;

  for (const shop of shops) {
    try {
      await fetchAndSaveWeather(shop._id);
      ok++;
    } catch (err) {
      fail++;
      console.error(`[Cron] Weather fail ${shop.name}:`, err.message);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`[Cron] Weather done — ok: ${ok}, fail: ${fail}`);
}

// Every 3 hours (Pakistan time)
cron.schedule('0 */3 * * *', refreshAllShopWeather, {
  timezone: 'Asia/Karachi',
});

module.exports = { refreshAllShopWeather };
