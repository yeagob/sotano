# Elements, materials and containers (design)

Status: **fire, water and lava are built** (wading, swimming, breath, burning, flows, water + lava → obsidian, crates that catch, projections that react); mud, sand, electricity, furnaces and barrels are still design; **chests are built in a first form** (unbreakable blocks opened by walking up and spending keys: [CHESTS.md](CHESTS.md)); storing things inside them remains design. How it works and what each projection does in each element: [../architecture/ELEMENTS.md](../architecture/ELEMENTS.md) §10.

The owner's brief (translated): *inspired by Noita and Minecraft: flammable materials affected by fire; water, and everything about moving through it (one block deep you can wade, slower; two deep and you lose your footing); water and fire interacting; lava; other liquids; materials affected in different ways by electricity, fire and lava; mud (sand + water); blocks that transform and, above all, can be destroyed; flammable blocks that burn; burning barrels you can throw blocks into to destroy them; furnaces in some rooms where stone becomes something else; chests you can put things into, not only take valuables out of. Breaking blocks no longer drops keys or items: those live in chests. More Minecraft.*

## 1. Why this fits SÓTANO

Everything in the dungeon is matter, and the game is about transforming what blocks you (see [STORY.md](STORY.md)). Elements give that transformation more verbs than "break": **burn, soak, melt, harden, refine, store**. They also give the Noita layer what it needs: systems that interact in ways the player discovers, not ones the game explains.

| Element | What it stands for | Why it fits |
|---|---|---|
| **Fire** | Passion, anger, transformation | It clears what no longer serves you, and it spreads out of control if you aren't careful |
| **Water** | Emotion | You can wade through shallow feelings (slowly); in deep ones you lose your footing and can drown unless you've learned to swim |
| **Lava** | Old pain | Dangerous to touch. When emotion (water) meets it, it hardens into obsidian: a new boundary, the toughest block in the game |
| **Mud** | Feeling stuck | Earth and emotion mixed: slows you, swallows kicks. Heat dries it back into something solid (brick) |
| **Electricity** | Insight, sudden energy | A flash that runs through anything conductive (metal, water) all at once |
| **Furnace** | Deliberate practice, refining | Raw material in, something better out, if you feed it fuel and time |
| **Burning barrel** | Letting go | Throw a block in and it's gone, like burning a letter |
| **Chest** | Memory, what you choose to keep | Holds treasures you find, and whatever you decide to put away |

## 2. Rules the player can learn

### Materials get properties

Every material declares (as data) how it reacts. Existing and new materials:

| Material | Flammable | Conducts | Fluid behaviour | Gravity | Other |
|---|---|---|---|---|---|
| Dirt | — | — | becomes **mud** when wet | — | — |
| Grass | burns away to dirt | — | — | — | — |
| Stone, brick | — | — | — | — | smelts in a furnace |
| Deepstone | — | — | — | — | melts in lava (slowly) |
| Iron ore | — | **yes** | — | — | smelts to **iron** |
| Crate (wood) | **yes** | — | floats | — | fuel for furnaces |
| Obsidian | — | — | — | — | made by water + lava |
| **Sand** *(new)* | — | — | becomes mud when wet | **falls** | smelts to **glass**; lightning makes glass |
| **Mud** *(new)* | — | weakly | — | — | slows you; dries to **brick** with heat |
| **Glass** *(new)* | — | — | — | — | fragile: shatters, no cube |
| **Iron** *(new)* | — | **yes** | sinks | — | heavy; conducts |
| **Coal** *(new)* | **yes, long** | — | — | — | best fuel |
| **Barrel** *(new)* | lit = fire source | — | — | — | destroys cubes thrown in |
| **Furnace** *(new)* | — | — | — | — | block entity: fuel + input → output |
| **Chest** *(new)* | — | — | — | — | block entity: storage |
| **Water**, **Lava** *(new fluids)* | lava ignites | water conducts | flow | — | see below |

### Fire

- **Sources**: lit barrels, lava, explosions (chance), some intentions (items), Panic's burst, electricity on flammables.
- A **burning block** keeps burning for a few seconds, spreads to flammable neighbours with a chance each tick, and then **breaks** (crates and coal leave nothing; grass becomes dirt).
- **Burning loose cubes**: a flammable cube that touches fire burns for a while (you can kick or throw it, spreading fire!) and is destroyed when it burns out.
- **Fire hurts**: standing in or touching fire costs half a heart (with the usual invulnerability); enemies burn too.
- **Water puts fire out** (a burning block next to water stops burning; a burning cube that falls in water goes out).

### Water

