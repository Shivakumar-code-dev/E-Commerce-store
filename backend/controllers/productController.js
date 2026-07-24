const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get all products with search, filter, sort, pagination
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res) => {
  const {
    keyword,
    category,
    minPrice,
    maxPrice,
    rating,
    sort,
    page = 1,
    limit = 12,
    featured
  } = req.query;

  const query = { isActive: true };

  if (keyword) {
    query.$text = { $search: keyword };
  }

  if (category) {
    query.category = category;
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (rating) {
    query.rating = { $gte: Number(rating) };
  }

  if (featured === 'true') {
    query.isFeatured = true;
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'price_asc') sortOption = { price: 1 };
  else if (sort === 'price_desc') sortOption = { price: -1 };
  else if (sort === 'rating') sortOption = { rating: -1 };
  else if (sort === 'popular') sortOption = { soldCount: -1 };
  else if (sort === 'newest') sortOption = { createdAt: -1 };

  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.max(parseInt(limit) || 12, 1);
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(query)
  ]);

  res.json({
    success: true,
    products,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    total
  });
});

// @desc    Get single product by id or slug
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);

  const product = await Product.findOne(
    isObjectId ? { _id: id } : { slug: id }
  )
    .populate('category', 'name slug')
    .populate('reviews.user', 'name avatar');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Related products from same category
  const relatedProducts = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true
  }).limit(4);

  res.json({ success: true, product, relatedProducts });
});

// @desc    Create product (admin)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    shortDescription,
    brand,
    category,
    price,
    discountPrice,
    stock,
    sku,
    specifications,
    tags,
    isFeatured
  } = req.body;

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    res.status(400);
    throw new Error('Selected category does not exist');
  }

  let images = [];
  if (req.files && req.files.length > 0) {
    images = req.files.map((file) => `/uploads/products/${file.filename}`);
  } else if (req.body.images) {
    images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
  }

  const product = await Product.create({
    name,
    description,
    shortDescription,
    brand,
    category,
    price,
    discountPrice: discountPrice || 0,
    stock,
    sku,
    images,
    specifications: specifications ? JSON.parse(specifications) : [],
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    isFeatured: isFeatured === 'true' || isFeatured === true
  });

  res.status(201).json({ success: true, message: 'Product created successfully', product });
});

// @desc    Update product (admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const fields = [
    'name',
    'description',
    'shortDescription',
    'brand',
    'category',
    'price',
    'discountPrice',
    'stock',
    'sku',
    'isFeatured',
    'isActive'
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  if (req.body.tags) {
    product.tags = Array.isArray(req.body.tags)
      ? req.body.tags
      : req.body.tags.split(',').map((t) => t.trim());
  }

  if (req.body.specifications) {
    product.specifications =
      typeof req.body.specifications === 'string'
        ? JSON.parse(req.body.specifications)
        : req.body.specifications;
  }

  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => `/uploads/products/${file.filename}`);
    product.images = [...product.images, ...newImages];
  }

  if (req.body.removeImages) {
    const toRemove = Array.isArray(req.body.removeImages)
      ? req.body.removeImages
      : [req.body.removeImages];
    product.images = product.images.filter((img) => !toRemove.includes(img));
  }

  const updatedProduct = await product.save();
  res.json({ success: true, message: 'Product updated successfully', product: updatedProduct });
});

// @desc    Delete product (admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted successfully' });
});

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
exports.addProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment
  };

  product.reviews.push(review);
  product.recalculateRating();

  await product.save();

  res.status(201).json({ success: true, message: 'Review added successfully', reviews: product.reviews });
});

// @desc    Delete a review (admin or owner)
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private
exports.deleteProductReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const review = product.reviews.id(req.params.reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }

  review.deleteOne();
  product.recalculateRating();
  await product.save();

  res.json({ success: true, message: 'Review deleted successfully' });
});

// @desc    Get featured products
// @route   GET /api/products/featured/list
// @access  Public
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .populate('category', 'name slug')
    .limit(8);
  res.json({ success: true, products });
});
