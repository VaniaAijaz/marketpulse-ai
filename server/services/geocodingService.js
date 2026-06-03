const axios = require('axios');
const locations = require('../data/pakistanLocations');

const nominatim = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  headers: { 'User-Agent': 'MarketPulseAI/1.0 (shop registration)' },
  timeout: 12000,
});

function listCities() {
  return Object.entries(locations).map(([id, city]) => ({
    id,
    label: city.label,
    center: city.center,
  }));
}

function listAreas(cityId) {
  const city = locations[cityId];
  if (!city) return null;
  return city.areas.map((a) => ({ id: a.id, name: a.name, lat: a.lat, lng: a.lng }));
}

function getAreaCoords(cityId, areaId) {
  const city = locations[cityId];
  if (!city) return null;
  const area = city.areas.find((a) => a.id === areaId);
  if (!area) return null;
  return {
    city: city.label,
    area: area.name,
    lat: area.lat,
    lng: area.lng,
  };
}

async function geocodeAddress({ city, area, street }) {
  const query = [street, area, city, 'Pakistan'].filter(Boolean).join(', ');
  const { data } = await nominatim.get('/search', {
    params: { q: query, format: 'json', limit: 1, countrycodes: 'pk' },
  });

  if (!data?.length) {
    const fallback = getAreaCoords(
      Object.keys(locations).find((k) => locations[k].label === city) || '',
      Object.values(locations).flatMap((c) => c.areas).find((a) => a.name === area)?.id
    );
    if (fallback) {
      return {
        lat: fallback.lat,
        lng: fallback.lng,
        displayName: query,
        source: 'area-default',
      };
    }
    throw new Error('Could not locate this address. Try another area or street.');
  }

  const hit = data[0];
  return {
    lat: parseFloat(hit.lat),
    lng: parseFloat(hit.lon),
    displayName: hit.display_name,
    source: 'nominatim',
  };
}

async function reverseGeocode(lat, lng) {
  const { data } = await nominatim.get('/reverse', {
    params: { lat, lon: lng, format: 'json' },
  });
  return {
    displayName: data?.display_name || '',
    address: data?.address || {},
  };
}

module.exports = {
  listCities,
  listAreas,
  getAreaCoords,
  geocodeAddress,
  reverseGeocode,
};
