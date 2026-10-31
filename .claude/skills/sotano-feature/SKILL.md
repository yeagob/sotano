---
name: sotano-feature
description: The production quality bar for every The Roots feature, and a living log of the owner's feedback. Use it whenever you implement or change anything the player can see, hear or feel (mechanics, UI, items, enemies, rooms, effects). It is self-improving - after every piece of owner feedback, add the lesson to the log at the end of this file. Also use sotano-docs (and sotano-items for items).
---

# The Roots feature skill (self-improving)

The owner expects **production-level finish, as in a final game**, not prototypes. Every feature ships with visuals, feedback, sound, docs and tests. This file grows: after every round of owner feedback, append what you learned to §5 and, if it changes how features should be built, update §1–§4.

## 1. Definition of done

A feature is done only when all of this is true:

1. **It works in the real game**, verified in the browser (not only in tests), with a screenshot of the result.
2. **It has juice**: visual feedback (particles, flashes, animation), a synthesised sound, and a HUD/UI change where relevant. Nothing important happens silently.
3. **It reads clearly**: the player can tell what happened and why (banner, toast, icon, colour), in every shipped language (English source + Spanish; `sotano-i18n` skill).
4. **It respects the story**: names and meaning follow `docs/design/STORY.md`; ask the owner when unsure.
5. **It is modifiable**: anything an item might want to change reads a stat or emits an event (see the `sotano-items` skill), and the contract test still passes.
6. **It performs**: no frame-time regression; heavy work is budgeted per frame (the Joel-gift standard: thousands of cubes smoothly).
7. **It is tested**: unit tests for rules, the synergy matrix still green, `npm run typecheck && npm test`.
8. **It is documented** (sotano-docs skill), in the same commit.

## 2. Process

1. Re-read the owner's request; list every explicit requirement and keep them visible in the task list.
2. **Think like the masters before you build** (owner rule). For every feature, write down (in your plan, in a sentence each) how **Noita**, **Minecraft** and **The Binding of Isaac: Repentance** would do it, and take the best idea from each:
   - **Isaac: Repentance**: how would it read in one glance, with no text? What is the telegraph, the pickup pop, the sound sting? How does it combine with every other item (synergy first)? Is there a risk/reward or a "break the run" version?
   - **Minecraft**: what is the block-level rule, simple enough to guess? How does it feel in the hand (sound per material, crack stages, the little hop)? Does it respect the world's grammar (grid, tiers, gravity)?
   - **Noita**: what happens when it touches everything else (materials, explosions, loose cubes, enemies)? What emergent chain could it start? What secret could a curious player find with it?
   Then build The Roots' version: borrow principles, never assets, names or exact layouts (art guide red lines), and make it mean something in the story.
3. For key architecture, run the three-party review (engineer, architect agent, mediator agent) before building.
4. Build the smallest complete version that meets every requirement, then add juice.
5. Verify in the browser: drive it with `S.game` (see `docs/architecture/OVERVIEW.md` debug console), check the console for errors, take screenshots of the key moments.
6. Report honestly: what was verified, what wasn't, what's left.

## 3. Quality bar by area

