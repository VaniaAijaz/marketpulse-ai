const Order = require('../models/Order');
const mongoose = require('mongoose');
const generateOrderNo = require('../utils/generateOrderNo');
const { validatePhone } = require('../utils/validatePhone');

// Create order with validation + order number
const createOrder = async ({ shopId, customerName, customerPhone, customerId, items, pricing, customerEmail }) => {
  // Phone validate
  const phoneCheck = validatePhone(customerPhone);
  if (!phoneCheck.valid) throw new Error(phoneCheck.error);

  let finalCustomerId = customerId;

  // Find or create customer — use explicit create() so Mongoose timestamps (createdAt) are set correctly
  const Customer = mongoose.model('Customer');
  let customer = await Customer.findOne({ shopId, phone: phoneCheck.formatted });

  if (!customer) {
    // New customer — Customer.create() properly fires timestamps plugin
    customer = await Customer.create({
      shopId,
      phone: phoneCheck.formatted,
      name: customerName || 'Guest',
      isActive: true,
      firstVisit: new Date(),
      email: customerEmail || undefined,
      whatsappOptIn: true,
    });
  } else {
    // Existing customer — update name/status only
    customer.name = customerName || customer.name || 'Guest';
    customer.isActive = true;
    await customer.save();
  }
  finalCustomerId = customer._id;

  // Order number generate
  const orderNumber = generateOrderNo(shopId);

  const order = await Order.create({
    shopId,
    orderNumber,
    customerName: customerName || customer.name,
    customerPhone: phoneCheck.formatted,
    customerId: finalCustomerId,
    items,
    pricing
  });

  // NOTE: customer stats (totalSpent, totalOrders) are updated when the order
  // is marked delivered via order.markDelivered() — NOT here on creation.
  // This avoids double-counting if payment fails or order is cancelled.

  return order;
};

// Get orders with pagination + filters
const getOrdersByShop = async ({ shopId, status, page = 1, limit = 20 }) => {
  const query = { shopId };
  if (status) {
    query.status = status === 'completed' ? 'delivered' : status;
  }

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

// Update order status — enforces state machine transitions
const updateOrderStatus = async (orderId, newStatus, opts = {}) => {
  const { transitionOrderStatus, STATUS } = require('../utils/orderStateMachine');

  // Map legacy/frontend aliases to canonical statuses
  const aliasMap = { completed: STATUS.COMPLETED, delivered: STATUS.COMPLETED };
  const canonical = aliasMap[newStatus] || newStatus;

  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');

  return transitionOrderStatus(order, canonical, opts);
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

// Simulate Order Payment & Trigger Downstream AI Automation
const simulateOrderPayment = async (orderId, { gateway, forceFail }) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');

  let mappedGateway = gateway;
  if (mappedGateway === 'cod') mappedGateway = 'cash';
  if (mappedGateway === 'stripe') mappedGateway = 'card';

  if (forceFail) {
    order.payment.status = 'failed';
    order.payment.method = mappedGateway;
    await order.save();
    return { order, paymentResult: 'failed' };
  }

  // Transition to CONFIRMED via state machine
  const { transitionOrderStatus, STATUS } = require('../utils/orderStateMachine');
  order.payment.status = 'paid';
  order.payment.method = mappedGateway;
  order.payment.transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  await transitionOrderStatus(order, STATUS.CONFIRMED, { reason: `Payment via ${mappedGateway}` });

  // 1. Inventory stock decrement
  const Product = mongoose.model('Product');
  const stockAlerts = [];
  
  for (const item of order.items) {
    if (item.productId) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock.quantity = Math.max(0, product.stock.quantity - item.qty);
        await product.save();

        if (product.isLowStock && product.isLowStock()) {
          stockAlerts.push({
            productId: product._id,
            name: product.name,
            currentStock: product.stock.quantity,
            threshold: product.stock.lowStockThreshold
          });
        }
      }
    }
  }

  // 2. Real-time Analytics update
  const Analytics = mongoose.model('Analytics');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    let analytics = await Analytics.findOne({ shopId: order.shopId, date: today, period: 'daily' });
    if (!analytics) {
      analytics = await Analytics.generateDailySnapshot(order.shopId, today);
    } else {
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      const salesData = await Analytics.aggregateSales(order.shopId, today, endOfDay);
      analytics.sales = salesData;
      await analytics.save();
    }
  } catch (analyticsErr) {
    console.error('Analytics update failed (non-critical):', analyticsErr.message);
  }

  // 3. Invoice Generation
  const Shop = mongoose.model('Shop');
  const shop = await Shop.findById(order.shopId);
  const invoiceService = require('./invoiceService');
  const invoice = invoiceService.generateInvoice(order, shop);

  // 4. Mock AI Demand Insights
  const demandInsights = {
    message: 'Categories trend parsed successfully.',
    predictedNextDemand: `High probability spike in matching item "${order.items[0]?.name || 'products'}" demand for the upcoming weekend.`
  };

  return {
    order,
    invoice,
    stockAlerts,
    demandInsights,
    paymentResult: 'success'
  };
};

module.exports = { createOrder, getOrdersByShop, updateOrderStatus, getOrderStats, simulateOrderPayment };