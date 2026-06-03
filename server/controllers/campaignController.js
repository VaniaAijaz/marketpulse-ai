const Campaign  = require('../models/Campaign');
const Customer  = require('../models/Customer');
const MessageLog = require('../models/MessageLog');
const mongoose  = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');
const { generateMessage } = require('../services/aiService');

// ── Helper: get recipients by segment ────────────────────
async function getRecipients(shopId, segment) {
  const query = { shopId, isActive: true, isBlocked: false, whatsappOptIn: true };
  if (segment && segment !== 'all') query.segment = segment;
  return Customer.find(query).select('_id phone name segment').lean();
}

// ── GET /api/campaigns/:shopId — list campaigns ───────────
const getCampaigns = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const { page = 1, limit = 20, status } = req.query;
  const query = { shopId };
  if (status) query.status = status;

  const [campaigns, total] = await Promise.all([
    Campaign.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
    Campaign.countDocuments(query),
  ]);
  res.json({ success: true, data: { campaigns, pagination: { page: parseInt(page), total } } });
});

// ── GET /api/campaigns/segment-counts/:shopId ─────────────
const getSegmentCounts = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const segments = ['all', 'vip', 'active', 'regular', 'new', 'inactive'];
  const counts = {};

  await Promise.all(segments.map(async seg => {
    const query = { shopId, isActive: true, isBlocked: false, whatsappOptIn: true };
    if (seg !== 'all') query.segment = seg;
    counts[seg] = await Customer.countDocuments(query);
  }));

  res.json({ success: true, data: counts });
});

// ── POST /api/campaigns/preview ───────────────────────────
const previewRecipients = asyncHandler(async (req, res) => {
  const { shopId, segment } = req.body;
  const recipients = await getRecipients(shopId, segment);
  res.json({ success: true, data: { count: recipients.length, sample: recipients.slice(0, 5) } });
});

// ── POST /api/campaigns/ai-generate ──────────────────────
const aiGenerateMessage = asyncHandler(async (req, res) => {
  const { shopId, goal, productName, discount, segment, couponCode } = req.body;

  const prompt = `You are a WhatsApp marketing expert for Pakistani small businesses.

Campaign goal: ${goal || 'promotion'}
Product/Service: ${productName || 'our products'}
Discount: ${discount || 'special offer'}
Target segment: ${segment || 'all customers'}
${couponCode ? `Coupon code: ${couponCode}` : ''}

Write a compelling WhatsApp marketing message in Hinglish (Urdu + English mix).
Rules:
- Max 200 characters
- Include 1-2 relevant emojis
- Clear call-to-action
- Friendly, not corporate
- Include coupon code if provided
- Return ONLY the message text, nothing else`;

  const result = await generateMessage({ shopId, prompt });
  res.json({ success: true, data: { message: result.message } });
});

// ── POST /api/campaigns/send ──────────────────────────────
const sendCampaign = asyncHandler(async (req, res) => {
  const { shopId, name, segment, message, couponCode, couponExpiry } = req.body;

  const recipients = await getRecipients(shopId, segment);
  if (!recipients.length) {
    return res.status(400).json({ success: false, error: 'No opted-in customers in this segment' });
  }

  // Create campaign record
  const campaign = await Campaign.create({
    shopId, name, segment, message, couponCode, couponExpiry,
    status: 'sending',
    stats: { recipientCount: recipients.length },
    sentAt: new Date(),
    createdBy: 'manual',
  });

  // Log each message (actual WhatsApp API call would go here)
  const logs = recipients.map(c => ({
    shopId,
    customerId: c._id,
    recipient: { phone: c.phone, name: c.name },
    type: 'text',
    message: { body: couponCode ? `${message}\n\nCoupon: ${couponCode}` : message },
    campaign: { id: campaign._id, name, trigger: 'manual' },
    whatsapp: { status: 'sent' },
    timestamps: { queuedAt: new Date(), sentAt: new Date() },
    metadata: { createdBy: 'admin' },
  }));

  await MessageLog.insertMany(logs);

  // Update campaign stats
  campaign.status = 'sent';
  campaign.stats.sentCount = recipients.length;
  await campaign.save();

  res.json({
    success: true,
    data: { campaignId: campaign._id, sentCount: recipients.length, message: 'Campaign sent successfully' },
  });
});

