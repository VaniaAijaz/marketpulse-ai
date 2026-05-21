const express = require('express');
const router = express.Router();
const {
  getTodayAnalytics,
  getAnalyticsRange,
  getDashboardSummary,
  regenerateAnalytics,
  getKPIMetrics
} = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/today/:shopId', getTodayAnalytics);
router.get('/range/:shopId', getAnalyticsRange);
router.get('/summary/:shopId', getDashboardSummary);
router.get('/kpi/:shopId', getKPIMetrics);
router.post('/regenerate', regenerateAnalytics);

module.exports = router;