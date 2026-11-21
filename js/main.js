/* =========================================================================
   main.js — the entry point every page loads.
   -------------------------------------------------------------------------
   Each HTML page has:  <script type="module" src="js/main.js"></script>
   type="module" is what allows `import` / `export` between files.
   Modules also run automatically AFTER the HTML has loaded (like `defer`),
   so the placeholders already exist when renderLayout() looks for them.
   ========================================================================= */

import { SITE, whatsappLink } from './config.js';
import { renderLayout } from './layout.js';
import { initBasketUI } from './basket-ui.js';

renderLayout();   // 1. header + footer (the basket button lives in the header)
initBasketUI();   // 2. then wire the basket button and panel to the basket data

/* Any link on a page marked  data-whatsapp="some message"  gets turned
   into a WhatsApp link with that message pre-typed. This means HTML pages
   never hard-code the phone number.  (LESSON: data-* attributes are a
   clean way to pass small bits of info from HTML to JS.) */
document.querySelectorAll('[data-whatsapp]').forEach((el) => {
  el.href = whatsappLink(el.dataset.whatsapp);
  el.target = '_blank';
  el.rel = 'noopener';
});

/* Fill any <span data-site="noticeHours"></span> with the value from config. */
document.querySelectorAll('[data-site]').forEach((el) => {
  el.textContent = SITE[el.dataset.site];
});
