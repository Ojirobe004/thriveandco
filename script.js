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
    const recipient = form.dataset.recipient || 'thrivebyridwan@gmail.com'; // PLACEHOLDER: replace in HTML with the real inbox.
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

// ── PROCESS CHAIN — SVG path + scroll-driven animation ───
(function () {
  const grid = document.getElementById('process-grid');
  if (!grid) return;

  const steps = [
    document.getElementById('process-step-1'),
    document.getElementById('process-step-2'),
    document.getElementById('process-step-3'),
  ];
  if (steps.some(s => !s)) return;

  // ── 1. Inject SVG overlay ──────────────────────────────
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'process-svg';
  svg.setAttribute('aria-hidden', 'true');

  // Gradient definitions (light + dark mode)
  svg.innerHTML = `
    <defs>
      <linearGradient id="processGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="#6E2233" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#8D3A46" stop-opacity="0.4"/>
      </linearGradient>
      <linearGradient id="processGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="#c45a6e" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#e07a8c" stop-opacity="0.4"/>
      </linearGradient>
    </defs>
    <path id="process-path"/>
    <circle id="process-dot" r="5"/>
  `;
  grid.appendChild(svg);

  const path = document.getElementById('process-path');
  const dot  = document.getElementById('process-dot');

  // ── 2. Build path through step circle centres ──────────
  function getStepCentre(card) {
    const stepEl = card.querySelector('.step');
    const gridRect = grid.getBoundingClientRect();
    const rect = stepEl.getBoundingClientRect();
    return {
      x: rect.left - gridRect.left + rect.width  / 2,
      y: rect.top  - gridRect.top  + rect.height / 2,
    };
  }

  function buildPath() {
    const pts = steps.map(getStepCentre);
    // Smooth cubic bezier curve through all 3 points
    const cp1x = (pts[0].x + pts[1].x) / 2;
    const cp2x = (pts[1].x + pts[2].x) / 2;
    const d = [
      `M ${pts[0].x} ${pts[0].y}`,
      `C ${cp1x} ${pts[0].y}, ${cp1x} ${pts[1].y}, ${pts[1].x} ${pts[1].y}`,
      `C ${cp2x} ${pts[1].y}, ${cp2x} ${pts[2].y}, ${pts[2].x} ${pts[2].y}`,
    ].join(' ');
    path.setAttribute('d', d);

    // Re-measure total path length for dash animation
    const len = path.getTotalLength();
    path.style.strokeDasharray  = len;
    path.style.strokeDashoffset = len;
    return len;
  }

  let pathLen = buildPath();

  // Rebuild on resize (handles orientation changes)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { pathLen = buildPath(); }, 120);
  }, { passive: true });

  // ── 3. Scroll-driven progress ──────────────────────────
  function getScrollProgress() {
    const section = document.getElementById('process');
    if (!section) return 0;
    const rect  = section.getBoundingClientRect();
    const winH  = window.innerHeight;
    // Progress: 0 when section top hits bottom of viewport → 1 when section bottom hits top
    const start = winH;
    const end   = -rect.height;
    const raw   = (start - rect.top) / (start - end);
    return Math.min(1, Math.max(0, raw));
  }

  function updateChain() {
    const progress = getScrollProgress();
    if (progress <= 0) {
      path.style.strokeDashoffset = pathLen;
      dot.style.opacity = '0';
      steps.forEach(s => s.classList.remove('step-active'));
      return;
    }

    // Draw the path
    path.style.strokeDashoffset = pathLen * (1 - progress);

    // Move dot along path
    if (pathLen > 0) {
      const pt = path.getPointAtLength(Math.min(progress * pathLen, pathLen - 1));
      dot.setAttribute('cx', pt.x);
      dot.setAttribute('cy', pt.y);
      dot.style.opacity = progress > 0.05 && progress < 0.98 ? '1' : '0';
    }

    // Activate step circles as path reaches them
    const thresholds = [0.05, 0.45, 0.85];
    steps.forEach((step, i) => {
      step.classList.toggle('step-active', progress >= thresholds[i]);
    });
  }

  window.addEventListener('scroll', updateChain, { passive: true });
  updateChain(); // run once on load

  // ── 4. Number counter on step circles ─────────────────
  function animateCounter(el, target, duration) {
    const start = performance.now();
    const from  = 0;
    el.textContent = from;
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (target - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Trigger counters when section enters view
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      steps.forEach((card, i) => {
        const stepEl = card.querySelector('.step');
        const target = parseInt(stepEl.dataset.step, 10);
        // Stagger each counter
        setTimeout(() => animateCounter(stepEl, target, 600), i * 280);
      });
      counterObserver.disconnect();
    });
  }, { threshold: 0.3 });

  const section = document.getElementById('process');
  if (section) counterObserver.observe(section);
})();