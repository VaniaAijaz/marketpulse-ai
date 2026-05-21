const express = require('express');
const router = express.Router();
const {
  getDailyLimit,
  getUsageStats,
  getRequestLogs,
  getMonthlyCost
} = require('../controllers/aiRequestLogController');
const auth = require('../middleware/auth');

router.use(auth); 

router.get('/limit/:shopId', getDailyLimit);
router.get('/stats/:shopId', getUsageStats);
router.get('/logs/:shopId', getRequestLogs);
router.get('/cost/:shopId', getMonthlyCost);

module.exports = router;