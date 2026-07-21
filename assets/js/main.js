/**
 * script.js
 * -----------------------------------------------------------------------
 * Kept intentionally modular: each feature is a small, self-contained
 * function that does one job and is called once from init(). This makes
 * it easy to lift any single module into a future page without dragging
 * the rest along.
 * -----------------------------------------------------------------------
 */

/* ============================================================
   MODULE 1: Mobile nav toggle
   ============================================================ */
function initNavToggle() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.classList.toggle('is-active', isOpen);
  });

  // Close menu when a link is tapped (mobile UX nicety)
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.classList.remove('is-active');
    });
  });
}

/* ============================================================
   MODULE 2: Entrance animation
   Reveals [data-animate] / [data-animate-child] elements by
   toggling .is-visible - CSS owns the actual transition timing.
   ============================================================ */
function initEntranceAnimation() {
  const panel = document.getElementById('hero-panel');
  const statCard = document.querySelector('.stat-card');
  if (!panel) return;

  // requestAnimationFrame ensures the browser paints the initial
  // (hidden) state first, so the transition actually fires.
  requestAnimationFrame(() => {
    panel.classList.add('is-visible');
    if (statCard) statCard.classList.add('is-visible');
  });
}

/* ============================================================
   MODULE 3: Subtle mouse-parallax on the code panel
   Purely decorative - degrades silently on touch devices.
   ============================================================ */
function initPanelParallax() {
  const blobs = document.querySelectorAll('.visual-blob');
  const panel = document.getElementById('hero-panel');
  if (!blobs.length || !panel || window.matchMedia('(pointer: coarse)').matches) return;

  const MAX_SHIFT = 14; // px - kept subtle on purpose

  panel.addEventListener('mousemove', (event) => {
    const rect = panel.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width - 0.5;   // -0.5 to 0.5
    const yRatio = (event.clientY - rect.top) / rect.height - 0.5;

    blobs.forEach((blob, i) => {
      const factor = (i + 1) * 0.6;
      blob.style.transform = `translate(${xRatio * MAX_SHIFT * factor}px, ${yRatio * MAX_SHIFT * factor}px)`;
    });
  });

  panel.addEventListener('mouseleave', () => {
    blobs.forEach((blob) => { blob.style.transform = 'translate(0, 0)'; });
  });
}

/* ============================================================
   MODULE 4: Scroll reveal
   Adds a light editorial rhythm to sections as they enter view.
   ============================================================ */
function initSectionReveal() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll([
    '.about-section',
    '.page-hero',
    '.page-section',
    '.page-card',
    '.detail-panel',
    '.page-cta',
    '.services-section',
    '.skills-section',
    '.work-section',
    '.proof-section',
    '.faq-section',
    '.articles-section',
    '.contact-section',
    '.site-footer',
    '.service-item',
    '.skills-grid article',
    '.case-study-card',
    '.project-list article',
    '.quote-stack blockquote',
    '.impact-strip div',
    '.article-list article',
    '.business-card-showcase',
    '.contact-methods a'
  ].join(','));

  if (!revealItems.length) return;

  revealItems.forEach((item, index) => {
    item.classList.add('reveal');
    item.style.setProperty('--reveal-index', String(index % 4));
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.12
  });

  revealItems.forEach((item) => observer.observe(item));
}

/* ============================================================
   MODULE 5: Active nav + sticky header state
   Keeps navigation honest as the reader moves down the page.
   ============================================================ */
