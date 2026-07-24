/* =========================================================
   Admin Order Management Logic
   ========================================================= */

let adminOrdersPage = 1;
let adminOrdersStatusFilter = '';

async function loadAdminOrders() {
  const tbody = document.getElementById('adminOrdersTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4"><div class="loader-ring mx-auto" style="width:28px;height:28px;"></div></td></tr>`;

  const params = new URLSearchParams({ page: adminOrdersPage, limit: 10 });
  if (adminOrdersStatusFilter) params.append('status', adminOrdersStatusFilter);

  try {
    const { orders, page, pages } = await Api.get(`/orders?${params.toString()}`);
    tbody.innerHTML = orders.length
      ? orders
          .map(
            (o) => `
      <tr>
        <td class="fw-semibold">${o.orderNumber}</td>
        <td>${o.user?.name || 'Guest'}<br><small class="text-muted">${o.user?.email || ''}</small></td>
        <td>${formatDate(o.createdAt)}</td>
        <td>${o.items.length}</td>
        <td class="fw-bold">${formatCurrency(o.totalPrice)}</td>
        <td><span class="status-pill status-${o.status}">${o.status.replace(/_/g, ' ')}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-brand" onclick="openStatusModal('${o._id}', '${o.status}')"><i class="bi bi-pencil-square"></i> Update</button>
        </td>
      </tr>`
          )
          .join('')
      : `<tr><td colspan="7" class="text-center text-muted py-4">No orders found</td></tr>`;

    renderAdminPagination('adminOrdersPagination', page, pages, (p) => {
      adminOrdersPage = p;
      loadAdminOrders();
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${err.message}</td></tr>`;
  }
}

function openStatusModal(orderId, currentStatus) {
  document.getElementById('statusOrderId').value = orderId;
  document.getElementById('newStatusSelect').value = currentStatus;
  document.getElementById('statusNote').value = '';
  new bootstrap.Modal(document.getElementById('orderStatusModal')).show();
}

async function submitStatusUpdate() {
  const orderId = document.getElementById('statusOrderId').value;
  const status = document.getElementById('newStatusSelect').value;
  const note = document.getElementById('statusNote').value.trim();

  try {
    await Api.put(`/orders/${orderId}/status`, { status, note });
    showToast('Order status updated successfully', 'success');
    bootstrap.Modal.getInstance(document.getElementById('orderStatusModal')).hide();
    loadAdminOrders();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.querySelectorAll('.status-filter-btn').forEach((btn) => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.status-filter-btn').forEach((b) => b.classList.remove('active', 'btn-brand'));
    document.querySelectorAll('.status-filter-btn').forEach((b) => b.classList.add('btn-outline-brand'));
    this.classList.remove('btn-outline-brand');
    this.classList.add('active', 'btn-brand');
    adminOrdersStatusFilter = this.dataset.status;
    adminOrdersPage = 1;
    loadAdminOrders();
  });
});

document.addEventListener('DOMContentLoaded', () => {
  if (Auth.requireAdmin()) {
    renderAdminLayout('orders');
    loadAdminOrders();
  }
  hidePageLoader();
});
