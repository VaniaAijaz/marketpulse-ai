// routes/webhook.js
const express = require('express');
const router = express.Router();
const { verifyWebhook } = require('../services/whatsappService');

router.get('/whatsapp', (req, res) => {
  const challenge = verifyWebhook(req);
  if (challenge) return res.send(challenge);
  res.sendStatus(403);
});

router.post('/whatsapp', async (req, res) => {
  // Handle incoming message here
  console.log(JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

module.exports = router;