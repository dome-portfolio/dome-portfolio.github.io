/* Apply the saved theme before the stylesheet is displayed. */
(() => {
  const root = document.documentElement;
  const storageKey = 'dome-portfolio-theme';
  let theme = 'dark';
  try {
    if (localStorage.getItem(storageKey) === 'light') theme = 'light';
  } catch {
    // The toggle still works if browser storage is unavailable.
  }
  root.dataset.theme = theme;

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    const browserColor = document.querySelector('meta[name="theme-color"]');
    const logo = document.querySelector('[data-light-logo]');
    const darkLogo = logo?.getAttribute('src');

    function applyTheme() {
      const light = theme === 'light';
      root.dataset.theme = theme;
      toggle.setAttribute('aria-pressed', String(light));
      toggle.title = light ? toggle.dataset.darkTitle : toggle.dataset.lightTitle;
      if (browserColor) browserColor.content = light ? '#f7f7f1' : '#0e0f12';
      if (logo) logo.src = light ? logo.dataset.lightLogo : darkLogo;
    }

    applyTheme();
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      applyTheme();
      try {
        localStorage.setItem(storageKey, theme);
      } catch {
        // The current page keeps the selection until it is closed.
      }
    });
  });
})();
