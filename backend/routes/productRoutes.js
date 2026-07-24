const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
  deleteProductReview,
  getFeaturedProducts
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { productRules, reviewRules, validateRequest } = require('../middleware/validate');

router.get('/featured/list', getFeaturedProducts);
router.get('/', getProducts);
router.get('/:id', getProductById);

router.post('/', protect, admin, upload.array('images', 6), productRules, validateRequest, createProduct);
router.put('/:id', protect, admin, upload.array('images', 6), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

router.post('/:id/reviews', protect, reviewRules, validateRequest, addProductReview);
router.delete('/:id/reviews/:reviewId', protect, deleteProductReview);

module.exports = router;
