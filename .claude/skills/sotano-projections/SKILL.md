---
name: sotano-projections
description: How The Roots' projections (enemies) and bosses are defined, how their colour tier (Black, Yellow, Red) is applied, and how to test both. Use it EVERY time a projection or a boss is added or changed (its file in src/content/enemies/ or src/content/bosses/, its stats, behaviour, model, drops or elements), and every time the tier layer (src/enemies/tiers.ts), its numbers, its chances, its look or its spawn roll changes. Also use sotano-art (anything visible), sotano-i18n (names), sotano-lore (names and meaning), sotano-docs and sotano-design.
---

# The Roots projections skill

A **projection** is a pattern that blocks intention, given a body of the room's own matter (design: [docs/design/built/projections/README.md](../../../docs/design/built/projections/README.md)). A **boss** is the large pattern behind the small ones ([built/bosses](../../../docs/design/built/bosses/README.md)). Both are `EnemyDef` data plus a behaviour, and both can rise in a **colour tier** ([TIERS.md](../../../docs/design/built/projections/TIERS.md)).

## 1. How a projection is defined

- **One file per projection** in `src/content/enemies/<id>.ts`, exporting `defineEnemy({...})`, listed in `src/content/enemies/index.ts`. Bosses: `src/content/bosses/<id>.ts`, listed in `BOSSES` (`src/content/bosses/index.ts`) and in a zone's pool.
- **The type** is `EnemyDef` (`src/enemies/types.ts`): `id`, `kind` (`projection` by default, `boss`, `creature`), `name`, `pattern`, `hp`, `speed`, `size` [half width, height], `contactDamage`, `cost` (its share of a room's budget), `minFloor`/`maxFloor`, `behaviour`, `drops`, `elements`, `shell`, `breaks`, `split`, and `model`.
- **Behaviour** comes from `src/enemies/behaviours.ts` (walker, leaper, charger, flyer, phaser, ranged, burst, emitter...), moves and strikes from `moves.ts` and `attacks.ts`, navigation from `flowfield.ts`; the runtime is `src/entities/enemies.ts`. A behaviour hurts only through `ctx.strike`, `ctx.bolt`, `shoot`, `rain`, `rockfall` or `burst`, so the tier's damage reaches every hurt. Never hurt an actor directly from a behaviour.
- **The model** is a list of boxes in texels (`TX` = 1/16 block): whole texels, palette tokens only (`pal('...')`), one family eye (a 2 × 2 `cold.white` light, `glow: true`, named `tell` when it telegraphs), sockets and flush marks as `inlay: true`, a part named `head` when it has one (the tier's thorns ride on it). Art rules: the `sotano-art` skill and DECISIONS §8.
- **Its document** goes in `docs/design/built/projections/<ID>.md` (or `not-built/`), indexed in that folder's README; its name and text in every language (`content.enemies.<id>`, `sotano-i18n`); its meaning through `sotano-lore`.
- **Where it spawns**: the room's roster is rolled from its seed (budget, `minFloor`/`maxFloor`), each spawn announced by an omen, and every spawn goes through `Game.spawnEnemy`. Never spawn a hostile projection another way: the tier, the rooted roll and the `enemySpawn` event live there.

## 2. Its tier

The tier is a **layer over any definition**, never a new projection. All of it is in `src/enemies/tiers.ts`:

| What | Where | Rule |
|---|---|---|
| The numbers | `tierMultipliers(def, tier)` | **The single source** for projections and bosses. `TIER_MULTIPLIERS`: Yellow hp ×1.5, damage ×1.25, speed ×1.2, climb +1 block; Red hp ×2.5, damage ×1.5, speed ×1.4, climb +2. `BOSS_TIER_MULTIPLIERS`: health only, Yellow ×1.25, Red ×1.5. Never copy a number elsewhere. |
| Who takes one | `tiered(def)`, `TIERLESS` | Projections and bosses. Never creatures, never the Shadow (it mirrors the player, #339). A new boss that must not tier goes in `TIERLESS`. |
| The chance | `tierChances(floor, difficulty)` | Yellow = d × (5 % + 2.5 % × (floor − 1)); Red = d × 1.5 % × max(0, floor − 3); floor clamped 1–13; floor 0 none. `difficulty` is the run's global difficulty (#352, `difficultyOf` in `src/enemies/difficulty.ts`, 1 + min(level, 100) / 100), passed by `Game.spawnEnemy`; `BASE_DIFFICULTY` = 1 is level 0. A higher difficulty only widens the bands: never lower a seed's tier. |
| The roll | `spawnTier(rng, floor, room, seq, def)` | One draw on `fork('floor', f, 'room', r, 'tier', seq)`: its own fork, so no other stream moves. Same seed, same tiers. |
| The stats | `tierStats(def, tier, baseHp)` | Applied in `Game.spawnEnemy` before `enemySpawn`, after the rooted multiplier or the floor's boss health. |
| In play | `Enemy.tier`, `climb`, `power` | `power` multiplies every hurt; `climb` adds blocks to the step hop, the flow field's step (`climbOf`) and the leap's apex (`leapAir`). |
| The look | `tierModel`, `paintBody`, `tierMarks`, `allyColor`, `paintAllied` | Yellow body `tier.yellow.*` (loud yellow) with two horns, Red body `tier.red.*` with a crown of three; eyes, tells and inlays keep their colours. The horns and the crown are the colour-blind cue. An ally of any tier is the full inversion of every part's colour (`allyColor`, applied only through `paintAllied`), with no glow on top; it keeps its shape, thorns and tier's numbers. Ledger: DECISIONS §14.6. |
| The name | `tier.<tier>` and `tier.named` messages | The death screen names a Yellow or Red cause (`tieredCause`). Both languages. |
| Optional | `FALTER_ENABLED` | The falter after a Red release is coded and **off**, pending the owner. Do not turn it on without the owner. |

When you add or change a projection, check that the tier still makes sense for it: a model with no `head` gets its thorns on its highest middle part; a behaviour with its own run speed keeps that speed; a new way to hurt must read `e.power`.

## 3. How to test it

- **Rules** (no browser): `tests/tiers.test.ts` covers the exact multipliers for projections and bosses, the chances at floors 1, 3, 4 and 13 at difficulty 1 and 2, the determinism of the roll and its own fork, the Shadow and creatures never tiering, the climb on the flow field and on a real walker, the leap's height and landing, the body ramps, the inverted ally and its relapse, the mended ally's tier, the falter off by default, and the names. Add a case there for any new tier rule.
- **A new projection**: its own test if it has a rule of its own; `tests/projection-health.test.ts` (health), `tests/art-content.test.ts` (palette, eye, silhouette) and `tests/i18n.test.ts` (names) must stay green.
- **The look**: `?gallery=enemies&tier=all&ally=1` (add `&id=<id>` for one projection, `&filter=grey|deutan|protan|tritan` for the checks) shows Black, Yellow and Red, hostile and allied, on two floors. Run the art gate (`sotano-art` §3) on any change to the look.
- **In a room**: the debug console (`S.game`, `docs/architecture/OVERVIEW.md`) spawns and inspects projections; check a tiered one climbs, hurts and reads as it should.
- **Before committing**: `npm run typecheck && npm test`; docs updated in the same change (TIERS.md for any tier change, the projection's document, ENTITIES.md and RNG.md if a seed path changes).
