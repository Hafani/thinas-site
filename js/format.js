/* =========================================================================
   format.js — small helpers for showing values to people.
   ========================================================================= */

/* formatPrice(1350) → "R1 350"
   toLocaleString('en-ZA') adds South African digit grouping (a space).
   We build the string ourselves because the built-in currency format
   gives "R 1 350,00", which looks wrong on a bakery menu. */
export function formatPrice(amount) {
  return 'R' + Math.round(amount).toLocaleString('en-ZA');
}

/* "5 L" → "5 L tub", "12" → "12 cupcakes"...
   Used so the basket reads naturally ("Romany creams, 10 L tub"). */
export function describeOption(label) {
  return label.endsWith('L') ? `${label} tub` : `box of ${label}`;
}
