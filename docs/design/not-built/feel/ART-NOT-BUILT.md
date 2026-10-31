# Art not yet built

Up: [not-built feel](README.md)

Status: decided (the owner approved the art guide and its ledger; the work is planned in phases A to C of the ledger and has not started).

The art pass of 26 October made the build follow the guide in colour, materials, cracks, projections, pickups, hands and the HUD ([built ART](../../built/feel/ART.md)). What the guide still waits for is listed here. The authority is [ART-GUIDE, section 15.3](../../../art/ART-GUIDE.md) and the phased plan in [DECISIONS, section 12.9](../../../art/DECISIONS.md).

## The work, by phase

**Phase A, foundation.** Each item below needs the architecture decided first, through the three-party review that the ledger requires.

- **One shading model.** Unlit baked cubes, with no scene lights. Today the world and the creatures are still lit by scene lights. Each floor gets its own look and fog table, and the vertex colours are corrected for display.
- **The texture atlas.** A data array texture with four variants per common material, mipmaps, and a named tile table. Each floor's look repaints its materials.
- **The creature pipeline.** Face frames swapped by texture coordinates, host-material skins, poses stepped at 12 frames a second, joints at pivots, materialisation from the room's own blocks, and each projection's motif sound.

**Phase B, the look.**

- **Block light.** A light that spreads through the blocks, computed in the background, with a lantern and a clear wave.
- **Shards and seams.** Shards on loose and held blocks. The mended layer: a placed block carries gold kintsugi seams, so what was repaired is visible.

**Phase C, HUD and accessibility.**

- **Fonts.** The two faces the ledger chooses (Pixelify Sans and Atkinson Hyperlegible Next) are not loaded: the page has no font declarations, and the faces are an owner choice still open in the ledger.
- **The settings page.** Shake, flashes, field of view, interface scale, reduced motion and skin tone. Not built: there is no settings page.
- **The hexagram** on the start, pause and death screens. See [HEXAGRAM](HEXAGRAM.md).

## Open questions

1. **Missing art paths.** The ledger names three paths that do not exist in the code: `src/render/creature/types.ts`, `src/render/pixels.ts` and `src/content/tables/floor-looks.ts`. The creatures exist in the content folder, and the painters live elsewhere. The owner or the art skill decides: create the three files as the phases need them, or amend the ledger to the real paths. Until then the ledger describes a layout the code does not have.
2. **The font faces.** Which faces, and whether they are loaded from a font host or shipped as files (the ledger lists the choice as owner question 2).
3. **The settings page.** Whether it is part of the first release or of a later phase.
4. **Kintsugi.** Whether the gold seams are shown on every placed block, or only on blocks the player has mended.
