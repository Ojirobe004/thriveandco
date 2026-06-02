// Shared interactive behavior for Thrive & Co. static pages.
const body = document.body;
const nav = document.querySelector('[data-nav]');
const menuButton = document.querySelector('[data-menu-button]');
const drawer = document.querySelector('[data-mobile-drawer]');
const drawerOverlay = document.querySelector('[data-drawer-overlay]');
const drawerClose = document.querySelector('[data-drawer-close]');
const themeButtons = document.querySelectorAll('[data-theme-toggle]');
const themeLabels = document.querySelectorAll('[data-theme-label]');
let lastScrollY = window.scrollY;
let touchStartX = 0;
let touchStartY = 0;

// Opens the mobile side drawer from the right edge.
function openDrawer() {
  if (!drawer || !drawerOverlay || !menuButton) return;
  drawer.classList.add('is-open');
  drawerOverlay.classList.add('is-open');
  body.classList.add('menu-open');
  drawer.setAttribute('aria-hidden', 'false');
  menuButton.setAttribute('aria-expanded', 'true');
}

// Closes the mobile drawer from close button, outside tap, link click, Escape, or swipe.
function closeDrawer() {
  if (!drawer || !drawerOverlay || !menuButton) return;
  drawer.classList.remove('is-open');
  drawerOverlay.classList.remove('is-open');
  body.classList.remove('menu-open');
  drawer.setAttribute('aria-hidden', 'true');
  menuButton.setAttribute('aria-expanded', 'false');
}

if (menuButton) menuButton.addEventListener('click', openDrawer);
if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

if (drawer) {
  // Any drawer navigation link should close the menu after selection.
  drawer.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeDrawer));

  // Swipe-right gesture closes the drawer on touch devices.
  drawer.addEventListener('touchstart', (event) => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  drawer.addEventListener('touchmove', (event) => {
    const deltaX = event.touches[0].clientX - touchStartX;
    const deltaY = Math.abs(event.touches[0].clientY - touchStartY);
    if (deltaX > 60 && deltaY < 42) closeDrawer();
  }, { passive: true });
}

// Saves and applies the light/dark theme across both pages.
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

const savedTheme = localStorage.getItem('thrive-theme');
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

themeButtons.forEach((button) => {
  // All theme buttons stay synced, including the fixed mobile FAB.
  button.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  });
});

// Keeps copyright current without manual edits.
document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = new Date().getFullYear();
});

// Transparent header becomes solid after scrolling, hides on scroll-down, returns on scroll-up.
function updateNavOnScroll() {
  if (!nav || body.classList.contains('menu-open')) return;
  const currentY = window.scrollY;
  nav.classList.toggle('nav-solid', currentY > 18);
  if (currentY > lastScrollY && currentY > 130) {
    nav.classList.add('nav-hidden');
  } else {
    nav.classList.remove('nav-hidden');
  }
  lastScrollY = Math.max(currentY, 0);
}

window.addEventListener('scroll', updateNavOnScroll, { passive: true });
updateNavOnScroll();

// Closes any open case-study modal.
function closeActiveModal() {
  document.querySelectorAll('.modal.is-open').forEach((modal) => modal.classList.remove('is-open'));
  body.classList.remove('modal-open');
}

// Opens case-study modals from cards or "View Full Case Study" links.
document.querySelectorAll('[data-modal-open]').forEach((trigger) => {
  const open = (event) => {
    if (event) event.preventDefault();
    const modal = document.getElementById(trigger.dataset.modalOpen);
    if (!modal) return;
    modal.classList.add('is-open');
    body.classList.add('modal-open');
    const closeButton = modal.querySelector('[data-modal-close]');
    if (closeButton) closeButton.focus({ preventScroll: true });
  };

  trigger.addEventListener('click', open);
  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open(event);
    }
  });
});

document.querySelectorAll('[data-modal-close]').forEach((button) => {
  // Modal close button.
  button.addEventListener('click', closeActiveModal);
});

document.querySelectorAll('.modal').forEach((modal) => {
  // Clicking outside modal content closes the modal.
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeActiveModal();
  });
});

document.addEventListener('keydown', (event) => {
  // Escape is a universal close action for drawer and modals.
  if (event.key === 'Escape') {
    closeDrawer();
    closeActiveModal();
  }
});

// Adds a tactile pressed state for cards on touch devices.
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointerdown', () => card.classList.add('is-tapped'));
  card.addEventListener('pointerup', () => card.classList.remove('is-tapped'));
  card.addEventListener('pointercancel', () => card.classList.remove('is-tapped'));
  card.addEventListener('pointerleave', () => card.classList.remove('is-tapped'));
});

// Mailto form: packages user fields into an email draft, no backend required.
document.querySelectorAll('[data-mailto-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const recipient = form.dataset.recipient || 'hello@thriveandco.com'; // PLACEHOLDER: replace in HTML with the real inbox.
    const subject = formData.get('subject') || 'Thrive & Co. inquiry';
    const bodyLines = [
      `Name: ${formData.get('name') || ''}`,
      `Email: ${formData.get('email') || ''}`,
      '',
      'Message:',
      formData.get('message') || ''
    ];
    const mailto = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    window.location.href = mailto;
  });
});