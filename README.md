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
├── about.html
├── css/
│   ├── tokens.css      Design system: colours, fonts, spacing (CHANGE THINGS HERE)
│   ├── base.css        Resets and default element styles
│   ├── components.css  Buttons, header, nav, footer: used on every page
│   ├── home.css        Homepage-only styles
│   ├── menu.css        Menu page: product cards, size picker
│   └── forms.css       Order, cake and class pages: layout, radio cards, errors, preview
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
│   └── format.js       formatPrice(), describeOption()
├── data/
│   └── menu.json       ALL products, sizes, prices, cake flavours and classes (edit here)
└── images/             Compressed photos + emblem.png (logo cut-out)
```

## Roadmap

1. ✅ Foundation: design system, shared layout, mobile nav, homepage
2. ✅ Menu from data + basket: product cards, tub-size picker, basket panel, order message
3. ✅ Forms: order date + collection/delivery, custom cake request, class booking → WhatsApp
4. ⬜ Admin: menu and prices read from a Google Sheet Thina edits
5. ⬜ Polish and launch: gallery, SEO, accessibility pass, deploy to GitHub Pages

Guides: `LEARN-phase-1.md`, `LEARN-phase-2.md`, `LEARN-phase-3.md`.
