# Blocks the player makes (law 3.2, built)

Up: [The laws of the sky (built)](README.md)

A block the player places in the sky is theirs: it stands until a positive intention takes it away.

## What the player sees and feels

- A block the player places in the sky is marked as placed. Only placed blocks are the player's; nothing of the sky's own world is.
- Bombs, contact, negative shots and every hindrance leave a placed block whole. A hindrance never changes a placed cell (the shared rule of [abilities](../abilities/README.md)).
- A **positive** shot, or a positive weapon stroke (blade, beam or great cut), that touches a placed block removes it for good, with gold dust and no loose cube back (provisional, owner, 2026-11-03).
- A tower knocked down by a deity is the one other way a placed block leaves: it falls as loose cubes the player can gather again ([OUTSIDE-WATCH](OUTSIDE-WATCH.md)).

## The rule

Blocks the player creates are not original: they can be destroyed for good, and only with a positive intention (owner). What a negative shot does to a placed block, and whether a placed block can be lost in any other way, are open in [not-built/sky](../../../not-built/sky/README.md) section 5.

Code: `src/sky/laws/ownership.ts` (the damage hook); the positive removal is `SkyRealm.positiveHitsBlock` in `src/sky/sky-realm.ts`, reached from the shot and the weapon host in `src/game/game.ts`; tests in `tests/sky-laws.test.ts` and `tests/game-realm-passage.test.ts`.
