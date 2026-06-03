const Shop = require('../models/Shop');
const RecommendationLog = require('../models/RecommendationLog');

/** Ensure :ownerId param matches logged-in user */
const assertOwnerParam = (req, res, next) => {
  if (req.params.ownerId && req.params.ownerId !== req.user._id.toString()) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  next();
};

/** Ensure shopId in body/params belongs to req.user */
const assertShopAccess = async (req, res, next) => {
  try {
    const shopId = req.params.shopId || req.body.shopId;
    if (!shopId) {
      return res.status(400).json({ success: false, error: 'shopId is required' });
    }

    const shop = await Shop.findById(shopId).select('ownerId name');
    if (!shop) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }
    if (shop.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized for this shop' });
    }

    req.shop = shop;
    next();
  } catch (err) {
    next(err);
  }
};

/** Ensure recommendation log belongs to user's shop */
const assertRecommendationLogAccess = async (req, res, next) => {
  try {
    const log = await RecommendationLog.findById(req.params.logId).select('shopId');
    if (!log) {
      return res.status(404).json({ success: false, error: 'Log not found' });
    }

    const shop = await Shop.findById(log.shopId).select('ownerId');
    if (!shop || shop.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    req.recommendationLog = log;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  assertOwnerParam,
  assertShopAccess,
  assertRecommendationLogAccess,
};
