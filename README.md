# SÓTANO

**A first-person roguelite in a fully breakable voxel dungeon, about unlocking your inner potential.**

<p align="center">
  <a href="https://sotano-yeagobs-projects.vercel.app"><b>▶ PLAY IN YOUR BROWSER</b></a><br>
  <a href="https://sotano-yeagobs-projects.vercel.app">https://sotano-yeagobs-projects.vercel.app</a><br>
  <sub>No install. Desktop browser with a keyboard and mouse. Runs on WebGL.</sub>
</p>

---

## What it is

You go down into the basement of your own mind, where reality bends to intention. Every wall is something you built to stay safe and that now keeps you small. Every creature is a pattern that stops you from going after what you want. Every item is a practice that people have used to grow, and picking it up changes not only what you can do, but **who you are**.

The goal isn't to stay down there. It's to dig your way back up to the surface, changed, and live from there.

Inspired by the block worlds of *Minecraft*, the runs and item synergies of *The Binding of Isaac*, and the knowledge-gated secrets of *Noita*.

> **Status: prototype M1.5.** Ten stacked floors you descend by falling through each boss room, sealed rooms full of projections, hearts, bombs and keys, 30 practices with synergies and states of being, and an inventory window. Fire, water and lava are built; chests, furnaces and the climb back up are planned. Things marked *planned* are design, not code.

---

## The concept

SÓTANO is a game about a person unlocking their inner potential through **intention**. The dungeon, the blocks, the enemies, the items, the way down and the way back up are all a metaphor for that process.

| In the game | What it stands for |
|---|---|
| **Intentions** (your shot) | Focused will: they fly straight while you hold your focus, then drop if you don't follow through |
| **Breaking blocks** | Dismantling a limiting structure: a belief, a habit, an avoidance |
| **Block tiers** | How deep a limitation runs: dirt is a passing excuse, obsidian is a belief from childhood |
| **Loose cubes you carry** | What you dismantle becomes material to build with |
| **Going down** | Going inward: introspection, shadow work |
| **Coming back up** | Integration: bringing what you learned into daily life |
| **Keys** | Insights, found by breaking through something |
| **Bombs** | Breakthroughs: rare, powerful, and dangerous if you're careless |
| **Hearts** | Resilience and self-worth; patterns take them, care restores them |
| **Bosses** | The big, old patterns behind the small ones, made of the same blocks as everything else |
| **The surface** | Life after the change: the next layer of the game |

The descent-and-return shape is the classic hero's journey. The "basement of your own mind" echoes Jung's descent into the unconscious. Neither is named in the game; they are its skeleton.

### You are a state of being, not a collection of gear

Items are **practices**, and each one moves the person along one of four paths:

| Path | What it develops | Practices (examples) |
|---|---|---|
| **Body** | Presence, energy, nervous-system regulation | Grounding, Box Breathing, Flow |
| **Mind** | Clarity, focus, belief | Deep Focus, Visualization, Growth Mindset |
| **Emotion** | Feeling instead of avoiding; release; compassion | Exposure, Gratitude Journal, Radical Acceptance |
| **Will** | Consistency, discipline, small steps compounding | Kaizen, Habit Stacking, Stoic Resolve |

Hold **three practices of the same path** and you reach a **state of being** (Embodied, Lucid, Open-hearted or Resolute): a bigger change you can see and feel.

### Enemies are projections, not monsters

Enemies are **mental projections** of the patterns that stop people going after their goals, given a body made of the same cubes as the walls. They are always patterns, never people or diagnoses. Each one behaves like the pattern it stands for, so the mechanic teaches the metaphor without a word of text:

- **Doubt** walks at you, stops to reconsider, and reaches for you before its touch can hurt. Slow, persistent, easy to outpace if you keep moving.
- **The Inner Critic** keeps its distance and lobs judgements in arcs. Dangerous when you stand still.
- **Panic** rushes you, swells in three steps and **bursts**, breaking the blocks around it. Destructive, but it also opens paths.

