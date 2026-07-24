const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { calculateSummary } = require('./cartController');

// @desc    Create new order from cart (checkout)
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Your cart is empty');
  }

  // Verify stock availability for every item
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      res.status(400);
      throw new Error(`Product "${item.name}" is no longer available`);
    }
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for "${item.name}". Only ${product.stock} left.`);
    }
  }

  const summary = calculateSummary(cart);

  // Simulate payment processing (no real payment gateway per project scope)
  const isPaid = paymentMethod !== 'cod';

  const order = await Order.create({
    user: req.user._id,
    items: cart.items.map((item) => ({
      product: item.product,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity
    })),
    shippingAddress,
    paymentMethod,
    paymentResult: isPaid
      ? {
          id: 'SIMULATED-' + Date.now(),
          status: 'completed',
          updateTime: new Date().toISOString()
        }
      : undefined,
    itemsPrice: summary.itemsPrice,
    shippingPrice: summary.shippingPrice,
    taxPrice: summary.taxPrice,
    couponDiscount: summary.discount,
    couponCode: cart.couponCode,
    totalPrice: summary.totalPrice,
    isPaid,
    paidAt: isPaid ? new Date() : undefined,
    status: 'pending'
  });

  // Decrement stock & increment sold count
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, soldCount: item.quantity }
    });
  }

  // Track coupon usage
  if (cart.couponCode) {
    await Coupon.findOneAndUpdate({ code: cart.couponCode }, { $inc: { usedCount: 1 } });
  }

  // Clear the cart after order placement
  cart.items = [];
  cart.couponCode = null;
  cart.couponDiscount = 0;
  await cart.save();

  res.status(201).json({ success: true, message: 'Order placed successfully', order });
});

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// @desc    Get single order by id (owner or admin)
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json({ success: true, order });
});

// @desc    Cancel order (owner, only if pending/processing)
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  if (!['pending', 'processing'].includes(order.status)) {
    res.status(400);
    throw new Error(`Order cannot be cancelled at "${order.status}" stage`);
  }

  order.status = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', note: 'Cancelled by customer' });
  await order.save();

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, soldCount: -item.quantity }
    });
  }

  res.json({ success: true, message: 'Order cancelled successfully', order });
});

// ==================== ADMIN ORDER MANAGEMENT ====================

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 15 } = req.query;
  const query = {};
  if (status) query.status = status;

  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.max(parseInt(limit) || 15, 1);
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(query)
  ]);

  res.json({ success: true, orders, page: pageNum, pages: Math.ceil(total / limitNum), total });
});

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.status = status;
  order.statusHistory.push({ status, note: note || '' });

  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }

  await order.save();
  res.json({ success: true, message: 'Order status updated', order });
});
