# Kicking and throwing

A loose cube can be kicked along the ground when your hand is full, or thrown from your hand. A flying cube hurts the projections it hits.

Part of [blocks](README.md).

## What the player sees and feels

- **Kick.** You walk into a loose cube with a full hand: it flies forward, along your run if you are moving. A kicked cube cannot be kicked again for about half a second.
- **Throw.** The top block of your hand flies forward from your eye, with your own motion added and a little lift. A thrown cube cannot be picked up again for six-tenths of a second.
- A cube that hits a projection hurts it, if it is flying fast enough and toward it. The cube bounces back, so one pass hits once.
- The damage depends on the material: dirt barely bruises, a tough block hits hard, and obsidian hits about as hard as two or three intentions. Speed scales it, up to one and a half times at high speed. A heavy flag adds nothing.
- Bombs are not thrown, and a flying bomb does not hit projections; it has its own blast ([BOMBS.md](BOMBS.md)).

## The rule behind it

The design makes the kick a combat mechanic, not just an inconvenience: a kicked block hurts enemies, and more if it is heavy ([DESIGN.md, section 6](README.md)). The built damage follows the material's hardness and speed; it has no heavy bonus.

Code: `src/game/game.ts` (the kick, lines 1692-1728; the throw, lines 1953-1980; a flying cube hitting a projection, lines 1640-1660), `src/core/damage.ts` (the damage of a cube by its material and speed, lines 21-25).

## Numbers

- Kick: about four and a half blocks a second, plus one and three-tenths of your own speed, times the kick stat; lift three and two-tenths. Cooldown: about half a second.
- Throw: nine blocks a second, times the throw stat; lift two; cooldown six-tenths of a second.
- Damage of a cube at nine blocks a second: about three and a half points for dirt, about eight and a half for obsidian.

## Open questions

1. **Heavy blocks hurt more.** The design says a kicked block hurts enemies, more if it is heavy ([DESIGN.md, section 6](README.md)). The built damage has no heavy bonus, and the heavy flag is read by nothing (`src/core/damage.ts`, lines 21-25; see [MATERIAL-FLAGS.md](MATERIAL-FLAGS.md)). Should heavy blocks hit harder?
