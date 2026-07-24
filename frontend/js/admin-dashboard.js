/* =========================================================
   Admin Dashboard Logic — Stats, Charts, Analytics
   ========================================================= */

const STATUS_ICONS_ADMIN = {
  pending: 'bi-hourglass-split',
  processing: 'bi-gear',
  shipped: 'bi-box-seam',
  out_for_delivery: 'bi-truck',
  delivered: 'bi-check-circle',
  cancelled: 'bi-x-circle'
};

async function loadDashboard() {
  try {
    const { stats, salesTrend, topProducts, recentOrders, statusBreakdown } = await Api.get('/admin/dashboard');
    renderStatsCards(stats);
    renderSalesChart(salesTrend);
    renderStatusChart(statusBreakdown);
    renderTopProducts(topProducts);
    renderRecentOrders(recentOrders);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderStatsCards(stats) {
  const cards = [
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: 'bi-currency-rupee', color: 'var(--success)' },
    { label: 'Total Orders', value: stats.totalOrders, icon: 'bi-receipt', color: 'var(--indigo)' },
    { label: 'Total Customers', value: stats.totalUsers, icon: 'bi-people', color: 'var(--accent)' },
    { label: 'Total Products', value: stats.totalProducts, icon: 'bi-box-seam', color: 'var(--warning)' }
  ];

  document.getElementById('statsCards').innerHTML = cards
    .map(
      (c) => `
    <div class="col-lg-3 col-md-6">
      <div class="stat-card">
        <div class="stat-icon" style="background:${c.color}22; color:${c.color};"><i class="bi ${c.icon}"></i></div>
        <h4 class="fw-bold mb-0">${c.value}</h4>
        <small class="text-secondary">${c.label}</small>
      </div>
    </div>`
    )
    .join('') +
    `
    <div class="col-lg-3 col-md-6">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(229,72,77,0.15); color:var(--danger);"><i class="bi bi-exclamation-triangle"></i></div>
        <h4 class="fw-bold mb-0">${stats.lowStockProducts + stats.outOfStockProducts}</h4>
        <small class="text-secondary">Low / Out of Stock Items</small>
      </div>
    </div>`;
}

function renderSalesChart(salesTrend) {
  const ctx = document.getElementById('salesChart');
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }
  const dataMap = {};
  salesTrend.forEach((s) => (dataMap[s._id] = s.revenue));
  const data = last7Days.map((d) => dataMap[d] || 0);
  const labels = last7Days.map((d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short' }));

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Revenue (₹)',
          data,
          borderColor: '#ff6a3d',
          backgroundColor: 'rgba(255, 106, 61, 0.12)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#ff6a3d'
        }
      ]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function renderStatusChart(statusBreakdown) {
  const ctx = document.getElementById('statusChart');
  const colors = {
    pending: '#f5a623',
    processing: '#4b3fe4',
    shipped: '#6a5ff5',
    out_for_delivery: '#ff6a3d',
    delivered: '#1ca768',
    cancelled: '#e5484d'
  };

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: statusBreakdown.map((s) => s._id.replace(/_/g, ' ')),
      datasets: [
        {
          data: statusBreakdown.map((s) => s.count),
          backgroundColor: statusBreakdown.map((s) => colors[s._id] || '#999')
        }
      ]
    },
    options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } }
  });
}

function renderTopProducts(products) {
  document.getElementById('topProductsList').innerHTML = products.length
    ? products
        .map(
          (p, idx) => `
      <div class="d-flex align-items-center gap-3 mb-3">
        <span class="fw-bold text-muted" style="width:20px;">#${idx + 1}</span>
        <img src="${resolveImage(p.images?.[0])}" style="width:48px;height:48px;object-fit:cover;border-radius:10px;">
        <div class="flex-grow-1">
          <div class="fw-semibold" style="font-size:0.9rem;">${p.name}</div>
          <small class="text-muted">${p.soldCount} sold · ${formatCurrency(p.price)}</small>
        </div>
      </div>`
        )
        .join('')
    : `<p class="text-muted text-center py-3">No sales data yet</p>`;
}

function renderRecentOrders(orders) {
  document.getElementById('recentOrdersList').innerHTML = orders.length
    ? orders
        .map(
          (o) => `
      <div class="d-flex justify-content-between align-items-center mb-3 pb-3" style="border-bottom:1px solid var(--border);">
        <div>
          <div class="fw-semibold" style="font-size:0.9rem;">${o.orderNumber}</div>
          <small class="text-muted">${o.user?.name || 'Guest'} · ${formatDate(o.createdAt)}</small>
        </div>
        <div class="text-end">
          <div class="fw-bold" style="font-size:0.9rem;">${formatCurrency(o.totalPrice)}</div>
          <span class="status-pill status-${o.status}" style="font-size:0.68rem;">${o.status.replace(/_/g, ' ')}</span>
        </div>
      </div>`
        )
        .join('')
    : `<p class="text-muted text-center py-3">No orders yet</p>`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (Auth.requireAdmin()) {
    renderAdminLayout('dashboard');
    loadDashboard();
  }
  hidePageLoader();
});
