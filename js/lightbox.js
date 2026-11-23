/* =========================================================================
   lightbox.js — full-screen photo viewer, shared by the gallery page and the
   homepage strip.
   -------------------------------------------------------------------------
   Built on <dialog> again (like the basket), so it gets the dimmed backdrop,
   focus trapping and Escape-to-close for free. On top of that:
     • ← / → keys and the on-screen arrows move between photos
     • swiping left/right works on phones (pointer events)
     • the next and previous photos are preloaded, so swiping feels instant

   Usage:
     const lightbox = createLightbox(photos);   // once
     lightbox.open(2);                          // show the 3rd photo
   ========================================================================= */

import { photoPaths } from './gallery-data.js';

function lightboxHTML() {
  return `
    <dialog class="lightbox" aria-label="Photo viewer">
      <figure class="lightbox__figure">
        <img class="lightbox__img" alt="">
        <figcaption class="lightbox__caption">
          <span class="lightbox__text"></span>
          <span class="lightbox__count" aria-live="polite"></span>
        </figcaption>
      </figure>
      <button type="button" class="lightbox__btn lightbox__close" data-lb="close" aria-label="Close photo">
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <button type="button" class="lightbox__btn lightbox__prev" data-lb="prev" aria-label="Previous photo">
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button type="button" class="lightbox__btn lightbox__next" data-lb="next" aria-label="Next photo">
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </dialog>`;
}

export function createLightbox(photos) {
  document.body.insertAdjacentHTML('beforeend', lightboxHTML());
  const dialog = document.body.lastElementChild;
  const img = dialog.querySelector('.lightbox__img');
  const text = dialog.querySelector('.lightbox__text');
  const count = dialog.querySelector('.lightbox__count');
  let index = 0;

  /* % with negatives: (-1 % 7) is -1 in JS, so add the length first.
     This makes "previous" on the first photo wrap round to the last. */
  const wrap = (i) => (i + photos.length) % photos.length;

  function preload(i) {
    const extra = new Image();
    extra.src = photoPaths(photos[wrap(i)]).full;
  }

  function show(i) {
    index = wrap(i);
    const photo = photos[index];
    img.src = photoPaths(photo).full;
    img.alt = photo.alt;
    img.width = photo.width;   // width/height let the browser reserve space
    img.height = photo.height; // before the file arrives: no jumping
    text.textContent = photo.caption;
    count.textContent = `${index + 1} of ${photos.length}`;
    preload(index + 1);
    preload(index - 1);
  }

  /* ---- Buttons (one delegated listener, like the basket) ---- */
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) return dialog.close(); // backdrop click
    const action = event.target.closest('[data-lb]')?.dataset.lb;
    if (action === 'close') dialog.close();
    if (action === 'prev') show(index - 1);
    if (action === 'next') show(index + 1);
  });

  /* ---- Keyboard ---- */
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(index - 1);
    if (event.key === 'ArrowRight') show(index + 1);
  });

  /* ---- Swipe ----
     LESSON: pointer events cover mouse, touch and pen with one API.
     Remember where the finger went down; when it lifts, a big enough
     sideways movement counts as a swipe. 50px avoids accidental swipes
     when someone only meant to tap. */
  let startX = null;
  img.addEventListener('pointerdown', (event) => {
    startX = event.clientX;
  });
  img.addEventListener('pointerup', (event) => {
    if (startX === null) return;
    const moved = event.clientX - startX;
    startX = null;
    if (Math.abs(moved) > 50) show(moved < 0 ? index + 1 : index - 1);
  });

  dialog.addEventListener('close', () => {
    document.body.classList.remove('no-scroll');
  });

  return {
    open(i) {
      show(i);
      dialog.showModal();
      document.body.classList.add('no-scroll');
    },
  };
}
