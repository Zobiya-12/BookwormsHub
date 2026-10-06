/* ==========================================================================
   BookWorm's Hub - Theme Controller
   Handles light/dark mode toggling, icon state, and localStorage persistence.
   ========================================================================== */

(function () {
  const THEME_KEY = 'bw_theme';

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
    updateToggleIcons(isDark);
  }

  function updateToggleIcons(isDark) {
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn, #themeToggleBtn');
    toggleBtns.forEach(btn => {
      btn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
      const iconSpan = btn.querySelector('.theme-icon');
      if (iconSpan) {
        iconSpan.textContent = isDark ? '☀️' : '🌙';
      } else {
        btn.textContent = isDark ? '☀️' : '🌙';
      }
    });
  }

  window.toggleTheme = function () {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  };

  document.addEventListener('DOMContentLoaded', () => {
    const initialTheme = getPreferredTheme();
    applyTheme(initialTheme);

    // Dynamic insertion of toggle button into nav if not explicitly present in HTML
    const navRight = document.querySelector('.nav-right');
    if (navRight && !document.getElementById('themeToggleBtn')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.id = 'themeToggleBtn';
      toggleBtn.className = 'nav-icon-btn theme-toggle-btn';
      toggleBtn.type = 'button';
      toggleBtn.innerHTML = '<span class="theme-icon">' + (initialTheme === 'dark' ? '☀️' : '🌙') + '</span>';
      navRight.insertBefore(toggleBtn, navRight.firstChild);
    }

    // Attach click listeners to all theme toggle buttons
    document.querySelectorAll('.theme-toggle-btn, #themeToggleBtn').forEach(btn => {
      btn.addEventListener('click', window.toggleTheme);
    });
  });
})();