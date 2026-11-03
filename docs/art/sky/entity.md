# Sky art: The Spiked Entity

Up: [Sky art rulings](README.md)

Captures: `?gallery=sky-entity` (add `&filter=grey|deutan|protan|tritan`, `&angle=<degrees>`). Every capture is taken inside a 4-high chamber of silence (bedrock floor, deepstone roof and far wall), in silence's ink fog (near 0, far 14), from the player's eye height (1.62) with the game's camera and lights. Rows: front, ¾, side and back; the shimmer off and on; distance 4, 8, 12 and 14 blocks; value against deepstone, obsidian, bedrock and ink with no fog; the turn of the revelation; the palette.

Code: [`src/endgame/entity-view.ts`](../../../src/endgame/entity-view.ts) (the model, pure data in `entityBoxes()`), [`src/content/palette/sky-entity.ts`](../../../src/content/palette/sky-entity.ts), [`src/debug/gallery/sky-entity.ts`](../../../src/debug/gallery/sky-entity.ts), [`src/audio/sky/entity.ts`](../../../src/audio/sky/entity.ts). Architecture: [SKY.md §10.1 and §11](../../architecture/SKY.md). Design: [ENDGAME.md](../../design/not-built/story/ENDGAME.md).

## The meaning test

- **What it stands for.** The conviction that the way is down: everything the player built and armoured on the descent, gathered at the bottom into one bristling, immovable thing. Concept: *the true path is up* ([CONCEPTS.md](../../lore/CONCEPTS.md)). It does not attack: it tells you the truth and opens the way.
- **Which side.** Neither a projection nor the player's. It is the bottom of the world: it belongs to the depths, so it takes the depths' dark and a faint cold, and nothing of the player's (no gold of its own, no red, no path hue). It is not a projection: no family eye, no cold husk pattern of a room, no telegraph, no release, no shard.
- **What the intention does to it.** Nothing. Every touch bounces, whatever the polarity or kind: a dull tink, cold motes, and its tips catch the player's own light for a moment and let it go. It is a fixed point with a stated reason: it cannot be overcome in this build (no rematch, owner decision 3); only the Sun's light could pierce it, later, with Unity.
- **Does it read with no text.** Yes: a low, dark, wide mound at the far end of the dark chamber, its cold outline visible before its body, bristling with spikes swept back from a bare front; it turns that front to you as you come near. Shots bounce off it and nothing changes.
- **Would someone who lives this pattern feel seen.** It is not a person and not a diagnosis: it is the shape a long, mistaken effort takes. It is not mocked or destroyed; it is the thing that finally says *you were meant to climb*.
- **Red lines (ART-GUIDE §11).** No sacred name or symbol, no human features (no face, mouth or eyes), no gore, no family. Its name is provisional (owner, ENDGAME.md open question 1).

## Rulings (EN, 2026-11-03; OWNER to confirm the look)

1. **Shape.** Four stepped slabs of husk, 48 × 40 texels at the base to 24 × 16 at the top, 2.625 blocks of body; a bare front brow (no spikes on the lower two slabs' front within 0.9 of the middle) so the front and its turn read. Low and wide: 4 blocks of touch box across, 3 high (`ENTITY_HW = 2`, `ENTITY_H = 3`).
2. **Spikes, countless and stepped.** Each spike is a stack of thin boxes in whole texels, each narrower than the one under it (long: 6, 5, 4, 3, 2 texels wide; short: 5, 4, 3, 2), rooted 3 texels inside the slab. They grow from two staggered rows on the tall slabs and one row on the others, one long spike on every slab corner, and a short crown on top, all swept up and back. Their placement is a fixed hash of each spike's index: the entity draws nothing from any random stream. More than 60 spikes; their shafts lighten from root to tip (`entity.husk.hi` → `entity.spike.base` → `entity.spike.mid` → `entity.spike.tip`).
3. **The cap.** With its spikes and its breath the model stands under 3.5 blocks (tested): a spike that would reach the roof loses its outer segments, so the camera never clips a spike against the chamber's roof.
4. **Value: a dark husk with a faint cold rim.** Body tokens L* 2–9 (mean ≤ 14, like a dark husk), spikes L* 11–17, tips L* 27, and a 1-texel rim (`entity.rim`, L* 41) just outside each slab's top edge. The rim is ≥ 20 L* over deepstone (L* 21) and bedrock (L* 8). The rim and the tips are drawn unlit, so they hold their value in the dark.
5. **The rim is its tell and ignores the fog** (DECISIONS G1: readable first). In silence's fog (complete at 14 blocks) the body is gone by 12 blocks; the cold outline of the slabs still shows, so the player sees that something waits at the far end long before they reach it. The tips fog like the body.
6. **The cold here is the depths', not a projection's.** `entity.rim` and `entity.spike.tip` are their own tokens, dimmer than `cold.rim` and outside the `cold.*` namespace, so cold stays the projections' (DECISIONS §3.12 rule 3).
7. **The bounce: the player's light, borrowed.** When a touch bounces, the tips' colour eases toward `light.gold` to at most 40 % and back. This is the one use of `light.*` on the entity, and it is the player's own light reflected, never the entity's: it never lights a block, never stays. At 75 % (first try) the entity read as golden, as if it had been mended or won; 40 % reads as a glint of your own light on something that does not change.
8. **Gentle.** The shimmer never blinks: it is held while touches keep landing (0.3 s after the last), rises at 5 per second and falls at 1.5 per second, so a beam gives a steady glint and single shots a soft rise and fall (tested: the level never alternates). The breath is ±1.2 % at 0.18 Hz; poses step at 12 fps; the turn is 1.2 rad/s.
9. **Sound** (`src/audio/sky/entity.ts`). In silence the master falls to nothing; the entity's voices go through their own gain, so it is the one thing heard there. `drone`: two low sines 1.5 Hz apart (a slow beat, far under 3 Hz) with a fifth and a little low noise, 2.4 s, swelling in and out; `tink`: a dull stony tick, at most one every 0.09 s; `chord`: open fifths climbing a quarter second apart (G, D, G, D, A), left open at the top: the way up.

## Gate (EN, 2026-11-03)

Looked at in colour, greyscale and the three colour-blindness filters: the entity is near-achromatic, so it reads by value in every one; the shimmer's gold stays the brightest thing on it under deutan and protan and turns pink-gold under tritan, like the player's gold everywhere. At distance the rim carries it to the edge of the fog. Against deepstone and obsidian the body reads as a dark silhouette; against bedrock (its own floor) by the rim and the tips. The silhouette filter blacks out the whole frame in this dark scene and was not useful.

Open for the owner: the look as a whole, the provisional name, and whether the bounce's glint of gold should stay.
