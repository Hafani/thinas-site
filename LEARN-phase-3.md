# Phase 3: forms that send to WhatsApp

Three forms (order details, custom cake, class booking) share one engine: `js/forms.js`. Read this with that file open.

---

## 1. One engine, three forms (Strategy pattern)

Every form on the site does the same five things:

1. Sets up date fields (earliest date = tomorrow, short-notice warning)
2. Shows or hides fields (the delivery address only appears for delivery)
3. Updates the live preview as you type
4. Validates when you press Send, and shows errors
5. Opens WhatsApp with the message

The **only** thing that differs per form is *what the message says*. So each page passes in its own `buildMessage` function:

```js
setupWhatsAppForm({
  form: document.getElementById('cake-form'),
  preview: document.getElementById('cake-preview'),
  buildMessage: (data) => `Hi Thina! Custom cake request…`,   // ← the "strategy"
});
```

That's the Strategy pattern from COS214. The page files (`order-page.js`, `custom-cake-page.js`, `classes-page.js`) are short because all the shared work lives in `forms.js`.

**Try it:** add a fourth form, say a "General question" page with name and message fields. You only need the HTML and a 10-line `buildMessage`.

---

## 2. The form HTML is written by hand, on purpose

In Phase 2 the menu was generated from data. These forms are plain HTML in the `.html` files. Why the difference?

- The **menu** changes (prices, products), so it comes from data.
- The **form fields** never change, so typing them out is simpler and easier to read.
- The bits that *do* change are still data-driven: cake flavours and class names/prices come from `menu.json`.

**Rule of thumb:** generate from data what changes. Hard-code what doesn't.

---

## 3. Reading a form: `FormData` → plain object

```js
for (const [key, value] of new FormData(form)) { data[key] = value.trim(); }
// → { name: 'Lerato', date: '2026-11-21', method: 'delivery', address: 'Hatfield' }
```

- Only fields with a `name` attribute are included.
- **Disabled fields are skipped.** That's why the hidden address field is also *disabled*: a collection order never sends an old address.
- An unticked checkbox isn't included at all, so `data.recommend` is `undefined`, and `data.recommend && "…"` adds nothing to the message.

---

## 4. Building the message: `joinLines`

```js
joinLines([
  'Hi Thina! Order request 🧁',
  data.name && `Name: ${data.name}`,   // empty name → '' → dropped
  '\n',                                 // a deliberate blank line
  ...items.map(...),                    // spread the item lines in
]);
```

`a && b` returns `a` if it's falsy, otherwise `b`. So `data.note && \`Note: ${data.note}\`` becomes either the line or `''`, and `joinLines` drops empties. This keeps unanswered optional fields out of the message without a pile of `if`s.

---

## 5. Validation: let HTML describe the rules

The rules live in the HTML:

```html
<input name="people" type="number" min="1" max="10" required data-label="The number of people">
```

The browser checks them for us (the **Constraint Validation API**):
- `field.checkValidity()` → true or false
- `field.validity.valueMissing`, `.rangeUnderflow`, `.rangeOverflow` → *why* it failed

We set `form.noValidate = true` to switch off the browser's own pop-up bubbles (they look different everywhere), then show our own message under each field. `data-label` lets us write a specific message: "Enter the number of people", not a generic "Please fill in this field".

**Accessibility:** invalid fields get `aria-invalid="true"` and `aria-describedby` pointing at the error, so screen readers read the error with the field. Focus jumps to the first problem.

**Why "Choose" vs "Enter"?** Radios and dropdowns are *chosen*. Text boxes are *typed into*. Error messages should tell people exactly what to do.

---

## 6. Dates: the timezone trap

`<input type="date">` gives `"2026-11-21"`, in **local** time. Two tempting shortcuts are both wrong in South Africa (UTC+2):

```js
new Date().toISOString().slice(0, 10)  // ✗ UTC date: before 2am it's YESTERDAY
new Date('2026-11-21')                 // ✗ parsed as UTC midnight = 2am local
```

So `forms.js` builds dates from local parts (`getFullYear()`, `getMonth()`, `getDate()`). The bug would only show up between midnight and 2am, which is exactly the kind of bug that survives testing and annoys a real customer.

**Short notice** = fewer than 2 calendar days away (from `SITE.noticeHours` in `config.js`). It **warns, it doesn't block**, because your mom decides. The message even says "(short notice, I know!)" so she sees it immediately.

