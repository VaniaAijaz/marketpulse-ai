const express = require('express');
const router = express.Router();
const { getCities, getAreas, resolveLocation } = require('../controllers/locationController');

router.get('/cities', getCities);
router.get('/areas/:cityId', getAreas);
router.post('/resolve', resolveLocation);

module.exports = router;
