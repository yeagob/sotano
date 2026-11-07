# Abilities of the sky (built)

Up: [The sky (built)](../README.md) · the hindrances in the code now, and the rules every one of them keeps.

All eight hindrances the owner named are built: the kick and the gust (H0), and the six of wave 5 (H1–H3). The deities use them through their attacks ([guardians](../guardians/README.md)); the minions use them through their rules. What is not built of each (its sounds, the parts the animals' floors still owe) is in [not-built/sky/abilities](../../../not-built/sky/abilities/README.md).

| Document | Hindrance | Used by |
|---|---|---|
| [KNOCKBACK.md](KNOCKBACK.md) | A kick along a shown arc | Panda, elephant, lion, horse, and their herds' shoves and kicks |
| [WIND.md](WIND.md) | A gust along three lanes | Koala, elephant, lion, horse |
| [OPENING-HOLES.md](OPENING-HOLES.md) | Cells that crack, open, and return | Panda |
| [FADING-PLATFORMS.md](FADING-PLATFORMS.md) | Platforms that turn to mist, go, and return | Koala, lion, horse |
| [DENSE-GROUND.md](DENSE-GROUND.md) | Cells that slow the walk | All five deities |
| [CUBE-CAGE.md](CUBE-CAGE.md) | Cubes that rise round the player | Koala |
| [WATER-CURRENTS.md](WATER-CURRENTS.md) | Water that fills a bed and carries the player | Elephant |
| [PARALYSIS.md](PARALYSIS.md) | A ring that holds a grounded player | Lion |

Each deity also has hindrances of its own, built on the same runner and rules and described in its document: the panda's bamboo, the koala's hug, haze, bellow, lob, lullaby and hold, the lion's rings and the horse's rings.

Rules every built hindrance keeps:

- **The telegraph comes first, for its full length.** The player sees the warning before anything happens. Nothing takes effect while it runs.
- **Nothing damages.** A hindrance pushes, slows or holds the player. It never takes health, drains spirit, sends the player underground or takes a practice.
- **A placed block is never changed.** A hindrance may change only the world's own cells, and only for a time: a cell the player built stays, and a cell an ally holds is left alone.
- **Everything ends.** Each effect ends by itself, and a stopped hindrance leaves no marks, no transient cell, no crack, no water and no push behind.
- **A block between the source and the player shelters them.** A solid block in the line stops a push, placed by the player or not.
- **A positive intention at the right place answers the hindrance.** A warm positive touch at the source or the cell changes it (the answer is named in each document). A beam's repeat ticks do not count.
- **Deterministic.** No hindrance draws randomness: under a fixed step the same start gives the same result.

Code: `src/sky/hindrances/` (`runner.ts` sequences a hindrance, `effects.ts` holds the shared rules, one module per hindrance); tests in `tests/sky-hindrances-core.test.ts` and `tests/sky-engine.test.ts`.
