# Phase 2: menu from data + basket

This phase is where the site became **functional**. Read this with the code open next to it.

---

## 1. The big idea: data → HTML

The old `menu.html` had every product typed out by hand. Now:

```
data/menu.json  ──fetch──▶  menu-page.js  ──builds──▶  the cards you see
```

`menu.html` contains only `<div id="menu-root"></div>`. Everything inside it is generated.

**Why bother?**
- **Change a price:** edit one number in `menu.json`. No HTML.
- **Add a product:** copy one `{ … }` block in `menu.json`. Its card, size picker, price and basket support all appear automatically.
- **Phase 4:** swap `menu.json` for a Google Sheet by changing only `menu-data.js`.

**Try it:** change Romany creams 5 L from `650` to `700` in `menu.json` and refresh.

---

## 2. Shape of the data

```json
{
  "id": "romany-creams",          ← unique, never shown, used in code
  "name": "Romany creams",        ← shown to customers
  "category": "biscuits",         ← which section it goes in
  "image": "images/romany_creams.jpg",   ← or null for "Photo coming soon"
  "options": [                    ← each size and its price
    { "label": "5 L", "price": 650 },
    { "label": "10 L", "price": 1200 }
  ],
  "flavours": ["…"],              ← optional: adds a flavour dropdown
  "description": "…",             ← optional
  "quote": true                   ← optional: no price, links to the cake form
}
```

Prices are **numbers**, not strings like `"R650"`. Then you can do maths with them (totals, deposits), and you format them only at the moment of showing them (`formatPrice()` in `format.js`).

This is the same thinking as COS221: decide the schema first, and the code follows.

---

## 3. Loading the data: `fetch` + `async/await` (menu-data.js)

```js
export async function loadMenu() {
  const response = await fetch('data/menu.json');
  if (!response.ok) throw new Error(...);
  return response.json();
}
```

- `fetch` asks for a file and returns a **Promise**, a value that arrives later.
- `await` waits for it without freezing the page.
- **Gotcha:** fetch does *not* throw on a 404. You must check `response.ok`.
- In `menu-page.js`, `init()` wraps the call in `try/catch`. If loading fails, the customer sees a message and a WhatsApp button, never a blank page.

**Try it:** rename `menu.json` to `menu2.json`, reload the menu, and see the error message. Then rename it back.

**Note:** this is the second reason you need Live Server. `fetch` doesn't work on `file://` pages either.

---

## 4. Building HTML from arrays: `.map()`, `.filter()`, `.join('')`

```js
products
  .filter((p) => p.category === category.id)  // keep only this category's products
  .map(productHTML)                           // turn each into an HTML string
  .join('')                                   // glue into one string
```

It's the same pattern as the nav in Phase 1, just bigger. Most "render a list" code on the web looks like this, including in React.

---

## 5. The basket: state separated from UI

| File | Job | Knows about HTML? |
|---|---|---|
| `basket.js` | Holds the items, adds/removes them, saves them | **No** |
| `basket-ui.js` | Header badge + slide-out panel | Yes |
| `menu-page.js` | "Add to basket" buttons | Yes |
| `order-page.js` | The WhatsApp message | Yes |

They're connected with the **Observer pattern** (COS214):

```js
// basket-ui.js
subscribe(render);        // "call render() whenever the basket changes"

// basket.js
function commit() {
  save();
  listeners.forEach((fn) => fn(getItems()));   // notify every subscriber
}
```

`menu-page.js` just calls `addItem(...)`. It has no idea the badge exists, yet the badge updates. That's the point: you can add a new piece of UI that reacts to the basket without touching the menu code.

**`.reduce()`** works out the totals: `items.reduce((sum, i) => sum + i.price * i.qty, 0)`.

---

## 6. Remembering the basket: `localStorage`

```js
localStorage.setItem('ttt-basket-v1', JSON.stringify(items));   // save
JSON.parse(localStorage.getItem('ttt-basket-v1'));              // load
```

