const cron = require('node-cron');
const Analytics = require('../models/Analytics');
const Message = require('../models/Message');
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
      // Sales aggregate karo
      const sales = await Analytics.aggregateSales(shop._id, yesterday, endOfYesterday);

      // Messages aggregate karo
      const messages = await Analytics.aggregateMessages(shop._id, yesterday, endOfYesterday);

      // Save in Analytics collection
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

// Har raat 12 baje chalao: "0 0 *"
cron.schedule('* *', runDailyAnalytics, {
  timezone: "Asia/Karachi"
});

module.exports = { runDailyAnalytics };