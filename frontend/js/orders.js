/* =========================================================
   Orders Page Logic — History, Tracking, Invoice
   ========================================================= */

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
const STATUS_ICONS = {
  pending: 'bi-hourglass-split',
  processing: 'bi-gear',
  shipped: 'bi-box-seam',
  out_for_delivery: 'bi-truck',
  delivered: 'bi-check-circle'
};

async function loadOrders() {
  const list = document.getElementById('ordersList');
  list.innerHTML = Array(3)
    .fill('<div class="skeleton" style="height:110px; margin-bottom:16px; border-radius:16px;"></div>')
    .join('');

  try {
    const { orders } = await Api.get('/orders/my-orders');

    if (orders.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-bag-x"></i>
          <h5>No orders yet</h5>
          <p class="text-muted">When you place an order, it will show up here.</p>
          <a href="products.html" class="btn btn-brand mt-2">Start Shopping</a>
        </div>`;
      return;
    }

    list.innerHTML = orders.map(orderCardHtml).join('');

    const params = new URLSearchParams(window.location.search);
    const highlight = params.get('highlight');
    if (highlight) viewOrderDetail(highlight);
  } catch (err) {
    list.innerHTML = `<div class="text-center text-muted py-5">Unable to load orders. ${err.message}</div>`;
  }
}

function orderCardHtml(order) {
  return `
  <div class="cart-item-row fade-in" style="cursor:pointer;" onclick="viewOrderDetail('${order._id}')">
    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
      <div>
        <div class="fw-bold">${order.orderNumber}</div>
        <small class="text-muted">Placed on ${formatDate(order.createdAt)} · ${order.items.length} item${order.items.length !== 1 ? 's' : ''}</small>
      </div>
      <span class="status-pill status-${order.status}"><i class="bi ${STATUS_ICONS[order.status] || 'bi-x-circle'} me-1"></i>${order.status.replace(/_/g, ' ')}</span>
    </div>
    <div class="d-flex align-items-center gap-2 mt-3 overflow-auto">
      ${order.items
        .slice(0, 4)
        .map((item) => `<img src="${resolveImage(item.image)}" style="width:52px;height:52px;object-fit:cover;border-radius:8px;">`)
        .join('')}
      ${order.items.length > 4 ? `<span class="text-muted small">+${order.items.length - 4} more</span>` : ''}
    </div>
    <div class="d-flex justify-content-between align-items-center mt-3">
      <strong>${formatCurrency(order.totalPrice)}</strong>
      <span class="btn-ghost">View Details <i class="bi bi-chevron-right"></i></span>
    </div>
  </div>`;
}

async function viewOrderDetail(orderId) {
  document.getElementById('ordersListView').classList.add('d-none');
  document.getElementById('orderDetailView').classList.remove('d-none');
  const content = document.getElementById('orderDetailContent');
  content.innerHTML = `<div class="skeleton" style="height:400px; border-radius:16px;"></div>`;

  try {
    const { order } = await Api.get(`/orders/${orderId}`);
    renderOrderDetail(order);
  } catch (err) {
    content.innerHTML = `<div class="text-center text-muted py-5">${err.message}</div>`;
  }
}

function backToOrdersList() {
  document.getElementById('orderDetailView').classList.add('d-none');
  document.getElementById('ordersListView').classList.remove('d-none');
  window.history.replaceState({}, '', 'orders.html');
}

function renderOrderDetail(order) {
  const content = document.getElementById('orderDetailContent');
  const isCancelled = order.status === 'cancelled';
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  content.innerHTML = `
    <div class="card-solid rounded-xl p-4 mb-4">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <div>
          <h5 class="fw-bold mb-1">${order.orderNumber}</h5>
          <small class="text-muted">Placed on ${formatDate(order.createdAt)}</small>
        </div>
        <div class="d-flex gap-2">
          <span class="status-pill status-${order.status}">${order.status.replace(/_/g, ' ')}</span>
          <button class="btn btn-outline-brand btn-sm" onclick="printInvoice('${order._id}')"><i class="bi bi-printer me-1"></i>Invoice</button>
          ${
            ['pending', 'processing'].includes(order.status)
              ? `<button class="btn btn-sm" style="border:1.5px solid var(--danger); color:var(--danger); border-radius:10px;" onclick="cancelOrder('${order._id}')">Cancel Order</button>`
              : ''
          }
        </div>
      </div>

      ${
        !isCancelled
          ? `
      <div class="tracker">
        ${STATUS_STEPS.map((step, idx) => `
          <div class="tracker-step ${idx < currentStepIndex ? 'completed' : idx === currentStepIndex ? 'current' : ''}">
            <div class="tracker-dot"><i class="bi ${STATUS_ICONS[step]}"></i></div>
            <div class="tracker-label">${step.replace(/_/g, ' ')}</div>
          </div>`).join('')}
      </div>`
          : `<div class="alert alert-danger">This order was cancelled.</div>`
      }
    </div>

    <div class="row g-4">
      <div class="col-lg-7">
        <div class="card-solid rounded-xl p-4 mb-4">
          <h6 class="fw-bold mb-3">Items Ordered</h6>
          ${order.items
            .map(
              (item) => `
            <div class="d-flex align-items-center gap-3 mb-3">
              <img src="${resolveImage(item.image)}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;">
              <div class="flex-grow-1">
                <div class="fw-semibold">${item.name}</div>
                <small class="text-muted">Qty: ${item.quantity} × ${formatCurrency(item.price)}</small>
              </div>
              <strong>${formatCurrency(item.price * item.quantity)}</strong>
            </div>`
            )
            .join('')}
        </div>

        <div class="card-solid rounded-xl p-4">
          <h6 class="fw-bold mb-2"><i class="bi bi-geo-alt me-1 text-accent"></i>Shipping Address</h6>
          <p class="text-secondary mb-0" style="font-size:0.9rem;">
            ${order.shippingAddress.fullName}, ${order.shippingAddress.phone}<br>
            ${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}
          </p>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="summary-card">
          <h6 class="fw-bold mb-3">Payment Summary</h6>
          <div class="summary-row"><span>Payment Method</span><span class="text-capitalize">${order.paymentMethod}</span></div>
          <div class="summary-row"><span>Payment Status</span><span>${order.isPaid ? '<span class="text-success">Paid</span>' : '<span class="text-warning">Pending</span>'}</span></div>
          <hr>
          <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(order.itemsPrice)}</span></div>
          ${order.couponDiscount > 0 ? `<div class="summary-row" style="color:var(--success);"><span>Coupon (${order.couponCode})</span><span>-${formatCurrency(order.couponDiscount)}</span></div>` : ''}
          <div class="summary-row"><span>Shipping</span><span>${order.shippingPrice === 0 ? 'FREE' : formatCurrency(order.shippingPrice)}</span></div>
          <div class="summary-row"><span>Tax</span><span>${formatCurrency(order.taxPrice)}</span></div>
          <div class="summary-row total"><span>Total</span><span>${formatCurrency(order.totalPrice)}</span></div>
        </div>
      </div>
    </div>
  `;
}

async function cancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order?')) return;
  try {
    await Api.put(`/orders/${orderId}/cancel`, {});
    showToast('Order cancelled successfully', 'success');
    viewOrderDetail(orderId);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function printInvoice(orderId) {
  try {
    const { order } = await Api.get(`/orders/${orderId}`);
    const invoiceWindow = window.open('', '_blank');
    invoiceWindow.document.write(buildInvoiceHtml(order));
    invoiceWindow.document.close();
    setTimeout(() => invoiceWindow.print(), 400);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function buildInvoiceHtml(order) {
  return `
  <!DOCTYPE html><html><head><title>Invoice ${order.orderNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
    .header { display:flex; justify-content:space-between; align-items:center; border-bottom: 3px solid #ff6a3d; padding-bottom: 20px; margin-bottom: 30px; }
    .brand { font-size: 28px; font-weight: 800; color: #ff6a3d; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; }
    th { background: #f7f7fa; text-transform: uppercase; font-size: 12px; color: #666; }
    .totals { margin-top: 20px; width: 320px; margin-left: auto; }
    .totals div { display:flex; justify-content:space-between; padding: 6px 0; }
    .grand-total { font-weight: 800; font-size: 18px; border-top: 2px solid #1a1a1a; padding-top: 10px !important; margin-top: 6px; }
  </style></head>
  <body>
    <div class="header">
      <div class="brand">Nexora</div>
      <div style="text-align:right;">
        <strong>INVOICE</strong><br>
        Order #: ${order.orderNumber}<br>
        Date: ${formatDate(order.createdAt)}
      </div>
    </div>
    <p><strong>Ship To:</strong><br>
    ${order.shippingAddress.fullName}<br>
    ${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}<br>
    Phone: ${order.shippingAddress.phone}</p>
    <table>
      <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>
        ${order.items.map((i) => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${formatCurrency(i.price)}</td><td>${formatCurrency(i.price * i.quantity)}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="totals">
      <div><span>Subtotal</span><span>${formatCurrency(order.itemsPrice)}</span></div>
      ${order.couponDiscount > 0 ? `<div><span>Discount</span><span>-${formatCurrency(order.couponDiscount)}</span></div>` : ''}
      <div><span>Shipping</span><span>${order.shippingPrice === 0 ? 'FREE' : formatCurrency(order.shippingPrice)}</span></div>
      <div><span>Tax</span><span>${formatCurrency(order.taxPrice)}</span></div>
      <div class="grand-total"><span>Total</span><span>${formatCurrency(order.totalPrice)}</span></div>
    </div>
    <p style="margin-top:40px; text-align:center; color:#999; font-size:12px;">Thank you for shopping with Nexora — CodeAlpha Internship Project</p>
  </body></html>`;
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('orders');
  renderFooter();
  if (Auth.requireAuth()) {
    loadOrders();
  }
  hidePageLoader();
});
