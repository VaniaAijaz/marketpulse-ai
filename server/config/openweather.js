const axios = require('axios');

if (!process.env.OPENWEATHER_API_KEY) {
  throw new Error('OPENWEATHER_API_KEY not set in env');
}

const openWeatherClient = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
  params: {
    appid: process.env.OPENWEATHER_API_KEY,
    units: 'metric',
    lang: 'ur'
  },
  timeout: 10000
});

module.exports = openWeatherClient;