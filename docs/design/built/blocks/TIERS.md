# Tiers and materials

The four tiers of breakable blocks, the built materials in each, and how many hits each takes.

Part of [blocks](README.md).

## What the player sees and feels

- Blocks differ by how long they take to break. Tier 0 blocks break in one or two hits from a starting intention. Tier 1 blocks take about four. Tier 2 blocks take eight to fifteen. Tier 3 blocks take eighty hits or more, and they are a real time wall.
- Tier 3 blocks are where the time wall is real: at the starting fire rate, an obsidian block takes about thirty seconds of steady fire, and a pedestal or star stone about forty-five.
- Bedrock is the floor of the world and never breaks. Chests never break either: only a key opens them, or walking up to one.

## The rule behind it

Every breakable block breaks with enough hits. Armour reduces the damage of each hit, but never to zero: at least a tenth always gets through, so "with enough intent you can break anything" holds, while the high tiers are still a real time wall ([DESIGN.md, section 5](README.md)). The tiers and their hit points are data, not code, and the materials list is the one place they are set.

Code: `src/content/materials.ts` (the material definitions, the tier, hit points and armour of each), `src/core/damage.ts` (the hits a block takes, lines 9-25).

## Hits at base mining

The hits below are for a starting intention with mining 3.5 and no items. The number of hits is the hit points divided by the damage a hit does after armour, rounded up. Every item that changes mining changes the count.

| Tier | Material | Hit points | Armour | Hits |
|---|---|---|---|---|
| 0 | Dirt | 3 | 0 | 1 |
| 0 | Grass | 3 | 0 | 1 |
| 0 | Crate | 4 | 0 | 2 |
| 0 | Leaves | 2 | 0 | 1 |
| 1 | Dungeon brick, stone, dark brick, slate, ashlar, rubble masonry, wet brick, flagstone, packed earth | 10 to 12 | 0.5 | 4 |
| 1 | Living wood | 14 | 0.5 | 5 |
| 1 | Ice | 6 | 0 | 2 |
| 2 | Iron ore | 18 | 1 | 8 |
| 2 | Deepstone | 25 | 1.5 | 13 |
| 2 | Door frame, brass frame, obsidian frame | 30 | 1.5 | 15 |
| 3 | Obsidian | 40 | 3 | 80 |
| 3 | Pedestal, star stone | 60 | 3 | 120 |
| none | Bedrock | never | none | never |
| none | Chest, open chest | never | none | never |

The door frames sit one tier above the walls, so the threshold of a room reads as tougher than its walls. The pedestal's concept is where a practice waits; the star stone's is a fixed point to steer by.

## Open questions

1. **Obsidian and deepstone hit counts.** The design table gives about thirty hits or more for tier 3 and about ten for tier 2 with starting intentions ([DESIGN.md, section 5](README.md)). The code gives 80 hits for obsidian and 13 for deepstone at the same mining (`src/content/materials.ts`, the obsidian and deepstone lines; `src/core/damage.ts`). Which numbers does the owner want? The code is playable; the design is a target.
2. **Rune stone and sand.** The design lists rune stone in tier 3 and sand and cobweb in tier 0 ([DESIGN.md, section 5](README.md)). None of them exists in the code. They are in [not-built/blocks/NEW-MATERIALS.md](../../not-built/blocks/NEW-MATERIALS.md).
