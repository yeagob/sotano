# The laws of the sky (built)

Up: [The sky (built)](../README.md) · the realm's laws that run in the code now, one document per law.

The sky keeps its own laws, written by the owner in [not-built/sky](../../../not-built/sky/README.md) section 3. The laws below run as systems while the player is in the sky realm; each one is checked by its own tests. What a law still lacks is written in the not-built README under that law's number.

| Document | Law | What the player meets |
|---|---|---|
| [REGROWTH.md](REGROWTH.md) | 3.1 | A broken sky block shimmers and comes back; it drops no cube |
| [PLAYER-BLOCKS.md](PLAYER-BLOCKS.md) | 3.2 | Blocks the player places stand against everything but a positive intention |
| [TOUCH.md](TOUCH.md) | 3.3 | Every shot, stroke and blast reaches a sky creature; a negative one is a puff |
| [NO-HARM.md](NO-HARM.md) | 3.7, 3.10, 3.11 | Nothing dies, the player's health is never taken, no item room events |
| [WAY-UP.md](WAY-UP.md) | 3.5 | Each floor's way up opens when its deity is won |
| [OUTSIDE-WATCH.md](OUTSIDE-WATCH.md) | 3.8, 3.9 | A tower outside the tree is warned of, then knocked down by the guardian of that height |
| [NESTS.md](NESTS.md) | shared 6.3 | Hollows of three loose cubes that refill |
| [SPIRIT.md](SPIRIT.md) | 3.10 | Spirit, the outline of the hearts: the drain gate, the fall underground, the refill |

What every law shares:

- **It runs only in the sky.** The laws install when the player passes up and are removed when they come down; nothing of them reaches the dungeon.
- **It warns first.** A law that changes something the player sees (a block returning, a tower coming down) shows its warning first (law 3.6).
- **It never takes health.** No law, creature or hindrance of the sky calls damage on the player.

The fall recovery of Totality (the updraft) is a law of the sky too; it is written with Totality, in [built levels](../../levels/totality/UPDRAFT.md).

Code: `src/sky/laws/` (one module per law), run by `src/sky/sky-realm.ts`; the architecture is [SKY.md](../../../../architecture/SKY.md) section 4.
