const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 2000 : 300,   // dev: 2000 req/15min, prod: 300
  skip: (req) => {
    // Skip rate limiting for localhost in development
    const ip = req.ip || req.connection?.remoteAddress || '';
    return isDev && (ip === '127.0.0.1' || ip === '::1' || ip.includes('::ffff:127.'));
  },
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limiter — keep strict but allow more in dev
const authLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: isDev ? 50 : 10,
  skip: (req) => {
    const ip = req.ip || req.connection?.remoteAddress || '';
    return isDev && (ip === '127.0.0.1' || ip === '::1' || ip.includes('::ffff:127.'));
  },
  message: { success: false, error: 'Too many login attempts, try again in 2 minutes' },
});

module.exports = { apiLimiter, authLimiter };
