# Localization (i18n)

How every word the player reads gets into their language. English is the **source language**
(the repo, the content definitions and the default catalog are English); Spanish is the first
translation. Reviewed in [../reviews/localization.md](../reviews/localization.md).

## 1. Goals and rules

- **Every player-facing string goes through the localization layer.** HUD, banners, toasts, the
  landing and pause card, the screen (menu and practices), the death screen, stat labels and values, item, synergy,
  enemy and material texts, and messages raised by items. No English literal reaches the DOM.
- **Developer-facing text stays English and is not localized**: the debug readout (top right),
  console warnings, the `S` debug console, `docs/`, code comments.
- **Missing translations never break the game.** Shipped locales are complete by type: every
  UI message key is required (`messages: Record<MessageKey, Message>`), so a missing one stops
  the build. Content (items, synergies…) is checked by the tests. At runtime, anything missing
  falls back to English: a safety net, never the plan. A key missing from English is a type error.
- **Adding a language is data only**: one catalog file and one line in the locale list. The
  tests then list every string it still lacks.
- **Switching language is live**: no reload, no lost run.
- **Localization never touches simulation.** It reads ids and numbers; it never feeds back into
  stats, events, seeds or RNG. Changing language mid-run cannot change the run.

## 2. Pieces

```
src/i18n/
  index.ts        t(), fill(), fmtNum(), the current locale, setLocale(), onLocaleChange(),
                  detectLocale(env) (pure). DOM-free: tests import it in Node
  dom.ts          the browser side: browserLocale(), chooseLocale() (saves the choice),
                  applyDom() for data-i18n attributes, initDom() (called first in main.ts)
  content.ts      itemText(def), synergyText(def), enemyText(def), materialName(id),
                  pathName(tag), effectMessage(owner, id), causeName(source): content texts
                  by id, with English fallback
  locales/
    index.ts      LOCALES: the list of shipped locales (code, native name, catalog)
    en.ts         the source catalog: UI messages (flat keys) + content (by id). Typed `as const`
    es.ts         Spanish: same shape, checked against en by the type system and the tests
```

### 2.1 Messages

UI messages live in a flat map of dotted keys (`'hud.floor'`, `'toast.roomClear'`,
`'death.title'`). A message is a string with named placeholders, or a set of plural forms:

```ts
'hud.floor': 'Floor {n}',
'inv.held': { one: '{n} held', other: '{n} held' },
```

- `t(key, params?)` returns the message in the current locale; `{name}` placeholders are
  replaced by `params.name` (numbers formatted for the locale). Keys are typed
  (`MessageKey = keyof typeof en.messages`); an unknown key is a compile error. Placeholder
  names are not typed (a wrong one only shows `{n}`); the tests check every locale uses the same
  placeholders as English.
- Plural forms are selected with `Intl.PluralRules` for the current locale using
  `params.count ?? params.n`. Forms are CLDR categories; only `other` is required.
- `hud.toast(key, params?)` takes a message key, never text: an English literal cannot reach a
  toast without a type error.
- **Catalogs never contain markup** (tested: no `<` or `>`). Results are plain text: the HUD
  escapes them at every `innerHTML` sink (`th(key)` = escaped `t(key)`; `esc` also escapes `'`).

### 2.2 Content texts

Items, synergies, enemies and materials keep their English text in their own definitions (the
`ItemDef.name/description/effect` fields stay the source of truth, so a new item is playable in
English the moment it is written). Translations are keyed **by id** in each catalog:

```ts
content: {
  items: { stoic: { name: 'Resolución estoica', description: '…', effect: '…' } },
  synergies: { lucid: { name: 'Lúcido', description: '…' } },
  enemies: { doubt: { name: 'Duda', pattern: 'Inseguridad' } },
  materials: { stone: 'Piedra' },
  paths: { body: 'cuerpo', … },
}
```

The HUD never reads `def.name` directly: it calls `itemText(def)`, which returns the current
locale's fields with each missing field falling back to the definition's English text.
`inspiredBy` credits real titles: a locale may give it (classic works have established
translated titles: *Meditaciones*), otherwise the original credit is shown.

**Item and synergy messages.** An effect that shows text declares it in English in its own
definition, by id, and raises it by id:

```ts
messages: { lock: 'The lock gives way to a good question' },
hooks: [hook('doorOpen', (e, api) => { … api.toast('lock'); })],
```

The inventory binds `api.toast` to the effect that raises it (like `rng` and `defer`), so an
item never names itself. Translations live under `content.items.<id>.messages.<msgId>`. An
unknown id logs a console warning and shows nothing; it never throws.

### 2.3 Numbers and units

Stat values are formatted through the locale (`fmtNum(v, digits)` uses `Intl.NumberFormat`:
`1.25` in English, `1,25` in Spanish). Units and words inside stat values (`blocks`, `s`,
`tier ≤ n`, `none`) are messages too. `STAT_INFO` keeps only the format *shape* (digits, unit
key); labels come from `stat.<name>` messages.

### 2.4 Choosing the language

