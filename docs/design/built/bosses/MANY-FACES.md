[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# The Many Faces

Built, in part. Floors 7 and 8, from the Zone IV pool. Code: `src/content/bosses/many-faces.ts`.

The Many Faces is a cube with a face for everyone: two bright eyes, and a ring of masks on stone around it. Its masks show what the player wants to see. In the build, it summons lesser patterns, then swaps its place with a strike. Its phases use the older emitter behaviours.

- **Pattern:** people-pleasing, a face for everyone. To be loved.
- **Path:** Emotion.
- **Health:** 612 on floor 7, 782 on floor 8.

## Phases

### Phase 1: charms

It walks at the player and keeps about five blocks away. Every six seconds it summons one random projection from the doubt, the critic and the panic.

- Arena: none on entering.

### Phase 2: swaps (from two thirds of its health)

Arena `faces`: toast only. Every three seconds it moves to a seeded point on a ring a third of the room's width from the centre, and a ring of force grows from there, doing 8.

### Phase 3: plain (from one third of its health)

Arena `plain`: toast only. Every 2.2 seconds a ring of force grows out of its own body, doing 8.

## Toasts

- Entering phase 2: "It swaps: the masks change places, and only one is real".
- Entering phase 3: "The masks fall: one plain face is left".

## Defeat

As in [Fight flow](FIGHT-FLOW.md#7-defeat). The design's ten masks becoming stepping stones is not built.

## Open questions

- **Masks.** The design has ten masks around a ring; the model has six. Which number?
- **Charms.** The design has each mask copy one projection of the floor. The build summons one of three basic patterns. Is that the intent?
- **Swaps.** The design has the masks change places and only the one facing away be real. The build moves the boss and no mask is real or false.
- The full design is in [not-built/bosses/MANY-FACES.md](../../not-built/bosses/MANY-FACES.md).