We also format dates ourselves ("Sat 21 Nov 2026"), because `toLocaleDateString` output differs between browsers. Chrome gave us "Fri 04 Dec" with a stray zero.

---

## 7. Show/hide with `data-show-when`

```html
<div data-show-when="method=delivery" hidden> …address… </div>
```

`forms.js` reads the attribute, checks the current value of `method`, and toggles `hidden` **and** `disabled`. Any form can use this without new JavaScript. Want a "How did you hear about us?" box that appears for "Other"? Add one attribute.

**CSS gotcha:** `[hidden]` normally means `display: none`, but a class like `.field { display: grid }` would override it. `base.css` now has `[hidden] { display: none !important; }`, one of the few good uses of `!important`.

---

## 8. A submit button outside its form

On desktop, the Send button sits in the right-hand column, outside the `<form>`. It still works because of:

```html
<button type="submit" form="order-form">…</button>
```

The `form` attribute links a button (or any input) to a form by id, wherever it is in the page.

---

## 9. The bug we hit: a click that went missing

**Symptom:** fix the address field, then click the checkbox, and the checkbox doesn't tick.

**Cause:** `change` fires when you *leave* a field, which is the exact moment you click the next thing. Our code removed the address's error message on `change`, so everything below jumped up about 20px **between mouse-down and mouse-up**, and the click landed in the wrong place.

**Fix:** clear an error on `input` (while typing), as soon as the field becomes valid. By the time you click away, nothing moves.

This is a **layout shift** bug. Google measures these on real sites (it's called CLS) because they make people mis-click. A good habit: never move things around at the moment someone is clicking.

---

## 10. Sending: `window.open` and pop-up blockers

```js
window.open(whatsappLink(message), '_blank', 'noopener');
```

Browsers block pop-ups unless they come directly from a click or submit, which this does. On a phone, a `wa.me` link opens the WhatsApp app. On a laptop it opens WhatsApp Web or the desktop app.

**We can't know if they pressed Send in WhatsApp.** That's why the basket isn't cleared automatically. The customer clicks "I've sent it, clear my basket" themselves.

---

## 10b. One flavour per tier: UI built from state

Pick "2 tiers" and you get two flavour dropdowns. Pick "3 tiers" and you get three. `custom-cake-page.js` does this:

```js
const TIER_LABELS = {
  '2 tiers': ['Bottom tier', 'Top tier'],
  '3 tiers': ['Bottom tier', 'Middle tier', 'Top tier'],
};
```

The size radio is the **state**. The dropdowns are **derived** from it and rebuilt when it changes, the same idea as the basket in Phase 2. Three details worth reading in the code:

- **Choices are kept by tier name, not position.** Going from 2 to 3 tiers keeps Bottom and Top and adds an empty Middle. Matching by index would have pushed the top flavour into the middle.
- **Listener order matters.** The page's `change` listener (rebuild the dropdowns) is added *before* the engine's (refresh the preview), so the preview sees the new dropdowns.
- **Same flavour on every tier?** The message says it once: "Flavour: Carrot (all tiers)".

**CSS gotcha:** grid items have `min-width: auto`, so a `<select>` won't shrink below its longest option ("Not sure, please recommend one"), and three of them overflowed the row. `min-width: 0` on the grid item fixes it. You'll meet this one again with long words in flex and grid layouts.

---

## 11. Exercises

1. **Add a "Cupcake tower" option** to the cake size choices. HTML only, and the message updates with no JS changes. Why does it just work? Then see how the "Other" occasion box works: it's a `data-show-when="occasion=Other"` block, with no new JavaScript.
2. **Make "Budget" required** for wedding cakes only. Hint: you'll need a new `data-show-when` block, or a small check in `custom-cake-page.js`.
3. **Change `noticeHours` to 72** in `config.js`. Which warnings and texts change? Then search the project for "48": it's still in the `<meta name="description">` tags. Why can't JavaScript fix those? (Hint: who reads that tag, and do they run your JS?)
4. **Remember the customer's name:** save it to `localStorage` when they send a form, and pre-fill it next time on all three forms. Which file should that code go in, and why?
5. **Break it:** set your computer's clock to 00:30 and pick "tomorrow" on the order form. Does the short-notice warning still behave? (It should, thanks to section 6.)

**Next, Phase 4:** your mom edits prices and products in a Google Sheet, and the site reads them, so she never has to touch code.
