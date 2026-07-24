/* =========================================================
   Checkout Page Logic
   ========================================================= */

let checkoutCart = null;
let checkoutSummary = null;
let shippingData = null;

async function loadCheckoutSummary() {
  try {
    const { cart, summary } = await Api.get('/cart');
    if (!cart.items || cart.items.length === 0) {
      showToast('Your cart is empty', 'warning');
      setTimeout(() => (window.location.href = 'cart.html'), 900);
      return;
    }
    checkoutCart = cart;
    checkoutSummary = summary;
    renderCheckoutSummary();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderCheckoutSummary() {
  const box = document.getElementById('checkoutSummary');
  box.innerHTML = `
    <h5 class="fw-bold mb-3">Order Summary</h5>
    <div class="mb-3" style="max-height:220px; overflow-y:auto;">
      ${checkoutCart.items
        .map(
          (item) => `
        <div class="d-flex align-items-center gap-2 mb-2">
          <img src="${resolveImage(item.image)}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;">
          <div class="flex-grow-1" style="font-size:0.85rem;">
            <div class="text-truncate" style="max-width:180px;">${item.name}</div>
            <small class="text-muted">Qty: ${item.quantity}</small>
          </div>
          <strong style="font-size:0.85rem;">${formatCurrency(item.price * item.quantity)}</strong>
        </div>`
        )
        .join('')}
    </div>
    <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(checkoutSummary.itemsPrice)}</span></div>
    ${checkoutSummary.discount > 0 ? `<div class="summary-row" style="color:var(--success);"><span>Coupon Discount</span><span>-${formatCurrency(checkoutSummary.discount)}</span></div>` : ''}
    <div class="summary-row"><span>Shipping</span><span>${checkoutSummary.shippingPrice === 0 ? 'FREE' : formatCurrency(checkoutSummary.shippingPrice)}</span></div>
    <div class="summary-row"><span>Estimated Tax</span><span>${formatCurrency(checkoutSummary.taxPrice)}</span></div>
    <div class="summary-row total"><span>Total</span><span>${formatCurrency(checkoutSummary.totalPrice)}</span></div>
  `;
}

function goToStep(step) {
  ['stepShipping', 'stepPayment', 'stepReview'].forEach((id, idx) => {
    document.getElementById(id).classList.toggle('d-none', idx !== step - 1);
  });

  [1, 2, 3].forEach((s) => {
    const indicator = document.getElementById(`step${s}Indicator`);
    indicator.classList.remove('active', 'done');
    if (s < step) indicator.classList.add('done');
    else if (s === step) indicator.classList.add('active');
  });

  if (step === 3) renderReview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('shippingForm')?.addEventListener('submit', function (e) {
  e.preventDefault();
  shippingData = {
    fullName: document.getElementById('fullName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    addressLine1: document.getElementById('addressLine1').value.trim(),
    addressLine2: document.getElementById('addressLine2').value.trim(),
    city: document.getElementById('city').value.trim(),
    state: document.getElementById('state').value.trim(),
    postalCode: document.getElementById('postalCode').value.trim(),
    country: 'India'
  };
  goToStep(2);
});

function renderReview() {
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  const paymentLabels = { card: 'Credit / Debit Card', upi: 'UPI', cod: 'Cash on Delivery' };

  document.getElementById('reviewShippingBox').innerHTML = `
    <div class="d-flex justify-content-between align-items-start">
      <div>
        <h6 class="fw-bold mb-1"><i class="bi bi-geo-alt me-1 text-accent"></i>Shipping to</h6>
        <p class="mb-0 text-secondary" style="font-size:0.9rem;">
          ${shippingData.fullName}, ${shippingData.phone}<br>
          ${shippingData.addressLine1}${shippingData.addressLine2 ? ', ' + shippingData.addressLine2 : ''}<br>
          ${shippingData.city}, ${shippingData.state} - ${shippingData.postalCode}, ${shippingData.country}
        </p>
      </div>
      <button class="btn-ghost" onclick="goToStep(1)">Edit</button>
    </div>
    <hr>`;

  document.getElementById('reviewPaymentBox').innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <div><h6 class="fw-bold mb-1"><i class="bi bi-credit-card me-1 text-accent"></i>Payment Method</h6>
      <p class="mb-0 text-secondary" style="font-size:0.9rem;">${paymentLabels[paymentMethod]}</p></div>
      <button class="btn-ghost" onclick="goToStep(2)">Edit</button>
    </div>
    <hr>`;

  document.getElementById('reviewItemsBox').innerHTML = `
    <h6 class="fw-bold mb-2"><i class="bi bi-box-seam me-1 text-accent"></i>Items (${checkoutCart.items.length})</h6>
    ${checkoutCart.items
      .map(
        (item) => `
      <div class="d-flex justify-content-between mb-2" style="font-size:0.9rem;">
        <span class="text-secondary">${item.name} × ${item.quantity}</span>
        <strong>${formatCurrency(item.price * item.quantity)}</strong>
      </div>`
      )
      .join('')}
  `;
}

async function placeOrder() {
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  const btn = document.getElementById('placeOrderBtn');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="btn-spinner"></span> Processing Payment...`;

  try {
    // Simulate a brief payment processing delay for realism
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const { order } = await Api.post('/orders', { shippingAddress: shippingData, paymentMethod });
    showToast('Order placed successfully! 🎉', 'success');
    localStorage.setItem('cartCount', 0);
    setTimeout(() => {
      window.location.href = `orders.html?highlight=${order._id}`;
    }, 900);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

document.getElementById('cardFieldsSection') &&
  document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener('change', function () {
      document.getElementById('cardFieldsSection').classList.toggle('d-none', this.value !== 'card');
    });
  });

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('');
  renderFooter();
  if (Auth.requireAuth()) {
    loadCheckoutSummary();
  }
  hidePageLoader();
});
