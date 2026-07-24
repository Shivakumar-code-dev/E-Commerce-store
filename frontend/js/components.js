/* =========================================================
   Shared Navbar & Footer — injected on every page
   ========================================================= */

function renderNavbar(activePage = '') {
  const user = Auth.getUser();
  const isLoggedIn = Auth.isLoggedIn();
  const cartCount = localStorage.getItem('cartCount') || 0;

  const navHtml = `
  <nav class="navbar navbar-expand-lg navbar-glass py-3">
    <div class="container">
      <a class="navbar-brand brand-logo" href="index.html">Nexora</a>
      <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav mx-auto gap-lg-2 mt-3 mt-lg-0">
          <li class="nav-item"><a class="nav-link nav-link-custom ${activePage === 'home' ? 'active' : ''}" href="index.html">Home</a></li>
          <li class="nav-item"><a class="nav-link nav-link-custom ${activePage === 'products' ? 'active' : ''}" href="products.html">Shop</a></li>
          <li class="nav-item"><a class="nav-link nav-link-custom ${activePage === 'orders' ? 'active' : ''}" href="orders.html">Orders</a></li>
        </ul>
        <form class="d-none d-lg-flex me-3" style="width: 320px;" onsubmit="handleNavSearch(event)">
          <div class="input-group">
            <span class="input-group-text bg-transparent border-end-0"><i class="bi bi-search"></i></span>
            <input type="search" id="navSearchInput" class="form-control border-start-0" placeholder="Search products...">
          </div>
        </form>
        <div class="d-flex align-items-center gap-2">
          <button class="theme-toggle"><i class="bi bi-moon-stars-fill"></i></button>
          <a href="wishlist.html" class="icon-btn text-decoration-none" title="Wishlist"><i class="bi bi-heart"></i></a>
          <a href="cart.html" class="icon-btn text-decoration-none position-relative" title="Cart">
            <i class="bi bi-bag"></i>
            ${cartCount > 0 ? `<span class="badge-count" id="navCartBadge">${cartCount}</span>` : `<span class="badge-count d-none" id="navCartBadge"></span>`}
          </a>
          ${
            isLoggedIn
              ? `
          <div class="dropdown">
            <button class="icon-btn" data-bs-toggle="dropdown"><i class="bi bi-person"></i></button>
            <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2" style="border-radius:14px;">
              <li class="px-3 py-2"><small class="text-muted">Signed in as</small><br><strong>${user?.name || 'User'}</strong></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="profile.html"><i class="bi bi-person-circle me-2"></i>My Profile</a></li>
              <li><a class="dropdown-item" href="orders.html"><i class="bi bi-box-seam me-2"></i>My Orders</a></li>
              <li><a class="dropdown-item" href="wishlist.html"><i class="bi bi-heart me-2"></i>Wishlist</a></li>
              ${user?.role === 'admin' ? '<li><a class="dropdown-item" href="admin/dashboard.html"><i class="bi bi-speedometer2 me-2"></i>Admin Panel</a></li>' : ''}
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="#" onclick="Auth.logout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
            </ul>
          </div>`
              : `<a href="login.html" class="btn btn-brand btn-sm px-3">Sign In</a>`
          }
        </div>
      </div>
    </div>
  </nav>`;

  document.getElementById('navbar-root').innerHTML = navHtml;
  initThemeToggle();
  updateCartBadge();
}

function handleNavSearch(e) {
  e.preventDefault();
  const query = document.getElementById('navSearchInput').value.trim();
  window.location.href = `products.html${query ? '?keyword=' + encodeURIComponent(query) : ''}`;
}

async function updateCartBadge() {
  if (!Auth.isLoggedIn()) return;
  try {
    const { cart } = await Api.get('/cart');
    const count = cart.items.reduce((acc, i) => acc + i.quantity, 0);
    localStorage.setItem('cartCount', count);
    const badge = document.getElementById('navCartBadge');
    if (badge) {
      badge.textContent = count;
      badge.classList.toggle('d-none', count === 0);
    }
  } catch (e) {
    /* silent fail — user may not be logged in yet */
  }
}

function renderFooter() {
  const footerHtml = `
  <footer class="site-footer">
    <div class="container">
      <div class="row g-4">
        <div class="col-lg-4 col-md-6">
          <div class="brand-logo mb-3">Nexora</div>
          <p class="text-secondary" style="font-size:0.9rem; max-width:320px;">
            A premium shopping experience built for the CodeAlpha Full Stack Development Internship —
            combining thoughtful design with real commerce functionality.
          </p>
          <div class="d-flex gap-2 mt-3">
            <span class="icon-btn"><i class="bi bi-facebook"></i></span>
            <span class="icon-btn"><i class="bi bi-twitter-x"></i></span>
            <span class="icon-btn"><i class="bi bi-instagram"></i></span>
            <span class="icon-btn"><i class="bi bi-linkedin"></i></span>
          </div>
        </div>
        <div class="col-lg-2 col-md-6 col-6">
          <div class="footer-heading">Shop</div>
          <a href="products.html" class="footer-link">All Products</a>
          <a href="products.html?featured=true" class="footer-link">Featured</a>
          <a href="index.html#categories" class="footer-link">Categories</a>
          <a href="wishlist.html" class="footer-link">Wishlist</a>
        </div>
        <div class="col-lg-2 col-md-6 col-6">
          <div class="footer-heading">Account</div>
          <a href="profile.html" class="footer-link">My Profile</a>
          <a href="orders.html" class="footer-link">My Orders</a>
          <a href="cart.html" class="footer-link">Cart</a>
          <a href="login.html" class="footer-link">Sign In</a>
        </div>
        <div class="col-lg-4 col-md-6">
          <div class="footer-heading">Get in touch</div>
          <p class="footer-link mb-1"><i class="bi bi-envelope me-2"></i>support@nexora-store.com</p>
          <p class="footer-link mb-1"><i class="bi bi-telephone me-2"></i>+91 98765 43210</p>
          <p class="footer-link"><i class="bi bi-geo-alt me-2"></i>Bengaluru, Karnataka, India</p>
        </div>
      </div>
      <hr class="my-4" style="border-color: var(--border);">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
        <small class="text-muted">© ${new Date().getFullYear()} Nexora Store · CodeAlpha Full Stack Internship Project</small>
        <small class="text-muted">Built with Node.js, Express, MongoDB &amp; Bootstrap 5</small>
      </div>
    </div>
  </footer>`;
  const root = document.getElementById('footer-root');
  if (root) root.innerHTML = footerHtml;
}

function hidePageLoader() {
  const loader = document.querySelector('.page-loader');
  if (loader) setTimeout(() => loader.classList.add('hidden'), 250);
}

function starRatingHtml(rating) {
  const full = Math.round(rating);
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<i class="bi ${i <= full ? 'bi-star-fill' : 'bi-star'}"></i>`;
  }
  return html;
}
