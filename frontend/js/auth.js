/* =========================================================
   Auth State Helper
   ========================================================= */

const Auth = {
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  },
  isLoggedIn() {
    return !!Api.getToken();
  },
  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },
  login(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cartCount');
    window.location.href = 'index.html';
  },
  requireAuth() {
    if (!this.isLoggedIn()) {
      showToast('Please log in to continue', 'warning');
      setTimeout(() => (window.location.href = 'login.html'), 900);
      return false;
    }
    return true;
  },
  requireAdmin() {
    if (!this.isLoggedIn() || !this.isAdmin()) {
      showToast('Admin access required', 'error');
      setTimeout(() => (window.location.href = 'index.html'), 900);
      return false;
    }
    return true;
  }
};
