# Fartlek and Child's Pose (run and crouch)

Up: [built practices](README.md)

Two body practices that change how the Roots moves. **Fartlek** (the Swedish "speed play") lets you run for the joy of it. **Child's Pose** (*balasana*) lets you fold in and go low: under a low gap, along an edge, and out of the way of what is coming. Both are quality 2, path `body`, tags `body` and `movement`, found in treasure rooms. From mastery level 10 Fartlek always lies on the Roots' first extra practice pedestal, and from level 25 Child's Pose on the second ([REWARDS](../levels/roots/REWARDS.md) §4, issue #277).

- **Code:** `src/content/items/fartlek.ts`, `src/content/items/balasana.ts` (the practices), the stats `run` and `crouch` (`src/core/stats.ts`), the stance and speed rules (`src/entities/stance.ts`, `Player.setStance` and `Player.walk` in `src/entities/player.ts`), the contact halving (`Game.contact` in `src/game/game.ts`), the actions `run` and `crouch` and the touch swipe (`src/input/bindings.ts`, `src/input/input.ts`, `src/input/touch.ts`).
- **Tests:** `tests/run-crouch.test.ts`, `tests/controls.test.ts`. **Sandbox:** `src/sandbox/scenarios/fartlek-*.json`, `balasana-*.json` (§6).

## 1. What the player does