- It survives page changes, refreshes and closing the browser.
- It only stores **strings**, hence `JSON.stringify` / `JSON.parse`.
- It's per browser and per device. Thina can't see it. It's not a database.
- It's wrapped in `try/catch` because private mode or a full disk can make it throw.
- The `-v1` in the key matters: if you ever change the item shape, bump it to `-v2` so old saved baskets don't break the new code.

**Try it:** DevTools → *Application* → *Local Storage* → `localhost`. Add something to the basket and watch the value change.

**Bonus:** open the menu in two tabs and add an item in one. The other tab's badge updates too, thanks to the `storage` event at the bottom of `basket.js`.

---

## 7. Forms without a server

Each product card is a `<form>`:
- **`FormData(form)`** reads every named input (`size`, `flavour`) in one go.
- **`event.preventDefault()`** stops the browser's default behaviour, which would reload the page.
- **Pressing Enter** also submits it, for free.

**Size pills are real radio buttons.** The `<input type="radio">` is hidden visually but still there, so arrow keys, screen readers and `FormData` all keep working. CSS styles the `<span>` next to it:

```css
.size input:checked + .size__pill { … }        /* selected */
.size input:focus-visible + .size__pill { … }  /* keyboard focus */
```

`+` means "the element directly after." This is the standard way to make custom-looking radios and checkboxes without breaking accessibility.

---

## 8. Event delegation

There are 14 cards, each with an Add button and size radios, plus a basket panel whose buttons are destroyed and rebuilt on every change. Instead of attaching a listener to every button:

```js
root.addEventListener('submit', (event) => { … event.target … });
dialog.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  ...
});
```

Events **bubble** up from the clicked element to its parents, so one listener on the parent catches everything, including buttons created later. `closest()` finds which button was actually clicked.

---

## 9. The `<dialog>` element

`dialog.showModal()` gives you, with no extra code:
- a dimmed backdrop (`::backdrop` in CSS)
- focus trapped inside, so Tab can't wander behind it
- Escape to close

Clicking the backdrop counts as a click on the `<dialog>` itself (`event.target === dialog`), which is how "click outside to close" works.

---

## 10. Bugs found this phase

**1. The sticky header never stuck (since Phase 1).**
`position: sticky` only sticks *inside its parent*. The header's parent was `<div id="site-header">`, which was exactly the header's height, so there was nowhere to stick. Fix in `base.css`:
```css
#site-header { display: contents; }
```
`display: contents` removes the div's own box, so the header acts as a direct child of `<body>`.

**2. Anchor links to generated content.**
The homepage links to `menu.html#biscuits`, but the browser tries to jump there *before* JavaScript has built the section. `scrollToHash()` in `menu-page.js` does the jump again once rendering is done. `scroll-margin-top` in `menu.css` stops the sticky header from covering the heading.

**3. The phone menu was 11 000px tall.**
One full-width card per product meant endless scrolling. Below 560px, cards switch to a compact row with the photo on the left (`menu.css`, bottom). The page is now about 4 800px.

---

## 11. Exercises

1. **Add a product.** Make up "Lemon squares" in the biscuits category with three tub sizes. You don't have a photo, so use `"image": null`.
2. **Change the deposit** to 40% and find every place it updates. Then change it back.
3. **Break the menu on purpose** by adding a trailing comma after the last product in `menu.json`. What happens, and what does the Console say? (JSON is stricter than JS.)
4. **In `basket.js`, why does `getItems()` return copies** (`{ ...item }`) and not `items` itself? What could go wrong otherwise?
5. **Add a "Clear basket" button** to the panel's footer. Hint: `clearBasket()` already exists. You need one button with `data-action="clear"` and one `if` in the click handler.

Next, Phase 3: the date picker with its short-notice warning, collection or delivery, and the custom cake and class booking forms.
