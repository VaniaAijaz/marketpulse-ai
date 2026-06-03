/**
 * scheduledCampaigns.js
 * Runs every minute — finds campaigns due to send and executes them.
 */
const cron     = require('node-cron');
const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const MessageLog = require('../models/MessageLog');

async function runScheduledCampaigns() {
  const due = await Campaign.find({
    status: 'scheduled',
    scheduledAt: { $lte: new Date() },
  }).limit(20);

  if (!due.length) return;

  console.log(`[ScheduledCampaigns] Processing ${due.length} campaign(s)`);

  for (const campaign of due) {
    try {
      campaign.status = 'sending';
      await campaign.save();

      const query = {
        shopId: campaign.shopId,
        isActive: true,
        isBlocked: false,
        whatsappOptIn: true,
      };
      if (campaign.segment !== 'all') query.segment = campaign.segment;
      const recipients = await Customer.find(query).select('_id phone name').lean();

      const body = campaign.couponCode
        ? `${campaign.message}\n\nCoupon: ${campaign.couponCode}`
        : campaign.message;

      const logs = recipients.map(c => ({
        shopId:     campaign.shopId,
        customerId: c._id,
        recipient:  { phone: c.phone, name: c.name },
        type:       'text',
        message:    { body },
        campaign:   { id: campaign._id, name: campaign.name, trigger: 'manual' },
        whatsapp:   { status: 'sent' },
        timestamps: { queuedAt: new Date(), sentAt: new Date() },
        metadata:   { createdBy: 'system' },
      }));

      if (logs.length) await MessageLog.insertMany(logs);

      campaign.status     = 'sent';
      campaign.sentAt     = new Date();
      campaign.stats.recipientCount = recipients.length;
      campaign.stats.sentCount      = recipients.length;
      await campaign.save();

      console.log(`[ScheduledCampaigns] "${campaign.name}" sent to ${recipients.length} customers`);
    } catch (err) {
      campaign.status = 'failed';
      await campaign.save();
      console.error(`[ScheduledCampaigns] Failed "${campaign.name}":`, err.message);
    }
  }
}

// Run every minute
cron.schedule('* * * * *', async () => {
  try {
    await runScheduledCampaigns();
  } catch (err) {
    console.error('[ScheduledCampaigns] Cron error:', err.message);
  }
}, { timezone: 'Asia/Karachi' });

module.exports = { runScheduledCampaigns };
