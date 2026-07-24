const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getCart);
router.post('/', addToCart);
router.delete('/', clearCart);

router.post('/coupon', applyCoupon);
router.delete('/coupon', removeCoupon);

router.put('/:productId', updateCartItem);
router.delete('/:productId', removeCartItem);

module.exports = router;
