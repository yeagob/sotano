# Plain Tonic

Up: [recipes](README.md) · built. Name and numbers are proposals the owner has not confirmed; the open questions are in [potions: open questions](../../../not-built/practices/potions/OPEN-QUESTIONS.md#built-recipes).

The fallback brew: a bulb with nothing captive in it. A brew is never nothing, and this is the smallest gift. Since issue #259 every bulb with a part brews a named recipe, a variant of its type or an Echo ([TYPES-AND-VARIANTS](TYPES-AND-VARIANTS.md)), so the Plain Tonic is rare.

- **Path:** body.
- **Bulb:** no part at all: one to three blocks, ice, or both.
- **Effect:** restores half a heart.
- **Duration:** instant.
- **Why it stays scarce:** It spends a whole brew for the smallest gift, and any part in the bulb makes something better.
- **An empty bulb** does not brew: an intention on it does nothing and spends nothing.

Code: `src/content/potions.ts` (the effect) and `src/content/recipes.ts` (the bulb).
