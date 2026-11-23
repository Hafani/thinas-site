/* =========================================================================
   menu-data.js — WHERE the menu comes from.
   -------------------------------------------------------------------------
   Right now: data/menu.json, a file in this project.
   Phase 4:   a Google Sheet Thina edits. Only THIS file will change —
              the menu page just calls loadMenu() and doesn't care where
              the data lives. (COS214 again: this is the Adapter / Façade idea.)

   LESSON: fetch + async/await
   fetch() asks for a file over the network and returns a Promise
   (a value that arrives later). `await` pauses this function until it
   arrives, without freezing the page.
   ========================================================================= */

export async function loadMenu() {
  const response = await fetch('data/menu.json');

  // fetch only throws on network failure. A missing file (404) still
  // "succeeds", so we must check response.ok ourselves.
  if (!response.ok) {
    throw new Error(`Menu request failed: ${response.status}`);
  }

  const menu = await response.json(); // parse the text into a JS object

  /* "hidden": true on a product or class keeps it off the whole site
     (menu, homepage prices, class booking) without deleting it.
     Filtering HERE means no page can forget to do it. */
  return {
    ...menu,
    products: menu.products.filter((p) => !p.hidden),
    classes: (menu.classes ?? []).filter((c) => !c.hidden),
  };
}
