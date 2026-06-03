const User = require('../models/User');
const Shop = require('../models/Shop');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { attachShopToResponse } = require('./authRegisterController');

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc Register user with phone + OTP or password
// @route POST /api/auth/register
// @access Public
const registerUser = async (req, res, next) => {
  try {
    const { phone, email, name, password, authProvider = 'otp' } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number required' });
    }
    if (!email?.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const emailNorm = email.trim().toLowerCase();
    if (await User.findOne({ phone })) {
      return res.status(400).json({ success: false, error: 'Phone already registered' });
    }
    if (await User.findOne({ email: emailNorm })) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = await User.create({
      phone,
      email: emailNorm,
      name,
      password: hashedPassword,
      authProvider,
      isVerified: authProvider === 'otp' ? false : true,
    });

    res.status(201).json({
      success: true,
      data: await attachShopToResponse(user),
    });
  } catch (err) {
    next(err);
  }
};

// @desc Login user
// @route POST /api/auth/login
// @access Public
const loginUser = async (req, res, next) => {
  try {
    const { phone, email, password } = req.body;

    if (!phone && !email) {
      return res.status(400).json({ success: false, error: 'Email or phone required' });
    }

    const user = email
      ? await User.findOne({ email: email.trim().toLowerCase() })
      : await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account deactivated' });
    }

    let isMatch = false;
    if (user.password) {
      isMatch = await bcrypt.compare(password, user.password);
    }

    // OTP login ke liye password check skip
    if (user.authProvider === 'otp') {
      isMatch = true; // Yahan OTP verify hoga, abhi demo ke liye true
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      success: true,
      data: await attachShopToResponse(user),
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get user profile
// @route GET /api/auth/profile
// @access Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const shop = user?.shopId
      ? await Shop.findById(user.shopId).select('-social.facebookPageToken')
      : null;

    res.json({
      success: true,
      data: { ...user.toObject(), shop },
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update user profile
// @route PUT /api/auth/profile
// @access Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        phone: updatedUser.phone,
        name: updatedUser.name,
        email: updatedUser.email,
        plan: updatedUser.plan
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc Verify OTP and mark user verified
// @route POST /api/auth/verify-otp
// @access Public
const verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    // Yahan OTP verify karo external service se
    // Abhi demo ke liye assume kar rahe hain otp = "1234" valid hai
    if (otp !== '1234') {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const user = await User.findOneAndUpdate(
      { phone },
      { isVerified: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        token: generateToken(user._id)
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc Reset daily AI usage for all users - cron job
// @route POST /api/auth/reset-usage
// @access Private
const resetUserUsage = async (req, res, next) => {
  try {
    const today = new Date().toDateString();
    
    const result = await User.updateMany(
      { 
        'usage.lastReset': { $lt: new Date(new Date().setHours(0, 0, 0, 0)) }
      },
      {
        $set: { 'usage.aiMessagesUsed': 0, 'usage.lastReset': new Date() }
      }
    );

    res.json({
      success: true,
      message: `Reset usage for ${result.modifiedCount} users`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  verifyOTP,
  resetUserUsage
};