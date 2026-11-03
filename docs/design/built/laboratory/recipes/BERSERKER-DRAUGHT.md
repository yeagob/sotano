# Berserker Draught

Up: [recipes](README.md) · built. The owner asked that the berserker state can also come from a potion (2026-11-03); the name, bulb and duration are proposals the owner has not confirmed.

Two will hearts burned down on obsidian: the player becomes a berserker for two rooms, as with the [berserker heart](../../player/hearts/BERSERKER.md).

- **Path:** will.
- **Bulb:** two hearts of will patterns and a block of obsidian.
- **Effect:** the berserker state: damage, move speed and jump ×1.5, intention range ×0.3, loose blocks break underfoot, projectiles bounce back, the frame and the echo. It does not add a heart.
- **Duration:** two sealed rooms, or until the next floor. Drinking it while a berserker heart is held changes nothing until the heart is spent; the state lasts while either holds.
- **Why it stays scarce:** two will hearts are needed, and hearts are left about 5 % of the time.

Code: `src/content/potions.ts` (the effect) and `src/content/recipes.ts` (the bulb); `src/game/game.ts` (`updateHearts` reads it).
