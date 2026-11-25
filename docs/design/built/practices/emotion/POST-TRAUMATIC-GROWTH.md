# Post-Traumatic Growth

Up: [Emotion folder](README.md) · [all practices](../README.md) · [built design](../../README.md)

| | |
|---|---|
| Path | Emotion; also Fire (tag `fire`) |
| Quality | 2 of 4 |
| Found in | treasure rooms |
| Inspired by | Tedeschi and Calhoun's post-traumatic growth (1996): growth that can follow a hard experience |
| Code | `src/content/items/posttraumatic.ts` (the `lavaWalk` stat, seconds); `Game.lavaWalkLeft`, `Game.playerElements`, `Game.lavaSurface` and the solid test in `Game.simulate` |

## What it means

The wound stays, and some people come through with more than they had: a deeper care for others, a clearer sense of what matters, a strength they did not know they had. What hurt can become ground. In the game, lava (old pain) stops being the enemy once the player knows their own heat.

## What it does

Each copy of the practice gives 2 seconds of lava walking, and the total is capped at 6 seconds. The stats panel reads "Lava walking time: 2 s" for one copy, "6 s" for three.

- **Lava does no damage while the time lasts.** Standing in lava, at the feet, the middle or the head, does not hurt the player while walking time is left. Fire still hurts (4 points a hit, as before).
- **You walk on its surface while the time lasts.** A lava cell with air above it is ground for a body whose feet were above its surface at the start of the frame. Gravity and walking stop on it. A body that is already in the lava is not held by it.
- **You wade at full speed while the time lasts.** Inside lava the wade is 1 instead of 0.4, so the body moves as on dry ground.
- **Then lava burns as usual.** When the time is up, the lava hurts and wades as it does for everyone, the surface holds no one, and a body that stays in lava keeps burning. Standing in lava forever still kills.
- **The time runs down in lava and comes back.** It counts down while the body stands in lava (its feet, middle or head in it, or the lava it stands on). Once the body is out of lava, the full time is back. Without the practice nothing is counted.
- **Intentions still go out in lava.** The lava still puts out an intention that flies into it (`Intents`), with or without time left.
- **Swimming is unchanged.** A head in lava still counts as swimming (the player's head can sink in a flow). Lava has no breath drain, so no one drowns in it.

## Stats and events

- `lavaWalk` is the walking time in seconds: 0 with no copy, 2 per copy (`add` layer), limits 0 to 6 (so three copies reach the cap and a fourth adds nothing). It is shown as seconds ("6 s"). It is read by `Game.lavaWalkLeft`, which `Game.playerElements` (the damage and the wade), `Game.simulate` (the solid test) and the negative conversion refusal of `Game.convertFluid` use.
- `Game.lavaSpent` holds the seconds the body has stood in lava since it last left it. It is cleared when the body leaves lava, on a new floor and on respawn. The time left is the stat less `lavaSpent`.
- The solid test reads the feet of the frame's start, not the candidate position of the move. A body that falls onto the surface lands on it; with the candidate position it would sink through, because the surface test asks whether the feet are above the top of the lava.

## Open questions

None for the code. The effect text in English and Spanish gives the 2 seconds per copy, the 6-second cap and the burn after the time. The refill rule (the time is whole again once the body is out of lava) was not set by the owner; it is the designer's choice for issue #341 and is kept until the owner says otherwise.
