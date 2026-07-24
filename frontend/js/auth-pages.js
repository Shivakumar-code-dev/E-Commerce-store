/* =========================================================
   Auth Pages Logic — Login / Register / Forgot / Reset
   ========================================================= */

function togglePasswordVisibility(inputId, btnEl) {
  const input = document.getElementById(inputId);
  const icon = btnEl.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'bi bi-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'bi bi-eye';
  }
}

// -------------------- LOGIN --------------------
document.getElementById('loginForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="btn-spinner"></span> Signing in...`;

  try {
    const { token, user } = await Api.post('/auth/login', {
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value
    });
    Auth.login(token, user);
    showToast(`Welcome back, ${user.name}!`, 'success');
    setTimeout(() => {
      window.location.href = user.role === 'admin' ? 'admin/dashboard.html' : 'index.html';
    }, 700);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = original;
  }
});

// -------------------- REGISTER --------------------
document.getElementById('registerForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }

  const btn = document.getElementById('registerBtn');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="btn-spinner"></span> Creating account...`;

  try {
    const { token, user } = await Api.post('/auth/register', {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      password
    });
    Auth.login(token, user);
    showToast(`Welcome to Nexora, ${user.name}!`, 'success');
    setTimeout(() => (window.location.href = 'index.html'), 700);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = original;
  }
});

// -------------------- FORGOT PASSWORD --------------------
let resetToken = null;

document.getElementById('forgotForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const btn = document.getElementById('forgotBtn');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="btn-spinner"></span> Please wait...`;

  try {
    const res = await Api.post('/auth/forgot-password', {
      email: document.getElementById('forgotEmail').value.trim()
    });

    if (res.resetToken) {
      resetToken = res.resetToken;
      document.getElementById('forgotStep1').classList.add('d-none');
      document.getElementById('forgotStep2').classList.remove('d-none');
      document.getElementById('tokenDisplay').textContent = `Demo reset token: ${resetToken}`;
    } else {
      showToast(res.message, 'info');
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
});

document.getElementById('resetForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const btn = document.getElementById('resetBtn');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="btn-spinner"></span> Resetting...`;

  try {
    const { token } = await Api.put(`/auth/reset-password/${resetToken}`, {
      password: document.getElementById('newPassword').value
    });
    localStorage.setItem('token', token);
    showToast('Password reset successful! Redirecting...', 'success');
    setTimeout(async () => {
      const { user } = await Api.get('/auth/profile');
      localStorage.setItem('user', JSON.stringify(user));
      window.location.href = 'index.html';
    }, 900);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = original;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('');
});
