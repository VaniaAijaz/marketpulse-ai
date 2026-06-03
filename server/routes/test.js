const express = require('express');
const router = express.Router();
const { generateProductRecommendations } = require('../services/aiRecommendationService');

router.get('/test-ai/:shopId', async (req, res) => {
  try {
    // Fake weather data daal do test ke liye
    const fakeWeather = {
      location: { city: "Karachi" },
      weather: { temp: 35, condition: "Clear", description: "hot" },
      context: { mood: "Hot weather", suggestion: "Push cold drinks" }
    };

    const result = await generateProductRecommendations({
      shopId: req.params.shopId,
      weather: fakeWeather
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;