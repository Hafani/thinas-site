/* =========================================================================
   basket.js — the basket's DATA. No HTML in here at all.
   -------------------------------------------------------------------------
   LESSON: Separate state from UI.
   This file only knows about an array of items and how to change it.
   basket-ui.js and menu-page.js handle what people see.
   They talk to each other through the Observer pattern (you know it from
   COS214): UI code calls subscribe(fn), and whenever the basket changes,
   every subscribed function is called with the new items.

   An item looks like:
   { key: 'romany-creams|10 L|', productId: 'romany-creams',
     name: 'Romany creams', option: '10 L', flavour: '', price: 1200, qty: 1 }
   ========================================================================= */

const STORAGE_KEY = 'ttt-basket-v1';

let items = load();
const listeners = new Set();

/* ---------- Persistence ----------
   localStorage keeps data in the visitor's browser between visits.
   It only stores strings, so we JSON.stringify on save and JSON.parse on load.
   try/catch: storage can be full, blocked (private mode) or corrupted —
   the basket should still work for this visit if that happens. */
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore — basket just won't survive a refresh */
  }
}

/* Every change goes through here: save, then tell all subscribers. */
function commit() {
  save();
  listeners.forEach((fn) => fn(getItems()));
}

/* ---------- Public API (what other files may use) ---------- */

/* Returns a COPY so outside code can't change our array by accident. */
export function getItems() {
  return items.map((item) => ({ ...item }));
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(getItems()); // call once straight away so the UI starts in sync
  return () => listeners.delete(fn); // lets the caller unsubscribe later
}

/* Same product + size + flavour = same line. Adding it again bumps qty. */
export function addItem({ productId, name, option, flavour = '', price }) {
  const key = `${productId}|${option}|${flavour}`;
  const existing = items.find((item) => item.key === key);

  if (existing) {
    existing.qty += 1;
  } else {
    items.push({ key, productId, name, option, flavour, price, qty: 1 });
  }
  commit();
}

export function setQty(key, qty) {
  if (qty <= 0) return removeItem(key);
  const item = items.find((i) => i.key === key);
  if (item) {
    item.qty = Math.min(qty, 20); // sensible cap for a home bakery
    commit();
  }
}

export function removeItem(key) {
  items = items.filter((item) => item.key !== key);
  commit();
}

export function clearBasket() {
  items = [];
  commit();
}

/* ---------- Derived values ----------
   LESSON: .reduce() walks an array and "reduces" it to one value.
   Here: start at 0, and for each item add price × qty. */
export function countItems(list = items) {
  return list.reduce((sum, item) => sum + item.qty, 0);
}

export function totalPrice(list = items) {
  return list.reduce((sum, item) => sum + item.price * item.qty, 0);
}

export const DEPOSIT_RATE = 0.5; // Thina asks for half upfront

/* If another tab changes the basket, the 'storage' event fires here.
   Reload our copy so both tabs agree. */
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) {
    items = load();
    listeners.forEach((fn) => fn(getItems()));
  }
});
