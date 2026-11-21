# Phase 1: how the foundation works

Read this with the code open next to it. Every file is commented too.

---

## 1. What happens when someone opens a page

Here's the order of events when a browser loads `index.html`:

1. **The HTML is read top to bottom.** In `<head>` the four CSS files load in this order: `tokens` → `base` → `components` → `home`. Order matters because when two rules have the same specificity, **the later one wins** (that's the "cascade" in Cascading Style Sheets).
2. **`<script type="module" src="js/main.js">`** is found, but because it's a module it **waits** until the whole HTML is parsed. (Modules behave like `defer`.)
3. **The body is drawn.** At this point `<div id="site-header">` and `<div id="site-footer">` are still **empty**.
4. **`main.js` runs.** It imports `config.js` and `layout.js`, then calls `renderLayout()`, which fills the two placeholders with HTML.
5. **`main.js` scans for `data-whatsapp` and `data-site` attributes** and wires them up.

**Try it:** open DevTools (F12), go to *Elements*, and compare it with *View Page Source* (Ctrl+U). The source has empty placeholders; Elements shows the live DOM after JavaScript filled them in. Understanding that difference is half of web development.

---

## 2. Why the old site was hard to maintain

| Old site | New site |
|---|---|
| Header, nav and footer copy-pasted into 5 files | Written once in `layout.js` |
| Phone number typed ~10 times | Once, in `config.js` |
| Colours repeated across 500 lines of CSS | Named once in `tokens.css` as `--berry`, `--cocoa` and so on |
| Everything centred | Left-aligned text, with grids for layout |
| Desktop nav squashed onto phones | Proper slide-in mobile menu |

**Principle: DRY (Don't Repeat Yourself).** If you'd have to change the same fact in two places, it should live in one.

---

## 3. CSS concepts used

**Custom properties (variables):** `tokens.css`
```css
:root { --berry: #A32B70; }
.btn  { background: var(--berry); }
```
Open DevTools, select `<html>`, and change `--berry` live. The whole site recolours instantly.

**`clamp()` for fluid type:** `--text-hero: clamp(2.6rem, 1.4rem + 5vw, 5.25rem)` means "scale with the screen width (`vw`), but never below 2.6rem or above 5.25rem." Resize the window and watch the headline.

**Mobile-first media queries:** `components.css` first writes the *phone* styles, then:
```css
@media (min-width: 860px) { /* overrides for bigger screens */ }
```
Starting small and adding complexity is easier than squeezing a desktop design down.

**Grid:** `.hero` is one column by default, and `grid-template-columns: 1.15fr 0.85fr` from 860px. `fr` means "a fraction of the leftover space."

**BEM class names:** `.nav` (block), `.nav__link` (element inside it), `.nav--open` (state/modifier). You can tell what any class belongs to just from its name.

**`object-fit: cover`** crops photos to fill a shape without squashing them. That's how every photo becomes the same arch, whatever the original size.

**The arch:** `border-radius: 999px 999px 14px 14px`. A huge radius on the top corners makes a full semicircle, and the bottom corners stay gently rounded. It echoes the round frame in Thina's logo and is the site's signature shape.

**CSS counters:** the big 1, 2, 3 in "How ordering works" aren't typed in the HTML. `counter-reset` / `counter-increment` / `content: counter(step)` generate them. Reorder the steps and the numbers stay correct.

---

## 4. JavaScript concepts used

**Modules:** `export` in one file, `import` in another. Each file has its own scope, so no global-variable mess.

**Template literals:** backtick strings that can span lines and contain `${expressions}`. That's how `layout.js` builds HTML.

**`.map().join('')`:** turns an array of data (`NAV_LINKS`) into an HTML string. **You'll use this exact pattern in Phase 2** to turn the menu data into product cards.

**State in attributes:** the mobile menu's open/closed state lives in `aria-expanded="true|false"` on the button. CSS reads it to draw the X, screen readers read it to announce "expanded", and JS reads it to decide what a click does. One source of truth, three uses.

**`encodeURIComponent`:** in `config.js`. WhatsApp links carry the message in the URL, so spaces and symbols must be encoded (`" "` → `%20`).

---

## 5. A real bug we hit (and why)

On the first test, the mobile menu was see-through and the page scrolled sideways. The header had:
```css
backdrop-filter: blur(8px);
```
`position: fixed` normally positions an element relative to the **screen**. But if *any ancestor* has `transform`, `filter` or `backdrop-filter`, that ancestor becomes the reference instead. The full-screen menu was trapped inside a 72px-tall header. We removed the blur, and there's a comment in `components.css` so it doesn't happen again.

---

## 6. Accessibility, built in from the start

- `:focus-visible` outline: press **Tab** through the page and you can always see where you are
- The hamburger is a real `<button>` with `aria-expanded` and `aria-controls`. **Escape** closes the menu
- `aria-current="page"` highlights the current page in the nav and tells screen readers about it
- Every meaningful image has descriptive `alt` text. Decorative ones use `alt=""` so screen readers skip them
- `prefers-reduced-motion`: if someone has turned off animations on their device, the hero animation doesn't play
- All text colours pass WCAG AA contrast (berry on cream is 6.4:1, and the minimum is 4.5:1)

---

## 7. Exercises (do these before Phase 2)

1. **Change the notice period** to 72 hours in `config.js`. Find every place on the site that updates.
2. **Add a "Gallery" link** to the nav. It should take one line in one file. (Create a `gallery.html` stub by copying `about.html`.)
3. **Make the hero animation slower** in `home.css`. Which property controls it? Then turn on "reduce motion" in your OS settings and reload.
4. **Break it on purpose:** add `transform: translateZ(0);` to `.site-header`, open the mobile menu, and see the bug from section 5 come back.
5. **Read `layout.js` and answer:** how does the nav know which link to highlight?

In Phase 2 we'll move all the products and prices into a data file and generate the menu page from it. That's the step that makes the site actually *functional*.
