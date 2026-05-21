const express = require('express');
const router = express.Router();
const { fetchWeather, getLatestWeather } = require('../controllers/weatherController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/fetch/:shopId', fetchWeather);
router.get('/latest/:shopId', getLatestWeather);

module.exports = router;