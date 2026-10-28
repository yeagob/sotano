# Stations, props and zones (ideas)

Status: **brainstorm, nothing decided or built.** A catalogue of things that could furnish The Roots' rooms: purely aesthetic props, special blocks, interactive **stations** (furnace, kitchen, laboratory…) and **loading zones**, with what each one means, what the player does with it, and how it could serve the game's verticality. Everything here waits for the owner's choice before it becomes content; names are proposals. Related: [ELEMENTS.md](ELEMENTS.md) (furnaces, barrels and chests are already designed there), [LEVELS.md](LEVELS.md) (the thirteen floors and the room bar), [STORY.md](STORY.md) (names and tone), the art ledger [DECISIONS.md](../art/DECISIONS.md).

The owner's brief (translated): *add and decorate the levels with interactive elements: a furnace where stone is transformed or objects burned; a kitchen we can interact with to get certain things, since the block hand could also carry other items, like pieces of meat from an enemy to cook. A document of ideas for themed blocks, themed tables, decorations that are purely aesthetic, special interactive blocks, and loading and unloading zones. A brainstorm of other elements for the layouts that give them richness and theme — a torture table, but also an experimentation laboratory — analysing their possible uses and how they could apply to the game's verticality.*

## 1. Principles (so ideas stay The Roots)

