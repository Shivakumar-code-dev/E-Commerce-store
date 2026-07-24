/* =========================================================
   Toast Notification System
   ========================================================= */

function ensureToastContainer() {
  let container = document.querySelector('.toast-container-custom');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container-custom';
    document.body.appendChild(container);
  }
  return container;
}

const TOAST_ICONS = {
  success: 'bi-check-circle-fill',
  error: 'bi-exclamation-circle-fill',
  info: 'bi-info-circle-fill',
  warning: 'bi-exclamation-triangle-fill'
};

const TOAST_COLORS = {
  success: 'var(--success)',
  error: 'var(--danger)',
  info: 'var(--indigo)',
  warning: 'var(--warning)'
};

function showToast(message, type = 'info', duration = 3800) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast-custom ${type}`;
  toast.innerHTML = `
    <i class="bi ${TOAST_ICONS[type] || TOAST_ICONS.info}" style="color:${TOAST_COLORS[type] || TOAST_COLORS.info}; font-size:1.2rem; margin-top:2px;"></i>
    <div class="flex-grow-1" style="font-size:0.9rem; line-height:1.4;">${message}</div>
    <button class="btn-close-toast" style="background:none;border:none;color:var(--text-muted);font-size:1.1rem;line-height:1;">&times;</button>
  `;

  container.appendChild(toast);

  const remove = () => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 280);
  };

  toast.querySelector('.btn-close-toast').addEventListener('click', remove);
  setTimeout(remove, duration);
}
