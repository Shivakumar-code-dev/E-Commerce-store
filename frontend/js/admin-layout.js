/* =========================================================
   Admin Panel — Shared Sidebar Layout
   ========================================================= */

function renderAdminLayout(activePage) {
  const user = Auth.getUser();

  const topbar = `
  <nav class="navbar navbar-glass py-3">
    <div class="container-fluid px-4">
      <a class="navbar-brand brand-logo" href="../index.html">Nexora <span class="text-secondary" style="font-size:0.9rem; font-weight:500;">Admin</span></a>
      <div class="d-flex align-items-center gap-2">
        <button class="theme-toggle"><i class="bi bi-moon-stars-fill"></i></button>
        <a href="../index.html" class="btn btn-outline-brand btn-sm"><i class="bi bi-box-arrow-up-right me-1"></i>View Store</a>
        <div class="dropdown">
          <button class="icon-btn" data-bs-toggle="dropdown"><i class="bi bi-person"></i></button>
          <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2" style="border-radius:14px;">
            <li class="px-3 py-2"><small class="text-muted">Signed in as</small><br><strong>${user?.name || 'Admin'}</strong></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" onclick="Auth.logout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
          </ul>
        </div>
      </div>
    </div>
  </nav>`;

  const links = [
    { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2', href: 'dashboard.html' },
    { id: 'products', label: 'Products', icon: 'bi-box-seam', href: 'products.html' },
    { id: 'categories', label: 'Categories', icon: 'bi-grid', href: 'categories.html' },
    { id: 'orders', label: 'Orders', icon: 'bi-receipt', href: 'orders.html' },
    { id: 'users', label: 'Users', icon: 'bi-people', href: 'users.html' },
    { id: 'coupons', label: 'Coupons', icon: 'bi-tag', href: 'coupons.html' }
  ];

  const sidebar = `
  <div class="admin-sidebar">
    ${links
      .map(
        (link) => `
      <a href="${link.href}" class="admin-nav-link ${activePage === link.id ? 'active' : ''}">
        <i class="bi ${link.icon}"></i> ${link.label}
      </a>`
      )
      .join('')}
  </div>`;

  document.getElementById('admin-topbar-root').innerHTML = topbar;
  document.getElementById('admin-sidebar-root').innerHTML = sidebar;
  initThemeToggle();
}
