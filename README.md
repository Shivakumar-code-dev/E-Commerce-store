# 🛍️ Nexora — Full Stack E-Commerce Store

A complete, production-ready full stack e-commerce web application built for the **CodeAlpha Full Stack Development Internship**.

Built with a premium Apple × Amazon inspired UI — glassmorphism surfaces, dark/light mode, skeleton loaders, toast notifications, smooth animations — backed by a robust, secure Node.js/Express/MongoDB REST API using the MVC architecture.

---

## ✨ Features

### Customer-Facing
- **Authentication**: Register, Login, Forgot/Reset Password, JWT-based sessions, editable profile & saved addresses
- **Homepage**: Hero banner, category grid, featured products, latest arrivals
- **Shop**: Full-text search, category/price/rating filters, sorting, pagination
- **Product Details**: Multiple images, specifications, star ratings, customer reviews, wishlist
- **Cart**: Add/update/remove items, live price calculation, coupon codes
- **Checkout**: 3-step flow — shipping address → payment method (simulated) → review & place order
- **Orders**: Order history, live status tracker, cancellation, printable invoice

### Admin Panel
- **Dashboard**: Revenue, orders, users, and stock KPIs; 7-day sales trend chart; order status breakdown; top products; recent orders
- **Product Management**: Full CRUD with multi-image upload (Multer)
- **Category Management**: Full CRUD with icons and images
- **Order Management**: Filter by status, update order status with tracking notes
- **User Management**: Search, activate/deactivate, delete accounts
- **Coupon Management**: Create percentage/flat discount codes with expiry and usage limits

---

## 🧰 Tech Stack

| Layer          | Technology                                   |
|----------------|-----------------------------------------------|
| Frontend       | HTML5, CSS3, JavaScript (ES6), Bootstrap 5    |
| Backend        | Node.js, Express.js (MVC architecture)        |
| Database       | MongoDB with Mongoose ODM                     |
| Authentication | JWT (jsonwebtoken) + bcryptjs                 |
| File Uploads   | Multer                                        |
| Charts         | Chart.js (admin analytics)                    |

No frontend frameworks, build tools, or bundlers are used — the frontend is plain HTML/CSS/JS by design, per project requirements.

---

## 📁 Folder Structure

```
ecommerce-store/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/                # Business logic (MVC "Controller")
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── adminController.js
│   │   └── couponController.js
│   ├── middleware/
│   │   ├── auth.js                # JWT protect / admin guard
│   │   ├── errorHandler.js
│   │   ├── upload.js               # Multer config
│   │   └── validate.js             # express-validator rules
│   ├── models/                     # Mongoose schemas (MVC "Model")
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Cart.js
│   │   ├── Order.js
│   │   └── Coupon.js
│   ├── routes/                     # Express routers
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── adminRoutes.js
│   │   └── couponRoutes.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── apiResponse.js
│   ├── seed/
│   │   └── seeder.js               # Sample data importer
│   ├── uploads/products/           # Uploaded product images (created at runtime)
│   ├── .env.example
│   ├── package.json
│   └── server.js                   # App entry point
│
└── frontend/                       # MVC "View" — static HTML/CSS/JS
    ├── css/style.css                # Design system (glass, dark/light, animations)
    ├── js/
    │   ├── api.js                  # Fetch wrapper
    │   ├── auth.js                 # Client-side auth state
    │   ├── theme.js                # Dark/light toggle
    │   ├── toast.js                # Notifications
    │   ├── components.js           # Navbar/footer
    │   ├── main.js, products.js, product-detail.js
    │   ├── cart.js, checkout.js, orders.js, profile.js
    │   ├── auth-pages.js
    │   └── admin-*.js
    ├── admin/                      # Admin panel pages
    │   ├── dashboard.html, products.html, categories.html
    │   ├── orders.html, users.html, coupons.html
    ├── index.html, products.html, product.html
    ├── cart.html, checkout.html, orders.html
    ├── login.html, register.html, forgot-password.html
    ├── profile.html, wishlist.html
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ and npm
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string
- A modern web browser

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set your `MONGO_URI` and a strong `JWT_SECRET`.

Seed the database with sample categories, products, coupons, and demo accounts:

```bash
npm run seed
```

This creates:
- **Admin login:** `admin@codealpha.com` / `Admin@12345`
- **Demo customer:** `demo@codealpha.com` / `Demo@12345`
- 6 categories, ~20 products, and 3 working coupon codes: `WELCOME10`, `FLAT200`, `MEGA25`

Start the server:

```bash
npm run dev      # with nodemon (auto-restart)
# or
npm start        # plain node
```

The API will run at `http://localhost:5000/api`. Verify it's alive at `http://localhost:5000/api/health`.

