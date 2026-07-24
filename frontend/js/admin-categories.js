/* =========================================================
   Admin Category Management Logic
   ========================================================= */

async function loadAdminCategories() {
  const grid = document.getElementById('categoriesAdminGrid');
  grid.innerHTML = Array(4).fill('<div class="col-md-3"><div class="skeleton" style="height:180px; border-radius:16px;"></div></div>').join('');

  try {
    const { categories } = await Api.get('/categories');
    grid.innerHTML = categories.length
      ? categories
          .map(
            (cat) => `
      <div class="col-lg-3 col-md-4 col-6">
        <div class="card-solid rounded-xl p-3 text-center h-100">
          <div class="category-icon mx-auto"><i class="bi ${cat.icon || 'bi-grid'}"></i></div>
          <h6 class="fw-bold mb-1">${cat.name}</h6>
          <small class="text-muted d-block mb-2">${cat.productCount} products</small>
          <p class="text-secondary" style="font-size:0.8rem; min-height:2.4em;">${cat.description || ''}</p>
          <div class="d-flex gap-2 justify-content-center mt-2">
            <button class="btn btn-sm btn-outline-brand" onclick="editCategory('${cat._id}')"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm" style="border:1.5px solid var(--danger); color:var(--danger); border-radius:10px;" onclick="deleteCategory('${cat._id}')"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>`
          )
          .join('')
      : `<div class="col-12 empty-state"><i class="bi bi-grid"></i><p class="text-muted">No categories yet</p></div>`;
  } catch (err) {
    grid.innerHTML = `<div class="col-12 text-center text-danger py-4">${err.message}</div>`;
  }
}

function openCategoryModal() {
  document.getElementById('categoryForm').reset();
  document.getElementById('categoryId').value = '';
  document.getElementById('categoryModalTitle').textContent = 'Add Category';
}

async function editCategory(categoryId) {
  try {
    const { category } = await Api.get(`/categories/${categoryId}`);
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
    document.getElementById('categoryId').value = category._id;
    document.getElementById('catName').value = category.name;
    document.getElementById('catDescription').value = category.description || '';
    document.getElementById('catIcon').value = category.icon || '';
    new bootstrap.Modal(document.getElementById('categoryModal')).show();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function saveCategory() {
  const categoryId = document.getElementById('categoryId').value;
  const btn = document.getElementById('saveCategoryBtn');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="btn-spinner"></span> Saving...`;

  const formData = new FormData();
  formData.append('name', document.getElementById('catName').value.trim());
  formData.append('description', document.getElementById('catDescription').value.trim());
  formData.append('icon', document.getElementById('catIcon').value.trim() || 'bi-grid');
  const imageFile = document.getElementById('catImage').files[0];
  if (imageFile) formData.append('image', imageFile);

  try {
    if (categoryId) {
      await Api.put(`/categories/${categoryId}`, formData);
      showToast('Category updated successfully', 'success');
    } else {
      await Api.post('/categories', formData);
      showToast('Category created successfully', 'success');
    }
    bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
    loadAdminCategories();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

async function deleteCategory(categoryId) {
  if (!confirm('Delete this category? Products must be reassigned first.')) return;
  try {
    await Api.delete(`/categories/${categoryId}`);
    showToast('Category deleted successfully', 'success');
    loadAdminCategories();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (Auth.requireAdmin()) {
    renderAdminLayout('categories');
    loadAdminCategories();
  }
  hidePageLoader();
});
