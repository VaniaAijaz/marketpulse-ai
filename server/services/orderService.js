const Order = require('../models/Order');
const mongoose = require('mongoose');
const generateOrderNo = require('../utils/generateOrderNo');
const { validatePhone } = require('../utils/validatePhone');

// Create order with validation + order number
const createOrder = async ({ shopId, customerName, customerPhone, customerId, items, pricing }) => {
  // Phone validate
  const phoneCheck = validatePhone(customerPhone);
  if (!phoneCheck.valid) throw new Error(phoneCheck.error);

  // Order number generate
  const orderNumber = generateOrderNo(shopId);

  const order = await Order.create({
    shopId,
    orderNumber,
    customerName,
    customerPhone: phoneCheck.formatted,
    customerId,
    items,
    pricing
  });

  return order;
};

// Get orders with pagination + filters
const getOrdersByShop = async ({ shopId, status, page = 1, limit = 20 }) => {
  const query = { shopId };
  if (status) query.status = status;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('customerId', 'name phone')
      .populate('items.productId', 'name'),
    Order.countDocuments(query)
  ]);

  return {
    orders,
    pagination: { page: parseInt(page), limit: parseInt(limit), total }
  };
};

// Update order status
const updateOrderStatus = async (orderId, status) => {
  const validStatuses = ['pending', 'confirmed', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) throw new Error('Invalid status');

  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');

  order.status = status;
  if (status === 'delivered') {
    await order.markDelivered();
  } else {
    await order.save();
  }

  return order;
};

// Get sales stats for date range
const getOrderStats = async ({ shopId, start, end }) => {
  const startDate = new Date(start || Date.now() - 7 * 24 * 60 * 60 * 1000);
  const endDate = new Date(end || Date.now());

  const stats = await Order.aggregate([
    { $match: { shopId: new mongoose.Types.ObjectId(shopId), createdAt: { $gte: startDate, $lte: endDate } }},
    { $group: {
      _id: '$status',
      count: { $sum: 1 },
      revenue: { $sum: '$pricing.total' }
    }}
  ]);

  return stats;
};

module.exports = { createOrder, getOrdersByShop, updateOrderStatus, getOrderStats };