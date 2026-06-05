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

// Copies phone number to clipboard and briefly shows a "Copied!" tooltip.
function copyPhone(event, number) {
  event.preventDefault();
  const el = event.currentTarget;

  const finish = () => {
    el.classList.add('copied');
    setTimeout(() => el.classList.remove('copied'), 2000);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(number).then(finish).catch(() => {
      // Clipboard failed — still open WhatsApp link
      window.open('https://wa.me/2349022921994', '_blank');
    });
  } else {
    // Fallback for non-secure contexts (e.g. file://) — open WhatsApp
    window.open('https://wa.me/2349022921994', '_blank');
  }
}

// ── SCROLL PROGRESS BAR ───────────────────────────────────
const progressBar = document.getElementById('scroll-progress');
if (progressBar) {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = total > 0 ? `${(scrolled / total) * 100}%` : '0%';
  }, { passive: true });
}

// ── SCROLL REVEAL (Intersection Observer) ────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      // Add staggered delay to child cards
      entry.target.querySelectorAll('.card').forEach((card, i) => {
        card.style.transitionDelay = `${i * 0.08}s`;
        card.classList.add('reveal', 'is-visible');
      });
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .cards-scroll, .section-head, .stats-grid, .process-grid').forEach((el) => {
  if (!el.classList.contains('reveal')) el.classList.add('reveal');
  revealObserver.observe(el);
});

// ── BUTTON RIPPLE ─────────────────────────────────────────
document.querySelectorAll('.btn').forEach((btn) => {
  btn.addEventListener('pointerdown', (e) => {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.8;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
});

// ── CARD MOUSE-TILT + SHINE ───────────────────────────────
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.card').forEach((card) => {
    const shine = card.querySelector('.card-shine');

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotX = ((y - cy) / cy) * -4;   // max 4deg
      const rotY = ((x - cx) / cx) * 4;
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px)`;
      if (shine) {
        shine.style.setProperty('--mx', `${(x / rect.width) * 100}%`);
        shine.style.setProperty('--my', `${(y / rect.height) * 100}%`);
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ── SMOOTH HASH SCROLL (override default jump) ────────────
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 76; // nav height
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ── HERO SCROLL HINT — hide after user scrolls ────────────
const scrollHint = document.querySelector('.scroll-hint');
if (scrollHint) {
  const hideHint = () => {
    if (window.scrollY > 80) {
      scrollHint.style.opacity = '0';
      scrollHint.style.pointerEvents = 'none';
      window.removeEventListener('scroll', hideHint);
    }
  };
  window.addEventListener('scroll', hideHint, { passive: true });
}

// ── LIGHTBOX — review image enlarger ─────────────────────
const lightbox    = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

function openLightbox(src, alt) {
  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = src;
  lightboxImg.alt = alt || 'Review screenshot';
  lightbox.classList.add('is-open');
  document.body.classList.add('modal-open');
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('is-open');
  document.body.classList.remove('modal-open');
  // Clear src after transition so there's no flash on re-open
  setTimeout(() => { if (lightboxImg) lightboxImg.src = ''; }, 400);
}

document.querySelectorAll('[data-lightbox]').forEach((img) => {
  img.addEventListener('click', () => openLightbox(img.src, img.alt));
  // Keyboard accessible
  img.setAttribute('tabindex', '0');
  img.setAttribute('role', 'button');
  img.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(img.src, img.alt);
    }
  });
});

// Close on backdrop click
if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}

// Close button inside lightbox
document.querySelectorAll('.lightbox-close').forEach((btn) => {
  btn.addEventListener('click', closeLightbox);
});

// Escape key already handled globally in closeActiveModal — extend it
const _origKeydown = document.onkeydown;
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});