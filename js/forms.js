/* =========================================================================
   forms.js — the shared "form engine" for all three forms:
   order details, custom cake request and class booking.
   -------------------------------------------------------------------------
   Every form on this site works the same way:
     1. Customer fills it in
     2. A live preview shows the WhatsApp message being built
     3. On "Send", we validate; if it's fine, WhatsApp opens with the message

   Each page only supplies ONE thing: a buildMessage(data) function that
   turns the form's values into text. Everything else lives here.
   (COS214: this is the Strategy pattern. The engine is fixed and the
   message-building "strategy" is plugged in per page.)
   ========================================================================= */

import { SITE, whatsappLink } from './config.js';

/* =========================================================================
   DATES
   -------------------------------------------------------------------------
   GOTCHA: <input type="date"> uses "YYYY-MM-DD" strings in LOCAL time.
   The tempting  new Date().toISOString().slice(0, 10)  gives the date in
   UTC. South Africa is UTC+2, so between midnight and 2am it would return
   YESTERDAY. So we build the string from local parts ourselves.
   ========================================================================= */

function pad(n) {
  return String(n).padStart(2, '0'); // 7 → "07"
}

/* Date object → "2026-11-21" (local time) */
export function toInputDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/* "2026-11-21" → Date at local midnight.
   (new Date("2026-11-21") would read it as UTC midnight: same gotcha.) */
export function fromInputDate(value) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/* Whole calendar days from today to that date: tomorrow → 1 */
export function daysFromToday(value) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((fromInputDate(value) - today) / msPerDay);
}

