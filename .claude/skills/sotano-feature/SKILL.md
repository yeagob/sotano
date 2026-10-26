---
name: sotano-feature
description: The production quality bar for every SÓTANO feature, and a living log of the owner's feedback. Use it whenever you implement or change anything the player can see, hear or feel (mechanics, UI, items, enemies, rooms, effects). It is self-improving - after every piece of owner feedback, add the lesson to the log at the end of this file. Also use sotano-docs (and sotano-items for items).
---

# SÓTANO feature skill (self-improving)

The owner expects **production-level finish, as in a final game**, not prototypes. Every feature ships with visuals, feedback, sound, docs and tests. This file grows: after every round of owner feedback, append what you learned to §5 and, if it changes how features should be built, update §1–§4.

## 1. Definition of done

A feature is done only when all of this is true:

1. **It works in the real game**, verified in the browser (not only in tests), with a screenshot of the result.
2. **It has juice**: visual feedback (particles, flashes, animation), a synthesised sound, and a HUD/UI change where relevant. Nothing important happens silently.
3. **It reads clearly**: the player can tell what happened and why (banner, toast, icon, colour), in English.
4. **It respects the story**: names and meaning follow `docs/design/STORY.md`; ask the owner when unsure.
5. **It is modifiable**: anything an item might want to change reads a stat or emits an event (see the `sotano-items` skill), and the contract test still passes.
6. **It performs**: no frame-time regression; heavy work is budgeted per frame (the Joel-gift standard: thousands of cubes smoothly).
7. **It is tested**: unit tests for rules, the synergy matrix still green, `npm run typecheck && npm test`.
8. **It is documented** (sotano-docs skill), in the same commit.

## 2. Process

1. Re-read the owner's request; list every explicit requirement and keep them visible in the task list.
2. For key architecture, run the three-party review (engineer, architect agent, mediator agent) before building.
3. Build the smallest complete version that meets every requirement, then add juice.
4. Verify in the browser: drive it with `S.game` (see `docs/architecture/OVERVIEW.md` debug console), check the console for errors, take screenshots of the key moments.
5. Report honestly: what was verified, what wasn't, what's left.

## 3. Quality bar by area

| Area | Bar |
|---|---|
| Visuals | Pixel-art coherent with the cube world; outlines on icons; no placeholder white boxes; nothing clipping through walls |
| Feedback | Hits flash, pickups pop, explosions shake the screen, damage shows a red vignette, important events get a banner or toast |
| Audio | Every action has a short synthesised sound (WebAudio, no files); avoid repetition with slight pitch variation |
| UI | Readable at 1366×768 and on narrow screens; Isaac-style counters; menus pause the game and release the mouse |
| Physics | Nothing gets stuck inside walls; nothing tunnels; loose cubes stack and never overlap each other |
| Messages | Information banners stay until clicked; short notices (toasts) can fade |
| Enemies | Spawn visibly from the room centre, never by the doors; telegraph attacks (wind-up, swelling) |
| Performance | 60 fps on desktop with 2000 cubes; budgets for remeshing, chain reactions, simulations |
| Randomness | Every random choice reads a weighted table and a seed path from RNG.md; structure never reads player state; only `core/fx.ts` uses `Math.random` |

## 4. Before you hand off

- [ ] Every explicit requirement from the owner is met or listed as not done.
- [ ] Screenshots taken of the feature in action.
- [ ] Console clean on a fresh load.
- [ ] Tests and typecheck green; docs and README updated.
- [ ] Lessons from this round's feedback added below.

## 5. Owner feedback log (append, newest last)

- **Performance like the Joel gift**: thousands of physics cubes must stay smooth. A physics engine capped at ~150 bodies was rejected; typed-array cube physics is the standard.
- **Cubes must never get stuck inside walls**: anything overlapping solid is pushed to the nearest free spot.
- **Mouse capture**: a click anywhere captures the mouse until Esc; overlays must not swallow the click.
- **Right click with nowhere to place** throws the block, like Q.
- **Carrying more than one block shows the second block in the other hand.**
- **Isaac-style counters** for keys and bombs (and hearts) always on screen.
- **Enemies always spawn visibly from the centre of the room, never next to doors.**
- **Floors are stacked; you go down by gravity** through a hole; the next floor loads when entering the boss room.
- **Breaking blocks drops nothing but the block** (no keys or items): rewards live in chests (more Minecraft).
- **Items need visual representations** (icons) and strong pickup feedback; the player must be able to see their items, synergies and descriptions in a window.
- **Item quality goes up to 4**; some items must be strong enough to break a run (fun first).
- **The shot is called "intentions"**, never tears. Items are practices named after real techniques and works; enemies are projections of mental blocks.
- **Everything documented, in English**, with indexed sections; ask when something is unclear.
- **References and lore are a library** (docs/lore + the sotano-lore skill); new references the owner shares get catalogued and, where they fit, reshape existing content.
- **Information messages stay until the player clicks** (the item banner); the dismissing click doesn't fire.
- **Cubes must never clip into each other**, not even right after spawning: they repel each other (separation pass) and never into walls.
- **Items must say plainly what they do** and their impact on the run, besides the philosophical message: every item has an `effect` line with numbers.
- **Every run must be unique, driven by a seed** (RNG across rooms, variants, enemies, items, rewards); take the time to do it right.
- **Before scaling vertically, stress-test the architecture with extreme items** (UI in the world, sudden wind, clones, friendly enemies…) and fix the root causes first; see docs/reviews/stress-test.md.
- **Damage to actors and damage to blocks are separate values**: a damage item must not also speed up digging unless it says so.
