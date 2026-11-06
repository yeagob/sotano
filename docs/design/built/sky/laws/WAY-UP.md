# The way up opens when the deity is won (law 3.5, built)

Up: [The laws of the sky (built)](README.md)

Each sky floor's way up is closed until that floor's deity is won.

## What the player sees and feels

- Every hall of the sky tree is closed above by a slab of heartwood three blocks thick, with one way up sealed by a heartwood membrane. Heartwood does not break: no shot, bomb, tower or hindrance passes it.
- When the floor's deity is won, its membrane opens to air, and the player's spirit refills to full (provisional, see [SPIRIT](SPIRIT.md)). The deity stays on its floor, won, for the rest of the run.
- Each floor carries its own vertical route up to the way up (the panda's ledge strip, the koala's trunk knots, the elephant's tusk line, the lion's thorn tree, the horse's mast). The route is the floor's own world, so the tower rule never touches it.
- From the top of that route a climb goes on: one-block heartwood ledges, one per height, each beside the last and one block higher, turning round a square inside the way up. While the membrane is closed the climb ends under it. When it opens the player climbs the ledges through the hole in the slab and steps out on the next hall's ground, where the next deity wakes; from the horse's floor the climb comes out on the crown, where Totality begins. Where the next floor's own blocks stand over the way up (a terrace, a meadow), a narrow shaft runs through them and the ledges go on to the surface.
- Falling down an open way up lands on the floor below; falls never hurt.

## How the player gets into the first hall

The player arrives from below on the deck, in front of the foot door in the trunk. The door is a corridor through the foot wall; at its end the foot well rises through the first slab with a spiral of four broad heartwood steps, each one block higher than the last. The fourth step is level with the first hall's ground: one hop over the pale stone rim and the player stands beside the Bamboo Seat, and the panda wakes. A deity only acts, and can only be hit, while the player is on its floor.
- A new run closes every membrane again.

## The rule

The player cannot change floor until the deity is defeated (owner, 2026-11-03 and 2026-11-05). Provisional reading, to confirm: the way in from the floor below stays open, so a player may still drop back down it.

## Not built

- The slow opening and the chime of the membrane, and its toast ("The way up opens."): the key exists in both languages, but the opening shows no toast yet.
- Whether the way in closes behind the player during a fight is open ([SKY.md](../../../../architecture/SKY.md) section 19).

Code: `openGate` and the climbs (`climbOf`) in `src/sky/floors/tree.ts`, `openGate` called on a won deity from `src/sky/sky-realm.ts`; tests in `tests/sky-realm-gate-open.test.ts`, `tests/sky-tree.test.ts` and `tests/sky-progression.test.ts` (the five floors won in order and climbed by the real player body).
