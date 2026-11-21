/* =========================================================================
   classes-page.js — Class booking request.
   Class names and prices come from "classes" in data/menu.json.
   ========================================================================= */

import { loadMenu } from './menu-data.js';
import { formatPrice } from './format.js';
import { whatsappLink } from './config.js';
import { setupWhatsAppForm, formatDate, isShortNotice, joinLines } from './forms.js';

const form = document.getElementById('class-form');
const choices = document.getElementById('class-choices');
let classesById = {};

function buildMessage(d) {
  const chosen = classesById[d.class];
  return joinLines([
    'Hi Thina! Class booking request 👩🏽‍🍳',
    d.name && `Name: ${d.name}`,
    '\n',
    chosen && `Class: ${chosen.name} (${formatPrice(chosen.price)} per person)`,
    d.people && `People: ${d.people}`,
    // Prices are per person, so the total is price × people
    chosen && d.people > 0 && `Estimated total: ${formatPrice(chosen.price * Number(d.people))}`,
    d.date && `Preferred date: ${formatDate(d.date)}${isShortNotice(d.date) ? ' (short notice, I know!)' : ''}`,
    d.note && `Note: ${d.note}`,
  ]);
}

function classChoiceHTML(c) {
  return `
    <label class="choice">
      <input type="radio" name="class" value="${c.id}" required data-label="A class">
      <span class="choice__card choice__card--row">
        <span class="choice__title">${c.name}</span>
        <span class="choice__price">${formatPrice(c.price)}<span class="choice__per"> per person</span></span>
      </span>
    </label>`;
}

async function init() {
  // 1. Build the class options first, so the form engine sees them
  try {
    const { classes } = await loadMenu();
    classesById = Object.fromEntries(classes.map((c) => [c.id, c]));
    choices.querySelector('.menu-status').remove();
    choices.insertAdjacentHTML('beforeend', classes.map(classChoiceHTML).join(''));
  } catch (error) {
    console.error(error);
    choices.querySelector('.menu-status').innerHTML =
      `The classes didn't load. Refresh the page, or <a href="${whatsappLink('Hi Thina, which baking classes do you offer?')}" target="_blank" rel="noopener">ask Thina on WhatsApp</a>.`;
  }

  // 2. Then start the form engine
  setupWhatsAppForm({
    form,
    preview: document.getElementById('class-preview'),
    buildMessage,
    onSent: () => {
      document.getElementById('class-sent').hidden = false;
    },
  });

  // 3. Coming from a "Book" link like classes.html#cupcakes? Pre-select it.
  const fromHash = location.hash.slice(1);
  const radio = fromHash && form.querySelector(`input[name="class"][value="${CSS.escape(fromHash)}"]`);
  if (radio) {
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true })); // so the preview updates
  }
}

init();
