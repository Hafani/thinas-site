# Phase 5: gallery, homepage from data, hidden items, link previews

---

## 1. What's new

| Change | Files |
|---|---|
| Gallery page with a full-screen photo viewer (swipe, arrow keys) | `gallery.html`, `js/gallery-page.js`, `js/lightbox.js`, `js/gallery-data.js`, `css/gallery.css`, `data/gallery.json`, `images/gallery/` |
| "Recent cakes" strip on the homepage | `index.html`, `js/home-page.js` |
| Homepage "From R…" prices and the class price list now come from `menu.json` | `index.html`, `js/home-page.js` |
| `"hidden": true` switch for products, classes and photos | `js/menu-data.js`, `js/gallery-data.js`, `js/menu-page.js` |
| "About Us" heading | `about.html` |
| Link previews for WhatsApp, Facebook and Instagram DMs, plus info Google reads | every `.html` `<head>`, `images/og-image.jpg`, `images/apple-touch-icon.png` |
| Hamburger menu now used below 1024px (the bar got too full) | `css/components.css`, `js/layout.js` |

---

## 2. Everyday edits

**Add a gallery photo**
1. Resize it: about 1400px on the long side for `images/gallery/`, and a copy about 640px for `images/gallery/thumbs/`, **same file name** in both. On a Mac: open in Preview → Tools → Adjust Size.
2. Add an entry to `data/gallery.json`: `file`, a short `caption`, an `alt` describing what's in the photo, and its full-size `width` and `height`. The **first 4** entries show on the homepage, so put the best ones at the top.

**Hide something without deleting it.** Add `"hidden": true` to a product, a class or a photo:
```json
{ "id": "melting-moments", "name": "Melting moments", "hidden": true, ... }
```
It disappears from the menu, the homepage prices, the class booking form or the gallery. Delete the line to bring it back. A category with every product hidden disappears from the menu too.

**Change a price.** Only `data/menu.json`. The homepage updates itself now.

---

## 3. Progressive enhancement (home-page.js)

The homepage HTML still contains prices and class rows typed out by hand. `home-page.js` **replaces** them with the live values from `menu.json`.

Why keep the hand-typed versions at all? If the JSON fails to load, if JavaScript is off, or if a search engine reads the page without running JS, people still see sensible content and not a gap. That's **progressive enhancement**: the page works without JS, and JS makes it better. (If you raise a price a lot, update the HTML fallback too, so it's not misleading.)

New JS in this file:
- **`.flatMap()`** turns `[[5L, 10L], [12, 24]]` into one list `[5L, 10L, 12, 24]`, so `.reduce()` can find the cheapest.
- **`Promise.allSettled([loadMenu(), loadGallery()])`** starts both downloads at once and carries on with whichever succeed. `Promise.all` would give up on both if either failed.
- **Top-level `await`** works because the file is a module. In a classic script you'd need an `async` function.

---

## 4. Filtering in one place

`"hidden"` is filtered inside `loadMenu()` and `loadGallery()`, **not** on each page. Every page gets the data through those functions, so none of them can forget. Compare that with checking `if (!product.hidden)` in four places, where sooner or later one gets missed.

It's the same idea as `config.js` holding the phone number: one place for each rule.

---

## 5. The lightbox (lightbox.js)

- **`<dialog>` again:** backdrop, Escape to close and focus trapping come free, as with the basket.
- **Photos are `<button>`s, not bare `<img>`s.** Buttons can be reached with Tab and opened with Enter, so the gallery works without a mouse.
- **Wrapping around:** `(i + photos.length) % photos.length`. In JavaScript, `-1 % 7` is `-1`, not `6`, so we add the length first. That's how "previous" on photo 1 lands on photo 7.
- **Swipe with pointer events:** `pointerdown` records where the finger started, and `pointerup` measures how far it moved. Over 50px counts as a swipe, so a tap isn't mistaken for one. Pointer events cover mouse, touch and pen with one API.
- **`touch-action: pan-y`** in the CSS tells the browser "you handle vertical scrolling, my code handles sideways".
- **Preloading:** the photos either side of the current one start downloading in the background, so the next swipe shows instantly.
- **Thumbnails vs full size:** the grid loads the 640px thumbnails (about 40–90 KB each) and the full 1400px photo only loads when opened. Shipping full photos in a 7-tile grid would cost several megabytes of mobile data for pictures shown at a quarter of their size.
- **`width` and `height` on `<img>`:** the browser reserves the right space before the file arrives, so the page doesn't jump (the layout-shift bug from Phase 3, in a different place).

---

## 6. Link previews (Open Graph)

When someone pastes the link into WhatsApp, WhatsApp's servers fetch the page and read these tags from `<head>`:

```html
<meta property="og:title" content="Cake gallery | Thina's Tasty Treats">
<meta property="og:description" content="Birthday, celebration and tiered cakes…">
<meta property="og:image" content="https://hafani.github.io/thinas-site/images/og-image.jpg">
```

- **They must be full addresses** (`https://…`), not `images/og-image.jpg`. WhatsApp's server isn't "on" your page, so it can't work out relative paths.
- **WhatsApp doesn't run JavaScript.** That's why these are typed into each HTML file and not added by `layout.js`. The same goes for `<meta name="description">`, which Google shows under the link in search results.
- **`og-image.jpg` is 1200×630**, the size every platform expects.
- **WhatsApp caches previews.** If you change the image, a link that was already shared may keep showing the old one for a while.

**Structured data:** `index.html` also has a `<script type="application/ld+json">` block telling Google this is a **Bakery**, with its phone number, area (Pretoria) and social links. There's no street address on purpose, because it's a home business.

**`noindex` on order.html:** an empty checkout is useless as a search result, so it asks Google not to list it.

### When the custom domain goes live

Search the project for `hafani.github.io/thinas-site` and replace it with the new address (`https://www.thinastastytreats.co.za/`). It appears in:
- the `og:url` and `og:image` tags in all 7 HTML files
- `url` and `image` in the structured data in `index.html`

VS Code: **Cmd+Shift+H** (Replace in Files).

**Also note:** the phone number appears in the structured data as well as `config.js`. JSON-LD is read without running JS, so it can't import `config.js`. If her number changes again, update both.

---

## 7. A breakpoint that lives in two places

The desktop menu now starts at **1024px** (it was 860px). Adding "Gallery" made the bar too full: at 880px "Custom cakes" wrapped onto two lines and "Menu" touched the logo.

The number is in **two** places:
- `css/components.css`: `@media (min-width: 1024px)`, which decides how the menu looks
- `js/layout.js`: `matchMedia('(min-width: 1024px)')`, which closes the mobile menu if the window grows

If they disagree, between the two numbers the page shows the desktop menu while JS thinks it's mobile, or the other way round. Both now have a comment pointing at the other.

---

## 8. Exercises

1. **Hide melting moments** with `"hidden": true` and check the menu. Then hide all three scone products: what happens to the "Scones" chip and the homepage tile price?
2. **Change the order of `gallery.json`** so the cupcakes are first. Where does that show up?
3. **Test a link preview without sharing it:** paste the GitHub link into a WhatsApp chat with yourself (don't send). What shows? Try the gallery page link too: its title differs.
4. **Open DevTools → Network**, filter by "Img", and open the gallery. How big are the thumbnails? Open a photo in the lightbox: when does the full-size file load, and which other files load with it?
5. **Keyboard only:** Tab to a gallery photo, press Enter, use ← →, press Escape. Where does focus end up afterwards?
