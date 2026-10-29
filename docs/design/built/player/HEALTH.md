# Health

How hearts work: what a heart is, how a hit lands, what protects you and what heals you.

Part of [the player](README.md).

## What the player sees and feels

- You have hearts. You start with three. Each heart is drawn as four quarters, and a heart holds eight points of health, so a quarter is two points.
- A heart that is partly full shows its filled quarters from the left. A partly filled quarter shows as full, so a small amount of health is never hidden.
- When you are hit, the points come off, and for one second after that you cannot be hit again. During that second the hearts stay steady with an outline instead of blinking.
- When one heart or less is left, the last heart beats, so the player always knows they are close to death.
- A heart pickup heals one whole heart. At full health you do not take it: it stays on the floor until you are hurt.
- A heart container, from an item, adds a heart to the maximum and fills it at once. If a practice takes a container away, the health is brought down to the new maximum.
- Standing in fire or lava hurts by the element's harm value at each invulnerability window. The elements themselves are described outside this document.
- Falling does not hurt you. Landing from a fall makes a sound and an event, and nothing more.

## The rule behind it

The owner's design text puts health in hearts that can be recovered, with a second kind of heart that is lost first ([DESIGN.md, section 4](README.md)); the planned kinds are in [not-built/player/HEART-TYPES.md](../../not-built/player/HEART-TYPES.md). Health is counted in points so that a small reduction from an item still shows on the hearts.

Code: `src/entities/actors.ts` (the heart and the quarter, lines 16-24), `src/game/hud.ts` (the drawn hearts, lines 219-235), `src/game/game.ts` (the maximum, line 805; the damage pipeline for every actor, lines 812-846; heals, lines 846-862; the pickup rule for hearts, line 2097), `src/core/stats.ts` (the maximum hearts and invulnerability stats, lines 44-45).

## Numbers

- Starting hearts: 3 (24 points).
- Heart: 8 points, four quarters of 2 points.
- Heart pickup: one heart (8 points).
- Invulnerability after a hit: 1 second, which items can lengthen.
- Drowning: 4 points every 1.5 seconds (see [SWIMMING.md](SWIMMING.md)).

## Open questions

1. **Half hearts or quarter hearts.** The design text says the player has Isaac-style half hearts ([DESIGN.md, section 4](README.md)). The code draws hearts in quarters, two points each (`src/entities/actors.ts`, lines 16-24, and `src/game/hud.ts`, lines 219-235). Which one does the owner want? Both are playable; the drawing and the pickups would change together.
