/* =========================================================
   Admin User Management Logic
   ========================================================= */

let adminUsersPage = 1;

async function loadAdminUsers() {
  const tbody = document.getElementById('adminUsersTableBody');
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4"><div class="loader-ring mx-auto" style="width:28px;height:28px;"></div></td></tr>`;

  const search = document.getElementById('adminUserSearch').value.trim();
  const params = new URLSearchParams({ page: adminUsersPage, limit: 10 });
  if (search) params.append('search', search);

  try {
    const { users, page, pages } = await Api.get(`/admin/users?${params.toString()}`);
    const currentAdminId = Auth.getUser()._id;

    tbody.innerHTML = users.length
      ? users
          .map(
            (u) => `
      <tr>
        <td class="fw-semibold">${u.name}</td>
        <td>${u.email}</td>
        <td><span class="badge text-uppercase" style="background:${u.role === 'admin' ? 'var(--indigo-soft)' : 'var(--accent-soft)'}; color:${u.role === 'admin' ? 'var(--indigo)' : 'var(--accent)'};">${u.role}</span></td>
        <td>${u.isActive ? '<span class="status-pill status-delivered">Active</span>' : '<span class="status-pill status-cancelled">Deactivated</span>'}</td>
        <td>${formatDate(u.createdAt)}</td>
        <td>
          ${
            u._id !== currentAdminId
              ? `
          <button class="btn btn-sm btn-outline-brand me-1" onclick="toggleUserActive('${u._id}', ${!u.isActive})">
            ${u.isActive ? '<i class="bi bi-slash-circle"></i> Deactivate' : '<i class="bi bi-check-circle"></i> Activate'}
          </button>
          <button class="btn btn-sm" style="border:1.5px solid var(--danger); color:var(--danger); border-radius:10px;" onclick="deleteUser('${u._id}')"><i class="bi bi-trash"></i></button>`
              : '<span class="text-muted small">You</span>'
          }
        </td>
      </tr>`
          )
          .join('')
      : `<tr><td colspan="6" class="text-center text-muted py-4">No users found</td></tr>`;

    renderAdminPagination('adminUsersPagination', page, pages, (p) => {
      adminUsersPage = p;
      loadAdminUsers();
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">${err.message}</td></tr>`;
  }
}

async function toggleUserActive(userId, isActive) {
  try {
    await Api.put(`/admin/users/${userId}`, { isActive });
    showToast(`User ${isActive ? 'activated' : 'deactivated'} successfully`, 'success');
    loadAdminUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
  try {
    await Api.delete(`/admin/users/${userId}`);
    showToast('User deleted successfully', 'success');
    loadAdminUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (Auth.requireAdmin()) {
    renderAdminLayout('users');
    loadAdminUsers();
  }
  hidePageLoader();
});
