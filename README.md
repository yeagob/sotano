# SÓTANO

**A first-person roguelite in a fully breakable voxel dungeon.** Go down floor by floor, find items that rewrite the rules and combine with each other, then dig and build your own way back up to the surface.

Inspired by the block worlds of *Minecraft*, the runs and item synergies of *The Binding of Isaac*, and the knowledge-gated secrets of *Noita*. Open source, runs in the browser (WebGL), no install.

> **Status: prototype M1.** A whole generated floor of connected rooms, Doom-style doors and keys, a treasure room that gives you a random item, a boss room (no boss yet) with a trapdoor to the next floor, and 11 items that change how you shoot, move, carry, kick, throw and break things. No enemies yet. Things marked *planned* are design, not code.

---

## What you can do in M1

- **Explore a generated floor** — 8 to 11 rooms built from hand-made templates, laid out Isaac-style: a start room, normal rooms, a **treasure room**, a **boss room** at the far end and sometimes a **locked vault**. A minimap fills in as you go.
- **Open doors by walking up to them** — they slide up into the ceiling like in Doom. Gold frames lead to treasure, red ones to the boss. The vault's padlocked door needs the **key** hidden somewhere on the floor.
- **Grab an item** from the treasure room pedestal: a banner tells you what it is and exactly which stats it changed. **Tab** shows all your stats, items and active synergies.
- **Cast intentions** — your shot. They fly straight for a moment, then drop under gravity.
- **Break anything** — every block has a tier, HP and armor. Weak shots still do at least 10% damage, so everything breaks eventually (except bedrock).
- **Catch the debris** — broken blocks become cubes that tumble, pile up and settle (thousands of them, smoothly). Walk over one to pick it up; with your hand full, you **kick** it instead.
- **Place and throw** — put the top block of your hand on any face you look at; right click with nowhere to place it (or Q) throws it.
- **Take the trapdoor** in the boss room down to a new floor, keeping your items.
- **Dig out** — floors sit inside solid rock with open sky above.

### Items in the pool

| Item | Effect |
|---|---|
| Leaden Intent | +damage, bigger intentions that drop hard |
| Miner's Intent | ×2 mining, a bit less damage |
| Drill | Intentions keep going through two soft blocks |
| Chain Reaction | Breaking a block damages its same-material neighbours |
| Builder's Hands | Carry one more block |
| Bulldozer | Soft blocks shatter when you walk into them |
| Volatile Grip | Thrown blocks explode on impact |
| Spring Heels | Jump much higher |
| Quick Feet | Faster movement and casting |
| Far Sight | Intentions fly further and faster |
| Lead Boots | Kick blocks twice as hard |

