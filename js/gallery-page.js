/* =========================================================================
   gallery-page.js — builds the gallery grid from data/gallery.json and opens
   the lightbox when a photo is tapped.
   ========================================================================= */

import { loadGallery, photoPaths } from './gallery-data.js';
import { createLightbox } from './lightbox.js';
import { whatsappLink } from './config.js';

const root = document.getElementById('gallery-root');

/* Each photo is a <button>, not a bare <img> with a click handler:
   buttons can be reached with Tab and pressed with Enter or Space,
   so keyboard users can open photos too. */
function tileHTML(photo, i) {
  return `
    <li class="gallery__item">
      <button type="button" class="gallery__btn" data-index="${i}" aria-label="Open photo: ${photo.caption}">
        <img src="${photoPaths(photo).thumb}" alt="${photo.alt}" loading="lazy"
             width="${photo.width}" height="${photo.height}">
      </button>
      <p class="gallery__caption">${photo.caption}</p>
    </li>`;
}

async function init() {
  try {
    const photos = await loadGallery();
    root.innerHTML = `<ul class="gallery" role="list">${photos.map(tileHTML).join('')}</ul>`;

    const lightbox = createLightbox(photos);
    root.addEventListener('click', (event) => {
      const button = event.target.closest('.gallery__btn');
      if (button) lightbox.open(Number(button.dataset.index));
    });
  } catch (error) {
    console.error(error);
    root.innerHTML = `
      <p>The photos didn't load. Refresh the page, or see more of Thina's work on
      <a href="${whatsappLink('Hi Thina, could you send me some photos of your cakes?')}" target="_blank" rel="noopener">WhatsApp</a>.</p>`;
  }
}

init();
