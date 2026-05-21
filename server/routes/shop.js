const express = require('express');
const router = express.Router();
const {
  createShop,
  getShopById,
  getShopsByOwner,
  updateShop,
  updateAISettings,
  updateWhatsAppStatus,
  getNearbyShops,
  resetDailyUsage,
  updateShopPlan
} = require('../controllers/shopController');
const auth = require('../middleware/auth');

router.get('/nearby', getNearbyShops); // public route
router.post('/reset-usage', resetDailyUsage); // cron route

router.use(auth); // below routes protected

router.post('/create', createShop);
router.get('/:id', getShopById);
router.get('/owner/:ownerId', getShopsByOwner);
router.put('/:id', updateShop);
router.patch('/:id/ai-settings', updateAISettings);
router.patch('/:id/whatsapp', updateWhatsAppStatus);
router.patch('/:id/plan', updateShopPlan);

module.exports = router;