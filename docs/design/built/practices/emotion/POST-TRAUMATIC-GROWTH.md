# Post-Traumatic Growth

Up: [Emotion folder](README.md) · [all practices](../README.md) · [built design](../../README.md)

| | |
|---|---|
| Path | Emotion; also Fire (tag `fire`) |
| Quality | 2 of 4 |
| Found in | treasure rooms |
| Inspired by | Tedeschi and Calhoun's post-traumatic growth (1996): growth that can follow a hard experience |
| Code | `src/content/items/posttraumatic.ts` (the `lavaWalk` stat); `Game.playerElements`, `Game.lavaSurface` and the solid test in `Game.simulate` |

## What it means

The wound stays, and some people come through with more than they had: a deeper care for others, a clearer sense of what matters, a strength they did not know they had. What hurt can become ground. In the game, lava (old pain) stops being the enemy once the player knows their own heat.

## What it does

With the practice, `lavaWalk` is 1 (the stats panel reads "Lava walking: on").

- **Lava does no damage.** Standing in lava, at the feet, the middle or the head, no longer hurts the player. Fire still hurts (4 points a hit, as before).
- **You walk on its surface.** A lava cell with air above it is ground for a body whose feet were above its surface at the start of the frame. Gravity and walking stop on it. A body that is already in the lava is not held by it.
- **You wade at full speed.** Inside lava the wade is 1 instead of 0.4, so the body moves as on dry ground.
- **Intentions still go out in lava.** The lava still puts out an intention that flies into it (`Intents`).
- **Swimming is unchanged.** A head in lava still counts as swimming (the player's head can sink in a flow). Lava has no breath drain, so no one drowns in it.

## Stats and events

- `lavaWalk`, limits 0 to 1, `add` layer (the practice gives 1). It is read by `Game.playerElements` (the damage and the wade) and by the solid test of `Game.simulate`.
- The solid test reads the feet of the frame's start, not the candidate position of the move. A body that falls onto the surface lands on it; with the candidate position it would sink through, because the surface test asks whether the feet are above the top of the lava.

## Open questions

None for the code. The effect text is the designer's and is kept word for word.
