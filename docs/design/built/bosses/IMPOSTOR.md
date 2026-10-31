[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# The Impostor

Built, in part. Floors 7 and 8, from the Zone IV pool. Code: `src/content/bosses/impostor.ts`.

The Impostor is a hollow frame of brass, never gold, with a smile too wide for it. Inside the frame there is a small, real figure, which the player can see only when the frame is broken. Its phases use the older charge and emitter behaviours, and it fills the room with lesser patterns.

- **Pattern:** fear of being found out. To be safe.
- **Path:** Emotion.
- **Health:** 612 on floor 7, 782 on floor 8.

## Phases

### Phase 1: charges

It charges the player along a line: aim 0.7, speed 4, a run of 1.6 blocks, a stun of 1.2 seconds on hitting a wall, a range of ten blocks, a cooldown of 1.4 seconds.

- Arena: none on entering.

### Phase 2: hides (from two thirds of its health)

Arena `brass`: toast only. Every six seconds it summons two random projections from the doubt, the critic and the panic.

### Phase 3: exposed (from one third of its health)

Arena `frame`: toast only. Every 2.4 seconds it throws a ring of force from its own body, doing 8.

## Toasts

- Entering phase 2: "It hides: false figures fill the frame".
- Entering phase 3: "The frame breaks: the small figure was the only real thing".

## Defeat

As in [Fight flow](FIGHT-FLOW.md#7-defeat). The design's empty frame standing as a doorway is not built.

## Open questions

- **Imitation.** The design has it imitate the bosses the player has met this run, in brass. The build summons the three basic projections instead. Is the mimicry worth building?
- **The small figure.** The design has the figure exposed when the frame breaks. The build has no weak point: the boss's health runs out as it does for any boss.
- **Status line.** The design table does not mark the Impostor as a proposal. Confirm that it is decided.
- The full design is in [not-built/bosses/IMPOSTOR.md](../../not-built/bosses/IMPOSTOR.md).