`detectLocale({ search, saved, languages })` picks, in order: `?lang=xx` in the URL, the saved
choice (`localStorage`, wrapped in try/catch), the browser languages (`navigator.languages`,
matched by primary subtag: `es-AR` → `es`), English. It is pure; `browserLocale()` in `dom.ts`
feeds it. The pause card shows one **button** per locale with its native name
(`English · Español`); a capture-phase `mousedown` handler (like the seed's) stops the click from
capturing the mouse, so choosing a language keeps the game paused. The choice is saved, applies at
once and sets `<html lang>`. `?lang` is never part of the seed or the share link.

### 2.5 Static HTML

Text in `index.html` carries `data-i18n="key"` (text content) attributes; `applyDom()` fills them
on start and on every locale change. The HTML keeps the English text so the page reads correctly
before scripts run.

### 2.6 Live switching

`onLocaleChange(fn)` subscribers re-render: `applyDom`, and `Hud.relocalize()`, which resets the
hand-slot cache (material names in tooltips), redraws the items bar, floor label, seed text,
language selector, and whatever is open (banner without replaying its entrance animation,
inventory, death screen) from their last inputs. A visible toast is simply hidden.

## 3. Death cause

The death screen names what overcame you. `source` is an id string from the damage pipeline:
an enemy id (`doubt`, contact), `enemy:<id>` (Panic's burst), `judgement` (the Critic's
projectile), `bomb` (your own), an item id, a label an item passes to `explode`/`damagePlayer`
(`volatile`), `item`, `console`. `causeName(source)` strips `enemy:`/`explosion:`/`item:`
prefixes, maps enemy ids to their localized name, item ids **and the labels an item declares in
`ItemDef.causes`** to the item's name, known causes to `cause.<id>` messages, and anything else to
`cause.unknown`. (Before this layer, the raw id was printed.)

## 4. Tests (`tests/i18n.test.ts`)

- Every locale has every message key of English, with the **same placeholders** and an
  `other` form for plurals; no locale has keys English lacks (stale keys).
- Every shipped locale other than English translates **every** item, synergy, enemy and
  material (`name`, `description`, `effect` and `messages` for items); no entry names an id that
  doesn't exist.
- Translated `effect` lines contain **the same numbers** as English (decimal commas read as
  points), so a balance change in English cannot leave a translation with old numbers.
- Content accessors never change a definition; a run built under `en` and under `es` has the
  same structure signature (the language never changes a run).
- `t()` falls back to English for a missing key, fills placeholders, selects plurals; numbers
  and stat values follow the locale (`5,0 bloques`).
- `detectLocale()` honours URL > saved > browser > English and matches by primary subtag.
- No localized string is empty or contains markup.
- Every damage source the game uses (enemy ids, `enemy:<id>`, item ids and declared causes,
  fixed causes) names a cause in every locale.

## 5. Adding or changing text

- **New UI text**: add the key to `en.ts` and every other locale; use `t('key')`.
- **New item / synergy / enemy / material**: write the English in its definition as usual,
  then add its entry to every non-English catalog (the tests fail until you do). An item that
  shows text adds `messages`; one that passes its own source label to `explode` or
  `damagePlayer` lists it in `causes`.
- The full checklist is the project skill
  [`sotano-i18n`](../../.claude/skills/sotano-i18n/SKILL.md).
- **Changing an English text**: change the translations in the same commit.
- **New language**: copy `es.ts`, translate, list it in `locales/index.ts`. Fonts: the HUD uses
  the system monospace stack, which covers Latin scripts; other scripts need a font check.

Naming rules from [STORY.md](../design/built/story/README.md) apply in every language: practices use the
established name of the technique or public-domain work in that language (*Meditaciones*,
*Cartas a Lucilio*, *Tao Te King*); never a brand or a modern book title as the name.

## 6. Deferred (from the review)

- **Typed placeholder params** (template-literal types): only if a wrong placeholder name ever
  ships; the parity test covers it today.
- **Audit test for literals** passed to `innerHTML`/`textContent`: when a third locale arrives or
  the first English leak is reported (toasts are already typed).
- **Per-domain catalog files** (`locales/es/items.ts`…): when a catalog passes ~600 lines or a
  third locale arrives.
- **Staleness detection** (an English hash stored next to each translation): when someone other
  than the developer translates.
- Right-to-left scripts and CJK fonts (no such locale planned); physical-key labels for other
  keyboard layouts (AZERTY).
- Translator tooling (export/import to a spreadsheet or PO files): the catalogs are plain data,
  so a script can do it when a translator needs it.
- Localized audio (no voice in the game).

Not localized on purpose: the debug readout (top right) and the `S` console, the game's name
(`<title>`, the logo), and the `???` of undiscovered synergies.

## Search metadata

The browser tab title and the search description are localized too: `seo.title` and `seo.description`
are set by `applyDom()` (`src/i18n/dom.ts`) on every language change. The static head of `index.html`
keeps English, and what crawlers read is described in [DISCOVERABILITY.md](DISCOVERABILITY.md).
