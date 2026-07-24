/* =========================================================
   Homepage logic + shared product-card renderer
   ========================================================= */

function productCardHtml(product) {
  const img = resolveImage(product.images && product.images[0]);
  const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
  const displayPrice = hasDiscount ? product.discountPrice : product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const wishlist = (Auth.getUser()?.wishlist || []);
  const inWishlist = wishlist.includes(product._id);

  return `
  <div class="col-lg-3 col-md-4 col-6">
    <div class="product-card fade-in">
      <a href="product.html?id=${product._id}" class="text-decoration-none">
        <div class="product-img-wrap">
          ${hasDiscount ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
          ${product.stock === 0 ? '<span class="stock-badge">Out of stock</span>' : product.stock <= 5 ? `<span class="stock-badge">Only ${product.stock} left</span>` : ''}
          <button class="wishlist-btn ${inWishlist ? 'active' : ''}" onclick="event.preventDefault(); toggleWishlistBtn(this,'${product._id}')">
            <i class="bi ${inWishlist ? 'bi-heart-fill' : 'bi-heart'}"></i>
          </button>
          <img src="${img}" alt="${product.name}" loading="lazy">
        </div>
      </a>
      <div class="product-body">
        <div class="product-brand">${product.brand || 'Nexora'}</div>
        <a href="product.html?id=${product._id}" class="text-decoration-none text-reset">
          <div class="product-title">${product.name}</div>
        </a>
        <div class="rating-stars">${starRatingHtml(product.rating)} <small class="text-muted">(${product.numReviews || 0})</small></div>
        <div class="price-row">
          <span class="price-current">${formatCurrency(displayPrice)}</span>
          ${hasDiscount ? `<span class="price-original">${formatCurrency(product.price)}</span>` : ''}
        </div>
        <button class="add-cart-btn" ${product.stock === 0 ? 'disabled' : ''} onclick="quickAddToCart('${product._id}', this)">
          <i class="bi bi-bag-plus me-1"></i> ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  </div>`;
}

function skeletonCardHtml() {
  return `
  <div class="col-lg-3 col-md-4 col-6">
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line short"></div>
      <div class="skeleton skeleton-line" style="margin-top:16px;"></div>
    </div>
  </div>`;
}

async function quickAddToCart(productId, btnEl) {
  if (!Auth.isLoggedIn()) {
    showToast('Please sign in to add items to your cart', 'warning');
    setTimeout(() => (window.location.href = 'login.html'), 900);
    return;
  }
  const originalHtml = btnEl.innerHTML;
  btnEl.disabled = true;
  btnEl.innerHTML = `<span class="btn-spinner" style="border-top-color:var(--text-primary); border-color:var(--border);"></span> Adding...`;
  try {
    await Api.post('/cart', { productId, quantity: 1 });
    showToast('Added to cart successfully!', 'success');
    updateCartBadge();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btnEl.disabled = false;
    btnEl.innerHTML = originalHtml;
  }
}

async function toggleWishlistBtn(btnEl, productId) {
  if (!Auth.isLoggedIn()) {
    showToast('Please sign in to use your wishlist', 'warning');
    setTimeout(() => (window.location.href = 'login.html'), 900);
    return;
  }
  try {
    const res = await Api.post(`/auth/wishlist/${productId}`, {});
    const user = Auth.getUser();
    user.wishlist = res.wishlist;
    localStorage.setItem('user', JSON.stringify(user));
    btnEl.classList.toggle('active', res.added);
    btnEl.querySelector('i').className = res.added ? 'bi bi-heart-fill' : 'bi bi-heart';
    showToast(res.message, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

const CATEGORY_ICON_FALLBACK = {
  Electronics: 'bi-laptop',
  Fashion: 'bi-bag-heart',
  'Home & Kitchen': 'bi-house-heart',
  'Beauty & Personal Care': 'bi-stars',
  'Sports & Outdoors': 'bi-bicycle',
  Books: 'bi-book'
};

async function loadCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  try {
    const { categories } = await Api.get('/categories');
    grid.innerHTML = categories
      .map(
        (cat) => `
      <div class="col-lg-2 col-md-4 col-4">
        <a href="products.html?category=${cat._id}" class="text-decoration-none text-reset">
          <div class="category-card">
            <div class="category-icon"><i class="bi ${cat.icon || CATEGORY_ICON_FALLBACK[cat.name] || 'bi-grid'}"></i></div>
            <div class="fw-semibold" style="font-size:0.88rem;">${cat.name}</div>
            <small class="text-muted">${cat.productCount} items</small>
          </div>
        </a>
      </div>`
      )
      .join('');
  } catch (err) {
    grid.innerHTML = `<div class="col-12 text-center text-muted py-4">Unable to load categories. Is the backend running?</div>`;
  }
}

async function loadFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  grid.innerHTML = Array(4).fill(skeletonCardHtml()).join('');
  try {
    const { products } = await Api.get('/products/featured/list');
    grid.innerHTML = products.length
      ? products.map(productCardHtml).join('')
      : `<div class="col-12 empty-state"><i class="bi bi-box-seam"></i><p class="text-muted">No featured products yet</p></div>`;
  } catch (err) {
    grid.innerHTML = `<div class="col-12 text-center text-muted py-4">Unable to load products. Is the backend running on port 5000?</div>`;
  }
}

async function loadLatest() {
  const grid = document.getElementById('latestGrid');
  if (!grid) return;
  grid.innerHTML = Array(4).fill(skeletonCardHtml()).join('');
  try {
    const { products } = await Api.get('/products?sort=newest&limit=8');
    grid.innerHTML = products.length
      ? products.map(productCardHtml).join('')
      : `<div class="col-12 empty-state"><i class="bi bi-box-seam"></i><p class="text-muted">No products yet</p></div>`;
  } catch (err) {
    grid.innerHTML = `<div class="col-12 text-center text-muted py-4">Unable to load products.</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('home');
  renderFooter();
  loadCategories();
  loadFeatured();
  loadLatest();
  hidePageLoader();
});
