# The updraft (built)

Up: [Totality](README.md) · the fall recovery of the climb above the crown.

A fall in Totality is caught by an updraft that carries the player back to the last checkpoint they stood on.

## What the player sees and feels

- **Checkpoints.** Every sixth platform of the climb is a checkpoint, 3 × 3 whatever its stratum. The last checkpoint the player **stood on** (feet on its top, inside its edges) is remembered; passing near one in the air does not count.
- **The catch.** A fall that drops 20 blocks below that checkpoint, downward and in the air, is caught: pale motes at the catch, along the way and at the arrival, and the first time in a run the toast "An updraft carries you back to the last beacon". The updraft's own sound is named but silent: the sky's core sounds are not synthesised yet.
- **The carry.** The player is carried back in 1.6 s, input held and gravity waiting, in two legs so the body never rises into the checkpoint from below: three quarters of the time up to a point two blocks past the platform's corner and two above its top, then in onto its centre.
- **The cost** is the height lost above the checkpoint, and nothing else: no health, no spirit.
- A drop of more than 8 blocks in one frame is a teleport, not a fall: arriving on the deck from the underground is never carried up. A fall that stops above the line is not caught; with no checkpoint stood on, nothing is caught.

## The rule

Missing a jump in Totality does not cause death or damage (laws 3.7 and 3.10); a gentle updraft returns the player to the last stable checkpoint ([not-built Totality](../../../not-built/levels/TOTALITY.md), section 4, the proposal the owner's build follows).

Code: `src/sky/laws/updraft.ts` (`Updraft`, `CATCH` 20, `CARRY` 1.6 s, `RISE_SHARE` 0.75), the checkpoints in `src/sky/totality/chain.ts`; tests in `tests/sky-updraft.test.ts`.
