const openWeatherClient = require('../config/openweather');
const WeatherSnapshot = require('../models/WeatherSnapshot');

const fetchAndSaveWeather = async (shopId) => {
  const Shop = require('../models/Shop');
  const shop = await Shop.findById(shopId);
  if (!shop) throw new Error('Shop not found');

  const [lng, lat] = shop.location.coordinates;

  const { data } = await openWeatherClient.get('/weather', {
    params: { lat, lon: lng }
  });

  const weatherData = {
    shopId: shop._id,
    location: {
      city: data.name,
      lat,
      lng
    },
    weather: {
      temp: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      condition: data.weather[0].main.toLowerCase(),
      description: data.weather[0].description
    },
    context: generateContext(data.main.temp, data.weather[0].main)
  };

  const snapshot = await WeatherSnapshot.create(weatherData);
  return snapshot;
};

const getLatestWeather = async (shopId) => {
  let weather = await WeatherSnapshot.findOne({ shopId })
   .sort({ fetchedAt: -1 });

  if (!weather) {
    // Agar DB me nahi hai to abhi fetch karke banao
    weather = await fetchAndSaveWeather(shopId);
  }
  return weather;
};

const generateContext = (temp, condition) => {
  let mood = 'pleasant';
  let suggestion = 'normal sales';

  if (temp > 35 || condition === 'Clear') {
    mood = 'hot';
    suggestion = 'cold drinks, ice cream, lassi push karo';
  } else if (temp < 15 || condition === 'Rain') {
    mood = 'cold/rainy';
    suggestion = 'chai, coffee, soup best sell hoga';
  } else if (condition === 'Clouds') {
    mood = 'cloudy';
    suggestion = 'light snacks promote karo';
  }

  return { mood, suggestion };
};

module.exports = { fetchAndSaveWeather, getLatestWeather };