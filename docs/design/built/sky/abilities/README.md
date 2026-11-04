# Abilities of the sky (built)

Up: [The sky (built)](../README.md) · the hindrances in the code now, and the rules every one of them keeps.

Built so far: the kick ([KNOCKBACK](KNOCKBACK.md)) and the gust ([WIND](WIND.md)). The other hindrances (opening holes, fading platforms, dense ground, the cube cage, water currents, paralysis) are not built; their documents are in [not-built/sky/abilities](../../../not-built/sky/abilities/README.md).

Rules every built hindrance keeps:

- **The telegraph comes first, for its full length.** The player sees the warning before anything happens. Nothing takes effect while it runs.
- **Nothing damages.** A hindrance pushes, slows or holds the player. It never takes health, drains spirit, sends the player underground or takes a practice.
- **A placed block is never changed.** A hindrance may change only the world's own cells, and only for a time: a cell the player built stays, and a cell an ally holds is left alone.
- **Everything ends.** Each effect ends by itself, and a stopped hindrance leaves no marks and no push behind.
- **A block between the source and the player shelters them.** A solid block in the line stops a push, placed by the player or not.
- **A positive intention at the source answers the hindrance.** A warm positive touch within three blocks of the source changes it (the answer is named in each document). A beam's repeat ticks do not count.

Code: `src/sky/hindrances/` (`runner.ts` sequences a hindrance, `effects.ts` holds the shared rules, `knockback.ts` and `wind.ts` are the two hindrances).
