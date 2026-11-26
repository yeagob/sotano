# Stretch

Up: [body](README.md) · Status: built in the code, not yet in the catalogue (waiting for the owner's credit, `inspiredBy`).

Stretch is a body practice (quality 1, treasure rooms). Its effect is the `magnet` stat: 3 blocks.

- Keys, bombs and hearts lying on the floor within the magnet's reach fly to the player's chest at 9 blocks a second, after their pop-in.
- Practices (items on pedestals) and parts are never pulled.
- Once it reaches the body, the usual touch rules decide whether it is taken. A heart is pulled even at full health; it is taken as any heart is.

The path it is filed under is body until the seven chakras are built ([#362](https://github.com/yeagob/sotano/issues/362)).

Code: `src/content/items/stretch.ts`, `src/core/stats.ts` (`magnet`), `src/game/game.ts` (`pullPickups`).