// ── POST /api/campaigns/schedule ─────────────────────────
const scheduleCampaign = asyncHandler(async (req, res) => {
  const { shopId, name, segment, message, couponCode, scheduledAt } = req.body;

  if (!scheduledAt) return res.status(400).json({ success: false, error: 'scheduledAt is required' });
  if (new Date(scheduledAt) <= new Date()) {
    return res.status(400).json({ success: false, error: 'Scheduled time must be in the future' });
  }

  const recipients = await getRecipients(shopId, segment);
  const campaign = await Campaign.create({
    shopId, name, segment, message, couponCode,
    status: 'scheduled',
    scheduledAt: new Date(scheduledAt),
    stats: { recipientCount: recipients.length },
    createdBy: 'manual',
  });

  res.json({ success: true, data: campaign });
});

// ── GET /api/campaigns/analytics/:shopId ─────────────────
const getCampaignAnalytics = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const sid = new mongoose.Types.ObjectId(shopId);

  const [msgStats, campaignCount, recentCampaigns] = await Promise.all([
    MessageLog.aggregate([
      { $match: { shopId: sid } },
      { $group: {
        _id: '$whatsapp.status',
        count: { $sum: 1 },
      }},
    ]),
    Campaign.countDocuments({ shopId }),
    Campaign.find({ shopId, status: 'sent' })
      .sort({ createdAt: -1 }).limit(5)
      .select('name segment stats sentAt'),
  ]);

  const statMap = msgStats.reduce((a, s) => { a[s._id] = s.count; return a; }, {});
  const total = Object.values(statMap).reduce((a, b) => a + b, 0) || 1;

  res.json({
    success: true,
    data: {
      totalCampaigns: campaignCount,
      totalMessages:  total,
      sent:       statMap.sent       || 0,
      delivered:  statMap.delivered  || 0,
      read:       statMap.read       || 0,
      failed:     statMap.failed     || 0,
      deliveryRate: total > 0 ? (((statMap.delivered || 0) + (statMap.read || 0)) / total * 100).toFixed(1) : '0',
      readRate:     (statMap.delivered || 0) > 0 ? ((statMap.read || 0) / (statMap.delivered || 0) * 100).toFixed(1) : '0',
      recentCampaigns,
    },
  });
});

// ── POST /api/campaigns/coupon/generate ──────────────────
const generateCoupon = asyncHandler(async (req, res) => {
  const { type = 'discount', value = 10 } = req.body;
  const prefixes = { discount: 'SAVE', welcome: 'WELCOME', vip: 'VIP', festival: 'EID' };
  const prefix = prefixes[type] || 'DEAL';
  const code = `${prefix}${value}`;
  res.json({ success: true, data: { code, type, value } });
});

