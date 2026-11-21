/* =========================================================================
   order-page.js — Order details page.
   -------------------------------------------------------------------------
   Two sources of data meet here:
     • the BASKET (from basket.js), which can change while you're on the page
       (e.g. you open the panel and press +)
     • the FORM (date, collection/delivery, note)
   Whenever either changes, we rebuild the summary and the live preview.
   ========================================================================= */

import { subscribe, getItems, totalPrice, clearBasket, DEPOSIT_RATE } from './basket.js';
import { openBasket } from './basket-ui.js';
import { formatPrice, describeOption } from './format.js';
import { setupWhatsAppForm, formatDate, isShortNotice, methodLine, joinLines } from './forms.js';

const form = document.getElementById('order-form');
const preview = document.getElementById('order-preview');
const summary = document.getElementById('order-summary');
const checkout = document.getElementById('order-checkout');
const empty = document.getElementById('order-empty');
const sent = document.getElementById('order-sent');

function itemDetails(item) {
  return [describeOption(item.option), item.flavour].filter(Boolean).join(', ');
}

/* ---------- The message (this page's "strategy" for forms.js) ---------- */
function buildMessage(data) {
  const items = getItems();
  const total = totalPrice(items);

  return joinLines([
    'Hi Thina! Order request 🧁',
    data.name && `Name: ${data.name}`,
    '\n',
    ...items.map((i) => `• ${i.qty} × ${i.name} (${itemDetails(i)}) – ${formatPrice(i.price * i.qty)}`),
    '\n',
    `Estimated total: ${formatPrice(total)}`,
    `${DEPOSIT_RATE * 100}% deposit: ${formatPrice(total * DEPOSIT_RATE)}`,
    '\n',
    data.date && `Needed on: ${formatDate(data.date)}${isShortNotice(data.date) ? ' (short notice, I know!)' : ''}`,
    methodLine(data),
    data.recommend && "I'd love your recommendations for anything else to add.",
    data.note && `Note: ${data.note}`,
  ]);
}

/* ---------- Order summary at the top ---------- */
function renderSummary(items) {
  const total = totalPrice(items);
  summary.innerHTML = `
    <ul class="summary" role="list">
      ${items.map((i) => `
        <li class="summary__line">
          <span><span class="summary__qty">${i.qty} ×</span> ${i.name}
            <span class="summary__details">${itemDetails(i)}</span></span>
          <span class="summary__price">${formatPrice(i.price * i.qty)}</span>
        </li>`).join('')}
    </ul>
    <dl class="totals">
      <div><dt>Estimated total</dt><dd>${formatPrice(total)}</dd></div>
      <div class="totals__deposit"><dt>Deposit to secure your order (${DEPOSIT_RATE * 100}%)</dt><dd>${formatPrice(total * DEPOSIT_RATE)}</dd></div>
    </dl>`;
}

/* ---------- Wire it up ---------- */
const engine = setupWhatsAppForm({
  form,
  preview,
  buildMessage,
  onSent: () => {
    sent.hidden = false;
  },
});

// Basket changes → update summary + preview (or show the empty state)
subscribe((items) => {
  const hasItems = items.length > 0;
  checkout.hidden = !hasItems;
  empty.hidden = hasItems;
  if (hasItems) {
    renderSummary(items);
    engine.refresh();
  }
});

document.querySelector('[data-open-basket]').addEventListener('click', openBasket);

document.getElementById('clear-basket').addEventListener('click', () => {
  clearBasket();
  form.reset();
  sent.hidden = true;
  empty.querySelector('p').textContent = 'Thanks for your order! Thina will reply on WhatsApp soon.';
});
