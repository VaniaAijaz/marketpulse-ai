require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Models
const AiRequestLog = require('./models/AiRequestLog');
const Shop = require('./models/Shop');

// Cron jobs start karo
require('./cron/index');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limit: 100 req per 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, try again later' }
});
app.use('/api/', limiter);

// DB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log(' MongoDB connected'))
.catch(err => console.error(' MongoDB error:', err));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    service: 'MarketPulse AI API'
  });
});

// Cron trigger route for Render free tier
app.get('/api/cron/trigger', async (req, res) => {
  try {
    const { runDailyAnalytics } = require('./cron/dailyAnalytics');
    await runDailyAnalytics();
    res.json({ success: true, message: 'Daily analytics completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Middleware: Check daily limit before AI routes
const checkAiLimit = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/analytics', require('./routes/analytics'));

// AI Routes with limit check
app.post('/api/ai/generate-message', checkAiLimit, async (req, res) => {
  const start = Date.now();
  try {
    const { shopId, prompt } = req.body;
    
    // Call Gemini 1.5 Flash
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    const usage = result.response.usageMetadata || {};
    
    // Log request
    await AiRequestLog.logRequest({
      shopId,
      endpoint: 'generate_message',
      promptTokens: usage.promptTokenCount || 0,
      completionTokens: usage.candidatesTokenCount || 0,
      status: 'success',
      responseTimeMs: Date.now() - start
    });

    res.json({ 
      success: true, 
      message: response,
      remaining: req.aiLimit.remaining - 1
    });

  } catch (err) {
    console.error('AI Error:', err);
    
    await AiRequestLog.logRequest({
      shopId: req.body.shopId,
      endpoint: 'generate_message',
      status: 'failed',
      errorMessage: err.message,
      responseTimeMs: Date.now() - start
    });

    res.status(500).json({ error: 'AI request failed' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});