// ── GET /api/campaigns/suggestions/:shopId ────────────────
const getSmartSuggestions = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const suggestions = [];

  const [inactiveCount, vipCount, totalCount, lastCampaign] = await Promise.all([
    Customer.countDocuments({ shopId, segment: 'inactive', isActive: true }),
    Customer.countDocuments({ shopId, segment: 'vip', isActive: true }),
    Customer.countDocuments({ shopId, isActive: true }),
    Campaign.findOne({ shopId, status: 'sent' }).sort({ sentAt: -1 }).select('sentAt segment'),
  ]);

  if (inactiveCount > 0) {
    suggestions.push({
      id: 'inactive_revival',
      priority: 'high',
      title: `${inactiveCount} Customers Inactive`,
      desc: 'Send a comeback offer to bring them back',
      segment: 'inactive',
      icon: 'person_off',
      color: '#f43f5e',
      template: `Aapko miss kar rahe hain! 🏪 Aaj wapas aayen aur special discount payen. Limited time offer!`,
    });
  }

  if (vipCount > 0) {
    const daysSinceLastCampaign = lastCampaign
      ? Math.floor((Date.now() - lastCampaign.sentAt) / 86400000)
      : 999;
    if (daysSinceLastCampaign > 7) {
      suggestions.push({
        id: 'vip_loyalty',
        priority: 'medium',
        title: `${vipCount} VIP Customers Waiting`,
        desc: 'Reward your best customers with exclusive offer',
        segment: 'vip',
        icon: 'workspace_premium',
        color: '#f59e0b',
        template: `Aap hamare VIP customer hain! 👑 Exclusive ${vipCount > 5 ? '25%' : '20%'} off sirf aapke liye. Offer valid today only!`,
      });
    }
  }

  const newCount = await Customer.countDocuments({ shopId, segment: 'new', isActive: true });
  if (newCount > 0) {
    suggestions.push({
      id: 'welcome_new',
      priority: 'medium',
      title: `${newCount} New Customers`,
      desc: 'Send welcome message to new customers',
      segment: 'new',
      icon: 'person_add',
      color: '#1390ff',
      template: `Hamare family mein aapka swagat hai! 🎉 Pehli purchase par 10% off. Code: WELCOME10`,
    });
  }

  res.json({ success: true, data: suggestions });
});

// ── TEMPLATES ─────────────────────────────────────────────
const TEMPLATES = [
  { id: 'welcome',       label: 'Welcome',        icon: 'waving_hand',   color: '#1390ff', body: 'Hamare store mein aapka swagat hai! 🎉 Aaj pehli purchase par 10% off milega. Zaroor aayen!' },
  { id: 'flash_sale',    label: 'Flash Sale',      icon: 'local_offer',   color: '#f43f5e', body: '⚡ FLASH SALE! Aaj sirf 6 ghantey ke liye 20% off sab products par. Abhi order karein!' },
  { id: 'new_product',   label: 'New Arrival',     icon: 'new_releases',  color: '#22c55e', body: '🆕 Naya product aa gaya! Check karein hamari latest collection. Limited stock available!' },
  { id: 'festival',      label: 'Festival Sale',   icon: 'celebration',   color: '#7c3aed', body: '🌙 Eid Mubarak! Is khas mauqe par 30% off enjoy karein. Family k liye best deals!' },
  { id: 'order_confirm', label: 'Order Confirmed', icon: 'check_circle',  color: '#14b8a6', body: '✅ Aapka order confirm ho gaya! Hum jaldi deliver karenge. Shukriya hamare saath shopping ke liye!' },
  { id: 'comeback',      label: 'Come Back',       icon: 'person_search', color: '#f59e0b', body: '💌 Aapko miss kar rahe hain! Wapas aayen aur special 15% discount payen. Sirf aapke liye!' },
  { id: 'vip_reward',    label: 'VIP Reward',      icon: 'star',          color: '#f59e0b', body: '👑 Aap hamare VIP hain! Exclusive offer: 25% off aapki next purchase par. Offer expires Sunday!' },
  { id: 'birthday',      label: 'Birthday',        icon: 'cake',          color: '#ec4899', body: '🎂 Aapki birthday par dil se mubarak ho! Gift ke taur par 20% off. Enjoy your special day!' },
];

const getTemplates = asyncHandler(async (req, res) => {
  res.json({ success: true, data: TEMPLATES });
});

module.exports = {
  getCampaigns, getSegmentCounts, previewRecipients,
  aiGenerateMessage, sendCampaign, scheduleCampaign,
  getCampaignAnalytics, generateCoupon, getSmartSuggestions, getTemplates,
};
