/* =========================================================================
   home-page.js — the homepage parts that come from data:
     • "From R…" prices on the category tiles   (data/menu.json → products)
     • the class price list                      (data/menu.json → classes)
     • the "Recent cakes" strip                  (data/gallery.json, first 4)
   -------------------------------------------------------------------------
   LESSON: progressive enhancement.
   index.html already contains sensible prices and class rows as plain HTML.
   This file REPLACES them with the live values. If the JSON fails to load
   (or JavaScript is off, or Google's crawler skips JS), visitors still see
   the HTML version rather than an empty gap.
   ========================================================================= */

import { loadMenu } from './menu-data.js';
import { loadGallery, photoPaths } from './gallery-data.js';
import { createLightbox } from './lightbox.js';
import { formatPrice, describeOption } from './format.js';

/* ---------- Prices ---------- */

/* Cheapest option across every visible product in a category.
   LESSON: .flatMap() — like .map(), but flattens one level:
   [[opt, opt], [opt]] → [opt, opt, opt]. */
function cheapestIn(products, categoryId) {
  const options = products
    .filter((p) => p.category === categoryId && !p.quote)
    .flatMap((p) => p.options);
  if (options.length === 0) return null;
  return options.reduce((low, o) => (o.price < low.price ? o : low));
}

function fillPrices(products) {
  document.querySelectorAll('[data-from-price]').forEach((el) => {
    const cheapest = cheapestIn(products, el.dataset.fromPrice);
    if (cheapest) {
      el.textContent = `From ${formatPrice(cheapest.price)} for a ${describeOption(cheapest.label)}`;
    }
  });
}

function fillClasses(classes) {
  const list = document.getElementById('class-pricelist');
  if (!list || classes.length === 0) return;
  // Each row links straight to that class on the booking page
  list.innerHTML = classes.map((c) => `
    <li><a href="classes.html#${c.id}">${c.name}</a><span>${formatPrice(c.price)}</span></li>`).join('');
}

/* ---------- Recent cakes ---------- */

function fillStrip(photos) {
  const strip = document.getElementById('recent-strip');
  const recent = photos.slice(0, 4);
  strip.innerHTML = recent.map((photo, i) => `
    <li>
      <button type="button" class="gallery__btn" data-index="${i}" aria-label="Open photo: ${photo.caption}">
        <img src="${photoPaths(photo).thumb}" alt="${photo.alt}" loading="lazy" width="${photo.width}" height="${photo.height}">
      </button>
    </li>`).join('');

  // The lightbox gets ALL photos, so you can swipe past the first 4
  const lightbox = createLightbox(photos);
  strip.addEventListener('click', (event) => {
    const button = event.target.closest('.gallery__btn');
    if (button) lightbox.open(Number(button.dataset.index));
  });
}

/* ---------- Run ----------
   Promise.allSettled: start both downloads at once, and carry on with
   whichever succeed. (Promise.all would give up on BOTH if one failed.) */
const [menu, gallery] = await Promise.allSettled([loadMenu(), loadGallery()]);

if (menu.status === 'fulfilled') {
  fillPrices(menu.value.products);
  fillClasses(menu.value.classes);
} else {
  console.error(menu.reason); // the HTML prices stay as they are
}

if (gallery.status === 'fulfilled') {
  fillStrip(gallery.value);
} else {
  console.error(gallery.reason);
  document.getElementById('recent-strip').closest('section').hidden = true;
}