| Control | Keyboard and mouse | Gamepad | Touch (landscape) |
|---|---|---|---|
| Run (Fartlek) | hold Shift | L3 (stick click) toggles it until the left stick returns to centre; also running while the stick is pushed to its edge | push the left stick past 95 % of its radius |
| Crouch (Child's Pose) | hold C | R3 (stick click) toggles it | a swipe down from the bottom twelfth of the right side toggles it |

Running is 45 % faster on the ground and in the air, and jumping keeps the pace. There is no stamina. Crouching is a stance: the body is a block shorter (1.8 to 0.8 blocks), the eye drops with it, and the body fits through a gap one block high. A crouched body never walks off a ledge, and takes half the contact damage from projections.

## 2. The numbers (decided)

| Rule | Value |
|---|---|
| Run speed | × 1.45 of the walk (the `moveSpeed` stat still applies on top) |
| Crouch speed | × 0.45 of the walk |
| Running while crouched | refused: the crouch pace wins |
| Standing height | 1.8 blocks, eye 1.62 |
| Crouched height | 0.8 blocks (one block shorter), eye 0.62 |
| Standing up | only when the head has room: no solid cell in the band 0.8 to 1.8 above the feet, under the footprint. A ceiling keeps the body crouched until there is room |
| Ledge | a crouched body on the ground moves on an axis only if its footprint still has ground under it (Minecraft's sneak) |
| Contact damage | a crouched body takes half the contact of a projection, rounded up to whole points (8 → 4, 3 → 2, 1 → 1). Applied after the items' hooks on the contact event |
| Pad stick edge | the left stick at 95 % or more of its radius runs |
| Without the stat | the controls do nothing: no stance, no speed change |

## 3. Positive outcome

Both practices are only ever help. Running costs nothing and makes the way faster. Crouching costs speed, but it lets you pass what would stop you, stay on a ledge, and take half the hits from projections. The one thing it cannot do is make a standing body fit under a ceiling: it refuses to stand instead of letting you clip into the block.

## 4. Crossing with the other practices

- **Dash (Irimi).** A dash while running or crouched works. Crouch is not cancelled by a dash: the stance stays, and the body keeps its height through the dash, so a crouched dash fits a low gap. The ledge rule does not apply during the dash (a dash off an edge floats for its length, as DASH.md §6 already says). Running does not change a dash.
- **Other stats and items.** `moveSpeed` multiplies both. Slow and hold (paralysis) act as before: the pace is multiplied, the hold stops the walk.
- **Intentions** fire from the lowered eye when crouched.
- **Water.** The swim and the wade rules are unchanged; the crouch and the run do not change what a fluid does to the body.

## 5. Controls and words

Both are `hold` actions in `BINDINGS`, live in `play` on every device. The keyboard keys (Shift, C) are free in play (C is `calm` only in the meditation screen). The gamepad buttons L3 and R3 are free in play and toggle through the input layer's latches (`runLatch`, `crouchLatch`); the run latch ends when the stick comes back to centre after being pushed.

On touch no button is added (the seven-button limit in play is kept for the Kairos button): **the crouch is a swipe down from the bottom twelfth of the right side, right of the middle**. It toggles the crouch and takes back the look it turned, the same way the dash swipe does. A look drag that is not a downward swipe keeps its look.

The pause card shows both rows always (`CONTROL_ROWS`), with "(with Fartlek or a Stride Tonic)" and "(with Child's Pose or a Folding Tincture)". Prompts name the gesture of the device in use (`controls.run.*`, `controls.crouch.*`).

## 6. Sandbox

| Scenario | What it shows |
|---|---|
| `fartlek-corridor` | Shift held for the first second: the run covers about 6.2 blocks a second against 4.7 walking |
| `balasana-gap` | crouched (C held), the body passes the one-block gap at row 3 under a crate lintel |
| `balasana-gap-standing` | the same walk, standing: stops at the lintel's face |
| `balasana-ledge` | crouched at a one-block drop: stops at the edge and stays on the ground |
| `balasana-ledge-standing` | the same walk, standing: walks over the edge and falls |

The lab gained a `hold` action (SANDBOX.md §2): a key held for a number of ticks, so a run or a crouch lasts its script.

## 7. Feedback

Running and crouching have no sound or particle of their own yet (see §8). The crouch and the run change the body's height and speed, which the player sees in the camera's eye and in the pace.

## 8. Open for the owner

Decisions taken on the owner's behalf (review these):

1. **The crouched height** is one block shorter (0.8), the same as the brief's rule. It means a crouched body fits a gap one block high, and only just.
2. **Crouch on touch is a swipe, not a button.** The brief first said a button, then the seven-button cap (the Kairos button took the seventh) moved it to a downward swipe on the right look pad, toggling. The swipe is a toggle, so the crouch stays on until it is swiped again.
3. **Running while crouched is refused**, and a dash does not cancel the crouch (§4).
4. **Contact halving is rounded up** (1 point stays 1), applied after the items' hooks, so a damage-reducing practice still counts first.
5. **Gamepad run** is both the L3 toggle and the stick at its edge. The stick-click toggles in the menus too (the latch is device state, not screen state); the run latch ends when the stick returns to centre, the crouch latch does not end by itself.
6. **Feedback is not built.** A stance change has no sound, particle or toast. The sotano-feature bar asks for them; they are the first thing to add if the owner wants them.
7. **The icons are first drafts** (`touchCrouch` was removed with the button; the practice icons `fartlek` and `balasana` are not through the art gate, `sotano-art` §0).
8. **No crafting recipe yet** (rule 14 of `sotano-items`): the crafting table does not cover practices yet. The alembic brews each effect for a while instead (§9).
9. **GEN_VERSION** is not bumped in this package (38 is already the value on the integration branch). The golden pins in `tests/rng.test.ts` and `tests/roots-easy.test.ts` are expected to fail until the orchestrator re-records them.
10. **The potions' names, recipes and duration** (Stride Tonic, Folding Tincture, a body mind with or without dirt, 3 sealed rooms) are proposals (#262, #263).

## 9. The potions (#262, #263)

Both effects can also be brewed at the alembic, as easy potions, so a run without the practice can still run or crouch for a while. Each potion adds the same stat the practice gives, so the controls, the numbers and every rule above are the same; holding the control is what changes the body.

| Potion | Bulb | Stat | Duration | Recipe |
|---|---|---|---|---|
| Stride Tonic | a mind of a body pattern | `run` +1 | 3 sealed rooms (4 with ice) | [STRIDE-TONIC](../laboratory/recipes/STRIDE-TONIC.md) |
| Folding Tincture | a mind of a body pattern and dirt | `crouch` +1 | 3 sealed rooms (4 with ice) | [FOLDING-TINCTURE](../laboratory/recipes/FOLDING-TINCTURE.md) |

`run` and `crouch` are switches limited to 0 to 1, so a potion drunk while holding the practice adds nothing. Tests: `tests/stride-folding.test.ts`.
