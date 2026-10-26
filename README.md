# SÓTANO

**A first-person roguelite in a fully breakable voxel dungeon, about unlocking your inner potential.** You go down into the basement of your own mind, where reality bends to intention. Break the walls you built, face the projections of what blocks you, pick up practices that change who you are, and find your way back up to the surface.

Inspired by the block worlds of *Minecraft*, the runs and item synergies of *The Binding of Isaac*, and the knowledge-gated secrets of *Noita*. Open source, runs in the browser (WebGL), no install.

> **Status: prototype M1.5.** Four stacked floors you descend by falling through the boss room, rooms sealed while projections (enemies) fight you, Isaac-style hearts, bombs and keys, 27 practices (items) with icons, a clear effect line, quality up to 4 and synergies, and an inventory window. Elements (fire, water, lava, chests, furnaces) are designed and planned, not built yet. Things marked *planned* are design, not code.

---

## Documentation

The full index is [docs/README.md](docs/README.md). By block:

### Design — the game and what it means
- [Game design document](docs/design/DESIGN.md) — pillars, loop, blocks and tiers, the block slot, dungeon structure, the Noita-style hidden world, scope, open questions.
- [Story and metaphor](docs/design/STORY.md) — the premise, what every mechanic stands for, states of being, enemies as projections, practices named after real techniques and works, naming rules.
- [Elements](docs/design/ELEMENTS.md) — fire, water, lava, mud, electricity, burning barrels, furnaces, chests *(planned)*.

### Architecture — how the code works
- [Overview](docs/architecture/OVERVIEW.md) — module map, frame order, core systems, debug console, tests.
- [Items](docs/architecture/ITEMS.md) — the item model, the stat and event contract, synergies and exceptions, safety layers.
- [Rooms and floors](docs/architecture/ROOMS.md) — floor plans, room templates and their rules, doors and keys.
- [Entities](docs/architecture/ENTITIES.md) — stacked floors, health, pickups, bombs, enemies and their navigation.
- [Elements plan](docs/architecture/ELEMENTS.md) — architecture and step-by-step plan for elements and containers.

### Lore — references and cosmology
- [Source library](docs/lore/SOURCES.md) — every book, tradition, technique, therapy and game the work draws on, with naming status and where it shows up.
- [Concept glossary](docs/lore/CONCEPTS.md) — each idea and its expressions in the game.
- [Cosmology](docs/lore/COSMOLOGY.md) — the depth and the surface as mirrors (as above, so below) and the endgame connection.

### Research — background and long-term plan
- [Technical research and proposal](docs/research/TECHNICAL.md) — how Isaac and Noita are built, the target architecture, budgets, IP notes, roadmap.

### Reviews — architecture decisions
- [Items architecture review](docs/reviews/items-architecture.md) and [entities review](docs/reviews/entities.md) — engineer, architect and mediator: critique, ruling, resolution.

