const express = require('express');
const router = express.Router();
const {
  getDailyLimit,
  getUsageStats,
  getRequestLogs,
  getMonthlyCost
} = require('../controllers/aiRequestLogController');
const {
  getRecommendations,
  getLatestRecommendations,
  getRecommendationHistory,
  updateRecommendationStatus,
  generateWhatsAppMessage
} = require('../controllers/aiController');
const auth = require('../middleware/auth');
const {
  assertShopAccess,
  assertRecommendationLogAccess,
} = require('../middleware/shopOwnership');

router.use(auth);

// ── Usage & Logs ──────────────────────────────────────────
router.get('/limit/:shopId',  getDailyLimit);
router.get('/stats/:shopId',  getUsageStats);
router.get('/logs/:shopId',   getRequestLogs);
router.get('/cost/:shopId',   getMonthlyCost);

// ── AI Recommendations ────────────────────────────────────
router.post('/recommendations', assertShopAccess, getRecommendations);
router.get('/recommendations/:shopId', assertShopAccess, getLatestRecommendations);
router.get('/recommendations/:shopId/history', assertShopAccess, getRecommendationHistory);
router.patch('/recommendations/:logId/status', assertRecommendationLogAccess, updateRecommendationStatus);

// ── WhatsApp Message Generation ───────────────────────────
router.post('/whatsapp-message', assertShopAccess, generateWhatsAppMessage);

module.exports = router;
