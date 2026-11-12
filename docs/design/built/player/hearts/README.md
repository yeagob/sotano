# Kinds of heart

Six kinds of heart the player can pick up (issue #31). Red hearts fill the containers; blue, stone and berserker hearts sit on top of the containers as extra hearts and are lost for good once spent; blood and star hearts act the moment they are taken and store nothing. Each kind has its own document.

Part of [the player](../README.md). Health itself (points, quarters, invulnerability) is in [HEALTH.md](../HEALTH.md).

| Document | Contents |
|---|---|
| [RED.md](RED.md) | The normal heart: one heart back into the containers |
| [BLUE.md](BLUE.md) | One more heart, lost for good when spent |
| [STONE.md](STONE.md) | One more heart that halves every hit while it takes the blows |
| [BLOOD.md](BLOOD.md) | Slow healing, up to two hearts over two minutes, broken by any hit; at full health, one more container, filled |
| [STAR.md](STAR.md) | One heart back and thirty seconds untouchable |
| [BERSERKER.md](BERSERKER.md) | The rarest: stronger, faster and higher while it is held, with short intentions, a frame and an echo |

## What every kind shares

- **The unit.** The design counts a heart as 100 health and a quarter as 25. The game counts a heart as 8 points (a quarter is 2), so 100 design health is one heart, and every number below is in design health.
- **Order of loss.** Extra hearts (blue, stone, berserker) are drawn after the containers, in the order they were picked up. A hit always takes the most recently picked up extra heart first, then the one before it, and only then the red health in the containers.
- **Room for hearts.** Containers and extra hearts together are at most 12. An extra heart that has no room stays on the floor.
- **Where they come from.** Every heart the game drops (projections, cleared rooms, crates, the Listener) is one kind or another. Each rare kind has a chance range; each floor of each run draws its exact chance inside that range from the seed, and each drop rolls its kind from those chances. Red is what is left.

| Kind | Chance range per heart drop |
|---|---|
| Blue | 8 % to 14 % |
| Stone | 3 % to 6 % |
| Blood | 4 % to 8 % |
| Star | 2 % to 4 % |
| Berserker | 0.5 % to 1.5 % |
| Red | the rest (about 70 % to 83 %) |

- **The look.** Gold on brown tones with light around each rare heart (a soft halo on the pickup), following the art guide. The art ruling is in [DECISIONS.md](../../../../art/DECISIONS.md).
- **Feedback.** Every kind has its own pickup sound, a burst in its colour and a toast that says what it does; losing an extra heart bursts and toasts too.

Code: `src/entities/hearts.ts` (the rules and numbers), `src/content/tables/hearts.ts` (the chance ranges and the roll), `src/content/heart-art.ts` (the look), `src/game/game.ts` (`collectHeart`, `updateHearts`, the damage pipeline), `src/game/hud.ts` (the drawn hearts, the star glow and the berserker frame), `src/audio/sfx.ts` (`sfxHeart`, `starTheme`, `setEcho`).
