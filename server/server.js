require('dotenv').config();
const mongoose = require("mongoose");

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// Config
const connectDB = require('./config/db');

// Middleware
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const asyncHandler = require('./middleware/asyncHandler');

// Services
const { generateMessage } = require('./services/aiService');

// Models for AI limit check
const AiRequestLog = require('./models/AiRequestLog');

// Cron jobs
require('./cron/index');

const app = express();

// Health check route - YAHAN banao
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});
const PORT = process.env.PORT || 5000;

// 1. Basic Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true }));

// 2. Global Rate Limit
app.use('/api/', apiLimiter);

// 3. DB Connection
connectDB();

// 4. Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    service: 'MarketPulse AI API'
  });
});

// 5. Cron Trigger Route
app.get('/api/cron/trigger', asyncHandler(async (req, res) => {
  const { runDailyAnalytics } = require('./cron/dailyAnalytics');
  await runDailyAnalytics();
  res.json({ success: true, message: 'Daily analytics completed' });
}));

// 6. AI Middleware: Check daily limit
const checkAiLimit = asyncHandler(async (req, res, next) => {
  const shopId = req.body.shopId || req.user?.shopId;
  if (!shopId) return res.status(400).json({ error: 'shopId required' });

  const check = await AiRequestLog.checkDailyLimit(shopId);
  if (!check.allowed) {
    return res.status(429).json({ 
      error: 'Daily AI limit reached',
      used: check.usedToday,
      limit: check.limit,
      remaining: 0
    });
  }

  req.aiLimit = check;
  next();
});

// 7. Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/products', require('./routes/product'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/posts', require('./routes/post'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/analytics', require('./routes/analytics'));

// 8. AI Route - now using service
app.post('/api/ai/generate-message', checkAiLimit, asyncHandler(async (req, res) => {
  const { shopId, prompt } = req.body;
  
  const result = await generateMessage({ shopId, prompt });
  
  res.json({ 
    success: true, 
    message: result.message,
    remaining: req.aiLimit.remaining - 1,
    usage: result.usage
  });
}));

// 9. 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 10. Global Error Handler
app.use(errorHandler);

// 11. Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});