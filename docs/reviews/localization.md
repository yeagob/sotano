# Review: localization

Proposal: [../architecture/LOCALIZATION.md](../architecture/LOCALIZATION.md). Owner's scope
decisions before the review: English (source) + Spanish; practices take their established Spanish
names; language auto-detected, chosen on the pause card, remembered, `?lang=es` in the URL.

**Outcome:** accepted with changes; built in the same change.

## Critique (architect) and ruling (mediator)

| # | Sev. | Critique | Ruling | Resolution |
|---|---|---|---|---|
| 1 | High | "Falls back to English" and "checked by the type system" contradict; suggests partial catalogs completed by tests, and typed placeholder params | **Reject** both changes; **now**, a doc fix | Shipped locales stay complete by type (UI messages); content is checked by tests; the runtime fallback is a safety net. Placeholder parity is tested; typed params deferred |
| 2 | High | Death causes miss `bomb`, `enemy:panic`, `volatile` (Catharsis), `console`; `explosion` is a kind, not a source | **Now** | `causeName` strips `enemy:`/`explosion:`/`item:` prefixes; items declare their own source labels in `ItemDef.causes` (Catharsis: `volatile`), so the screen names the practice. Test over every enemy id, `enemy:<id>`, item id, declared cause and fixed cause |
| 3 | High | A selector on the pause card captures the pointer (any mousedown locks it); native dropdowns fail under pointer lock | **Now** | Buttons, with a capture-phase `mousedown` handler that stops propagation, like the seed. Verified in the browser: switching keeps the game paused |
| 4 | High | Centralised item messages break "a new item works in English at once"; `api.toast(text)` lets literals through | **Now** | `ItemDef.messages` (English, in the item), `api.toast(id, params?)` bound per effect by the inventory (`HostApi.message`); translations under `content.items.<id>.messages`. Unknown id: console warning, nothing shown |
| 5 | Med-high | Numbers inside translated `effect` lines drift when balance changes | **Now** (`effect` only) | Test: same numeric tokens as English, decimal commas read as points |
| 6 | Med | Live switching leaves stale DOM (hand tooltips, items bar, floor, seed, open banner, inventory, death screen, toast) | **Now** | `Hud.relocalize()` on every change: resets caches and redraws each surface from its last inputs; the banner is not re-animated; a visible toast is hidden |
| 7 | Med | Determinism needs a guard | **Now** (tests) | A run's structure signature is identical under `en` and `es`; accessors never change definitions; the share link never carries `?lang` (commented in the HUD) |
| 8 | Med | Node testability: global `navigator` in Node 21+ makes detection machine-dependent | **Now** (pure detection, test reset); **reject** a separate DOM file | Engineer's note: `dom.ts` was kept anyway, because moving `localStorage` and `<html lang>` out of `setLocale` made the core fully DOM-free and simpler to test; it is 40 lines and changes no contract |
| 9 | Med | Escaping gaps at `innerHTML` sinks; `esc` misses `'` | **Now** | `th()` (escaped `t()`) at every sink, `esc` escapes `'`, test: no markup in any catalog |
| 10 | Med | Number formatting (fixed digits, caching, raw `m.value` in the inventory, units as messages) | **Now** | `fmtNum(v, digits)` with min = max digits, cached per locale; `STAT_INFO` replaced by `statLabel`/`fmtStat` with unit messages; inventory modifiers go through `fmtNum` |
| 11 | Low-med | Forgotten strings (boot toasts, `Loading…`, title, `???`); audit test for literals | **Now**: typed `hud.toast(key)`, `#loading` tagged. **Reject**: title, `???`. **Later**: audit test | Done; the title is the game's name |
| 12 | Low | Per-domain files; debug readout; staleness hashes; `document.title` | Per-domain files and hashes **later**; debug readout English **accepted**; title **rejected** | Listed in LOCALIZATION.md §6 |
