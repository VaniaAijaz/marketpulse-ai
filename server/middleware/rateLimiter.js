const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 5, // 5 login attempts
  message: {
    success: false,
    error: 'Too many login attempts, try again in 2 minutes'
  }
});

module.exports = { apiLimiter, authLimiter };