1. **Everything is a cube.** The hand carries cubes, so anything the player can carry (an ingredient, a husk, a jar) is a small cube with its own texture, picked up by walking over it, kicked, thrown and placed like stone. No inventory grid, no menus ([DESIGN §6](DESIGN.md#6-the-block-slot)). Practices that raise `carry` make stations richer for free.
2. **Stations are verbs, not menus.** You feed a station by throwing, kicking or placing a cube into its mouth (or `F`), and it answers in the world: a cube pops out, a flame grows, a door moves. Its state shows on the block itself (glow, smoke, a filled slot), readable with no text.
3. **Every prop answers your intention.** Even pure decoration breaks into shards or reacts (the [meaning test](../art/ART-GUIDE.md#12-motifs-and-the-meaning-test): "what does the player's intention do to it?"). A prop that never reacts is a fixed point with a stated reason (an altar, a bell).
4. **Transformation over loot.** Stations turn what you broke into something better: the obstacle becomes the way. They are where the alchemy of the descent (nigredo → rubedo, [art guide §4](../art/ART-GUIDE.md#4-the-descent)) becomes hands-on.
5. **Projections live with them.** Each station changes a fight: Panic bursts next to a furnace and scatters coals; Doubt hesitates at a scale; the Inner Critic takes the lectern. Section 9.
6. **The rules of the house still hold.** Nothing reacts on load (the player starts every chain), door approaches, centre and shaft stay clear, no room reaches another floor ([sotano-levels §3–§4](../../.claude/skills/sotano-levels/SKILL.md)). The few ideas that cross floors on purpose (the dumbwaiter, §6) need an explicit exception and a review.
7. **Respect.** Instruments of self-punishment are relics of a pattern, never a scene of people being hurt; no gore, no bodies, no victims on them ([§4.5](#45-instruments-of-self-punishment-the-torture-table-reframed)). Food is nourishment and care, never moralised.

### Effort tiers

Each idea is tagged with how much it costs to build, so a first slice can be cheap:

| Tier | What it needs | Example |
|---|---|---|
| **T0** | A material and template characters only | Bookshelves, hanging roots, candles |
| **T1** | A block with one simple reaction (on hit, on touch, on use) | Bell, mirror, bounce pad, ladder |
| **T2** | A **block entity**: slots, a timer, an output ([ELEMENTS architecture §7–§8](../architecture/ELEMENTS.md)) | Furnace, hearth, alembic, planter |
| **T3** | A system across rooms or floors | Dumbwaiter, depots kept for the climb, the athanor's slow work |

## 2. What the hand can carry, beyond stone

Today the hand carries loose blocks and bombs. The brief asks for more: ingredients, pieces of enemies. Proposal: **carryables** are cubes with a `kind` beyond `material`, so the pick-up, kick, throw and place code stays one path.

| Carryable | Where it comes from | Meaning | Used in |
|---|---|---|---|
| **Husk** *(key proposal)* | A released projection sometimes leaves one: the cold shell the light was trapped in (Luria's husks; [COSMOLOGY §4](../lore/COSMOLOGY.md#the-tree-of-life-kabbalah)). Cold-side colours, dull, a hairline crack | The pattern's leftover matter: what remains once you have seen through it | Cooked (integrate it), burned (let it go), composted (grow from it), studied (the lab) |
| **Mushroom, root, tuber** | Floor 0, the roots; mushroom beds in damp rooms | The earth feeds you | Kitchen |
| **Fruit, resin, seed pod** | The tree above (trunk, branches) | What grows when you climb | Kitchen, lab, planters |
| **Fish / eel** *(maybe)* | Deep water rooms, a fishing spot (cistern) | Feelings you dared to swim into | Kitchen |
| **Ice** | Floor 9 (frozen), cold rooms | What froze; it melts near heat into water | Puts out fire, fills a channel, kept cold in an ice box |
| **Coal, ash** | Furnace (crate → coal), pyre (anything → ash) | Spent fuel, what is left after letting go | Fuel; ash fertilises planters |
| **Glass, iron, brick** | Furnace outputs ([ELEMENTS §2](ELEMENTS.md#furnaces)) | Refined matter | Building, lenses, conductive paths |
| **Jar** | Laboratory shelves | Something preserved, waiting to be understood | Holds water, lava (!) or an essence; thrown, it shatters and spills |
| **Meal** | Kitchen outputs | Care given to yourself | Eaten with `F` while held: heals or grants a short state |

**Husks instead of meat.** Projections are patterns, not animals (STORY §4) and their release is gore-free ([art §8.6](../art/ART-GUIDE.md#86-release-death)), so "a piece of meat from an enemy" becomes a **husk**: the shell left behind. That keeps the brief's best idea, a choice about what to do with what defeated you, and gives it meaning:

- **Cook it** (kitchen): integration, Jung's "own your shadow". It nourishes you.
- **Burn it** (pyre): letting go. Small, immediate gift (luck for the room, a mote of light).
- **Compost it** (planter): it becomes ground for something new (a vine, a mushroom).
- **Study it** (laboratory): understanding. It fills a page of your field notes (§4.4).

Each projection's husk could differ (Doubt's is heavy like its sack; Panic's is warm and crackles; the Critic's is a curled page), and so would what it gives.

## 3. Kinds of things in a room

| Kind | Purpose | Interaction | Tier |
|---|---|---|---|
| **Props** (decor) | Theme, story, readability of the place | Break into shards; some sway, ring, spill | T0–T1 |
| **Special blocks** | Change movement or combat locally | Bounce, reflect, conduct, climb, ring, light | T1 |
| **Stations** | Transform carryables | Feed, wait, collect | T2 |
| **Zones** | Hold, send or demand cubes (load / unload) | Fill, empty, ship | T2–T3 |

## 4. Stations

### 4.1 Fire: transform and let go

Furnace, burning barrel and chest are designed in [ELEMENTS §2](ELEMENTS.md#2-rules-the-player-can-learn); the ideas below extend that family.

| Station | What it does | Meaning | Vertical use | Tier |
|---|---|---|---|---|
| **Furnace** *(designed)* | Fuel + input → refined cube (stone → brick, sand → glass, ore → iron, crate → coal) | Deliberate practice, refining | Refined blocks are tougher steps for climbing; glass lets you see the room below | T2 |
| **Pyre** (the burning barrel, made a place) | Anything thrown in is gone; husks and crates flare; leaves ash | Letting go, burning the letter | Its **hot air column** lifts light things (ash, paper, a jar of air) and, with a practice, you: an updraft ladder | T2 |
| **Kiln** | Slow: dirt or mud → **tile** (a light, brittle block you can stack fast), clay jar | Patience shapes the soft | Tiles are cheap, light scaffolding | T2 |
| **Forge and anvil** | Hot iron on the anvil + a hit of intention → a **tool cube**: hook, spike, plate | Will hammers raw talent into shape | **Spike** placed in a wall is a foothold; **hook** hangs a rope (§6) | T2 |
| **Bellows** | Kick or hit it: a gust that feeds fire (faster smelt, bigger flame) and pushes cubes and light projections | Breath fuels the fire | Points up: a short launch, like a weak bounce pad | T1 |
| **Athanor** (the alchemist's slow furnace) | Takes one cube and works on it **for a whole floor**: drop it in on the way down, collect the transmuted cube on the way up (stone → gold-seamed stone, husk → a shard of light, iron → something rare) | The Great Work takes time; the descent prepares the return | Rewards planning the climb back; only on deep Tree floors | T3 |

### 4.2 Kitchen: nourishment

The kitchen is care: you feed yourself between fights. Meals are cubes you carry and eat with `F` (the hands lift it to the mouth; no menu).

| Station | What it does | Meaning | Tier |
|---|---|---|---|
| **Hearth stove** | Ingredient + fire → **meal** (heals; meals from husks heal more) | Cooking is self-care | T2 |
| **Cauldron** | Water + two ingredients → **broth**: heals over time, or a short state (warm: fire hurts less; steady: less knock-back) | Slow care, things that need mixing | T2 |
| **Larder** (pantry) | Stores ingredients for the run; **rots** what you leave too long into mud | What you put off spoils (a natural home for **Procrastination**) | T2 |
| **Smokehouse** | Hangs husks or fish over smoke for a few rooms → preserved food that never spoils | Preparing for later | T2 |
| **Ice box** | Keeps ice and food cold; ice melts outside it | Preserving, cooling down | T2 |
| **The long table** | Place up to four meals and eat together: a bigger effect for the set, and the room's lamp lights | Sharing, belonging (a wink at the systemic constellations' "everyone has a place at the table") | T1 |
| **Mushroom bed / herb rack** | Grows ingredients over time in damp rooms | The earth gives if you tend it | T2 |

Recipe ideas (numbers are placeholders):

| In | Station | Out | Effect |
|---|---|---|---|
| Mushroom | Hearth | Roasted mushroom | +½ heart |
| Husk | Hearth | Warm meal | +1 heart; the projection's type grants a small trait for the room (Doubt: steadier aim; Panic: faster) |
| Water + root + mushroom | Cauldron | Root broth | +1 heart over 10 s |
| Fish | Smokehouse | Smoked fish | +1 heart, never spoils |
| Fruit + resin | Cauldron | Sap tea | Breath ×2 for the next dive |
| Ice + fruit | Ice box | Cold fruit | Puts out the fire on you when eaten |

Tone: food never punishes (no "you ate too much" debuff); circle 3 is themed by rain and mud, not by shaming eating.

### 4.3 Water: move it, lift it

| Station | What it does | Meaning | Vertical use | Tier |
|---|---|---|---|---|
| **Sluice gate** | Hit it to open or close: releases a contained pool along a channel | Letting a feeling flow on purpose | Flood a vertical shaft to **swim up it** (a water elevator), or drain it to walk down | T1 |
| **Pump / hand pump** | Kick it to raise water one block per kick into a basin above | Effort lifts emotion where it is needed | Fills raised basins: puts out fire on a gallery | T2 |
| **Water wheel** | Turns while water flows past; powers whatever touches it (a bellows, a lift) | Emotion as energy | Drives the counterweight lift (§6) | T3 |
| **Well with a bucket** | `F` lowers the bucket; it comes back with a water or a deep-water cube… or something lost | Reaching into depth | A rope down that you can also climb | T2 |
| **Drain** | Swallows water and sends it to the room below | What you release goes somewhere | Floods the room under you (Noita-style chain) | T3 |

### 4.4 Laboratory: experiment and understand

Alchemy is already the descent's script; the laboratory is where the player does it with their hands. Best home: the floors of old structures (the study and the library mirror, [COSMOLOGY §1](../lore/COSMOLOGY.md#1-the-shape-of-the-world)) and circle 8 (illusions and masks).

| Station | What it does | Meaning | Tier |
|---|---|---|---|
| **Experiment table** | Place two cubes on it and hit it with an intention: they **combine** by a hidden reaction table (iron + water → rust, glass + light → lens, husk + salt → essence). Unknown results are a surprise; failures smoke and leave ash | Trying things out; you learn by doing | T2 |
| **Field notes** (a lectern with a book) | Every reaction you discover is drawn there and **kept across runs** | Meta-progression as knowledge (STORY open question 3) | T3 |
| **Alembic** | Distils: water + husk → **essence** (a jar: throw it to soothe a projection for a few seconds, or drink it for a short state) | Separating what matters from what clouds it | T2 |
| **Mortar** | Kick a cube into it: grinds to sand, salt or powder (gunpowder from coal + salt?) | Breaking down to understand | T1 |
| **Scales** | Weigh two cubes; balanced scales open a cabinet or a door | Polarity, balance (Kybalion) | T1 |
| **Specimen shelf** | Jars with husks in them, labelled with ruled lines; breaking one releases its light (or the projection itself!) | What you keep at a distance to study | T1 |
| **Lens and mirror bench** | Glass lens focuses your intention into a hotter beam; a mirror bends it 90° | Focus, reflection | T1 |
| **Tesla coil** *(electricity milestone)* | Charged by a hit; arcs to iron and water nearby | Insight as a sudden flash | T2 |

### 4.5 Instruments of self-punishment (the torture table, reframed)

Dante's structure and images are welcome; punishment of people is not (LEVELS §1 respect rule). So the "torture table" becomes the **instruments of self-punishment**: the furniture of the Inner Critic's rooms. They are always **empty**: no figure, no blood, only dust, straps worn smooth and ruled lines scratched into the wood. They can be **used as tools on cubes**, and **dismantling one is itself a reward**: the room heals a little (a local clear wave) and the instrument becomes building material. The lesson reads without text: you can use the pressure, but you don't have to keep it.

| Instrument | Pattern it stands for | As a tool | Dismantled |
|---|---|---|---|
| **The Rack** | Stretching yourself thin, "never enough" (perfectionism) | Put a cube on it and turn it: it **splits into two** of the tier below (one stone → two dirt). More material, less strength | Planks: a ladder |
| **The Press** | Pressure that makes you hard | Two soft cubes in → one harder cube (dirt + dirt → stone, stone + stone → deepstone). Dense steps for climbing | Iron plate |
| **The Stocks** | Shame, being put on display | A **trap**: a projection lured into it is held for a few seconds (patterns can be caught, not tortured) | Wood |
| **The Hair Shirt rack** / **the scourge wall** *(maybe never)* | Penance | — | Owner to decide whether these images belong at all |
| **The Weighing Chair** | Measuring your worth | Sit (`F`): it shows how many hearts you "weigh"; projections nearby turn to look at you | Brass |

Placement: circle 7 (violence) and the Critic's floor, always with a way to dismantle them. Never the wood of the suicides, never chains on a figure.

### 4.6 Garden: growth and the climb

| Station | What it does | Meaning | Vertical use | Tier |
|---|---|---|---|---|
| **Planter** | Plant a **bomb** (a breakthrough is a seed, [art §12](../art/ART-GUIDE.md#12-motifs-and-the-meaning-test)) and it grows a **vine** up to the ceiling instead of exploding | Potential grows instead of blowing up | The answer to the climbing problem ([DESIGN §6](DESIGN.md#the-climbing-problem-key-decision)): vines you grow on the way down are your ladders up | T2 |
| **Compost** | Husks + ash + dirt → **rich soil** that makes planters grow twice as fast | Growing from what defeated you | Faster vines | T2 |
| **Root tap** (floor 0) | Hit a thick root: sap drips into a jar | The earth sustains you | Resin glues two cubes into a ledge | T1 |
| **Beehive** *(maybe)* | Honey for the kitchen; bees chase whoever breaks it, projections included | Community; don't break what sustains others | — | T2 |

### 4.7 Memory and offerings

| Station | What it does | Meaning | Tier |
|---|---|---|---|
| **Chest** *(designed)* | Holds what you find and what you choose to keep ([ELEMENTS](ELEMENTS.md#chests)) | Memory | T2 |
| **Archive shelf** | Put a cube in and take it out on any later floor's archive (shared storage) | What you learn stays with you | T3 |
| **Altar of offering** | Asks for something (three crates, one husk, a meal) and gives a practice, a key or a heart. Shown by shapes carved on it, never text | Giving up something to receive | T2 |
| **Bell** | Ringing it calls every projection in the room to it (bait), or wakes a sleeping door | Calling attention | T1 |
| **Mirror** | Reflects intentions; on circle 8, some mirrors show a room that isn't there | Seeing yourself; illusion | T1 |
| **Clock** | Its pendulum swings; things on its platform move only on the beat | Riding the pendulum (Kybalion rhythm) | T1 |

## 5. Loading and unloading zones

Places that **hold, demand or send cubes**. They turn the one-block hand into logistics and give the climb back a reason to plan.

| Zone | How it works | Meaning | Tier |
|---|---|---|---|
| **Depot** (a marked floor area with a frame) | Cubes left on it are **kept across the run** (never shatter, never unload) | What you set aside on the way down is what you need on the way up | T2 |
| **Quota hopper** | A funnel that wants N cubes of a kind (5 stone, 3 crates); filled, it opens a door, raises a bridge or lowers a lift | Consistency: small steps add up (Kaizen) | T2 |
| **Chute** | A hole in the floor with a lip: cubes thrown in **fall to a hopper in the room below** (not the player) | Sending ahead | T3 |
| **Dumbwaiter** | A small box in a 1×1 shaft between floors: load it and pull the cord; it rises or drops to the next floor's twin hatch | Bringing what you found down below up to daily life (integration) | T3, needs an exception to the band rule |
| **Mine cart and rails** | Load the cart, kick it: it rolls along the rails and dumps at the end (or into a projection) | Momentum carries what you can't | T2 |
| **Crane / winch** | Hook a cube (or yourself) and crank it up to a gallery | Lifting the heavy by method, not force | T2 |
| **Pressure plate** | Holds a door, a sluice or a lift while something heavy is on it (a cube, a projection, you) | Keeping something in place | T1 |
| **Balance lift** (counterweight) | Two platforms on a rope: load cubes on one and the other rises with you on it | Polarity: one goes down so the other goes up | T2 |

## 6. Verticality: how these help you go up and down

The world is 16 blocks per floor, rooms are up to 8 high with galleries, and climbing back is a planned puzzle ([DESIGN §6](DESIGN.md#the-climbing-problem-key-decision)). Ideas that serve it:

| Need | Ideas | What it asks of the player |
|---|---|---|
| **Reach a gallery in the room** | Bellows launch, balance lift, crane, spikes from the forge, tiles from the kiln, the rack's planks as ladders | Gather and transform material first |
| **Climb out of a pit or a shaft** | Vine from a planted bomb, water elevator (sluice into a shaft), well rope, pyre updraft (with a practice) | Choose between a bomb now and a ladder later |
| **Carry material up** | Depots, dumbwaiter, archive shelf, mine carts on ramps | Stock up on the way down |
| **Send material down** | Chutes, drains, dumbwaiter | Prepare the next floor before you reach it |
| **Get down faster** | Sluice drains (ride the water down), break the press's plate floor, the pit in floor 5 | Open your own way |
| **Use the slow way** | The athanor (one floor of work), smokehouse, compost: things that pay off on the return | Trust the process |
| **Vertical combat** | Fight from galleries with a bell bait below, drop a mine cart on a projection, flood a lower level from above | Use height as a vantage point |

**Floor-crossing ideas** (chute, drain, dumbwaiter, archive) break today's guarantee that rooms never touch the floor above or below ([sotano-levels §3](../../.claude/skills/sotano-levels/SKILL.md)). If the owner wants them, they need a three-party review: a reserved 1×1 column like the boss shaft, its own test, and a rule for what happens when the player digs into it.

## 7. Props: decoration with meaning

Pure decoration, cheap (T0–T1), all breakable into shards. Grouped by the place they belong to.

| Place | Props |
|---|---|
| **Floor 0, the roots** | Hanging roots that sway when hit, glowing fungi (cold light, allowed), nests of the peaceful creatures, worm tunnels, fallen seeds, a stone with a first carved hand |
| **Tree floors (1–5)** | Each emanation room carries its own object family: lamps, pillars, banners of the path colours, paired columns (the three pillars), a fountain at the centre of balance |
| **Circle 1, limbo** | A waiting room: rows of chairs facing a closed door, a library of books never opened, a clock without hands |
| **Circle 2, the wind** | Torn curtains that flutter, wind chimes, papers flying in the air currents (updrafts that carry cubes) |
| **Circle 3, rain and mud** | Leaking pipes, buckets catching drips, a cold kitchen, mushrooms in the corners |
| **Circle 4, weight** | Stacks of coins as blocks, heavy boulders on rails you push (Dante's rolling weights), scales, locked strongboxes |
| **Circle 5, the swamp** | Reeds, half-sunk furniture, a forge whose fire went out, broken plates |
| **Circle 6, the burning tombs** | Stone coffins as chests (open lids glow), candles, pyres |
| **Circle 7, violence** | The instruments of self-punishment (§4.5), always empty; a river of boiling water (never blood) |
| **Circle 8, fraud** | Masks on the walls, mirrors that lie, false walls, a laboratory of illusions, ditches crossed by thin bridges |
| **Circle 9, the frozen bottom** | Ice blocks with something inside (a frozen shard you thaw with a furnace), frost on every surface, a silent bell |
| **Trunk, branches, leaves** | Sap channels, knots that are doors, nests, rope bridges, hanging lanterns; at the top, telescopes, an orrery, star charts on tables |
| **Everywhere** | Candles, cobwebs (burn), shelves, crates, covered paintings (break the cloth: a picture of the surface), letters, toys in the oldest rooms (childhood, gently) |

**As above, so below** ([COSMOLOGY §1](../lore/COSMOLOGY.md#1-the-shape-of-the-world)): the depths' cold kitchen mirrors a warm kitchen above; the library of unread books mirrors the study; stations could echo at the surface or the tree when that layer exists.

## 8. Themed rooms built from these

Each in one line, with its verb, as LEVELS §4 asks:

| Room | Floor | The idea in one glance | The verb |
|---|---|---|---|
| `kitchen` | 0, 3 | A hearth, a long table, a larder, mushroom beds | Cook the husks of the last fight |
| `forge` | 4, 5 | A forge, an anvil and bellows by a lava channel | Make spikes and climb to the gallery |
| `laboratory` | 3, 8 | An experiment table, an alembic, shelves of jars | Combine two cubes and see; break a jar and something gets out |
| `pressroom` | 7 | The rack and the press, empty, on a stage | Use them, then dismantle them: the room warms |
| `granary` | 3, 4 | Hoppers on a gallery, chutes down to the floor | Fill the quota to raise the bridge |
| `mill` | 2 | A water wheel turning a balance lift | Open the sluice and ride the lift |
| `orchard` | 0, L1 | Planters under a tall vault | Plant a bomb, grow a vine, reach the hidden ledge |
| `waiting-room` | 1 | Rows of chairs, a handless clock, one closed door | Ring the bell to open it (it calls the projections too) |
| `vault-of-weights` | 4 | Scales and boulders on rails | Balance the scales; roll a boulder onto a projection |
| `cold-store` | 9 | An ice box, a frozen shard, a dead furnace | Light the furnace, thaw the shard |
| `observatory` | L3 | Telescope, orrery, star-chart table | Turn the orrery: the teleport door changes star |

## 9. Projections and stations

| Projection | With stations |
|---|---|
| **Doubt** | Stops at scales and hoppers to "reconsider"; won't step on pressure plates; its husk is heavy (good for the press and the balance lift) |
| **Inner Critic** | Takes the lectern of the field notes and lobs judgements from it; breaking the lectern under it knocks it down; at home among the instruments of self-punishment |
| **Panic** | Bursting near a furnace or pyre scatters burning coals; near the sluice it can blow the gate open; its husk is warm (cooks itself on the hearth faster) |
| **Procrastination** *(next)* | Lives in the larder; every piece it splits into hides in a jar |
| **Distraction** *(next)* | Drawn to bells, mirrors and lenses; rings bells at random |
| **Burnout** *(element)* | Lights every furnace and stove it passes; leaves them burning without fuel until they crack |
| **Overwhelm** *(element)* | Opens sluices and fills basins |

## 10. Practices that could use them

Item ideas (names are generic, per STORY §5; inspirations to be credited in SOURCES when chosen):

| Practice idea | Path | Effect |
|---|---|---|
| **Alchemy** | Mind | Furnaces and the experiment table give a better result one time in three |
| **Mindful Eating** | Body, Emotion | Meals heal half a heart more and grant their state for twice as long |
| **Gardening** | Body, Will | Planters grow instantly; vines grow two blocks higher |
| **Letting Go** | Emotion | Everything burned in a pyre gives a mote of luck |
| **Shadow Integration** *(Jung, credit only)* | Emotion, Mind | Husks drop from every released projection; cooked husks heal fully |
| **Craftsmanship** | Will | One hit of intention on the anvil makes two tools |

## 11. A sketch for later (architecture)

Stations are block entities (ELEMENTS architecture §7–§8 already plans them for chests and furnaces). One data shape could cover the whole family, so a new station is content, not code:

```ts
interface StationDef {
  id: string;                          // 'hearth', 'alembic', 'press'
  material: string;                    // the block it is made of (breakable, shards)
  slots: { name: string; accepts: string[] }[];   // carryable kinds or materials
  recipes: { in: string[]; out: string[]; seconds: number; needsFuel?: boolean }[];
  onFeed: 'throw' | 'place' | 'use';   // how a cube goes in
  onBreak: 'spill' | 'shards';
}
```

Results go through events (`stationOutput`, `carryableEaten`) so practices can hook in (sotano-items). Recipes and husk drops are random decisions: their own RNG forks (RNG.md). This is a **key architecture decision** (new core system): it goes through the three-party review before any code.

## 12. A first slice (recommendation)

Cheapest path to the most feeling, in order:

1. **Husks** as a carryable (T1): projections sometimes leave one; burnable in the existing fire.
2. **Hearth** (T2, reuses the eternal flame): husk or mushroom in → meal out; `F` to eat.
3. **Planter** (T2): plant a bomb → a vine. Solves part of the climbing problem and reads instantly.
4. **The press** (T2, simplest instrument): two soft cubes in → one hard; dismantle it to warm the room.
5. **Props pack** (T0): roots, shelves, candles, jars, chairs, through the existing decor slots.
6. Then the **furnace** and **chests** as already planned in ELEMENTS (E1, E6), the **experiment table** and **depots**.

Floor-crossing zones (chute, dumbwaiter, archive) wait for the Tree-of-Life floors and their review.

## 13. Open questions for the owner

1. **Husks instead of meat**: does the shell left by a released projection fit what you imagined? And cooking it (integrating the shadow) versus burning it (letting go): a choice you like?
2. **Eating**: `F` while holding a meal, instantly? Or a short animation that leaves you exposed?
3. **The instruments of self-punishment**: are they welcome at all (always empty, used as tools on cubes, dismantled as a reward), or should the torture imagery stay out entirely?
4. **Field notes across runs**: should discoveries in the laboratory persist between runs (knowledge as meta-progression)?
5. **Floor-crossing zones** (dumbwaiter, chutes, drains, a shared archive): worth breaking the "rooms never touch the floor above or below" rule for?
6. **Bombs as seeds**: should a planter turn a breakthrough into a vine (a real use for the seed motif)?
7. Which **floors** get which stations first (kitchen on floor 0 as the friendly tutorial floor?).
