# Death and starting again

What happens when the player's health reaches zero, and how a new run begins.

Part of [the player](README.md).

## What the player sees and feels

- When your health reaches zero, the world stops, the pointer is released and a death screen appears.
- The death screen shows how deep you got, the practices you held, what killed you, the seed of the run and a button to start again.
- The button on the death screen starts a new run at once. The confirm key starts one only after a grace of about a second and a fifth.
- R starts a new run at any moment, even while you are alive. The screen fades to black for under half a second, the new world is built while it is dark, and the screen comes back only when the new world's meshes are ready, or after two seconds at most, so nothing pops in.
- There is no respawn point. Death ends the run; the next run starts from the top.
- A death can be cancelled by an event; a cancelled death keeps you alive at one point. No practice does this yet: see [not-built/player/SECOND-CHANCE.md](../../not-built/player/SECOND-CHANCE.md).

## The rule behind it

The design text says R starts a new run behind a short fade, so that the player never sees the world assemble ([DESIGN.md, section "Surface, sky and new runs"](../levels/README.md)). That the death ends the run, with no respawn, is what the code does; the design does not state a respawn rule, so the owner has not decided one.

Code: `src/game/game.ts` (the death, lines 835-841; the restart input, lines 2493-2499; the fade, lines 2632-2640; the restart fade and hold, lines 119-121), `src/game/hud.ts` (the death screen, lines 523-538).
