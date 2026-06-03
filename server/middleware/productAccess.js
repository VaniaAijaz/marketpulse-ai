const Product = require('../models/Product');
const Shop = require('../models/Shop');

const assertShopIdAccess = async (req, res, next) => {
  try {
    const shopId = req.params.shopId || req.body.shopId;
    if (!shopId) {
      return res.status(400).json({ success: false, error: 'shopId is required' });
    }

    const shop = await Shop.findById(shopId).select('ownerId');
    if (!shop) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }
    if (shop.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    req.shopId = shopId;
    next();
  } catch (err) {
    next(err);
  }
};

const assertProductIdAccess = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).select('shopId');
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const shop = await Shop.findById(product.shopId).select('ownerId');
    if (!shop || shop.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    req.product = product;
    req.shopId = product.shopId;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { assertShopIdAccess, assertProductIdAccess };
