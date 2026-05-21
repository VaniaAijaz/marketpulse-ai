const MessageLog = require('../models/MessageLog');
const mongoose = require('mongoose');

// @desc Create a message log and queue it
// @route POST /api/messages/send
// @access Private
const createMessageLog = async (req, res, next) => {
  try {
    const { shopId, customerId, recipient, message, campaign } = req.body;

    if (!shopId || !recipient?.phone || !message?.body) {
      return res.status(400).json({ error: 'shopId, recipient.phone, and message.body required' });
    }

    const log = await MessageLog.create({
      shopId,
      customerId,
      recipient,
      message,
      campaign,
      metadata: {
        createdBy: req.body.createdBy || 'system',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // Yahan pe WhatsApp API call karni hai. Abhi demo ke liye direct 'sent' mark kar rahe hain
    // Production mein queue me daal ke worker se bhejna
    const fakeMessageId = 'wamid.' + Date.now();
    await log.markSent(fakeMessageId);

    res.status(201).json({
      success: true,
      data: log
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get message logs for a shop
// @route GET /api/messages/:shopId?page=1&limit=20&status=delivered&trigger=auto_inactive
// @access Private
const getMessageLogs = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { page = 1, limit = 20, status, trigger } = req.query;

    const query = { shopId };

    if (status) query['whatsapp.status'] = status;
    if (trigger) query['campaign.trigger'] = trigger;

    const [logs, total] = await Promise.all([
      MessageLog.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('customerId', 'name phone')
        .select('-__v'),
      MessageLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        logs,
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

// @desc Get message stats for dashboard
// @route GET /api/messages/stats/:shopId?start=2025-10-01&end=2025-10-07
// @access Private
const getMessageStats = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { start, end } = req.query;

    const startDate = start ? new Date(start) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();

    const stats = await MessageLog.getStats(shopId, startDate, endDate);

    // Format into object
    const result = stats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const total = Object.values(result).reduce((a, b) => a + b, 0);
    const delivered = (result.delivered || 0) + (result.read || 0);
    const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(2) : 0;
    const readRate = result.delivered > 0 ? ((result.read || 0) / result.delivered * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        ...result,
        total,
        deliveryRate: parseFloat(deliveryRate),
        readRate: parseFloat(readRate)
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc Webhook endpoint to update message status from WhatsApp
// @route POST /api/messages/webhook/status
// @access Public - WhatsApp calls this
const updateMessageStatus = async (req, res, next) => {
  try {
    const { messageId, status, errorCode, errorMessage } = req.body;

    const log = await MessageLog.findOne({ 'whatsapp.messageId': messageId });
    if (!log) {
      return res.status(404).json({ error: 'Message log not found' });
    }

    if (status === 'delivered') {
      await log.markDelivered();
    } else if (status === 'read') {
      await log.markRead();
    } else if (status === 'failed') {
      await log.markFailed(errorCode, errorMessage);
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// @desc Get messages pending for retry
// @route GET /api/messages/retry/pending
// @access Private - called by cron
const getPendingRetries = async (req, res, next) => {
  try {
    const messages = await MessageLog.getFailedForRetry();

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get single message log
// @route GET /api/messages/log/:id
// @access Private
const getMessageLogById = async (req, res, next) => {
  try {
    const log = await MessageLog.findById(req.params.id)
      .populate('customerId', 'name phone')
      .populate('shopId', 'shopName');

    if (!log) {
      return res.status(404).json({ error: 'Message log not found' });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createMessageLog,
  getMessageLogs,
  getMessageStats,
  updateMessageStatus,
  getPendingRetries,
  getMessageLogById
};