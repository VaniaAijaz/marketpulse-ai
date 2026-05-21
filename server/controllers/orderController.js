const { orderService } = require('../services');
const { validatePhone, timeAgo } = require('../utils');
const asyncHandler = require('../middleware/asyncHandler');

// @desc Create order
// @route POST /api/orders/create
// @access Private
const createOrderController = asyncHandler(async (req, res) => {
  const phoneCheck = validatePhone(req.body.customerPhone);
  if (!phoneCheck.valid) throw new Error(phoneCheck.error);


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
  const { status } = req.body;
  const order = await orderService.updateOrderStatus(req.params.id, status);
  res.json({ success: true, data: order });
});

// @desc Get sales stats
// @route GET /api/orders/stats/:shopId?start=2025-10-01&end=2025-10-07
// @access Private
const getOrderStatsController = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const { start, end } = req.query;

  const stats = await orderService.getOrderStats({ shopId, start, end });
  res.json({ success: true, data: stats });
});

module.exports = {
  createOrder: createOrderController,
  getOrders: getOrdersController,
  updateOrderStatus: updateOrderStatusController,
  getOrderStats: getOrderStatsController
};