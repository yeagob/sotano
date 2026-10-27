# SÓTANO art direction: DECISIONS (binding ledger)

*Mediator's rulings after two rounds of debate between the Art Director (Dir), Creature Designer (Cre), Materials/Light/FX (Mat), Meaning Keeper (Mea), Technical Artist (Tech) and Player Advocate (Ply). The art guide, the art skill and the PDF are written from this file alone. Where this ledger and a round-1 or round-2 paper disagree, this ledger wins. Items marked **OWNER** are recommendations that wait for the owner (§13).*

**How to read it.** Every ruling gives the decision, the final numbers, who proposed it and, briefly, why the alternatives lost. Hex values are final. A token has exactly one hex. Content refers to tokens, never to hex (§12.1). Units: 1 block = 1.0 = 16 texels, so 1 texel = 0.0625. "L*" is CIE L*; "OKL"/"chroma" are OKLCH. Colour-blindness scores are CIE76 ΔE after Machado 2009 simulation, from `tools/cvd.mjs` and the mediator's re-run.

**Diagnosis we start from** (all six agree, screenshots `before-room.jpg`, `before-critic.jpg`): one value band everywhere (35–60 % luminance), no darkness so nothing glows, generic grey brick and X-braced crates, three lighting models and three texel densities, ~140 stray hex literals, and an Inner Critic that reads as a naked salmon man because the warm hemisphere light repaints its bone colour. The current look is a Minecraft texture pack. The fix is not prettier textures; it is **one system with one meaning**.

---

## 1. The style: "Vessel Light"

**Ruling.** The style is called **Vessel Light** (OWNER to confirm the name; Q1). Proposed by Dir as an alternative, adopted by Cre, Mat, Mea, Tech and Ply in round 2. "Lantern Clay" (Dir r1) lost because it names a texture; "Vessel Light" names the cosmology (shattered vessels, shards, repair) and the rule.

**One sentence for everyone:** *The world is a husk; light is what it holds. Dark, cold, quiet matter; warm light is always earned, and it is always yours.*

Minecraft gives the block grammar (16×16 tiles, cubes, per-face shading, light levels). Noita gives "light is matter and burns in the dark" and "everything is made of the same stuff". Isaac gives tender, iconic creatures and a hand-made language of a few repeated symbols. We copy principles, never assets, layouts, names or exact palettes.

### 1.1 The five pillars (each with a test)

| # | Pillar | Rule | Test (where) |
|---|---|---|---|
| 1 | **Husk and light** (Mat, Dir, Mea) | Found matter is dull: husk pixels OKL ≤ 0.62, chroma ≤ 0.06 (named exceptions ≤ 0.10: dirt highlight, crate, obsidian; grass ≤ 0.13). Emissive pixels are OKL ≥ 0.70. Bridge materials (metal, brass, limestone, ore nodules) OKL ≤ 0.85, chroma ≤ 0.10, never emissive unless declared. | `tests/art.test.ts` scans every painted tile (pure painters, §12.6) |
| 2 | **Warm is earned, and warm is yours** (Dir r2 "the one thing", Mea, Mat) | Warm light (the `light.*` ramp) appears only where the player acted: intentions, shards, seams, practices, cleared rooms, breakthroughs, lit lamps. Projections are cold. Warm elements (fire, lava) are the only other warm emitters, and they hurt: *warmth that isn't yours burns*. | Token namespace scan: `light.*` only from allow-listed modules; enemy content may not reference `light.*`, `life.*` or true path hues; every emissive source declares `cause: 'player' \| 'practice' \| 'element' \| 'hostile'` |
| 3 | **Made of the world** (Tech "one grid, one light, one palette", Dir, Cre) | 16 texels per block for everything (world, creatures, doors, hands, held blocks). One shading model, no scene lights. Colours only as palette tokens. Creatures are built from the room's own material. | Hex source scan (0 literals outside `palette.ts`); creature boxes integer texels; grep finds no `HemisphereLight\|DirectionalLight\|PointLight` in `src/` |
| 4 | **Everything means one thing** (Mea r2 "the one thing", Cre) | Every asset links to a concept; reserved colours and motifs keep a single meaning; every projection is a need with a face. | `concept:` id exists in `docs/lore/CONCEPTS.md` for every material, enemy, item and room template; projections declare `need`, unique `glyph`, 4 face frames, a `release` clip; reserved tokens/motifs used only from allow-listed modules |
| 5 | **The world remembers you** (Dir, Mat, Mea, all) | Every act leaves a lasting visible mark: cracks glow, placed blocks carry gold seams, cleared rooms warm and stay warm. | Unit: placing sets the `placed` bit and the mesher picks the mended layer; clearing sets `clearT`. Gallery: `?gallery=room&floor=N&cleared=0\|1` shows mean lit luminance +≥ 20 % and a warmer fog hue |

### 1.2 Two guarantees that bound every pillar

