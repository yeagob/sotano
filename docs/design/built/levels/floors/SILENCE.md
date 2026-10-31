# Silence and heaven

Up: [floors](README.md) · Status: built.

Below the ninth floor is silence: a sealed chamber of air on the bedrock, under the boss room of the ninth. Heaven is the sky above the giant tree. The two are joined in a loop. Silence carries you up to heaven if you are still; the top of the sky carries you back down into silence. The owner decided that the connection is cyclic; how the run ends is not decided (see [ENDING-AND-RETURN](../../../not-built/levels/ENDING-AND-RETURN.md)).

## The chamber

- **Place.** The silence chamber lies under the boss room of floor 9, about four blocks high, with rock above it. The way down from floor 9 is a two-by-two shaft that drops straight into it. The way down is free.
- **Name.** The HUD says "Silence". On the first visit a toast says "Silence. Be still."
- **Quiet.** The sound fades out here, and the fog turns to ink-black and close.

## Standing still

Stand still in silence for three seconds (almost no sideways movement, and nearly no vertical movement) and you are carried up to heaven:

- you appear above the giant tree, near the top of the sky, and float;
- the fall is gentle until your first landing, which never hurts;
- a toast says "You are carried up."

## The way back

Once the player has been in silence, the top of the sky takes them back down. Falling into the top of the sky lands you in the silence chamber again: the loop is closed.

## What the player feels

Silence is the one quiet place: the sound goes out, the light goes dark, and standing still is the whole interaction. Heaven is the opposite: the night sky and the stars come out as you climb the tree.

## Not built here

- The mechanism of the loop as the owner's text describes it is open: a fall, a door or a shaft of light were the options named. The build uses standing still and the top of the sky. See [ENDING-AND-RETURN](../../../not-built/levels/ENDING-AND-RETURN.md).
- Heaven and the bottom are linked in the design, and the link is not decided.

Code: `src/world/floor.ts` (the silence chamber under the last floor), `src/game/game.ts` (the three-second stillness, the carry to heaven at the top of the sky, the silence fog, the loop), `src/content/materials.ts` (the ninth floor's chamber).
