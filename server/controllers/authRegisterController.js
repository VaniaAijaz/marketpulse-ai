const User = require('../models/User');
const Shop = require('../models/Shop');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { BUSINESS_TYPES } = require('../utils/businessCatalog');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

function buildLocation(body) {
  const lat = parseFloat(body.latitude);
  const lng = parseFloat(body.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return {
    type: 'Point',
    coordinates: [lng, lat],
    city: body.city || '',
    area: body.area || '',
    street: body.street || body.address || '',
    address: body.street || body.address || '',
  };
}

async function attachShopToResponse(user) {
  const shop = user.shopId
    ? await Shop.findById(user.shopId).select('-social.facebookPageToken')
    : await Shop.findOne({ ownerId: user._id, isActive: true });
  return {
    _id: user._id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    plan: user.plan,
    businessType: user.businessType,
    shopId: user.shopId,
    shop: shop || null,
    token: generateToken(user._id),
  };
}

/**
 * Register account + single shop in one step (registration flow).
 */
const registerWithShop = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      shopName,
      businessType,
      city,
      area,
      street,
      latitude,
      longitude,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ success: false, error: 'Phone is required' });
    }
    if (!email?.trim()) {
      return res.status(400).json({ success: false, error: 'Email (Gmail) is required — one shop per email' });
    }
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }
    if (!shopName?.trim()) {
      return res.status(400).json({ success: false, error: 'Shop name is required' });
    }
    if (!businessType || !BUSINESS_TYPES.includes(businessType)) {
      return res.status(400).json({ success: false, error: 'Select a valid business type' });
    }
    if (!city || !area) {
      return res.status(400).json({ success: false, error: 'Select city and area for your shop' });
    }

    const location = buildLocation(req.body);
    if (!location) {
      return res.status(400).json({ success: false, error: 'Shop location could not be set. Pick your area on the map.' });
    }

    const emailNorm = email.trim().toLowerCase();

    if (await User.findOne({ email: emailNorm })) {
      return res.status(400).json({ success: false, error: 'This email is already registered' });
    }
    if (await User.findOne({ phone: phone.trim() })) {
      return res.status(400).json({ success: false, error: 'This phone number is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      phone: phone.trim(),
      email: emailNorm,
      password: hashedPassword,
      authProvider: 'local',
      isVerified: true,
      businessType,
    });

    const shop = await Shop.create({
      ownerId: user._id,
      name: shopName.trim(),
      businessType,
      location,
    });

    user.shopId = shop._id;
    await user.save();

    res.status(201).json({
      success: true,
      data: await attachShopToResponse(user),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Email or phone already in use' });
    }
    next(err);
  }
};

module.exports = { registerWithShop, attachShopToResponse };