### Working on the project
- Project skills (for contributors and AI agents): [docs](.claude/skills/sotano-docs/SKILL.md) (documentation rules), [items](.claude/skills/sotano-items/SKILL.md) (how to build safe, compatible items), [feature](.claude/skills/sotano-feature/SKILL.md) (the production quality bar and the owner's feedback log), [lore](.claude/skills/sotano-lore/SKILL.md) (how references become content).

---

## What you can do

- **Descend a stacked dungeon** — four floors, each 8–11 rooms built from hand-made templates and laid out Isaac-style (start, normal rooms, **treasure**, **boss** and sometimes a locked **vault**). Entering the boss room loads the next floor and opens a hole in the floor: you **fall** into the next one. Floors above remember what you broke. A minimap fills in as you go.
- **Face projections** — Doubt (chases you), the Inner Critic (keeps its distance and lobs judgements) and Panic (rushes you and bursts). They **materialise from the centre of the room**, the doors seal, and they open again when every projection is gone.
- **Survive** — Isaac-style hearts (half-hearts), a moment of invulnerability after each hit, and a death screen when the intention fades.
- **Use bombs ("breakthroughs")** — E drops one; it's a cube with a fuse you can kick, and it chains with other bombs.
- **Open doors by walking up to them** — they slide up like in Doom; gold frames lead to treasure, red ones to the boss, a padlock needs a key.
- **Pick up practices** — from pedestals: they're held up with both hands, and a banner (which stays until you click) tells you what they mean, **what they do** in plain words, where they come from and exactly which stats changed. **Tab** opens the inventory: your practices, their descriptions and inspirations, synergies and states of being with progress, and every stat.
- **Cast intentions** — your shot: straight for a moment, then it drops.
- **Break anything** — every block has a tier, HP and armor; weak shots still do 10%, so everything breaks (except bedrock). Broken blocks drop nothing but themselves.
- **Catch the debris** — broken blocks become cubes that tumble and pile up (thousands, smoothly). Walk over one to pick it up; with your hand full, you kick it. Carry more than one and the next shows in your other hand.
- **Place and throw** — right click places the top block (or throws it if there's nowhere to place it); Q throws it.

### Practices (items)

| Practice | Q | Effect | Inspired by |
|---|---|---|---|
| Stoic Resolve | ★★ | +damage, heavier intentions | Marcus Aurelius; Epictetus |
| Deep Focus | ★★ | ×2 mining, less damage | *Deep Work* (Cal Newport) |
| Kaizen | ★★ | Pierce two soft blocks | Kaizen |
| Habit Stacking | ★★★ | Breaks spread to same-material neighbours | Habit stacking (James Clear; BJ Fogg) |
| Second Brain | ★★★ | Carry one more block | *Building a Second Brain* (Tiago Forte) |
| Exposure | ★★ | Soft blocks shatter on contact | Exposure therapy |
| Symbolic Act | ★★★ | Thrown blocks burst | *Psychomagic* (Jodorowsky); psychodrama |
| Growth Mindset | ★ | Jump much higher | *Mindset* (Carol Dweck) |
| Flow | ★★ | Move and cast faster | *Flow* (Csikszentmihalyi) |
| Visualization | ★ | Intentions fly further and faster | Mental rehearsal |
| Grounding | ★ | Kick twice as hard | Somatic grounding |
| Gratitude Journal | ★ | +luck: cleared rooms reward you more | Gratitude journaling |
| Box Breathing | ★★ | +1 heart, full heal | Box breathing |
| Radical Acceptance | ★★ | Your own bombs don't hurt you | Dialectical Behaviour Therapy |
| Socratic Questioning | ★ | +2 keys; locks sometimes give way | Cognitive behavioural therapy |
| Meditations | ★★★★ | ×3 damage, +2 | Marcus Aurelius (public domain) |
| Self-Reliance | ★★★★ | ×2 fire rate, +damage | Emerson (public domain) |
| Tao Te Ching | ★★★★ | Intentions flow through five blocks of anything | Lao Tzu (public domain) |
| As a Man Thinketh | ★★★★ | ×4 mining, ×1.5 damage | James Allen (public domain) |
| Letters from a Stoic | ★★★★ | +3 carry, ×2 kick and throw, +2 reach | Seneca (public domain) |
| Satori | ★★★★ | A little more of everything | Zen |
| Forgiveness | ★★★ | Projections that touch you are hurt; half their hits ignored | *A Course in Miracles* |
| Nothing Personal | ★★ | Two in three contact hits do nothing | *The Four Agreements* (don Miguel Ruiz) |
| Systemic Constellation | ★★★ | Projections spawn weaker and slower | Family and systemic constellations |
| Art Therapy | ★★ | Placing blocks may heal you | Art therapy |
| Thinking, Waiting, Fasting | ★★ | Range, longer recovery, luck | *Siddhartha* (Hesse) |
| Follow the Omens | ★★ | Luck; every cleared room leaves a reward | *The Alchemist* (Coelho) |

Every practice has a meaning (its description) and a plain **effect** line with numbers. Synergies: **Somatic Release**, **Compound Effect**, **Flooding**, and four **states of being** (Embodied, Lucid, Open-hearted, Resolute) for holding three practices of the same path. Details: [STORY.md §5](docs/design/STORY.md#5-items-practices-with-real-names).

## Controls

| Action | Input |
|---|---|
| Look | Mouse (click anywhere to capture it; Esc releases it and pauses) |
| Move · jump | WASD · Space |
| Cast intentions | Left click (hold) |
| Pick up a block | Walk over it with room in your hand |
| Kick a block or a bomb | Walk into it (blocks: with your hand full) |
| Place the top block | Right click (throws it if there's nowhere to place it) |
| Throw the top block | Q |
| Drop a bomb | E |
| Open a door | Walk up to it (locked doors use a key) |
| Inventory and stats | Tab (or I) |
| New run | R |

Touch controls are *planned*.

## Run it locally

Requires Node 20+.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5174. Add `?seed=42` to the URL for a specific seed.

| Script | What it does |
|---|---|
| `npm test` | Unit tests (Vitest), including the synergy matrix |
| `npm run typecheck` | TypeScript, no emit |
| `npm run build` | Typecheck + production build into `dist/` |
| `npm run preview` | Serve the production build |

### Debug console

Open the browser console and use `S`:

```js
S.items                 // every item id
S.give('taoteching')    // gain a practice (banner, hold-up, flash)
S.give('exposure'); S.give('habitstack')
S.synergies()           // ['flooding']
S.hooks()               // every hook per event, in run order
S.god()                 // invulnerable
S.bombs(5); S.keys(2)   // counters
S.floor()               // open the hole and drop to the next floor
S.enemies()             // live projections
S.restart(7)            // new run with seed 7
```

The full list is in [docs/architecture/OVERVIEW.md](docs/architecture/OVERVIEW.md#debug-console).

## How it's built

| Piece | Choice |
|---|---|
| Language | TypeScript (strict) |
| Build | Vite |
| Rendering | three.js, chunked voxel meshes built in a Web Worker, baked ambient occlusion, all loose cubes in one instanced mesh |
| Physics | All custom: box-vs-grid for the player and enemies, DDA raycasts for intentions, typed-array cube physics with stacking (2000 cubes ≈ 4 ms/frame) |
| Enemies | Data + behaviour factories, per-room flow-field navigation |
| Art | Pixel-art textures and item icons generated at runtime: no image files |
| Audio | Synthesised with WebAudio: no sound files |
| Tests | Vitest: rules, generation, physics, items, a 378-combination synergy matrix and a contract test |
| Hosting | Static site (Vercel) |

The core idea, borrowed from how Isaac is built: **items don't call into the game; the game emits events and items hook into them.** Anything an item might want to change reads a stat or emits an event (a test enforces it). Stats are recomputed from layered modifiers, damage goes through one pipeline, chain reactions are deferred and budgeted, exceptions between items live in one file, and five safety layers keep powerful items from breaking the game. Key designs go through an architect and a mediator review before being built.

```
src/
  core/      events, RNG, stats, damage                 (no three.js, no DOM)
  items/     item machinery: types, inventory, pools, validation
  enemies/   enemy types, behaviour factories, flow field
  content/   materials, room templates, items, synergies, enemies (data)
  world/     voxel storage, floor plan, stacked dungeon, mesher + worker
  physics/   raycast, voxel collision, loose cubes and bombs
  combat/    intentions
  entities/  player, doors, pickups, enemies
  render/    atlas, icons, chunks, hands, debris, cracks, particles
  game/      event catalogue, HUD, game loop
tests/       Vitest suites
docs/        design, architecture, research, reviews
```

## Roadmap

| Milestone | Goal |
|---|---|
| **M0 — Toy** ✔ | One breakable room; cast, break, pick up, kick, place, throw |
| **M1 — One floor** ✔ | Generated floors from templates, doors and keys, treasure/boss/vault rooms, items and synergies, minimap |
| **M1.5 — Combat and depth** ✔ | Stacked floors descended by falling, projections with flow-field navigation, health, bombs, inventory window, quality-4 practices, item safety layers |
| E — Elements | Chests (keys move there), fire and burning barrels, water, lava, mud and sand, furnaces, electricity ([plan](docs/architecture/ELEMENTS.md)) |
| M2 — Synergies | Projectile behaviours, weapon types, enemy-owned hooks, more projections, bosses made of breakable voxels |
| M4 — The climb | Special blocks and practices to get back up; save runs |
| M5 — Secrets | Hidden pockets, side biomes, seed-dependent recipes, meta-progression |

## Contributing

Early days, but welcome. Before opening a PR:

```bash
npm run typecheck && npm test
```

- Comments, docs and identifiers in **English**; follow the [project skills](.claude/skills/).
- Content (materials, items, rooms, enemies) is data in `src/content/`; prefer adding data and hooks over special cases in the game loop.
- If you change behaviour, update the matching doc in `docs/` in the same PR.
- **No third-party game assets or names.** No Mojang textures/sounds/mob names, no Isaac item or character names; practices use generic technique names or public-domain works, and credit modern works only as inspiration.

## License

Not chosen yet. The proposal is MIT for code and CC BY 4.0 (or BY-SA) for original art and sound — see [docs/research/TECHNICAL.md §14](docs/research/TECHNICAL.md#14-open-source-and-intellectual-property-important).

## Credits

Born from a voxel gift game made for a friend who finished *The Binding of Isaac*. Inspired by *Minecraft* (Mojang), *The Binding of Isaac* (Edmund McMillen / Nicalis) and *Noita* (Nolla Games). Practices are inspired by the works and techniques credited in the [source library](docs/lore/SOURCES.md). SÓTANO is not affiliated with or endorsed by any of them.
