const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  verifyOTP,
  resetUserUsage
} = require('../controllers/userController');
const { registerWithShop } = require('../controllers/authRegisterController');
const auth = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/register-with-shop', registerWithShop);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/reset-usage', resetUserUsage); // cron route

router.get('/profile', auth, getUserProfile);
router.put('/profile', auth, updateUserProfile);

module.exports = router;