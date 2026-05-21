const Shop = require('../models/Shop');
const mongoose = require('mongoose');

// @desc Create new shop
// @route POST /api/shop/create
// @access Private
const createShop = async (req, res, next) => {
  try {
    const { ownerId, name, businessType, location, contact } = req.body;

    if (!ownerId ||!name ||!location?.coordinates) {
      return res.status(400).json({ error: 'ownerId, name, and location.coordinates required' });
    }

    const shop = await Shop.create({
      ownerId,
      name,
      businessType,
      location,
      contact
    });

    res.status(201).json({
      success: true,
      data: shop
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Shop name already exists for this owner' });
    }
    next(err);
  }
};

// @desc Get shop by ID
// @route GET /api/shop/:id
// @access Private
const getShopById = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id)
     .populate('ownerId', 'name email phone')
     .select('-social.facebookPageToken');

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json({
      success: true,
      data: shop
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get shops by owner
// @route GET /api/shop/owner/:ownerId
// @access Private
const getShopsByOwner = async (req, res, next) => {
  try {
    const shops = await Shop.find({ ownerId: req.params.ownerId, isActive: true })
     .select('-social.facebookPageToken');

    res.json({
      success: true,
      count: shops.length,
      data: shops
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update shop details
// @route PUT /api/shop/:id
// @access Private
const updateShop = async (req, res, next) => {
  try {
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-social.facebookPageToken');

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json({
      success: true,
      data: shop
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update AI settings
// @route PATCH /api/shop/:id/ai-settings
// @access Private
const updateAISettings = async (req, res, next) => {
  try {
    const { personality, language, responseMode, autoReplyEnabled, systemPrompt } = req.body;

    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      {
        'ai.personality': personality,
        'ai.language': language,
        'ai.responseMode': responseMode,
        'ai.autoReplyEnabled': autoReplyEnabled,
        'ai.systemPrompt': systemPrompt
      },
      { new: true, runValidators: true }
    ).select('-social.facebookPageToken');

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json({
      success: true,
      data: shop.ai
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update WhatsApp connection status
// @route PATCH /api/shop/:id/whatsapp
// @access Private
const updateWhatsAppStatus = async (req, res, next) => {
  try {
    const { connected, sessionId } = req.body;

    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      {
        'whatsapp.connected': connected,
        'whatsapp.sessionId': sessionId,
        'whatsapp.lastActive': connected? new Date() : null
      },
      { new: true }
    );

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json({
      success: true,
      data: shop.whatsapp
    });
  } catch (err) {
    next(err);
  }
};

// @desc Find nearby shops - geo query
// @route GET /api/shop/nearby?lng=74.3&lat=31.5&maxDistance=5000
// @access Public
const getNearbyShops = async (req, res, next) => {
  try {
    const { lng, lat, maxDistance = 5000 } = req.query;

    if (!lng ||!lat) {
      return res.status(400).json({ error: 'lng and lat required' });
    }

    const shops = await Shop.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(maxDistance) // meters
        }
      },
      isActive: true
    }).limit(20);

    res.json({
      success: true,
      count: shops.length,
      data: shops
    });
  } catch (err) {
    next(err);
  }
};

// @desc Reset daily AI usage - called by cron
// @route POST /api/shop/reset-usage
// @access Private
const resetDailyUsage = async (req, res, next) => {
  try {
    const shops = await Shop.find({ isActive: true });

    let resetCount = 0;
    for (let shop of shops) {
      const before = shop.usage.aiMessagesUsedToday;
      shop.resetDailyUsage();
      if (shop.usage.aiMessagesUsedToday === 0 && before > 0) {
        await shop.save();
        resetCount++;
      }
    }

    res.json({
      success: true,
      message: `Reset usage for ${resetCount} shops`
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update shop plan and limits
// @route PATCH /api/shop/:id/plan
// @access Private
const updateShopPlan = async (req, res, next) => {
  try {
    const { plan, limits } = req.body;

    const planLimits = {
      free: { aiMessagesPerDay: 50, customersLimit: 200 },
      basic: { aiMessagesPerDay: 200, customersLimit: 1000 },
      pro: { aiMessagesPerDay: 500, customersLimit: 5000 },
      enterprise: { aiMessagesPerDay: 2000, customersLimit: 20000 }
    };

    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      {
        plan,
        limits: limits || planLimits[plan]
      },
      { new: true }
    );

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json({
      success: true,
      data: shop
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createShop,
  getShopById,
  getShopsByOwner,
  updateShop,
  updateAISettings,
  updateWhatsAppStatus,
  getNearbyShops,
  resetDailyUsage,
  updateShopPlan
};