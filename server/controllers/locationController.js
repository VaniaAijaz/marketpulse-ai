const {
  listCities,
  listAreas,
  getAreaCoords,
  geocodeAddress,
  reverseGeocode,
} = require('../services/geocodingService');
const asyncHandler = require('../middleware/asyncHandler');

const getCities = asyncHandler(async (req, res) => {
  res.json({ success: true, data: listCities() });
});

const getAreas = asyncHandler(async (req, res) => {
  const areas = listAreas(req.params.cityId);
  if (!areas) return res.status(404).json({ success: false, error: 'City not found' });
  res.json({ success: true, data: areas });
});

const resolveLocation = asyncHandler(async (req, res) => {
  const { cityId, areaId, street, lat, lng } = req.body;

  if (lat != null && lng != null) {
    const rev = await reverseGeocode(lat, lng);
    return res.json({
      success: true,
      data: { lat, lng, ...rev, source: 'map-pin' },
    });
  }

  const cityEntry = require('../data/pakistanLocations')[cityId];
  if (!cityEntry) {
    return res.status(400).json({ success: false, error: 'Invalid city' });
  }

  const area = cityEntry.areas.find((a) => a.id === areaId);
  if (!area) {
    return res.status(400).json({ success: false, error: 'Select your shop area' });
  }

  if (street?.trim()) {
    const geo = await geocodeAddress({
      city: cityEntry.label,
      area: area.name,
      street: street.trim(),
    });
    return res.json({
      success: true,
      data: {
        lat: geo.lat,
        lng: geo.lng,
        displayName: geo.displayName,
        city: cityEntry.label,
        area: area.name,
        street: street.trim(),
        source: geo.source,
      },
    });
  }

  res.json({
    success: true,
    data: {
      lat: area.lat,
      lng: area.lng,
      city: cityEntry.label,
      area: area.name,
      displayName: `${area.name}, ${cityEntry.label}`,
      source: 'area-center',
    },
  });
});

module.exports = { getCities, getAreas, resolveLocation };
