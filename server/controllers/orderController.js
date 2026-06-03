const { orderService } = require('../services');
const { validatePhone, timeAgo } = require('../utils');
const asyncHandler = require('../middleware/asyncHandler');

// @desc Create order
// @route POST /api/orders/create
// @access Private
const createOrderController = asyncHandler(async (req, res) => {
  const phoneCheck = validatePhone(req.body.customerPhone);
  if (!phoneCheck.valid) throw new Error(phoneCheck.error);

  // Sanitize items: ensure qty and price are valid numbers
  if (req.body.items && Array.isArray(req.body.items)) {
    req.body.items = req.body.items.map(i => ({
      ...i,
      qty: Number(i.qty) || Number(i.quantity) || 1,
      price: Number(i.price) || 0
    }));
  }

  // Pricing auto calculate agar na bheja ho
  if (req.body.items && (!req.body.pricing || !req.body.pricing.total)) {
    const subtotal = req.body.items.reduce((sum, i) => sum + (i.qty * i.price), 0);
    
    req.body.pricing = {
      subtotal,
      total: subtotal,
      discount: req.body.pricing?.discount || 0,
      tax: req.body.pricing?.tax || 0
    };
  }

  const order = await orderService.createOrder({
    ...req.body,
    customerPhone: phoneCheck.formatted
  });

  order.createdAtAgo = timeAgo(order.createdAt);

  res.status(201).json({ success: true, data: order });
});

// @desc Get orders for shop
// @route GET /api/orders/:shopId?status=pending&page=1
// @access Private
const getOrdersController = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const { status, page, limit } = req.query;

  const result = await orderService.getOrdersByShop({ shopId, status, page, limit });
  res.json({ success: true, data: result });
});

// @desc Update order status
// @route PATCH /api/orders/:id/status
// @access Private
const updateOrderStatusController = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const order = await orderService.updateOrderStatus(req.params.id, status, { reason });
  res.json({ success: true, data: order });
});

// @desc Get sales stats
// @route GET /api/orders/stats/:shopId?start=2025-10-01&end=2025-10-07
// @access Private
const getOrderStatsController = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const { start, end } = req.query;

  const stats = await orderService.getOrderStats({ shopId, start, end });

  // Format stats array into object for KPI cards expected by frontend
  const formattedStats = {
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    avgOrderValue: 0
  };

  if (Array.isArray(stats)) {
    stats.forEach(group => {
      const count = group.count || 0;
      const revenue = group.revenue || 0;
      
      formattedStats.totalOrders += count;
      
      // Sum revenue for non-cancelled orders
      if (group._id !== 'cancelled') {
        formattedStats.totalRevenue += revenue;
      }
      
      // Count pending orders (non-delivered, non-cancelled)
      if (group._id !== 'delivered' && group._id !== 'cancelled') {
        formattedStats.pendingOrders += count;
      }
    });

    if (formattedStats.totalOrders > 0) {
      formattedStats.avgOrderValue = formattedStats.totalRevenue / formattedStats.totalOrders;
    }
  }

  res.json({ success: true, data: formattedStats });
});

// @desc Simulate payment and run AI business intelligence flow
// @route POST /api/orders/:id/simulate-payment
// @access Private
const simulatePaymentController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { gateway, forceFail } = req.body;

  if (!gateway) {
    return res.status(400).json({ success: false, error: 'Payment gateway method is required' });
  }

  const result = await orderService.simulateOrderPayment(id, { gateway, forceFail: !!forceFail });

  res.json({
    success: true,
    message: result.paymentResult === 'success' 
      ? 'Payment mock transaction succeeded. AI business automations triggered.' 
      : 'Payment mock transaction failed.',
    data: result
  });
});

module.exports = {
  createOrder: createOrderController,
  getOrders: getOrdersController,
  updateOrderStatus: updateOrderStatusController,
  getOrderStats: getOrderStatsController,
  simulatePayment: simulatePaymentController
};