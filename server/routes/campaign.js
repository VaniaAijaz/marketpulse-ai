const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  getCampaigns, getSegmentCounts, previewRecipients,
  aiGenerateMessage, sendCampaign, scheduleCampaign,
  getCampaignAnalytics, generateCoupon, getSmartSuggestions, getTemplates,
} = require('../controllers/campaignController');

router.use(auth);

router.get('/templates',               getTemplates);
router.get('/segment-counts/:shopId',  getSegmentCounts);
router.get('/analytics/:shopId',       getCampaignAnalytics);
router.get('/suggestions/:shopId',     getSmartSuggestions);
router.get('/:shopId',                 getCampaigns);

router.post('/preview',        previewRecipients);
router.post('/ai-generate',    aiGenerateMessage);
router.post('/send',           sendCampaign);
router.post('/schedule',       scheduleCampaign);
router.post('/coupon/generate', generateCoupon);

module.exports = router;
