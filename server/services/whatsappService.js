const axios = require('axios');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const API_VERSION = 'v19.0';

const whatsappClient = axios.create({
  baseURL: `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}`,
  headers: {
    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Send text message
const sendTextMessage = async (to, message) => {
  try {
    const response = await whatsappClient.post('/messages', {
      messaging_product: 'whatsapp',
      to: formatPhoneNumber(to),
      type: 'text',
      text: { body: message }
    });

    return {
      success: true,
      messageId: response.data.messages[0].id,
      data: response.data
    };
  } catch (err) {
    console.error('WhatsApp Send Error:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error?.message || 'WhatsApp message failed');
  }
};

// Send template message
const sendTemplateMessage = async (to, templateName, language = 'ur', components = []) => {
  try {
    const response = await whatsappClient.post('/messages', {
      messaging_product: 'whatsapp',
      to: formatPhoneNumber(to),
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: components
      }
    });

    return {
      success: true,
      messageId: response.data.messages[0].id,
      data: response.data
    };
  } catch (err) {
    console.error('WhatsApp Template Error:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error?.message || 'WhatsApp template failed');
  }
};

// Send image message
const sendImageMessage = async (to, imageUrl, caption = '') => {
  try {
    const response = await whatsappClient.post('/messages', {
      messaging_product: 'whatsapp',
      to: formatPhoneNumber(to),
      type: 'image',
      image: {
        link: imageUrl,
        caption: caption
      }
    });

    return {
      success: true,
      messageId: response.data.messages[0].id,
      data: response.data
    };
  } catch (err) {
    console.error('WhatsApp Image Error:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error?.message || 'WhatsApp image send failed');
  }
};

// Helper: format phone to E.164 format without +
const formatPhoneNumber = (phone) => {
  let cleaned = phone.replace(/\D/g, '');

  // Pakistan number: add 92 if starts with 0 or 3
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.slice(1);
  } else if (cleaned.startsWith('3')) {
    cleaned = '92' + cleaned;
  }

  return cleaned;
};

// Verify webhook signature
const verifyWebhook = (req) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && mode === 'subscribe' && token === verifyToken) {
    return challenge;
  }
  return null;
};

module.exports = {
  sendTextMessage,
  sendTemplateMessage,
  sendImageMessage,
  verifyWebhook,
  formatPhoneNumber
};