/* =========================================================================
   gallery-data.js — where the gallery photos come from: data/gallery.json.
   Same pattern as menu-data.js: pages call loadGallery() and don't care
   where the list lives.

   To add a photo:
     1. Put the full-size photo in images/gallery/ and a small copy
        (about 640px on the long side) in images/gallery/thumbs/,
        with the SAME file name.
     2. Add an entry to data/gallery.json (the first 4 show on the homepage).
   ========================================================================= */

export const GALLERY_DIR = 'images/gallery';

export async function loadGallery() {
  const response = await fetch('data/gallery.json');
  if (!response.ok) throw new Error(`Gallery request failed: ${response.status}`);
  const { photos } = await response.json();
  return photos.filter((photo) => !photo.hidden); // "hidden": true keeps a photo off the site
}

/* Paths for one photo: the small thumbnail for grids, the full one for the lightbox */
export function photoPaths(photo) {
  return {
    thumb: `${GALLERY_DIR}/thumbs/${photo.file}`,
    full: `${GALLERY_DIR}/${photo.file}`,
  };
}