| Area | Bar |
|---|---|
| Visuals | Pixel-art coherent with the cube world; outlines on icons; no placeholder white boxes; nothing clipping through walls |
| Feedback | Hits flash, pickups pop, explosions shake the screen, damage shows a red vignette, important events get a banner or toast |
| Audio | Every action has a short synthesised sound (WebAudio, no files); avoid repetition with slight pitch variation |
| UI | Readable at 1366×768 and on narrow screens; Isaac-style counters; menus pause the game and release the mouse |
| Physics | Nothing gets stuck inside walls; nothing tunnels; loose cubes stack and never overlap each other |
| Messages | Information banners stay until clicked; short notices (toasts) can fade |
| Enemies | Doors slam on entry (sound, dust); every spawn is announced by an omen (particles + spatial sound) at its spawn point, never through a door; telegraph attacks (one telegraph per attack family, docs/design/BESTIARY.md §3) |
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
- ~~Enemies always spawn visibly from the centre of the room, never next to doors.~~ Replaced on 2026-10-27 (see the bestiary entry below).
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
- **Small damage reductions must count**: the player's health is in points (a heart is 8) and hearts are drawn in quarters; no minimum loss per hit.
- **Stuck cubes hop up**: a cube that clips into something must hop upward, not just slide or stay wedged. Loose blocks and bombs must react to everything (shots, enemy shoves, explosions); a hit on a bomb detonates it at once; loose blocks shatter after repeated hits.
- **The game is localized (English + Spanish) and every new text must be too**: any text the player reads goes through `src/i18n/`, with its translation, in the same change; the `sotano-i18n` skill is invoked whenever text is added anywhere.
- **The boss room holds a second practice, the boss's** (2026-10-26): every boss room has a pedestal whose practice (from the `boss` pool, reserved at run start) appears when the boss is overcome, with a pop-in, light and a chime. Rewards live where you earn them.
- **The floor never opens under the player** (2026-10-26): anything that removes ground (holes, trapdoors) must wait while the player stands or hovers on it, telegraph it (crack stages, dust, a toast that says what to do) and open the moment they step off.
- **The surface is depth 0 and the sky has a ceiling** (2026-10-26): you can build up to 100 blocks above the grass; that whole layer counts as depth 0 for anything that asks how deep you are.
- **Transitions are smooth, never cuts** (2026-10-26): R fades to black, builds the new run in the dark, and comes back only when the world is meshed (nothing pops in). Any scene change gets the same care.
- **Think like Noita, Minecraft and Isaac: Repentance before building** (2026-10-26): see §2 step 2; it is part of every feature plan.
- **The game is a love letter to games** (2026-10-26): it is full of winks at other games (a paraphrased line, a familiar mechanic), never their names or assets, and every wink still means something in the story (STORY.md, "A love letter to games").
- **Weapons replace the shot, like Isaac** (2026-10-26): Occam's Razor (a blade that cuts every block in reach), Kiai (a charged beam that burns through blocks tick by tick) and their synergy One Clear Cut (a giant beam sword); quality 4, boss pool. Destruction is welcome; keep it bounded by budgets (reach caps, cuts per frame, loose cubes per strike, sounds and particles per frame), never by filtering what the owner asked to cut.
- **Elements first, then rooms built around them, then projections that live in them** (2026-10-26/27): fire, water and lava are systems with verbs (wade, swim, burn, quench, bridge), rooms make them the protagonists, and each projection reacts to each element by its meaning (`EnemyDef.elements`). Breaking a flame's block puts it out; flows slope like ramps, never step with a gap; thrown and kicked cubes hurt by hardness; weapons clear the rubble they make; loose cubes get random pushes and give up after a few hops so they never loop. Levels have their own skill (`sotano-levels`).
- **Every element follows the art guide, with captures in the guide** (2026-10-26): nothing the player sees ships without the sotano-art gate; the guide's §15 is the as-built record.
- **The bestiary is a world, not a list** (2026-10-27): doors slam with force and sound when a room with projections seals; projections rise at spawn points around the room (never through doors), each announced by particles and a **spatial** sound before it exists; waves are fine if every one is announced; attacks may cross the room (charges, leaps, beams, sweeps). Projections evolve with depth (lineages, zone-unique patterns, rooted variants) and bosses are random from each zone's pool. Not everything is hostile: living inhabitants and immortal presences you can talk to (permanent or messengers) live in key layouts. Inspiration from Noita's and Isaac's bestiaries (mechanics, never names or looks), not Minecraft's. Design: docs/design/BESTIARY.md.
- **Intention polarity** (2026-10-27, owner): intentions are positive or negative, switched by a control. Positive ones mend projections until they turn to your side; negative ones harm projections, allies, inhabitants and presences alike. Lesson: a mechanic that changes what the shot does to friends needs its story sentence first (STORY §4), and the review before the code (`docs/reviews/polarity.md`).
- **Requests from the depths** (2026-10-27, owner): some Presences ask for real-world actions (breathe, be still, write, draw, move), then ask whether they were done. Early yeses lower a trust meter that gets rewards worse but never blocks progress. Lesson: anything that asks the player's body or mind needs every request optional, an alternative for every physical act, no judgement, no therapy claims and no storage of what they write (BESTIARY §8.5).
- **Chests and hard walls** (2026-10-27, owner): walls around locked doors are made of very hard (not unbreakable) material; keys open chests; at least half of the practices sit shut in chests (never the boss's); chests are unbreakable and common on every floor; some are free, some cost keys, some several, and keys are spent. Lesson: an unbreakable thing must be a block that every damage path already ignores (infinite HP), and anything that costs the player a resource goes through an event items can change (`chestOpen`), with its text in both languages. Design: docs/design/CHESTS.md.
- **Agreements and parts** (2026-10-27, owner): requests run in an idle window of 30–60 s (the game sees no input); the trust meter is secret and only shows in the rewards; projections leave named parts; every inventory slot shows its name label; gifts come in three tiers and a closed set. Lesson: a secret mechanic must still fail gently (it never blocks progress), and every label is text, so it goes through the i18n bar.
- **The tutorial lives in the world** (2026-10-27): lessons are carved on tablets on the walls of the roots, never an overlay on the screen. Instructions are part of the place.
- **Isaac's doors and challenge rooms** (2026-10-27): doors stand open when there are no projections and open by themselves when a room is cleared; a breakthrough destroys a door for good. Challenge rooms on hostile floors: three waves each visit, harder every wave and every visit, repeatable for farming.
- **Parts, built (2026-10-27, owner §5.7 and §13 m, n): a collectible that does nothing stays off the item pipeline.** Parts are named after their pattern, drop by their own roll, sit in the inventory with their name and never enter `Inventory`, so no effect, cap or validator reaches them. Lesson: a new kind of pickup needs an explicit branch in the touch code and a tile branch in the inventory; the generic collect path would heal the player.
- **Polarity, built (2026-10-27): the order of a rule is the rule.** A change to what a hit does (a cap, a halving, a relapse) must say where it sits against the item hooks (before or after `actorDamage`), what a cancelled hit still does, and whether a ticking weapon counts once per stroke. A weapon that replaces the shot must obey the same rules, or the HUD mark on the counters lies. A mechanic that changes what a shot does to friends needs an art review of the new look before it ships (the Opus art agent, `sotano-art` §0).
- **Bug round (2026-10-27, owner):** (1) Tao Te Ching phases through five blocks of any tier and damages each, like Isaac's spectral shots; (2) Occam's Razor no longer replaces the shot, and the rubble it cuts is sliced in two Beat Saber style before it vanishes; (3) old loose cubes shrink smoothly instead of blinking (a blink reads as a glitch; a slow shrink reads as time); (4) contact wear hits every block you press against, gradually, never below you; (5) positive intentions only mend blocks, so the first tutorial room teaches the F switch and a one-time hint covers the gap; (6) tutorial tablets are short: one sentence each, bigger type. Lesson: when a rule changes what a basic action does (a positive shot no longer digs), the tutorial and a first-time hint must change in the same commit, and tutorial text is cut to the verb.
- **The tree in stories, and loading by level (2026-10-27, owner):** a vertical place reads as stories with a stair from each into the next, every stair somewhere else so every hall is crossed; a performance improvement stays as small as it can (only what the owner named) so it never risks breaking what works.
- **Three complete control schemes** (2026-10-27, owner): keyboard and mouse, gamepad (fully mapped) and mobile (landscape always, a touch UI that hides what is not needed every second). Any control an item or effect adds must be mapped on all three following Minecraft, Noita and Isaac (`sotano-controls` skill). On mobile the intention's polarity switches with a **double tap on the cast button**, not a button of its own. Lesson: prompts and tablets name the control of the device in use, never a literal key.
- **Documentation is a hierarchy** (2026-10-27, owner): a subsystem gets its own folder with a README (what it is + index) and one document per variant (input: keyboard, gamepad, touch), never one merged document. Rules in `sotano-docs` (Hierarchy).
- **Chests that look like chests** (2026-10-27, owner): a full cube with a chest texture did not read as a chest, nor did its open state or its lock. A chest is now a model (body, banded lid on a hinge, a padlock with one keyhole per key, brass trim when it holds a practice) on an invisible solid cell; it opens with a shudder, a dropped lock and a thrown-back lid, and what it kept is spat up on an arc to land in front of the player. Lesson: state must read from silhouette with no text (open vs shut, locked vs free, how many keys), and a reward should be seen in the air before it is collected.
- **Layouts and materials (2026-10-27, owner):** the rooms of the first floors were boring, repetitive and all built from the same brick; you never felt you were going somewhere new. Bigger rooms that keep their place on the map, ceilings of different shapes, platforming, deeper holes, and each floor built from its own materials. Lesson: progress must be visible in what the world is made of, not only in fog and numbers; the map tells how rooms join, never their size.
- **Open lids never clip; wood, dirt and the bomb redone** (2026-10-27, owner): a chest's open lid went through the wall behind it, so chests now turn their back to free air. Wood (crates, living wood, door leaves), dirt and the breakthrough seed were redrawn; brick and obsidian were the bar. Lesson: check any moving part against its neighbours in the real room, not only in the gallery.
- **Landing as the main menu, the support link stays small** (2026-10-28, owner): the start screen becomes the landing (cover art, play and new run, controls, language, open-source note, repository, version) and doubles as the pause menu. The coffee link is a small icon with a tooltip, never a call to action, and never shows during play. Lesson: a menu tells the player what the game is before it asks them to play; support and contribution belong on the menu, not in the HUD.
- **The name and the story move together** (2026-10-28, owner): the project is renamed THE ROOTS (the repository keeps its name). The story is a descent through the layers of the mind, with the tree above; the README and STORY speak of going deeper, not of returning to the surface. Lesson: a rename touches every document, the README is the first page a player reads, and the identity has to read the same everywhere.
- **Parts in the hand, not in the inventory** (2026-10-28, owner; supersedes the 2026-10-27 parts entry): the inventory holds items; its only counters that cost no slot are keys and bombs. Everything else you carry sits in the hand or the unlocked carry slots, and only what you carry can be handed to someone later. Parts are placed (right click) or thrown (Q) like blocks. The first pickup burst into gold sparks, like a key, and read as breaking: a pickup's feedback must match what it does to the player (here, joining the hand), never another pickup's effect.
- **Picking up with empty hands** (2026-10-28, owner): the hold-up that raises a picked-up item showed the hands still full of what they carried, so the object seemed to float between objects. Lesson: a gesture that takes something starts with the hands empty; carried things come back only when the gesture ends.
- **2026-10-28, owner:** the way down costs something (a toll: a heart, a key, a bomb, a block from the hand, practices from the sixth level), chosen in one window, and a heart given is real damage that can kill. Lesson: a cost the player pays must show what it takes before they commit (the window lists exactly what is payable and disables Go down until the count is exact), and a click or a key must never do two things at once: pointer clicks activate tiles, Enter and A act on the selection, and the input lock must not steal a click from an open window. → LEVELS §2.3c, `Game.payToll`, `Hud.openToll`.
- **Bosses must be dangerous** (2026-10-29, owner): the bosses of the first five floors hardly moved, had low reach, few and poor attacks and few particles; Resistance stood still breaking blocks and never hurt you. Lesson: a boss is never idle (a gait between moves), every phase is a set of several moves with windup → act → recovery, attacks reach across the room and are drawn on the floor before they land, and impacts shake, crack and spark. **Measure before and after**: `S.sb.duel` (SANDBOX §5.1) counts movement, moves, hits and damage per phase against a still and a running player; a boss that lands nothing in fifteen seconds is not done. Watch for a boss hurting itself with its own rubble. → BESTIARY §6.6, `enemies/moves.ts`.
- **Boss sequences** (2026-10-29, owner): after the danger pass, "add variations, with varied attack sequences, like Isaac". Every boss phase mixes single moves with combos (chains of moves, each telegraphed, the opening only at the end), picked by the seed so no two fights run alike. Lesson: variety is built from the same readable moves recombined, never from unreadable new ones; a move that keeps its own clock (a charge's run) must not borrow the moveset's.
- **A weapon that replaces the shot reaches what the shot reaches** (2026-10-31, issue #44): the alembic never brewed under Remember Breathing, because the beam only offered its strokes to breakable blocks and the alembic is unbreakable. Lesson: a block that answers intentions but never breaks gets the stroke through the weapon host (`answer`), and each replacing weapon (beam, great cut) is tested against the same rule as the shot, with and without the item.
