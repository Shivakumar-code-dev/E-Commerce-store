const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 79;
const TAX_RATE = 0.08; // 8% simulated tax

const calculateSummary = (cart) => {
  const itemsPrice = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingPrice = itemsPrice > FREE_SHIPPING_THRESHOLD || itemsPrice === 0 ? 0 : SHIPPING_FEE;
  const discount = cart.couponDiscount || 0;
  const taxableAmount = Math.max(itemsPrice - discount, 0);
  const taxPrice = Math.round(taxableAmount * TAX_RATE * 100) / 100;
  const totalPrice = Math.round((taxableAmount + shippingPrice + taxPrice) * 100) / 100;

  return {
    itemsPrice: Math.round(itemsPrice * 100) / 100,
    shippingPrice,
    taxPrice,
    discount,
    totalPrice
  };
};

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }
  const summary = calculateSummary(cart);
  res.json({ success: true, cart, summary });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.stock < quantity) {
    res.status(400);
    throw new Error(`Only ${product.stock} units available in stock`);
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find((item) => item.product.toString() === productId);
  const price = product.discountPrice > 0 ? product.discountPrice : product.price;

  if (existingItem) {
    const newQty = existingItem.quantity + Number(quantity);
    if (newQty > product.stock) {
      res.status(400);
      throw new Error(`Cannot add more. Only ${product.stock} units available`);
    }
    existingItem.quantity = newQty;
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      image: product.images[0] || '',
      price,
      quantity: Number(quantity)
    });
  }

  await cart.save();
  const summary = calculateSummary(cart);
  res.status(200).json({ success: true, message: 'Item added to cart', cart, summary });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const item = cart.items.find((i) => i.product.toString() === req.params.productId);
  if (!item) {
    res.status(404);
    throw new Error('Item not found in cart');
  }

  const product = await Product.findById(req.params.productId);
  if (quantity > product.stock) {
    res.status(400);
    throw new Error(`Only ${product.stock} units available in stock`);
  }

  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  } else {
    item.quantity = quantity;
  }

  await cart.save();
  const summary = calculateSummary(cart);
  res.json({ success: true, message: 'Cart updated', cart, summary });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
exports.removeCartItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();

  const summary = calculateSummary(cart);
  res.json({ success: true, message: 'Item removed from cart', cart, summary });
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    cart.couponCode = null;
    cart.couponDiscount = 0;
    await cart.save();
  }
  res.json({ success: true, message: 'Cart cleared' });
});

// @desc    Apply coupon code
// @route   POST /api/cart/coupon
// @access  Private
exports.applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Your cart is empty');
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) {
    res.status(404);
    throw new Error('Invalid coupon code');
  }

  if (coupon.expiresAt < new Date()) {
    res.status(400);
    throw new Error('This coupon has expired');
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error('This coupon has reached its usage limit');
  }

  const itemsPrice = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (itemsPrice < coupon.minPurchase) {
    res.status(400);
    throw new Error(`Minimum purchase of ₹${coupon.minPurchase} required for this coupon`);
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (itemsPrice * coupon.discountValue) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = coupon.discountValue;
  }

  cart.couponCode = coupon.code;
  cart.couponDiscount = Math.round(discount * 100) / 100;
  await cart.save();

  const summary = calculateSummary(cart);
  res.json({ success: true, message: `Coupon "${coupon.code}" applied successfully!`, cart, summary });
});

// @desc    Remove applied coupon
// @route   DELETE /api/cart/coupon
// @access  Private
exports.removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.couponCode = null;
    cart.couponDiscount = 0;
    await cart.save();
  }
  const summary = calculateSummary(cart);
  res.json({ success: true, message: 'Coupon removed', cart, summary });
});

exports.calculateSummary = calculateSummary;
