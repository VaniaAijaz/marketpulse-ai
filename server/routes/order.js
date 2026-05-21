const express = require('express');
const router = express.Router();

const {
  createOrder,
  getOrders,
  updateOrderStatus,
  getOrderStats
} = require('../controllers/orderController');

const auth = require('../middleware/auth');

// 🔐 protect all routes
router.use(auth);

/**
 * =========================
 * ORDERS ROUTES
 * =========================
 */

// Create order
router.post('/', createOrder);

// Get orders for shop (filter + pagination)
router.get('/shop/:shopId', getOrders);

// Update order status
router.patch('/:id/status', updateOrderStatus);

// Get sales stats
router.get('/stats/:shopId', getOrderStats);

module.exports = router;