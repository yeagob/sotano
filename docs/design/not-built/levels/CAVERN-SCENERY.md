# Cavern scenery (cover-art proposal)

Up: [not-built levels](README.md) · Status: proposal. Three owner decisions of 2026-10-28 are decided and listed at the end; the rules below are not adopted until the art gate passes.

This proposal is for the next level designs, not a decision. It takes the mood of the game's cover (the shaft that goes down, a huge dark cavern of stone, islands in the air, columns from the ceiling, a few warm lights that pull the eye down) and asks which of its features the rooms may borrow. It does not change the art ledger. Anything it adopts goes through the art gate first (see [art](../../../art/DECISIONS.md)).

## The mood

The cover is awe at the bottom of a shaft: scale and contrast, not brightness. Almost everything is dark and cool; the warm points are rare, so each one means something. The small figure on the ledge is the player's point of view, looking out and about to go down.

## What to take from the image

- **Scale.** Rooms should feel bigger than their walls: multi-cell footprints, tall vaults, layers seen across a gap. The sense of space past the walls comes from fog and occlusion, never from a painted backdrop.
- **Floating islands and hanging columns as structure.** Islands are plateaus and layers; columns are pillars from the floor and stalactites from a cave roof. They form the room's vertical language and carry its verb: jump, climb, build.
- **Warm light as the reward in the dark.** One warm focal point per room, readable from across the room.
- **Cool haze for depth.** Far walls fade toward the floor's fog colour, so distance reads cool and near reads warm.
- **Moss and small plants on ledges.** Grass and leaves on the living edges.
- **A shaft of light from above.** One vertical shaft per room at most.

## How it fits the art pillars

The art pillar on warm light says warm is earned and yours. The cover bends that in five places, each needing a reconciliation:

1. **Broad amber glows around the gorge.** Warm light comes from the player, from lava and fire (which hurt), or from a practice. Reconciled by naming the source of every warm light: lava or fire, a lamp the player lit, a practice on a pedestal, or the warmth of a cleared room. No free-floating glow.
2. **Lamps lit everywhere.** Floor-1 lamps are unlit until their room is cleared. A cavern full of lit lamps is the climb; the cover shows the way up, not the way down.
3. **The shaft from above.** Only the surface has a sky, and the surface is not a room. Reconciled as the way up, or the cold slit light of the third floor's ramp. Never a warm light falling from nothing.
4. **Pale speckled faces.** The guide forbids full-tile random speckle. Keep the rhythm of pebbles and pits as shaped stone at a lower value.
5. **A full-body protagonist.** The guide says the hands are the only body. The figure belongs to key art only, and in play it is never drawn.

## What it means for level design

- Use height. A vault uses at least two of its heights: a layer, a pillar or a hanging column, not one empty ceiling.
- Islands are carried, never floating: each stands on a pillar or spans between blocks, at the layer heights the rule already requires.
- Each room has one lit focal point at a height the player sees from the entrance. Two focal points compete; do not place them.
- Three depth planes in every big room: near (the floor, the door approach, the strongest value), middle (pillars and islands, where the verb happens), far (fog and a cooler wall or ceiling).
- A vantage ledge, out of every door approach, that looks over the room.
- Floors own the cover's motifs: floor 1 umber ledges and lamps, floor 2 teal haze and water glints, floor 3 cold slits and slate islands, floor 4 the molten gorge. The cover is a glimpse of the descent, not one room.

## Rules for a room designer

1. One warm focal point per room, with a named source.
2. Hanging columns and stalactites attach to a cave, dome or vault ceiling; they never float. Keep the centre column open up to door height, and nothing hangs within three blocks above the pedestal.
3. Islands sit on a column or span between blocks, at layer heights. No island within three tiles of a door approach on a layer under door height.
4. Room height stays at eight or less, and no room touches the floor above or below. The cover's scale across several floors belongs to the great pit and the giant tree, never to a single room.
5. Scale comes from footprints (two cells), vaults and fog, never from a painted backdrop.
6. Moss and plants only on ledges and wall tops, never on door approaches or in a shaft. Dry yellow plants use the sand and copper ramps, never the light or life ramps.
7. At most one shaft of light per room: vertical, from the ceiling to the floor, in a cold or sky ramp allowed on that floor.
8. Scenery is built only from existing materials. No new material is added for decoration.

## What to check before adopting

- **Voxel count and speed.** The cover is far denser than any room needs. Count visible faces per room, hollow the shells, keep hanging columns to a few cubes, and measure the draw-call budget and the meshing time per chunk. No face budget is set yet.
- **Readability in the dark.** Capture each new room at distance, in colour, greyscale and the colour-blindness filters. The floor stays readable with the lantern; every projection's cold eye still reads; a fired intention is the brightest thing in view; no island or column hides a door.
- **Gentleness.** Focal lights and lamps are steady, breathing at half a hertz or slower, with no flicker.
- **Meaning.** Scenery adds no new concept: the cavern is the husk that holds the light. A room that needs its own concept goes to the lore first.

## What not to copy

- The cover's surface detail as texture. The game keeps its shapes, bevels and the husk band.
- Any plant, rock or lamp shape that matches another game's asset. Copy the principle (scale, islands, one warm point), never the silhouette.
- Bloom. The game's glow is block light and emissive texels, with no default bloom.

## Adoption path (if the owner accepts)

1. Build one test room per floor type (a vault on floor 1, a pit on floor 3, a gorge on floor 4) and capture it in the gallery.
2. Pass the art gate on each new block, light and colour, and the validator.
3. Write the accepted rules into the art guide and this section, and move the adopted rules out of the proposal.

## Owner decisions (2026-10-28, decided)

1. The cover's figure is key art only. The game keeps the rule that the player's body is never shown: only the hands.
2. The cavern richness goes into floors 1 to 5. Those floors need more detail and decoration: lamps, plants, carved stone, hanging and supported islands, moss on the ledges. The warm light stays earned, one source per room.
3. The great pit is the only place where the cover's scale is allowed: the floor-5 abyss, with its shaft into the next layer.
