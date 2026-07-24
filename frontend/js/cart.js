/* =========================================================
   Cart Page Logic
   ========================================================= */

async function loadCart() {
  const container = document.getElementById('cartContainer');
  container.innerHTML = `
    <div class="col-lg-8">
      <div class="skeleton" style="height:120px; margin-bottom:16px; border-radius:16px;"></div>
      <div class="skeleton" style="height:120px; margin-bottom:16px; border-radius:16px;"></div>
      <div class="skeleton" style="height:120px; border-radius:16px;"></div>
    </div>
    <div class="col-lg-4"><div class="skeleton" style="height:320px; border-radius:16px;"></div></div>
  `;

  try {
    const { cart, summary } = await Api.get('/cart');
    renderCart(cart, summary);
  } catch (err) {
    container.innerHTML = `<div class="col-12 empty-state"><i class="bi bi-bag-x"></i><h5>Unable to load cart</h5><p class="text-muted">${err.message}</p></div>`;
  }
}

function renderCart(cart, summary) {
  const container = document.getElementById('cartContainer');

  if (!cart.items || cart.items.length === 0) {
    container.innerHTML = `
      <div class="col-12 empty-state">
        <i class="bi bi-bag-x"></i>
        <h5>Your cart is empty</h5>
        <p class="text-muted">Looks like you haven't added anything yet.</p>
        <a href="products.html" class="btn btn-brand mt-2">Start Shopping</a>
      </div>`;
    return;
  }

  const itemsHtml = cart.items
    .map(
      (item) => `
    <div class="cart-item-row d-flex align-items-center gap-3 flex-wrap" data-product-id="${item.product}">
      <img src="${resolveImage(item.image)}" style="width:80px;height:80px;object-fit:cover;border-radius:12px;">
      <div class="flex-grow-1" style="min-width:180px;">
        <a href="product.html?id=${item.product}" class="text-decoration-none text-reset fw-semibold">${item.name}</a>
        <div class="text-muted" style="font-size:0.85rem;">${formatCurrency(item.price)} each</div>
      </div>
      <div class="qty-control">
        <button onclick="updateQty('${item.product}', ${item.quantity - 1})"><i class="bi bi-dash"></i></button>
        <span>${item.quantity}</span>
        <button onclick="updateQty('${item.product}', ${item.quantity + 1})"><i class="bi bi-plus"></i></button>
      </div>
      <div class="fw-bold" style="min-width:90px; text-align:right;">${formatCurrency(item.price * item.quantity)}</div>
      <button class="btn btn-ghost text-danger" onclick="removeItem('${item.product}')"><i class="bi bi-trash"></i></button>
    </div>`
    )
    .join('');

  container.innerHTML = `
    <div class="col-lg-8">
      <div id="cartItemsList">${itemsHtml}</div>
      <a href="products.html" class="btn-ghost"><i class="bi bi-arrow-left me-1"></i> Continue Shopping</a>
    </div>
    <div class="col-lg-4">
      <div class="summary-card">
        <h5 class="fw-bold mb-3">Order Summary</h5>

        <div class="mb-3">
          <div class="input-group">
            <input type="text" class="form-control" id="couponInput" placeholder="Coupon code" value="${cart.couponCode || ''}" ${cart.couponCode ? 'disabled' : ''}>
            ${
              cart.couponCode
                ? `<button class="btn btn-outline-brand" onclick="removeCoupon()">Remove</button>`
                : `<button class="btn btn-indigo" onclick="applyCoupon()">Apply</button>`
            }
          </div>
          <small class="text-muted">Try: WELCOME10, FLAT200, MEGA25</small>
        </div>

        <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(summary.itemsPrice)}</span></div>
        ${summary.discount > 0 ? `<div class="summary-row" style="color:var(--success);"><span>Coupon Discount</span><span>-${formatCurrency(summary.discount)}</span></div>` : ''}
        <div class="summary-row"><span>Shipping</span><span>${summary.shippingPrice === 0 ? 'FREE' : formatCurrency(summary.shippingPrice)}</span></div>
        <div class="summary-row"><span>Estimated Tax</span><span>${formatCurrency(summary.taxPrice)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatCurrency(summary.totalPrice)}</span></div>

        <button class="btn btn-brand w-100 mt-3" onclick="window.location.href='checkout.html'">
          Proceed to Checkout <i class="bi bi-arrow-right ms-1"></i>
        </button>
      </div>
    </div>`;
}

async function updateQty(productId, newQty) {
  if (newQty < 1) {
    removeItem(productId);
    return;
  }
  try {
    const { cart, summary } = await Api.put(`/cart/${productId}`, { quantity: newQty });
    renderCart(cart, summary);
    updateCartBadge();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function removeItem(productId) {
  try {
    const { cart, summary } = await Api.delete(`/cart/${productId}`);
    renderCart(cart, summary);
    updateCartBadge();
    showToast('Item removed from cart', 'info');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function applyCoupon() {
  const code = document.getElementById('couponInput').value.trim();
  if (!code) {
    showToast('Please enter a coupon code', 'warning');
    return;
  }
  try {
    const { cart, summary, message } = await Api.post('/cart/coupon', { code });
    renderCart(cart, summary);
    showToast(message, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function removeCoupon() {
  try {
    const { cart, summary } = await Api.delete('/cart/coupon');
    renderCart(cart, summary);
    showToast('Coupon removed', 'info');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('');
  renderFooter();
  if (Auth.requireAuth()) {
    loadCart();
  }
  hidePageLoader();
});
