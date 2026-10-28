# SÓTANO — Game Design Document (v0.2, draft)

> Working title. An open-source prototype for the browser (WebGL), deployed on Vercel.
> The mix: **Minecraft's look and voxel world** + **The Binding of Isaac's run structure, items and synergies** + **Noita's world of secrets that open up through knowledge**.

---

## 1. The idea in one sentence

A first-person *roguelite* inside a **fully breakable** voxel dungeon: you descend floor by floor casting intentions, finding items that combine with each other and make you stronger… until, in the end, you have to **dig and build your own way back up to the surface**, where another layer of the game begins.

## 2. Design pillars

1. **Everything is matter.** Walls, doors, floors, chests and even some enemies are made of blocks. Any block can be broken if you insist enough; the question is never *whether* you can, but *what it costs you*.
2. **Everything interacts with everything.** An item is not "+1 damage": it changes rules. Intentions, bombs, blocks, enemies, doors and health all share the same damage and event systems, so combinations emerge on their own (and sometimes break the game — that's fine).
3. **Down to get strong, up to win.** The natural direction is down (more items, more danger). The goal is up. That tension is the heart of a run.
4. **The world is only limited by what you know.** As in Noita, there are places that aren't shown, aren't announced and aren't on any map. You reach them with resources, skill… or because someone told you.
5. **Short runs, readable on mobile and PC.** A "normal" run lasts 20–40 minutes. Controls fit on a joystick and three buttons, and every action exists on keyboard and mouse, gamepad and touch.

## 3. Game loop

```
Enter room ─► (combat: doors close) ─► room cleared ─► reward
     ▲                                                    │
     │          ┌────────────── explore doors ◄───────────┘
     │          │
     │          ├─► treasure room (item)   ├─► key / bomb room
     │          └─► boss room ─► trapdoor ─► next floor
     │
     └──── or at any time: dig down / sideways
```

- **Micro (seconds):** aim, cast, dodge, break a block, pick up a block, place it.
- **Mid (minutes):** clear a room, decide whether to spend a key or a bomb, decide whether to dig instead of following the path.
- **Macro (run):** go down through the ten floors below the roots (and, later, up the giant tree: [LEVELS.md](LEVELS.md)), assemble a "build" from items.
- **Meta (between runs):** unlock items and knowledge (not raw power) that open new places.

## 4. The player

- **First-person camera** with Minecraft-style arms/hands (pixel-art textured cubes). Right hand: casts. Left hand: holds your block (if you carry one).
- **Movement:** walk, jump (1 block), no sprint at first. Some items grant flight, double jump, etc.
- **Isaac-style health:** half hearts. Initial types:
  - Red hearts (recoverable).
  - Soul hearts (temporary, lost first).
  - A third type with an on-loss effect (e.g. it explodes and breaks nearby blocks). Own name and art.
- **Consumables:** **bombs** and **keys**, as in Isaac. **No coins, no shop.**
- **Block slot** (replaces cards and runes): see §6.

### Intentions (the player's shot)

The player doesn't shoot tears: they cast **intentions** — small orbs of will that fly, drop and hit. The name is final; its visual language is still open.

| Stat | What it does | Starting value (approx.) |
|---|---|---|
| Damage | Damage per hit (to enemies and blocks) | 3.5 |
| Fire rate | Casts per second | ~2.7 |
| Shot speed | Initial projectile speed | 1.0 (relative) |
| Range | Time flying straight before dropping | 1.0 (relative) |
| Gravity | How hard the intention drops | 1.0 (relative) |
| Size | Hit radius | 1.0 |
| Luck | Chance of special effects | 0 |
| **Mining** | Damage multiplier against blocks | 1.0 |

Intentions fly straight for their range, then **fall under gravity** and break on contact. Each intention also has a **polarity**, positive or negative, switched by a control: positive intentions mend projections and damaged blocks, and can turn projections to your side; only negative ones break blocks; negative ones wound everything that is yours too, creatures included ([BESTIARY §1.1](BESTIARY.md)). Casting upwards digs ceilings; arcing them reaches enemies behind cover.

**Mining** is deliberately separate from damage: it allows items that make you a good fighter but a poor miner, and vice versa. It's a very useful design lever.

## 5. Blocks and materials

### Tiers

Every block has a material, and every material has a **tier** (hardness), hit points and properties.

| Tier | Examples | Hits with starting intentions | Where |
|---|---|---|---|
| 0 | Dirt, sand, cobweb, crates | 1–2 | Decoration, floor 1 |
| 1 | Dungeon stone, brick | ~4 | Walls on floors 1–2 |
| 2 | Deepstone, iron | ~10 | Floors 3–4, slabs between floors |
| 3 | Obsidian, rune stone | ~30+ | Special places, seals |
| ∞ | Bedrock | Unbreakable (barring a secret exception) | World boundary |

Rule: **every breakable block breaks with enough hits.** Material armor reduces damage, but never to zero (at least 10% always gets through). So "with enough intent you can break anything" holds, while high tiers are still a real time wall.

### Material properties (data, not code)

`flammable`, `explosive`, `conductive`, `fragile` (breaks when it falls), `heavy` (hurts what it lands on), `luminous`, `bouncy`, `sticky`, `liquid` (later phase)… Items and enemies read these properties: a fire intention burns wood, an explosive enemy breaks stone, a falling heavy block crushes an enemy.

### Lifecycle of a broken block

1. The block breaks → it **becomes a physics cube** (same look, slightly smaller) that falls, rolls and bounces.
2. Once it settles, it can be **picked up**.
3. After **60–120 s** it shrinks smoothly to nothing and despawns.
4. There's a **cap on active cubes**; past it, the oldest disappear first.

There's no floating "item drop" like in Minecraft: the broken block *is* the object.

## 6. The block slot

- You can carry **one block** by default. No inventory. (Items can raise it: the `carry` stat. Builder's Hands gives +1.)
- **Walking over** a loose block picks it up… if your hand is free.
- If you already carry one, **you kick it**: it flies off with physics. A kicked block hurts enemies (more if heavy) and can break fragile blocks. This is a combat mechanic, not just an inconvenience.
- **Loose blocks are tough but not eternal:** intentions push them, and after 4 hits (`DEBRIS_HITS`) they shatter. Enemies shove the loose blocks and bombs they walk into. A block that clips into a wall or another block **hops upward** (`HOP`) instead of staying wedged.
- **Bombs are loose cubes too:** you can kick them, enemies and intentions push them, and **an intention hit sets a bomb off at once**.
- **Place:** aim at a block face and place it (like Minecraft, ~5 blocks of reach).
- **Throw:** launch the block you hold (Q, or right click when there's nowhere to place it).
- **Use:** some blocks have an active effect when placed or dropped (the equivalent of cards and runes):
  - TNT: placed, explodes after a delay.
  - Light block: lights up dark areas.
  - Slime block: launches you when you jump on it.
  - Rune block: does something strange (to be discovered).

### The climbing problem (key decision)

Climbing 4 floors with one block at a time is tedious if solved the Minecraft way (jump and place a block below you, 100 times). Proposal: **keep the one-block rule**, but make climbing a *puzzle of resources and knowledge*, not repetition:

- **Growing blocks:** a "vine seed" that grows upwards until it touches a ceiling; a ladder that extends itself.
- **Items** that bend the rule: carry 2 blocks, stack blocks of the same type, jump higher, float.
- Each floor's **trapdoor**, once the boss is beaten, leaves a **ladder back up** (but you must have opened it on the way down).
- Digging a diagonal staircase upwards is always possible, just slow.

So "how do I get back up" becomes something you plan on the way down. See §13 (open questions).

## 7. The dungeon

### Vertical structure

```
  ═══════════════ SURFACE: house + natural terrain (loads as you approach)
  ░░░░ dirt / rock (tier 0–1)
  ┌──┬──┬──┐  FLOOR 1  "Basement"
  ░░░░ slab (tier 1)
  ┌──┬──┬──┐  FLOOR 2
  ░░░░ slab (tier 2)
  ┌──┬──┬──┐  FLOOR 3
  ░░░░ slab (tier 2)
  ┌──┬──┬──┐  FLOOR 4  → final boss of the prototype
  ▓▓▓▓ ??? (secret layer, see §9)
  ████ bedrock
```

- Each floor is a **horizontal band** about 20–24 layers tall: rooms + rock around them.
- Between floors there's an increasingly hard **slab**. Digging through it with starting intentions is possible but slow (minutes); with good items or bombs, seconds.
- Around the rooms there's no void: there's **solid rock** with veins, small caves and hidden pockets.

### Rooms

- Base size inspired by Isaac: **13×7 block** interior, 5–8 high (vaults and domes, galleries and bridges, terraces, pools and dips: [LEVELS.md](LEVELS.md)), 1–2 block walls. Double rooms (26×7, 13×14) and L-shapes are planned with the Tree-of-Life floors.
- Rooms are **hand-designed** as templates and picked at random from a catalogue per floor and type. The floor *plan* (which room goes where) is procedural.
- Room types (version 1):
  - **Start:** no enemies.
  - **Normal:** enemies + obstacles (rocks, crates, pits).
  - **Treasure:** an item on a pedestal. Normal door on floor 1; locked on later floors.
  - **Boss:** at the end of the longest path. Beating it reveals the **trapdoor** and an item.
  - **Secret:** no door. Reached by breaking a wall (or bombing it), as in Isaac — but here **also by digging from anywhere**.
  - **Chest/Key:** padlocked door; consumables or a chest inside.
- **Doors:** open, combat-locked (open on clear), padlocked (key), reinforced (bomb), and one special door per floor that asks for something strange.

### Breaking walls vs. room design

Isaac works because rooms lock you in during combat. Here you can always try to dig your way out. We don't forbid it; we make it **expensive**:

- Room walls are one tier harder than the surrounding rock.
- During combat the walls "reinforce" visibly (glowing runes = +1 temporary tier).
- Fleeing forfeits the room's reward.

So digging is a **decision**, not an exploit.

### Going down

- **Trapdoor** in the boss room (fast and safe). Today: 1.5 s after you enter, the boss's practice appears on the room's pedestal and the floor cracks open over a 2×2 shaft. It **never opens under you**: it waits until you step aside.
- On floors 0–8, the trapdoor and your own hole ask a **toll** first: what you give (a heart, a key, a bomb, a block from your hand, from the sixth floor practices) and how many grows with the floor. See [LEVELS.md §1c](LEVELS.md).
- **Your own hole**, at any time: if there's a room below, you drop into it (enemies included!). If there's nothing, you keep digging rock until you reach the next floor.
- Falling far hurts (TBD; maybe half a heart beyond N blocks).

### Loading and unloading

Only the current floor and its neighbours are kept "alive". What you broke is remembered: if you come back up, your holes are still there.

## 8. Enemies (first iteration)

> Superseded for content by [BESTIARY.md](BESTIARY.md) (projections by zone and lineage, bosses, creatures, presences, seals, omens and waves). The table below is the original prototype brief, kept for history.

Minecraft look: bodies made of cubes, simple animations. **Original** names and designs (see the IP note in the technical doc).

| Enemy | Behaviour | Interaction with blocks |
|---|---|---|
| Zombie | Walks towards you | Hits blocks in its way (slowly) |
| Skeleton | Keeps distance, shoots in arcs | Its arrows break tier 0 blocks |
| Slime | Jumps; splits on death | Bounces off blocks; sticks to walls |
| Exploder (own name) | Approaches and blows up | **Breaks blocks**: both a threat and a tool |
| Spider | Climbs walls and ceilings | Ignores gravity on blocks |
| Bat | Erratic flight | None |

**Bosses** (one per floor in the prototype): big, made of blocks **that really break** when damaged. Hitting a specific part (an arm) knocks it off as physics cubes. This is the most visually "sellable" part of the prototype.

## 9. What we take from Noita: the world beyond the map

The "official" dungeon (4 floors of rooms) is only the visible part. Around it there's more:

- **Hidden pockets in the rock:** small caves with an item or an altar, with no hint on any map. You find them by digging… or because an item or a sound hints at them.
- **Sideways:** dig far enough horizontally and the rock changes material and **other biomes** appear (a crystal cave, a flooded zone, a sunken city). Higher risk, higher reward.
- **All the way down:** below floor 4 there's something sealed with tier 3 material. Opening it takes a specific combination of items or a ritual.
- **On the surface:** the house has doors and cellars that only make sense once you know what's below.
- **Persistent knowledge, not persistent power:** between runs you don't get stronger; you learn. You unlock new items in the *pools* (as in Isaac) and discover "recipes" (like Noita's alchemy): e.g. placing a certain block on a certain altar while holding a certain item. Some recipes **change with the run seed**, so they can't simply be copied from a wiki.

## 10. Items and synergies (design examples)

> These were the first design sketches. The **current catalogue** (names, paths, effects, inspirations, quality) is in [STORY.md §5](STORY.md#5-items-practices-with-real-names); how items are built is in [../architecture/ITEMS.md](../architecture/ITEMS.md).

Passive items (on pedestals). Provisional, original names.

| Item | Effect | Synergies that should emerge "on their own" |
|---|---|---|
| Fire intent | Intentions burn | Burns flammable blocks; burning enemies ignite wood |
| Drill | Pierces N soft blocks | + fire = burning tunnels; + explosive = blows up at the end |
| Explosive intent | Explodes on impact (can hurt you) | Very fast digging; dangerous in small rooms |
| Magnet | Intentions home in on enemies | With blocks: home in on the weakest block? (exception to design) |
| Lead feet | You kick blocks very hard | Heavy blocks become lethal projectiles |
| Stone heart | +1 heart; the block you carry blocks one hit | An obsidian block as a shield |
| Mole eye | See the outline of hollows and rooms through rock | Find hidden pockets |
| Builder's hands | Carry 2 blocks | Partly solves "how do I climb" |
| Leaden intent | More damage and more drop; they fall like cannonballs | + drill = very fast vertical digging |
| Chain reaction | Breaking a block damages neighbours of the same material | Like the Hockey Stick in the Joel gift project |

**Golden rule for designing items:** every item must touch **at least two systems** (e.g. combat + blocks, or blocks + movement). An item that only changes a number is filler.

### Weapon types (like Brimstone or the knife in Isaac)

Some items **replace** the basic cast: a continuous beam, a thrown pickaxe that returns, a melee drill. They combine with intention modifiers (fire, magnet…) through a precedence table (see the technical doc, §4.4).

## 11. The surface (out of scope for the prototype)

As you approach the top of floor 1 the surface loads: a **house** (where the protagonist comes from) in a clearing, surrounded by Minecraft-style natural terrain (hand-built at first; procedural later). Reaching the surface ends the "normal" run and opens the game's next layer. What that layer is stays deliberately open.

## 12. Prototype scope (the minimum that proves the idea)

1. First-person controller with hands, intentions that drop. **(M0 ✔)**
2. A breakable 13×7 room, with blocks that fall with physics, can be picked up, kicked and placed. **(M0 ✔)**
3. A full generated floor (8–11 rooms) with doors, keys, bombs, treasure room and boss. **(M1: done except bombs and the boss itself)**
4. 3 enemies (zombie, skeleton, exploder) and 1 block-built boss.
5. 10–15 items with real synergies between them. **(M1: 11 items, 3 synergies)**
6. Going down to floor 2 by trapdoor **or** by digging, with floor streaming. **(M1: trapdoor only; each floor replaces the last)**
7. Climbing back up by digging and placing blocks until the surface (even if the surface is an empty meadow).

If that's fun, it grows to 4 floors, bosses and secrets.

## 13. Open questions

1. **Climbing:** always one block, or allow stacking blocks of the same type? (Recommendation: one block, plus items/special blocks that relax it.)
2. **Revisited floors on the way up:** stay empty or repopulate with tougher enemies? (Recommendation: partial repopulation; it adds tension to the climb.)
3. **Intentions' visual language:** what do they look like and sound like? (M0 uses pale blue orbs.)
4. **Bosses or waves?** Recommendation: one boss per floor; waves as a special room type ("challenge room").
5. **Fall damage:** yes or no? It strongly affects the freedom to dig down.
6. **Camera:** first person as requested. Worth prototyping a 45° top-down camera too (closer to Isaac, more readable on mobile) before locking it in.
7. **Platforms:** mobile and PC from the start? The Joel gift project proves mobile is viable, but it constrains performance and controls. (Decided: keyboard and mouse, gamepad and touch in landscape all ship complete; docs/architecture/input/README.md.)

## Surface, sky and new runs

- **The sky has a ceiling**: you can build up to **100 blocks above the grass**. The whole surface layer, from just above floor 1 up to that limit, counts as **depth 0** for anything that asks "how deep am I?".
- **R starts a new run behind a short fade**: the screen eases to black (0.45 s, a slow ensō turning in the middle), the new run is built while it's dark, and the screen comes back only once the new world is meshed (at most 2 s), so nothing pops in.

## Weapons that replace the intention

Like in Isaac, some practices **replace** the intention (owner decision, 2026-10-26): **Kiai** (hold to charge, release a beam that burns through blocks tick by tick). **Occam's Razor** (a blade of light that cuts every block in reach, projections and their projectiles) does not replace it: the intentions keep flying beside the blade (owner, 2026-10-27), and the rubble it cuts is sliced in two before it vanishes. Both are quality 4 and only come from bosses. Together they become **One Clear Cut**: a charged, giant blade of light that sweeps the room. How it works: [../architecture/WEAPONS.md](../architecture/WEAPONS.md).
