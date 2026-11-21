/* =========================================================================
   custom-cake-page.js — Custom cake request.
   -------------------------------------------------------------------------
   Page-specific parts:
     • the flavour dropdowns, ONE PER TIER (2 tiers → bottom + top, etc.)
     • buildMessage() for forms.js
   The flavour list comes from data/menu.json (cakeFlavours), so it stays in
   sync with the menu. Everything else is handled by forms.js.
   ========================================================================= */

import { loadMenu } from './menu-data.js';
import { DEPOSIT_RATE } from './basket.js';
import { setupWhatsAppForm, formatDate, isShortNotice, methodLine, joinLines, readForm } from './forms.js';

const form = document.getElementById('cake-form');
const flavourFields = document.getElementById('flavour-fields');
let flavourOptions = []; // filled once menu.json has loaded

/* Fill the {DEPOSIT} placeholder in the hint with the real rate */
const hint = document.querySelector('.aside__hint');
hint.textContent = hint.textContent.replace('{DEPOSIT}', `${DEPOSIT_RATE * 100}%`);

/* ---------- Tiers → flavour dropdowns ----------
   LESSON: derive the UI from state.
   The size radio is the state; the dropdowns are rebuilt from it.
   Tiers are listed bottom-up because that's how a baker thinks about them. */
const TIER_LABELS = {
  '2 tiers': ['Bottom tier', 'Top tier'],
  '3 tiers': ['Bottom tier', 'Middle tier', 'Top tier'],
};

function tiersFor(size) {
  return TIER_LABELS[size] ?? ['Flavour']; // bento, 1 tier, not sure → one dropdown
}

function flavourSelectHTML(label, index, selected) {
  const name = `flavour${index + 1}`; // flavour1, flavour2, flavour3
  const isSingle = label === 'Flavour';
  const options = flavourOptions
    .map((f) => `<option ${f === selected ? 'selected' : ''}>${f}</option>`)
    .join('');
  return `
    <div class="field" data-field>
      <label class="field__label" for="${name}">${isSingle ? 'Flavour' : `${label} flavour`}</label>
      <select class="field__control" id="${name}" name="${name}" required
              data-label="${isSingle ? 'A flavour' : `A flavour for the ${label.toLowerCase()}`}">
        <option value="">Choose one</option>
        ${options}
      </select>
    </div>`;
}

let currentLabels = null;

function renderFlavourFields() {
  const data = readForm(form);
  const labels = tiersFor(data.size);
  if (currentLabels && labels.join('|') === currentLabels.join('|')) return; // nothing to change

  /* Keep what was already chosen, matched by TIER NAME, not position:
     switching 2 → 3 tiers keeps the bottom and the top, and adds an empty middle.
     A single "Flavour" counts as the bottom tier (and vice versa). */
  const previous = {};
  (currentLabels ?? []).forEach((label, i) => {
    previous[label === 'Flavour' ? 'Bottom tier' : label] = data[`flavour${i + 1}`];
  });
  currentLabels = labels;

  flavourFields.innerHTML = labels
    .map((label, i) => flavourSelectHTML(label, i, previous[label === 'Flavour' ? 'Bottom tier' : label]))
    .join('');
  flavourFields.classList.toggle('flavour-fields--tiers', labels.length > 1);
}

/* ---------- The message ---------- */
function flavourLines(d) {
  const labels = tiersFor(d.size);
  const chosen = labels.map((_, i) => d[`flavour${i + 1}`]).filter(Boolean);
  if (chosen.length === 0) return [];
  if (labels.length === 1) return [`Flavour: ${chosen[0]}`];

  // Every tier the same? Say it once.
  if (chosen.length === labels.length && new Set(chosen).size === 1) {
    return [`Flavour: ${chosen[0]} (all tiers)`];
  }
  return [
    'Flavours:',
    ...labels.map((label, i) => d[`flavour${i + 1}`] && `  ${label}: ${d[`flavour${i + 1}`]}`),
  ];
}

function buildMessage(d) {
  return joinLines([
    'Hi Thina! Custom cake request 🎂',
    d.name && `Name: ${d.name}`,
    '\n',
    // "Other" + what they typed → "Occasion: Kitchen tea"
    d.occasion && `Occasion: ${d.occasion === 'Other' ? d.occasionOther || 'Other' : d.occasion}`,
    d.date && `Date needed: ${formatDate(d.date)}${isShortNotice(d.date) ? ' (short notice, I know!)' : ''}`,
    d.size && `Size: ${d.size}`,
    ...flavourLines(d),
    d.theme && `Colours or theme: ${d.theme}`,
    d.writing && `Writing on the cake: "${d.writing}"`,
    d.budget && `Budget: ${d.budget}`,
    methodLine(d),
    d.note && `Note: ${d.note}`,
    d.pictures && '\n',
    d.pictures && "I'll send inspiration pictures in this chat.",
  ]);
}

/* ---------- Wire it up ---------- */

/* Rebuild the dropdowns whenever the size changes. This listener is added
   BEFORE the engine's, so the new dropdowns exist when the preview refreshes. */
form.addEventListener('change', (event) => {
  if (event.target.name === 'size') renderFlavourFields();
});

const engine = setupWhatsAppForm({
  form,
  preview: document.getElementById('cake-preview'),
  buildMessage,
  onSent: () => {
    document.getElementById('cake-sent').hidden = false;
  },
});

/* Load the flavours, then draw the first dropdown.
   If loading fails the form still works with the two fallback options. */
async function loadFlavours() {
  let flavours = [];
  try {
    flavours = (await loadMenu()).cakeFlavours ?? [];
  } catch (error) {
    console.error(error);
  }
  flavourOptions = [...flavours, 'Not sure, please recommend one', 'Something else (see note)'];
  currentLabels = null;
  renderFlavourFields();
  engine.refresh();
}

renderFlavourFields(); // an empty dropdown straight away, so the layout doesn't jump
loadFlavours();
