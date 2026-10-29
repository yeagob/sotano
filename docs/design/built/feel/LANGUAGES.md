# Languages

Up: [built feel](README.md)

The game is in English and Spanish. English is the source: every message key is defined first in English, and the other language must have the same keys and placeholders. Code: `src/i18n/`.

## Which language is chosen

The language is chosen, in this order, by the first one that is available:

1. The `lang` parameter in the address (for example, a link that asks for Spanish).
2. The language the player saved on the pause card, kept in the browser's local storage.
3. The browser's language list, in order.
4. English.

The saved choice is written only if storage allows it; a blocked or private window simply does not remember it. Code: `src/i18n/index.ts` (the detection) and `src/i18n/dom.ts` (the storage).

## The catalogues

- **English** (`src/i18n/locales/en.ts`) is the source catalogue. It holds 269 message entries. The content texts (items, synergies, enemies, materials) are defined beside their own definitions, not repeated here.
- **Spanish** (`src/i18n/locales/es.ts`) holds 291 keys by a grep count. The difference is its content section, where the items, synergies, enemies and materials are keyed by their identifiers.
- These numbers were counted by grep, not by a test, and they are not the same as an earlier diff count (263 and 275). The i18n test is the authority on whether the keys match.

## Translating

- The Spanish vocabulary: intention becomes intención, practice práctica, projection proyección, state of being estado de ser, breakthrough (the bomb) avance, floor piso, seed semilla.
- Practices keep the established Spanish name of the technique or of the public-domain work, and the credit stays in English. (The rule is in the localization architecture document.)
- The static page (`index.html`) is mostly static text with translation attributes. Its English is the fallback, and the page is translated when it loads.
- When the language changes, the HUD, the banners, the death screen and the lesson tablets are redrawn in the new language.

## Open questions

- None recorded for the languages as built. Only English and Spanish are in the code.
