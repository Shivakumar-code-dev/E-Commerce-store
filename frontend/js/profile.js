/* =========================================================
   Profile Page Logic
   ========================================================= */

async function loadProfile() {
  try {
    const { user } = await Api.get('/auth/profile');
    localStorage.setItem('user', JSON.stringify(user));

    document.getElementById('avatarInitial').textContent = user.name.charAt(0).toUpperCase();
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileRole').textContent = user.role;

    document.getElementById('profileNameInput').value = user.name;
    document.getElementById('profileEmailInput').value = user.email;
    document.getElementById('profilePhoneInput').value = user.phone || '';

    renderAddresses(user.addresses || []);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderAddresses(addresses) {
  const list = document.getElementById('addressesList');
  if (!addresses.length) {
    list.innerHTML = `<p class="text-muted text-center py-3">No saved addresses yet.</p>`;
    return;
  }
  list.innerHTML = addresses
    .map(
      (addr) => `
    <div class="cart-item-row">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <strong>${addr.fullName}</strong> ${addr.isDefault ? '<span class="badge bg-accent-soft text-accent" style="background:var(--accent-soft); color:var(--accent);">Default</span>' : ''}<br>
          <small class="text-secondary">${addr.phone}</small><br>
          <small class="text-secondary">${addr.addressLine1}, ${addr.city}, ${addr.state} - ${addr.postalCode}</small>
        </div>
        <button class="btn btn-ghost text-danger" onclick="deleteAddress('${addr._id}')"><i class="bi bi-trash"></i></button>
      </div>
    </div>`
    )
    .join('');
}

document.getElementById('profileForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  try {
    const { user } = await Api.put('/auth/profile', {
      name: document.getElementById('profileNameInput').value.trim(),
      phone: document.getElementById('profilePhoneInput').value.trim()
    });
    localStorage.setItem('user', JSON.stringify({ ...Auth.getUser(), ...user }));
    showToast('Profile updated successfully', 'success');
    document.getElementById('profileName').textContent = user.name;
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.getElementById('addressForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  try {
    const { addresses } = await Api.post('/auth/address', {
      fullName: document.getElementById('addrFullName').value.trim(),
      phone: document.getElementById('addrPhone').value.trim(),
      addressLine1: document.getElementById('addrLine1').value.trim(),
      addressLine2: document.getElementById('addrLine2').value.trim(),
      city: document.getElementById('addrCity').value.trim(),
      state: document.getElementById('addrState').value.trim(),
      postalCode: document.getElementById('addrPostal').value.trim()
    });
    renderAddresses(addresses);
    this.reset();
    showToast('Address added successfully', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

async function deleteAddress(addressId) {
  try {
    const { addresses } = await Api.delete(`/auth/address/${addressId}`);
    renderAddresses(addresses);
    showToast('Address removed', 'info');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.getElementById('passwordForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  try {
    await Api.put('/auth/profile', { password: document.getElementById('newPasswordInput').value });
    showToast('Password updated successfully', 'success');
    this.reset();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('');
  renderFooter();
  if (Auth.requireAuth()) {
    loadProfile();
  }
  hidePageLoader();
});
