# Irimi (the dash)

Up: [built practices](README.md)

Irimi is the entering step of aikido: step into the movement instead of away from it. Its practice gives the Roots a dash: a quick step, four and a half blocks, in the direction you choose, untouchable while it lasts. It is a **body** practice (path tags `body`, `movement`), quality 3, found in treasure rooms.

- **Code:** `src/content/items/irimi.ts` (the practice), the `dash` stat (`src/core/stats.ts`), `Player.startDash` and `dashStep` (`src/entities/player.ts`), the geometry (`src/entities/dash.ts`), the gestures (`src/input/gestures.ts`, `src/input/input.ts`, `src/input/touch.ts`), the action `dash` in `src/input/bindings.ts`.
- **Tests:** `tests/dash.test.ts`, `tests/controls.test.ts`. **Sandbox:** `src/sandbox/scenarios/irimi-*.json`.

## 1. What the player does

| Gesture | Device |
|---|---|
| Double-tap a movement key (W A S D or the arrows) within 0.25 s | Keyboard and mouse |
| Double-flick the left stick: push past 0.8, return under 0.3, push the same way within 0.25 s | Gamepad (no button) |
| Swipe on the left side of the screen, starting right of the stick's zone, at least 60 px within 0.25 s; up is forward, down back | Touch (landscape) |

The direction is the camera's: forward, back, left or right.

## 2. The numbers (decided)

| Rule | Value |
|---|---|
| Distance | 4.5 blocks |
| Duration | 0.18 s (25 blocks/s) |
| Cooldown | 0.8 s from the start of a dash |
| Air | one dash before landing; landing refreshes it |
| Forward and the pitch | forward follows the camera pitch. Looking up dashes up, looking down dashes down; the vertical part is capped at 3.5 blocks. Back, left and right stay horizontal |
| After a dash | the vertical speed restarts at 0 (no fall build-up) |
| Collision | the dash moves through the voxel collision: it slides along walls, never clips into a block, and stops at a ceiling |
| Water or lava | the dash covers half the distance (2.25 blocks) when the feet are in a fluid or the head is under water |
| Invulnerability | for the 0.18 s of the dash: a hit cannot land and contact damage is ignored. A longer invulnerability is never shortened |
| Without the stat | the gesture does nothing: no cue, no cooldown, no cost |

## 3. Positive outcome

A dash cannot be a punishment: it costs nothing but its cooldown and the one air dash. It is untouchable while it lasts, so it can always save you from a hit that is already on its way.

## 4. Feedback

A whoosh (`sfx3.dash`), a burst of the practice's glow at the feet and a few motes of the body palette left along the path while it runs, and a slight widening of the field of view (4 degrees at the middle of the dash). The cooldown has no HUD of its own: no fitting element exists, and no new HUD was added.

## 5. Controls and words

The gesture is a new meaning of the movement, not a button: the table row `dash` has `keyboard: { doubleTap: 'move' }`, `gamepad: { doubleFlick: 'left' }`, `touch: { control: 'swipe' }`. Nothing reserved is taken. The pause card shows the row always, with the words "(with Irimi)". The prompts name the gesture of the device in use (`controls.dash.key`, `.pad`, `.touch`).

## 6. Open for the owner

Decisions taken on the owner's behalf (review these):

1. **Touch band.** The swipe may start only in the left half of the screen and right of the stick zone (42 % to 50 % of the width). The stick takes any touch in the left 42 %, so a swipe there would move the stick. A look drag that starts in the band keeps its look until it is recognised as a swipe, then the look it made is taken back, so a swipe never turns the view.
2. **Downward dash.** Looking down and dashing forward goes down (capped at 3.5 blocks), not just level. The brief did not say; it follows the pitch as the upward case does.
3. **Dash into a gap.** During the 0.18 s there is no gravity, so a dash off a ledge floats for its length.
4. **Double tap and walking.** A double tap of a key in the menus does nothing (the dash is read only in play).
5. **The GEN_VERSION bump.** Adding a treasure practice changes the practices drawn in every seed: `GEN_VERSION` goes to 38, the golden seed and the Roots baseline are re-recorded (`tests/rng.test.ts`, `tests/roots-easy.test.ts`). The Roots' layout (band and world) is unchanged.
6. **No recipe.** The crafting table's recipes (`src/content/recipes.ts`) cover potions only; practices have no recipe yet, so this practice has none (rule 14 waits on that work).
7. **The icon** is a first draft by the implementer, not yet through the art gate (`sotano-art` §0 asks for a dedicated art agent).
8. **Positive-intention rule.** Not applicable: no intention is involved.
