# Black heart

One more heart, drawn in soot-black after the containers, lost for good once it is spent. It follows the blue heart's rules exactly.

Part of [kinds of heart](README.md). Issue #154.

## What the player sees and feels

- A heart with the red one's shape, in soot-black with a pale glint. Walking into it adds one extra heart of 100 health after the containers, even at full health.
- Hits take it before the red health, after any extra heart picked up later and before any picked up earlier (the most recently picked up extra heart first).
- When it is spent it bursts, a toast says it is gone, and it never comes back: no heal refills it.
- It is not halved by a stone heart under it, does not start the berserker frame, and does not heal over time: the blood and stone hearts keep their own rules.
- It is rare: 1 % to 2 % of heart drops, drawn per floor from the seed (see the table in [the README](README.md)).

## Decisions taken without the owner

- Its meaning and story sentence are not settled. The owner should name it and confirm the look (the art ledger, DECISIONS §10.6, lists it as proposed).
- The chance range is a proposal: 1 % to 2 %, the rarest of the common kinds, rarer than blue and stone.

Code: `src/entities/hearts.ts` (`LayerKind`, `isLayer`, `hasLayerRoom`, `landHit`), `src/content/tables/hearts.ts` (the chance range and the roll), `src/content/heart-art.ts` (the look and the pickup), `src/content/palette.ts` (`heart.black.*`), `src/content/hud-icons.ts` (`heartBlack`), `src/game/game.ts` (`collectHeart`, `heartLost`), `src/audio/sfx.ts` (`sfxHeart.black`).
