# Walk Slowly (Camina Despacio)

Up: [Body folder](README.md) · [all practices](../README.md) · [built design](../../README.md)

Status: built in code, waits for the owner's acceptance (issue #340, the Ascension practices).

| | |
|---|---|
| Path | Body (tags `body`, `movement`); also none |
| Quality | 4 of 4 (Tier 5 in #340: Tier N = quality N − 1) |
| Found in | no pool draws it: its only pool is `unlock`. A branch achievement lays it by id (`walk-slow`) at a room centre; that placement is built with the tree, not here |
| Inspired by | Santiago Dopazo: «El acto más revolucionario que puedes llevar a cabo es caminar despacio» ("The most revolutionary act you can carry out is to walk slowly"); "Firma SD" in #340 is this credit |
| Code | `src/content/items/walkslow.ts`, the `walkSlow` stat (`src/core/stats.ts`), the time rule (`src/game/time-scale.ts`, read by `Game.simulate`) |
| Tests | `tests/walk-slow.test.ts` |

## What it means

Slowness is not falling behind: it is refusing the hurry. Bent low, close to the ground, the Roots stops running with the world, and the world's rush loosens until every moving thing can be seen.

## What it does

While the player holds the practice, is **crouched** and has the **feet on the ground**, the whole world runs at **50 %**: almost a stop of time, everything in slow motion.

- **Slowed:** the projections and their shots, the player's intentions and their fire rate, loose blocks and their physics, the elements, doors, missiles, timers and statuses, particles, and the player's own body. A crouched walk is already 45 % of the walk; under the slow it covers 22.5 % of the walk's distance per real second. No extra rule: the body gets the same half step as everything else.
- **Not slowed:** the HUD, the input, the menus, the camera turning with the mouse or stick, and Kairos.
- **Leaving the ground ends it.** The scale is read from the body at the start of each frame. A jump taken while slowed still starts with its full impulse (the jump frame itself runs at half step), and from the next frame, in the air, the world runs at full speed. Standing up ends it the same way.
- **Without the practice the crouch does nothing to time.** The practice also gives the crouch (the `crouch` stat, the same as Child's Pose), so it always works whether or not Child's Pose is held: C switches the crouch, Control holds it, R3 toggles it on a gamepad, a swipe down from the bottom of the right side toggles it on touch. No new control.
- **Kairos is separate.** When Kairos has stopped time, its stop runs first and unchanged: its six seconds are counted in real time, crouched or not.
- **Audio.** Nothing changes in the mixer or the pitch. Sounds come from world events, so a slowed world makes fewer of them per second; no sound of its own was added.

## Stats and events

- `walkSlow`: +1 (a 0 or 1 switch, limits [0, 1]).
- `crouch`: +1 (the same switch Child's Pose gives; two sources stay at 1).
- No hooks and no events. Random streams are not touched: the scale draws nothing, and at scale 1 the step is the same number, so a run without the practice steps exactly as before.

## Positive outcome

It only helps: the player chooses when to slow the world, to read a projection's attack, to dodge a shot, to aim, or to watch the blocks fall. The cost is that the player's own body slows too, and it ends at once on a jump.

## Synergies and states of being

- [Embodied](../states-of-being/EMBODIED.md) counts the body tag.
- No synergy yet.

## Open questions

- **The player's own shots.** The owner's words say everything slows, so intentions fly at half speed and the fire rate is halved while walking slowly. Confirm, or exempt the player's shots.
- **Feedback.** No visual or sound cue marks the slow yet (sotano-feature asks for one; it goes through the art agent).
- **Recipe.** No crafting recipe yet (sotano-items rule 14, issue #112).
- **Icon.** A first draft (two footprints, one slow step after the other); not yet through the art gate (`?gallery`, sotano-art §0).
