const Customer = require('../models/Customer');
const mongoose = require('mongoose');

// @desc Create or update customer by phone
// @route POST /api/customers/upsert
// @access Private
const upsertCustomer = async (req, res, next) => {
  try {
    const { shopId, phone, name, email } = req.body;

    if (!shopId || !phone) {
      return res.status(400).json({ error: 'shopId and phone required' });
    }

    const customer = await Customer.findOneAndUpdate(
      { shopId, phone },
      { 
        $set: { name, email },
        $setOnInsert: { firstVisit: new Date() }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      data: customer
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get all customers for a shop
// @route GET /api/customers/:shopId?page=1&limit=20&segment=vip&search=ali
// @access Private
const getCustomers = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { page = 1, limit = 20, segment, search } = req.query;

    const query = { shopId, isActive: true };

    if (segment) query.segment = segment;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ 'stats.totalSpent': -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .select('-__v'),
      Customer.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        customers,
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

// @desc Get single customer by ID
// @route GET /api/customers/:id
// @access Private
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update customer activity after order
// @route POST /api/customers/:id/activity
// @access Private
const updateCustomerActivity = async (req, res, next) => {
  try {
    const { orderAmount } = req.body;

    if (!orderAmount) {
      return res.status(400).json({ error: 'orderAmount required' });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await customer.updateActivity(orderAmount);

    res.json({
      success: true,
      data: customer
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get inactive customers for re-engagement
// @route GET /api/customers/inactive/:shopId?days=7
// @access Private
const getInactiveCustomers = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const days = parseInt(req.query.days) || 7;

    const customers = await Customer.getInactiveCustomers(shopId, days);

    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get top customers by spend
// @route GET /api/customers/top/:shopId?limit=10
// @access Private
const getTopCustomers = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const customers = await Customer.getTopCustomers(shopId, limit);

    res.json({
      success: true,
      data: customers
    });
  } catch (err) {
    next(err);
  }
};

// @desc Add tag to customer
// @route POST /api/customers/:id/tag
// @access Private
const addCustomerTag = async (req, res, next) => {
  try {
    const { tag } = req.body;

    if (!tag) {
      return res.status(400).json({ error: 'tag required' });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await customer.addTag(tag);

    res.json({
      success: true,
      data: customer
    });
  } catch (err) {
    next(err);
  }
};

// @desc Block/Unblock customer
// @route PATCH /api/customers/:id/block
// @access Private
const toggleBlockCustomer = async (req, res, next) => {
  try {
    const { isBlocked, reason } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { 
        isBlocked, 
        blockReason: reason,
        segment: isBlocked ? 'blocked' : 'new'
      },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Recalculate stats for all customers of a shop from actual orders
// @route POST /api/customers/backfill/:shopId
// @access Private
const backfillCustomerStats = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const Order = require('mongoose').model('Order');
    const { calculateSegment } = require('../utils/customerSegment');

    // Aggregate all paid orders per customer
    const stats = await Order.aggregate([
      {
        $match: {
          shopId: require('mongoose').Types.ObjectId.createFromHexString(shopId),
          'payment.status': 'paid',
          customerId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$customerId',
          totalOrders:     { $sum: 1 },
          totalSpent:      { $sum: '$pricing.total' },
          lastOrderAmount: { $last: '$pricing.total' },
          lastOrderDate:   { $max: '$createdAt' },
          visitCount:      { $sum: 1 },
        },
      },
    ]);

    let updated = 0;
    for (const s of stats) {
      const avgOrderValue = s.totalOrders > 0 ? s.totalSpent / s.totalOrders : 0;

      // Fetch current doc to check isBlocked (never override blocked)
      const existing = await Customer.findById(s._id).select('isBlocked segment').lean();
      if (!existing) continue;

      const newSegment = calculateSegment({
        isBlocked:     existing.isBlocked,
        totalOrders:   s.totalOrders,
        totalSpent:    s.totalSpent,
        lastOrderDate: s.lastOrderDate,
      });

      await Customer.findByIdAndUpdate(s._id, {
        $set: {
          'stats.totalOrders':     s.totalOrders,
          'stats.totalSpent':      s.totalSpent,
          'stats.avgOrderValue':   avgOrderValue,
          'stats.lastOrderAmount': s.lastOrderAmount,
          'stats.visitCount':      s.visitCount,
          lastVisit:               s.lastOrderDate,
          lastOrderDate:           s.lastOrderDate,
          segment:                 newSegment,
        },
      });
      updated++;
    }

    res.json({ success: true, message: `Backfilled ${updated} customers`, updated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  upsertCustomer,
  getCustomers,
  getCustomerById,
  updateCustomerActivity,
  getInactiveCustomers,
  getTopCustomers,
  addCustomerTag,
  toggleBlockCustomer,
  backfillCustomerStats,
};