- Fluids have **levels** (1–8 per block, 8 = full), like Minecraft and Noita: they flow down first, then spread sideways and even out. Water is **finite**: dig into a flooded pocket and it drains down into the rooms below.
- **Moving through water** (the owner's rule):
  - **Feet in water, head out** (one block deep): you **wade**, slower (about 60% speed), jumps are lower.
  - **Head under water** (two or more deep): you **lose your footing** and swim: you sink slowly, Space swims up, movement is floaty. A **breath meter** appears; when it runs out you start losing half-hearts.
- **Cubes in water**: wood floats, stone and iron sink slowly. Water slows everything that moves through it (cubes, intentions, enemies).
- **Dirt or sand touching water** becomes **mud** over time.
- **Electricity** in water spreads through the whole body of water: anything in it gets shocked.

### Lava

- Flows slower than water, lights flammable blocks and cubes it touches, and destroys loose cubes that fall in (except obsidian).
- **Touching lava** hurts a lot (a full heart per second) and sets you on fire for a moment.
- **Water meets lava**: where water flows onto lava it turns into **obsidian** (lava source) or **stone** (flowing lava), with a hiss of steam. This is how you make a bridge over a lava lake.
- Lava glows: it lights its surroundings.

### Mud

- Made by water + dirt or sand. Slows movement a lot (about 40%), kicks are weak, intentions sink in (no ricochet).
- Heat (fire nearby, or a furnace) dries it into **brick**.

### Sand

- Falls when nothing is under it (gravity block, Minecraft-style), becoming a loose cube until it lands.
- Furnace → **glass**. Lightning on sand → glass.

### Electricity

- **Sources**: future items (an "insight" intention), electric enemies, charged blocks in some rooms.
- A charge runs **instantly** through connected conductive blocks (iron, ore, water, wet mud), up to a limit, and hurts anything touching them (stun + damage).
- Turns sand into glass, lights flammables, can power furnaces (later: doors, mechanisms).

### Burning barrels

- Placed by room templates, always lit. **Any loose cube thrown, kicked or dropped into one is destroyed** (flammable ones flare up). It's a way to get rid of things for good, and a fire source for spreading flames on purpose.
- Barrels can be knocked over by explosions, spilling fire.

### Furnaces

- Found in some rooms (a template marker). A furnace has a **fuel** slot and an **input** slot.
- Throw or place a cube into its mouth (right click on its face, or throw it in): flammable cubes go to fuel, others to input.
- With fuel and a smeltable input, after a few seconds it **ejects the result** as a loose cube:

| Input | Output |
|---|---|
| Stone | Brick |
| Deepstone | Stone (refined), sometimes iron |
| Sand | Glass |
| Iron ore | Iron |
| Dirt | Brick (clay) |
| Mud | Brick |
| Crate | Coal |

- Fuel: crates burn for one smelt, coal for four.
- If you put something it can't smelt, it **stores** it (it pops back out when you take it, like a small chest). That satisfies the "at least store it" part of the brief.

### Chests

> **Built so far** (see [CHESTS.md](CHESTS.md)): unbreakable chest blocks on every floor, free or costing 1–3 keys, holding shut practices and loot; opened by walking up (not F). The rest below (storing blocks, per-run memory, the F key) is still design.

- **Where keys and treasures live now.** Rooms get chests from their templates; some are in the open, some hidden in the rock.
- **Opening**: walk up and press **F** (use). It opens with an animation and its contents pop out as pickups (keys, bombs, hearts), or as loose cubes. Rarely a practice (item) from a `chest` pool.
- **Locked chests** (gold) need a key and contain better things.
- **Putting things in**: with the chest open, right click on it puts the top block of your hand inside; F with an empty hand takes the last one out. Chests remember their contents for the whole run (floors above keep their state).
- Chests are **breakable** (they're blocks): breaking one spills everything inside.

### Breaking blocks

- **Nothing drops from breaking blocks except the block itself** (no keys, bombs, hearts or items). Rewards come from **chests**, **cleared rooms** and **pedestals**.

## 3. How it connects to items and enemies

Everything above goes through events, so practices and projections can change it:

- Practices: *Breathwork* (longer breath), *Swimming lessons* ("Flow" variants), *Fire walking* (immune to fire), *Cold exposure* (extinguish what you touch), *Alchemy* (better furnace results), *Insight* (electric intentions), *Grounding* (immune to shocks).
- Projections: **Burnout** (a fire enemy that leaves burning cubes), **Overwhelm** (lurks in deep water, pulls you down), **Stagnation** (made of mud, slows you on touch), **Spark** (an electric skitterer that charges metal).

## 4. Open questions for the owner

1. **Room-clear rewards**: should clearing a room still drop a heart/bomb/key now and then (Isaac), or should every reward come from chests? (Current build: clearing still rewards, luck makes it likelier.)
2. **Water volume**: finite (Noita: dig into a pocket and it drains down the floors) or infinite sources (Minecraft)? (Recommendation: finite. It makes digging matter and it's cheaper to simulate.)
3. **Chest contents UI**: pop-out-as-pickups (fast, no menus, fits one-block carry) or a small Minecraft-style grid? (Recommendation: pop-out, no menus.)
4. **Breath and drowning**: is losing hearts underwater too punishing for the metaphor? (Recommendation: yes to drowning, but slow, with a clear meter.)
