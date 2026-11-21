# Irimi (the dash)

Up: [built practices](README.md)

Irimi is the entering step of aikido: step into the movement instead of away from it. Its practice gives the Roots a dash: a quick step, four and a half blocks, in the direction you choose, untouchable while it lasts. Whatever it passes through feels it: each projection it touches takes damage, and the blocks in its way break. It is a **body** practice (path tags `body`, `movement`), quality 4 (issue #261; it was 3), found in treasure rooms.

- **Code:** `src/content/items/irimi.ts` (the practice), the `dash` stat (`src/core/stats.ts`), `Player.startDash` and `dashStep` (`src/entities/player.ts`), the geometry, the cells it breaks and the touch along its path (`src/entities/dash.ts`: `dashDisplacement`, `dashCells`, `dashTouches`), the strike, the breaking and the trail (`Game.dashStrike`, `Game.dashBreak`, `Game.dashTrail` in `src/game/game.ts`), the gestures (`src/input/gestures.ts`, `src/input/input.ts`, `src/input/touch.ts`), the action `dash` in `src/input/bindings.ts`.
- **Tests:** `tests/dash.test.ts`, `tests/irimi-dash.test.ts`, `tests/controls.test.ts`. **Sandbox:** `src/sandbox/scenarios/irimi-*.json`.

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
| Collision | the dash moves through the voxel collision: it slides along walls, never clips into a block, and stops at a ceiling it cannot break |
| Blocks in the way | every block the body would enter during the dash takes 27 block damage (`DASH_MINING`) through the block pipeline (`blockDamage`, `blockBreak`), but only if that breaks it outright: dirt, stone, brick, wood, ore and deepstone break; obsidian, door frames, pedestals and the unbreakable blocks are left untouched and stop the dash on that axis, and nothing behind them breaks. The path is read every quarter block. The dash never breaks a block below the level of the feet it started from, so a dash looking down does not dig into the floor |
| Contact damage | each hostile projection the body touches during the dash (its box, plus a quarter block of reach, read along the whole path of each frame) takes 7 damage points (`DASH_DAMAGE`, kind `melee`, source `irimi`) through `actorDamage`, with a knockback away from the path. Each projection is hit once per dash. Allies (projections turned to your side) and presences are never hit |
| Water or lava | the dash covers half the distance (2.25 blocks) when the feet are in a fluid or the head is under water |
| Invulnerability | for the 0.18 s of the dash (its invulnerability frames): a hit cannot land and contact damage is ignored. A longer invulnerability is never shortened |
| Without the stat | the gesture does nothing: no cue, no cooldown, no cost |

## 3. Positive outcome

A dash cannot be a punishment: it costs nothing but its cooldown and the one air dash. It is untouchable while it lasts, so it can always save you from a hit that is already on its way, and stepping into a projection hurts it, not you.

## 4. Feedback

A whoosh (`sfx3.dash`), a burst of the practice's glow at the feet, a trail that follows the body while it runs (light motes of the body path, `path.body.base` at the feet, `path.body.glow` at the waist and `path.body.dark` at the head, laid along the path travelled in each frame, up to four points a frame, with no gravity), pale chips (`cold.body`) where a projection is struck, the break chips of each block it breaks, and a slight widening of the field of view (4 degrees at the middle of the dash). The cooldown has no HUD of its own: no fitting element exists, and no new HUD was added.

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
7. **The icon** is a first draft by the implementer, not yet through the art gate (`sotano-art` §0 asks for a dedicated art agent). The same holds for the trail of issue #261: it uses only path and cold tokens, and has not been captured in `?gallery` or seen in a browser.
8. **Positive-intention rule.** Not applicable: no intention is involved.
9. **Tier 4 numbers (issue #261).** The contact damage (7, two base intentions), the block damage (27, just enough for deepstone, not for door frames or obsidian), the rule that the dash never digs below its start and the rule that it leaves untouched what it cannot break outright were chosen by the implementer: the issue asked that everything touched takes damage and that blocks in the way break, without numbers. Door frames, obsidian and pedestals are spared so a dash cannot open a room's walls or take a pedestal.
10. **Quality 4 and the gifts.** At quality 4 Irimi leaves the quality-3 tables of the Trickster's trade and the Mender's gift, and the gift pedestals of the Roots (the `roots-gift` rooms, capped at quality 3) no longer reserve it. That changes which practices the same seeds reserve on floor 0, so the floor 0 pins (`tests/rng.test.ts`, `tests/roots-easy.test.ts`) are re-recorded once by the orchestrator (`sotano-items` rule 19).
