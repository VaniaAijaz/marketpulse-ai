const Payment = require('../models/Payment');
const Order = require('../models/Order');

// @desc Create payment record
// @route POST /api/payments/create
// @access Private
const createPayment = async (req, res, next) => {
  try {
    const payment = await Payment.create(req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

// @desc Webhook for payment gateway
// @route POST /api/payments/webhook
// @access Public
const paymentWebhook = async (req, res, next) => {
  try {
    const { transactionId, status, orderId, amount } = req.body;

    const payment = await Payment.findOne({ 'gateway.transactionId': transactionId });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if (status === 'success') {
      await payment.markSuccess(transactionId, req.body);
      
      // Update order payment status
      if (payment.orderId) {
        await Order.findByIdAndUpdate(payment.orderId, { 'payment.status': 'paid' });
      }
    } else {
      await payment.markFailed(req.body.message || 'Payment failed');
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// @desc Get payments for shop
// @route GET /api/payments/:shopId?status=success
// @access Private
const getPayments = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { status } = req.query;

    const query = { shopId };
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .populate('orderId', 'orderNumber')
      .populate('customerId', 'name phone');

    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPayment, paymentWebhook, getPayments };