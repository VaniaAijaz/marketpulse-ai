const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { getInventorySummary } = require('../services/inventoryService');
const { isCategoryAllowed } = require('../utils/businessCatalog');

function normalizeStockPayload(body) {
  if (body.quantity !== undefined) {
    return { quantity: Math.max(0, parseInt(body.quantity, 10) || 0), operation: body.operation || 'set' };
  }
  if (body.stock !== undefined) {
    const q = parseInt(body.stock, 10);
    return { quantity: Math.max(0, Number.isNaN(q) ? 0 : q), operation: 'set' };
  }
  return null;
}

function enrichProduct(doc) {
  const obj = doc.toObject ? doc.toObject({ virtuals: true }) : doc;
  return {
    ...obj,
    isLowStock: doc.isLowStock ? doc.isLowStock() : (obj.stock?.quantity ?? 0) <= (obj.stock?.lowStockThreshold ?? 5),
    aiEligible: (obj.stock?.quantity ?? 0) > 0 && obj.isActive !== false,
  };
}

// @desc Create product
// @route POST /api/products/create
const createProduct = async (req, res, next) => {
  try {
    const { shopId, name, category, pricing, stock, description, imageUrl } = req.body;

    if (!shopId || !name?.trim() || pricing?.sellingPrice == null) {
      return res.status(400).json({ success: false, error: 'shopId, name, and sellingPrice are required' });
    }

    const shop = await Shop.findById(shopId).select('businessType ownerId');
    if (!shop || shop.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const cat = category || 'other';
    if (!isCategoryAllowed(shop.businessType, cat)) {
      return res.status(400).json({
        success: false,
        error: `Category "${cat}" is not valid for a ${shop.businessType} shop`,
      });
    }

    const qty = Math.max(0, parseInt(stock?.quantity, 10) || 0);

    const product = await Product.create({
      shopId,
      name: name.trim(),
      category: category || 'other',
      description,
      pricing: {
        costPrice: Number(pricing?.costPrice) || 0,
        sellingPrice: Number(pricing.sellingPrice),
        currency: pricing?.currency || 'PKR',
      },
      stock: {
        quantity: qty,
        lowStockThreshold: Math.max(0, parseInt(stock?.lowStockThreshold, 10) || 5),
        unit: stock?.unit || 'pcs',
      },
      imageUrl,
    });

    res.status(201).json({
      success: true,
      data: enrichProduct(product),
      inventoryHint: qty > 0 ? 'ai_ready' : 'add_stock_for_ai',
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Product with this name already exists for this shop' });
    }
    next(err);
  }
};

// @desc Inventory summary for AI readiness
// @route GET /api/products/summary/:shopId
const getInventorySummaryHandler = async (req, res, next) => {
  try {
    const summary = await getInventorySummary(req.params.shopId);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

// @desc Get all products for a shop
// @route GET /api/products/shop/:shopId
const getProducts = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { category, search, lowStock, page = 1, limit = 100 } = req.query;

    const query = { shopId, isActive: true };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (lowStock === 'true') {
      query.$expr = {
        $and: [
          { $gt: ['$stock.quantity', 0] },
          { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] },
        ],
      };
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ 'stock.quantity': -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        products: products.map(enrichProduct),
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, data: enrichProduct(product) });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const shop = await Shop.findById(existing.shopId).select('businessType ownerId');
    if (!shop || shop.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const updates = { ...req.body };
    delete updates.shopId;
    delete updates._id;

    if (updates.category && !isCategoryAllowed(shop.businessType, updates.category)) {
      return res.status(400).json({
        success: false,
        error: `Category "${updates.category}" is not valid for a ${shop.businessType} shop`,
      });
    }

    if (updates.pricing?.sellingPrice != null) {
      updates.pricing.sellingPrice = Number(updates.pricing.sellingPrice);
    }
    if (updates.stock?.quantity != null) {
      updates.stock.quantity = Math.max(0, parseInt(updates.stock.quantity, 10) || 0);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({
      success: true,
      data: enrichProduct(product),
      inventoryHint: product.stock.quantity > 0 ? 'ai_ready' : 'out_of_stock',
    });
  } catch (err) {
    next(err);
  }
};

const updateStock = async (req, res, next) => {
  try {
    const parsed = normalizeStockPayload(req.body);
    if (!parsed) {
      return res.status(400).json({ success: false, error: 'quantity or stock is required' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const { quantity, operation } = parsed;

    if (operation === 'add') {
      product.stock.quantity += quantity;
    } else if (operation === 'subtract') {
      product.stock.quantity = Math.max(0, product.stock.quantity - quantity);
    } else {
      product.stock.quantity = quantity;
    }

    await product.save();

    res.json({
      success: true,
      data: enrichProduct(product),
      lowStock: product.isLowStock(),
      aiEligible: product.stock.quantity > 0,
      inventoryHint: product.stock.quantity > 0 ? 'ai_ready' : 'out_of_stock',
    });
  } catch (err) {
    next(err);
  }
};

const getLowStockProducts = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    const products = await Product.find({
      shopId,
      isActive: true,
      $expr: {
        $and: [
          { $gt: ['$stock.quantity', 0] },
          { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] },
        ],
      },
    }).sort({ 'stock.quantity': 1 });

    res.json({
      success: true,
      count: products.length,
      data: products.map(enrichProduct),
    });
  } catch (err) {
    next(err);
  }
};

const toggleProductStatus = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.json({ success: true, data: enrichProduct(product) });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product deactivated successfully',
      data: { shopId: product.shopId },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProduct,
  getInventorySummaryHandler,
  getProducts,
  getProductById,
  updateProduct,
  updateStock,
  getLowStockProducts,
  toggleProductStatus,
  deleteProduct,
};