Rooms work like Isaac's: doors stand open while a room holds no projections; when you enter one that does, they seal and the projections materialise from the centre of the room, and they open again by themselves when every projection is gone. A breakthrough destroys a door for good. Some floors keep a challenge room: three waves every time you walk in, harder each time, as often as you like. Projections come from inside you, not from outside.

### Practices are real, and credited

Practices are named after **techniques and concepts** people use to grow: Kaizen, Exposure, Box Breathing, Deep Focus, Habit Stacking, and titles of public-domain works such as Marcus Aurelius' *Meditations*, Seneca's *Letters*, Lao Tzu's *Tao Te Ching*, Emerson's *Self-Reliance* and James Allen's *As a Man Thinketh*. Modern books, courses and branded methods are credited as inspiration in each item's description, never used as a name. Practices aren't magic cures, and therapies aren't jokes.

The full story, metaphors and naming rules are in [Story and metaphor](docs/design/STORY.md). The references behind everything are in the [source library](docs/lore/SOURCES.md).

### A love letter to games

SÓTANO is made by people who grew up inside games, and the project is full of small winks at them: a phrase that echoes a famous line, a mechanic that feels like an old friend. Winks, never copies: no names, assets, music or trademarks from other games. Every wink must still mean something in the story. A humble mushroom that makes you jump higher and break bricks with your head is one of them.

---

## Controls

Three complete schemes; the game follows whichever device you used last (details: [docs/architecture/input/](docs/architecture/input/README.md)).