/* "2026-11-21" → "Sat 21 Nov 2026" — how it reads in the message.
   toLocaleDateString's output differs between browsers (some add commas
   or a leading zero: "04 Dec"), so we assemble the parts ourselves. */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(value) {
  const date = fromInputDate(value);
  return `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

const NOTICE_DAYS = SITE.noticeHours / 24; // 48 hours → 2 days

export function isShortNotice(value) {
  return value !== '' && daysFromToday(value) < NOTICE_DAYS;
}

/* Every date field marked  data-date-field  gets:
   - min = tomorrow (can't order for today or the past)
   - a soft warning under it when the date is short notice.
   It WARNS, it doesn't block: Thina decides if she can fit it in. */
function setupDateFields(form) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  form.querySelectorAll('[data-date-field]').forEach((input) => {
    input.min = toInputDate(tomorrow);
    const warning = form.querySelector(`[data-short-notice-for="${input.name}"]`);

    const update = () => {
      if (warning) warning.hidden = !isShortNotice(input.value);
    };
    input.addEventListener('input', update);
    input.addEventListener('change', update);
    update();
  });
}

/* =========================================================================
   SHOW / HIDE FIELDS
   -------------------------------------------------------------------------
   <div data-show-when="method=delivery"> is only visible (and only
   required) when the "method" radio is set to "delivery".
   Hidden + disabled fields are skipped by validation AND by FormData,
   so a collection order never asks for an address.
   ========================================================================= */

function updateConditionalFields(form) {
  const data = new FormData(form);
  form.querySelectorAll('[data-show-when]').forEach((block) => {
    const [name, value] = block.dataset.showWhen.split('=');
    const show = data.get(name) === value;
    block.hidden = !show;
    block.querySelectorAll('input, select, textarea').forEach((field) => {
      field.disabled = !show;
    });
  });
}

/* =========================================================================
   VALIDATION
   -------------------------------------------------------------------------
   LESSON: the Constraint Validation API.
   HTML attributes like  required, min, max, type="number"  already
   describe the rules. The browser checks them for us:
     field.checkValidity()  → true / false
     field.validity.valueMissing, .rangeUnderflow, ...  → WHY it failed
   We add  novalidate  to the <form> to switch off the browser's own
   pop-up bubbles (they look different in every browser), and show our
   own messages under each field instead.
   ========================================================================= */

function errorFor(field) {
  const label = field.dataset.label || 'This field';
  const v = field.validity;
  if (v.valueMissing) {
    // Radios and dropdowns are chosen; text boxes are typed into
    const verb = field.type === 'radio' || field.tagName === 'SELECT' ? 'Choose' : 'Enter';
    return `${verb} ${label.toLowerCase()}.`;
  }
  if (v.rangeUnderflow && field.type === 'date') return 'Choose a date from tomorrow onwards.';
  if (v.rangeUnderflow || v.rangeOverflow) return `Enter a number from ${field.min} to ${field.max}.`;
  if (v.badInput) return `Enter a valid ${label.toLowerCase()}.`;
  return field.validationMessage;
}

/* The error <p> lives at the end of the field's wrapper (.field / fieldset) */
function errorElement(field) {
  const wrapper = field.closest('[data-field]');
  if (!wrapper) return null;
  let el = wrapper.querySelector('.field__error');
  if (!el) {
    el = document.createElement('p');
    el.className = 'field__error';
    el.id = `${field.name}-error`;
    wrapper.append(el);
  }
  return el;
}

function showError(field, message) {
  const el = errorElement(field);
  if (!el) return;
  el.textContent = message;
  // aria-invalid + aria-describedby: screen readers announce the error with the field
  const group = field.type === 'radio' ? field.closest('[data-field]').querySelectorAll('input') : [field];
  group.forEach((f) => {
    f.setAttribute('aria-invalid', 'true');
    f.setAttribute('aria-describedby', el.id);
  });
}

function clearError(field) {
  const wrapper = field.closest('[data-field]');
  wrapper?.querySelector('.field__error')?.remove();
  const group = field.type === 'radio' ? wrapper.querySelectorAll('input') : [field];
  group.forEach((f) => {
    f.removeAttribute('aria-invalid');
    f.removeAttribute('aria-describedby');
  });
}

/* Returns true if the whole form is valid; otherwise shows every error
   and moves focus to the first problem. */
function validate(form) {
  let firstInvalid = null;
  const seenRadioGroups = new Set();

  [...form.elements].forEach((field) => {
    if (!field.name || field.disabled) return;
    if (field.type === 'radio') {
      if (seenRadioGroups.has(field.name)) return; // check each group once
      seenRadioGroups.add(field.name);
    }
    if (field.checkValidity()) {
      clearError(field);
    } else {
      showError(field, errorFor(field));
      firstInvalid ??= field; // ??= : assign only if still null
    }
  });

  firstInvalid?.focus();
  return firstInvalid === null;
}

/* =========================================================================
   THE ENGINE
   ========================================================================= */

/* Turn the form into a plain object: { name: 'Lerato', method: 'delivery', ... }
   Text is trimmed so "  Lerato " becomes "Lerato". */
export function readForm(form) {
  const data = {};
  for (const [key, value] of new FormData(form)) {
    data[key] = typeof value === 'string' ? value.trim() : value;
  }
  return data;
}

/**
 * setupWhatsAppForm({ form, preview, buildMessage, onSent })
 *  form          the <form> element
 *  preview       element that shows the live message (optional)
 *  buildMessage  (data) => string   the page-specific part
 *  onSent        called after WhatsApp opens (optional)
 */
export function setupWhatsAppForm({ form, preview, buildMessage, onSent }) {
  form.noValidate = true;
  setupDateFields(form);

  const refresh = () => {
    updateConditionalFields(form);
    if (preview) preview.textContent = buildMessage(readForm(form));
  };

  /* Once a field with an error becomes valid, remove the error straight away.
     GOTCHA (found in testing): we do this on 'input' (while typing), NOT only
     on 'change'. 'change' fires when you LEAVE a field, i.e. at the exact
     moment you click the next thing. Removing the error then makes the page
     jump up mid-click, and the click lands on the wrong spot. */
  const clearIfFixed = (event) => {
    const field = event.target;
    if (field.name && field.hasAttribute('aria-invalid') && field.checkValidity()) {
      clearError(field);
    }
  };

  // Live preview: 'input' fires on every keystroke, 'change' on radios/selects/dates
  form.addEventListener('input', (event) => {
    refresh();
    clearIfFixed(event);
  });
  form.addEventListener('change', (event) => {
    refresh();
    clearIfFixed(event);
  });
  refresh();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    updateConditionalFields(form);
    if (!validate(form)) return;

    const message = buildMessage(readForm(form));
    /* window.open inside a click/submit handler is allowed by pop-up
       blockers because the person triggered it. On phones this opens
       the WhatsApp app directly. */
    window.open(whatsappLink(message), '_blank', 'noopener');
    onSent?.();
  });

  return { refresh };
}

/* Shared line for collection / delivery, used by all three messages */
export function methodLine(data) {
  if (data.method === 'delivery') return `Delivery to: ${data.address || '…'}`;
  if (data.method === 'collection') return 'Collection';
  return '';
}

/* Build a message from lines, dropping empty ones but keeping
   deliberate blank lines (written as '\n' markers). */
export function joinLines(lines) {
  return lines
    .filter((line) => line !== '' && line !== null && line !== undefined && line !== false)
    .map((line) => (line === '\n' ? '' : line))
    .join('\n');
}
