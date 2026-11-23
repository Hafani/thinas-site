# Thina's Tasty Treats: website rebuild

A home-bakery website in plain HTML, CSS and JavaScript. No frameworks, no build step.

## Running it locally

The site uses JavaScript modules (`import` / `export`). Browsers block those when you
double-click an HTML file (`file://`), so you need a tiny local server:

- **VS Code:** install the *Live Server* extension, right-click `index.html`, then choose *Open with Live Server*
- **Terminal:** `cd` into this folder, run `python3 -m http.server 8000`, then open http://localhost:8000

## Folder structure

```
thinas-site/
├── index.html          Homepage
├── menu.html           Menu: cards built from data/menu.json
├── order.html          Order details: summary, date, collection/delivery, live preview → WhatsApp
├── custom-cake.html    Custom cake request form → WhatsApp
├── classes.html        Class booking form → WhatsApp
├── gallery.html        Photo gallery with full-screen viewer
├── about.html
├── css/
│   ├── tokens.css      Design system: colours, fonts, spacing (CHANGE THINGS HERE)
│   ├── base.css        Resets and default element styles
│   ├── components.css  Buttons, header, nav, footer: used on every page
│   ├── home.css        Homepage-only styles
│   ├── menu.css        Menu page: product cards, size picker
│   ├── forms.css       Order, cake and class pages: layout, radio cards, errors, preview
│   └── gallery.css     Gallery grid, lightbox, homepage photo strip
├── js/
│   ├── config.js       Phone number, socials, notice period: single source of truth
│   ├── layout.js       Draws the header and footer on every page, plus the mobile menu
│   ├── main.js         Entry point every page loads
│   ├── basket.js       Basket DATA: add/remove/qty, saved in localStorage, subscribe()
│   ├── basket-ui.js    Basket button badge + slide-out panel (<dialog>)
│   ├── menu-data.js    loadMenu(): where the menu comes from (swapped in Phase 4)
│   ├── menu-page.js    Builds the menu page, handles size changes + Add to basket
│   ├── forms.js        Shared form engine: dates, validation, show/hide, live preview, send
│   ├── order-page.js   Order details page
│   ├── custom-cake-page.js  Custom cake request
│   ├── classes-page.js Class booking
│   ├── home-page.js    Homepage prices, class list and photo strip from data
│   ├── gallery-data.js loadGallery(): reads data/gallery.json
│   ├── gallery-page.js Builds the gallery grid
│   ├── lightbox.js     Full-screen photo viewer (swipe, arrow keys)
│   └── format.js       formatPrice(), describeOption()
├── data/
│   ├── menu.json       ALL products, sizes, prices, cake flavours and classes (edit here)
│   └── gallery.json    Gallery photos, captions and descriptions (first 4 = homepage)
└── images/             Compressed photos, emblem.png (logo cut-out), og-image.jpg (link preview)
    └── gallery/        Gallery photos + thumbs/ (small copies, same names)
```

## Roadmap

1. ✅ Foundation: design system, shared layout, mobile nav, homepage
2. ✅ Menu from data + basket
3. ✅ Forms: order date + collection/delivery, custom cake request, class booking → WhatsApp
4. ✅ Live on GitHub Pages: https://hafani.github.io/thinas-site/
5. ✅ Gallery, homepage from data, hidden switch, link previews
6. ⬜ Custom domain (thinastastytreats.co.za): see the "Custom domain setup" guide, and LEARN-phase-5.md section 6

## Everyday edits

- **Price or product:** `data/menu.json` (add `"hidden": true` to hide one without deleting it)
- **Gallery photo:** `images/gallery/` + `images/gallery/thumbs/` + `data/gallery.json`
- **Phone number:** `js/config.js` AND the structured data in `index.html`
- Then: `git add .`, `git commit -m "…"`, `git push` (live in about a minute)

Guides: `LEARN-phase-1.md` to `LEARN-phase-5.md`.
