[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# The Grudge

Built, in part. Floor 6, from the Zone III pool. Code: `src/content/bosses/grudge.ts`.

The Grudge is something huge under the marsh: from the surface, only a long back of mud and stone shows, with two eyes near its front. It surfaces where the player is not, and it erupts across the room. Its phases use the older emitter and charge behaviours.

- **Pattern:** resentment, grown old. To never be hurt again.
- **Path:** Emotion.
- **Health:** 478 on floor 6.

## Phases

### Phase 1: surfaces

Every 3.5 seconds it surfaces at a seeded point in the room: a ring of mud rises there after a 0.9-second warning. If the player is not within three blocks of that point, the Grudge moves onto it.

- Arena `mud`: toast only, shown on entering phase 2.

### Phase 2: erupts (from two thirds of its health)

Every 2.2 seconds it erupts twice: two rings of mud at two seeded points, each after a 1.1-second warning, each doing 6.

- Arena `surface`: toast only, on entering phase 3.

### Phase 3: charges (from one third of its health)

It charges the player along a line, runs 1.6 blocks, stuns for 1.6 seconds on hitting a wall, then repeats after 1.4 seconds.

## Toasts

- Entering phase 2: "It erupts: bursts of mud cross the arena".
- Entering phase 3: "It surfaces to breathe, and then it charges".

## Defeat

As in [Fight flow](FIGHT-FLOW.md#7-defeat). The design's causeway across the marsh is not built.

## Open questions

- **Sulks.** The design has Sulk projections rise around it when it waits. The build has no Sulks around the Grudge.
- **Waiting.** The design has it surface "where you aren't". The build moves it to where the ring lands unless the player is close. Is that the same?
- **The core.** The design puts its core in its back. The build has only the eyes.
- The full design is in [not-built/bosses/GRUDGE.md](../../not-built/bosses/GRUDGE.md).
