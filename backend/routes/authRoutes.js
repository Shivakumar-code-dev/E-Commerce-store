const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  addAddress,
  deleteAddress,
  toggleWishlist,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerRules, loginRules, validateRequest } = require('../middleware/validate');

router.post('/register', registerRules, validateRequest, registerUser);
router.post('/login', loginRules, validateRequest, loginUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

router.post('/address', protect, addAddress);
router.delete('/address/:id', protect, deleteAddress);

router.post('/wishlist/:productId', protect, toggleWishlist);

module.exports = router;