Pillars say what the style is; guarantees say what it may never cost. They come from Ply (and Tech's "every rule has a test").

- **G1 Readable first.** Mood lives in the walls, clarity in the actors. Every projection has an emissive tell ≥ 2×2 texels that bypasses 70 % of the fog; its body passes the value rule (§8.2); hostile shots are never warm and player shots are never cubes; path colours keep ΔE ≥ 20 under all four vision simulations; UI text ≥ 4.5:1; the floor plane never drops below OKL 0.12 (with the lantern); fog far is never under 24. *Test:* `art.test.ts` + greyscale, silhouette and CVD captures in `?gallery`.
- **G2 Gentle by design.** Nothing alternates faster than 3 Hz; full-screen effects obey a flash budget; shake and flashes have settings on the first pause page; no player-side simulation of panic; no gore; defeat is release; the HUD never distorts to express a mood. *Test:* flash-budget unit test in `Hud`, settings present, review checklist (§10.5).

---

## 2. The three sides

Proposed by Mea (r1 §1.1), adopted by all. Everything on screen belongs to exactly one side; the side decides its colour, value and glow.

| Side | What | Colour | Value | Glow |
|---|---|---|---|---|
| **World / vessels** | Blocks, rooms, doors, pedestals, the house | The floor's rock ramp and fixed material ramps (§3.2, §6). Low chroma (≤ 0.06), cool and darker with depth | OKL 0.10–0.62 (three bands: shadow < 0.25, body 0.25–0.55, highlight ≤ 0.62) | Never, unless cracked by the player (gold crack cores) or holding an element (lava, fire). Bedrock never glows: *what doesn't glow can't be broken* (Mat) |
| **The light / the player** | Intentions, shards, seams, practices and their pedestal light, keys, breakthroughs, hands, cleared-room light, the lantern | `light.*` ramp (gold-white) + the four path hues as rims, trails and halos | Bright: emissive OKL ≥ 0.70 (only `light.dusk` lower, for dying light) | The only side that emits freely; emissive texels bypass shade and 70 % of the fog |
| **Projections / husks** | Enemies, bosses, hostile projectiles | Host-room pattern recoloured 40 % toward the path's **shadow** hue; eyes, telegraphs and shots in the `cold.*` ramp; captive light (`captive.*`) only seen through cracks | One of two classes, never in between: **dark husk** (body mean L* ≤ 14 + cold rim) or **pale husk** (≥ host + 20 L*) | Eyes (cold, fog-exempt), telegraphs (cold), captive light through cracks (warm, dim, never thrown). The path's **true** hue appears only at release, on the shard |

**Ownership axis (Q2) — ruling:** **warm = yours, cold = theirs; shape decides first, colour confirms.** Player shots are round with a smooth trail; hostile shots are tumbling cubes (or the Critic's ✗) with a jagged trail and a dark rim. Proposed by Dir/Mea (warm light), flipped from Ply's r1 cyan/amber; Ply, Mat, Cre and Tech all moved to it in r2. Cyan-for-mine lost because it breaks the story (the light you aim is the light you free and mend with) and because blue now belongs to Emotion. Tech measured gold intentions vs amber hostile shots at ΔE 10 for deuteranopes, so hostile must be *cold*, not amber: the blue↔yellow axis survives deutan and protan vision, and shape covers tritan vision.

**Captive light (Cre r2 exception, Mea's Luria image).** Warm light seen *inside* a projection is your light held captive. It uses its own dim ramp (`captive.*`, never `light.*`), is visible only through cracks or gaps (≤ 10 % of the front texels, emissive ≤ 0.5 except Panic's swell), never flies at you, and leaves only as the shard at release.

---

## 3. Master palette

`src/content/palette.ts` holds every colour as a **named token** (`'light.gold'`), typed as a union of literal keys. Tokens below are final; no other hex may appear in content.

### 3.1 Ink, bone, ash (shared darks and paper)

| Token | Hex | Use |
|---|---|---|
| `ink.void` | `#0E0B10` | Deepest shadow, source fog, eye sockets, UI outer line, bevel-low, high-contrast hull outline |
| `ink.line` | `#14111C` | Icon outline (replaces `#120d0a`), hexagram ground, ink ticks and ✗ marks, Shadow wrist ring |
| `ink.panel` | `#17120F` | UI panel (α 0.95) |
| `ink.bevel` | `#3A2F27` | UI panel bevel-high |
| `ink.ash` | `#3A3236` | Visited-but-uncleared rooms on the map, dead embers |
| `ui.night` | `#0E1022` | Death screen top (gradient to `ink.void`) |
| `bone.paper` | `#EDE4D0` | Primary UI text (14.7:1 on panel), hexagram lines, crosshair |
| `bone.dim` | `#C4B8A3` | Secondary text (9.5:1) |
| `bone.faded` | `#9A8F84` | Disabled/faded text, unvisited map outlines (5.9:1) |

No pure `#000`/`#FFF` anywhere except 1–4 px cores of `light.core` (Dir).

### 3.2 World neutrals: floor rock ramps (outline / dark / base / hi)

The floor's rock ramp recolours the structural materials (`brick`, `frame`) at floor load (atlas repaint, ms). All are husk-legal (measured chroma ≤ 0.05).

| Token group | outline | dark | base | hi | Feel |
|---|---|---|---|---|---|
| `rock.f1` Earth | `#2A211A` | `#45372B` | `#6B5442` | `#866A52` | warm umber cellar brick (grey brick was the main "clone" signal: Mat, agreed by all) |
| `rock.f2` Water | `#1F242C` | `#343A44` | `#4E5560` | `#69717C` | damp blue-grey plaster |
| `rock.f3` Air | `#1D1C26` | `#302F3B` | `#4B4A58` | `#64627A` | slate-violet, ledger stone |
| `rock.f4` Fire | `#140F19` | `#241D2B` | `#3B3043` | `#52455D` | obsidian-plum, polished by touch |
| `rock.source` | `ink.void` | `#1F1A22` | `#2F2833` | — | absolute dark with 1-px `light.core` stars |

Fixed material ramps are in §6.2.

### 3.3 The light (the player's ramp)

| Token | Hex | Use |
|---|---|---|
| `light.core` | `#FFF1C8` | Hottest pixel: intention core, seed core, stars below bedrock, Satori, the lantern (35 %), the breakthrough flash. 1–4 px per sprite |
| `light.hot` | `#FFD77A` | Shard hot core, room-heart light, released-room warm tint |
| `light.gold` | `#F2C14E` | Intention shell, crack cores, shard lines, **kintsugi seams**, changing hexagram lines, keys, quality stars, stat-up, synergy ✦, treasure keystone, cleared rooms on the map, sunrise mid-band |
| `light.ember` | `#EAA640` | Intention halo (35 %), lit lamps, breakthrough cracks, default trail |
| `light.dusk` | `#B8502A` | Dying light only: a falling intention, embers going out |

Dir r1's `intent #f0a33c`, `ember #c7562a`, `shard #ffd77a`, `dawn #fff4d6` and Mea's `#FFF1C8 / #F2C14E` are merged into this one ramp (Mea's core and gold kept exactly).

### 3.4 Life

| Token | Hex | Use |
|---|---|---|
| `life.heart` | `#D9434F` | Hearts (filled quarters), heal motes' rim. **Red is reserved for life** (Mea, Ply) |
| `life.dark` | `#7A1E2A` | Heart shade, hurt vignette (peak 0.35) |
| `life.empty` | `#4A2226` | Empty heart fill (Ply: the current `#3a1416` vanishes) |
| `life.rim` | `#7A3A3E` | Empty heart 1-px rim |

### 3.5 The four paths (final, CVD-verified)

| Path | Element | Glyph | `base` | `glow` | `dark` | `shadow` (projections) |
|---|---|---|---|---|---|---|
| **Body** | Earth | ■ | `#3FCF7F` | `#81E9AF` | `#276E46` | `#36634A` |
| **Emotion** | Water | ● | `#7AA3D4` | `#8EC1FF` | `#365981` | `#364A63` |
| **Mind** | Air | ◆ | `#B074FA` | `#D5B3FF` | `#5D1AB0` | `#4A3663` |
| **Will** | Fire | ▲ | `#CA7622` | `#E8803F` | `#66411C` | `#634D36` |

Tokens: `path.body.base`, `path.body.glow`, … The glyphs are always shown with the colour (chips, HUD, banners); colour never carries a path alone. The glyphs are the silhouettes of the Platonic solids the old philosophers gave the elements (cube = earth, octahedron = air, icosahedron = water, tetrahedron = fire) (Mea r2).

**Who proposed what, and why this set.** Mapping by element: Mea r1, adopted by everyone in r2. Gold and red excluded from paths: Mea (gold for Will would make every practice look like "the light"; pink Emotion reads as health). Glyphs: Ply. Values: the mediator, after scoring all eleven candidate sets with the CVD tool:

| Set | Normal | Deutan | Protan | Tritan | Worst | Problem |
|---|---|---|---|---|---|---|
| Mea r1 | 28 | 8 | 9 | 23 | **8** | blue/violet merge |
| Mat r1 | 45 | 17 | 26 | 12 | 12 | gold Will, pink Emotion |
| Ply r1 (Okabe–Ito) | 57 | 29 | 21 | 37 | 21 | yellow Will = gold of the light |
| Dir r1 | 50 | 24 | 26 | 13 | 13 | gold Will |
| Dir r2 / Cre r2 / Mea r2 | 39 | 8–17 | 3–5 | 11–14 | **3–5** | Emotion/Mind collapse for protans |
| Mat r2 | 28 | 23 | 17 | 23 | 17 | Emotion 3.7:1 on panel |
| Ply r2 | 48 | 24 | 24 | 18 | 18 | Mind pink |
| Tech r2 (optimised) | 52 | 28 | 26 | 25 | 25.3 | Mind is orchid pink (re-opens Mea's "pink near hearts"); Will 4.9:1 |
| **Final** | **58.8** | **27.0** | **30.0** | **24.4** | **24.4** | — |

Final set, measured: minimum pairwise ΔE 24.4 (tritan, Body/Emotion); distance to reserved colours ≥ 17 in every simulation (heart ≥ 19, gold ≥ 22, light core ≥ 20, hostile `cold.body` ≥ 17); contrast on `ink.panel` 9.2 / 7.1 / 6.0 / 5.4 : 1 (all ≥ 4.5). It ties Tech's optimum within 1 ΔE while keeping Mind violet (air, dusk) and Emotion a soft water blue, and it is lighter on dark backgrounds. Emotion and Mind are separated by value as much as by hue (Mat's argument). The glows were checked against the reserved ramps too (`path.emotion.glow` vs `cold.body` ΔE 18.9; `path.will.glow` vs `light.ember` ΔE 22.9). Dir r1's "equal value" rule lost (equal value fails a greyscale screenshot; Ply).

**Test:** `art.test.ts` asserts pairwise ΔE ≥ 20 under normal/deutan/protan/tritan and ≥ 15 against `life.heart`, `light.gold`, `light.core`, `cold.body`, and ≥ 4.5:1 on `ink.panel`.

### 3.6 The cold (projections' side) and captive light

| Token | Hex | Use |
|---|---|---|
| `cold.deep` | `#2A2F45` | Hostile shadows, danger-ring dark dash |
| `cold.dim` | `#6F7891` | Doubt's wisps, obsidian sheen on Comparison, Distraction's wing shimmer |
| `cold.rim` | `#8E98B4` | The 1-texel rim on dark husks (§8.2) |
| `cold.body` | `#B9C6E6` | Hostile projectile body and halo, danger ring, stat-down, boss marker |
| `cold.white` | `#EEF2FA` | **The family eye of every projection** (idle 0.6, telegraph 1.0), hostile projectile core, telegraph flare, Panic's final swell, electricity core |
| `captive.smoulder` | `#4A1E12` | Captive light, dim (Panic idle core, Procrastination's banked ember) |
| `captive.ember` | `#8F3A1C` | Captive light, swelling; boss-frame crack (ΔE 30 from `life.heart`) |
| `mood.held` | `#2A3550` | Cold tint of an uncleared room (6 %) |

Rejected: per-projection signature eye hues (Cre r1), the green-white `#cfe8d6` (Dir r1), periwinkle `#9AA8FF`/`#7A6CFF` hostile (Tech, Ply) because it sits too close to Mind's violet; amber hostile (Ply r1). Cre r2 itself moved to "one family eye, many inner lights".

### 3.7 Bridge materials (metal, brass, limestone, copper)

| Token group | outline/dark | base | hi | Use |
|---|---|---|---|---|
| `brass` | `#5E4F2A` | `#8F7A45` | `#B9A26A` | Treasure door frame, vault, key shade, the Impostor's **false gold** (never emissive; Mea) |
| `iron` | `#2A2D33` / `#4D525A` | `#737982` | `#A8AEB6` | Hoops, bands, rivets, iron block (elements milestone) |
| `limestone` | `#4A4640` / `#7D7770` | `#A39C93` | `#CFC8BE` | Pedestal |
| `copper` | `#8A5A3A` | `#B07A52` | `#D4A27A` | Ore nodules (not emissive: warm glints on found matter would break pillar 2; Mat's copper glow lost) |

### 3.8 Elements (owned by the world; elements milestone except lava/fire where present)

| Element | Tokens (dark → light) | Notes |
|---|---|---|
| Fire | `#A8200D`, `#FF5A1F`, `#FFB13B`, core `#FFF1A8` | 4-frame overlay at 8 fps, shape change only, brightness variance ≤ 20 % (not a flash). Embers fade `#FFD070 → #FF5A1F → #5A1A0A`; smoke `#2B2522` 40 % |
| Lava | crust `#1A0703`/`#3A0D05`, molten `#C2410C`/`#FF7A1A`, vein `#FFD25A` | Strongest static light (block light 12); floor 4 accent |
| Water | body `#1D4B6E` α 0.7, surface `#4F9CC8` α 0.55, foam `#BFE6F2` | Never emissive (feelings reflect light, they don't make it); underwater fog `#0D2A3A`, 1/10 |
| Mud | `#1E150C`, `#3A2A1A`, `#4A3622`, `#6A5440`, sheen `#8A7A66` | The only wet sheen |
| Sand | `#7A6338`, `#A88A52`, `#C9A86A`, `#E3C88F` | Bridge band (light husk) |
| Char | `#1C1612`, `#2B211A` | Burnt blocks |
| Coal | `#0D0C0B`, `#1E1C1A`, `#2C2926`, `#4A4540` | |
| Obsidian glint | `#6E58A0` | Texture accent only (cold, not emissive) |
| Electricity | core `cold.white`, halo `#C9B8FF` | The only cold glow among elements |
| Steam | `#E8E6E0` α 0.5 | Particles only |
| Glass | frame `#D8F0F0`, interior `#9FC8C8` α 0.2 | |

### 3.9 Sky and transitions

| Token | Hex | Use |
|---|---|---|
| `sky.dawnLow` | `#E8573C` | Sunrise horizon (rubedo) |
| (`light.gold`) | `#F2C14E` | Sunrise mid-band (the light in the sky is allowed: Mea's reserved list includes "the sky through the bottom") |
| `sky.dawnHigh` | `#BFD8F0` | Sunrise zenith |
| `sky.day` | `#8FC4E8` | Day zenith (today's surface fog lerps here) |
| `sky.horizon` | `#F3E2C4` | Day horizon |
| `sky.albedo` | `#F4F1EA` | The albedo moment below bedrock |
| `fog.warm` | `#3A2E14` | Fog target of cleared rooms (30 %) (citrinitas) |
| `fog.f1…f4` | `#1E1712`, `#121A22`, `#15151F`, `#0C0910` | Per-floor fog (§4) |

### 3.10 UI tokens (CSS variables written by `applyPaletteCss()`)

`--ui-text: bone.paper`, `--ui-text-2: bone.dim`, `--ui-faded: bone.faded`, `--ui-panel: ink.panel` (α .95), `--ui-line: ink.void`, `--ui-bevel-hi: ink.bevel`, `--ui-heart: life.heart`, `--ui-gold: light.gold`, `--ui-up: light.gold`, `--ui-down: cold.body`, `--ui-threat: cold.body`, `--ui-night: ui.night`, `--path-body/-emotion/-mind/-will: path.*.base`. Stat lines keep the arrows ▲/▼ (colour is the second channel).

### 3.11 Skin and cloth (hands only; §9)

Skin tones (player setting): `skin.t1 #F3D2B3`, `skin.t2 #E2B48F`, `skin.t3 #B98260` (default), `skin.t4 #9A6844`, `skin.t5 #6F4A30`, `skin.t6 #4A3020`. `palette.ts` derives each tone's `dark` (OKL −0.10) and `light` (OKL +0.06) deterministically. Jumper: `cloth.base #3D4F73`, `cloth.cuff #2C3A57`, `cloth.hi #4E6290`.

### 3.12 Reserved-colour rules (enforced)

1. **Gold (`light.*`) is the light and repair.** Never on a living projection (Perfectionism's seams and the Impostor's gilt are not gold while they are patterns; brass is "false gold"). Never a path colour. Allow-listed modules: intents, debris/shards, mesher (seams, cracks), items/practices, HUD, room-clear, hexagram, sky, lantern.
2. **Red (`life.*`) is life.** Hearts and heart-related UI only. No other token within ΔE 20 of `life.heart` (normal vision). The Critic's red pen and red ✗ (Cre r1) lost: its ink is `ink.line` on chalk.
3. **Cold (`cold.*`) is the projections'.** Never on a player shot, shard, seam or practice.
4. **Path true hues** belong to the player (practices, rims, trails, states of being, halos). Projections may use only `path.*.shadow` (body tint); the true hue appears on a projection only on its release shard (drawn by the creature view, not referenced in content).
5. **Skin band banned on projections** (Ply): hue 15–45°, chroma 0.04–0.12, OKL 0.55–0.85. Test scans every creature palette.
6. **Ink and the six lines** are the reading: hexagram line patterns appear only where the run's reading lives (§10.3).

---

## 4. The descent table

**Ruling.** Mea's alchemical stages are the script (nigredo down, albedo at the source, citrinitas on the climb, rubedo at the surface); Dir's rock hues are the matter; Mat's warm umber is floor 1; Ply's readability floors are hard limits (fog far ≥ max(24, room diagonal + 6); floor-4 ambient ≥ 0.30). Dir's floor-4 far 18 and Mea's ambient 0.20 lost: a projection 12 blocks away would be 70 % fog, and the floor plane would fall under OKL 0.12. Pressure comes from ambient, hue, ceiling height and material, not blindness (Ply).

| Station | Mirror above | Element / stage | Rock ramp | Fog | Near / far (uncleared) | Near / far (cleared) | Ambient RGB | Accent |
|---|---|---|---|---|---|---|---|---|
| **F1** Cellar of habits | Ground floor | Earth · nigredo begins | `rock.f1` | `#1E1712` | 6 / 32 | 10 / 42 | 0.60, 0.55, 0.50 | dust motes `#8A7663` (non-emissive); one lamp per room, **unlit until the room is cleared**, then `light.ember` |
| **F2** Rooms of feeling | Bedrooms | Water | `rock.f2` | `#121A22` | 5 / 30 | 9 / 40 | 0.46, 0.47, 0.54 | water glints `#7FC3D9` |
| **F3** Old structures | Study, library | Air | `rock.f3` | `#15151F` | 5 / 27 | 9 / 37 | 0.38, 0.38, 0.45 | cold slit light `#B9B4E8` (cold, so allowed pre-lit) |
| **F4** Oldest pain | Attic | Fire · deepest nigredo | `rock.f4` (polished: one long highlight streak) | `#0C0910` | 4 / 24 | 8 / 34 | 0.31, 0.28, 0.35 | lava `#FF7A1A`; otherwise your light; lantern mandatory |
| **The source** (below bedrock) | The sky | Albedo | `rock.source` + 1-px `light.core` stars (*the sky is already down there*, Dir) | `ink.void` → `sky.albedo` | 3 / 24 → 40 / 120 | — | 0.15 → 1.0 | one white crack widening; **ramp ≥ 1.5 s, no step > 10 % luminance per 100 ms; peaks at 70 % with Reduced flashes** (Ply) |
| **The climb** | — | Citrinitas | same rock | each **cleared room** lerps 30 % toward `fog.warm` | cleared values | cleared values | ×1.15 in cleared rooms | lamps you lit, gold seams. A floor you rushed through stays dark on the way up (Mea) |
| **Surface** | — | Rubedo | grass may reach chroma 0.13 (the only saturated found matter) | sky `sky.dawnLow` → `light.gold` → `sky.dawnHigh`, then `sky.day` / `sky.horizon` | 36 / 114 | — | 1.00, 0.98, 0.92 | the sun |

The climb and "cleared rooms warm" are **one rule** (Tech: same `clearT` uniform): any cleared room, on the way down or up, shifts its fog 30 % toward `fog.warm` and its ambient ×1.15. Floor transitions lerp the FloorLook over 1.5 s while falling through the hole. Mirror rule for surface rooms (Dir): each surface room echoes its floor's hue at higher value.

---

## 5. Lighting

### 5.1 One model, three layers, zero scene lights (Q3)

**Ruling.** Tech's single unlit model is the frame; Dir's and Mat's coloured block light is its baked input; Mat's dynamic lights become uniform "virtual lights" (Dir r2, Mat r2, Tech r2). Every cube in the game (chunks, debris, held block, doors, pickups, creatures, hands) uses `MeshBasicMaterial` + the shared `voxelShade` chunk via `onBeforeCompile`. `HemisphereLight`/`DirectionalLight` are removed from `game.ts` and `hands.ts`. Mat's two fixed `PointLight`s lost: they light nothing in an unlit world and changing light counts recompiles shaders.

`colour = tile × faceShade × AO × (ambient[floor] × roomState + blockLight + lantern + flash[0..1])`, then fog; emissive texels are added after shading at fog strength 0.3.

1. **Baked (mesh time, in the worker):** face shade × AO × block light into vertex colours.
   - **Fix the gamma first** (Tech): vertex colours are linear in three r186, so today's 0.5 bottom shade displays ~0.73. Convert the authored values with `SRGBToLinear` before writing.
   - **Then steepen** (Dir): top 1.0, ±X 0.78, ±Z 0.62, bottom 0.42; AO curve `[0.45, 0.63, 0.82, 1.0]`. `FACE_SHADE` lives in `src/render/shading.ts`; the mesher imports it; the shader chunk blends it by `abs(normal)` for rotating objects.
   - **Block light**: Minecraft-style BFS, levels 0–15, −1 per block, RGB, max per channel, worker-side; relight ≤ 2 ms per chunk. Sources (`emit` on materials or entities, each with a `cause`): lava 12 (`#FF7A1A`), fire 10 (`#FFB13B`), furnace lit 8, room heart 8 (`light.hot` at 40 %, cleared rooms only), lamp lit 7 (`light.ember`), pedestal holding a practice 6 (its path glow), breakthrough seed 4 (`light.ember`), keystone of a cleared room 3, mended block 2 (`light.gold`).
2. **Per frame (uniforms):** `FloorLook` (fog, tint, shade contrast `uShadeK`, ambient), per-room state `clearT[64]` read through a per-vertex `room` attribute (Tech's change to Mat's `uRooms[16]` loop: ≈ 0 ms instead of 1–2 ms on mobile), `uTime`, the **lantern** (camera-centred falloff, radius 6 m, `light.core` at 35 %, +0.5 m per state of being; Dir), and **two virtual lights** `uFlash[2] = {pos, radius, colour, intensity}`: slot 0 explosions/flashes, slot 1 the held shard (radius 4, intensity 0.4, `light.gold`).
3. **Emissive mask:** uppercase palette keys in creature/icon rows, mask atlas for tiles and debris. Bypasses shade, ambient, tint and 70 % of the fog.

**Dynamic objects** (debris, creatures, pickups) sample the baked light grid once per frame per instance into an `instLight` attribute (Cre r2, Mat r2): a projection beside lava is lit by lava with no dynamic light.

**No bloom** in the default path; an opt-in "High" quality setting may add half-resolution bloom (threshold 0.8) later. Every review screenshot is taken without it (all agree).

### 5.2 The room heals: the clear wave (Mat r2 "the one thing")

Trigger: the last projection in the room is released. Duration 2 s. No shake, no flash.

| Step | Numbers |
|---|---|
| **Held state** (any room with live projections) | saturation ×0.65, value ×0.85, tint 6 % toward `mood.held` |
| **The wave** | spherical front from the room heart (the centre, where projections materialise) at 9 m/s; behind it `released = smoothstep(r − 0.8, r, waveRadius)` |
| **Released state** | saturation ×1.0, value ×1.0, tint 4 % toward `light.hot`, ambient ×1.15, room-heart block light 8 appears (`light.hot` 40 %) |
| **Cracks become embers** | crack cores in the room flare to 1.0, settle at 0.6 |
| **Light returns** | 60 `light.gold` motes rise from floor blocks at 1 m/s for 2 s (light pool) |
| **Fog lifts** | while the player is inside: near/far lerp to the "cleared" column of §4 and fog colour 30 % toward `fog.warm`, over 2 s |
| **Doors answer** | keystones flare 1.5× for 0.4 s as the wave reaches them, then emit (§6.2); the room's lamp lights |
| **Later (Phase D)** | after 30 s, the grass material's living variant creeps 1 tile in from floor edges (Mat r2: the world's own life, not Dir's path-green moss) |

Expected luminance gain: 1.15 / 0.85 ≈ +35 % (pillar 5 needs ≥ 20 %). The map draws the room in `light.gold` at 50 %.

---

## 6. Blocks

### 6.1 Texture grammar (16×16, all materials)

Synthesis of Dir r1 §6 and Mat r1 §1, with Tech's measurable versions.

1. **Ramp:** `outline, dark, base, hi` (4 values) + optional `accent` (≤ 8 px) + optional emissive mask. Materials gain `colors: [PalToken × 4]`, `accent?`, `glowMask?`, `emit?`, `concept`.
2. **Shapes, not noise.** Every shape (brick, plank, plate, pebble, nugget) is drawn with `bevel()`: 1 px `hi` on top and left, 1 px `dark` on bottom and right, `outline` in gaps and mortar. **Light from the top-left, always.**
3. **Features ≥ 2 px.** Single-pixel variation ≤ 10 % of the tile and only ±1 ramp step.
4. **Dither** only as a 2×2 checker on transitions (grass edge, moss, wet foot of a wall). Never full-tile.
5. **No outlines inside world tiles** (mortar does it). Outlines belong to icons, UI and creature edges.
6. **Four variants** per common material (brick, stone, dirt, deepstone, rock), picked by `hash(x,y,z) & 3`, seamless.
7. **Grain carries meaning:** found matter horizontal (laid down, resting); built matter vertical or radiating (rising).
8. **Deeper = bigger shapes, older = polished:** F1 bricks 7×3 with 1–2 chipped corners; F2 plaster slabs 8×8 with hairline cracks; F3 slate courses 16×3; F4 facets ~6 px, one long highlight streak.
9. **Distance colour:** materials that can touch on the same floor differ in tile-average by ≥ 0.12 OKL or ≥ 30° hue (Tech restricted Mat's all-pairs rule to listed pairs).
10. **Glow budget:** common ≤ 6 % emissive pixels (≤ 15 px), special (pedestal rim, keystone, seed) ≤ 15 %, lava ≤ 45 %.
11. **Mipmaps:** tiles live in a `DataArrayTexture` with per-layer mipmaps (no shimmer, no bleeding).

**Never:** X-braced crates or the cobblestone layout (Minecraft); full random speckle (stone, obsidian, ore all get shapes); smooth gradients; linear filtering.

### 6.2 Recipes for every existing material

| Material (concept) | Ramp (outline / dark / base / hi) | Pattern | Cracks follow | Break particles |
|---|---|---|---|---|
| **Dirt** (a passing excuse) | `#2E1F14 / #4F3624 / #6B4A30 / #87603F` | soft clumps: 2×3 dark blobs + 3–4 bevelled 2×2 pebbles; no straight lines | short crumbling 3-px strokes | 8 chips + 4 dust puffs (0.18, `#6B4A30` 50 %, rise 0.3 m, 0.5 s) |
| **Grass** (surface life) | top `#24361A / #3D5A2A / #557A37 / #78A24A`; side = dirt + 3–5 px ragged fringe | 1×2 `hi` blade ticks in 30 % of cells; grain horizontal | as dirt | 6 chips + 3 blade slivers (0.04×0.12, gravity 4). Painter takes dirt by key, not `MATERIALS[1]` |
| **Brick** (a habit) | floor rock ramp (`rock.fN`) | running bond, bricks 7×3 + 1 px mortar, every brick bevelled; 1 in 6 bricks ±1 step | mortar first (70 %) | 10 chips, 30 % as brick halves (0.14×0.07×0.07) |
| **Stone** | `#2A2A2E / #47474D / #626268 / #82828A` | 4–5 Voronoi plates, each one tone, plate edges `outline`, top-left edges `hi`: brick is rhythm, stone is facets | long straight strokes turning at plate edges | 10 angular chips, gravity 22 |
| **Deepstone** (an old fear) | `#121119 / #22212C / #33313F / #4A4759` | 3 horizontal strata of 4–6 px offset in tone; 2–3 hairline veins in `outline` (Mat's pre-glowing indigo veins lost: warm or coloured light before the player acts breaks pillar 2) | strata, then branch | 12 chips |
| **Crate** (what you stored and never opened; Mea) | `#2E1D0F / #5A3A1E / #7D5530 / #A3743E` | 3 horizontal planks of 5 px, 1 px gaps, 1×4 grain streaks, nail heads (1 px `hi`); a 2-px **rope band** on the sides instead of any brace | splinters along grain | 8 chips + 6 splinters (0.03×0.03×0.16, tumbling) |
| **Obsidian** (a core belief) | `#07050C / #140F20 / #221935 / #3B2B55`, accent `#6E58A0` | 3 large glassy triangles, diagonal 1×4 accent streaks; never noise | radial from the impact point (conchoidal) | 14 chips, 40 % flat glass slivers (0.12×0.02×0.08) |
| **Bedrock** (the floor of the world) | `#060507 / #0E0D10 / #18161B / #24212A` | dense cobble, low contrast, **no bevel highlight**, no glow ever | never cracks | dull puff of 4 `#3A3740` particles, no light |
| **Iron ore** | stone ramp + `copper` nodules | 4–5 bevelled 2×2/3×2 nuggets on stone | as stone | stone chips + 4 copper chips |
| **Door frame** | floor rock ramp | 2 px bevelled border + 4 rivets; texture at 16 px/block (bug fix); door leaf in crate ramp with vertical grain (built) | as brick | as brick |
| **Treasure frame** (rename "Gilded" → "Brass frame", OWNER Q3) | `brass` ramp | as frame; keystone emits `light.gold` 0.8 + 1 mote/s once the current room is cleared | | |
| **Boss frame** (rename "Bone frame" → "Obsidian frame", Mea/Dir/Mat; OWNER Q3) | obsidian ramp | one long crack of `captive.ember` pulsing at 0.4 Hz (dim 0.2 → 0.5): the oldest pattern holding its light, about to give way. Bone lost: gore-adjacent and Isaac-flavoured | | |
| **Locked door** | frame | keyhole pixel `light.gold` (a key is an insight) | | |
| **Pedestal** | `limestone` ramp | big bevelled blocks, vertical grain (built); 1 px top rim in the practice's path glow at 0.7 **only while a practice sits on it** (light belongs to practices) | as brick | 10 chips |
| **Breakthrough** (seed) | `ink.void / #1E1626 / #2A2233 / #3A3046` | round dark core, 4 bevelled branching cracks of `light.ember`, 2×2 `light.core` heart | — | see §7.4 |

Keystones of normal doors emit `light.ember` at 0.3 (block light 3) once the current room is cleared, never before (Dir r2: pre-lit warm decoration breaks pillar 2).

### 6.3 Cracks of light

Proposed by Dir (ember tip) and Mat (emissive cores), unified; adopted by all. Each crack stroke = 1 px `outline` edge + 1 px emissive core in `light.gold`.

| Stage | Strokes | Core |
|---|---|---|
| 1 | 2 | 0.35 |
| 2 | 4 | 0.55 |
| 3 | 6 | 0.8 |
| 4 | 8 | 1.0 + 1 px halo at 40 % |

Breaking reveals light from the first hit. Strokes follow the material's logic (column "Cracks follow" above). Render: one `InstancedMesh` for ink and one for cores, with a `stage` attribute: 2 draw calls (Tech; today 4). Bedrock never cracks.

### 6.4 Shards and kintsugi seams: one look (Q6)

**One light, two states: a broken vessel leaks, a mended one shines along the break.** All shard light is **gold**; vessels differ in **how much** light they held, not its colour (Mat r2, Tech, Ply). Per-material shard colours (Mat r1, Mea r2 rims) lost: violet obsidian shards in the player's hand read as hostile-cold and add eleven competing hues. Material identity stays in the texture and the break particles.

**Loose cube (open vessel)**
- The material tile (all six faces, not only +Y: bug fix) lifted +0.06 OKL with a non-emissive 1 px lighter top edge (Ply: resource vs wall at a glance).
- Emissive mask: **2–3 short crack-core lines** (the stage-2 art), **not a full border** (Tech: 2000 glowing borders turn the floor into a light grid; Dir: "wallpaper, not repair").
- Colour `light.gold`, hot pixel `light.hot`. Intensity by tier: 0.35 / 0.5 / 0.7 / 0.9 (tier 0 → 3). Breath `±0.15` at 0.5 Hz, phase = instance × 1.618. ×2 for the first 0.6 s after breaking.
- Halo sprites for the 64 nearest within 10 m (radius 0.5 m, 18 %), shrunk 50 % within 8° of the crosshair.

**Held block:** ×1.5 intensity; virtual light slot 1 tints the hands (`light.gold`, radius 4, 0.4). Carrying obsidian lights your hand gold in a dark corridor: you carry light out of what held you.

**Placed block (mended vessel):** a `mended` atlas layer per material: a 1 px `light.gold` seam along **1–2 edges** plus **one meandering crossing crack**, chosen from 4 variants by `hash(x,y,z)` with edges picked so neighbouring placed blocks join into continuous lines (Dir). Emissive **0.30, steady, never pulses** (alive in your hand, settled in the world). Block light 2. Needs a `placed` flag in a separate `Uint8Array` padded into the worker request (Tech: don't steal a material-id bit). **Seams are always gold**: Resolute makes them 2 px wide instead of recolouring them (Mea; Dir's and Ply's Will-coloured seam lost, because repair means one thing).

**Kintsugi** is the named visual source (OWNER Q7: add to the library).

---

## 7. Intentions, hostile projectiles, particles, feedback

### 7.1 The intention (player shot): a bead of light

| Property | Value | Source |
|---|---|---|
| Mesh | icosahedron detail 0 (20 tris), 3 instanced draws (core, shell + ghosts, halo), cap 200 | Mat, Tech budget |
| Size | radius `0.11 × (0.85 + 0.15·√damage)`, clamped 0.08–0.30; stretched along velocity `1 + speed/40` (max 1.6) | Mat |
| Core | unlit `light.core`, 55 % radius | Mat, Mea |
| Shell | `light.gold`, 100 % radius | Dir, Mea |
| Halo | additive camera-facing quad, 3× shell radius, `light.ember` at 35 % | Dir |
| Path | the dominant path's **base** colours only the rim (1 px ring) and trail: ≤ 40 % of the sprite (Ply). No path: trail `light.ember`. A state of being adds a second thin ring in the path glow, rotating 2 rev/s | Mea, Mat |
| Trail | 6 ghost instances over the last 0.1 s, scale 0.8 → 0.2, alpha 0.6 → 0, smooth | Mat |
| Falling | when range runs out: over 0.25 s halo 35 % → 10 %, shell lerps to `light.dusk`: an intention without follow-through loses its light before it lands | Mat |
| Hit block | 6 shell-coloured light particles in a hemisphere, 3 matter chips, 2 `light.gold` motes, ring 0 → 0.35 m in 0.12 s, no shake | Mat |
| Hit projection | 10 light particles, the projection flashes its **host material's `hi`** for 0.06 s (not white), squash 0.9/1.1 for 0.08 s | Cre, Mat |

**Item modifiers** only through these knobs: size, rim/trail colour, halo radius, ghost count, and **one** special slot (ember, arc, ripple, spiral); newest wins, older ones fold into the trail colour (Mat). Core and shell never change colour. Items that "tint intentions" tint the rim/trail. Mea's Platonic-solid intention shapes lost: the cube would collide with the hostile shape; the solids live on in the glyphs.

### 7.2 Hostile projectiles

| Property | Value |
|---|---|
| Shape | **tumbling cube** (edge ≥ 0.22, 1.5 rev/s on two axes), or the Critic's **✗** (two crossed bars 0.3125 × 0.0625 × 0.0625) |
| Colour | 4×4-texel skin: `ink.line` 1-texel rim, `cold.body` body, `cold.white` 2×2 core (emissive); halo `cold.body` 1.6× at 25 % |
| Trail | jagged: 4 ghosts offset ±0.03 m alternately, stepped at 12 fps |
| Speed | visible ≥ 0.35 s from max range at 60 fps (Ply) |
| Impact | 6 `cold.dim` chips + dull puff; **never gold particles** |
| Critic decal | where a ✗ lands on a block: an `ink.line` ✗ with a `cold.dim` rim, 3 s, then fades |

Hard rules: no hostile projectile is warm; no player shot is a cube. The Comparison's copied intentions come back as cold cubes: *the copy is never the light*.

### 7.3 Particles

Two pools, each one `InstancedMesh`, ring buffer with swap-remove (today's `shift()` is O(n²)): **matter** (unlit `voxelShade`, opaque, takes fog, gravity 18; stone 22, mud 30, dust −0.5; size 0.06–0.18; life 0.4–0.9 s; cap 900 PC / 400 mobile) and **light** (additive, `depthWrite: false`, fog ×0.4, gravity 0 to −1.5, size 0.03–0.08, life 0.3–1.5 s, cap 300 / 150). Matter chips use the material ramp: 50 % base, 30 % dark, 20 % hi. Chips bounce once off the room floor (restitution 0.3). Per-event caps: block break 14 + 6; projection release 24 + 16; breakthrough 40 + 20; never more than 60 per event; above 80 % pool fill, events spawn half. Particles within 8° of the crosshair render at 50 % scale (Tech's opaque version of Ply's 30 % opacity). A `fxScale` setting scales bursts on mobile.

### 7.4 Screen feedback (Mat's table, made gentle by Ply)

Shake is positional only (**no camera roll**: Mat's 1° roll lost), offset = amplitude × 0.12 m, exponential decay half-life 0.08 s; chained events within 250 ms take the **max**, never the sum.

| Event | Shake | Flash | Other |
|---|---|---|---|
| Intention hits block | 0 | 0 | ring + 2 motes |
| Block breaks, tier 0–1 | 0.04 | 0 | block pop 1.08, 0.03 s |
| Block breaks, tier 2–3 | 0.10 | 0 | low thud, +6 light motes |
| Projection released | 0.08 | 0 | §8.6 |
| Player hit | 0.20 | 0 | vignette `life.dark` peak 0.35 → 0 in 0.4 s, world desaturates 30 % for 0.15 s |
| Breakthrough fuse | 0 | 0 | crack emissive pulse ≤ 2.5 Hz with rising brightness, scale swell 1.0 → 1.25, rising pitch (Mat's 12 Hz ramp lost) |
| Breakthrough explodes | 0.50 within 4 m → 0 at 12 m | `light.core` 35 % → 0 in 0.15 s (Reduced 15 %, Off 0) | white-hot sphere 0.08 s, ring 0 → radius in 0.2 s, virtual light 0 → 3 → 0 in 0.3 s, debris shards at 2× glow |
| Practice picked up | 0.10 | path glow 25 % → 0 in 0.3 s | 30 path-glow motes spiral up |
| Room cleared | 0 | 0 | the clear wave (§5.2) |
| Health ≤ 1 heart | 0 | 0 | the last HUD heart beats (§10.2). No vignette by default (Mat's heartbeat vignette is opt-in) |

---

## 8. Creatures (projections)

### 8.1 The method (Cre r1, amended)

A projection does not ship until every step is written in its def:

1. **Pattern → verb.** One sentence in the player's voice ("*Are you sure?*") and the one verb it does in play. If the verb doesn't teach the pattern, change the verb first.
2. **The need underneath.** "It wants you to ___." It drives the face, the death and the touching moment.
3. **Path.** Whose shadow it is (`path.*.shadow` body tint; true hue only on the release shard). Mea's mapping.
4. **Glyph.** A silhouette a child draws in 3 strokes, readable in solid black at 24 px from front *and* side; unique (mask IoU < 0.8 against every other).
5. **Size class** (height is meaning: smaller looks up and needs; taller looks down and judges).
6. **Value class** (dark or pale husk, §8.2), with the reason.
7. **Face:** 4 frames.
8. **Motion:** rhythm (Hz), signature move, tic, telegraph ≥ 0.4 s.
9. **Sound:** a 2–4 note motif that is dissonant in idle and **resolves** on release.
10. **Release:** the pose that is the opposite of its shape, the shard.
11. **The touching moment** in one sentence. If you can't write it, go back to step 2.
12. **Gate:** `?gallery` captures pass (§12.5).

### 8.2 Body rules (Q5: made of the room *and* readable)

**Ruling: projections take the host room's *pattern*, never its *value*** (Mat r2, Cre r2, Tech, Ply).

- **Grid:** every box and offset in integer texels (1/16). Limbs 2 or 3 texels thick, never thinner; no detail under 2×2 on the face. One asymmetry per creature.
- **Host material:** the most common solid material within 4 blocks of the room centre at spawn (cosmetic only), or the def's `skinBias` if present. The creature atlas is cached per (type, host material), built at floor load.
- **Skin:** host pattern and grain, recoloured: tint 40 % toward the path shadow, then value-mapped to the class:
  - **Dark husk** (Doubt, Panic, Procrastination, Distraction, Comparison, the Shadow, Resistance): body mean **L* ≤ 14**; a 1-texel **`cold.rim`** on the top edge and side edges of each face (full ring on top faces): a cold backlight that holds against every floor (ΔL* ≥ 25 vs every rock base).
  - **Pale husk** (Inner Critic, Perfectionism's shell, the Impostor's frame): body mean **L* ≥ host + 20 and ≥ 55**; outer texel ring of each face at 70 % value (Cre's "3D outline").
  - Gate: body or rim differs from the host tile average by ΔL* ≥ 20 on every floor (test, per class).
- **Overlay:** one pattern-specific motif on the skin (Doubt's wisps, the Critic's ink ticks, Panic's cracks).
- **Contact AO** (bottom 2 texel rows of each part's side faces −15 %) and a **blob shadow** quad (Tech).
- **Inverted-hull outline** (`ink.void`, 1 texel along normals, +1 draw call): shipped as the **"High-contrast projections"** setting, default off, auto-enabled for any type that fails the gallery greyscale check (Tech/Ply). Dir/Cre's "always on" lost on cost: the rim/ring is free.
- **Colours:** ≤ 8 palette keys per creature (4 host + 4 own).
- **Banned:** skin band, human features (noses, ears, hair, lips), clinical props, real weapons, tears, religious figures, `light.*`, `life.*`, true path hues in content.

### 8.3 Eyes and faces

- **The eye is a light in a socket** (Cre r2, resolving Mea r1 "hollow, no pupil" vs Cre r1 "moving pupils"; Mea and Ply accepted it in r2): a dark socket (`ink.void`, ≥ 3×3) holding a **2×2 `cold.white` light** that moves ±1 texel to look at you, away or up. No pupil, no white of the eye: nobody is behind a pattern, yet it can gaze. Idle 0.6 emissive, telegraph 1.0. One family eye for every projection (bosses use eye *blocks* with the same rule).
- **Tell:** at least one emissive feature ≥ 2×2 texels on the front in the idle frame, fog ×0.3 (Ply/Tech test).
- **Face = texture on the head's front plane**, 4 frames, swapped instantly (UV offset): `idle`, `telegraph`, `hurt`, `release`. Mouths optional and only if the mouth *is* the pattern. The `release` frame is always softer than idle.
- **Head turns to the player** (yaw clamp ±45°, 6 rad/s, stepped).

### 8.4 Size classes and caps

| Class | Height | Head : height | Max boxes | Bones |
|---|---|---|---|---|
| Small | 0.5–0.9 (body) | 45–85 % | 10 | ≤ 8 |
| Medium | 1.0–1.5 | 35–45 % | 14 | ≤ 12 |
| Tall | 1.7–2.1 | 18–28 % (small head = rigid) | 16 | ≤ 12 |
| Boss | 3–6 | face spans 2×2–4×4 blocks | real voxels + ≤ 48 detail boxes | ≤ 12 |

Absolute cap 24 parts (Tech), model bounds within ±25 % of the hitbox. Pitiful patterns (safety, belonging) get heads ≥ 35 %; judging and comparing patterns get small heads.

### 8.5 Animation and timing

- **Materialisation, 0.9 s at the room centre** (owner rule: always visible at the centre). 0.00–0.25 s: the centre floor block shows a `cold.dim` crack overlay; 6–10 texel cubes of host material rise from the floor and nearby walls toward the spawn point (pulled out of the room); a hum at the motif root. 0.25–0.70 s: boxes assemble bottom-up, each 0 → 1 in 0.12 s with a 1-frame overshoot to 1.08. 0.70–0.90 s: the face is painted last; eye lights open 0 → 0.6 over 0.2 s; the first thing it does is look at you. Invulnerable and harmless throughout.
- **Stepped poses at 12 fps** (rotations snap to keyframes); world position smooth at 60 fps.
- **Breath:** torso Y scale ±3 % at the creature's Hz. **Squash/stretch** ≤ ±12 %.
- **Tic** every 2–5 s, seeded by actor id.
- **Telegraph ≥ 0.4 s, three channels at once:** the `telegraph` face, one body part to an extreme pose, a sound. The part that will hurt flares toward `cold.white`; any pulse ≤ 2.5 Hz; monotonic brightening steps are not flashes.
- **Hurt:** `hurt` face 0.15 s, head knocked 6–10°, flash to host `hi` 0.06 s.
- **Rotation pivots** at joints (hips, shoulders), never box centres (bug fix).

### 8.6 Release (death)

1. Hit-stop 50 ms; face → `release`.
2. Release pose 0.3 s, pattern-specific, the opposite of its shape.
3. Dissolve: host chips fall (3 per box, cap 24) and drain to grey; `light.gold` motes rise (cap 16).
4. **The shard:** a 0.1875 cube turned 45° on two axes, `light.hot` core with a 1-texel rim in the path's **true** hue, rises 1.2 blocks over 1.0 s spinning 0.5 rev/s, fades. Mental transmutation shown, not explained: the same hue moves from its dull pole (body tint) to its bright pole (shard rim) (Mea). Cosmetic today (OWNER Q5).
5. The motif resolves (dissonant → consonant, soft sine).
6. No gore, no scream, no hurt frame at death. The last image is a softer face.

### 8.7 Bosses become architecture

Bosses are real breakable voxels from the floor's material set (Cre, Tech: own voxel grid + the existing mesher, 1–3 draw calls). Eyes are luminous socket blocks (`cold.white`). Each boss has a **core vessel** block that shows captive light through its cracks; exposing it and hitting it triggers the release. Phases: how it presents itself → how it fights when threatened → what it is underneath (smaller, more pitiful). Death writes its voxels into the world as **architecture you use** (stair, bridge, light).

### 8.8 FINAL SPEC: Doubt — "Are you sure?"

- **Need:** it wants you to not fail; it keeps you still because still is safe. **Path:** Mind (shadow `#4A3663`). **Class:** medium, **dark husk**. **Glyph:** **?** (side view).
- **Changes from Cre r1 (Cre r2):** the knock-kneed legs read as a crying child (banned), so the legs become a heavy dragging **sack of stones**: doubt carries weight. Head ratio 38 %.
- **Boxes** (texels w × h × d; origin at the feet, +z faces the player). Height 21 texels = **1.3125** (hitbox 1.6, within 25 %).

| # | Part (bone) | Size (texels) | Units | Placement |
|---|---|---|---|---|
| 1 | sack (root) | 10 × 4 × 8 | 0.625 × 0.25 × 0.5 | y 0–4; pivot at front-bottom edge; tilts 4° per scoot |
| 2 | torso | 8 × 7 × 6 | 0.5 × 0.4375 × 0.375 | y 4–11, rest pitch 20° forward |
| 3 | neck | 3 × 4 × 3 | 0.1875 × 0.25 × 0.1875 | from torso top, pitched 45° forward (the hook of the "?") |
| 4 | head | 9 × 8 × 8 | 0.5625 × 0.5 × 0.5 | 4 texels forward of the torso, tilted 25° down; face 9 × 8 |
| 5–6 | upper arms | 2 × 5 × 2 | 0.125 × 0.3125 × 0.125 | hanging from the shoulders |
| 7–8 | forearms | 6 × 2 × 2 | 0.375 × 0.125 × 0.125 | **crossed over the chest** at y 8 and y 10: it holds its own elbows |

- **Palette** (F1 reference after value mapping): outline `ink.void`, dark `#1A1520`, base `#262030`, hi `#352C42` (mean L* ≈ 14), rim `cold.rim`; overlay 3–5 `cold.dim` 2×1 wisps drifting 1 texel / 0.5 s (stepped); eyes `cold.white`, sockets `ink.void`; brows 1 texel `ink.void`.
- **Face frames** (9 × 8): sockets 3 × 3 at rows 2–4, cols 1–3 and 5–7.
  - `idle`: lights 2 × 2 look at you, then slide 1 texel down and away after 0.6 s: it can't hold your gaze.
  - `telegraph`: sockets 3 × 4, lights 2 × 3 at 1.0.
  - `hurt`: lights squeezed to 2 × 1.
  - `release`: lights at the top of the sockets (looking up at you), brows lifted 1 texel.
- **Motion:** breath 0.4 Hz. It drags itself in stepped scoots (sack slides 2 texels per step at 12 fps). Every ~1.4 s it stops 0.5 s to reconsider (head turns ±25° left and right): OWNER Q4, a behaviour change that opens an escape window. Tic: a slow head shake.
- **Telegraph 0.5 s** (within 1.5 m, before contact damage can apply): forearms uncross and open (it reaches for you), lights to 1.0 and widen, a rising minor-second "hm?" that never lands.
- **Release:** torso and neck snap upright, so the "?" becomes a "!" for 0.3 s; head level; it looks at you with clear eyes. Dissolve; shard with a Mind rim. Motif: minor second → unison.
- **The touching moment:** it never attacks on purpose; it holds on so you don't go. Released, it finally stands up straight.

### 8.9 FINAL SPEC: Inner Critic, "the Lectern" — "That's not good enough."

- **Need:** it wants you to be accepted, so it judges you first, before anyone else can. **Path:** Mind. **Class:** tall, **pale husk**. **Glyph:** **Γ**.
- **Why a lectern (Cre r2, endorsed by Ply's critique):** the r1 stilt-man was still a human body. The Lectern has **no legs, no torso, no hands**: a stack of ruled pages on a post, a mask, a quill. Cold and administrative, never flesh. It **glides**, never walks.
- **Boxes** (texels). Height 31 texels = **1.9375** (hitbox 1.9).

| # | Part (bone) | Size (texels) | Units | Placement |
|---|---|---|---|---|
| 1 | foot (root) | 8 × 2 × 6 | 0.5 × 0.125 × 0.375 | y 0–2 |
| 2 | post (root) | 2 × 2 × 2 | 0.125 cube | y 2–4 |
| 3–9 | slabs s1–s7 | 8 × 3 × 6 each | 0.5 × 0.1875 × 0.375 | y 4–25; x offsets 0, +1, −1, 0, +1, 0, −1 texel; rest yaw ±3° alternating: a stack of marked papers |
| 10 | mask | 7 × 6 × 1 | 0.4375 × 0.375 × 0.0625 | y 25–31, front flush +1 texel, tilted back 5° |
| 11 | quill | 2 × 2 × 12 | 0.125 × 0.125 × 0.75 | from the right edge of s6 at y 23–25, pointing forward (+z): the bar of the Γ. Its last 2 texels are the **nib**, emissive `cold.white` 2 × 2 seen end-on: the tell |

  11 boxes, 10 bones (foot+post, s1–s7, mask, quill).
- **Palette:** paper dark `#8C93A0`, base `#C9CFD8`, hi `#E4E8EE` (cold chalk, chroma ≤ 0.02, far outside the skin band; L* 83 vs F1 brick 38), host pattern kept as faint ruled lines; overlay `ink.line` tick marks, 1 per 4 × 4 texels; 70 % edge ring; quill shaft `ink.line` with a `cold.dim` highlight; on its back (back faces of s3–s5) a 5 × 5 `ink.line` **✗**. The red pen (Cre r1/r2) is gone: red is life.
- **Face frames** (7 × 6 mask): sockets at row 2, cols 0–2 and 4–6 (edge to edge, narrowed).
  - `idle`: slits 3 × 1 with 2 × 1 lights at 0.6.
  - `telegraph`: sockets 3 × 2, lights 2 × 2 at 1.0.
  - `hurt`: the mask tilts down 20° and the slits close (lights off, 0.15 s): it covers its own face.
  - `release`: soft 2 × 2 lights at 0.6, socket corners rounded, a 2 × 1 `ink.line` neutral mouth.
- **Motion:** breath 0.25 Hz (the stack compresses 1 texel: holding it in); turns in stiff 15° steps at 12 fps; glide strafe. Tic: the nib taps forward 1 texel, a dry *tick*.
- **Telegraph 0.6 s** (matches today's wind-up): the quill rises 15°, the nib goes 0.6 → 1.0, slits open to 3 × 2, a dry "tsk-tsk" falling a tritone. Shot: the cold ✗ judgement in an arc (§7.2), leaving an ink ✗ decal for 3 s.
- **Release:** the quill lowers and lies flat across the top of the stack; the slabs **fan open** (each rotates 8–20° around its back edge, stepped) and their undersides are **blank** (paper hi, no ticks); the ticks fade to paper over 0.4 s; the stack bows forward 15°, the first time it bends. Shard with a Mind rim. Motif: tritone → fifth.
- **The touching moment:** when it turns, you see the ✗ on its own back: it judges first because it is the most afraid of being judged. Released, its pages are blank: room to begin.

### 8.10 FINAL SPEC: Panic — "Something is wrong, something is wrong."

- **Need:** it wants to protect you; an alarm that rings when nothing is on fire. **Path:** Will (shadow `#634D36`; fire turned inward). **Class:** small, **dark husk**. **Glyph:** **✳**.
- **Boxes** (texels). Body height 13 texels = 0.8125; raised arms reach 17 (1.0625) (hitbox 0.9).

| # | Part (bone) | Size (texels) | Units | Placement |
|---|---|---|---|---|
| 1 | body/head (root) | 10 × 10 × 10 | 0.625 cube | y 3–13; head ratio ≈ 77 % (it is all head) |
| 2–3 | arms | 2 × 5 × 2 | 0.125 × 0.3125 × 0.125 | from the top corners, **raised up and out 30°** (hands up) |
| 4–7 | legs | 2 × 3 × 2 | 0.125 × 0.1875 × 0.125 | at the four corners, spider-quick (2 bones, diagonal pairs) |
| 8 | core | 6 × 6 × 6 | 0.375 cube | centred inside the body; emissive captive light seen through cutout cracks (`alphaTest`) |

- **Palette:** body outline `ink.void`, dark `#16100E`, base `#1F1714`, hi `#2E2219` (near-black, Ply), `cold.rim` rim, 3–4 hairline cutout cracks per face (≤ 10 % of texels); core `captive.smoulder` at 0.4 in idle. The r1 red body with green eyes lost (the classic CVD failure, and invisible in fog).
- **Face** (front 10 × 10): sockets 4 × 4 at rows 2–5, cols 1–4 and 6–9; lights 2 × 2 jittering ±1 texel at 6 Hz (positional); mouth a 2 × 2 "O" in `ink.void` at rows 7–8, cols 4–5.
  - `telegraph` (last swell step only): eyes squeeze shut (sockets 4 × 1, lights off), mouth 2 × 1: it doesn't want to.
  - `hurt`: lights 3 × 3, eyes wider still.
  - `release`: lights become 2 × 1 arcs at 0.4 (closed eyes), mouth a 2 × 1 exhale.
- **Motion:** positional vibration ±1 texel at 20 Hz on the body only (motion, not a flash: allowed, Ply r2); zigzag rush; breath 2 Hz, 6 Hz during the fuse.
- **Telegraph:** today's 0.9 s fuse in **three stepped swells** every 0.3 s: scale 1.0 → 1.15 → 1.30 → 1.45. The core brightens monotonically: `captive.smoulder` 0.4 → `captive.ember` 0.7 → `captive.ember` 1.0 → **`cold.white` 1.0 on the last step: the alarm goes white** (Dir's "never gold", Mea's "fire turned inward"). Each step is a heartbeat thump, **spatialised on its body, never screen-wide** (Ply). A `cold.body` dashed danger ring (2 px dashes, `cold.deep` gaps) on the ground expands to the burst radius (2.2) over the fuse.
- **Burst:** a `cold.white` sphere for 0.08 s, breaks blocks (gold shards fly from *their* cracks, as with any break: what it breaks is often the way forward).
- **Release before bursting:** it sighs: deflates to 0.8 over 0.4 s, one slow 0.5 Hz breath, eyes close, dissolves; shard with a Will rim. Motif: heartbeat → a single soft low note.
- **The touching moment:** tiny and terrified with its hands up, it shuts its eyes before it goes off, and what it breaks is often the way forward.

### 8.11 Final sketches: the next projections and the bosses

| Projection | Need · path · class · glyph | Body | Face and motion | Release |
|---|---|---|---|---|
| **Procrastination** "Later." | rest, protection from overwhelm · Will · medium, dark · **≡** | 3 crooked stacked boxes (12, 10, 8 texels wide), 1.375 tall, skinBias crate; a smaller box tucked under its "arm" like a pillow; `captive.smoulder` banked ember in the gap between boxes | heavy-lidded 3 × 3 sockets with the top row covered (2 × 2 light visible below); breath 0.3 Hz; scoots; tic: a yawn (mouth 3 × 3 for 0.6 s); telegraph: slow lean 0.8 s then topples; when hit the top box slides off as a smaller Procrastination (OWNER Q4) | the last box settles and **becomes a real loose crate** with gold crack lines: the postponed task becomes material |
| **Distraction** "Ooh, what's that?" | relief, novelty · Mind · small, dark · **⋈** (moth) | 6-texel cube body, 2 wing plates 6 × 1 × 5 flapping at 12 fps, antennae 1 × 4 × 1; hovers at eye height. Replaces DESIGN's bat (an animal is not a pattern; Mea) | huge 3 × 3 sockets whose lights **never look at you** (they look at the nearest light, pickup or item); wings shimmer `cold.dim` ↔ `cold.body` at ≤ 2 Hz (Cre's gold hue-cycling wings lost: gold on a projection, and a cycling hue); telegraph: wings snap flat 0.4 s before a dart | it lands, folds its wings and **looks at you for the first time** |
| **Perfectionism** "Not yet." | to be loved without fault · Body · tall, pale shell over a dark core · **▣** | 1.75 tall symmetrical golem: 6 polished plates (`#E4E8EE`/`#C9CFD8`, hairline `ink.line` seams, skinBias pedestal) over a small rough figure 0.875 tall in raw dark host material (Cre's warm clay `#b5734f` lost: skin band) | symmetrical mask, 2 × 2 lights, no mouth; when the face plate breaks, the real face: worried brows, 2 × 3 lights; moves only in whole-block steps and 90° snaps; tic: straightens a plate; telegraph: two-arm slam 0.7 s | the broken plates are drawn back with **gold** kintsugi seams for 0.5 s (gold at release only): whole *and* visibly broken; a 1-texel smile; release |
| **Comparison** "They're ahead of you." | to know where you stand, to belong · Emotion · tall, dark · **⊥** | an obsidian **mirror slab** 12 × 24 × 4 texels with two jumper-like sleeve-arms (cold-tinted), standing on a pedestal block it carries: 2.1 tall, always taller than you. Not a human figure | its face is a mirror plane with a **blurred, unreadable icon silhouette** (Cre r2: never your real lacks, Ply §5.2), 2 × 2 lights above; a 2-texel `cold.dim` diagonal sheen; copies your intentions after 0.3 s as cold cubes; tic: looks at its own sleeves | each hit removes a texel of pedestal; at release it is exactly your height, turns to face the same way as you, standing beside you, then releases |
| **Resistance** (boss) | that nothing changes · Will · boss, dark | a **door that walks**: wall 4 × 5 × 2 blocks of the floor's hardest material, stubby block legs; two tired socket-block eyes, a letterbox slot mouth (Cre's amber `#d08a3a` lost: warm) | phase 1 steps between you and what you aim at; phase 2 rebuilds the blocks you break and walls you in; phase 3 sits down, heavy, core shows | core vessel: **one crate block** in its chest, "the first small step". It lies down and becomes a **stair or bridge** |
| **The Impostor** (boss) | to be safe from being found out · Emotion (OWNER Q9) · boss, pale | a 4-tall hollow figure-frame of **brass** (false gold, never emissive), a mask on the top block smiling too wide | phase 2 splits into 3 frames; the real one's eye lights flicker honestly at 2 Hz; phase 3: the frame falls apart, inside is a small ordinary figure (1.5 tall, raw dark host material) holding the core | the small figure was the only real thing; it stands there, then releases |
| **The Shadow** (boss) | to be seen, to come home · all four paths · boss, dark | **your own silhouette**, 3.5 tall, built of blocks in the *negative* of the room (inverted value, hue +180°, chroma ×0.5), no features but eyes; **its hands are your hands** (your jumper, your cuff, in dark) (OWNER Q10) | mirrors you, then amplifies you, using 2–3 practices you hold; phase 3: your intentions pass through it harmlessly; you win by **placing a block on its core** (building, not breaking) | it does not dissolve: it shrinks into your hands, which keep a 1-texel `ink.line` ring at each wrist for the rest of the run |

Element projections (Burnout, Overwhelm, Stagnation, Spark) follow the same method when their elements land.

---

## 9. Hands

Proposed by Cre r1 §11, adopted by all (Tech prices it at 1.5 d through the creature pipeline). The hands are the protagonist's only body; they are specific, warm and textured, and they change with who you are becoming.

- **Grid:** hand box 3 × 3 × 5 texels (0.1875 × 0.1875 × 0.3125), sleeve 4 × 4 × 7 (0.25 × 0.25 × 0.4375), **thumb** 1 × 1 × 2 (0.0625 × 0.0625 × 0.125) on the inner side: three boxes per arm, so it reads as a hand. Drawn with `voxelShade` and the virtual held-shard light; no own lights.
- **Skin texture:** 3-tone ramp from the chosen tone; knuckle row 1 texel darker on the back; palm 1 step lighter; 2 × 1 light nails; edge darkening. **Skin tone is a player setting** with 6 tones (`skin.t1`–`t6`, default `t3`); we never pick one for everyone (OWNER Q11: when it is asked).
- **Sleeve:** a **knitted jumper from the house above** (a home garment, not armour): rib-knit (alternating 1-texel columns of `cloth.base`/`cloth.hi`), a 3-texel `cloth.cuff` band, one loose-thread pixel. As above, so below.
- **Gestures:** casting is an **open palm pushing forward** (an offering, never a fist), palm texture toward the camera at the swing peak; carrying cradles the block in a cupped hand; holding up an item uses both palms open under the icon.
- **Health:** the hands do **not** tremble (Cre's 8 Hz tremble lost to G2: the player's body never acts out panic).

**States of being** (on reaching three of a path; visible at once; stacking; shown by holding the hands up and turning them over once):

| State | Sleeve | Skin / detail | Light |
|---|---|---|---|
| **Embodied** (Body) | rolled up: sleeve shortened to 4 texels, forearm skin shows | `path.body.dark` dust specks at the knuckles | none: solid and weighty |
| **Lucid** (Mind) | lightened 20 % toward `path.mind.glow` | — | 1-texel emissive line at the fingertips in `path.mind.glow` (Cre's cold `#cfe3ff` lost: the player's side is never cold) |
| **Open-hearted** (Emotion) | the cuff **mended with gold stitches** (`light.gold`): repair (Cre's red stitches lost: red is life) | — | a soft palm glow in `path.emotion.glow` while casting |
| **Resolute** (Will) | darkened 15 % | cloth wraps around the knuckles, 2-texel band in `bone.dim` | none |
| **Shadow integrated** | — | 1-texel `ink.line` ring at each wrist | — |

The lantern grows +0.5 m per state; the HUD shows states with glyphs (§10.2).

---

## 10. Icons, HUD/UI, hexagram, accessibility, safety

### 10.1 Item icons (12 × 12)

- **≤ 4 colours + the outline** (`ink.line`, 1 icon pixel, 4-neighbour; keep the top-edge highlight at scale ≥ 3). One dark (OKL < 0.35), one mid, one light, one optional accent; darkest to lightest ≥ 0.30 OKL.
- **Fill ≥ 40 of 144 pixels**; no 1-px strokes as the only content; the filled bounding box touches at most 1 border row.
- **Silhouette test:** solid black at 12 × 12 and at 28 px recognisable; **alpha-mask IoU < 0.8** against every other icon (CI).
- **Colour:** icon art from any palette token **except** `light.*`, `life.*` and `cold.*`, unless the item's concept is light itself (Satori: `light.core`/`light.gold`). Item `color` (banner glow, pedestal halo, selection frame) = its **primary path's glow** token; path-less items use `bone.paper`. Grey items get a tint (Stoic). Icon dominant colour ≥ 3:1 against `ink.panel`.
- **No text, letters, sacred names or religious symbols.** The Tao Te Ching yin-yang icon is to be replaced (OWNER Q6, rec: water flowing around a stone, from the text itself).
- **Fixes:** Satori becomes an open ensō of 2-px weight (gap at the upper right) in `light.gold` with a `light.core` inner edge; Box Breathing redrawn as one bold square path with a 2 × 2 core; Stoic Resolve tinted.
- **Integer scales only** (icon canvas = 14 × 14 with outline): HUD bar ×2 (28 px), inventory tile ×3 (42 px in a 56 px tile; fixes the ×2.86 bug), death screen ×3, banner ×5 (70), detail ×6 (84), pedestal sprite texture ×4, nearest filtering.

### 10.2 HUD and UI

**Fonts (Ply; OWNER Q2 because they are binary OFL files, ~80 KB):** **Pixelify Sans** for display and numbers, only at 20 / 28 / 40 px, `tabular-nums`; **Atkinson Hyperlegible Next** for body text. Fallback if refused: a generated 5 × 7 pixel font for numerals and titles, system UI sans for body. Never system monospace. Sizes at 1366 × 768: minimum 14 px anywhere, body 16, effect line 15, counters 20, item name 28, titles 40; line height 1.4. All in-game text goes through i18n.

**Scale unit:** `--u: clamp(2px, round(100vh / 384), 5px)` (2 px at 768, 3 at 1080, 4 at 1440); UI scale setting 100 / 125 / 150 %.

**Panel style, "the cellar slate":** `ink.panel` at α 0.95; 1 px `ink.void` outline; 2 px inner bevel (`inset 2px 2px 0 ink.bevel, inset -2px -2px 0 ink.void`); **chamfered corners** of 2 `--u` via `clip-path` (no border-radius anywhere); padding 6 `--u`; a 2 `--u` accent bar on the left in the context colour (item or path). No gradients except the banner glow; no blur.

**Layout (Isaac corner, kept):**
- **Hearts** top-left: 11 × 10 art × `--u`, gap 1 `--u`, quarter clips (health in points, 8 per heart; owner decision). Empty: `life.empty` + `life.rim`. **Low health:** the last heart beats (scale 1 → 1.12 → 1 at 1.1 Hz). **Invulnerability:** hearts at 55 % steady with a 1 `--u` `bone.paper` outline (the 5.5 Hz blink is removed).
- **Breakthrough counter = a seed icon** (10 × 10 pixel string: `seed` ramp husk with a `light.ember` crack and `light.core` heart), replacing the cartoon bomb. **Keys:** a key with an eye (insight), `light.gold` body, `brass` shade. Counters 20 px Pixelify `bone.paper` with a 1 px `ink.void` outline. All HUD glyphs are 12 × 12 or 10 × 10 pixel strings in `src/content/hud-icons.ts` drawn by `iconCanvas` (the SVG data URIs go).
- **Item bar:** 28 px icons, max 2 rows of 7, then a `+N` chip.
- **Minimap: top-right**, 180 px wide, slate panel, floor label underneath (the right hand covers it today). Unvisited rooms: 25 % `bone.faded` outline; visited uncleared: `ink.ash`; cleared: `light.gold` 50 %; current: `bone.paper` + 1 `--u` outline. Marks are glyphs, never colour alone: start = a 3-px house, treasure = hollow `light.gold` ◇ (distinct from Mind's filled ◆), vault = `brass` ▭, boss = `cold.white` ▣. Later the side-view Tree map (Mea §4, Phase D).
- **Hand slots:** bottom centre, 24 `--u` squares, slate; the top block gets a 2 px `bone.paper` frame and a 3-px caret. The 10 px "hand" label goes (taught once).
- **Crosshair:** 2 px `bone.paper` cross with a 1 px `ink.void` border; opens (4 gaps) over a projection; forms an ✕ for 120 ms on hit. Shape, not colour.
- **States of being:** a 1 `--u` underline under the heart row in the path colour with the path glyph at its end; a tiny glyph at the crosshair's 4 o'clock. No persistent full-screen tints.
- **Banners** (keep click-to-dismiss): slate, max 640 px, top 12 %; icon 70 px with a glow in the item colour; name 28 px; quality stars in `light.gold` (count carries meaning; q4 adds a 6 px glow); description 16 px italic `bone.dim`; effect 15 px in an inset bar; stat lines **▲ `light.gold` / ▼ `cold.body`** with arrows; synergy lines ✦ `light.gold`.
- **Toasts:** slate mini-panel, 16 px, **top-centre at 22 %**, 2.5 s, max 2 stacked (no longer near the hand slots).
- **Room/floor title:** 40 px, fade in 300 ms, hold 1.5 s.
- **Inventory (Tab):** slate `min(960px, 94vw)`, columns `1fr 260px`; 56 px tiles; selected = 2 `--u` frame in the item colour + 1 `--u` `bone.paper` inner frame; detail icon ×6; path chips with glyph + word; undiscovered synergies `✧ ???` at 60 % (≥ 14 px); stat table labels `bone.dim`, values `bone.paper`, changes with ▲/▼; full keyboard navigation with a visible focus ring.
- **Debug readout off by default**, F3 toggles.

**Death screen:** background `ui.night` → `ink.void` (vertical); an **ensō** drawn in `bone.paper` (2 `--u` weight) over 1.2 s that closes *almost* fully; "The intention faded" 40 px; the cause phrased with the pattern as agent: "Panic held you on floor 3" (never "Overcome by"); the run's hexagram small with completed stations lit; "Begin again" on a slate button. No blood red.

### 10.3 The run's hexagram

- **Drawing rules:** six lines, **read and drawn from the bottom up**. Unit grid (Ply's proportions, which read at HUD sizes; Mea's 8 × 1 thin lines lost): a solid line is **15 × 3 u**; a broken line is two **6 × 3 u** halves with a **3 u** centred gap; **3 u** between lines; total **15 × 33 u**. Lines `bone.paper` on `ink.line`; **changing lines** in `light.gold`, pulsing with a 4 s period (0.25 Hz: changes are calm). No traditional circle/cross marks; the gold carries the meaning. In the world: 1 u = 1 block → a 15 × 33 inlay is too big, so the start-room floor inlay uses 1 u = ⅓ block rounded: lines 5 blocks wide and 1 block thick, yin gap 1 block, 1 block between lines (5 × 11 blocks), pale stone in dark stone.
- **The six lines are the six stations** (Mea): line 1 = floor 1 … line 4 = floor 4, line 5 = the source, line 6 = the sky. A line is at 40 % until its station is completed. You go down, the hexagram builds upward.
- **Where it appears:** the start screen (large, one line per 300 ms from the bottom, always beside the seed code: `Seed 23 · K7F-Q2M · click to copy`); the start-room floor inlay (Phase D); the pause screen (small, stations lit); the end of run (the changing lines flip into the second hexagram: "where this moment was going"). **Never on the always-on HUD** (Mea and Ply agree: the reading is consulted, not watched).
- **Tone:** the image of this world, never a prophecy. Names, if shown, are our own gentle plain-English renderings (OWNER Q8).

### 10.4 Accessibility

- **Photosensitivity (WCAG 2.3.1 as the floor):** no element alternates faster than **3 Hz**; anything over 25 % of the screen never more than 3 transitions per second; the `Hud` **flash budget** blocks a full-screen effect from retriggering within 333 ms; item flash peak 0.45 over 500 ms; hurt vignette peak 0.35 (`life.dark`); saturated red never covers more than 25 % of the screen; the albedo moment is a ≥ 1.5 s ramp.
- **Settings, on the first pause page:** Screen shake 0–100 % (default 70), Flashes Full / Reduced / Off, Head bob, FOV 70–100, UI scale 100 / 125 / 150, Reduce motion (defaults from `prefers-reduced-motion`: shake 0, flashes reduced, banner without bounce), High-contrast projections (hull outline), Skin tone, Low-health vignette (opt-in). Remappable input.
- **Colour:** every meaning pair is on the blue↔yellow axis *and* has a shape difference; paths always carry glyphs; every screenshot reviewed in greyscale and three CVD simulations.
- **Text:** ≥ 14 px, contrast ≥ 4.5:1 body, 3:1 large display, never below 60 % opacity, never meaning only in italics or only in colour.
- **Time:** anything time-limited (fuses) has a sound cue *and* a visual swell.

### 10.5 Emotional safety and red lines

**Rules (Ply §5, Mea §7, Cre's banned imagery):**
1. Projections are matter, not bodies: no skin tones, no realistic proportions, no naked figures, at most one feature group per face.
2. No words of a projection aimed at "you": no insults, no mocking laughter, never the player's failures quoted back. Pattern-level glyphs instead.
3. No panic simulation on the player: no tunnel vision, no screen-wide heartbeat or breathing audio, no distortion, no trembling hands. Panic's danger is mechanical and telegraphed.
4. Defeat releases, it doesn't wound: shards of light and grey dust, no blood, no gibs, no screams; the player's damage is a short muted vignette.
5. Death is rest: "The intention faded", the ensō, "Begin again"; the pattern is the agent ("held you").
6. The hexagram is an image, not a fate.
7. Darkness is a mood, not a wall: floor plane ≥ OKL 0.12; the room you are in always has a readable light source (lantern minimum).
8. The HUD stays honest: hearts, counters, threats and crosshair never dissolve, distort or flicker to express a mood. "Fog thickens with Doubt", "HUD fades when you panic", "glitch text for the Critic" are rejected.

**Red lines (never):**
- **Traditions:** no sacred names of God, no Hebrew letters, no labelled sefirot, no classic Tree diagram (places are rooms, never circles); no deities, saints, Buddha images, crosses, pentagrams, the eye in the triangle, rotating hooked-arm sun signs (check every spiral or rotating cross); no decorative yin-yang; never a tradition, figure or practitioner as a projection.
- **Mental health:** no self-harm imagery of any kind (cuts, wrists, ropes, pills, falls as death), no asylums, straitjackets, spiral "crazy" eyes, diagnosis labels; no features coding body type, ethnicity, age, gender or disability (Procrastination must not read as "lazy", Panic not as a person in crisis).
- **Violence and family:** no blood, gore or viscera; parents, family, ancestors and the house are never enemies.
- **Copying:** no palettes, sprites, names, silhouettes or texture layouts lifted from Minecraft, Isaac or Noita; no crying child, no tear projectiles.

---

## 11. Iconographic motifs and the meaning test

Mea's vocabulary, adopted by all. Repetition makes a language; a motif out of place breaks it.

| # | Motif | Meaning | Use for | Never |
|---|---|---|---|---|
| 1 | **Crack of light** | the limit is already giving way | damaged blocks (gold cores), captive light in projections, the boss frame, the bottom of the world | the player's body or hearts; random texture noise |
| 2 | **Shard** | freed light carrying an intent; material for repair | loose and held blocks, the release shard, building | weapons or blades; enemy projectiles |
| 3 | **Gold seam** | what was broken and rebuilt is stronger | placed blocks, Perfectionism's release, Open-hearted's cuff, rebuilt rooms on the map | pre-placed world blocks; treasure decoration |
| 4 | **Seed** | potential, a breakthrough waiting to open | breakthroughs (world and HUD), the start of a run, a state of being unlocking | skulls, fuses, cartoon bombs |
| 5 | **Eye** | insight | keys (a key with an eye), Lucid, revealed pockets; the open eye *icon* belongs to the player's side | projections' eyes are lights in sockets, not this motif; never the eye in a triangle |
| 6 | **Hand** | agency | first-person hands, open palms for receiving and casting | a fist striking a figure. **Pointing** belongs only to the Inner Critic (its quill) |
| 7 | **Six lines** | the reading of this moment | only the run's hexagram (§10.3) | borders, decorative line patterns, random hexagrams |
| 8 | **Ensō** | wholeness that accepts imperfection; beginning again | Satori's icon, the death screen, the loading indicator | closed perfect rings, buttons, reticles, frequent UI |
| — | Root / thread (secondary) | connection | Tree-map connections, root tunnels | — |
| — | Mirror line (secondary) | above and below | the floor slab, the surface horizon, Comparison's face | — |

**The meaning test** (Mea; every new asset, in the art skill's checklist and partly in CI):
1. **What does it stand for?** One sentence in the story's voice and a `concept:` id in `docs/lore/CONCEPTS.md`. None → it is decoration: cut it or find its meaning.
2. **Which side is it on**, and do its colours obey that side (§2, §3.12)?
3. **What does the player's intention do to it?** It must change (break, crack, free, light, repair) or be a fixed point with a stated reason (bedrock, the house).
4. **Does it read with all text removed?** Silhouette, posture, colour and behaviour carry it.
5. **Would someone who lives this pattern, or belongs to this tradition, feel seen rather than mocked?**

Plus the two guarantees: does it pass G1 (readable) and G2 (gentle)?

---

## 12. Technical pipeline

Tech's principle, adopted by all: **one grid, one light, one palette, one review screen. Every rule has a test or a gallery view.**

### 12.1 `src/content/palette.ts`

DOM-free (importable by the mesher worker and tests). Exports `PALETTE` (named tokens → hex as in §3), the derived skin ramps, `type PalToken = keyof typeof PALETTE`, `pal(t): number` (throws on unknown), `palCss(t): string`, `UI` (§3.10), and `applyPaletteCss()` (in `hud.ts`) writing `--pal-*`/`--ui-*` on `:root`; `index.html` uses only `var(--…)`. Migration: `materials.ts` (`colors: [PalToken ×4]`, `accent?`, `emit?`, `concept`), atlas door/crack colours, `items/types.ts` (`color: PalToken`, `icon.palette: Record<string, PalToken>`), creature palettes, `particles.burst(…, PalToken)`, `hud.ts` (`ROOM_COLORS`, `PATH_COLORS` → tokens), HUD SVG data URIs → `hud-icons.ts`. Named tokens (`'light.gold'`) instead of Tech's indexed `ramp.N`: same type safety, readable in content and in the guide.

### 12.2 `FloorLook` data (`src/content/tables/floor-looks.ts`)

```ts
export interface FloorLook {
  id: 'f1' | 'f2' | 'f3' | 'f4' | 'source' | 'surface';
  element: 'earth' | 'water' | 'air' | 'fire' | 'all' | 'sky';
  stage: 'nigredo' | 'albedo' | 'citrinitas' | 'rubedo';
  rock: [PalToken, PalToken, PalToken, PalToken]; // recolours brick and frame
  fog: PalToken; fogNear: number; fogFar: number;  // uncleared (§4)
  fogNearCleared: number; fogFarCleared: number;
  ambient: [number, number, number];               // RGB multipliers
  shadeK: number;                                  // 0.8–1.2 face-shade contrast (default 1.0)
  accent: PalToken;                                // element accent: motes, glints
  motes?: { token: PalToken; density: number };    // capped ambient particles
}
```

Fixed by depth (the Tree-of-Life map will later assign places; `ROCK_THEME` keeps densities). Transitions lerp over 1.5 s.

### 12.3 Creature format (`src/render/creature/types.ts`; content in `src/content/enemies/*.ts`)

Tech's cube-puppet format, extended with the art method fields:

```ts
export type FaceKey = 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz';
export type FaceArt = { rows: string[] }                               // palette keys; '.' = fill; UPPERCASE = emissive
  | { fill: 'host' | 'flat' | 'noise' | 'speckle' | 'stripes' | 'cracked'; seed?: number };

export interface CreaturePart {
  id: string; parent?: string;                 // bone tree; ids legL/legR/armL/armR keep the generic walk
  pivot: [number, number, number];             // joint, texels, relative to parent's pivot
  box: [number, number, number];               // integer texels ≥ 1
  offset: [number, number, number];            // box min corner from pivot, texels
  rest?: [number, number, number];             // rest rotation (radians); replaces `tilt`
  fill: FaceArt; faces?: Partial<Record<FaceKey, FaceArt>>;
  cutout?: boolean;                            // alphaTest cracks (Panic)
}
export interface CreatureClip { length: number; loop: boolean; fps?: 12;
  keys: Record<string, { t: number; rot: [number, number, number]; pos?: [number, number, number]; scale?: number }[]> }

export interface CreatureModel {
  palette: Record<string, PalToken>;           // ≤ 8 keys
  parts: CreaturePart[];                       // ≤ class cap, ≤ 24
  clips: Record<'idle' | 'walk' | 'telegraph' | 'hurt' | 'release' | string, CreatureClip>;
}

export interface ProjectionArt {
  concept: string;                             // id in docs/lore/CONCEPTS.md
  need: string;                                // "it wants you to …"
  touching: string;                            // the touching moment, one sentence
  glyph: string;                               // '?', 'Γ', '✳' …
  path: 'body' | 'mind' | 'emotion' | 'will' | 'all';
  sizeClass: 'small' | 'medium' | 'tall' | 'boss';
  valueClass: 'dark' | 'pale';
  skinBias?: string;                           // material key
  body: CreatureModel;
  face: { part: string; size: [number, number];
          frames: Record<'idle' | 'telegraph' | 'hurt' | 'release', string[]> };
  rhythm: { breathHz: number; ticEvery: [number, number] };
  telegraph: number;                           // seconds, ≥ 0.4
  projectile?: 'cube' | 'cross';
  motif: { idle: number[]; resolve: number[] }; // semitones from the root
}
```

`EnemyDef.model: ModelPart[]` becomes `EnemyDef.art: ProjectionArt`. Build (`src/render/creature/build.ts`, pure, Node-testable): shelf-pack face rectangles + 1 px gutter into ≤ 128 × 128 per (type, host), paint faces from rows or fills, write the emissive mask, bake face shade and contact AO; one `BufferGeometry` per type with `skinIndex = part`; at spawn a `SkinnedMesh` + `Skeleton` (one bone per part): **1 draw call per enemy**; per-instance material clones share program and texture (`uFlash`, `uHeat`, `uTint`, face-frame UV offset). `dispose()` on kill and on the last instance of a type.

### 12.4 Glow

In order of preference (Tech): (1) emissive texels (same draw call); (2) halos: one instanced additive camera-facing quad mesh (`src/render/halos.ts`, `fog: false`, cap 128 / 64) for pedestals, eyes, seeds, intentions, the 64 nearest shards; (3) the additive light-particle pool; (4) no default bloom.

### 12.5 `?gallery`

`src/debug/gallery.ts`, code-split, booted by `main.ts` before `Game`. Same renderer, atlas, shading chunk, palette and `FloorLook` uniforms; no physics or world generation. Sections `?gallery=materials|enemies|items|pickups|hud|palette|room|all`: material swatches 3 × 3 with 4 crack stages, loose vs placed vs mended side by side; every projection on a turntable × every host material × floors 1 and 4, with clip buttons (idle, walk, telegraph, hurt, spawn, release), counts and a hitbox toggle; icons on pedestals and at ×2/×3/×5/×6 on panel, black and white; hearts in all quarter states, banners, minimap; palette with tokens, L*, the contrast matrix and the CVD matrix; `room` with `cleared=0|1`. Filters: greyscale, deutan, protan, tritan, solid-black silhouette, 20-blocks-in-fog. Controls: drag orbit, `F` cycles FloorLooks, `B` background, `Space` pause, `P` PNG. **Deterministic captures** (`?gallery=enemies&id=critic&t=0.4&angle=35&floor=f4&filter=deutan`) feed the PDF and every before/after review.

### 12.6 Tests (`tests/art.test.ts`, Vitest, Node)

Prerequisite: pure painters writing into `PixelBuf` (`src/render/pixels.ts`); `atlas.ts` only uploads.

- **Palette:** every content colour resolves via `pal()`; source scan finds no `0x…`/`#…` hex in `src/**` or `index.html` outside `palette.ts` (allow-list file, shrinking to empty).
- **Namespace:** `light.*`, `life.*`, `cold.*` and true path hues only from their allow-listed modules; enemy content never references `light.*`/`life.*`/path base or glow.
- **Ramps:** within a material, L* strictly outline < dark < base < hi, neighbours ΔL* ≥ 8.
- **Husk/light (pillar 1):** tile pixel scan per material (OKL/chroma limits, exceptions list), glow budgets.
- **Paths:** pairwise ΔE ≥ 20 under the 4 simulations; ≥ 15 vs reserved; ≥ 4.5:1 on panel.
- **Skin band:** no creature palette token inside it.
- **Icons:** 12 × 12, ≤ 4 colours + outline, fill ≥ 40, IoU < 0.8, border rule, dominant ≥ 3:1.
- **Creatures:** ≤ class cap and ≤ 24 parts, integer texels, acyclic bone tree, face rows match face sizes, bounds within ±25 % of the hitbox, a ≥ 2 × 2 emissive tell on the front, ≤ 8 palette keys, packed atlas ≤ 128², `need`/`glyph`/`touching`/`concept` present, glyph unique, value class satisfied against every floor rock ramp (ΔL* ≥ 20 body or rim).
- **Atlas:** every tile index in range, no material id collides with a special tile (named tile table).
- **UI contrast:** text tokens ≥ 4.5:1 on panel.
- **Golden hashes** of the built atlas and each creature atlas in `tests/art.snap`: art never changes by accident.
- **Budgets:** literal `burst()` sizes ≤ 60; flash budget unit test (no full-screen retrigger within 333 ms).
- **Concepts:** every `concept:` id exists in `CONCEPTS.md`.

Non-unit-testable pillars (frame histogram, room +20 %) are judged on deterministic gallery captures (by hand or a 1-day Playwright script).

### 12.7 Budgets

| Item | Today | PC | Mobile |
|---|---|---|---|
| Draw calls per frame | ~60 chunks + 10/enemy + misc | ≤ 150 (busy room ≈ 100) | ≤ 90 |
| Draw calls per enemy | 9–10 | 1 (+1 with high-contrast hull) | 1 |
| Creature parts / bones | 9–10 / 4 implicit | class cap (≤ 24) / ≤ 12 | same |
| Creature texture | none | ≤ 128 × 128 per (type, host) | same |
| Colours per creature / icon | — | ≤ 8 / ≤ 4 + outline | same |
| Atlas | 128 × 64, 32 tiles | `DataArrayTexture`, 16 × 16 layers, ≤ 256 layers, mipmaps | same |
| Particles matter / light | 900 / 0 | 900 / 300 | 400 / 150 |
| Halos | sprite per object | 128 instanced | 64 |
| Burst per event | up to 50 | ≤ 60 | ≤ 30 (`fxScale`) |
| Intention mesh | 80 tris × 200 | 20 tris × 200 (3 draws) | same |
| Cracks | 4 draws | 2 draws | 2 |
| Block light | — | BFS ≤ 2 ms per chunk relight, worker; grid ≈ 2 MB | same |
| Scene lights | 2 + 2 (hands) | 0 | 0 |
| Bloom | — | off (opt-in High only) | never |

### 12.8 Known bugs and debts found in the debate

1. **Enemy GPU leak:** `kill()` removes the group without `dispose()`; a new geometry and material per part per spawn (Tech).
2. 9–10 draw calls per enemy; pickups are 3–20 meshes each with hardcoded hex.
3. **Atlas full:** a 16th material (id 16) collides with `TILE_GRASS_TOP`; "tile = material id"; 32 tiles cannot hold elements, variants or mended layers.
4. **Icon scaling:** inventory shows icons at ×2.86 (40 px box): uneven pixels.
5. Limbs rotate around their box centres, not joints.
6. Vertex colours are linear in three r186: authored shade 0.5 displays ~0.73.
7. Three lighting models (unlit chunks, Lambert + scene lights, hands' own lights): the Critic's bone `#d8d0c4` renders salmon; a loose block looks different from the same block in the wall.
8. Three texel densities (door texture 32 px stretched).
9. Loose cubes show the +Y tile on all six faces.
10. Particles use `shift()` (O(n²)), unlit opaque only, raw hex at call sites.
11. Right first-person hand covers the minimap.
12. Debug readout on by default.
13. Invulnerability blink at ~5.5 Hz (photosensitivity).
14. Item flash 0.75 and hurt vignette 0.9 saturated red, stackable with shake.
15. Toast at `bottom: 100px` collides with hand slots.
16. Text at 10–11 px; system monospace.
17. Critic projectile `#e9e2d6` has the value of the mortar.
18. Panic red body + green eyes (CVD failure, invisible in fog).
19. Doubt's eyes are 0.04 units (1 px at 20 blocks).
20. Path colours: Body/Will near-identical; Emotion pink collides with hearts.
21. HUD bomb is a cartoon bomb (lore says seed).
22. Grass-side painter reads `MATERIALS[1]` by index.
23. ~140 hex literals in `src/` + 32 in CSS, no shared source.
24. Satori icon is a 1-px ring.

**Status (art pass, 2026-10-26):** fixed: 1 (GPU leak), 4 (icons at integer scales), 8 (door leaves at 16 px per block), 11 (minimap top-right), 12 (debug readout off, F3), 13 (no blink), 14 (flash 0.45 with a budget, hurt vignette `life.dark` 0.35), 15 (toasts at 22 %), 17 (hostile projectiles `cold.body`), 18 (Panic near-black with cold eyes), 19 (Doubt's eyes are 2 × 2 texel lights), 20 (path chips and colours from tokens, with glyphs), 21 (the seed), 22 (the grass painter takes dirt by key), 23 (**zero** hex literals outside `palette.ts`), 24 (Satori's ensō). Open, with their phase: 2, 3, 5, 6, 7, 9, 10, 16. See ART-GUIDE §15.

### 12.9 Phased plan (engineering days, art included where noted)

Key architecture decisions (unified shading model, creature pipeline on `SkinnedMesh`, `DataArrayTexture` + `placed` flag, block light in the worker) go through the **three-party review** (engineer, architect, mediator) before Phase A starts, per CLAUDE.md.

| Phase | Work | Days |
|---|---|---|
| **0 · Before the guide PDF** | `palette.ts` + source-scan test with allow-list + `pixels.ts` pure painters (1.5); `?gallery` v1: materials, items, current enemies, palette (2). Produces the real "before" plates | **3.5** |
| **A · Foundation** | unified shading, sRGB fix, steeper shade, `FloorLook` + fog table (1.5); `DataArrayTexture`, named tile table, per-floor repaint (1.5); creature pipeline, leak fix, host skins, face frames (4); art tests: creatures, contrast, CVD, ramps, namespace, golden hashes (1.5); halos, light-particle pool, ring buffer, blob shadows (1) | **9.5** |
| **B · The look** | texture grammar + all 15 materials repainted (2, art); cracks of light (0.5); shards on loose/held + held light (1); `placed` flag + mended layers (1.5); block light BFS (3.5); clear wave, `clearT`, lantern, virtual lights (1.5); intentions + hostile projectiles (1); Doubt, Lectern, Panic: art, clips, motifs (2.5, art); hands + skin setting (1.5) | **15** |
| **C · HUD and accessibility** | HUD restyle, `--u`, slate panels, fonts (2); HUD icons via pipeline: hearts, seed, key (0.5); settings page (1.5); flash budget + shake rules (0.5); hexagram on start/pause/death + death screen (1) | **5.5** |
| **D · Own milestones** | bosses (6); water (2.5); electricity (1); surface tree, root tunnels, side-view map (3); hexagram floor inlay (0.5); sky dome (0.5); moss creep (0.5); Lucid glimmer (1); Procrastination, Distraction, Perfectionism, Comparison (1.5 each = 6) | **≈ 21** |

A–C ≈ 33.5 days (Tech's 27 excluded the art itself). Order rule: nothing new that the player sees ships between Phase 0 and B without passing the gallery gate and the meaning test ("nothing must be added again without this finish"). The art skill (`.claude/skills/sotano-art/`) makes that gate mandatory for every proposal that generates art: it links this ledger's guide, the gallery captures, the tests and the checklist (pillars, guarantees, meaning test, §8.1 method for creatures).

---

## 13. Open questions for the owner

Only decisions that are the owner's (taste, story, scope). Each has the debate's recommendation.

| # | Question | Recommendation |
|---|---|---|
| Q1 | **Style name:** "Vessel Light" or "Lantern Clay"? | **Vessel Light** (5 of 6 roles; it names the cosmology) |
| Q2 | **Fonts** are binary OFL files (~80 KB): allowed despite "no image files"? | **Yes**: Pixelify Sans + Atkinson Hyperlegible Next; fallback a generated pixel font |
| Q3 | **Rename materials:** "Bone frame" → "Obsidian frame", "Gilded frame" → "Brass frame"? | **Yes** (bone is gore-adjacent; gold is reserved for the light) |
| Q4 | **Behaviour changes the art proposes:** Doubt's hesitation stop (escape window) and a reach telegraph before contact; Procrastination splitting and leaving a crate; Critic's ✗ decals; Comparison copying shots | Doubt's stop + telegraph **now** (readability, fairness); the rest with each projection's milestone |
| Q5 | **Shards:** stay cosmetic, or become a pickup/currency (the release shard, block shards)? | Cosmetic now; design a use with the Tree-map milestone |
| Q6 | **Tao Te Ching icon:** keep the yin-yang or replace it? | **Replace** with water flowing around a stone (from the text, not a symbol) |
| Q7 | **Add kintsugi** to the lore library as the source of the gold seams? | **Yes** (a craft, not a sacred practice) |
| Q8 | **Hexagram:** show hexagram names (our own gentle wording)? Six lines = six stations? Do changing lines change the run? | Names on start/pause only; stations **yes**; changing-line mechanics designed later with the Tree map |
| Q9 | **Projection → path mapping:** Doubt Mind, Critic Mind, Panic Will, Procrastination Will, Distraction Mind, Perfectionism Body, Comparison Emotion, Resistance Will, Impostor Emotion, Shadow all. Three are Mind | Keep (Mea's reasoning); if variety is wanted, move Doubt to Emotion |
| Q10 | **The Shadow** as your own blocky silhouette with your hands | **Yes** (it is you, not another person; no features but eyes) |
| Q11 | **Skin tone:** ask once at the first start, or only in settings? | Ask once on first start (default `t3` preselected), changeable in settings |
| Q12 | **Floor ↔ element order** (F1 earth, F2 water, F3 air, F4 fire) and **floor-1 lamps unlit until cleared** | **Yes** to both |
| Q13 | **Scope of Phase D** world motifs: the surface tree whose roots are the dungeon's tunnels, and a side-view Tree map | With the Tree-of-Life map milestone, not the art pass |
| Q14 | **Optional bloom** as a "High" quality setting | Later, opt-in; never in review captures |

---

## 14. Owner rulings (accepted)

On 2026-10-26 the owner accepted **every recommendation in §13** without changes. These rulings are binding and supersede any "OWNER" marker above.

| # | Ruling |
|---|---|
| Q1 | Style name: **Vessel Light** |
| Q2 | Fonts: **Pixelify Sans** and **Atkinson Hyperlegible Next** (OFL, self-hosted). Fallback: a generated pixel font |
| Q3 | Renames: "Bone frame" → **Obsidian frame**; "Gilded frame" → **Brass frame** |
| Q4 | Doubt's pause and reach telegraph **now**; other behaviour changes with each projection's milestone |
| Q5 | Shards stay **cosmetic** for now; a use is designed with the Tree-of-Life milestone |
| Q6 | The Tao Te Ching icon is **replaced** with water flowing around a stone |
| Q7 | **Kintsugi** is added to the source library as the origin of the gold seams |
| Q8 | Hexagram names shown on **start and pause** only; six lines = six stations **yes**; changing-line mechanics later |
| Q9 | Projection → path mapping **kept** (Doubt, Lectern and Distraction stay Mind) |
| Q10 | The Shadow is **your own silhouette**, with your hands |
| Q11 | Skin tone asked **once on first start** (t3 preselected), changeable in settings |
| Q12 | Floor order earth, water, air, fire **yes**; floor-1 lamps unlit until the room is cleared **yes** |
| Q13 | Phase D world motifs (surface tree, side-view map) **with the Tree-of-Life milestone** |
| Q14 | Optional bloom as a High setting: **later**; never in review captures |

**Done:** phase 0 (palette, source-scan test at zero, gallery v1) and every phase B/C item that fits today's renderer (ART-GUIDE §15). **Next:** phase A, after the three-party review of its architecture decisions.
