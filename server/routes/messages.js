const express = require('express');
const router = express.Router();
const {
  createMessageLog,
  getMessageLogs,
  getMessageStats,
  updateMessageStatus,
  getPendingRetries,
  getMessageLogById
} = require('../controllers/messageLogController');
const auth = require('../middleware/auth');

router.post('/send', auth, createMessageLog);
router.get('/:shopId', auth, getMessageLogs);
router.get('/stats/:shopId', auth, getMessageStats);
router.get('/log/:id', auth, getMessageLogById);
router.get('/retry/pending', auth, getPendingRetries);

// Webhook public hota hai, WhatsApp se aata hai
router.post('/webhook/status', updateMessageStatus);

module.exports = router;