Synergies: **Demolition Kick** (Volatile Grip + Lead Boots: kicked blocks explode), **Tunnel Bore** (Drill + Miner's Intent: drill through stone and brick), **Wrecking Ball** (Bulldozer + Chain Reaction).

## Controls

| Action | Input |
|---|---|
| Look | Mouse (click anywhere to capture it; Esc releases it and pauses) |
| Move · jump | WASD · Space |
| Cast intentions | Left click (hold) |
| Pick up a block | Walk over it with room in your hand |
| Kick a block | Walk into it with your hand full |
| Place the top block | Right click (throws it if there's nowhere to place it) |
| Throw the top block | Q |
| Open a door | Walk up to it (locked doors use a key) |
| Stats and items | Tab (or I) |
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

Other scripts:

| Script | What it does |
|---|---|
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | TypeScript, no emit |
| `npm run build` | Typecheck + production build into `dist/` |
| `npm run preview` | Serve the production build |

### Debug console

Open the browser console and use `S`:

```js
S.items              // every item id
S.give('bulldozer')  // gain an item (the banner shows what changed)
S.give('chain')      // ...and its synergy switches on
S.synergies()        // ['wrecking_ball']
S.hooks()            // every hook per event, in run order: for debugging interactions
S.stats()            // current computed stats
S.hold('obsidian')   // put blocks in your hand
S.keys(1)            // add a key
S.floor()            // go down to the next floor
S.restart(7)         // new run with seed 7
```

The full list is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#debug-console).

## How it's built

| Piece | Choice |
|---|---|
| Language | TypeScript (strict) |
| Build | Vite |
| Rendering | three.js, chunked voxel meshes built in a Web Worker, baked ambient occlusion, all loose cubes in one instanced mesh |
| Physics | All custom: box-vs-grid for the player, DDA raycasts for intentions, typed-array cube physics with stacking for loose blocks (2000 cubes ≈ 4 ms/frame) |
| Art | Pixel-art textures generated at runtime: no image files |
| Audio | Synthesised with WebAudio: no sound files |
| Tests | Vitest |
| Hosting | Static site (Vercel) |

The core idea, borrowed from how Isaac is built: **items don't call into the game, the game emits events and items hook into them.** Anything an item might want to change reads a stat or emits an event (a test enforces it): shooting, moving, jumping, how many blocks you carry, what touching a cube or a block does, kicks, throws, impacts, doors. Stats are recomputed from layered modifiers, damage goes through one pipeline, chain reactions are deferred and budgeted, and every exception between two items lives in one file (`src/content/synergies.ts`). The design was reviewed by an architect and a mediator before being built: see [docs/reviews/items-architecture.md](docs/reviews/items-architecture.md).

```
src/
  core/      events, RNG, stats, damage                (no three.js, no DOM)
  items/     item machinery: types, inventory, pools
  content/   materials, room templates, items (one file each), synergies (data)
  world/     voxel storage, floor plan, floor builder, mesher + worker
  physics/   raycast, voxel collision, loose-cube physics
  combat/    intentions
  entities/  player, doors, pickups
  render/    atlas, chunks, hands, debris, cracks, particles
  game/      event catalogue, HUD, game loop
tests/       Vitest suites
docs/        design, technical proposal, architecture
```

## Documentation

- [docs/DESIGN.md](docs/DESIGN.md) — the game: pillars, loop, blocks and tiers, the one-block slot, dungeon structure, enemies, items, the Noita-style hidden world, open questions.
- [docs/TECHNICAL.md](docs/TECHNICAL.md) — research into how Isaac and Noita are built, the target architecture, budgets, IP notes and the roadmap.
- [docs/ITEMS.md](docs/ITEMS.md) — how items and synergies are defined, stored and installed, the full list of stats and events they can change, and how to fix an exception between two items.
- [docs/ROOMS.md](docs/ROOMS.md) — floor plans, the room template format and its rules, doors and keys, how to add a template.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the current code is organised, frame by frame.
- [docs/reviews/](docs/reviews) — architecture reviews (critique, ruling, resolution).

## Roadmap

| Milestone | Goal |
|---|---|
| **M0 — Toy** ✔ | One breakable room; cast, break, pick up, kick, place, throw |
| **M1 — One floor** ✔ (partly) | Done: generated floor from templates, doors, keys, treasure/boss/vault rooms, trapdoor, items + synergies, stats panel, minimap. To do: bombs, enemies, health, touch controls |
| M2 — Synergies | Projectile behaviours, weapon types, ~15 items, automatic synergy test matrix |
| M3 — Depth | 4 floors, streaming, digging between floors, a boss made of breakable voxels |
| M4 — The climb | Special blocks and items to get back up; save runs |
| M5 — Secrets | Hidden pockets, side biomes, seed-dependent recipes, meta-progression |

## Contributing

Early days, but welcome. Before opening a PR:

```bash
npm run typecheck && npm test
```

- Comments, docs and identifiers in **English**.
- Content (materials, items, rooms) is data in `src/content/`; prefer adding data and hooks over special cases in the game loop. New items: [docs/ITEMS.md §2](docs/ITEMS.md#2-defining-an-item). New rooms: [docs/ROOMS.md §3](docs/ROOMS.md#3-templates).
- If you change behaviour, update the matching doc in `docs/` in the same PR.
- **No third-party game assets or names.** No Mojang textures/sounds/mob names, no Isaac item or character names. The style is fair game; the assets aren't.

## License

Not chosen yet. The proposal is MIT for code and CC BY 4.0 (or BY-SA) for original art and sound — see [docs/TECHNICAL.md §14](docs/TECHNICAL.md#14-open-source-and-intellectual-property-important).

## Credits

Born from a voxel gift game made for a friend who finished *The Binding of Isaac*. Inspired by *Minecraft* (Mojang), *The Binding of Isaac* (Edmund McMillen / Nicalis) and *Noita* (Nolla Games). SÓTANO is not affiliated with or endorsed by any of them.
