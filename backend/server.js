const path = require('path');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const couponRoutes = require('./routes/couponRoutes');

// Connect MongoDB
connectDB();

const app = express();

/* ======================================================
   CORS CONFIGURATION
====================================================== */

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://10.23.57.213:3000',
  'https://e-commerce-frontend-8ctz.onrender.com'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Handle preflight requests
app.options('*', cors());

/* ======================================================
   MIDDLEWARE
====================================================== */

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ======================================================
   HEALTH CHECK
====================================================== */

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CodeAlpha E-Commerce API is running',
    timestamp: new Date()
  });
});

/* ======================================================
   ROUTES
====================================================== */

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes);

/* ======================================================
   ERROR HANDLING
====================================================== */

app.use(notFound);
app.use(errorHandler);

/* ======================================================
   START SERVER
====================================================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});

module.exports = app;