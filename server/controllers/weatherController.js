const { fetchAndSaveWeather, getLatestWeather } = require('../services/weatherService');
const asyncHandler = require('../middleware/asyncHandler');

const fetchWeather = asyncHandler(async (req, res) => {
  const snapshot = await fetchAndSaveWeather(req.params.shopId);
  res.json({ success: true, data: snapshot });
});

const getLatestWeatherController = asyncHandler(async (req, res) => {
  const weather = await getLatestWeather(req.params.shopId);
  res.json({ success: true, data: weather });
});

module.exports = { fetchWeather, getLatestWeather: getLatestWeatherController };