| Action | Keyboard and mouse | Gamepad | Touch (landscape) |
|---|---|---|---|
| Look | Mouse (click to capture it; **Esc** releases it and pauses) | Right stick | Drag on the right |
| Move | **WASD** | Left stick | Left thumb (floating stick) |
| Jump (hold to swim up) | **Space** | **A** | The arrow |
| Cast intentions | **Left click** (hold) | **RT** (hold) | The bead of light (hold; drag to aim) |
| Switch the intention's polarity: positive mends projections into allies, negative harms them and your allies and is the only one that breaks blocks | **F** | **LB** | Double tap the bead of light |
| Pick up a block | Walk over it with room in your hand | same | same |
| Kick a block or a bomb | Walk into it (blocks: with your hand full) | same | same |
| Place the top block (throws it if there's nowhere to place it) | **Right click** | **LT** | The block with an arrow |
| Throw the top block | **Q** | **B** | The flying block |
| Drop a bomb | **E** | **RB** | The seed |
| Open a door | Doors open by themselves when there are no projections; locked ones open with a key; a breakthrough destroys any door | same | same |
| Inventory and stats | **Tab** (or **I**) | **Y** (d-pad moves, **B** closes) | The grid (top) |
| Pause | **Esc** | **Menu** | The two bars (top) |
| New run | **R** | **View** (paused or dead) | "New run" on the pause card |

Language: English or Spanish, picked from your browser. Switch it on the pause card (it's remembered) or with `?lang=es` in the URL.

---

## Quickstart

### Play it

Open **[sotano-yeagobs-projects.vercel.app](https://sotano-yeagobs-projects.vercel.app)** and click the screen. That's it.

Every run gets a fresh seed, shown as `ABCD EFGH` on the pause, inventory and death screens. Share a run by adding `?seed=ABCD-EFGH` to the URL: it replays exactly.

### Run it locally

Requires **Node 20+**.

```bash
git clone https://github.com/yeagob/sotano.git
cd sotano
npm install
npm run dev
```

Then open **http://localhost:5174**.

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm test` | Unit tests (Vitest), including a 378-combination synergy matrix |
| `npm run typecheck` | TypeScript, no emit |
| `npm run build` | Typecheck and production build into `dist/` |
| `npm run preview` | Serve the production build locally |

### Debug console

**F3** toggles the debug readout. **`?gallery`** opens the art review page. In the browser console, the `S` object gives you tools:

```js
S.give('taoteching')    // gain a practice
S.god()                 // invulnerable
S.bombs(5); S.keys(2)   // counters
S.floor()               // drop to the next floor
S.enemies()             // live projections
S.seed()                // this run's seed code
S.restart('ABCD-EFGH')  // replay a seed
```

The full list is in [docs/architecture/OVERVIEW.md](docs/architecture/OVERVIEW.md#debug-console). For testing, `?sandbox` opens a creative room and `npm run sandbox` runs scripted scenarios headless ([docs/architecture/SANDBOX.md](docs/architecture/SANDBOX.md)).

---

## What's in the game today

- **A stacked dungeon of ten floors.** The roots (floor 0) are a friend with every door open and a lesson in each room. Then nine circles, each built from hand-made room templates and laid out Isaac-style: start, normal rooms, treasure, boss and sometimes a locked vault. Beating a boss reveals its practice and cracks a hole in the floor: you fall into the next one. A minimap fills in as you go.
- **Projections** that seal the room and fight you: Doubt, the Inner Critic and Panic, with more planned (Procrastination, Distraction, Perfectionism, Comparison).
- **Survival** with Isaac-style hearts drawn in quarters, invulnerability frames after each hit and a death screen when the intention fades.
- **Elements.** Water to wade or drown in, lava to keep away from, fire that eats crates. Water on lava makes obsidian. Each projection reacts to elements in its own way: Panic calms in water and goes off in fire.
- **Practices and synergies.** Thirty practices from quality 1 to 4, with a clear effect line on every pickup. Synergies such as **Somatic Release**, **Compound Effect** and **Flooding**, plus the four states of being.
- **Unique runs.** Layouts, room moods, rewards and projections all come from the seed.

The full catalogue is in [STORY.md §5](docs/design/STORY.md#5-items-practices-with-real-names).

---

## How it's built

| Piece | Choice |
|---|---|
| Language | TypeScript (strict) |
| Build | Vite |
| Rendering | three.js, chunked voxel meshes built in a Web Worker, baked ambient occlusion, loose cubes in one instanced mesh |
| Physics | All custom: box-vs-grid for the player and enemies, DDA raycasts for intentions, typed-array cube physics with stacking |
| Art and audio | Pixel-art textures and icons generated at runtime, and sound synthesised with WebAudio. No image or sound files |
| Randomness | Seed codes with checksum, deterministic structure, weighted tables |
| Hosting | Static site on Vercel |

The core idea: **items don't call into the game; the game emits events and items hook into them.** Stats are recomputed from layered modifiers, damage goes through one pipeline, and safety layers keep powerful items from breaking the game. Key decisions go through an engineer, architect and mediator review before they are built.

```
src/
  core/      events, RNG, stats, damage          (no three.js, no DOM)
  items/     item machinery: types, inventory, pools, validation
  enemies/   enemy types, behaviour factories, flow field
  content/   materials, rooms, items, synergies, enemies (data)
  world/     voxel storage, floor plans, stacked dungeon, mesher + worker
  physics/   raycast, voxel collision, loose cubes and bombs
  combat/    intentions
  entities/  player, doors, pickups, enemies
  render/    atlas, icons, chunks, hands, debris, particles
  game/      event catalogue, HUD, game loop
tests/       Vitest suites
docs/        design, architecture, lore, art, reviews
```

---

## Roadmap

| Milestone | Goal |
|---|---|
| **M0 — Toy** ✔ | One breakable room: cast, break, pick up, kick, place, throw |
| **M1 — One floor** ✔ | Generated floors from templates, doors and keys, treasure, boss and vault rooms, items, synergies, minimap |
| **M1.5 — Combat and depth** ✔ | Stacked floors descended by falling, projections with navigation, health, bombs, inventory, quality-4 practices |
| **E — Elements** | Chests, fire and burning barrels, water, lava, mud and sand, furnaces, electricity ([plan](docs/architecture/ELEMENTS.md)) |
| **M2 — Synergies** | Projectile behaviours, weapon types, more projections, bosses made of breakable voxels |
| **M4 — The climb** | Special blocks and practices to get back up; save runs |
| **M5 — Secrets** | Hidden pockets, side biomes, seed-dependent recipes, meta-progression |

---

## Documentation

The full index is [docs/README.md](docs/README.md). By block:

**Design: the game and what it means**
- [Game design document](docs/design/DESIGN.md): pillars, loop, blocks and tiers, dungeon structure, scope, open questions.
- [Bestiary](docs/design/BESTIARY.md) — projections by zone and lineage, bosses by zone, living creatures and presences you can talk to, seals, omens and waves *(design)*.
- [Story and metaphor](docs/design/STORY.md): premise, mechanics as metaphor, states of being, enemies as projections, naming rules.
- [Elements](docs/design/ELEMENTS.md): fire, water and lava *(built)*; mud, electricity, furnaces, chests *(planned)*.
- [Levels](docs/design/LEVELS.md): the thirteen floors *(direction)*, rooms with height and element rooms *(built)*.
- [Stations, props and zones](docs/design/STATIONS.md): kitchen, forge, laboratory, garden and how they help you climb *(ideas)*.

**Architecture: how the code works**
- [Overview](docs/architecture/OVERVIEW.md): module map, frame order, core systems, debug console, tests.
- [Items](docs/architecture/ITEMS.md): the item model, the stat and event contract, synergies, safety layers.
- [Rooms and floors](docs/architecture/ROOMS.md): floor plans, room templates, doors and keys.
- [Entities](docs/architecture/ENTITIES.md): stacked floors, health, pickups, bombs, enemies and navigation.
- [Actors and factions](docs/architecture/ACTORS.md): the player and projections as actors, one damage pipeline.
- [Seeds and randomness](docs/architecture/RNG.md): seed codes, structure and runtime randomness, weighted tables.
- [Localization](docs/architecture/LOCALIZATION.md): English and Spanish, catalogs, live language switching.
- [Elements](docs/architecture/ELEMENTS.md): the element layer, reactions, rendering and the plan for containers.
- [Sandbox and lab](docs/architecture/SANDBOX.md): a creative room for testing, and deterministic scripted runs with text reports.

**Lore: references and cosmology**
- [Source library](docs/lore/SOURCES.md): every book, tradition, technique, therapy and game the work draws on.
- [Concept glossary](docs/lore/CONCEPTS.md): each idea and where it shows up in the game.
- [Cosmology](docs/lore/COSMOLOGY.md): the depth and the surface as mirrors (as above, so below), and the endgame.

**Research and reviews**
- [Technical research and proposal](docs/research/TECHNICAL.md): how Isaac and Noita are built, the target architecture, roadmap.
- [Architecture reviews](docs/reviews/README.md): engineer, architect and mediator reviews of key decisions.

---

## Contributing

Early days, but welcome. Before opening a pull request:

```bash
npm run typecheck && npm test
```

- Comments, docs and identifiers are in **English**. Follow the [project skills](.claude/skills/).
- Content (materials, items, rooms, enemies) is data in `src/content/`. Prefer adding data and hooks over special cases in the game loop.
- Player-facing text lives in `src/i18n/` in every shipped language.
- If you change behaviour, update the matching doc in `docs/` in the same change.
- **No third-party game assets or names.** Practices use generic technique names or public-domain works, and credit modern works only as inspiration.

---

## License

Not chosen yet. The proposal is MIT for code and CC BY 4.0 (or BY-SA) for original art and sound. See [docs/research/TECHNICAL.md §14](docs/research/TECHNICAL.md#14-open-source-and-intellectual-property-important).

## Credits

Born from a voxel gift game made for a friend who finished *The Binding of Isaac*. Inspired by *Minecraft* (Mojang), *The Binding of Isaac* (Edmund McMillen / Nicalis) and *Noita* (Nolla Games). Practices draw on the works and techniques credited in the [source library](docs/lore/SOURCES.md). SÓTANO is not affiliated with or endorsed by any of them.
