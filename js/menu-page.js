/* =========================================================================
   menu-page.js — builds the Menu page from the data.
   Only menu.html loads this file.
   -------------------------------------------------------------------------
   Flow:  loadMenu()  →  render cards  →  listen for size changes + "Add"
   ========================================================================= */

import { loadMenu } from './menu-data.js';
import { addItem } from './basket.js';
import { formatPrice } from './format.js';
import { whatsappLink } from './config.js';

const root = document.getElementById('menu-root');
let productsById = {}; // quick lookup: productsById['romany-creams'] → product

/* ---------- Small HTML builders ---------- */

/* A bucket icon whose size grows with the litres, so "20 L" LOOKS bigger
   than "5 L" — helps people who've never bought biscuits by the litre. */
function bucketIcon(label) {
  const litres = parseFloat(label);
  if (!label.endsWith('L')) return '';
  const size = Math.round(12 + litres * 0.6); // 5 L → 15px … 25 L → 27px
  return `
    <svg class="size__icon" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">
      <path d="M4 7h16l-1.6 12.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8L4 7z" fill="currentColor" opacity=".18"/>
      <path d="M4 7h16l-1.6 12.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8L4 7zM3 7h18M8 7a4 4 0 0 1 8 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
    </svg>`;
}

function imageHTML(product) {
  // No photo yet → show nothing; the card is just text until a photo is added.
  if (!product.image) return '';
  return `<img class="product__img" src="${product.image}" alt="${product.name}" loading="lazy">`;
}

function sizePickerHTML(product) {
  const isTub = product.options[0].label.endsWith('L');
  const radios = product.options.map((option, i) => `
    <label class="size">
      <input type="radio" name="size" value="${i}" ${i === 0 ? 'checked' : ''}>
      <span class="size__pill">${bucketIcon(option.label)}${option.label}</span>
    </label>`).join('');

  return `
    <fieldset class="sizes">
      <legend class="sizes__legend">${isTub ? 'Tub size' : 'How many'}</legend>
      <div class="sizes__options">${radios}</div>
    </fieldset>`;
}

function flavourHTML(product) {
  if (!product.flavours) return '';
  const options = product.flavours.map((f) => `<option>${f}</option>`).join('');
  return `
    <label class="field">
      <span class="field__label">Flavour</span>
      <select name="flavour" class="field__control">${options}</select>
    </label>`;
}

function productHTML(product) {
  const description = product.description ? `<p class="product__desc">${product.description}</p>` : '';

  // Cakes have no fixed price — send people to the custom cake form instead.
  if (product.quote) {
    return `
      <article class="product product--quote${product.image ? '' : ' product--no-photo'}">
        ${imageHTML(product)}
        <div class="product__body">
          <h3 class="product__name">${product.name}</h3>
          ${description}
          <div class="product__buy">
            <span class="product__price">Priced by design</span>
            <a href="custom-cake.html" class="btn btn--small">Request a cake</a>
          </div>
        </div>
      </article>`;
  }

  /* Each card is a <form>. Pressing Enter or the button "submits" it,
     and we read the chosen size/flavour with FormData. */
  return `
    <article class="product${product.image ? '' : ' product--no-photo'}">
      ${imageHTML(product)}
      <form class="product__body" data-product-id="${product.id}">
        <h3 class="product__name">${product.name}</h3>
        ${description}
        ${sizePickerHTML(product)}
        ${flavourHTML(product)}
        <div class="product__buy">
          <span class="product__price" aria-live="polite">${formatPrice(product.options[0].price)}</span>
          <button type="submit" class="btn btn--small">Add to basket</button>
        </div>
      </form>
    </article>`;
}

function menuHTML({ categories: allCategories, products }) {
  // Skip a category whose products are all hidden, so no empty section shows
  const categories = allCategories.filter((c) => products.some((p) => p.category === c.id));

  // Jump links to each category
  const jump = categories.map((c) => `<a href="#${c.id}" class="chip">${c.name}</a>`).join('');

  // One section per category, containing only that category's products.
  // LESSON: .filter() keeps the items that pass the test.
  const sections = categories.map((category) => {
    const cards = products
      .filter((p) => p.category === category.id)
      // Products with a photo first; ones without a photo go to the end.
      // .sort() keeps the original order among equals (it's "stable").
      .sort((a, b) => Boolean(b.image) - Boolean(a.image))
      .map(productHTML)
      .join('');
    return `
      <section id="${category.id}" class="menu-section" aria-labelledby="${category.id}-title">
        <div class="menu-section__head">
          <h2 id="${category.id}-title">${category.name}</h2>
          <p>${category.note}</p>
        </div>
        <div class="products">${cards}</div>
      </section>`;
  }).join('');

  return `<nav class="chips" aria-label="Menu categories">${jump}</nav>${sections}`;
}

/* ---------- Behaviour ---------- */

/* Read a card's form and return the chosen product, option and flavour. */
function readForm(form) {
  const product = productsById[form.dataset.productId];
  const data = new FormData(form); // collects every named input in the form
  const option = product.options[Number(data.get('size'))];
  const flavour = data.get('flavour') || '';
  return { product, option, flavour };
}

function setupEvents() {
  // Size changed → update that card's price. (Delegation again: one listener.)
  root.addEventListener('change', (event) => {
    const form = event.target.closest('form[data-product-id]');
    if (!form) return;
    const { option } = readForm(form);
    form.querySelector('.product__price').textContent = formatPrice(option.price);
  });

  // "Add to basket"
  root.addEventListener('submit', (event) => {
    event.preventDefault(); // forms normally reload the page — we don't want that
    const form = event.target;
    const { product, option, flavour } = readForm(form);

    addItem({
      productId: product.id,
      name: product.name,
      option: option.label,
      flavour,
      price: option.price,
    });

    // Confirm on the button itself: it answers the action, right where the eye is.
    const button = form.querySelector('button[type="submit"]');
    button.textContent = 'Added ✓';
    button.classList.add('is-added');
    clearTimeout(button._timer);
    button._timer = setTimeout(() => {
      button.textContent = 'Add to basket';
      button.classList.remove('is-added');
    }, 1600);
  });
}

/* The browser tries to jump to #biscuits BEFORE our cards exist,
   so we do the jump ourselves once rendering is finished. */
function scrollToHash() {
  if (!location.hash) return;
  document.querySelector(location.hash)?.scrollIntoView();
}

async function init() {
  root.innerHTML = '<p class="menu-status">Loading the menu…</p>';
  try {
    const menu = await loadMenu();
    productsById = Object.fromEntries(menu.products.map((p) => [p.id, p]));
    root.innerHTML = menuHTML(menu);
    setupEvents();
    scrollToHash();
  } catch (error) {
    console.error(error);
    // Say what went wrong and what to do — never leave a blank page.
    root.innerHTML = `
      <div class="menu-status">
        <p>The menu didn't load. Refresh the page, or ask Thina for prices on WhatsApp.</p>
        <a class="btn" href="${whatsappLink('Hi Thina, could you send me your menu and prices?')}" target="_blank" rel="noopener">Ask on WhatsApp</a>
      </div>`;
  }
}

init();
