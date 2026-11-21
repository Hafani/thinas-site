/* =========================================================================
   config.js — the ONE place where business details live.
   -------------------------------------------------------------------------
   LESSON: "Single source of truth"
   The old site had the phone number typed out ~10 times across 5 files.
   If Mom changed her number, you'd have to hunt down every copy.
   Now every page imports SITE from here, so you change it once.

   `export` makes these values available to other JS files that `import` them.
   ========================================================================= */

export const SITE = {
  name: "Thina's Tasty Treats",
  founded: 2019,
  location: 'Pretoria',

  // How the number is SHOWN to people
  phoneDisplay: '068 223 7647',
  // How the number is USED in links: international format, no "+", no spaces.
  // South Africa = 27, then drop the leading 0 → 27682237647
  whatsappNumber: '27682237647',

  // Minimum notice for orders (used in copy across the site)
  noticeHours: 48,

  social: {
    instagram: 'https://www.instagram.com/thinasstastytreats',
    tiktok: 'https://www.tiktok.com/@thinasstastytreats',
  },
};

/* -------------------------------------------------------------------------
   whatsappLink(message)
   Builds a "click to chat" link that opens WhatsApp with a message
   already typed in. We'll lean on this heavily in Phase 3 (forms).

   encodeURIComponent() turns spaces, newlines and symbols into URL-safe
   codes (e.g. a space becomes %20). Without it, the message breaks.
   ------------------------------------------------------------------------- */
export function whatsappLink(message = '') {
  const base = `https://wa.me/${SITE.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
