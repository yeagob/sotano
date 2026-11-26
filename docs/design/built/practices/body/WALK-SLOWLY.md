# Walk Slowly (Camina Despacio)

Up: [Body folder](README.md) · [all practices](../README.md) · [built design](../../README.md)

Status: built in code, waits for the owner's acceptance (issue #364; umbrella #340, the Ascension practices). Owner answers of 2026-11-26 applied, with the owner's correction of the same day: the practice gives the crouch, the shots leave from the crouched height, the sound slows too; the icon is validated.

| | |
|---|---|
| Path | Body (tags `body`, `movement`); also none |
| Quality | 4 of 4 (Tier 5 in #340: Tier N = quality N − 1) |
| Found in | no pool draws it: its only pool is `unlock`. A branch achievement lays it by id (`walk-slow`) at a room centre; that placement is built with the tree, not here |
| Inspired by | Santiago Dopazo: «El acto más revolucionario que puedes llevar a cabo es caminar despacio» ("The most revolutionary act you can carry out is to walk slowly"); "Firma SD" in #340 is this credit |
| Code | `src/content/items/walkslow.ts`, the `walkSlow` stat (`src/core/stats.ts`), the time rule (`src/game/time-scale.ts`, read by `Game.simulate`), the cast origin (`castOrigin` in `src/entities/stance.ts`), the sound (`setWorldTimeScale` in `src/audio/sfx.ts`, set by `Game.frame`) |
| Tests | `tests/walk-slow.test.ts` |

## What it means

Slowness is not falling behind: it is refusing the hurry. Bent low, close to the ground, the Roots stops running with the world, and the world's rush loosens until every moving thing can be seen.

## What it does

While the player holds the practice, is **crouched** and has the **feet on the ground**, the whole world runs at **50 %**: almost a stop of time, everything in slow motion.

- **Slowed:** the projections and their shots, the player's intentions and their fire rate, loose blocks and their physics, the elements, doors, missiles, timers and statuses, particles, and the player's own body. A crouched walk is already 45 % of the walk; under the slow it covers 22.5 % of the walk's distance per real second. No extra rule: the body gets the same half step as everything else.
- **Shots from the crouched height.** The player's intentions leave from the eye, which drops one block with the crouch, so a crouched body casts one block lower than a standing one (0.12 below the crouched eye, 0.18 to the side of the casting hand, 0.3 ahead).
- **Not slowed:** the HUD, the input, the menus, the camera turning with the mouse or stick, and Kairos.
- **Leaving the ground ends it.** The scale is read from the body at the start of each frame. A jump taken while slowed still starts with its full impulse (the jump frame itself runs at half step), and from the next frame, in the air, the world runs at full speed. Standing up ends it the same way.
- **It gives the crouch.** If the player does not hold [Child's Pose](../RUN-AND-CROUCH.md), Walk Slowly gives its crouch (the same `crouch` switch; with both held it stays 1), so the practice always works (owner, #364). Without Walk Slowly the crouch does nothing to time. The controls are Child's Pose's: C switches the crouch, R3 toggles it on a gamepad, a swipe down from the bottom of the right side toggles it on touch. No new control.
- **Kairos is separate.** When Kairos has stopped time, its stop runs first and unchanged: its six seconds are counted in real time, crouched or not.
- **The sound slows too.** While the slow is on, every sound the synthesiser plays (its tones and noises) is pitched down by the scale (half the frequency) and lasts twice as long, and the whole mix passes a low-pass filter at 900 Hz, eased in and out over about a tenth of a second. Off the slow the filter sits open at the top of the audible range and the pitch is 1, so nothing changes. Menus, the pause and Kairos's stop always sound at full speed. Voices that synthesise themselves outside the shared tones and noises (the sky's creature voices, the meditation bells) are low-passed but not pitched down.

## Stats and events

- `walkSlow`: +1 (a 0 or 1 switch, limits [0, 1]).
- `crouch`: +1 (the same switch Child's Pose gives; with both held it stays at 1).
- No hooks and no events. Random streams are not touched: the scale draws nothing, and at scale 1 the step is the same number, so a run without the practice steps exactly as before.

## Positive outcome

It only helps: the player chooses when to slow the world, to read a projection's attack, to dodge a shot, to aim, or to watch the blocks fall. The cost is that the player's own body slows too, and it ends at once on a jump.

## Synergies and states of being

- [Embodied](../states-of-being/EMBODIED.md) counts the body tag.
- No synergy yet.

## Open questions

- **Sound depth.** The pitch factor (the scale itself, an octave down) and the 900 Hz cutoff are first values; the owner may want a gentler pitch.
- **Visual feedback.** No visual cue marks the slow yet; the sound does (sotano-feature asks for one; a visual goes through the art agent).
- **Recipe.** No crafting recipe yet (sotano-items rule 14, issue #112).
- **Icon.** Two footprints, one slow step after the other: validated by the owner (#364); the `?gallery` captures of the art gate are still to attach.
