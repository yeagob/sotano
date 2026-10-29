# Burning cubes

Up: [not-built elements](README.md) · Status: proposal.

A loose flammable cube that touches fire would burn for a while before it breaks, and a projection, Burnout, would leave burning cubes behind it. The build removes a flammable loose cube at once when it enters fire, and Burnout leaves a slowing field, not a burning cube.

## What it would do

- **Burns while loose.** A kicked or carried crate that touches fire keeps burning for a few seconds and is destroyed when it burns out. The player can kick it, spreading the fire.
- **Burnout leaves burning cubes.** When Burnout spends its run it leaves burning cubes around it, which spread fire into the room.

## What it reacts with

Fire (catches), the player's kicks and throws (carries the fire), Burnout (leaves them).

The same delay applies to fixed blocks. The design says a burning block keeps burning for a few seconds, spreading to its flammable neighbours, before it breaks; the build breaks a block at once when it catches and leaves a flame in its cell (see [FIRE](../../built/elements/FIRE.md)).

## Open questions

1. A burning loose cube: is it destroyed at once, as in the build, or after the burn time, as in the design? The owner should choose.
2. A burning fixed block: keep the build's instant break, or the design's few seconds of burning before it breaks?
2. Does a burning cube that is put down in water go out, as the design says?
3. Which cubes burn: crates only, or also living wood and leaves?
4. How many burning cubes does Burnout leave, and where?
