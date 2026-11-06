# The guardians of the sky (built)

Up: [The sky (built)](../README.md) · the five deities as they run in the code now.

The five deities of the sky tree's first five floors are in the code: each one is spawned on its floor when the sky realm is built, wakes when the player reaches that floor, fights with its attacks and special attacks, and is won by positive hits. What each deity does is in its own document below; what they share is here. The full design, with the targets the build follows and the open questions, stays in [not-built guardians](../../../not-built/sky/guardians/README.md).

| Document | Deity | Floor | Hits to win | Phases |
|---|---|---|---|---|
| [PANDA.md](PANDA.md) | Giant panda | 1, the bamboo seat | 24 | 2 |
| [KOALA.md](KOALA.md) | Koala | 2, the branches | 30 | 3 |
| [ELEPHANT.md](ELEPHANT.md) | Elephant | 3, the channels | 36 | 3 |
| [LION.md](LION.md) | Lion | 4, the plain | 42 | 3 |
| [HORSE.md](HORSE.md) | Horse | 5, the meadow | 48 | 3 |

## What every deity does

- **A plush body under a giant head.** Each deity is a small, round, soft body of cube parts under its animal's giant head, cute, not threatening. Every deity levitates over its seat with a slow bob, except the horse, which walks and leaps.
- **One deity at a time.** All five exist from the moment the player first rises into the sky; only the deity of the player's floor moves. A won deity stays won for the run, across every passage down and back.
- **The cycle.** Idle (or the animal's own rest), Watching once the player is in sight, Attacking (one attack, its telegraph first), Recovering (the best moment for a hit), then Watching again. A positive hit plays a short flinch that never cancels a telegraph already shown. At each change of phase the deity rallies for 2 s, and the next phase adds its attacks. An attack is not repeated back to back when another is available.
- **Telegraphs** use the animal's own parts (lids, ears, trunk, mane, hind legs) and last the floor's length: 1.4 s on the panda's floor, 1.2, 1.1, 1.0, and 0.9 s on the horse's, never under 0.8 s. A special attack that drains shows 0.2 s more, a capture 0.5 s more.
- **Attacks never take health.** They push, slow or hold the player through the hindrances ([abilities](../abilities/README.md)); special attacks drain spirit or capture ([SPIRIT](../laws/SPIRIT.md)).
- **Positive hits.** A positive intention or stroke that touches the body or head, while the deity is not guarded, is one hit: a gold mark stays where it landed, and the animal shows its own sign of progress. Negative touches are puffs ([TOUCH](../laws/TOUCH.md)).
- **Won.** At its hit count the deity is won to the player's side: it changes its attitude (provisional), a toast says so, the player's spirit refills (provisional), and only then the floor's way up opens ([WAY-UP](../laws/WAY-UP.md)). The horse also leaves its gift, the Triple Jump.
- **Teleport.** The koala and the horse teleport (provisional). The koala gives one telegraph of warning, then reappears at the place of its floor farthest from the player that is still within its sight, never within 12 blocks (the farthest of all only when no place lies in that band), so it keeps fighting after it lands. The horse vanishes into a paddock beyond its leap, at least 12 blocks from the player ([HORSE](HORSE.md)).
- **Allies help.** A minion turned ally that stands by its deity adds positive hits on a timer, up to its floor's cap ([minions](../minions/README.md)); on the horse's floor allies bring calm instead of hits.

## Gaps every deity shares

- **The art gates of all five deities are pending owner review**: each model is drawn and has its gallery section (`?gallery=sky-panda` and the others), but the owner has not signed any of them off ([sky art](../../../../art/sky/README.md)).
- **The greyscale, colour-blindness and fog captures are not taken** for any deity.
- **No floor spawns minions in play.** The minions are built and tested headless, but the realm runs no spawner, so the herds, prides and families are not met yet ([minions](../minions/README.md)).
- **The tower rule inside a floor** is not wired: a tower that reaches a deity's height does not start the knock, and no deity's body travels to a tower ([OUTSIDE-WATCH](../laws/OUTSIDE-WATCH.md)).
- **The boss bar** does not show a deity's hits yet; the gold marks and the animal's own sign are the only progress shown. The names (`sky.<animal>.name`) are in both languages for when it does.
- **Sounds.** Each deity's telegraph sounds are named, but only the lion's play (placeholders made of the game's existing cues); the others are silent.
- **Seen in play:** the fights run headless in their tests; none of the five has been played through by the owner.

Code: the machine in `src/sky/creatures/deity.ts`, one file per deity in `src/sky/creatures/deities/`, spawned by `src/sky/sky-realm.ts`; architecture in [SKY.md](../../../../architecture/SKY.md) section 5.3.
