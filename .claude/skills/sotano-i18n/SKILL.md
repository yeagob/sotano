---
name: sotano-i18n
description: Localization discipline for The Roots. Use it EVERY time you add, change or remove any text the player can read, anywhere - HUD, toasts, banners, menus, the pause card, the inventory, the death screen, index.html, stat labels or units, item/synergy/enemy/material names, descriptions, effects or messages, damage causes - or add a new item, synergy, enemy, material, stat, damage source or language. Keeps every word in every shipped language (English source + Spanish) and the i18n tests green.
---

# The Roots localization skill

Every word the player reads must exist in **every shipped language** (today: English, the source, and Spanish). Nothing reaches the screen as an English literal. The full design is [docs/architecture/LOCALIZATION.md](../../../docs/architecture/LOCALIZATION.md); this is the checklist.

Run it for **any** change that adds or edits player-facing text, however small: a toast, a label, a button, a tooltip (`title`), a stat, a new item. Also use `sotano-docs` (and `sotano-items` for items).

## 1. Where the text goes

| You are adding… | Write the English in | Add the translation in | Show it with |
|---|---|---|---|
| UI text (HUD, toast, banner, inventory, death, pause card) | `src/i18n/locales/en.ts` `messages` (dotted key: `toast.*`, `hud.*`, `inv.*`, `death.*`…) | every other `src/i18n/locales/<code>.ts` `messages` (the build fails until you do) | `t('key', params)`; in `innerHTML` use `th('key')` (escaped); toasts: `hud.toast('key', params)` |
| Static text in `index.html` | `en.ts` + the English inline in the HTML | other catalogs | `data-i18n="key"` (text) or `data-i18n-label="key"` (CSS `attr(data-label)`) |
| An item / synergy name, description, effect, `inspiredBy` | its definition file (as always) | `content.items.<id>` / `content.synergies.<id>` in each non-English catalog | `itemText(def)`, `synergyText(def)` - never `def.name` in the HUD |
| Text an item or synergy shows while held | `messages: { <id>: '…' }` in its definition | `content.items.<id>.messages.<id>` | `api.toast('<id>', params?)` - never a literal |
| An enemy name / pattern | its file in `src/content/enemies/` | `content.enemies.<id>` | `enemyText(def)` |
| A material | `src/content/materials.ts` | `content.materials.<key>` | `materialName(id)` |
| A stat | `stat.<name>` in `en.ts` (+ unit message if new) | every catalog | `statLabel(n)`, `fmtStat(n, v)` (in `core/stats.ts`) |
| A damage source the death screen may show | an enemy/item id, or a `cause.<id>` message, or the item's `causes: ['label']` | every catalog | `causeName(source)` |
| A new path tag | `path.<tag>` in every catalog, and `PATHS` in `i18n/content.ts` | | `pathName(tag)` |

## 2. Rules

- **English is the source.** Repo, code and definitions stay English; translations live only in `src/i18n/locales/`.
- **Never** concatenate translated fragments into sentences; one message per sentence with `{placeholders}` so word order can change. Plurals: `{ one: '…', other: '…' }` with `n` (or `count`).
- **Numbers** go through `fmtNum(v, digits)` (decimal comma in Spanish), never `toFixed` into visible text.
- **No markup in catalogs** (no `<` `>`); escape at the `innerHTML` sink.
- **Effects keep their numbers**: a translated `effect` must contain exactly the English numbers. Changing a number in English means changing it in every catalog, in the same commit.
- **Names follow STORY.md in every language**: practices use the established name of the technique or public-domain work in that language (*Meditaciones*, *Cartas a Lucilio*, *Tao Te King*); never a brand or modern book title as the name. Spanish vocabulary: intention → *intención*, practice → *práctica*, projection → *proyección*, state of being → *estado de ser*, breakthrough → *avance*, floor → *piso*, seed → *semilla*. Ask the owner when a name or tone is unclear.
- **Live switching**: anything the HUD caches or draws once must redraw in `Hud.relocalize()` (store its last inputs). A new screen or panel = a new line there.
- **Not localized on purpose**: the debug readout, the `S` console, console warnings, the game's name.
- **Localization never touches the simulation**: never branch on a translated string, never mutate a definition, never put `?lang` in a seed or link.

## 3. Adding a language

Copy `src/i18n/locales/es.ts`, translate everything, list it in `src/i18n/locales/index.ts`. Check the font covers its script. Run the tests: they list every missing item, synergy, enemy, material and message.

## 4. Before you commit

- [ ] No new English literal reaches the DOM (grep your diff for `textContent =`, `innerHTML`, `title =`, `toast(`).
- [ ] Every new key / entry exists in every catalog; placeholders match English.
- [ ] Switched language live in the browser (`?lang=es` or `S.lang('es')`) and checked the new text in both languages, including long Spanish strings fitting the layout.
- [ ] `npm run typecheck && npm test` (`tests/i18n.test.ts` covers completeness, placeholders, numbers, markup, causes, determinism).
- [ ] Docs: LOCALIZATION.md if the mechanism changed.
