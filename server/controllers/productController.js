const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc Create product
// @route POST /api/products/create
// @access Private
const createProduct = async (req, res, next) => {
  try {
    const { shopId, name, category, pricing, stock, description, imageUrl } = req.body;

    if (!shopId || !name || !pricing?.sellingPrice) {
      return res.status(400).json({ error: 'shopId, name, and sellingPrice required' });
    }

    const product = await Product.create({
      shopId,
      name,
      category,
      description,
      pricing,
      stock,
      imageUrl
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Product with this name already exists for this shop' });
    }
    next(err);
  }
};

// @desc Get all products for a shop
// @route GET /api/products/:shopId?category=food&search=chai&lowStock=true&page=1&limit=20
// @access Private
const getProducts = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { category, search, lowStock, page = 1, limit = 20 } = req.query;

    const query = { shopId, isActive: true };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'aiMeta.keywords': { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);

    // Low stock filter client side kyunki method use hota hai
    let filteredProducts = products;
    if (lowStock === 'true') {
      filteredProducts = products.filter(p => p.isLowStock());
    }

    res.json({
      success: true,
      data: {
        products: filteredProducts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get single product
// @route GET /api/products/product/:id
// @access Private
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Add virtual profitMargin to response
    const productObj = product.toObject({ virtuals: true });

    res.json({
      success: true,
      data: productObj
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update product
// @route PUT /api/products/:id
// @access Private
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update stock quantity
// @route PATCH /api/products/:id/stock
// @access Private
const updateStock = async (req, res, next) => {
  try {
    const { quantity, operation = 'set' } = req.body;
    // operation: 'set', 'add', 'subtract'

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

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
      data: product,
      lowStock: product.isLowStock()
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get low stock products
// @route GET /api/products/lowstock/:shopId
// @access Private
const getLowStockProducts = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    const products = await Product.find({ shopId, isActive: true });

    const lowStockProducts = products.filter(p => p.isLowStock());

    res.json({
      success: true,
      count: lowStockProducts.length,
      data: lowStockProducts
    });
  } catch (err) {
    next(err);
  }
};

// @desc Toggle product active status
// @route PATCH /api/products/:id/toggle
// @access Private
const toggleProductStatus = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    next(err);
  }
};

// @desc Delete product - soft delete
// @route DELETE /api/products/:id
// @access Private
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product deactivated successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  updateStock,
  getLowStockProducts,
  toggleProductStatus,
  deleteProduct
};