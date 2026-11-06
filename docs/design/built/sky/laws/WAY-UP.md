# The way up opens when the deity is won (law 3.5, built)

Up: [The laws of the sky (built)](README.md)

Each sky floor's way up is closed until that floor's deity is won.

## What the player sees and feels

- Every hall of the sky tree is closed above by a slab of heartwood three blocks thick, with one way up sealed by a heartwood membrane. Heartwood does not break: no shot, bomb, tower or hindrance passes it.
- When the floor's deity is won, its membrane opens to air, and the player's spirit refills to full (provisional, see [SPIRIT](SPIRIT.md)). The deity stays on its floor, won, for the rest of the run.
- Each floor carries its own vertical route up to the way up (the panda's ledge strip, the koala's trunk knots, the elephant's tusk line, the lion's thorn tree, the horse's mast). The route is the floor's own world, so the tower rule never touches it.
- Falling down an open way up lands on the floor below; falls never hurt.
- A new run closes every membrane again.

## The rule

The player cannot change floor until the deity is defeated (owner, 2026-11-03 and 2026-11-05). Provisional reading, to confirm: the way in from the floor below stays open, so a player may still drop back down it.

## Not built

- The slow opening and the chime of the membrane, and its toast ("The way up opens."): the key exists in both languages, but the opening shows no toast yet.
- Whether the way in closes behind the player during a fight is open ([SKY.md](../../../../architecture/SKY.md) section 19).

Code: `openGate` in `src/sky/floors/tree.ts`, called on a won deity from `src/sky/sky-realm.ts`; tests in `tests/sky-realm-gate-open.test.ts` and `tests/sky-tree.test.ts`.
