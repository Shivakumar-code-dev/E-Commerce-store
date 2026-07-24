/* =========================================================
   Admin Coupon Management Logic
   ========================================================= */

async function loadAdminCoupons() {
  const tbody = document.getElementById('adminCouponsTableBody');
  tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4"><div class="loader-ring mx-auto" style="width:28px;height:28px;"></div></td></tr>`;

  try {
    const { coupons } = await Api.get('/coupons');
    const now = new Date();

    tbody.innerHTML = coupons.length
      ? coupons
          .map((c) => {
            const expired = new Date(c.expiresAt) < now;
            return `
      <tr>
        <td class="fw-bold">${c.code}</td>
        <td class="text-capitalize">${c.discountType}</td>
        <td>${c.discountType === 'percentage' ? c.discountValue + '%' : formatCurrency(c.discountValue)}</td>
        <td>${formatCurrency(c.minPurchase)}</td>
        <td>${formatDate(c.expiresAt)}</td>
        <td>${c.usedCount} / ${c.usageLimit}</td>
        <td>${expired ? '<span class="status-pill status-cancelled">Expired</span>' : c.isActive ? '<span class="status-pill status-delivered">Active</span>' : '<span class="status-pill status-pending">Inactive</span>'}</td>
        <td>
          <button class="btn btn-sm btn-outline-brand me-1" onclick="editCoupon('${c._id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm" style="border:1.5px solid var(--danger); color:var(--danger); border-radius:10px;" onclick="deleteCoupon('${c._id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`;
          })
          .join('')
      : `<tr><td colspan="8" class="text-center text-muted py-4">No coupons yet</td></tr>`;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">${err.message}</td></tr>`;
  }
}

let allCouponsCache = [];

function openCouponModal() {
  document.getElementById('couponForm').reset();
  document.getElementById('couponId').value = '';
  document.getElementById('couponModalTitle').textContent = 'Add Coupon';
}

async function editCoupon(couponId) {
  try {
    const { coupons } = await Api.get('/coupons');
    const coupon = coupons.find((c) => c._id === couponId);
    if (!coupon) return;

    document.getElementById('couponModalTitle').textContent = 'Edit Coupon';
    document.getElementById('couponId').value = coupon._id;
    document.getElementById('couponCode').value = coupon.code;
    document.getElementById('couponType').value = coupon.discountType;
    document.getElementById('couponValue').value = coupon.discountValue;
    document.getElementById('couponMinPurchase').value = coupon.minPurchase;
    document.getElementById('couponMaxDiscount').value = coupon.maxDiscount || '';
    document.getElementById('couponExpiry').value = new Date(coupon.expiresAt).toISOString().split('T')[0];
    document.getElementById('couponUsageLimit').value = coupon.usageLimit;

    new bootstrap.Modal(document.getElementById('couponModal')).show();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function saveCoupon() {
  const couponId = document.getElementById('couponId').value;
  const payload = {
    code: document.getElementById('couponCode').value.trim().toUpperCase(),
    discountType: document.getElementById('couponType').value,
    discountValue: Number(document.getElementById('couponValue').value),
    minPurchase: Number(document.getElementById('couponMinPurchase').value) || 0,
    maxDiscount: document.getElementById('couponMaxDiscount').value ? Number(document.getElementById('couponMaxDiscount').value) : null,
    expiresAt: document.getElementById('couponExpiry').value,
    usageLimit: Number(document.getElementById('couponUsageLimit').value) || 1000
  };

  try {
    if (couponId) {
      await Api.put(`/coupons/${couponId}`, payload);
      showToast('Coupon updated successfully', 'success');
    } else {
      await Api.post('/coupons', payload);
      showToast('Coupon created successfully', 'success');
    }
    bootstrap.Modal.getInstance(document.getElementById('couponModal')).hide();
    loadAdminCoupons();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteCoupon(couponId) {
  if (!confirm('Delete this coupon?')) return;
  try {
    await Api.delete(`/coupons/${couponId}`);
    showToast('Coupon deleted successfully', 'success');
    loadAdminCoupons();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (Auth.requireAdmin()) {
    renderAdminLayout('coupons');
    loadAdminCoupons();
  }
  hidePageLoader();
});
