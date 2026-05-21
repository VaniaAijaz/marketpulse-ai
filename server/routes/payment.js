const express = require('express');
const router = express.Router();
const { createPayment, paymentWebhook, getPayments } = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.post('/webhook', paymentWebhook); // public
router.use(auth);

router.post('/create', createPayment);
router.get('/:shopId', getPayments);

module.exports = router;