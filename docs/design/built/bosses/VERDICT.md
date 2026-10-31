[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# The Verdict

Built, in part. Floor 6, from the Zone III pool. Code: `src/content/bosses/verdict.ts`.

The Verdict is a long bench of ledger stone with seven tall lecterns standing on it. It judges the player from a distance, and at close range it charges. Its phases use the older emitter and charge behaviours, not the full move system.

- **Pattern:** the Tribunal, grown old. To be beyond reproach.
- **Path:** Mind.
- **Health:** 478 on floor 6.

## Phases

### Phase 1: accuses

It walks toward the player and keeps about four blocks away. Every two seconds it fires three bolts at the player's position, spread a little, at speed 9. Each does 4.

- Arena: none on entering.

### Phase 2: sentences (from two thirds of its health)

It keeps walking at the same distance. Every 2.2 seconds it drops a slow field of two blocks' radius, at a seeded point in the room, that lasts three seconds after a one-second warning. The player is slowed while inside.

- Arena `marks`: toast only.

### Phase 3: charges (from one third of its health)

It charges the player along a line, with a short run and a stun on hitting a wall, then repeats after a cooldown of one second.

- Arena `turn`: toast only.

## Toasts

- Entering phase 2: "It sentences: slow marks cover the floor".
- Entering phase 3: "It turns: its back, painted with a giant mark, is open".

## Defeat

As in [Fight flow](FIGHT-FLOW.md#7-defeat). The design's blank floor of ledger stone, warm once walked on, is not built.

## Open questions

- **Marks.** The toast says marks cover the floor. The build drops a few slow fields. Make the toast true, or the floor true?
- **Lecterns.** The design fires the seven lecterns in sequence, left to right. The build fires three bolts from one body. Which?
- **The back.** The design has the bench turn and its back open to hits. The build has no turn; the phase 3 charge runs at the player with the front toward them.
- The full design is in [not-built/bosses/VERDICT.md](../../not-built/bosses/VERDICT.md).
