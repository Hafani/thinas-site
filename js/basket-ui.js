/* =========================================================================
   basket-ui.js — what people SEE of the basket: the header button with its
   count badge, and the slide-out panel. Runs on every page.
   -------------------------------------------------------------------------
   LESSON: <dialog>
   The browser's built-in dialog element gives us for free:
     • a dimmed ::backdrop behind it
     • focus kept inside while it's open (keyboard users can't Tab "behind" it)
     • Escape closes it
   We only style it to slide in from the right like a drawer.
   ========================================================================= */

import {
  subscribe, setQty, removeItem, countItems, totalPrice, DEPOSIT_RATE,
} from './basket.js';
import { formatPrice, describeOption } from './format.js';

let dialog;
let lastCount = null;

function drawerHTML() {
  return `
    <dialog class="drawer" aria-labelledby="basket-title">
      <div class="drawer__inner">
        <header class="drawer__head">
          <h2 id="basket-title" class="drawer__title">Your basket</h2>
          <button type="button" class="icon-btn" data-action="close" aria-label="Close basket">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </header>
        <div class="drawer__body" data-basket-body></div>
        <footer class="drawer__foot" data-basket-foot></footer>
      </div>
    </dialog>`;
}

/* One <li> per basket line. Notice data-action and data-key:
   ONE click listener on the dialog reads these to know what to do.
   (LESSON: event delegation — see setupEvents below.) */
function lineHTML(item) {
  const details = [describeOption(item.option), item.flavour].filter(Boolean).join(', ');
  return `
    <li class="line">
      <div class="line__info">
        <p class="line__name">${item.name}</p>
        <p class="line__details">${details}</p>
      </div>
      <div class="stepper" role="group" aria-label="Quantity of ${item.name}">
        <button type="button" data-action="dec" data-key="${item.key}" aria-label="One less">−</button>
        <span aria-live="polite">${item.qty}</span>
        <button type="button" data-action="inc" data-key="${item.key}" aria-label="One more">+</button>
      </div>
      <p class="line__price">${formatPrice(item.price * item.qty)}</p>
      <button type="button" class="line__remove" data-action="remove" data-key="${item.key}">Remove</button>
    </li>`;
}

/* Called every time the basket changes (we subscribed to the store). */
function render(items) {
  const body = dialog.querySelector('[data-basket-body]');
  const foot = dialog.querySelector('[data-basket-foot]');

  // ---- Empty state: tell people what to do next, not just "empty" ----
  if (items.length === 0) {
    body.innerHTML = `
      <div class="drawer__empty">
        <p>Nothing in your basket yet.</p>
        <a href="menu.html" class="btn btn--ghost">Browse the menu</a>
      </div>`;
    foot.innerHTML = '';
  } else {
    body.innerHTML = `<ul class="lines" role="list">${items.map(lineHTML).join('')}</ul>`;
    const total = totalPrice(items);
    foot.innerHTML = `
      <dl class="totals">
        <div><dt>Estimated total</dt><dd>${formatPrice(total)}</dd></div>
        <div class="totals__deposit"><dt>Deposit to secure your order (${DEPOSIT_RATE * 100}%)</dt><dd>${formatPrice(total * DEPOSIT_RATE)}</dd></div>
      </dl>
      <p class="drawer__note">Delivery fees and final prices are confirmed by Thina on WhatsApp.</p>
      <a href="order.html" class="btn drawer__cta">Continue to order details</a>`;
  }

  updateBadge(items);
}

function updateBadge(items) {
  const count = countItems(items);
  document.querySelectorAll('[data-basket-count]').forEach((badge) => {
    badge.textContent = count;
    badge.hidden = count === 0;
    // Little "pop" when something is added — motion that answers an action.
    if (lastCount !== null && count > lastCount) {
      badge.classList.remove('pop');
      void badge.offsetWidth; // forces the browser to restart the animation
      badge.classList.add('pop');
    }
  });
  document.querySelectorAll('.basket-btn').forEach((btn) => {
    btn.setAttribute('aria-label', `Basket, ${count} item${count === 1 ? '' : 's'}`);
  });
  lastCount = count;
}

export function openBasket() {
  dialog.showModal();
  document.body.classList.add('no-scroll');
}

function setupEvents() {
  /* Event delegation: instead of a listener on every +, − and Remove button
     (which get destroyed and rebuilt on each render), ONE listener on the
     dialog catches all clicks and checks data-action. */
  dialog.addEventListener('click', (event) => {
    // Clicking the dim backdrop: the click target is the <dialog> itself.
    if (event.target === dialog) return dialog.close();

    const button = event.target.closest('[data-action]');
    if (!button) return;

    const { action, key } = button.dataset;
    const current = Number(button.parentElement.querySelector('span')?.textContent);

    if (action === 'close') dialog.close();
    if (action === 'inc') setQty(key, current + 1);
    if (action === 'dec') setQty(key, current - 1);
    if (action === 'remove') removeItem(key);
  });

  dialog.addEventListener('close', () => document.body.classList.remove('no-scroll'));

  document.querySelectorAll('.basket-btn').forEach((btn) => btn.addEventListener('click', openBasket));
}

export function initBasketUI() {
  document.body.insertAdjacentHTML('beforeend', drawerHTML());
  dialog = document.querySelector('.drawer');
  setupEvents();
  subscribe(render); // render now, and again on every change
}
