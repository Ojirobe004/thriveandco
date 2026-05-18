const body = document.body;
const menuButton = document.querySelector('[data-menu-button]');
const mobilePanel = document.querySelector('[data-mobile-panel]');

if (menuButton && mobilePanel) {
  menuButton.addEventListener('click', () => {
    const isOpen = mobilePanel.classList.toggle('is-open');
    body.classList.toggle('menu-open', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  mobilePanel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobilePanel.classList.remove('is-open');
      body.classList.remove('menu-open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
}

document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const themeButtons = document.querySelectorAll('[data-theme-toggle]');
const themeLabels = document.querySelectorAll('[data-theme-label]');
const savedTheme = localStorage.getItem('thrive-theme');
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('thrive-theme', theme);
  const nextLabel = theme === 'dark' ? 'Light' : 'Dark';
  themeLabels.forEach((label) => {
    label.textContent = label.textContent.includes('mode') ? `${nextLabel} mode` : nextLabel;
  });
  themeButtons.forEach((button) => {
    button.setAttribute('aria-label', `Switch to ${nextLabel.toLowerCase()} mode`);
  });
}

setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  });
});