### 2. Frontend Setup

The frontend is static HTML/CSS/JS — no build step required. Simply serve the `frontend/` folder with any static server, for example:

```bash
cd frontend
npx serve .
# or use the VS Code "Live Server" extension
# or: python3 -m http.server 5500
```

Then open `http://localhost:5500` (or whatever port your static server uses) in your browser.

> **Important:** The frontend expects the API at `http://localhost:5000/api` (see `frontend/js/api.js` → `API_BASE_URL`). Update this constant if your backend runs elsewhere.

### 3. Log In and Explore

- Browse products, add to cart, apply a coupon, and complete checkout as a shopper.
- Sign in as `admin@codealpha.com` to access the Admin Panel via the profile dropdown → **Admin Panel**, or navigate directly to `frontend/admin/dashboard.html`.

---

## 🔌 REST API Reference (selected)

| Method | Endpoint                              | Description                       | Auth        |
|--------|----------------------------------------|-----------------------------------|-------------|
| POST   | `/api/auth/register`                  | Create account                    | Public      |
| POST   | `/api/auth/login`                     | Log in                            | Public      |
| POST   | `/api/auth/forgot-password`           | Request password reset            | Public      |
| PUT    | `/api/auth/reset-password/:token`     | Reset password                    | Public      |
| GET    | `/api/products`                       | List products (search/filter/sort/paginate) | Public |
| GET    | `/api/products/:id`                   | Product detail + related products | Public      |
| POST   | `/api/products/:id/reviews`           | Add a review                      | Private     |
| POST   | `/api/products` (multipart)           | Create product                    | Admin       |
| GET    | `/api/categories`                     | List categories                   | Public      |
| GET    | `/api/cart`                           | Get current cart                  | Private     |
| POST   | `/api/cart`                           | Add item to cart                  | Private     |
| POST   | `/api/cart/coupon`                    | Apply coupon                      | Private     |
| POST   | `/api/orders`                         | Place order (checkout)            | Private     |
| GET    | `/api/orders/my-orders`               | Order history                     | Private     |
| PUT    | `/api/orders/:id/cancel`              | Cancel order                      | Private     |
| GET    | `/api/admin/dashboard`                | Analytics & KPIs                  | Admin       |
| GET    | `/api/admin/users`                    | List/search users                 | Admin       |

Full route definitions are in `backend/routes/`.

---

## 🔐 Security Notes

- Passwords are hashed with **bcrypt** (10 salt rounds) and never returned by the API.
- JWTs are signed with a server-side secret and expire after 7 days by default.
- All admin routes are protected by both `protect` (valid JWT) and `admin` (role check) middleware.
- Input is validated server-side with `express-validator`; a centralized error handler returns consistent JSON error responses.
- File uploads are restricted to image MIME types/extensions and capped at 5MB per file via Multer.

## ⚠️ Scope Notes (by design, for this internship project)

- **Payments** are simulated — no real payment gateway (Stripe/Razorpay) is integrated, per the project brief.
- **Password reset emails** are not sent via SMTP; the reset token is returned directly in the API response so the full flow can be demonstrated end-to-end without mail server setup.

See `DEPLOYMENT.md` for instructions on deploying this project to a live server.
