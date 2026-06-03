const Shop = require('../models/Shop');
const User = require('../models/User');
const Product = require('../models/Product');
const RecommendationLog = require('../models/RecommendationLog');
const WeatherSnapshot = require('../models/WeatherSnapshot');
const mongoose = require('mongoose');

function buildLocationFromBody(body) {
  if (body.location?.coordinates?.length === 2) {
    return body.location;
  }

  const lat = parseFloat(body.latitude);
  const lng = parseFloat(body.longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return {
    type: 'Point',
    coordinates: [lng, lat],
    address: body.address || body.street || '',
    city: body.city || '',
    area: body.area || '',
    street: body.street || body.address || '',
  };
}

// @desc Create new shop
// @route POST /api/shop/create
// @access Private
const createShop = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    if (user.shopId) {
      return res.status(400).json({
        success: false,
        error: 'You already have a registered shop. One email account = one shop only.',
      });
    }

    const existing = await Shop.findOne({ ownerId: req.user._id, isActive: true });
    if (existing) {
      user.shopId = existing._id;
      user.businessType = user.businessType || existing.businessType;
      await user.save();
      return res.status(400).json({
        success: false,
        error: 'You already have a shop on this account.',
        data: existing,
      });
    }

    const { name, businessType, contact } = req.body;
    const location = buildLocationFromBody(req.body);
    const lockedType = user.businessType || businessType || 'other';

    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: 'Shop name is required' });
    }
    if (!location) {
      return res.status(400).json({ success: false, error: 'Select your area on the map to set shop location' });
    }
    if (!location.city || !location.area) {
      return res.status(400).json({ success: false, error: 'City and area are required' });
    }

    const shop = await Shop.create({
      ownerId: req.user._id,
      name: name.trim(),
      businessType: lockedType,
      location,
      contact,
    });

    user.shopId = shop._id;
    user.businessType = lockedType;
    await user.save();

    res.status(201).json({
      success: true,
      data: shop,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Shop name already exists for this owner' });
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
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }
    if (shop.ownerId._id?.toString() !== req.user._id.toString() && shop.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    res.json({
      success: true,
      data: shop,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get shops by owner with AI + weather snapshot
const getShopsByOwner = async (req, res, next) => {
  try {
    const ownerId = req.params.ownerId;

    const shops = await Shop.find({ ownerId, isActive: true })
      .select('-social.facebookPageToken')
      .sort({ updatedAt: -1 })
      .lean();

    if (!shops.length) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const shopIds = shops.map((s) => s._id);

    const [latestRecs, latestWeather, productCounts] = await Promise.all([
      RecommendationLog.aggregate([
        { $match: { shopId: { $in: shopIds } } },
        { $sort: { generatedAt: -1 } },
        {
          $group: {
            _id: '$shopId',
            generatedAt: { $first: '$generatedAt' },
            insight: { $first: '$insight' },
            confidenceScore: { $first: '$confidenceScore' },
            topProduct: { $first: { $arrayElemAt: ['$recommendations.productName', 0] } },
            weatherContext: { $first: '$weatherContext' },
          },
        },
      ]),
      WeatherSnapshot.aggregate([
        { $match: { shopId: { $in: shopIds } } },
        { $sort: { fetchedAt: -1 } },
        {
          $group: {
            _id: '$shopId',
            temp: { $first: '$weather.temp' },
            condition: { $first: '$weather.condition' },
            city: { $first: '$location.city' },
            fetchedAt: { $first: '$fetchedAt' },
          },
        },
      ]),
      Product.aggregate([
        { $match: { shopId: { $in: shopIds }, isActive: true } },
        { $group: { _id: '$shopId', count: { $sum: 1 }, inStock: { $sum: { $cond: [{ $gt: ['$stock.quantity', 0] }, 1, 0] } } } },
      ]),
    ]);

    const recMap = Object.fromEntries(latestRecs.map((r) => [r._id.toString(), r]));
    const weatherMap = Object.fromEntries(latestWeather.map((w) => [w._id.toString(), w]));
    const productMap = Object.fromEntries(productCounts.map((p) => [p._id.toString(), p]));

    const enriched = shops.map((shop) => {
      const id = shop._id.toString();
      const rec = recMap[id];
      const wx = weatherMap[id];
      const prod = productMap[id];
      return {
        ...shop,
        productCount: prod?.count || 0,
        inStockCount: prod?.inStock || 0,
        lastRecommendation: rec
          ? {
              generatedAt: rec.generatedAt,
              insight: rec.insight,
              confidenceScore: rec.confidenceScore,
              topProduct: rec.topProduct,
              weatherTemp: rec.weatherContext?.temp,
            }
          : null,
        weather: wx
          ? { temp: wx.temp, condition: wx.condition, city: wx.city, fetchedAt: wx.fetchedAt }
          : null,
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update shop
const updateShop = async (req, res, next) => {
  try {
    const existing = await Shop.findById(req.params.id).select('ownerId');
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }
    if (existing.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const updates = { ...req.body };
    delete updates.ownerId;
    delete updates.businessType;

    const loc = buildLocationFromBody(req.body);
    if (loc) updates.location = loc;

    const shop = await Shop.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-social.facebookPageToken');

    res.json({ success: true, data: shop });
  } catch (err) {
    next(err);
  }
};

// @desc AI settings update
const assertShopOwnerById = async (shopId, userId) => {
  const shop = await Shop.findById(shopId).select('ownerId');
  if (!shop) return { error: 'Shop not found', status: 404 };
  if (shop.ownerId.toString() !== userId.toString()) return { error: 'Forbidden', status: 403 };
  return { shop };
};

const updateAISettings = async (req, res, next) => {
  try {
    const check = await assertShopOwnerById(req.params.id, req.user._id);
    if (check.error) return res.status(check.status).json({ success: false, error: check.error });

    const {
      personality,
      language,
      responseMode,
      autoReplyEnabled,
      systemPrompt
    } = req.body;

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

// @desc WhatsApp status
const updateWhatsAppStatus = async (req, res, next) => {
  try {
    const check = await assertShopOwnerById(req.params.id, req.user._id);
    if (check.error) return res.status(check.status).json({ success: false, error: check.error });

    const { connected, sessionId } = req.body;

    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      {
        'whatsapp.connected': connected,
        'whatsapp.sessionId': sessionId,
        'whatsapp.lastActive': connected ? new Date() : null
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

// @desc Nearby shops
const getNearbyShops = async (req, res, next) => {
  try {
    const { lng, lat, maxDistance = 5000 } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ error: 'lng and lat required' });
    }

    // ✅ FIXED: parse safety
    const lngNum = parseFloat(lng);
    const latNum = parseFloat(lat);

    if (isNaN(lngNum) || isNaN(latNum)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const shops = await Shop.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lngNum, latNum]
          },
          $maxDistance: parseInt(maxDistance)
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

// @desc Reset AI usage
const resetDailyUsage = async (req, res, next) => {
  try {
    const shops = await Shop.find({ isActive: true });

    let resetCount = 0;

    // ✅ FIXED loop
    for (const shop of shops) {
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

// @desc Plan update
const updateShopPlan = async (req, res, next) => {
  try {
    const check = await assertShopOwnerById(req.params.id, req.user._id);
    if (check.error) return res.status(check.status).json({ success: false, error: check.error });

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