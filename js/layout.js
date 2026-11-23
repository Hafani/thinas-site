/* =========================================================================
   layout.js — builds the header and footer for EVERY page.
   -------------------------------------------------------------------------
   LESSON: Components without a framework
   Each HTML page only contains two empty placeholders:
       <div id="site-header"></div>
       <div id="site-footer"></div>
   This file fills them in. Add a page to NAV_LINKS below and it appears
   in the menu on every page at once — no copy-pasting.

   Trade-off to know about: because JavaScript draws the header, a visitor
   with JS switched off won't see it. For a small bakery site that's fine,
   and it's exactly the problem frameworks like React solve "properly".
   ========================================================================= */

import { SITE, whatsappLink } from './config.js';

// The menu items. `href` is the file each one points to.
const NAV_LINKS = [
  { label: 'Menu', href: 'menu.html' },
  { label: 'Custom cakes', href: 'custom-cake.html' },
  { label: 'Classes', href: 'classes.html' },
  { label: 'Gallery', href: 'gallery.html' },
  { label: 'About', href: 'about.html' },
];

/* Which page are we on? location.pathname is e.g. "/menu.html".
   We take the last part after "/" — or "index.html" if it's empty ("/"). */
function currentPage() {
  const file = window.location.pathname.split('/').pop();
  return file === '' ? 'index.html' : file;
}

/* Template literals (the `backtick strings`) let us write HTML with
   ${variables} slotted in. .map() turns each link object into an <a>,
   and .join('') glues them together into one string. */
function headerHTML() {
  const page = currentPage();

  const links = NAV_LINKS.map(
    (link) => `
      <a href="${link.href}" class="nav__link"
         ${link.href === page ? 'aria-current="page"' : ''}>
        ${link.label}
      </a>`
  ).join('');

  return `
    <header class="site-header">
      <div class="site-header__inner container">
        <a href="index.html" class="brand" aria-label="${SITE.name} — home">
          <img src="images/emblem.png" alt="" class="brand__emblem" width="44" height="46">
          <span class="brand__name">${SITE.name}</span>
        </a>

        <nav id="site-nav" class="nav" aria-label="Main">
          ${links}
          <a href="${whatsappLink()}" class="btn btn--small nav__cta"
             target="_blank" rel="noopener">WhatsApp Thina</a>
        </nav>

        <!-- Basket button: basket-ui.js fills in the count and opens the panel -->
        <button type="button" class="basket-btn" aria-label="Basket">
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d="M5 9h14l-1.4 9.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 9z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            <path d="M9 9V7a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <span class="basket-btn__count" data-basket-count hidden>0</span>
        </button>

        <!-- The hamburger button only shows on small screens (see CSS).
             aria-expanded tells screen readers whether the menu is open. -->
        <button class="nav-toggle" type="button"
                aria-expanded="false" aria-controls="site-nav">
          <span class="nav-toggle__bars" aria-hidden="true"></span>
          <span class="visually-hidden">Menu</span>
        </button>
      </div>
    </header>`;
}

function footerHTML() {
  const year = new Date().getFullYear(); // keeps the © year current automatically

  return `
    <footer class="site-footer">
      <div class="container site-footer__inner">
        <div class="site-footer__brand">
          <img src="images/emblem.png" alt="" width="64" height="67">
          <p class="site-footer__name">${SITE.name}</p>
          <p>Home bakery in ${SITE.location} since ${SITE.founded}.</p>
        </div>

        <div>
          <h2 class="site-footer__heading">Order</h2>
          <p><a href="${whatsappLink()}" target="_blank" rel="noopener">WhatsApp ${SITE.phoneDisplay}</a></p>
          <p>Please order at least ${SITE.noticeHours} hours ahead. Delivery or collection.</p>
        </div>

        <div>
          <h2 class="site-footer__heading">Follow</h2>
          <p><a href="${SITE.social.instagram}" target="_blank" rel="noopener">Instagram</a></p>
          <p><a href="${SITE.social.tiktok}" target="_blank" rel="noopener">TikTok</a></p>
        </div>
      </div>
      <p class="site-footer__legal container">© ${year} ${SITE.name}</p>
    </footer>`;
}

/* -------------------------------------------------------------------------
   Mobile menu behaviour.
   LESSON: Event listeners + toggling state with a class.
   CSS does the visuals (.nav--open slides the menu in); JS only flips
   the state. Keeping "what it looks like" (CSS) separate from
   "when it changes" (JS) is a habit worth building.
   ------------------------------------------------------------------------- */
function setupMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('nav--open', open);
    document.body.classList.toggle('no-scroll', open); // stop page scrolling behind the menu
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    setOpen(!isOpen);
  });

  // Close with the Escape key — expected by keyboard users.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });

  // Close if the screen gets wide enough for the desktop menu.
  // Must match the NAV BREAKPOINT in css/components.css
  window.matchMedia('(min-width: 1024px)').addEventListener('change', () => setOpen(false));
}

/* The one function other files call. */
export function renderLayout() {
  document.getElementById('site-header').innerHTML = headerHTML();
  document.getElementById('site-footer').innerHTML = footerHTML();
  setupMobileNav();
}
