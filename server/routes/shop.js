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
const { assertOwnerParam } = require('../middleware/shopOwnership');

// ✅ FIX: add express-validator body
const { body } = require('express-validator');


// ---------------- PUBLIC ROUTES ----------------
router.get('/nearby', getNearbyShops); // public route
router.post('/reset-usage', resetDailyUsage); // cron route


// ---------------- PROTECTED ROUTES ----------------
router.use(auth);


// ---------------- CREATE SHOP ----------------
router.post(
  '/create',
  [
    body('latitude').isNumeric(),
    body('longitude').isNumeric()
  ],
  createShop
);


// ---------------- FIX ROUTE ORDER ISSUE ----------------

// ⚠️ IMPORTANT: specific routes first

router.get('/owner/:ownerId', assertOwnerParam, getShopsByOwner);
router.patch('/:id/ai-settings', updateAISettings);
router.patch('/:id/whatsapp', updateWhatsAppStatus);
router.patch('/:id/plan', updateShopPlan);

router.get('/:id', getShopById);
router.put('/:id', updateShop);


module.exports = router;