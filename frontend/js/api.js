/* =========================================================
   API Client — wraps fetch() calls to the Express backend
   ========================================================= */

const API_BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://e-commerce-store-lte0.onrender.com/api';

const Api = {
  getToken() {
    return localStorage.getItem('token');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = { ...(options.headers || {}) };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    } catch (err) {
      throw new Error('Cannot reach the server. Please make sure the backend is running.');
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      data = { success: false, message: 'Unexpected server response' };
    }

    if (!response.ok) {
      if (response.status === 401) {
        // Token invalid/expired — clear session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },
  post(endpoint, body) {
    const isForm = body instanceof FormData;
    return this.request(endpoint, { method: 'POST', body: isForm ? body : JSON.stringify(body) });
  },
  put(endpoint, body) {
    const isForm = body instanceof FormData;
    return this.request(endpoint, { method: 'PUT', body: isForm ? body : JSON.stringify(body) });
  },
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

// Resolve relative image paths returned by the backend into full URLs
function resolveImage(path) {
  if (!path) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop';
  if (path.startsWith('http')) return path;
  const BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://e-commerce-store-lte0.onrender.com';

return `${BASE_URL}${path}`;
}

function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
