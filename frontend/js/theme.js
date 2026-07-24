/* =========================================================
   Dark / Light Mode Toggle
   ========================================================= */

(function () {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

function initThemeToggle() {
  const toggleBtns = document.querySelectorAll('.theme-toggle');
  const updateIcons = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    toggleBtns.forEach((btn) => {
      const icon = btn.querySelector('i');
      if (icon) icon.className = current === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    });
  };

  updateIcons();

  toggleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      updateIcons();
    });
  });
}

document.addEventListener('DOMContentLoaded', initThemeToggle);
