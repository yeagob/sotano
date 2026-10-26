# SÓTANO

**A first-person roguelite in a fully breakable voxel dungeon.** Go down floor by floor, find items that rewrite the rules and combine with each other, then dig and build your own way back up to the surface.

Inspired by the block worlds of *Minecraft*, the runs and item synergies of *The Binding of Isaac*, and the knowledge-gated secrets of *Noita*. Open source, runs in the browser (WebGL), no install.

> **Status: prototype M0.** One breakable room. You can cast intentions, break any block, and pick up, kick, throw and place the cubes that fall. Everything else in this README marked *planned* is design, not code yet.

---

## What you can do in M0

- **Cast intentions** — your shot. They fly straight for a moment, then drop under gravity.
- **Break anything** — every block has a tier, HP and armor. Weak shots still do at least 10% damage, so everything breaks eventually (except bedrock).
- **Catch the debris** — broken blocks become physics cubes that tumble and settle. Walk over one to pick it up. You can only carry **one**: walk into another while your hand is full and you **kick** it.
- **Place and throw** — put your block on any face you're looking at, or hurl it.
- **Dig out** — the room sits inside solid rock, with hidden pockets and a surface with open sky above.
- **Try items** from the browser console (`S.give('drill')`) to see stats and event hooks at work.

## Controls

| Action | Input |
|---|---|
| Look | Mouse (click the page to capture it) |
| Move · jump | WASD · Space |
| Cast intentions | Left click (hold) |
| Pick up a block | Walk over it with your hand free |
| Kick a block | Walk into it while carrying one |
| Place the block | Right click |
| Throw the block | Q |
| New room | R |

Touch controls are *planned* for M1.

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
S.items            // ['heavy', 'miner', 'drill', 'chain']
S.give('chain')    // breaking a block damages same-material neighbours
S.stats()          // current computed stats
S.hold('obsidian') // put a block in your hand
S.restart(7)       // new run with seed 7
```

The full list is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#debug-console).

## How it's built

| Piece | Choice |
|---|---|
| Language | TypeScript (strict) |
| Build | Vite |
| Rendering | three.js, chunked voxel meshes built in a Web Worker, baked ambient occlusion |
| Physics | Custom box-vs-grid for the player, DDA raycasts for intentions, [Rapier](https://rapier.rs) (WASM) for loose blocks |
| Art | Pixel-art textures generated at runtime: no image files |
| Audio | Synthesised with WebAudio: no sound files |
| Tests | Vitest |
| Hosting | Static site (Vercel) |

The core idea, borrowed from how Isaac is built: **items don't call into the game, the game emits events and items hook into them.** Stats are recomputed from layered modifiers, damage to blocks and (soon) enemies goes through one pipeline, and chain reactions are deferred and budgeted. That's what lets items combine without special-casing every pair.

```
src/
  core/      events, RNG, stats, damage      (no three.js, no DOM)
  content/   materials, rooms, items, atlas layout (data)
  world/     voxel storage, generation, mesher + worker
  physics/   raycast, voxel collision, Rapier debris
  combat/    intentions
  entities/  player
  render/    atlas, chunks, hands, debris, cracks, particles
  game/      event catalogue, HUD, game loop
tests/       Vitest suites
docs/        design, technical proposal, architecture
```

## Documentation

- [docs/DESIGN.md](docs/DESIGN.md) — the game: pillars, loop, blocks and tiers, the one-block slot, dungeon structure, enemies, items, the Noita-style hidden world, open questions.
- [docs/TECHNICAL.md](docs/TECHNICAL.md) — research into how Isaac and Noita are built, the target architecture, budgets, IP notes and the roadmap.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the current code is organised, frame by frame.

## Roadmap

| Milestone | Goal |
|---|---|
| **M0 — Toy** ✔ | One breakable room; cast, break, pick up, kick, place, throw |
| M1 — One floor | Generated floor plan, doors, keys, bombs, 3 enemies, health, touch controls |
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
- Content (materials, items, rooms) is data in `src/content/`; prefer adding data and hooks over special cases in the game loop.
- If you change behaviour, update the matching doc in `docs/` in the same PR.
- **No third-party game assets or names.** No Mojang textures/sounds/mob names, no Isaac item or character names. The style is fair game; the assets aren't.

## License

Not chosen yet. The proposal is MIT for code and CC BY 4.0 (or BY-SA) for original art and sound — see [docs/TECHNICAL.md §14](docs/TECHNICAL.md#14-open-source-and-intellectual-property-important).

## Credits

Born from a voxel gift game made for a friend who finished *The Binding of Isaac*. Inspired by *Minecraft* (Mojang), *The Binding of Isaac* (Edmund McMillen / Nicalis) and *Noita* (Nolla Games). SÓTANO is not affiliated with or endorsed by any of them.
