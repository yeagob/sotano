# Minions of the sky (built, in play)

Up: [The sky (built)](../README.md) · the animals of each floor, embodied as smaller creatures, as they run in the code now.

Pictures and a catalogue entry for each herd are in the [bestiary](../../bestiary/README.md).

The minions are built and tested headless: their engine (spawning, gaits, turning, helping, the stuck guard) and the five herds, each with its own rules, helps and model. Each guardian floor spawns its herd while the player is on it, so a player in the sky meets them. The shared design, its open questions and the rest of each herd's targets are in [not-built minions](../../../not-built/sky/minions/README.md) and in each guardian's B5.

## What every minion does

- **Spawning.** A minion appears at one of its floor's spawn places after a warning of motes and a shimmer (at least 0.5 s). While it spawns, nothing can touch it. A floor keeps at most its count of minions, and at most its count of wild ones.
- **Where and when.** Only the floor the player stands on spawns; the deck and Totality have no herd. The first time the player reaches a floor, its first minion appears at once (after its warning) and the rest follow one warning apart, each at the next spawn place, until the floor holds its count of wild ones (provisional: the koala's floor begins full by its document; for the other four this filling is the build's reading). After that, one more comes on the herd's timer while the floor is below its counts, so turning a minion into an ally lets another come. When the player leaves, the floor's minions are set aside (hidden, untouchable, still) and the same ones are there on the way back.
- **The animal's own gait.** Each herd moves as its animal does: walking, climbing a face, hanging under a branch, rolling down a slope, walking in file, stalking, galloping a loop, bounding, pouncing. A gait follows the floor's graph of places; the player's blocks are not on it, but a minion still collides with them.
- **Its rules, in order.** Each tick the herd's rules are asked in order and the first that acts wins. A rule that hinders the player starts a hindrance with the floor's telegraph: nothing a minion does hurts or drains.
- **Turning.** Each warm positive hit leaves a gold mark and plays the animal's soft reaction; at its count the minion turns into an ally with a gold burst, and any hindrance of its own still in its warning is stopped. A beam's repeat ticks count nothing; a negative touch is a puff. An ally never turns back.
- **Helping.** An ally runs its herd's helps: it **holds** platform cells that no hindrance may change while it stays, **clears** a wild minion, **carries** the player a short way (never doing the jump for them), or **helps** at the deity, adding a positive hit on a timer up to its floor's cap ([guardians](../guardians/README.md)). On the horse's floor it brings calm instead of hits.
- **When the deity is won**, every wild minion of its floor calms (it stops acting); allies stay allies.
- **The stuck guard.** A minion that has not reached its place in 6 s walks back to the nearest place of the graph; if that fails it fades out for a second of puffs and comes back at its home with its spawn warning. Nothing dies, nothing is left stuck.

## The five herds

| Herd | At most (wild) | Spawn | Hits to turn | What it does (from its code) |
|---|---|---|---|---|
| Little pandas | 4 (3) | the bamboo clumps, every 12 s | 3 | Walks slowly, climbs a column face a block every 1.2 s, rolls down slopes, sits whenever it is not moving; sits and watches a still player; tucks and rolls at a player below it (a soft push); chews an original block that comes back; keeps off the foot well's rim (owner, 2026-11-05). An ally clears a wild one, sits against the panda (two at most), or holds the cell under the player's column |
| Koalas | 6 (6) | asleep in clusters, every 20 s | 3 | Sleeps until disturbed, climbs any face and hangs under branches, never crosses a gap, swings and drops onto a player passing under it and holds on until shaken off (three jumps). An ally holds the thin branch ahead, clears a koala about to drop, or hugs the deity at the Fork |
| Young elephants | 5 (3) | the waterhole, every 15 s | 5 | Walk the ground ring in file behind the oldest, never climbing more than a step; shoulder aside, after an ear flap, a player in the herd's path; stop at the deity's trumpet and close ranks when one is turned. An ally steps in front of a shove, lifts the player one terrace, and answers the deity's trumpet from the waterhole |
| The pride | 6 (4) | the shade rocks, every 14 s | 4 | Stalks low, slow in view and fast out of it, still and staring back when watched; up to two hold ledges the player needs; pounces from above and roars a small freeze, never pouncing on a frozen player. An ally holds a ledge, roars the pride down, or rubs its head on the lion |
| The herd | 5 (3) | the paddock gate, every 15 s | 4 | Gallops a wide loop, comes back at the player once a loop and turns away at 3 blocks, grazes once a loop; kicks a player standing behind it, and the ones the horse sends; bolts when startled by a block placed or a jump landed within 3 blocks. An ally clears the sent ones, carries the player 8 blocks, holds a fading segment, or grazes beside the horse |

## Not built

- **The lion's rally** does not call its two minions, and a koala that turns does not leave a gap that the next sleeper fills in the same cluster (the timer picks any cluster).
- `factionChange` is not emitted when a minion turns, so no practice reacts to it.
- The art gates of the minion models are pending owner review with their deities ([sky art](../../../../art/sky/README.md)).
- Whether minions are projections, and what happens to them after the floor is cleared, are open ([not-built minions](../../../not-built/sky/minions/README.md)).

Code: the engine in `src/sky/creatures/minion.ts` (`Minion`, `MinionSpawner`), `src/sky/creatures/gaits.ts` and `src/sky/creatures/system.ts`; one file per herd in `src/sky/creatures/minions/`. The spawners are built and driven in `src/sky/sky-realm.ts`. Tests: `tests/sky-engine.test.ts`, `tests/sky-minions-spawn.test.ts` and each animal's `tests/sky-<animal>.test.ts`.
