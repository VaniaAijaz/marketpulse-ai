const cron = require('node-cron');
const Analytics = require('../models/Analytics');
const Message = require('../models/MessageLog');
const Shop = require('../models/Shop');

async function runDailyAnalytics() {
  console.log('[Cron] Starting daily analytics...');

  const shops = await Shop.find({ active: true });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  for (const shop of shops) {
    try {
      const sales = await Analytics.aggregateSales(
        shop._id,
        yesterday,
        endOfYesterday
      );

      const messages = await Analytics.aggregateMessages(
        shop._id,
        yesterday,
        endOfYesterday
      );

      await Analytics.create({
        shopId: shop._id,
        date: yesterday,
        totalRevenue: sales.totalRevenue,
        totalOrders: sales.totalOrders,
        messagesSent: messages.messagesSent,
        messagesDelivered: messages.messagesDelivered
      });

      console.log(`[Cron] Done for shop: ${shop.name}`);
    } catch (err) {
      console.error(`[Cron] Error for shop ${shop._id}:`, err.message);
    }
  }

  console.log('[Cron] Daily analytics finished');
}

// ✅ FIXED CRON (DAILY 12 AM PAK TIME)
cron.schedule('0 0 * * *', runDailyAnalytics, {
  timezone: "Asia/Karachi"
});

module.exports = { runDailyAnalytics };