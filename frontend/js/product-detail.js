/* =========================================================
   Product Detail Page Logic
   ========================================================= */

let currentProduct = null;

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function loadProductDetail() {
  const productId = getProductIdFromUrl();
  if (!productId) {
    window.location.href = 'products.html';
    return;
  }

  try {
    const { product, relatedProducts } = await Api.get(`/products/${productId}`);
    currentProduct = product;
    renderProductDetail(product);
    if (relatedProducts.length > 0) {
      document.getElementById('relatedSection').style.display = 'block';
      document.getElementById('relatedGrid').innerHTML = relatedProducts.map(productCardHtml).join('');
    }
  } catch (err) {
    document.getElementById('productDetailRoot').innerHTML = `
      <div class="empty-state">
        <i class="bi bi-exclamation-triangle"></i>
        <h4>Product not found</h4>
        <p class="text-muted">${err.message}</p>
        <a href="products.html" class="btn btn-brand mt-2">Back to Shop</a>
      </div>`;
  }
}

function renderProductDetail(product) {
  document.getElementById('loadingSkeleton').classList.add('d-none');
  const content = document.getElementById('productContent');
  content.classList.remove('d-none');

  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const displayPrice = hasDiscount ? product.discountPrice : product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const images = product.images.length ? product.images : [''];
  const inWishlist = (Auth.getUser()?.wishlist || []).includes(product._id);
  const alreadyReviewed = Auth.isLoggedIn() && product.reviews.some((r) => r.user?._id === Auth.getUser()._id);

  content.innerHTML = `
    <nav aria-label="breadcrumb" class="mb-3">
      <ol class="breadcrumb" style="font-size:0.85rem;">
        <li class="breadcrumb-item"><a href="index.html" class="text-decoration-none text-secondary">Home</a></li>
        <li class="breadcrumb-item"><a href="products.html" class="text-decoration-none text-secondary">Shop</a></li>
        <li class="breadcrumb-item active text-truncate" style="max-width:250px;">${product.name}</li>
      </ol>
    </nav>

    <div class="row g-5">
      <div class="col-lg-6">
        <div class="rounded-xl overflow-hidden mb-3" style="aspect-ratio:1/1; background:var(--surface-solid); border:1px solid var(--border);">
          <img id="mainProductImage" src="${resolveImage(images[0])}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">
        </div>
        <div class="d-flex gap-2 flex-wrap">
          ${images
            .map(
              (img, i) => `
            <img src="${resolveImage(img)}" onclick="document.getElementById('mainProductImage').src=this.src"
                 style="width:72px;height:72px;object-fit:cover;border-radius:12px;cursor:pointer;border:2px solid ${i === 0 ? 'var(--accent)' : 'var(--border)'};">
          `
            )
            .join('')}
        </div>
      </div>

      <div class="col-lg-6">
        <div class="product-brand mb-1">${product.brand}</div>
        <h1 class="fw-bold mb-2" style="font-size:1.8rem;">${product.name}</h1>
        <div class="d-flex align-items-center gap-2 mb-3">
          <span class="rating-stars">${starRatingHtml(product.rating)}</span>
          <span class="text-secondary" style="font-size:0.9rem;">${product.rating.toFixed(1)} · ${product.numReviews} review${product.numReviews !== 1 ? 's' : ''}</span>
          <span class="divider-dot"></span>
          <span class="text-secondary" style="font-size:0.9rem;">${product.soldCount} sold</span>
        </div>

        <div class="d-flex align-items-baseline gap-2 mb-3">
          <span class="fw-bold" style="font-size:2rem;">${formatCurrency(displayPrice)}</span>
          ${hasDiscount ? `<span class="price-original" style="font-size:1.1rem;">${formatCurrency(product.price)}</span><span class="badge" style="background:var(--accent-soft); color:var(--accent);">-${discountPercent}% OFF</span>` : ''}
        </div>

        <p class="text-secondary">${product.shortDescription || product.description.substring(0, 150)}</p>

        <div class="mb-3">
          ${
            product.stock > 5
              ? `<span class="status-pill status-delivered"><i class="bi bi-check-circle me-1"></i>In Stock</span>`
              : product.stock > 0
              ? `<span class="status-pill status-pending"><i class="bi bi-exclamation-circle me-1"></i>Only ${product.stock} left</span>`
              : `<span class="status-pill status-cancelled"><i class="bi bi-x-circle me-1"></i>Out of Stock</span>`
          }
        </div>

        <div class="d-flex align-items-center gap-3 mb-4">
          <div class="qty-control">
            <button onclick="changeDetailQty(-1)"><i class="bi bi-dash"></i></button>
            <span id="detailQty">1</span>
            <button onclick="changeDetailQty(1)"><i class="bi bi-plus"></i></button>
          </div>
          <button class="btn btn-brand flex-grow-1" id="addToCartDetailBtn" ${product.stock === 0 ? 'disabled' : ''} onclick="addToCartFromDetail('${product._id}')">
            <i class="bi bi-bag-plus me-1"></i> Add to Cart
          </button>
          <button class="icon-btn ${inWishlist ? 'active text-danger' : ''}" style="width:52px;height:52px;" onclick="toggleWishlistBtn(this, '${product._id}')">
            <i class="bi ${inWishlist ? 'bi-heart-fill' : 'bi-heart'}"></i>
          </button>
        </div>

        <div class="card-solid rounded-xl p-3 mb-3">
          <div class="d-flex align-items-center gap-2 mb-2"><i class="bi bi-truck text-accent"></i> <small>Free shipping on orders above ₹999</small></div>
          <div class="d-flex align-items-center gap-2 mb-2"><i class="bi bi-arrow-repeat text-accent"></i> <small>7-day easy return &amp; exchange</small></div>
          <div class="d-flex align-items-center gap-2"><i class="bi bi-shield-check text-accent"></i> <small>100% secure payment simulation</small></div>
        </div>
      </div>
    </div>

    <!-- Tabs: Description / Specs / Reviews -->
    <div class="mt-5">
      <ul class="nav nav-tabs" id="productTabs">
        <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-desc">Description</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-specs">Specifications</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-reviews">Reviews (${product.numReviews})</button></li>
      </ul>
      <div class="tab-content pt-4">
        <div class="tab-pane fade show active" id="tab-desc">
          <p style="line-height:1.8;">${product.description}</p>
        </div>
        <div class="tab-pane fade" id="tab-specs">
          ${
            product.specifications.length
              ? `<table class="table table-borderless" style="max-width:500px;">${product.specifications
                  .map((s) => `<tr><td class="text-secondary fw-semibold" style="width:40%;">${s.key}</td><td>${s.value}</td></tr>`)
                  .join('')}</table>`
              : `<p class="text-muted">No specifications listed for this product.</p>`
          }
        </div>
        <div class="tab-pane fade" id="tab-reviews">
          <div class="row g-4">
            <div class="col-lg-7">
              <div id="reviewsList">
                ${
                  product.reviews.length
                    ? product.reviews
                        .map(
                          (r) => `
                    <div class="card-solid rounded-xl p-3 mb-3">
                      <div class="d-flex justify-content-between">
                        <strong>${r.name}</strong>
                        <small class="text-muted">${formatDate(r.createdAt)}</small>
                      </div>
                      <div class="rating-stars mb-2">${starRatingHtml(r.rating)}</div>
                      <p class="mb-0 text-secondary">${r.comment}</p>
                    </div>`
                        )
                        .join('')
                    : `<p class="text-muted">No reviews yet. Be the first to review this product!</p>`
                }
              </div>
            </div>
            <div class="col-lg-5">
              ${
                Auth.isLoggedIn()
                  ? alreadyReviewed
                    ? `<div class="alert alert-info">You've already reviewed this product. Thank you!</div>`
                    : `
                <div class="card-solid rounded-xl p-4">
                  <h6 class="fw-bold mb-3">Write a Review</h6>
                  <div class="mb-3">
                    <label class="form-label">Your Rating</label>
                    <div id="starPicker" style="font-size:1.6rem; color:var(--star); cursor:pointer;">
                      ${[1, 2, 3, 4, 5].map((i) => `<i class="bi bi-star" data-value="${i}" onclick="setStarRating(${i})"></i>`).join('')}
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Your Review</label>
                    <textarea class="form-control" id="reviewComment" rows="3" placeholder="Share your experience with this product..."></textarea>
                  </div>
                  <button class="btn btn-brand w-100" onclick="submitReview('${product._id}')">Submit Review</button>
                </div>`
                  : `<div class="alert alert-warning">Please <a href="login.html">sign in</a> to write a review.</div>`
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

let detailQty = 1;
let selectedRating = 0;

function changeDetailQty(delta) {
  detailQty = Math.max(1, Math.min(detailQty + delta, currentProduct?.stock || 99));
  document.getElementById('detailQty').textContent = detailQty;
}

function setStarRating(value) {
  selectedRating = value;
  document.querySelectorAll('#starPicker i').forEach((star) => {
    const val = parseInt(star.dataset.value);
    star.className = val <= value ? 'bi bi-star-fill' : 'bi bi-star';
  });
}

async function addToCartFromDetail(productId) {
  if (!Auth.isLoggedIn()) {
    showToast('Please sign in to add items to your cart', 'warning');
    setTimeout(() => (window.location.href = 'login.html'), 900);
    return;
  }
  const btn = document.getElementById('addToCartDetailBtn');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="btn-spinner"></span> Adding...`;
  try {
    await Api.post('/cart', { productId, quantity: detailQty });
    showToast('Added to cart successfully!', 'success');
    updateCartBadge();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

async function submitReview(productId) {
  const comment = document.getElementById('reviewComment').value.trim();
  if (selectedRating === 0) {
    showToast('Please select a star rating', 'warning');
    return;
  }
  if (!comment) {
    showToast('Please write a review comment', 'warning');
    return;
  }
  try {
    await Api.post(`/products/${productId}/reviews`, { rating: selectedRating, comment });
    showToast('Review submitted successfully!', 'success');
    setTimeout(() => window.location.reload(), 900);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('products');
  renderFooter();
  loadProductDetail();
  hidePageLoader();
});
