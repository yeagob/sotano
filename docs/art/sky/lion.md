# Sky art: The lion's floor and beings

Up: [Sky art rulings](README.md)

Captures: `?gallery=sky-lion` (the plan from above; the ground view waits for the renderer).

## The floor (F4, proposed, not ruled)

The floor is an open plain with pale stone rocks and a thorn tree, drawn in the sky's own matter (DECISIONS §6.1 and [blocks](blocks.md)). Nothing here is ruled until the owner confirms it.

| Part | Matter | Why |
|---|---|---|
| Rocks (the nerve line and the second shade rock) | pale stone `palestone` | Terraces and rocks (blocks.md, material 36) |
| The Sunning Ledge (6 by 6, at 34) | pale stone `palestone`, the lighter tone of its top | The deity's seat is the floor's brightest stone, still never gold |
| The thorn tree (its helix of one-block treads) | sky wood `skywood` | A branch reaching for the light (material 31) |
| The plain | the tree's own slab (heartwood, written by the tree, not the floor) | The floor writes nothing under its walking height |
| Nests | the player's soft cubes; the nest is a place on its rock's top, marked by the gold of the player's light only in the gallery | A nest is the player's, so it carries their light (ART-GUIDE, gold is the light) |
| Spawns (two shade rocks) | the plain, marked in fence wood in the gallery | Minions come from the grass beside the rocks (SKY.md §5.5) |

Names: "The plain" (EN) and "La llanura" (ES) are working names for sky floor 4; the owner checks them under the naming rules (SKY.md §19).

## The beings (B4, pending owner review)

Status: **pending owner review.** The gate is not passed: the owner signs it off. Captures: `?gallery=sky-lion`, below the plan (the lion from four sides, its telegraph poses, the mane at 0 and 42 hits, the stare, a lion of the pride, the palette). Checked in a browser once, in colour only; the greyscale, the three colour-blindness filters and the 20-block fog captures have not been taken.

**Side.** Sky creatures, plush (README §2): no cold, no family eye, no captive light, nothing red, no gold. **Meaning.** Fear dressed as dominance (`concept:` none yet; LION.md §1 mirror, proposal): a huge, bristling head on a small soft body. The show of strength is the head; what is under it is small and soft. **The intention** lands as gold marks on the body, and the mane lies softer as they gather (B4).

| Part | Tokens | Why |
|---|---|---|
| Body, legs, tail (16 × 14 × 20 texels; legs 5³) | `plush.lion.felt.dark` / `.base` / `.hi` (belly) | A tawny felt, never the light's gold: ≥ 40 ΔE from `light.gold`, so a gold mark reads on it |
| Head (24 × 22 × 20) and the mane behind it (36 × 34 × 10, 2.25 times the body), four rays at its corners | `plush.lion.felt.base`, `plush.lion.mane.base`, rays `plush.lion.mane.dark` | The sunburst reads from the silhouette and the value (mane L* 36 under felt L* 57), not from a hue |
| Muzzle, nose, eyes (eyes and nose are inlays) | `plush.lion.muzzle`, `plush.lion.nose`, `plush.lion.eye` | Soft, readable face; the eyes are felt buttons, never a light |
| A lion of the pride (about 1 block: body 8 × 6 × 10, mane 14 × 13) | the same tokens | One family, one plush |

Enforced in `tests/sky-lion.test.ts`: every `plush.lion.*` token is ≥ 20 ΔE from `life.heart`, the attack reds, `light.gold` and the warning yellow, ≥ 15 from the coloured cold; every part wears a lion token, in whole texels; the mane is 2.1–2.4 times the body; the lion is 3 tall, a minion 1.

**Telegraphs** (three channels, DECISIONS §8.5; the floor's 1.0 s, then the hindrance's own warning): roar, the mane lifts (× 1.2) and the lion turns to the player; crosswind, the tail lashes (1.8 Hz); pounce and scruff hold, a crouch; long grass, it sinks low; scrape, the hind paws rake; dusk call, the chest fills; mane flare, the mane fluffs (× 1.3); noon sun, a yawn. Nothing moves faster than 2 Hz. **The stare's warning:** motes along the line from its eyes to the player, more as it builds, a growl each second; in its last 1.2 s the eyes widen and the mane turns to its own lighter felt (`plush.lion.mane.hi`). The design's "gold lines" are drawn as motes, not gold: gold is the player's light (ruling 4). **Rings** of the lion (`lion-ring`: the pounce's landing, the dusk call) are drawn in the mane's tones (`LION_RING_PAINT`), never red or yellow.

**Open for the owner.** The crouch squashes the whole model (the head with it); the yawn tilts the mane with the head; the "white-gold" glare of Noon sun is the host's shimmer on the sunlit cells (the shaded cells are not drawn dark); the stare's lines are motes. The meaning test (e): a proud animal that softens when faced, never mocked.