function initScrollNavigation() {
  const links = Array.from(document.querySelectorAll('.main-nav a[href^="#"], .nav-cta[href^="#"]'));
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  let ticking = false;

  function setScrolledState() {
    document.body.classList.toggle('is-scrolled', window.scrollY > 24);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(setScrolledState);
  }, { passive: true });

  setScrolledState();

  if (!sections.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    links.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`);
    });
  }, {
    rootMargin: '-32% 0px -52% 0px',
    threshold: [0.05, 0.2, 0.45, 0.7]
  });

  sections.forEach((section) => observer.observe(section));
}

/* ============================================================
   MODULE 6: Metric counters
   Animates readable numbers once, while preserving prefixes/suffixes.
   ============================================================ */
function initMetricCounters() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const counters = Array.from(document.querySelectorAll('.stat-number, .about-metrics strong, .impact-strip strong'));
  if (!counters.length || reduceMotion) return;

  const parseMetric = (text) => {
    const trimmed = text.trim();
    if (trimmed.includes('-')) return null;

    const match = trimmed.match(/^([^0-9]*)(\d+)(.*)$/);
    if (!match) return null;

    return {
      prefix: match[1],
      value: Number(match[2]),
      suffix: match[3]
    };
  };

  const animateCounter = (element) => {
    const metric = parseMetric(element.dataset.finalValue || element.textContent);
    if (!metric || element.dataset.counted === 'true') return;

    element.dataset.counted = 'true';
    element.dataset.finalValue = `${metric.prefix}${metric.value}${metric.suffix}`;

    const duration = 950;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(metric.value * eased);

      element.textContent = `${metric.prefix}${current}${metric.suffix}`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        element.textContent = element.dataset.finalValue;
      }
    }

    element.textContent = `${metric.prefix}0${metric.suffix}`;
    requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: '0px 0px -12% 0px',
    threshold: 0.35
  });

  counters.forEach((counter) => observer.observe(counter));
}

/* ============================================================
   MODULE 7: FAQ behavior
   One open answer at a time keeps the section compact and intentional.
   ============================================================ */
function initFaqAccordion() {
  const details = Array.from(document.querySelectorAll('.faq-list details'));
  if (!details.length) return;

  details.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      details.forEach((sibling) => {
        if (sibling !== item) sibling.open = false;
      });
    });
  });
}

/* ============================================================
   MODULE 8: Pointer-responsive panels
   Feeds mouse position into CSS custom properties for restrained depth.
   ============================================================ */
function initPointerPanels() {
  const panels = document.querySelectorAll('.contact-panel-v2, .service-item');
  if (!panels.length || window.matchMedia('(pointer: coarse)').matches) return;

  panels.forEach((panel) => {
    panel.classList.add('has-pointer');

    panel.addEventListener('pointermove', (event) => {
      const rect = panel.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      panel.style.setProperty('--pointer-x', `${x}%`);
      panel.style.setProperty('--pointer-y', `${y}%`);
    });
  });
}

/* ============================================================
   MODULE 9: Installable app support
   Registers the service worker required for install prompts and
   offline fallback on browsers that support PWAs. Also handles
   the install prompt UI.
   ============================================================ */
function initInstallableApp() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;

  let deferredPrompt = null;
  const installButton = document.createElement('button');
  installButton.className = 'install-prompt-btn';
  installButton.textContent = 'Install App';
  installButton.style.cssText = 'position: fixed; bottom: 20px; right: 20px; padding: 12px 24px; background: #102817; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; z-index: 1000; display: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
  document.body.appendChild(installButton);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installButton.style.display = 'block';
  });

  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    installButton.style.display = 'none';
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installButton.style.display = 'none';
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

/* ============================================================
   MODULE 10: Browser chrome
   Turns the decorative frame into a small, usable browser simulator.
   ============================================================ */
function initBrowserChrome() {
  const shell = document.querySelector('.browser-shell');
  const tabsList = document.querySelector('[data-browser-tabs]');
  const newTabButton = document.querySelector('[data-new-tab]');
  const addressForm = document.querySelector('[data-address-form]');
  const addressInput = document.querySelector('[data-address-input]');
  const backButton = document.querySelector('[data-browser-back]');
  const forwardButton = document.querySelector('[data-browser-forward]');
  const refreshButton = document.querySelector('[data-browser-refresh]');
  const menuButton = document.querySelector('[data-browser-menu]');
  const windowButtons = document.querySelectorAll('[data-window-action]');

  if (!shell || !tabsList || !newTabButton || !addressForm || !addressInput) return;

  const ORIGINAL_TITLE = document.title;
  const initialTabLabel = tabsList.querySelector('.browser-tab span:first-child');
  const HOME_URL = addressInput.value.trim() || 'mugishamicheal.com';
  const HOME_TITLE = (initialTabLabel && initialTabLabel.textContent.trim()) || 'Mugisha Micheal - Portfolio';
  let nextTabId = 1;
  let activeTabId = 'home';

  const tabs = [{
    id: 'home',
    title: HOME_TITLE,
    url: HOME_URL,
    history: [HOME_URL],
    historyIndex: 0
  }];

  function getActiveTab() {
    return tabs.find((tab) => tab.id === activeTabId) || tabs[0];
  }

  function looksLikeUrl(value) {
    return /^https?:\/\//i.test(value) || (/^[^\s]+\.[^\s]+$/.test(value) && !value.startsWith('#'));
  }

  function normalizeDestination(rawValue) {
    const value = rawValue.trim();
    if (!value) return null;

    const lowerValue = value.toLowerCase();
    const homeAliases = ['home', '/', HOME_URL, `https://${HOME_URL}`, `http://${HOME_URL}`, 'portfolio'];

    if (lowerValue === 'new tab') {
      return {
        displayUrl: 'New Tab',
        title: 'New Tab',
        externalUrl: '',
        hash: ''
      };
    }

    if (homeAliases.includes(lowerValue)) {
      return {
        displayUrl: HOME_URL,
        title: HOME_TITLE,
        externalUrl: '',
        hash: ''
      };
    }

    if (value.startsWith('#')) {
      let section = null;

      try {
        section = document.querySelector(value);
      } catch (error) {
        section = null;
      }

      return {
        displayUrl: `${HOME_URL}${value}`,
        title: section ? `${section.id} - ${HOME_TITLE}` : HOME_TITLE,
        externalUrl: '',
        hash: section ? value : ''
      };
    }

    if (looksLikeUrl(value)) {
      const externalUrl = /^https?:\/\//i.test(value) ? value : `https://${value}`;
      let title = externalUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
      title = title || 'Website';

      return {
        displayUrl: externalUrl,
        title,
        externalUrl,
        hash: ''
      };
    }

    return {
      displayUrl: `Search: ${value}`,
      title: value.length > 24 ? `${value.slice(0, 24)}...` : value,
      externalUrl: `https://www.google.com/search?q=${encodeURIComponent(value)}`,
      hash: ''
    };
  }

  function renderTabs() {
    tabsList.innerHTML = '';

    tabs.forEach((tab) => {
      const tabButton = document.createElement('button');
      tabButton.type = 'button';
      tabButton.className = `browser-tab${tab.id === activeTabId ? ' is-active' : ''}`;
      tabButton.dataset.tabId = tab.id;
      tabButton.setAttribute('role', 'tab');
      tabButton.setAttribute('aria-selected', String(tab.id === activeTabId));

      const title = document.createElement('span');
      title.textContent = tab.title;

      const close = document.createElement('span');
      close.className = 'tab-close';
      close.setAttribute('aria-hidden', 'true');
      close.textContent = 'x';

      tabButton.append(title, close);
      tabsList.append(tabButton);
    });
  }

  function syncControls() {
    const activeTab = getActiveTab();
    if (!activeTab) return;

    addressInput.value = activeTab.url;
    document.title = activeTab.title === HOME_TITLE
      ? ORIGINAL_TITLE
      : `${activeTab.title} | Browser preview`;

    if (backButton) backButton.disabled = activeTab.historyIndex <= 0;
    if (forwardButton) forwardButton.disabled = activeTab.historyIndex >= activeTab.history.length - 1;

    renderTabs();
  }

  function openExternal(destination) {
    if (!destination.externalUrl) return;
    window.open(destination.externalUrl, '_blank', 'noopener');
  }

  function applyDestination(destination, options = {}) {
    const activeTab = getActiveTab();
    if (!activeTab || !destination) return;

    activeTab.title = destination.title;
    activeTab.url = destination.displayUrl;

    if (options.pushHistory !== false) {
      activeTab.history = activeTab.history.slice(0, activeTab.historyIndex + 1);
      activeTab.history.push(destination.displayUrl);
      activeTab.historyIndex = activeTab.history.length - 1;
    }

    if (destination.hash) {
      document.querySelector(destination.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    syncControls();
    openExternal(destination);
  }

  function createTab(rawValue = 'New Tab') {
    const id = `tab-${nextTabId}`;
    nextTabId += 1;

    tabs.push({
      id,
      title: 'New Tab',
      url: rawValue,
      history: [rawValue],
      historyIndex: 0
    });

    activeTabId = id;
    shell.classList.remove('is-minimized', 'is-closed');
    syncControls();
    addressInput.focus();
    addressInput.select();
  }

  function closeTab(tabId) {
    const index = tabs.findIndex((tab) => tab.id === tabId);
    if (index === -1) return;

    tabs.splice(index, 1);

    if (!tabs.length) {
      createTab();
      return;
    }

    if (activeTabId === tabId) {
      activeTabId = tabs[Math.max(0, index - 1)].id;
    }

    syncControls();
  }

  function revisitHistory(step) {
    const activeTab = getActiveTab();
    if (!activeTab) return;

    const nextIndex = activeTab.historyIndex + step;
    if (nextIndex < 0 || nextIndex >= activeTab.history.length) return;

    activeTab.historyIndex = nextIndex;
    const destination = normalizeDestination(activeTab.history[nextIndex]);
    if (!destination) return;

    activeTab.title = destination.title;
    activeTab.url = destination.displayUrl;

    if (destination.hash) {
      document.querySelector(destination.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    syncControls();
  }

  tabsList.addEventListener('click', (event) => {
    const tabButton = event.target.closest('.browser-tab');
    if (!tabButton) return;

    const tabId = tabButton.dataset.tabId;

    if (event.target.classList.contains('tab-close')) {
      closeTab(tabId);
      return;
    }

    activeTabId = tabId;
    syncControls();
  });

  newTabButton.addEventListener('click', () => createTab());

  addressForm.addEventListener('submit', (event) => {
    event.preventDefault();
    applyDestination(normalizeDestination(addressInput.value));
  });

  backButton?.addEventListener('click', () => revisitHistory(-1));
  forwardButton?.addEventListener('click', () => revisitHistory(1));

  refreshButton?.addEventListener('click', () => {
    const destination = normalizeDestination(getActiveTab()?.url || HOME_URL);
    if (!destination) return;

    if (destination.externalUrl) {
      openExternal(destination);
    } else {
      window.location.reload();
    }
  });

  menuButton?.addEventListener('click', () => createTab());

  windowButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.windowAction;

      if (action === 'close') {
        closeTab(activeTabId);
      }

      if (action === 'minimize') {
        shell.classList.toggle('is-minimized');
      }

      if (action === 'maximize') {
        shell.classList.toggle('is-maximized');
      }
    });
  });

  syncControls();
}

/* ============================================================
   INIT
   ============================================================ */
function init() {
  initBrowserChrome();
  initNavToggle();
  initInstallableApp();
  initEntranceAnimation();
  initPanelParallax();
  initSectionReveal();
  initScrollNavigation();
  initMetricCounters();
  initFaqAccordion();
  initPointerPanels();
}

document.addEventListener('DOMContentLoaded', init);
