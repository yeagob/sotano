# Sky art: Sky blocks and atmosphere

Up: [Sky art rulings](README.md)

Captures: `?gallery=sky-blocks` (add `&filter=grey|deutan|protan|tritan|silhouette`). Drawn by AB (art agent, 2026-11-03; OWNER to confirm the looks); TR appends the trunk and the deck.

The sky's thirteen materials, their tiles, and the air: fog and clear colour by place and height. The shared rulings they follow (pale matter, nothing red, the Sun's warmth) are in [README.md](README.md).

## The materials (ids 30–42, `src/content/materials.ts`)

All sit on the world's side. All but two are **as tough as brick** (tier 1, hp 12, armor 0.5), so breaking feels the same as below; **none is flammable**. **Heartwood** and the **sun seal** are unbreakable (`tier: Infinity, hp: Infinity`, like the kitchen): fixed points with a reason (the heart of the tree; the Sun not open yet). Tokens: palette part `src/content/palette/sky-blocks.ts`, `mat.<key>.{outline,dark,base,hi}`. Tiles: `src/render/atlas.ts`; every one is a shape grammar lit from the top-left, never noise (DECISIONS §6.1).

| Id | Material `key` (concept) | Ramp: outline / dark / base / hi (base L*) | Pattern | Where |
|---|---|---|---|---|
| 30 | **Cloud** `cloud` (what holds you up once you stop holding on) | `#A29D94 / #C6C2B9 / #E2DFD7 / #EBE7DE` (88.9) | `cloud`: two banks of billows lying flat (domes 8 px wide, the lower bank shifted by 4), each dome lit `hi` on its crest, the bank behind in `base` with a `dark` crease, a flat `dark` underside. **No outline anywhere**: a cloud has no hard edge, and the first draw (puffs ringed in `outline`) read as cobblestone | The deck |
| 31 | **Sky wood** `skywood` (a branch reaching for the light) | `#3F372F / #665C50 / #8F8372 / #AFA390` (55.4) | `branch`: smooth pale bark, four shallow fissures in `dark` that wander ±1 px and break off, each with a `hi` ridge on its left; five short `outline` lenticels lying across the bark (the mark of a branch, never of a trunk); one branch eye. End faces: its own tile `TILE_SKYWOOD_TOP` (the log's end grain painter in this ramp) | Branches, run segments, the thorn tree |
| 32 | **Heartwood** `heartwood` (the heart of the tree: what in you does not break) | `#22150D / #3B2416 / #563621 / #744B2E` (25.9) | `heartwood`: dense polished figure, grain lines every 4 px that rise and part around one small knot, `hi` streaks on alternate bands. Never straight vertical stripes (they read as boards, owner round 3); the knot is small so a wall of heartwood is not a grid of dots | Trunk wall, slabs, membranes (unbreakable) |
| 33 | **Sky leaf** `skyleaf` (what grows high, where the light is) | `#253629 / #3E5947 / #5F806C / #84A491` (50.6) | `skyleaf`: six long pointed leaves lying every which way (no two neighbours point the same way, so it never reads as scales), each with a `dark` midrib and a `hi` upper edge, `outline` shade between them. Silver-green, cooler and paler than the dungeon's `leaves` (issue #12: leaves with their own texture) | Canopy, petrified leaf clusters |
| 34 | **Bamboo** `bamboo` (what bends and does not break, and keeps rising) | `#4A4A24 / #77773C / #A9A866 / #C9C68C` (67.6) | `bamboo`: two culms of 8 px rounded by a `hi` left edge and a `dark` right edge, `outline` between them; each culm ringed by one node at its own height (an `outline` ring over a `hi` ridge), a sheath leaf and a long gloss streak. End faces: `TILE_BAMBOO_TOP`, four open culms (a ring of wall round a hollow) | The panda's floor |
| 35 | **Moss** `moss` (the patience that softens every fall) | `#232B17 / #38432A / #4E5C38 / #677650` (37.0) | `moss`: a dense uneven cushion of small 4 × 4 tufts (a dome lit `hi` top-left, `dark` under, an `outline` shadow), one in five in shade, on a `dark` ground | The koala's central gap |
| 36 | **Pale stone** `palestone` (old ground warmed by the sun) | `#6A6150 / #958A75 / #B8AC94 / #D2C8B2` (70.8) | `plates` (the stone painter: Voronoi plates, one tone each, `outline` edges, `hi` top-left) in a pale sand ramp | Terraces, rocks, boundary stones |
| 37 | **Fence wood** `fencewood` (a boundary kept with care) | `#2B2621 / #48423A / #675F55 / #877D71` (40.8) | `fence`: three weathered rails laid flat (the door leaf's boards on their side): `hi` top edge, `outline` gap, long `dark` grain lines (6–11 px), one butt joint with its peg, a knot on the top rail. The first draw (a joint on every rail) read as brick | The horse's paddocks |
| 38 | **Mist** `mist` (a step that holds only while you trust it) | `#7E7C77 / #97958F / #B0AEA8 / #C4C2BC` (71.1) | `mist`: long thin wisps lying flat, `hi` above, broken `dark` under, low contrast, no outline: a step that is barely there. The swap material of fading platforms (the grey of the fade itself is an effect, SKY.md §11) | Wherever a platform fades |
| 39 | **Star resin** `starresin` (starlight held still long enough to stand on) | `#3A564F / #5B7F76 / #84A89D / #AACABF` (66.0), accent `bone.paper` | `resin`: five rounded drops of set light (`hi` rim top-left, `dark` under, `outline` shadow), three 2 px glints of `bone.paper` (6 px, inside the accent budget) | Totality, lower stratum |
| 40 | **Meteor glass** `meteorglass` (what fell burning and came out clear) | `#0F1A12 / #1E3424 / #2F4E36 / #4B7452` (30.2) | `tektite`: dark green glass rippled with melt-flow ridges (`outline` groove, `hi` crest), two glints. Real meteor glass (tektite, moldavite) is bottle-green and sculpted by its fall; the first draw used obsidian's facets, whose two dark diagonals made an ✗ on every face | Totality, the void |
| 41 | **Solar glass** `solarglass` (what the heat of the Sun made clear) | `#5E4A30 / #8C7450 / #B49A70 / #D8C49C` (65.0) | `glass`: a cut block, bevelled (`hi` top and left, `outline` and `dark` bottom and right), deeper toward the lower right, two parallel `hi` glints and one `outline` flaw. Not emissive: the Sun never lights the blocks (README §7) | Totality, upper stratum; the ring at the threshold |
| 42 | **Sun seal** `sunseal` (the Sun, not open yet) | `#7A6440 / #C8B385 / #F3EEE2 / #F8F3E8` (94.2) | `seal`: a pale disc in a bevelled square, ringed like a medallion (a `dark` groove, a raised rim lit `hi` top-left, a sunken ring) and closed on its centre. **Rings, never rays** (four rays read as the Critic's ✗); no seams that could read as cracks (cracks are the player's mark); no face, no religious sun symbol. The first draw (an iris of blades) read as a cracked plate | Reserved for Unity (unbreakable); not placed in the climb since the entrance of 2026-11-05 |

**Cracks** are the shared cracks of light (DECISIONS §6.3) on every breakable sky material; heartwood and the sun seal never crack. **Break particles** use each material's `colors` as everywhere.

### The atlas (`src/content/tiles.ts`)

The atlas grew from 8 × 6 to **8 × 8 = 64 tiles**. Tiles 0–47 are materials (tile = material id, room for five more); the special tiles follow the material range: 48 grass top, 49 log top, 50 sky wood end, 51 bamboo end, 52–55 the four crack stages. `tileFor` gives sky wood and bamboo their end tiles on faces +Y and −Y.

### Measured (CIE76 after Machado 2009, the maths of `tests/art.test.ts`; OKLab for pillar 1)

- **Nothing red:** every sky token ≥ 20 from `life.heart`, `attack.red.*` and `attack.warn.base` in normal vision; nearest `mat.heartwood.hi` 47.3 from `life.heart`. Under protanopia `mat.palestone.outline` is 3.8 and `mat.meteorglass.hi` 4.7 from `life.heart`, under deuteranopia `mat.bamboo.dark` 6.7: the red–green axis is gone for those players everywhere; nothing in the sky means harm.
- **Gold marks read:** every sky token ≥ 20 from `light.gold` (nearest `mat.bamboo.base` 34.7; the corona 36.9). Under tritanopia the corona is 14.9 from the gold.
- **Clear of the cold and the light's white:** every material token ≥ 15 from `cold.body/rim/dim/deep`; the near-whites keep ≥ 8 from `cold.white` and `light.core` (`mat.cloud.hi` 9.9 from `cold.white`; `mat.sunseal.base` 15.2 from `light.core`). Under tritanopia the seal and the cloud come within 4–7 of both whites: they are matter, never emissive, so value and pattern carry them.
- **Pillar 1 (stated exception, README §6):** OKL 0.20 (`mat.meteorglass.outline`) to 0.97 (`mat.sunseal.hi`); chroma ≤ 0.06 except heartwood 0.070, bamboo 0.087, meteor glass 0.070, solar glass 0.065, the seal 0.066.
- **Distance colour (DECISIONS §6.1 rule 9):** 24 pairs that can touch on one floor differ by ≥ 0.12 OKL or ≥ 30° hue (enforced). The tightest: sky wood and fence wood 0.13 OKL (both on the horse's floor), cloud and mist 0.15.

## The air (`src/sky/atmosphere.ts`)

`atmosphereAt(place, y)` is pure: the fog colour, the clear colour (the sky), the fog's near and far, and how much of the stars shows (0–1). Between stops it eases (smoothstep), so no height has a seam: no one-block step changes a colour by more than 3 ΔE or the fog far by more than 2 (enforced).

| Place | Height | Clear | Fog | Near / far | Stars |
|---|---|---|---|---|---|
| **deck** | any | `sky.day` `#8FC4E8` | `sky.deck.haze` `#C6DCEA` | 40 / 150 | 0 |
| **void** (the open air beside the trunk) | 32 → 221 | `sky.day` | `sky.deck.haze` → `sky.day` | 40 / 150 → 50 / 180 | 0 |
| **hall** (inside the trunk) | 36 → 217 | `sky.hall.low` `#241C17` → `sky.hall.high` `#3E3A33` by height, fog the same | | 8 / 64, 70, 74, 78, 78 (floors 1–5) | 0 |
| **totality** | 221 (lower stratum) | `sky.day` | the same | 50 / 180 | 0 |
| | 321 | `sky.strata.cyan` `#1F6E94` | | 60 / 200 | 0 |
| | 420 (mid stratum) | `sky.strata.violet` `#2C2160` | | 70 / 230 | 0.5 |
| | 480 → 650 (the void) | `sky.strata.void` `#05040A` | | 80 / 260 | 1 |
| | 700 (upper stratum) | `sky.strata.plum` `#2A1C2C` | | 70 / 240 | 0.7 |
| | 800 | `sky.strata.dawn` `#7A5A6E` | | 50 / 190 | 0.1 |
| | 920 → 980 | `sky.strata.corona` `#DCC497` | | 30 / 140 | 0 |

- **The halls** are lit by their knot windows: a dim wood dusk, darker in the first hall and airier as the floors rise (variety by height, issue #12). Fog far is each hall's diagonal across and up plus 8 (DECISIONS G1 asks for + 6), so the far wall never vanishes.
- **Totality** follows its strata (`src/sky/totality/strata.ts`): the day sky deepens to cyan and violet as the crown falls away; the stars come out over the violet and fill the void (where TT draws the Earth below and the nebula band); a plum and rose dusk; the Sun's pale corona washes the top (README §7). Fog far is long in the clear void (260) and shortest in the corona (140): golden light washes out shadows.
- **Readable everywhere:** fog far ≥ 24 and above near at every height (enforced); every Totality material has a ramp step ≥ 20 L* from the fog at every height of its stratum, so its edges show even where its base meets the fog's value (solar glass crosses the dusk at about y 860).

## The meaning test

- **(a) What it stands for:** the column *concept* above; the air is the climb itself, the sky clearing, then darkening into the stars, then turning to light.
- **(b) Side:** the world. Nothing here is the player's light (no `light.*`), nothing the projections' (no `cold.*`), nothing life's or harm's (no red).
- **(c) What the intention does:** breaks it like brick, with cracks of light; heartwood and the sun seal do not break, with their reasons; mist is the swap a fading platform passes through.
- **(d) Reads without text:** cloud as soft billows, wood as bark and grain, bamboo as culms with nodes, leaves as leaves, moss as a cushion, fence as rails, glass as glass, the seal as a closed disc.
- **(e) Feels seen, not mocked:** nothing here depicts a person or a pattern.
- **Red lines (ART-GUIDE §11):** no sacred names or symbols (the seal is a plain ringed disc, no sun face, no rays, no mandala); no copied textures (the bamboo, cloud and leaves are drawn from our own painters; no Minecraft, Isaac or Noita tile was looked at or copied).

## Captures and what is not verified

Checked by the art agent in `?gallery=sky-blocks` in colour, greyscale and tritanopia (each tile at ×6, its 3 × 3, at 0 and 20 blocks in its own air, with a gold mark, and the air's two height strips and its stops); deuteranopia and protanopia were measured, not captured. Not verified: the blocks in a real 3D scene of the sky (they exist in no generated floor until TR and F1–F5 build them) and in motion; TR appends the trunk and the deck captures here.

## The trunk and the deck (TR, geometry)

Built by `src/sky/floors/tree.ts`, tested in `tests/sky-tree.test.ts`. The shapes, not yet captured:

- **Deck:** a disc of cloud, radius 48, layers 29–31, walking surface 32. The arrival place is 40 out from the axis.
- **Trunk:** heartwood walls and slabs, three thick. Its outer radius widens by storey: 26 (hall 1), 28, 30, 32, and 36 (hall 5 and the roof). Halls are air; each has four knot windows at eye height (ground + 1 and + 2), one each way through the wall.
- **Way up of the deck:** a three-high door through the foot wall at 32–34, and a well of radius 4 up through the first slab, with a spiral of heartwood (rise 8, four treads) to hall 1's ground at 36.
- **Way up of each floor:** a hole through the slab above its hall, closed on its bottom layer by a heartwood membrane (the disc of the floor's gate). `openGate(n)` writes the membrane to air.
- **Roof:** heartwood at 218–220; the crown (Totality's first platform) stands at 221.

Not captured yet: `?gallery=sky-blocks` shows the tiles, not the trunk. The trunk and the deck need a gallery section and their captures before the sky's gate passes; the look is the owner's to confirm.

**Open for the owner:** the looks above; the pale-matter exception to pillar 1 (README §6); the Sun's warmth (README §7, provisional by the owner); the Spanish names (`Nube`, `Madera celeste`, `Duramen`, `Hoja celeste`, `Bambú`, `Musgo`, `Piedra pálida`, `Madera de cerca`, `Bruma`, `Resina estelar`, `Vidrio de meteorito`, `Vidrio solar`, `Sello del Sol`).
