/* =========================================================
   Admin Product Management Logic
   ========================================================= */

let adminProductsPage = 1;
let adminCategoriesCache = [];

async function loadCategoriesForAdmin() {
  const { categories } = await Api.get('/categories');
  adminCategoriesCache = categories;

  const filterSelect = document.getElementById('adminCategoryFilter');
  const formSelect = document.getElementById('pCategory');

  filterSelect.innerHTML = `<option value="">All Categories</option>` + categories.map((c) => `<option value="${c._id}">${c.name}</option>`).join('');
  formSelect.innerHTML = categories.map((c) => `<option value="${c._id}">${c.name}</option>`).join('');
}

async function loadAdminProducts() {
  const tbody = document.getElementById('adminProductsTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4"><div class="loader-ring mx-auto" style="width:28px;height:28px;"></div></td></tr>`;

  const keyword = document.getElementById('adminProductSearch').value.trim();
  const category = document.getElementById('adminCategoryFilter').value;

  const params = new URLSearchParams({ page: adminProductsPage, limit: 10 });
  if (keyword) params.append('keyword', keyword);
  if (category) params.append('category', category);

  try {
    const { products, page, pages } = await Api.get(`/products?${params.toString()}`);

    tbody.innerHTML = products.length
      ? products
          .map(
            (p) => `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-2">
            <img src="${resolveImage(p.images?.[0])}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;">
            <span class="text-truncate d-inline-block" style="max-width:180px;">${p.name}</span>
          </div>
        </td>
        <td>${p.category?.name || '—'}</td>
        <td>${formatCurrency(p.discountPrice > 0 ? p.discountPrice : p.price)}</td>
        <td>${p.stock === 0 ? '<span class="text-danger fw-bold">0</span>' : p.stock <= 5 ? `<span class="text-warning fw-bold">${p.stock}</span>` : p.stock}</td>
        <td><span class="rating-stars">${starRatingHtml(p.rating)}</span></td>
        <td>${p.isActive ? '<span class="status-pill status-delivered">Active</span>' : '<span class="status-pill status-cancelled">Inactive</span>'}</td>
        <td>
          <button class="btn btn-sm btn-outline-brand me-1" onclick="editProduct('${p._id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm" style="border:1.5px solid var(--danger); color:var(--danger); border-radius:10px;" onclick="deleteProduct('${p._id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`
          )
          .join('')
      : `<tr><td colspan="7" class="text-center text-muted py-4">No products found</td></tr>`;

    renderAdminPagination('adminProductsPagination', page, pages, (p) => {
      adminProductsPage = p;
      loadAdminProducts();
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${err.message}</td></tr>`;
  }
}

function renderAdminPagination(containerId, current, totalPages, onPage) {
  const nav = document.getElementById(containerId);
  if (!nav || totalPages <= 1) {
    if (nav) nav.innerHTML = '';
    return;
  }
  let items = '';
  for (let i = 1; i <= totalPages; i++) {
    items += `<li class="page-item ${i === current ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
  }
  nav.innerHTML = `<ul class="pagination justify-content-center">${items}</ul>`;
  nav.querySelectorAll('a.page-link').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      onPage(parseInt(a.dataset.page));
    });
  });
}

function openProductModal() {
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('productModalTitle').textContent = 'Add Product';
}

async function editProduct(productId) {
  try {
    const { product } = await Api.get(`/products/${productId}`);
    document.getElementById('productModalTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = product._id;
    document.getElementById('pName').value = product.name;
    document.getElementById('pBrand').value = product.brand;
    document.getElementById('pDescription').value = product.description;
    document.getElementById('pCategory').value = product.category._id;
    document.getElementById('pPrice').value = product.price;
    document.getElementById('pDiscountPrice').value = product.discountPrice || '';
    document.getElementById('pStock').value = product.stock;
    document.getElementById('pSku').value = product.sku || '';
    document.getElementById('pFeatured').checked = product.isFeatured;

    new bootstrap.Modal(document.getElementById('productModal')).show();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function saveProduct() {
  const productId = document.getElementById('productId').value;
  const btn = document.getElementById('saveProductBtn');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="btn-spinner"></span> Saving...`;

  const formData = new FormData();
  formData.append('name', document.getElementById('pName').value.trim());
  formData.append('brand', document.getElementById('pBrand').value.trim() || 'Generic');
  formData.append('description', document.getElementById('pDescription').value.trim());
  formData.append('shortDescription', document.getElementById('pDescription').value.trim().substring(0, 90));
  formData.append('category', document.getElementById('pCategory').value);
  formData.append('price', document.getElementById('pPrice').value);
  formData.append('discountPrice', document.getElementById('pDiscountPrice').value || 0);
  formData.append('stock', document.getElementById('pStock').value);
  formData.append('sku', document.getElementById('pSku').value.trim());
  formData.append('isFeatured', document.getElementById('pFeatured').checked);

  const files = document.getElementById('pImages').files;
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }

  try {
    if (productId) {
      await Api.put(`/products/${productId}`, formData);
      showToast('Product updated successfully', 'success');
    } else {
      if (files.length === 0) {
        showToast('Please upload at least one product image', 'warning');
        btn.disabled = false;
        btn.innerHTML = original;
        return;
      }
      await Api.post('/products', formData);
      showToast('Product created successfully', 'success');
    }
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
    loadAdminProducts();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
  try {
    await Api.delete(`/products/${productId}`);
    showToast('Product deleted successfully', 'success');
    loadAdminProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (Auth.requireAdmin()) {
    renderAdminLayout('products');
    await loadCategoriesForAdmin();
    loadAdminProducts();
  }
  hidePageLoader();
});
