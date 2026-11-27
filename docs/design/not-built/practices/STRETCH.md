# Stretch

Up: [practices (not built)](README.md) · [built design](../../built/README.md)

Status: built in code (`src/content/items/stretch.ts`); this document waits here until the owner accepts it, then it moves to `built/practices/body/`.

Stretch is a body practice (quality 1, treasure rooms), inspired by yoga and its stretching postures (`docs/lore/SOURCES.md`). Its effect is the `magnet` stat: 3 blocks. It counts toward the state of being Embodied, as a body practice.

- Keys, bombs and hearts lying on the floor within the magnet's reach fly to the player's chest at 9 blocks a second, after their pop-in.
- Practices (items on pedestals) and parts are never pulled.
- Once it reaches the body, the usual touch rules decide whether it is taken. A heart is pulled even at full health; it is taken as any heart is.
- Positive outcome: the player gains what is already on the floor without walking back for it.
- Recipe: none yet; the crafting table is open (issue #112).

The path it is filed under is body until the seven chakras are built ([#362](https://github.com/yeagob/sotano/issues/362)).

Code: `src/content/items/stretch.ts`, `src/core/stats.ts` (`magnet`), `src/game/game.ts` (`pullPickups`). Sandbox: `src/sandbox/scenarios/stretch-pull.json`, `stretch-out-of-reach.json`.
