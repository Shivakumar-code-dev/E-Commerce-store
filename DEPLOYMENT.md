# 🚀 Deployment Guide — Nexora E-Commerce Store

This guide walks through deploying the backend API and static frontend to production, using free/low-cost services suitable for an internship submission.

---

## Overview

| Component | Recommended Host                    |
|-----------|--------------------------------------|
| Database  | MongoDB Atlas (free M0 cluster)      |
| Backend   | Render / Railway / Cyclic            |
| Frontend  | Netlify / Vercel / GitHub Pages      |

---

## 1. Database — MongoDB Atlas

1. Create a free account at https://www.mongodb.com/cloud/atlas.
2. Create a free **M0 cluster**.
3. Under **Database Access**, create a database user with a strong password.
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) — acceptable for a demo/internship project.
5. Click **Connect → Drivers**, copy the connection string, e.g.:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/codealpha_ecommerce?retryWrites=true&w=majority
   ```
6. Use this as `MONGO_URI` in your backend `.env`.

---

## 2. Backend — Deploy to Render

1. Push the `backend/` folder to a GitHub repository.
2. Go to https://render.com → **New → Web Service** → connect your repo.
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add environment variables (from `.env.example`) in Render's dashboard:
   - `NODE_ENV=production`
   - `PORT=10000` (Render assigns its own PORT env var automatically — Express already reads `process.env.PORT`)
   - `MONGO_URI` — your Atlas connection string
   - `JWT_SECRET` — a long random string
   - `JWT_EXPIRE=7d`
   - `CLIENT_URL` — your deployed frontend URL (for CORS)
   - `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` — used only by the seeder
5. Deploy. Once live, note your API URL, e.g. `https://nexora-api.onrender.com`.
6. Seed the production database once, either by:
   - Running `npm run seed` locally with `MONGO_URI` pointed at Atlas, or
   - Using Render's **Shell** tab to run `npm run seed` against the deployed instance.

> **Alternative hosts:** Railway.app and Cyclic.sh work the same way — connect the repo, set the root directory to `backend`, set environment variables, and deploy.

---

## 3. Frontend — Deploy to Netlify

1. Open `frontend/js/api.js` and change:
   ```js
   const API_BASE_URL = 'http://localhost:5000/api';
   ```
   to your deployed backend URL:
   ```js
   const API_BASE_URL = 'https://nexora-api.onrender.com/api';
   ```
2. Also update `resolveImage()` in the same file to point at your backend host instead of `http://localhost:5000` for uploaded product images.
3. Push the `frontend/` folder to GitHub (or drag-and-drop the folder directly into Netlify's dashboard).
4. Go to https://app.netlify.com → **Add new site → Deploy manually** (drag and drop) or **Import from Git**.
5. If deploying from Git, set:
   - **Base directory:** `frontend`
   - **Publish directory:** `frontend` (no build step needed — it's static HTML/CSS/JS)
6. Deploy. Your storefront will be live at something like `https://nexora-store.netlify.app`.
7. Go back to your Render backend and update `CLIENT_URL` to match this Netlify URL, then redeploy the backend so CORS allows requests from your live frontend.

> **Alternative hosts:** Vercel and GitHub Pages work equally well for static sites — the only requirement is that `API_BASE_URL` in `api.js` points to your live backend.

---

## 4. Post-Deployment Checklist

- [ ] Visit `https://your-backend-url/api/health` — should return a JSON success message.
- [ ] Visit your frontend URL and confirm the homepage loads categories/products (proves CORS + API_BASE_URL are correct).
- [ ] Register a new test account and complete a full checkout flow.
- [ ] Log in as the seeded admin account and confirm the dashboard loads analytics.
- [ ] Upload a new product image via the admin panel and confirm it renders (proves the `/uploads` static route and Multer are working in production).

---

## 5. Running Locally (Quick Reference)

```bash
# Terminal 1 — Backend
cd backend
npm install
cp .env.example .env   # edit MONGO_URI and JWT_SECRET
npm run seed
npm run dev

# Terminal 2 — Frontend
cd frontend
npx serve .
```

Open the frontend URL printed by `serve` (typically `http://localhost:3000` or `http://localhost:5500`).

---

## 6. Common Issues

| Problem                                   | Likely Cause / Fix                                                                 |
|--------------------------------------------|--------------------------------------------------------------------------------------|
| "Cannot reach the server" toast on every page | Backend not running, or `API_BASE_URL` in `frontend/js/api.js` points to the wrong host |
| CORS errors in browser console             | `CLIENT_URL` in backend `.env` doesn't match the frontend's actual origin           |
| Product images broken after deployment     | `resolveImage()` in `api.js` still points to `localhost:5000`                       |
| 401 errors immediately after login          | `JWT_SECRET` mismatch between environments, or clock skew invalidating token expiry |
| Seeder fails to connect                     | `MONGO_URI` incorrect, or Atlas Network Access doesn't allow your IP                 |
