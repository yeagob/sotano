# Berserker heart

The rarest heart: one more heart of 100 health that turns you into a berserker for as long as you hold it.

Part of [kinds of heart](README.md). What is still open for it is in [not-built/player/hearts/BERSERKER.md](../../../not-built/player/hearts/BERSERKER.md).

## What the player sees and feels

- It is very rare (0.5 % to 1.5 % of the hearts that drop) and beats fast on the floor, with its own colour and halo.
- Taking it adds one extra heart of 100 health, even at full health, and starts the berserker mode at once: a roar, a big burst, a shake of the screen and a toast.
- While any berserker heart is held:
  - Damage, move speed and jump height are each multiplied by 1.5.
  - Intentions fly a much shorter distance (range × 0.3): the berserker fights up close.
  - Walking breaks loose blocks: a block joined to the world by a single face shatters when you walk over it or into it.
  - Any projectile that reaches you is sent back the way it came, now on your side, with a sharp ring.
  - The screen wears a different frame: a coloured border with a slow glow (under 3 Hz), and the berserker heart in the HUD glows.
  - Every sound has an echo.
- It is spent like any extra heart (the most recently picked up first). When the last berserker heart is spent the mode ends, unless a Berserker Draught still holds it: the stats, the frame and the echo go, with a falling roar and a toast.

## The berserker state

The mode is a state of its own, not a property of the heart: it is on while any source holds it. Today there are two, a berserker heart held and a [Berserker Draught](../../laboratory/recipes/BERSERKER-DRAUGHT.md) drunk (two sealed rooms). The state announces every change (on and off) so other things in the game can answer it later: practices, projections or stations that react to a berserker (owner, 2026-11-03).

## Numbers

- Health: 100. Damage × 1.5, move speed × 1.5, jump × 1.5, intention range × 0.3. Several berserker hearts do not stack the mode.

Code: `src/entities/hearts.ts` (the numbers), `src/game/game.ts` (`setBerserk`, `updateHearts` for the sources, the `berserkChange` event, `berserkTread`, `looseBlock`, the projectile `reflects` host), `src/entities/enemies.ts` (projectiles sent back), `src/game/hud.ts` (`setBerserk`), `src/audio/sfx.ts` (`setEcho`).
