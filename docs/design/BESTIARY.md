# Bestiary: projections, creatures and presences

Status: **partly built** (2026-10-28), from the owner's answers of 2026-10-27 (§13). Built: the seal, omens and waves, intention polarity (§1.1), the attack engine, 40 projection entries, 11 creatures and 14 bosses ([ENTITIES.md §5](../architecture/ENTITIES.md)). Not built, or built simpler than designed: presences, rooted variants, and the rest listed in §12.1. Each new being must still pass the art gate ([`sotano-art`](../../.claude/skills/sotano-art/SKILL.md)); §12.1 says which have not. Names marked *(proposal)* wait for the owner (§13).

The owner's brief (translated): *"Design the whole layer of enemies, final bosses and creatures in general. Not everything has to be hostile. Projections no longer have to be born in the middle of the room: they can appear at different spawn points, announced by particles. When you enter a room with enemies, the doors close with force and a sound, and they start to appear with particles that make them evident. There can be waves at given moments, but it must be very clear, with spatial sound, where they appear, and particles must announce them before they appear. There can be enemies whose attacks cross the room, that launch themselves. Take inspiration from the bestiaries of Noita and Isaac (not Minecraft, which is poor in this sense), mix ideas and combine them with the floors' themes. Enemies must evolve as the floors evolve; there are unique enemies per great zone and random bosses depending on the zone. Also: beings who live in the depths and are not hostile, whom we can talk to and get knowledge, wisdom and lessons from. They can be permanent, or come to give a message and vanish. These non-hostile actors are immortal and live in key layouts."*

Related: [STORY.md §4](STORY.md#4-enemies-projections-of-what-blocks-intention) (what projections mean; STORY wins on names and tone), [LEVELS.md](LEVELS.md) (the thirteen floors), [ELEMENTS.md](ELEMENTS.md), [art guide §8](../art/ART-GUIDE.md) (creature method), [ACTORS.md](../architecture/ACTORS.md) (actors and factions), [COSMOLOGY.md](../lore/COSMOLOGY.md).

---

## 1. Three kinds of beings

Everything that moves in the depths is one of three kinds. The kind decides its faction, whether it can be hurt, whether it talks, and which side of the palette it belongs to.

| Kind | What it is in the story | Faction | Can be hurt | Speaks | Side (art) |
|---|---|---|---|---|---|
| **Projections** | Patterns that block intention, given a body of the room's own matter ([STORY §4](STORY.md#4-enemies-projections-of-what-blocks-intention)) | `projection` (hostile) | Yes, and they are **released**, never killed | Never (art guide §11 rule 2) | Projections: cold, husks |
| **Creatures** *(proposal)* | What was always alive down here: instinct, curiosity, play, rest, care. Not patterns: the healthy life of the inner world | `neutral` | Yes, by intention polarity (§1.1): negative intentions harm them, positive ones heal them. Blasts only push them | No (they sing, chirp, hum) | **New: the living** (art ruling needed, §10) |
| **Presences** *(proposal)* | Wise beings of the depths: the parts of you that already know. They ask, they listen, they teach | `neutral`, immortal | Never: no health at all | Yes, kindly, in short lines | **The light**: they shine only with your lantern, while you listen (§8.1) |

**One line for each:** projections are *what blocks you*; creatures are *what keeps living in you anyway*; presences are *what in you already knows*.

Rules that hold for all three:

- **Patterns, never people.** No being is a person, a group, a diagnosis, a tradition or a figure from a tradition. Presences are archetypes (the gardener, the listener, the witness), never gods, saints, prophets or real people, and they never speak in a real person's words.
- **Made of the world.** All three are built from 16-texel boxes and the room's materials (art pillar 3).
- **Readable without text.** A child must tell the three kinds apart at a glance: projections have the family eye (a cold light in a dark socket); creatures have the living tell (§7.1); presences have no eyes at all until you come close, and then they look like light held in your lantern (§8.1).

---

### 1.1 Intention polarity (owner, 2026-10-27)

Everything in the depths is made by the mind, and so are its patterns. Every intention has a **polarity**:

- **Positive:** attention with care and purpose. It mends what it touches.
- **Negative:** the same force turned to wound: contempt, avoidance, anger. It harms what it touches, including the living things that are already yours.

Polarity decides what an intention does to each kind of being. The numbers are proposals, to be tuned in play.

| | Projection (hostile) | Ally (a converted projection) | Creature | Presence |
|---|---|---|---|---|
| **Positive** | Half damage, and it **mends**: every hit adds warmth; at full warmth it **turns to your side** (`factionChange`, integrated, not destroyed) | Healed, and its gold seams grow (a visual). At full health it gives a small gift, once per floor | Healed and nourished. Its gift: a heart, once per visit | Nothing to heal. It glows and speaks more openly, and its Lessons grow clearer |
| **Negative** | Full damage. A projection killed this way **releases** (a shard), as today | Harmed. At zero health it **turns hostile again** (`factionChange` back) | Harmed: it flees and vanishes into the blocks until the room clears. It never dies (§13) | Silent: it turns its light away and says nothing until you cast positively again. Never harmed |

**Blocks.** A positive intention never breaks a block: it mends one that is damaged (its cracks close). A negative intention breaks blocks as always. The same holds for the strokes of weapons (a positive blade or beam only mends). The first time a positive intention meets an undamaged block, a hint says that gold only mends and F breaks (owner, 2026-10-27).

**The control.** One toggle (its key is chosen with the controls) flips the loaded intention between positive and negative. The HUD shows which one is loaded with a round mark. It never flickers: the HUD never expresses a mood (art §11). The change applies from the next intention. The default is positive. Both polarities are round, because the shot is still yours (art §2); the negative one is darker (look: §10, ruling 6).

**Two ways through every fight.** A converted projection is not destroyed: it becomes part of the self ([ACTORS §4](../architecture/ACTORS.md#4-factions)). A room clears when no hostile projection is left, and allies don't keep doors shut. So a room can be won with light as well as with force.

**Where it comes from.** The Kybalion's polarity (opposites are degrees of one thing) and its mental transmutation (move a state along its own pole rather than fight it): [COSMOLOGY §4](../lore/COSMOLOGY.md#the-kybalion-further). Concept: [CONCEPTS](../lore/CONCEPTS.md).

**Review first.** This changes damage, factions and the room clear, so it goes through the three-party review before it is built ([`sotano-docs` §4](../../.claude/skills/sotano-docs/SKILL.md)), in [`docs/reviews/polarity.md`](../reviews/polarity.md).

**Status (built, 2026-10-27).** The rules are in `src/combat/polarity.ts` and applied by `Game` (ENTITIES §5.1).

- **Built:** the toggle on **F**; `polarity` on every shot and on every weapon stroke (Occam's Razor, Kiai, One Clear Cut); half damage and warmth for positive intentions against projections (+0.2 per hit, full at 1); a negative intention deals full damage and cools warmth by 0.25; a converted projection keeps its pattern (`factionChange` to the self); allies are healed by positive intentions and harmed by negative ones; an ally at zero under a negative intention turns hostile again at half health; the room clear counts hostile projections only; the HUD mark.
- **Added rules, for owner ruling** (the review's mediator added them; the owner's text does not say them): a positive intention never kills a projection (the last point is kept, so the warmth still fills); a converted projection, or a relapsed ally, returns with at least half its maximum health; a warmed target gains warmth once per stroke (a beam's ticks do not stack it); a relapsed projection in a cleared room does not reseal the room; a healthy ally lets positive intentions pass, while a negative one always hits it.
- **Not built:** creatures and presences (no actors yet); the gifts of allies at full health (the agreements session); warmth decay (no design yet); the Threshold Guardian's two routes (§6.5: the Guardian itself is not built).

---

## 2. The fight begins: seal, omens, spawn points, waves

This replaces the old rule "projections always materialise at the centre of the room" (owner, 2026-10-27). What stays from it: **projections come from inside the room, never through the doors**. They now rise from the room's own matter wherever it is (its floor, walls, ceiling, water, fire), and every one is **announced before it exists**.

### 2.1 The seal (the doors slam)

When the player's box is fully inside a room that holds projections (today's trigger, `game.ts`):

| t (s) | What happens | Channel |
|---|---|---|
| 0.00 | Every door of the room **drops shut at once**, fast (0.18 s, ease-in, no bounce) | Sight |
| 0.18 | **Impact**: a heavy stone slam at each door, **positioned at that door** (spatial, §2.3); dust bursts along each threshold (matter chips in the door's ramp, 12 per door); a short positional camera nudge (art §7: max of chained events, never summed, obeys the shake setting) | Sound, sight, body |
| 0.20 | A low **seal tone** rises under the slam (one cold chord in the floor's key) and the room's mood tints cold (`mood.held`, 6 %) | Sound, light |
| 0.20 | **Creatures scatter**: crickets go silent, little creatures dive into burrows (§7). The silence is the first warning | Sound |
| 0.50 | The **first omens** open (§2.3) | All |

Rules: the seal is a **root event** (`roomSeal`, emitted by the core loop like `enemySpawn`). Doors never close *on* the player: a door whose opening holds the player's box waits until it is clear, as the floor never opens under the player (feature log). Floor 0 never seals (tutorial floor rule, [LEVELS.md](LEVELS.md)).

### 2.2 Spawn points

A **spawn point** is a place in the room where a projection may rise. Templates mark them; the generator fills in the rest.

| Kind | Where | How the projection rises | Sound signature | Fits |
|---|---|---|---|---|
| **Floor seam** | A floor cell in the room interior | A crack opens, host cubes rise and assemble bottom-up (today's materialisation) | Grinding rise from below | Walkers, crawlers |
| **Wall face** | A solid wall block between head height and the floor, never within 3 blocks of a door | The wall block bulges, cracks in cold light, and the projection steps out of it; the block becomes rubble (a loose cube) | Stone groan, then a crack | Wall-mounted, leapers, Avoidance |
| **Ceiling** | A ceiling or vault block | Motes drip down a thin cold thread; the body hangs, then drops | Descending drips, then a soft thump | Flyers, droppers, Gloom |
| **Liquid** | A water or lava surface (ELEMENTS) | The surface rings outward; the body rises dripping | Bubbling swell, pitch rising | Swimmers (Undertow), fire-borne (Burnout) |
| **Element source** | A flame, a brazier | The flame turns cold-white for the omen; the projection is born from it | A breath drawn through fire | Fire-zone projections |
| **Block in the room** | Any loose cube or placed block in the room | The block itself trembles and opens eyes: it *is* the projection | A low knock from inside the block | Avoidance, Procrastination (crates) |
| **Burrow** | Inside the rock around the room | Cracks run along the wall like a ripple, then it bursts out | A rumble travelling through the walls (moves in 3D) | Rumination |

**Template marks.** Room templates gain an optional spawn legend (`s` floor, `w` wall, `c` ceiling) and a role per point (`any`, `flank`, `high`, `ambush`). A template with no marks gets points from the generator: floor cells in the interior at distance ≥ 3 from every door, plus wall and ceiling faces reachable from them. The centre remains a valid floor seam, and the boss's spawn point.

**Fairness rules** (all validated):

1. **Never through a door** and never within 3 blocks of one.
2. **Never within 3.5 blocks of the player.** A point is chosen only among the cells that qualify; if you stand within 3.5 blocks of an omen's point, the omen holds at its crack and nothing appears there until you move away (owner, 2026-10-27).
3. **Never directly behind the player in a narrow room** without a wall-, ceiling- or floor-borne sound first: every spawn is heard before it is seen.
4. **At most 4 open omens at once**; spawns are staggered by ≥ 0.25 s so each sound is separable.
5. **A point is used at most once per wave**, and a point that just spawned rests 3 s.
6. **Reachable**: a walker's floor point must reach the player's area in the room's flow field ([ENTITIES §5](../architecture/ENTITIES.md)); a point that can't is skipped for walkers.
7. **Seeded**: which points a wave uses comes from the room's own RNG fork, so a seed always plays the same ([RNG.md](../architecture/RNG.md)).

### 2.3 Omens (the announcement)

Every projection is announced by an **omen** before it exists. An omen is three channels at once (the same rule as the telegraph, art §8.5), and it lasts long enough to turn and look.

| Phase | Time | Sight | Sound |
|---|---|---|---|
| **Gathering** | 1.0 s (0.8 s from floor 6; 1.4 s on floors 1–2) | Cold motes (`cold.dim` → `cold.body`) drift in toward the point from a 2-block radius; a hairline crack in `cold.white` draws across the surface; a faint ring marks the footprint on the floor (or a column of motes for ceiling drops) | A **rising hum** at the point: a short transient first (so the ear can find it), then a tone that rises a fifth; its timbre tells the spawn kind (§2.2) |
| **Breach** | 0.2 s | The crack opens; the motes snap in | A crack, sharp and short |
| **Materialise** | 0.9 s (today's) | Host cubes assemble; eyes open last; it looks at you first. Harmless and unhittable | The projection's own motif begins, dissonant |

**Particles** use the light pool's budget rules (art §7): ≤ 24 motes per omen, halved above 80 % pool fill; never faster than 3 Hz; omens never use warm tokens (cold is theirs).

**Spatial sound** (new, not built: no `PannerNode` in `src/audio/` yet):

- Every omen, seal slam, telegraph and projection motif is played through a **3D panner at its source** (Web Audio `PannerNode`, HRTF, inverse distance, ref 2 blocks, rolloff 1, max 24 blocks), with the listener on the camera.
- Sounds meant to be *found* start with a **transient** (a click, a crack, a knock) before their tone: the ear localises onsets, not hums.
- **Elevation** is also in the sound: ceiling omens descend in pitch, floor omens rise, wall omens stay level. This helps where HRTF elevation is weak.
- **Occlusion** (later): a sound behind 2+ solid blocks is low-passed; never muted (fairness rule 3).
- Mixing: omens duck the room's ambience by 3 dB while open; at most 4 omen voices.

**Visual sound cues** (accessibility, on by default): an omen out of view shows a small cold **arc marker** at the screen edge in its direction, with its spawn-kind glyph (▲ floor, ▼ ceiling, ■ wall, ≈ liquid). It fades when the omen is in view. The HUD itself never pulses (art §11 rule 6); the marker sits over the world, not on the hearts.

### 2.4 Waves (the room director)

A room's roster is split into **waves**. A small **director** per sealed room decides when the next wave opens. It is data, not code per room.

| Wave trigger | Meaning | Use |
|---|---|---|
| `onSeal` | The first wave, 0.5 s after the slam | Every combat room |
| `remaining ≤ n` | When n or fewer of the wave's projections remain | The default for wave 2+ (n = 1) |
| `hpShare ≤ x` | When the wave's remaining health drops below x | Big single projections that call help |
| `afterSeconds t` | A timer, so stalling doesn't help | Trial rooms, bosses |
| `event` | A room event: a pedestal touched, a flame put out, water drained, a boss phase | Ambushes, set pieces |

**Between waves, a breath.** The room exhales: 1.5–3 s with no omens, the seal tone drops a step, and then a **pre-wave swell** (a low cold chord rising for 0.8 s, unpositioned, the only unpositioned combat sound) says *more are coming*. Then the omens open, positioned. The player always gets both: *that* something is coming (the swell) and *where* (the omens).

**Pacing by depth** (proposal; the budget formula stays `2 + floor`, split across waves):

| Floors | Waves in a normal room | Omen time | Notes |
|---|---|---|---|
| 1–2 | 1 (one room in four: 2) | 1.4 s | Learn the omen language |
| 3–5 | 1–2 | 1.0 s | Second waves use other spawn kinds than the first |
| 6–8 | 2–3 | 0.8 s | Mixed spawn kinds in one wave; flank roles |
| 9 | 2–3 | 0.8 s | Ice spawn points (projections rise out of frozen water) |

**Special room types for waves:**

- **Trial room** *(approved 2026-10-27; Isaac's challenge rooms)*: a marked door; inside, a pedestal whose practice appears only after 4–6 waves on timers. You may leave before the first wave opens; once it opens, the doors slam.
- **Ambush**: a room that seems empty (no seal on entry); taking its reward or breaking a marked wall triggers the seal and a wave from walls and ceiling. Telegraphed by silent creatures and a faint cold draught (motes moving towards the walls). Never on floors 0–1.
- **Gauntlet corridor** (Tree floors, the paths between emanations): no seal; projections rise from the walls as you pass. Each one is announced; you choose to fight or run.

### 2.5 The clear

Unchanged in spirit: when no hostile projection remains and the blast queue is empty, the doors rise (with a lighter, warm sound: the player's light now), the room warms and stays warm (art pillar 5), the reward appears, and **creatures come back out** (§7): the crickets start again. The return of the small sounds is the clear's second signal.

---

## 3. The grammar of attacks

### 3.1 Movement classes

| Class | How it moves | Navigation | Examples |
|---|---|---|---|
| **Walker** | Ground, steps up one block | Flow field (built) | Doubt, Procrastination |
| **Leaper** | Crouches, arcs through the air to a marked spot | Ballistic to target + flow field between leaps | Impulse, Craving |
| **Charger** | Locks a straight line and runs it to the end | Line of sight along the room's axes | Reactivity, the Hoard's weights |
| **Flyer** | Free in 3D within the room, avoids solids | Steering + local avoidance | Distraction, Gloom |
| **Swimmer** | Lives in liquid, surfaces to attack | Liquid cells only | Undertow, Sulk (mud) |
| **Burrower** | Moves through rock, breaking out and in | Voxel path in the rock shell around the room | Rumination |
| **Mounted** | Fixed to a wall, ceiling or block | None | The Shoulds, Avoidance |
| **Phaser** | Passes through blocks slowly, visible as a cold outline inside them | Straight steering | What If |

### 3.2 Attack families (and their one telegraph each)

Every attack belongs to one family, and **each family always uses the same telegraph**, on every floor. Learning one teaches it everywhere.

| Family | What it does | Telegraph (≥ 0.4 s, three channels) | Crosses the room? |
|---|---|---|---|
| **Touch** | Contact damage after a reach | Eyes widen, arms open, rising minor second (Doubt, built) | No |
| **Lob** | An arcing projectile | The thrower rears back; a cold dot marks the landing spot | Often |
| **Bolt** | A straight cold cube projectile | The emitter brightens to `cold.white`; a dry click | Yes |
| **Line** | A charge or a beam along a straight line | A **dashed cold line** is drawn on the floor along the path for 0.6–0.9 s, then it fires | **Yes**, end to end |
| **Leap** | A jump onto a spot | A **cold ring** on the floor where it will land, shrinking as the jump comes (0.6 s) | Yes, in an arc |
| **Burst** | An explosion around itself | Three stepped swells (Panic, built) | No (radius) |
| **Sweep** | A wave or wall that crosses the room | A ridge of motes forms along one wall, a long low swell; the safe height (a gallery, a layer) glows faintly | **Yes**, wall to wall |
| **Field** | An area that changes a rule (slows, forbids, freezes) | A ring of glyphs grows from the source over 1 s | Covers part of it |
| **Pull** | A wind or tether that drags | Motes stream towards the source; loose cubes start to slide first | Yes, toward the source |

Hostile shots stay **cold cubes or the Lectern's ✗**, never round, never warm (art §7). Line and Sweep attacks always leave an answer: a height to stand on, a block to put in the way, a gap to step into. **Blocks are the shield**: placing a cube in a Line's path stops a bolt or a charge (chargers stagger on it). That is the core verb answering the projection: *what you build protects you*.

### 3.3 What projections do to blocks

Projections live in the same matter as you, as in Noita: chargers smash soft blocks along their line, bursts break blocks, burrowers tunnel, leapers crack soft floors where they land, Procrastination stacks crates, Avoidance hides inside blocks, and Panic's burst often opens the way. Every block a projection breaks becomes a loose cube you can use.

---

## 4. Evolution with depth

### 4.1 The great zones

The ten floors below group into **five great zones**. Each zone has its rock ramp (art ledger §3.2), its circle(s) of Dante (structure and images only, never his figures, no punishment of people: [LEVELS.md](LEVELS.md)), a **theme of patterns**, its own **unique projections**, its own **creatures**, and its own **boss pool**.

| Zone | Floors | Rock | Dante (image only) | Theme of patterns | Element |
|---|---|---|---|---|---|
| **0 · The Roots** | 0 | `f1` earth | — | None: the earth, peace | Soil, roots |
| **I · The Cellar of Habits** | 1–2 | `f1` earth | Limbo (waiting at the threshold); the winds that never stop | Habit, waiting, wanting: the patterns of the everyday | Earth, wind |
| **II · The Flooded Rooms** | 3–4 | `f2` water | The cold, heavy rain; the weights pushed in circles | Feeling held down: too much, not enough, holding on | Water |
| **III · The Ledger Halls** | 5–6 | `f3` air | The marsh where anger and sullenness lie; the walled city of stone tombs | Old rules and old anger: beliefs set in stone | Mud, air, stone |
| **IV · The Furnace** | 7–8 | `f4` fire | The burning river and sands; the ten ditches of deceit | Burning out and pretending: running too hot, wearing masks | Fire, lava, electricity |
| **V · The Frozen Bottom** | 9 | `f4` + ice (art ruling) | The frozen lake at the bottom | Numbness and turning away from yourself | Ice |
| **Silence** | — | `rock.source` | — | Nothing hostile: one Presence (§8) | — |
| **The Tree** (above) | L1–L3 | (art ruling) | — | The subtle patterns of the climb: striving, pride, attachment (§6.4) | Wood, wind, stars |

### 4.2 Three ways projections grow with depth

1. **Lineages.** The first patterns you meet grow older and harder as you go down: each has **three forms** (I, II, III) that appear by zone. The form keeps its glyph's spine, its need and its family eye, and adds what the pattern becomes when left alone for years. You learn Doubt on floor 1 and meet Paralysis on floor 7: you will recognise it.
2. **Zone-unique projections.** Each zone has patterns that live only there, built around its element and theme (§5.2–§5.6). They never appear above their zone, and only rarely below it (as an echo, at 10 % weight on the next zone).
3. **Rooted variants** *(proposal; Isaac's champions)*. Any projection may spawn **rooted**: the same pattern, more deeply held. A rooted projection has one modifier from its zone, a visible mark, more health, and a better drop. Never more than one rooted projection per wave on floors 1–5.

| Root (zone) | Mark (shape first) | Modifier |
|---|---|---|
| **Stone-rooted** (I) | Plates of the host rock on its back | The first 3 hits only crack the plates; ×1.4 hp |
| **Water-rooted** (II) | A dripping hem; it leaves wet cells | Leaves shallow water where it walks (slows you, calms Panic); ×1.3 hp |
| **Ledger-rooted** (III) | Ink ticks crawl over it | When hurt, writes an ✗ mark on the floor under you (3 s, a Field that slows) |
| **Ember-rooted** (IV) | Cracks of captive light | Releases into a small burst (breaks soft blocks, no damage to you if you're 2+ blocks away) |
| **Frost-rooted** (V) | A rime of pale texels | Its touch slows your casting for 2 s (a status, never trembling hands) |

A rooted projection's release shard is bigger, and it drops one more reward roll. "The deeper the root, the more light it was holding."

### 4.3 Scaling (proposal)

Player damage starts at 3.5 per intention and grows with practices; the numbers below assume that.

| Floor | Budget (`2 + floor`) | Health × | Speed × | Rooted chance | Lineage forms in the pool |
|---|---|---|---|---|---|
| 1 | 3 | 1.0 | 1.0 | 0 % | I |
| 2 | 4 | 1.1 | 1.0 | 3 % | I |
| 3 | 5 | 1.2 | 1.05 | 5 % | I, II |
| 4 | 6 | 1.3 | 1.05 | 7 % | I, II |
| 5 | 7 | 1.45 | 1.1 | 9 % | II |
| 6 | 8 | 1.6 | 1.1 | 11 % | II, III |
| 7 | 9 | 1.8 | 1.15 | 13 % | II, III |
| 8 | 10 | 2.0 | 1.15 | 15 % | III |
| 9 | 11 | 2.3 | 1.2 | 18 % | III |

Health multiplies the projection's base; contact damage stays 4 points (half a heart) on floors 1–4 and becomes 8 (a heart) only for Line, Leap and Sweep attacks from floor 5 on, so damage stays readable: **big telegraphs hurt more**.

---

## 5. The projections

Each card follows the art guide's method (§8.1): the line in the player's voice, the pattern, the need underneath, the path whose shadow it is, size and value class, a unique glyph, the behaviour and its one signature attack, how it lives with the elements, its release, and the touching moment. Health is base health on floor 1 scale (× the table in §4.3). "Mechanic nod" names the game mechanic it rhymes with, for us only: in the game nothing is named after another game.

**Glyphs in use** (each unique): `?` Doubt · `Γ` the Lectern · `✳` Panic, and those in each card below.

### 5.1 The lineages (I → II → III)

#### Doubt → Second-Guessing → Paralysis (Mind)

| | **I · Doubt** *(built)* | **II · Second-Guessing** | **III · Paralysis** |
|---|---|---|---|
| Line | "Are you sure?" | "Wait, are you *really* sure?" | "Don't move." |
| Floors | 1–4 | 3–7 | 6–9 |
| Size · husk · glyph | Medium · dark · `?` | Medium · dark · `??` (two hooks) | Tall · dark · `⊥` (a hook driven into the ground) |
| Health · cost | 12 · 1 | 26 · 2 | 50 · 3 |
| Behaviour | Walks at you, pauses to reconsider (an escape window), reaches 0.5 s before its touch hurts | Walks, and at each pause **drops a stone** from its sack: a loose cube that blocks the path (rubble you can use). Changes direction after every pause | Doesn't walk. Roots itself where it rises and casts a **tether** (a Pull): a slow cold thread that drags you toward it while you stand in its line of sight |
| Signature | Touch | Touch + obstacles | **Pull**: motes stream toward it for 0.6 s, then the thread fastens. Break it by stepping behind a block (line of sight) or by hitting the sack |
| Elements | Walks around water; its sack drags it down if it falls in (built) | Same; stones dropped in water sink and raise the floor (bridges) | Water loosens its root: in water it can be pushed |
| Release | Stands up straight: "?" becomes "!" (built) | Its sack splits; it lets the stones fall and stands up | The hook pulls out of the ground; it takes one step, its first |
| Touching moment | It never attacks on purpose; it holds on so you don't go | It leaves the stones behind so you won't walk on; released, it lets go of them | It was never holding you: it was holding the ground, because the ground was the only thing that never moved |

#### The Lectern → The Margin → The Tribunal (Mind)

| | **I · The Lectern** *(built)* | **II · The Margin** | **III · The Tribunal** |
|---|---|---|---|
| Line | "That's not good enough." | "And another thing…" | "We've all agreed." |
| Floors | 1–4 | 3–6 | 6–9 |
| Size · husk · glyph | Tall · pale · `Γ` | Tall · pale · `ΓΓ` (a page with a margin note) | Tall ×3 · pale · `Π` (three posts under one bar) |
| Health · cost | 14 · 2 | 28 · 2 | 3 × 24 · 4 |
| Behaviour | Keeps its distance, strafes, lobs ✗ judgements; ink ✗ marks on the floor for 3 s | Its ✗ marks **stay** (8 s) and become small Fields that slow you; three marks in a row join into a line that bolts across the room | Three lecterns that rise together and **fire in sequence** (left, centre, right), so the volleys sweep. **Only their backs are vulnerable** (the ✗ painted there): flank them, or knock them round with a thrown cube |
| Signature | Lob | Lob + Field | **Line** volley, three bolts in a row across the room |
| Elements | — | Water washes its marks away | Fire burns their pages: a Tribunal near flames loses its marks |
| Release | Pages fan open, blank; it bows (built) | The margin note fades; one blank page drifts down and lands at your feet | The three turn to face each other, bow, and their pages fall together, blank |
| Touching moment | It judges first because it's the most afraid of being judged | It always has one more thing to say, because it was never asked what it thought | It was never three voices. It was one, repeating itself until it sounded like everyone |

#### Panic → Alarm → Dread (Will)

| | **I · Panic** *(built)* | **II · Alarm** | **III · Dread** |
|---|---|---|---|
| Line | "Something is wrong, something is wrong." | "Everyone, something is wrong!" | "Something *will* go wrong." |
| Floors | 1–4 | 3–6 | 6–9 |
| Size · husk · glyph | Small · dark · `✳` | Small · dark · `✴` (more rays) | Medium · dark · `◎` (a ring within a ring) |
| Health · cost | 8 · 1 | 14 · 2 | 40 · 3 |
| Behaviour | Rushes, swells in three steps, bursts, breaking blocks (built) | Rushes like Panic, but its swell **sets off every Panic and Alarm within 4 blocks** after a 0.4 s delay: a chain, but a readable one (each swell is its own telegraph) | Never bursts. It hangs back and **pulses shockwaves** (rings along the floor) every 3 s, which you jump over; each ring cracks soft floor |
| Signature | Burst | Burst, chained | **Sweep**: rings across the whole room |
| Elements | Calms in water, goes off in fire (built) | Same; one in water calms the chain | In water its rings become ripples that don't hurt; in fire they grow |
| Release | Sighs, shrinks, dissolves (built) | Its rays fold in, one by one | Its rings slow and stop; the last one is a still circle on the floor that fades |
| Touching moment | Tiny and terrified, it shuts its eyes before it goes off | It warns everyone because nobody warned it | It was waiting for the bad thing so it would never be surprised again; released, nothing happens, and that's the point |

#### Procrastination → Backlog (Will)

| | **I · Procrastination** | **II–III · Backlog** |
|---|---|---|
| Line | "Later." | "I'll get to all of it. Later." |
| Floors | 2–5 | 5–9 |
| Size · husk · glyph | Medium · dark · `≡` (three crooked crates) | Tall · dark · `☰` with a leaning top (a stack about to topple) |
| Health · cost | 18 · 2 | 60 · 4 |
| Behaviour | Slow, sleepy. Hit it and it **splits** into two smaller "Laters" (two splits deep): tasks pile up. Its smallest forms are fast | Doesn't chase. **Grows a crate every 8 s** while untouched (up to 6). Throws its top crate across the room in a Lob that lands as a loose crate |
| Signature | Touch; splitting | **Lob** (crates) + growth |
| Elements | Its crates burn in fire (it splits faster) | Fire on its stack makes it collapse (all crates fall loose) |
| Release | The last crate settles into a loose crate you can carry | The stack sits down, crate by crate, into a neat pile you can carry from |
| Touching moment | It wants rest, not escape; released, it gives you the box it was holding | Everything it put off was waiting for one first step; the pile was always smaller than it looked |
| Mechanic nod | Isaac's splitting blobs | Noita's material-spawning enemies |

#### Distraction → Noise (Mind)

| | **I · Distraction** | **II · Noise** |
|---|---|---|
| Line | "Ooh, what's that?" | "Ooh! And that! And that!" |
| Floors | 1–5 | 4–9 |
| Size · husk · glyph | Small · dark · `ʌʌ` (folding wing plates) | A swarm of 5–8 tiny ones · dark · `⁘` |
| Health · cost | 6 · 1 | 4 each · 3 |
| Behaviour | An erratic flyer that circles the nearest light and never looks at you; harmless alone, a nudge into danger: its touch knocks you back | A swarm that is **drawn to your intentions**: it flies into them and swallows them (each tiny one eats one intention, then is released). It flocks around lit lamps and cleared-room light |
| Signature | Touch (knockback) | **Intention-eating**; it makes you choose when to cast |
| Elements | Drawn to fire, singed by it | A flame draws the whole swarm away for 3 s |
| Release | It lands, folds its wings, and looks at you for the first time | They settle one by one on the nearest ledge and go quiet, a row of small cold eyes closing |
| Touching moment | It only wanted something new; released, the first new thing it sees is you | Every one of them was a small wish to feel something; quiet, they were just tired |

#### Perfectionism → Not Yet (Body)

| | **II · Perfectionism** | **III · Not Yet** |
|---|---|---|
| Line | "It has to be perfect." | "Not yet. Not yet. Not yet." |
| Floors | 3–6 | 6–9 |
| Size · husk · glyph | Tall · pale shell, dark core · `⬡` (a shell around a dot) | Tall · pale shell, dark core · `⬢` |
| Health · cost | Shell 6 plates × 4, core 14 · 3 | Shell 8 plates × 6, core 24 · 4 |
| Behaviour | Takes almost no damage until you **break its plates** (each plate is a real voxel on its body, breakable by intentions, kicked cubes, bombs) | Same, and it **repairs one plate every 4 s** while its core is hidden: you must keep the pressure on, or attack the core through a gap |
| Signature | Touch (slow, heavy) | Touch + repair |
| Release | Its broken plates come back with **gold seams** (the only projection that releases into gold: the seam is yours, you broke it) | Same, and it kneels, whole and visibly mended |
| Touching moment | Under the shell there was a small rough figure that wanted to be loved without the shell | It kept repairing because it thought broken meant finished; the seams say otherwise |

#### Comparison → The Hall of Mirrors (Emotion)

| | **II · Comparison** | **III · The Hall of Mirrors** |
|---|---|---|
| Line | "They're ahead of you." | "Everyone is ahead of you." |
| Floors | 3–6 | 7–9 |
| Size · husk · glyph | Tall · dark (obsidian) · `▯` (a slab) | Three slabs · dark · `▯▯▯` |
| Health · cost | 30 · 3 | 3 × 22 · 5 |
| Behaviour | Always a little taller than you. It **copies your intentions back**: what you cast, it casts at you, mirrored and cold (your practices' shape, never their warmth) | Three mirrors that bounce intentions between them: a shot into one comes out of another. Break one and the angles change |
| Signature | **Bolt** (your own shot, mirrored) | Bolt, redirected |
| Elements | Water fogs it: in steam it can't copy | Same |
| Release | It shrinks to exactly your height and stands beside you, then dissolves | The mirrors turn to the walls; for a moment the room shows only itself |
| Touching moment | It wanted to know where you stand; released, it stands next to you, not ahead, not behind | There was only ever one person in the room |
| Mechanic nod | Isaac's mirroring enemies; enemy-owned hooks (ENTITIES M2) | — |

### 5.2 Zone I · The Cellar of Habits (floors 1–2)

The everyday patterns: running on autopilot, wanting just one more, acting before thinking, putting it away. Limbo's image is waiting at a threshold; the second circle's is a wind that never stops.

| Projection | Line · pattern · need | Path · size · husk · glyph | Behaviour and signature | Release · touching moment | Mechanic nod |
|---|---|---|---|---|---|
| **Autopilot** | "Same as always." · living by routine · to save effort | Will · medium · dark · `⟲` | **Walks a fixed loop** through the room and ignores you, until you **cross its path**: then it charges along its loop (a Line, telegraphed by its loop lighting up as a dashed trail). Put a block on its loop and it stops, confused, and turns | It stops at the block, looks up, and walks somewhere new before it dissolves · It wasn't against you; it just never looked up | Isaac's patrolling enemies |
| **Craving** | "Just one more." · wanting that never fills · to feel full | Body · medium · dark · `∪` (an open cup) | Circles you at a distance, and its open body **pulls** (a wind) everything loose toward it: cubes, bombs, pickups, you. When something reaches it, it swallows it (pickups come back on release). Then it lunges | It closes, full for the first time, and gives back what it swallowed · It wanted to be full; it only needed to stop pulling | Noita's suction, the circle of winds |
| **Impulse** | "Now!" · acting before thinking · to not miss out | Body · small · dark · `↯` | A **leaper**: crouches 0.6 s and leaps across the room to where you *will* be (it leads the target); a cold ring marks the landing. Its landing cracks soft floors | It lands softly, once, and waits · It was always afraid of being too late; released, it isn't in a hurry | Isaac's leapers |
| **Avoidance** | "Not now." · looking away from what hurts · to not feel it | Emotion · small · dark · `◘` (a block with eyes) | **Hides inside a block** of the room (spawn kind "block"): looks like the host material except for two dim eyes. Peeks out, throws a small cube (Lob), and hides. Only hittable while peeking, **or if you break its block** | Its block opens like a shell and it sits outside it · It never wanted to hurt you; it wanted not to be seen hurting | Isaac's hiding hosts |

### 5.3 Zone II · The Flooded Rooms (floors 3–4)

Feeling held down. The third circle's image is a cold, heavy rain; the fourth's is weights pushed in circles. The patterns: too much at once, never enough, holding on, the same thought again.

| Projection | Line · pattern · need | Path · size · husk · glyph | Behaviour and signature | Release · touching moment | Mechanic nod |
|---|---|---|---|---|---|
| **Undertow** | "It's too much." · being overwhelmed · to be held | Emotion · medium · dark · `≈` | A **swimmer** that lives in deep water. It rises as a **wave** and crosses the room as a wall of water (a Sweep): get above it (a gallery, a placed block, a jump) or be carried. Out of water it is slow and small | The wave lies down flat and still · It pulled you under because it was drowning too | Noita's liquid creatures |
| **Rumination** | "Again. Again. Again." · the thought that loops · to finally solve it | Mind · long (a worm of 6 segments) · dark · `∞` | A **burrower** that tunnels through the rock around the room on a **fixed loop** (you see cracks ripple across the walls and hear it travel in 3D). Bursts out across the room (a Line), bites, dives back in. Its loop is the same every time: learn it, and wait with a bomb | It surfaces and lies across the floor, a closed ring that opens · It went round and round because it thought one more lap would solve it | Noita's burrowing worms |
| **Scarcity** | "There won't be enough." · hoarding · to be safe | Will · small · dark · `◒` (a pouch) | Runs for **pickups**: keys, bombs, hearts on the floor; steals them and flees, and if it reaches a wall it burrows a pocket and hides them. **Releasing it gives back everything, plus one** | The pouch turns out and everything rolls out, plus one more · There was always enough; it just couldn't see it | Isaac's thieving greed enemies; the fourth circle's hoarders |
| **Resentment** | "I won't forget." · the grudge · to not be hurt again | Emotion · medium · dark · `ꟷ` with a hook (a held thread) | Leaves a **trail of cold, bitter pools** (a Field that slows and stings). Every 6 s it isn't hit it **grows** (+20 % health, max ×2): the longer it's held, the bigger it gets | It lets go of its thread; the pools dry up behind it · It kept every hurt so it would never be surprised by one again | Noita's slime trails |
| **Gloom** | "Everything is grey." · a heavy mood · to be left alone | Emotion · medium flyer · dark · `☁` | A cloud that hovers under the ceiling (spawn kind "ceiling") and **rains** cold drops in a wide circle (many small Lobs): you must keep moving. Can't come down; reach it with arcs, from galleries, or by building up | The rain thins and stops; a patch of floor dries · It wasn't trying to drown anyone; it was carrying more water than a cloud should | The third circle's cold rain |

### 5.4 Zone III · The Ledger Halls (floors 5–6)

Old rules and old anger: beliefs set in stone. The fifth circle's image is a marsh where anger fights on the surface and sullenness lies below; the sixth's is a walled city of stone tombs. The halls are slate and ledger stone.

| Projection | Line · pattern · need | Path · size · husk · glyph | Behaviour and signature | Release · touching moment | Mechanic nod |
|---|---|---|---|---|---|
| **Reactivity** | "How dare—!" · reacting in anger · to be respected | Body · medium · dark · `➤` | A **charger**: when you line up with it on an axis, it scrapes the floor (0.7 s, a dashed line drawn ahead of it) and **charges across the room**, smashing soft blocks in its way. It staggers 1.5 s when it hits something hard: a placed block, stone, a wall. That's the window | It stops short, a block from you, and lowers its head · It was trying to protect something; it never stopped long enough to see you weren't the threat | Isaac's chargers |
| **Sulk** | "Fine." · sullenness, anger turned inward · to be noticed without asking | Emotion · medium · dark · `▁` with two eyes | A **swimmer in mud**: lies under the marsh with only its eyes showing. When you pass within 3 blocks it **erupts** (a Burst of mud that slows), then sinks back. It never chases | It surfaces and stays up, mud running off it · It wanted someone to notice it was hurt, without having to say so | The fifth circle's marsh |
| **The Shoulds** | "I should… I should…" · rigid rules · to be good | Mind · mounted · pale · `⊣` (a bracket in a wall) | **Mounted in walls** (spawn kind "wall"), usually in pairs facing each other: they fire **bolts straight across the room** (a Line) on a rhythm, making a crossfire grid. Break the wall block around one to free it: then it's slow and weak | Freed from its wall, it falls to the floor and lies there, out of its frame · It thought the rules held the walls up; out of the wall, it was the wall that held it | Isaac's wall-mounted shooters; Noita's turrets |
| **Dogma** | "It has always been this way." · a belief set in stone · certainty | Mind · tall · pale · `▣` (a tablet) | A monolith that rises at the room's heart and **sets one rule** inside its ring (a Field, its glyph on its face): *no jumping*, *no casting*, *no carrying*, or *no standing still*. Breaking the rule hurts. **Each 25 % of its health it changes the rule**, so you adapt | Its tablet cracks down the middle; the glyph is gone · It held one rule because one rule was simpler than a world; under it, the stone is blank | — (a rule-changer, our own) |

### 5.5 Zone IV · The Furnace (floors 7–8)

Running too hot and pretending. The seventh circle's image is a burning river and burning sand; the eighth's is ten ditches where deceit hides. The furnace halls are obsidian-plum, lit by lava.

| Projection | Line · pattern · need | Path · size · husk · glyph | Behaviour and signature | Release · touching moment | Mechanic nod |
|---|---|---|---|---|---|
| **Burnout** | "I can't stop." · running past empty · to be enough | Will · medium · dark · `⇶` | Born from fire (spawn kind "element source"). **Accelerates** the whole fight: faster every second, leaving short-lived fire on the floor. After 8 s it **collapses, exhausted** (3 s, takes ×2 damage), then starts again, slower each time. The fight is **outlasting** it, not racing it | It sits down by a cold flame and the flame goes out · It never wanted to win; it wanted permission to stop | — |
| **Spark** | "Is that—? What was—?" · restlessness, always on edge · to never be caught off guard | Body · small · dark · `ϟ` | Lives on conductive blocks (ore, metal). **Jumps between them**, and two Sparks link with an **arc across the room** (a Line) for 2 s: a wall you can't cross while it's live. Break the blocks it lands on to ground it | It grounds, one last crackle, and goes still · It stayed on edge so nothing could surprise it; still, it finally rests | Noita's electric creatures |
| **Pretence** | "I'm fine." · the mask · to be accepted | Emotion · medium · pale (mask) over dark · `◠` (a smile) | A **mimic**: disguises itself as something good: a pickup, a pedestal's glow, an creature's silhouette. Within 2 blocks it opens (0.5 s, the smile splits) and bites. Its mask is hard; its back is hollow | The mask comes off and lies face up on the floor; behind it, a small honest face, briefly · It smiled so no one would ask; released, it doesn't have to | Isaac's mimics |
| **Shortcut** | "There's an easier way." · cutting corners · to not have to try | Will · small · dark · `↗` | Appears **next to locked doors and vaults**, offering a way in (it opens a crack in the wall). Walk through and the crack closes behind you: you're in a small sealed pocket with a wave. Hit it before it opens the crack and it flees | It points, honestly this time, at the real door · It wasn't lying about wanting to help; it just didn't know the long way was the way | Noita's trick rooms |

### 5.6 Zone V · The Frozen Bottom (floor 9)

Numbness and turning away from yourself. The ninth circle's image is a frozen lake: here it is ice that holds things still, never people.

| Projection | Line · pattern · need | Path · size · husk · glyph | Behaviour and signature | Release · touching moment | Mechanic nod |
|---|---|---|---|---|---|
| **Numbness** | "I don't feel anything." · shutting feeling off · to not hurt | Emotion · tall · pale (rime) · `❄` | Slow. **Freezes** what it touches: water turns to ice (walkable), loose cubes freeze in place, and its Field slows your casting. Your intentions **thaw** what it froze | The rime melts off it, drop by drop; underneath it is warm-coloured for one frame, then gone · It froze everything so nothing could hurt; the thaw hurts, and it is also the first thing it has felt | — |
| **Cynicism** | "What's the point?" · giving up before trying · to not be disappointed | Mind · medium · dark · `⊘` | Projects a **Field that drains intentions**: within its ring your intentions lose their light and drop dim at half range. Stay out of the ring and hit it from range, or carry the fight to it with thrown cubes (matter isn't affected) | Its ring shrinks to a dot and goes out · It decided nothing mattered before anything could; released, one thing did |
| **Isolation** | "Leave me alone." · withdrawing · to be safe from people | Emotion · medium · dark · `□` with a dot inside | Raises **walls of ice** across the room that split it into cells, alone with you in one. It doesn't attack much; the cells are the danger (with other projections in them). Break the ice to open them | Its last wall melts and it stands in the open · It built walls to be safe; it was the loneliest thing down here |
| **What If** | "What if I had…" · regret · to undo it | Mind · medium · translucent dark · `↺` | A **phaser** that rises from the shards of projections you've released in the room and **replays their last move** (a ghost of a charge, a lob, a burst), once each. It passes slowly through blocks | It stops replaying and lets the last shard rise · It kept the past alive so it could be done differently; it can't, and that is the release | Noita's resurrecting necromancers |

---

### 5.7 What projections leave behind (owner, 2026-10-27, proposal)

When a projection is released, it may leave **parts** of itself: its **flesh** (carne), its **heart** (corazón), its **mind** (mente) or its **essence** (esencia). Each part is a collectible thing you carry in your hand or a block slot, like a block, and its name shows on its slot. Converted allies leave nothing: they are not released, they are integrated (§1.1).

**Chances per release** (owner, 2026-10-27, tuned in play): flesh 30 %, mind 12 %, heart 5 %, essence 2 %. A rooted projection (§4.2) rolls once more. Parts are drawn from the room's RNG fork.

**Names.** Every projection names its four parts after its own pattern, so a part tells you what it was.

| Projection | Flesh | Heart | Mind | Essence |
|---|---|---|---|---|
| Doubt | Doubt's sack-stone | Doubt's pause | Doubt's question | Doubt's upright light |
| The Lectern | The Lectern's ruled page | The Lectern's ink tick | The Lectern's margin note | The Lectern's blank page |
| Panic | Panic's cracked husk | Panic's captive ember | Panic's alarm | Panic's shut eyes |

The rest are named when they are built, with the same rule: the part's noun comes from the creature's own body or pattern, never from another game. Names go through [`sotano-i18n`](../../.claude/skills/sotano-i18n/SKILL.md) in both languages.

**Where parts matter.** Agreements (§8.6) ask for them by name, so a part in the pack is a clue about the floor it came from. The farming room, the Compost, is designed in §8.8. Until those exist, parts have no use: a shop where they can be traded is a pending task ([DESIGN §13](DESIGN.md), item 8). The owner's answer is the Alembic in a laboratory, which brews parts into potions with no shop ([POTIONS.md](POTIONS.md)).

**Status (built, 2026-10-28).** The 152 parts of the 38 built projection files are in `src/content/parts.ts` (chances 30 / 12 / 5 / 2 %, rolled per release on the projection's own RNG path, [RNG.md §4](../architecture/RNG.md)). They drop as pickups and are carried in the hand, not in the inventory, which keeps only items, keys and bombs. Collecting one lifts it into the hand with the hold-up, no burst. Twelve icons (the first three projections) are by the art agent and pass the gate in `src/content/part-icons.ts`. The other 140 use a generated fallback (`bestiaryPartIcon`: the kind's shape, the source's colour) that has **not** passed the gate. Agreements, gifts and the rest of §8 are not built.

---

## 6. Bosses

### 6.1 Rules for every boss

- **Bosses are core blocks:** the big, old patterns behind the small ones ([STORY §2](STORY.md#2-the-core-metaphor-mechanic-by-mechanic)). They are built from **real breakable voxels of their floor**, with luminous socket blocks for eyes and one **core vessel** block showing captive light through its cracks; exposing and hitting it releases them (art §8.7).
- **They become architecture:** released, their blocks become a stair, a bridge, a light, a door: the way on.
- **Random by zone.** Each zone has a **pool of three**; the floor's boss is drawn from its zone's pool by the floor's seed (`floor<k>:boss`), never the same one twice in a run. Floors 5 and 9 are **keystones** with a fixed boss.
- **Three phases** (at 66 % and 33 %), each a new verb, each announced: the boss stops, the arena changes (blocks fall, water rises, walls open), a deep chord, then the new phase. Never a phase change without a pause.
- **Entrance:** the boss room seals like any room (§2.1), then the boss **rises from the room itself** with a long omen (2.5 s: the whole arena's motes converge, the floor or walls crack along the boss's outline). It looks at you first.
- **They move towards you** (owner, 2026-10-28): every phase that fires walks towards the player and keeps about three to four blocks away (`emitter` with `follow`), so a boss is never a turret you can wait out. The Shadow mirrors you instead (§6.3). **Bosses break what is at their sides** as they move (owner, 2026-10-28): the blocks around the body, never the floor under it nor the room's walls, so a boss pushes through a room instead of sticking in it.
- **Health** (floor-1 scale, ×1.35 per floor): about 140 on floor 1, 1 000 on floor 9. A health bar in the HUD, with the boss's glyph, never its name in red (red is life).
- **Rewards:** the boss practice (feature log: the boss room holds a second practice) and the way down.

### 6.2 Pools by zone

| Zone | Floors | Pool (random per seed) | Keystone |
|---|---|---|---|
| I · The Cellar of Habits | 1–2 | **Resistance**, **Inertia**, **The Insatiable** | — |
| II · The Flooded Rooms | 3–4 | **Overwhelm**, **The Hoard**, **The Downpour** | — |
| III · The Ledger Halls | 5–6 | **The Verdict**, **The Grudge**, **The Old Rule** | Floor 5: **The Threshold Guardian** (at the great pit) |
| IV · The Furnace | 7–8 | **The Furnace**, **The Impostor**, **The Many Faces** | — |
| V · The Frozen Bottom | 9 | — | Floor 9: **The Shadow** |
| The Tree (above) | L1–L3 | Direction only (§6.4) | — |

So a run meets: floors 1–2, two of the three Cellar bosses; 3–4, two of the three Flooded bosses; 5, the Threshold Guardian; 6, one Ledger boss; 7–8, two of the three Furnace bosses; 9, the Shadow.

### 6.3 Boss cards

| Boss | Pattern · need · path · glyph | Body | Phases (each one verb) | Release becomes |
|---|---|---|---|---|
| **Resistance** | The force that stops creative work · that nothing changes · Will · `▤` | A door that walks: a great slab of the floor's brick on two stubby legs | 1 **Blocks**: plants itself in front of your way, pushes, and throws cubes at you (a Lob, a 0.4 s glow in its eyes first). 2 **Walls in**: raises brick walls to cut the arena into a corridor, and keeps throwing cubes. 3 **Sits**: stops moving and grows heavier; you must break it from the top down | A stair down |
| **Inertia** *(proposal)* | Staying as you are · rest that became a stop · Body · `●` | A huge, round mass of packed earth, asleep | 1 **Sleeps**: it won't wake to intentions; you must *move* it: kick cubes, bombs. 2 **Rolls**: once woken it rolls across the arena (Line), crushing soft blocks. 3 **Gathers**: picks up loose cubes as it rolls and grows, slowing down; break its shell of gathered cubes | A ramp: the slope it rolled |
| **The Insatiable** *(proposal)* | Craving, grown old · to be full · Body · `U` | A giant open cup of stone, a maw at floor level | 1 **Inhales**: pulls the whole room toward it; feed it a bomb. 2 **Spits**: lobs back what it swallowed (cubes, debris). 3 **Hollow**: its walls crack; it can't pull any more and its core shows | A well of clean water (a heal) |
| **Overwhelm** | Too much at once · to be held · Emotion · `≋` | A tide: a wall of water with a face of foam-coloured husk | 1 **Rises**: the arena floods step by step; fight from galleries. 2 **Breaks**: crosses the arena as a wave (Sweep) every few seconds. 3 **Recedes**: the water drains; its core vessel is left stranded on the floor | Stepping stones over still water |
| **The Hoard** *(proposal)* | Holding on to everything · to be safe from lack · Will · `▦` | A mound of everything kept: crates, keys, stones, packed together | 1 **Pushes weights**: rolls great blocks across the arena in circles (the fourth circle's image), Line attacks. 2 **Clutches**: sucks pickups back from the floor. 3 **Spills**: hit enough and it bursts open, everything rolling out; find the core in the pile | A pile of loose cubes and every pickup it took, plus one |
| **The Downpour** *(proposal)* | Gloom, grown old · to be left alone · Emotion · `☂` inverted | A low ceiling of cloud the size of the arena | 1 **Rains**: wide cold rain (Lobs); build up toward it. 2 **Lowers**: comes down a block at a time; you lose height. 3 **Thins**: holes open in it; through them, its core | A shaft of light down into the room |
| **The Threshold Guardian** *(keystone, floor 5)* | The fear at the edge of change · to keep you safe from the unknown · all paths · `⊓` (a gate) | A tall gate of stone at the edge of the great pit, with arms | Two ways through (§6.5) | The arch over the great pit (light route), or a hole beside it (shadow route) |
| **The Verdict** *(proposal)* | The Tribunal, grown old · to be beyond reproach · Mind · `Ш` (a bench) | A great bench of ledger stone with seven lecterns | 1 **Accuses**: lecterns fire in sequence (Line volleys). 2 **Sentences**: ✗ marks cover the floor, leaving paths. 3 **Recesses**: the bench turns; its back, painted with a giant ✗, is open | A blank floor of ledger stone, warm once you walk on it |
| **The Grudge** *(proposal)* | Resentment, grown old · to never be hurt again · Emotion · `⌇` | Something huge under the marsh: only a long back of mud and stone shows | 1 **Waits**: surfaces where you aren't; Sulks rise around it. 2 **Erupts**: bursts of mud across the arena. 3 **Surfaces**: it has to come up to breathe; its core is in its back | A causeway across the marsh |
| **The Old Rule** *(proposal)* | Dogma, grown old: a belief from childhood · certainty · Mind · `▣▣` | A tomb-temple of stone tablets that is the arena itself | 1 **Commands**: two rules at once (Dogma's Fields). 2 **Enforces**: tablets fall from the ceiling where a rule is broken. 3 **Crumbles**: the walls carrying the rules are breakable; break the rules, literally | Tablets that become a bridge out |
| **The Furnace** *(proposal)* | Burnout, grown old · to be enough · Will · `⇶⇶` | A great furnace of obsidian and brick, its door a mouth | 1 **Feeds**: pulls loose cubes into its mouth and burns hotter (fire spreads). 2 **Blazes**: throws burning debris across the arena. 3 **Exhausted**: it has burned everything; it goes cold and cracks | A cold hearth with one ember of yours in it (a light) |
| **The Impostor** | Fear of being found out · to be safe · Emotion · `◫` | A hollow frame of brass (never gold), smiling too wide; inside, a small real figure | 1 **Performs**: imitates the bosses you've met this run (their first phase, in brass). 2 **Hides**: the frame fills with false figures; find the real one. 3 **Exposed**: the frame breaks; the small figure was the only real thing | The empty frame stands as a doorway |
| **The Many Faces** *(proposal)* | People-pleasing: a face for everyone · to be loved · Emotion · `⊙⊙⊙` | Ten masks on a ring of stone, turning (the ten ditches) | 1 **Charms**: each mask copies one projection from this floor. 2 **Swaps**: the masks change places; only the one facing away is real. 3 **Plain**: the masks fall; one plain face is left | Ten masks lying on the floor, face up, becoming stepping stones |
| **The Shadow** *(keystone, floor 9)* | Everything you don't want to see in yourself · to be seen, to come home · all paths · your own outline | Your silhouette in the room's negative, with your hands and your jumper (art §8.11) | 1 **Mirrors**: does what you do, a beat later (your intentions, cold). 2 **Reveals**: the arena's ice becomes mirrors; it shows the projections you released this run, as shadows. 3 **Stops**: it stops fighting. You don't win by hitting it: **you walk to it and stand still** for 3 s | It shrinks into your hands, which keep a thin dark ring at the wrist (state "Shadow integrated", art §9). The way into silence opens |

### 6.4 Above: the Tree (direction only)

The climb up the giant tree is not a fight against the same patterns: it is the subtle ones that come with growing. As above, so below ([COSMOLOGY](../lore/COSMOLOGY.md)): each upper floor mirrors a zone below. To be designed with the owner.

| Floor | Mirror | Patterns *(proposal)* | Boss *(proposal)* |
|---|---|---|---|
| L1 Trunk | the Roots | Striving: never high enough | **The Ladder**: a climb that keeps adding rungs |
| L2 Branches | the Ledger Halls | Pride, being above others | **The Pedestal**: it lifts you up and dares you to look down |
| L3 Leaves | the Frozen Bottom | Attachment, even to the light | **The Last Thing**: what you most want to keep; you release it by letting go of it |

---

### 6.5 The Threshold Guardian: two ways through (owner, 2026-10-27)

At the great pit of floor 5, the Guardian is the gate that asks. It lets you pass **only if you defeat it with positive intentions**. If you attack it with negative ones, it turns hostile. Both routes exist.

- **The route of light (positive).** It bars the pit (phase 1, **Bars**): its plates hold, and positive intentions soften them and mend the cracks, so no intention is wasted. Phase 2, **Tests**: it stops and asks you to keep your intention positive for 5 s (a ring of light fills while you do). A negative intention resets the ring. Phase 3, **Steps aside**: once mended, it steps out of the pit's way, its blocks become the arch over it, and you walk through. The arch is the way down.
- **The route of shadow (negative).** A negative intention turns it hostile at once. Its gate goes cold, a cold chord sounds, and its three phases become attacks: **Bars** become walls that crush (Line), **Tests** become volleys across the room, and **Steps aside** becomes charges at the edge of the pit. It is a boss fight. Released this way, it does not become an arch: the pit stays shut, and the way down is a hole you dig beside it, a hidden pocket found by digging (proposal, §13).
- **Both routes** give the boss practice (the second practice of the boss room, feature log) and the way down. Only the arch or the hole, and the codex entry, differ.

---

## 7. Creatures: the living things of the depths *(proposal)*

### 7.1 Rules

- **What they are:** instincts, curiosity, play, rest, care: what keeps living in you even with the patterns around. They are not projections and never become projections.
- **Faction `neutral`:** hostile to no one, and no one targets them (except where stated). **Intention polarity applies to them (§1.1):** a negative intention harms them, a positive one heals them. Explosions only push them gently. Owner ruling (2026-10-27): they can be harmed, and the harm is the player's choice.
- **Positive-only creatures (owner, 2026-10-28):** some creatures answer only positive intentions. A negative intention passes through them untouched: no harm and no fleeing. The **Mossling** and the **Huddler** are the first. A positive intention always reaches them (a gold burst, even when they are whole) and heals them when they are hurt.
- **They react to the room:** they vanish into the blocks when doors slam and come back when a room clears (§2.1, §2.5). Their silence and return are signals the player learns.
- **Look:** a new **side**, *the living*, needs an art ruling (§10): world materials with a **living tell**: a slow, soft, 2 × 1 glow that breathes (never a 2 × 2 eye in a socket, which is the projections' family mark).
- **Sound:** small, consonant sounds (chirps, purrs, hums) that never resolve because they never needed to.
- **No dialogue.** Some can be **befriended** (they follow you for the floor) by a gentle act: standing still near them, placing a block for them, putting out a fire near them.

### 7.2 Roster by zone

| Creature | Zone | What it stands for | What it does | What you can do with it |
|---|---|---|---|---|
| **Rootlings** | 0 Roots | Curiosity | Tiny root-shaped creatures that potter along the roots and **burrow toward hidden pockets** | Follow them to secrets; on floor 0 they also show the tutorial's next step |
| **Mosslings** | 0 Roots | Rest | Round moss creatures asleep on soft blocks | Sit (stand still) beside one for 3 s: heals a quarter heart, once per Mossling |
| **Delvers** | 0–I | Play | Small diggers that make little tunnels and pop out of them | Their tunnels show where the rock is soft; befriend one and it digs a block ahead of you now and then |
| **Chirpers** | I | Intuition, the gut feeling | Cellar crickets on walls and ceilings that sing in safe rooms and **go silent when projections are near** (including ambushes) | A warning system by ear: silence means something is coming |
| **Bubblers** | II | Breath, the body's rhythm | Small fish in deep water that release bubbles | Swim through their bubbles to refill breath |
| **Ferrybacks** | II | Being carried, support | Slow, broad swimmers on the surface of deep water | Stand on their backs to cross deep water |
| **Drifters** | III | Lightness | Floating flat creatures that ride updrafts in tall rooms | Jump on them: moving platforms to galleries and high pockets |
| **Inkmites** | III | Letting things go | Tiny mites that eat the Lectern's and the Margin's ✗ marks | They clean judgements off the floor during fights |
| **Cinderwalkers** | IV | Walking through fire without being consumed | Small creatures that walk across lava; behind them it cools to stone for a few seconds | Follow their path across lava, quickly |
| **Huddlers** | V | Warmth shared | Small round creatures that gather in groups on the ice | Stand among them to thaw (lifts the frost slow); befriended, they follow you and thaw Numbness's ice |
| **Leaflings, Star-mites** | Tree (floors 1–5) | Wonder; joining what is apart | Built: little lights that wander the leaves, and mites that wander the branches. They answer only positive intentions (§1.1) | Not yet: they would point out the teleport doors on the star map, which are not built |

**Provokable: the Boundary** *(proposal; Noita's sanctuary guardians)*. A tall, calm creature that keeps watch in vaults and practice rooms. It never moves while the room's blocks are whole. **Break the sanctuary** (its pedestal ring, its walls) and it wakes, hostile, until you leave the room or put back what you broke (place blocks in the gaps: then it sits down again). Meaning: boundaries. Not a projection: it doesn't release, it settles; it can't be hurt, only calmed.

---

## 8. Presences: the ones who speak *(proposal)*

### 8.1 Rules

- **What they are:** the parts of you that already know. Archetypes, never gods, saints, prophets, real people or figures of a tradition. They never claim authority, never give orders (their requests, §8.5, can be declined), never diagnose, never promise cures.
- **Immortal:** no health, and no damage. Positive intentions pass through them with a soft chime. Negative ones make them fall silent and turn their light away until you cast positively again (§1.1). Bombs don't move them. If you keep attacking one, it doesn't turn on you; it says one patient line and stays.
- **Two kinds:**
  - **Dwellers** are **permanent**: they live in a key place of the map, they are there every run, and they **remember you** across runs (§8.4).
  - **Messengers** **come once**: they appear on your way, say what they came to say, and vanish.
- **Look (the light side):** made of pale stone and `bone.*` tones, with **no eyes until you come close**; within 4 blocks your lantern lights them and their face appears as light held from yours (warm, because the light is yours: art pillar 2). They glow only while you listen. A Presence in the dark is just a shape.
- **Sound:** each has a soft, resolved motif; their speech is shown as text (localised, [`sotano-i18n`](../../.claude/skills/sotano-i18n/SKILL.md)), with a gentle wordless voice (no recorded words).
- **Sanctuary:** projections never enter a Presence's room and never spawn within its sanctuary ring. Their rooms never seal.

### 8.2 Dialogue design

- **Short:** at most two sentences per line, at most three lines before a choice, at most three choices.
- **They ask more than they tell** (the Socratic way): a Presence's best line is a question.
- **Lessons are paraphrases** of the practices and sources in [SOURCES.md](../lore/SOURCES.md), credited in the docs, never presented as said by a real person in the game.
- **What talking gives you:**

| Gift | What it is | Example |
|---|---|---|
| **Insight** | Knowledge: a codex page, the meaning of a projection, a map | The Cartographer marks the floor's vault |
| **Lesson** | A small, lasting change for the run, earned by a choice | The Listener: "+1 heart" or "+luck"; you choose which you need |
| **Reading** | Your run, read back to you | The Witness reads your hexagram and the patterns you released |
| **Exchange** | Letting something go to receive something | The Boatman takes a carried block to ferry you across |
| **Ally** | Integration: a released projection on your side | The Mender integrates one projection you released (§8.3) |

- **No bad endings:** no choice punishes you for being honest. The Trickster's deals cost something, and say so plainly.
- **The interface:** a card near the Presence, readable while the world keeps running (their rooms are safe), dismissed by a click (feature log: messages stay until clicked).

### 8.3 Roster and where they live

| Presence | Kind | Where (key layouts) | What it stands for | What it gives |
|---|---|---|---|---|
| **The Gardener** | Dweller | Floor 0, the roots' heart room | Care, patience, cultivation | The tutorial's voice: it teaches movement, intentions, blocks and doors in its rooms. Later runs: it remembers how far you went, and says so kindly |
| **The Listener** | Dweller | One per Tree floor (1–5), in a quiet side emanation | Being heard | Stand still beside it and talk (choose what weighs on you: one of your paths): it heals and offers a **Lesson** from that path |
| **The Cartographer** | Dweller | The central emanation of each Tree floor (the crossroads of the paths) | Knowing where you stand | Answers your question with a question; answer it (a choice) and it marks the map: the vault, the hidden pocket, or the boss |
| **The Boatman** | Dweller | Zone II, by the deepest water | Letting go to move on | Ferries you across deep water to a pocket otherwise unreachable, if you leave one thing on the shore (a block, a bomb, a key) |
| **The Mender** | Dweller | Zones III–IV, in vaults | Repair (the shattered vessels, kintsugi) | **Integrates** one projection you released on this floor: it comes back as an **ally** with gold seams for the floor (factions are built: ACTORS §4) |
| **The Witness** | Dweller | Silence, below floor 9 | Witness: seeing without judging | The last conversation before the loop to heaven: a **Reading** of your run (your hexagram, the patterns you released, the ones that held you). No reward but that |
| **The Star-reader** | Dweller | L3, the Leaves (direction) | Seeing the whole | Reads your practices as constellations; shows the teleport doors |
| **The Wanderer** | Messenger | Anywhere from floor 1, in a corridor, once or twice a run | Lessons on the way | One line of wisdom tied to a practice you hold or a projection you just released; it walks on through a wall |
| **The Trickster** | Messenger | Anywhere from floor 3, in a dead-end room | The trickster archetype: the shortcut that teaches | Offers a **deal** with a plain cost (a heart container for a quality-3 practice; your bombs for keys). You may decline. Then it laughs and is gone |
| **The Echo** | Messenger | Where your last run faded (if you reach it again) | Learning from failure | A faint copy of you that says how far you got last time, gives back one key or bomb, and fades into you |
| **The Elder** | Dweller | Zone III, a quiet vault in the Ledger Halls, with old tablets and no projections | What you were taught, and what you chose to keep of it | Asks what you were taught and which of it still holds. You answer by choosing one of your paths, and it gives a **Reading** of that belief and a **Lesson** from the path you chose. It never tells you what is true |
| **The Child** | Dweller | Zone I, the Cellar of Habits: a room of loose cubes and unfinished things | Play, and permission to make something badly | Asks you to build something with it while it watches: place three blocks, and the build becomes a **Lesson** from your Body or Emotion path (making transforms the maker, [Art Therapy](../lore/CONCEPTS.md)). Always joyful, never crying (art red line) |

**Approved by the owner (2026-10-27): the Elder and the Child**, as Presences of the roster above. Their shapes are abstract, never a human figure: the Elder is a tall light of ledger stone with no face until you come close, and the Child is a loose cluster of cubes that moves like a small animal. Their names and lines are open for the owner's ear (§13).

### 8.4 Memory across runs

Dwellers **remember**: which runs you began, how deep you went, which Lessons you chose, which projections you have released and how many times. This is meta-progression as **knowledge**, not power ([STORY §7](STORY.md#7-open-questions) question 3): new dialogue, new codex pages, the Echo, a Gardener who greets you differently. Never a permanent stat boost. Stored in a small profile save (not the run seed).

---

### 8.5 Requests from the depths (owner, 2026-10-27: approved and refined)

Some Presences ask for something in the real world, in a line of story, and then let you go on. The game is a game: nothing here is a therapy, a cure or a test of you.

**The idle window.** A request runs in an **idle window of 30 to 60 seconds**. The game waits until it sees no keys and no mouse for at least 30 s, and the window never goes past one minute. The card says what to do and that the game will wait. The player can always refuse. The game cannot know whether the player really stepped away: it only sees input, and it does not pretend otherwise.

| Request | What the player does in the window | Asked by |
|---|---|---|
| **Breathe** | A paced breath, with a gentle cue (no red countdown) | The Gardener, the Listener |
| **Be still** | Sit or stand quietly, without the game | The Listener, the Elder |
| **Write** | One line, on paper or in your head. Never recorded, sent or read | The Elder |
| **Draw** | A small sketch, of anything. Never judged | The Child |
| **Move** | Stand up and sit down, roll your shoulders, walk to another room and back | The Child, the Boatman |

**The question.** When the window closes, the Presence asks: *"Have you done it?"*

- **Yes, after at least 30 s idle:** the reward for an honest completion.
- **Yes, before 30 s idle:** a lower reward. The game never says the player lied; the check is a guess, and the game treats it as one.
- **Not yet, or not now:** the Presence waits and gives nothing. It never punishes.

**The trust meter is secret.** It is a hidden number, kept per run. It is never drawn, named or said: not in the HUD, not in the codex, not in a line of dialogue. Only the rewards show it. Developer tools may read it, and only in development builds.

- It starts at the top.
- Each early yes lowers it one step. Each honest completion raises it one step.
- It never locks progress. At the bottom you can still go on.

**Rewards vary.** A request's reward is drawn from a table by the hidden step, not a fixed amount:

| Hidden step | Reward |
|---|---|
| Top | The request's full tier (a tier 1, 2 or 3 gift, §8.7) |
| One below | The gift one tier lower (never below tier 1) |
| Two below | A plain gift: a small item of the floor you are on, or a shard of light |
| Bottom | The smallest gift, still a gift: a stone from the way. Never nothing |

Rolls come from the room's own RNG fork, so a seed plays the same ([RNG.md](../architecture/RNG.md)).

**Safety, all required:**

1. **Every request is optional** and has a "not now" answer. Saying no never blocks the way, only the reward.
2. **Every physical request has an alternative** the player can pick: seated or lying down, no hands, a quiet room, write it in your head, say it aloud. Nothing that needs a special place, strength, a partner or a tool.
3. **Gentle, never urgent.** No red timers, no startling sounds, no screen effects, no pressure. The hidden meter never shakes, flickers or distorts the HUD (art §11).
4. **No judgement, no insults, no quoting failure back.** The early yes is "the Presence noticed", never "you cheated".
5. **No therapy claims.** Breathing and stillness are offered as a practice, never as a cure. A short note in the settings says the game is not therapy, and where to find help if you are struggling (STORY §7, question 4).
6. **Private.** Writing and drawing are never saved, sent, read or judged. The game stores only the hidden number and the request count, in the run and the profile save.
7. **No camera or microphone.** Requests are played on the player's own word.
8. **Maximum one minute.** No request ever asks for longer than the idle window.

**How it fits the rules.** Presences "never give orders" (§8.1). These are requests: they can be declined, and the Presence says so kindly. This is the one exception, approved by the owner.

**Build.** The request card and the question are dialogue (localised, [`sotano-i18n`](../../.claude/skills/sotano-i18n/SKILL.md)). The idle check is a timer on input. The hidden meter is run state. It joins the Presences milestone (E5) and goes through review before it is built.

---

### 8.6 Agreements: things you bring (owner, 2026-10-27, proposal)

Some Presences make an agreement instead of asking for an action: *bring me this.* They ask for objects from the world: hard, valuable materials (obsidian, deepstone, ore veins, the stone of the roots) or **parts of projections** (flesh, heart, mind, essence, §5.7). You deliver in person, in the Presence's room. Handing the item over closes the agreement and gives its gift.

**Rules:**

- **Every request has a reason** in one line of story, and the reason fits the floor and the character of the Presence. A request that does not fit is never made.
- **It is doable with what the run offers.** The items are on the floor you are on, or one above, unless the card says "bring it from the deep". The game never asks for a part you cannot get where you are.
- **Complexity grows with depth:**

| Floors | What is asked | Example |
|---|---|---|
| 0 | One plain item | A root from the roots |
| 1–2 | One part, or one common material | The stone from a Doubt's sack |
| 3–4 | Two items, one of them hard | Obsidian, and a Lectern's ink tick |
| 5–6 | Three items, with one condition | A heart, a mind, and a block carried to the edge of the room |
| 7–9 | A set with a condition the world enforces | A flesh of a Burnout, cooled in water; an essence brought from a room with no fire |
| Silence | The Witness asks for one part of each pattern you released | (the last agreement of the run) |

- **Conditions are things the world does.** "Cooled in water", "from a room with a window", "not from a projection you converted". Polarity counts (§1.1): "a mind of a Numbness, thawed by a positive intention" uses the rule as it is.

**The agreements by Presence:**

| Presence | Floors | Asks for | Why (one line) | Gift |
|---|---|---|---|---|
| The Gardener | 0 | A root, a tuft of moss | To plant something where you were | Tier 1 |
| The Child | 1–2 | Three loose cubes of different materials | To build a small tower | Tier 1 |
| The Wanderer | 1 and up | The mind of the first pattern you met | To learn what it wanted | Tier 1 |
| The Echo | Your last run | A part you did not use | Learning from failure | Tier 1 |
| The Listener | 1–5 | A heart of a pattern you released | To know what weighs on you | Tier 1–2 |
| The Cartographer | Tree floors | One ore from every zone you crossed | To chart the floor | Tier 2 |
| The Boatman | 2–4 | A block of deep stone, to leave on the shore | The ferry takes its toll (§8.3) | Tier 2 |
| The Elder | 3–6 | A page of ledger stone and the essence of a rule | What was once held as a rule | Tier 2 |
| The Trickster | 3 and up | A trade: a heart for a practice (a plain cost) | The shortcut that teaches | Tier 2 |
| The Mender | 5–8 | Three shards of different essences, to mend a vessel | Repair (kintsugi) | Tier 3 |
| The Witness | Silence | One part of each pattern you released | To see the run whole | Tier 3, and a Covenant piece |

---

### 8.7 Gifts of the depths: the items (owner, 2026-10-27, proposal)

The Presences give **gifts**: objects with a name, a line of text and a plain effect line, like practices, shown in the inventory. Effects are designed with [`sotano-items`](../../.claude/skills/sotano-items/SKILL.md); the names here are proposals.

**Three tiers**, matching the floors of the agreements:

| Tier | Gift names (proposals) | Given by |
|---|---|---|
| 1 | Gardener's Seed · Stone from the Way · Small Promise | The Gardener, the Child, the Wanderer, the Echo |
| 2 | Listener's Ear · Cartographer's Ore · Ledger Page · Trickster's Coin | The Listener, the Cartographer, the Elder, the Boatman, the Trickster |
| 3 | Mender's Thread · Witness's Mirror | The Mender, the Witness |

**The Covenant: a closed set.** Four pieces that only these Presences give. No other source, no shop, no drop. Each piece comes from one Presence:

| Piece | From | Its meaning |
|---|---|---|
| Thread | The Mender | Repair that holds |
| Page | The Elder | The rule you chose to keep |
| Seal | The Witness | Seeing and keeping |
| Light | The Listener (after the last Lesson) | What was heard |

Holding all four completes the Covenant. Its set effect: every Presence remembers you in the run (owner, 2026-10-27).

**The common trait (owner, 2026-10-27):** **Promised.** Every gift bears a thin **gold seam** (kintsugi: what was mended is stronger, art §12). A promised item cannot be dropped, destroyed or stolen (Scarcity cannot take it), and it stays in your pack when you throw the rest away. Its label says *promised* in small type. The mark belongs only to gifts, so the player learns that a seam means "given".

**Inventory labels (owner, 2026-10-27).** Every inventory slot shows a small label with the item's name, always visible, in the player's language. This covers practices, blocks, parts, gifts and the Covenant. Labels exist only in the inventory: the world never writes names over the items you find or hold. The labels are text, so they go through [`sotano-i18n`](../../.claude/skills/sotano-i18n/SKILL.md).

---

### 8.8 The Compost: the farming room (design proposal, owner asked for it, 2026-10-27)

Parts (§5.7) and agreements (§8.6) need a steady supply, and the game must not make that supply a grind. The Compost is the room where it is made, in the open and with limits. The name is a proposal: what a pattern leaves goes back into the soil, and something grows from it.

**Where.** One Compost per zone, in a side emanation of its floors, reachable from the main path and never behind a Presence's sanctuary. Five rooms in all: Zone I (floor 1–2), II (3–4), III (5–6), IV (7–8), V (9). Each draws only from its zone's lineage (§5.2–5.6). No Presence lives here: the Compost is work, and the dwellers keep their own rooms.

**The plot.** A template with raised beds of the zone's material (6 to 8 beds). Each bed is a **spawn point** (floor seam, §2.2), and the room has two wall faces for Avoidance-type projections. Water runs in a channel in Zone II, lava in Zone IV; no channel in I, III and V. The room seals like any other room (§2.1), with the seal tone turned down to a soil rustle.

**One harvest.** A visit is one harvest: the beds spawn six projections in two waves, announced by omens (§2.3) with the same fairness rules (§2.2). Nothing is elite and no boss appears: the plot is an ordinary fight, made for the parts.

**Both ways pay.** A release leaves parts (§5.7). A conversion leaves an ally, which gives its small gift once per floor (§1.1). Force gives you parts, care gives you a friend, and the agreements need both. The Compost teaches the trade without punishing either.

**Limits (no grind).**

- **Refill at the door.** The beds refill when you leave and come back. A visit is always a fresh harvest, never a loop inside one room.
- **Three harvests per Compost per run.** The drop chances fall at each harvest: 100 % of the base table in the first, 75 % in the second, 50 % in the third (proposal, tuned in play).
- **Resting.** After the third harvest the beds rest: no spawns, the room stays calm, and each bed shows a closed cold sprout. Nothing is said. The rest is a visual, not a line of text.
- **Kept on death.** Parts already in the pack stay; a harvest cut short by death drops nothing new.

**Red lines.** No timer on screen, no kill counter, no score, no reward for repetition past the limit, no dialogue in the room, and no part that the rest of the game cannot also give: the Compost is one source among others, never the only one for an agreement (§8.6).

**Build.** After the Gardener (E5), once its zone's lineage exists (E2–E4). Art ruling needed for the bed and the closed sprout ([`sotano-art`](../../.claude/skills/sotano-art/SKILL.md)); every line and name goes through [`sotano-i18n`](../../.claude/skills/sotano-i18n/SKILL.md).

---

## 9. The codex

The inventory window gains a **codex** *(proposal)*, filled by playing:

- **Projections:** their glyph and silhouette after the first release; their *pattern* after 3 releases; their *need* after 10; their *touching moment* after you release a rooted one. Learning a pattern is learning to see it.
- **Creatures:** their name and what they do, after you first see them.
- **Presences:** every line they told you, kept.
- **Bosses:** their release image.

---

## 10. Art, sound and safety notes

- **Every projection passes the art gate** ([`sotano-art`](../../.claude/skills/sotano-art/SKILL.md)): need, glyph (unique; list in §5), four face frames, release clip, the touching moment, the meaning test, the red lines. The cards above give the need, glyph, motion, release and touching moment; faces, palettes and sounds are written per creature when it is built.
- **Art rulings needed** (art ledger §14 style, for the owner):
  1. **The living** as a fourth side for creatures: a small `living.*` ramp (moss and lichen tones, low chroma, a soft breathing glow) that must stay ΔE ≥ 15 from `cold.body`, the path hues and `life.heart` in every vision simulation.
  2. **Presences on the light side**: warm only near your lantern and while listening.
  3. **Floor 9's ice** and the Tree floors' ramps (the ledger has four ramps for ten floors).
  4. **Omen particles and the edge marker** as new uses of the cold ramp.
  5. **The art guide's rule "materialisation always at the room centre"** (§8.5) changes to "at its spawn point, announced by an omen" (this document, §2).
  6. **Intention polarity** (§1.1): a positive intention stays round and gold (the light, yours). A negative one stays round, with a darker core and a cold rim: still yours, now dark. Never a cube, which is a hostile shot. Its exact colour is the owner's ruling (§13). Converted projections keep their pattern and gain gold seams that grow with healing.
- **Safety** (art §11): no projection is a body, a person, a diagnosis or a tradition; none speaks; defeat is release; the player is never given simulated panic (Dread's rings are mechanical and telegraphed, not a screen effect). Dante: images only, never his figures, never punishment of people: the circles give each zone an *image* (wind, rain, weights, marsh, tombs, burning sand, ditches, ice), not a sentence. Patterns that touch clinical words are named in everyday language (Numbness, not a diagnosis; Panic is the pattern, not a disorder).
- **Words:** every name, line and codex text the player reads goes through `src/i18n/` in English and Spanish when it is built.

---

## 11. Architecture notes (for the build, not decided)

These are the systems this design needs. Each key one goes through the **three-party review** ([`sotano-docs` §4](../../.claude/skills/sotano-docs/SKILL.md)) before it is built.

| System | What it needs | Today |
|---|---|---|
| **Spatial audio** | A 3D sound layer: `PannerNode` per voice, listener on the camera, voice limits, occlusion later | Built for omens, breaches and door slams (`spatial` in `src/audio/sfx.ts`); occlusion and voice limits later |
| **Seal** | `roomSeal` root event; door slam animation and sound; door waits for the player's box | Doors seal with a spatial slam and dust (built); the faster door animation and `roomSeal` event are still to do |
| **Spawn points** | Template legend (`s`/`w`/`c`), generator fallback, validator for the fairness rules (§2.2) | Floor points built (`pickSpawnCell`, door and player clearance); wall, ceiling and liquid points and the template legend to do |
| **Omens** | An omen entity (point, kind, timer, particles, sound) before every spawn | Built for floor spawns (1.0 s gather, 0.2 s breach); the art gate on the omen motes is pending |
| **Room director** | Waves as data per room (triggers §2.4), seeded | Waves of at most 3, the next opens at one left, with a breath and a swell (built); the other triggers to do |
| **Movement classes** | Leaper, charger, flyer, swimmer, burrower, mounted, phaser controllers | Walker (flow field), ranged, burst |
| **Attack families** | One telegraph component per family (floor lines, landing rings, ridges) | Touch, lob, burst |
| **Rooted variants** | A modifier layer on `EnemyDef` at spawn (`enemySpawn` is already mutable) | — |
| **Zones and pools** | `LevelDef` gains `zone`; rosters and boss pools by zone; `floor<k>:boss` stream | Roster by `minFloor` |
| **Voxel bosses** | Bosses built of real blocks with a core vessel; phases; release into architecture | — |
| **Creatures** | `neutral` actors with simple behaviours, hide/return on seal/clear | Faction `neutral` exists (ACTORS §4) |
| **Intention polarity** | A `polarity` on intentions and a toggle control; warmth meter on projections; `factionChange` in both directions; ally harm and heal rules; a room clear that counts converted projections | Built (§1.1 status); creatures and presences not |
| **Presences and dialogue** | Immortal actors, sanctuary rings, a dialogue card, localised lines, a profile save | — |
| **Codex** | Release counters in the profile; a codex tab in the inventory | — |

---

## 12. Build order (proposal)

| Step | What | Why first |
|---|---|---|
| E1 | **Intention polarity (the control, positive conversion, negative harm), spatial audio, the seal, omens, spawn points and waves** *(seal, spatial sound, floor omens, waves and polarity built)* | The owner's core ask; it changes how every fight starts and reads |
| E2 | Attack families and movement classes (Line, Leap, Sweep; charger, leaper, mounted) with Zone I's projections (Autopilot, Craving, Impulse, Avoidance) and Procrastination, Distraction | Cross-room attacks; the first zone complete |
| E3 | Lineage forms II, rooted variants, Zone II projections; Creatures of floor 0 and Zone I–II | Evolution with depth becomes visible |
| E4 | Voxel bosses: Resistance, Inertia, The Insatiable; then Overwhelm, The Hoard, The Downpour; the zone pools | Random bosses by zone |
| E5 | Presences: the Gardener (floor 0), the Wanderer, the Listener, the Cartographer; the dialogue card; the codex; the Compost (§8.8) | The non-hostile layer |
| E6 | Zones III–V, the Threshold Guardian, the Shadow, the remaining Presences | The deep floors |
| E7 | The Tree's patterns and bosses | With the Tree milestone (L5) |

---

### 12.1 Status (2026-10-28)

What the game holds against this plan. "Simpler" is what was built with less than the design above.

| Area | Built | Simpler than designed | Not built |
|---|---|---|---|
| Seal, omens, waves (§2) | The seal and slam, omens on seeded floor cells, waves of at most three, the clear | Spawn points are floor cells only: no walls, ceilings or liquids | The room director beyond the basic waves (§2.4), room triggers |
| Attacks and movement (§3) | Shapes: line, ring, field, pull, sweep. Movement: walker, leaper, charger, flyer, and through-block movement (`ghost`) for phasers and burrowers | Undertow walks; it does not swim. Burrowers are the `ghost` movement, not a voxel path through the rock | Swimmer and mounted classes (§3.1) |
| Projections (§5) | 40 entries in `content/enemies/` (38 files), from Doubt, the Inner Critic and Panic to What-if | Scarcity: steals the loose keys, bombs and hearts in its room and carries them; released, it gives them back plus one (it does not burrow to hide them yet). Isolation: no ice walls. Hall of Mirrors: an intention that meets a mirror bounces along one axis (the mirror is hit, not broken, and it stays calm for a quarter second), not between three mirrors. Shortcut: no passage. Avoidance: hides out of sight while shut (no host block yet). Perfectionism: armour, not a shell. Procrastination: now splits when hit, two splits deep (its children rise at once) | Rooted variants (§4.2) |
| Creatures (§7) | Thirteen: Wonder, Rootling and Mossling (floor 0), Chirper and Delver (1–3), Bubbler and Ferryback (3–4), Drifter and Inkmite (5–6), Cinderwalker (7–8), Huddler (9), Leafling and Star-mite (Tree floors 1–5). The Mossling, Huddler, Leafling and Star-mite answer only positive intentions | None recorded | The Boundary (proposal, §7: the owner has not decided it yet) |
| Bosses (§6) | Fourteen, one per floor from its zone's pool: phases at 2/3 and 1/3, arena changes, the way down | The Threshold Guardian's two routes open the same hole (§6.5) | The separate hole of the route of light |
| Polarity (§1.1) | Projections, allies and creatures. Positive intentions heal creatures; negative ones send them into the blocks | None recorded | Presences; ally gifts at full health (§8.6); warmth decay |
| Presences and messengers (§8) | The Gardener (start room of floor 0) and one Listener on each Tree floor (1–5). They are immortal, answer only positive intentions, and talk by contact: a card with two lines (the Listener heals a quarter heart once) | Nothing | All the rest of §8.3: the Cartographer, the Boatman, the Mender, the Witness, the Star-reader, the Wanderer, the Trickster, the Echo and the Elder and the Child; the dialogue choices; the codex (§9); the Compost (§8.8); requests (§8.5); agreements (§8.6) and gifts (§8.7); the sanctuary ring |
| Art and sound (§10) | Spatial sound for omens, slams and telegraphs | None recorded | The art gate for the new beings: no separate reviewer and no gallery captures yet. The living palette (`living.*` in `content/palette.ts`) is still a proposal |
| Review | Three-party review for polarity ([reviews/polarity.md](../reviews/polarity.md)) | None recorded | Three-party review for bosses and creatures |
| Tests and sandbox | 257 tests pass. The `bestiary-smoke` scenario runs every projection in one room, and its report is saved ([SANDBOX.md](../architecture/SANDBOX.md)) | None recorded | None recorded |

**Open for the owner**

1. **Boss health.** §6.1 gives about 140 on floor 1 and 1 000 on floor 9, and ×1.35 per floor. Those two numbers contradict each other: ×1.35 for eight floors from 140 reaches about 1 540. The build follows the two ends: a curve of about ×1.28 a floor (`bossHp` in `content/bosses/index.ts`). Which one stands?
2. **The living palette** (§10) and the art gate for creatures and projections built in this iteration.
3. **Names marked *(proposal)*** (§13).

---

## 13. Owner answers (2026-10-27) and open questions

**Answered:**

1. **Creatures can be harmed, by polarity** (§1.1): negative intentions harm them, positive ones heal them. This is my reading of the owner's message; if they should be untouchable by every intention, say so.
2. **Presences are immortal** and never take damage; negative intentions silence them (§8.1).
3. **Keystone bosses**: the Threshold Guardian on floor 5 and the Shadow on floor 9 are fixed. The other floors draw from their zone's pool (§6.2).
4. **The Elder and the Child** are Presences (§8.3).
5. **Trial rooms and the Trickster's deals** are approved (§2.4, §8.3).
6. **"Transformations"** is read as the lineage forms of projections (§4.2). If the owner meant the states of being, say so.
7. **Memory across runs**: Dwellers remember you, as knowledge only, in a small profile save, never as stats (§8.4).
8. **The Threshold Guardian has two routes** (§6.5). The shadow route's outcome (the pit stays shut, a hole beside it) is my proposal.
9. **Intention polarity** with a toggle control (§1.1). Built: the key is **F** (chosen against the controls; docs/reviews/polarity.md).

**Decided (owner, 2026-10-27, second round):**

a. **Names:** "Creatures" for the non-hostile living beings (formerly "Creatures"; the owner's word was "Criaturas"). "Presences" stays.
b. **Presence voice:** text with a wordless voice.
c. **Floor 0:** pure peace, with no projections and no Boundary.
d. **Creatures at zero health under negative intentions:** they flee and vanish into the blocks until the room clears. They never die.
e. **The toggle** is on **F**. The negative intention keeps its darker colour (art §10, ruling 6).
f. **Balance numbers** in §1.1 and the shadow route: proposals, tuned in play.
p. **The common trait:** **Promised** (a gold seam, cannot be lost), §8.7.
q. **Labels:** on inventory slots only, never over items in the world (§8.7).
r. **The farming room:** designed as the Compost (§8.8).
s. **The Covenant's set effect:** every Presence remembers you in the run.
t. **The numbers:** part chances 30 / 12 / 5 / 2 % (§5.7) and the reward table (§8.5).

**Answered on requests (§8.5), 2026-10-27:**

g. **Requests, not orders:** approved. Presences ask, and the player can decline.
h. **Trust per run:** approved. The Elder may remember the result as knowledge only.
i. **Early yes:** approved as a smaller reward, never nothing.
j. **Allowed requests:** breathe, be still, write, draw, move, as listed in §8.5.

**Decided on agreements (2026-10-27), my readings, still to confirm:**

k. **Requests** run in a 30–60 s idle window, never longer than a minute. The trust meter is secret and per run; the rewards vary by its hidden step (§8.5).
l. **"Tier"** is read as the item tier, 1 to 3. **"Cierre"** is read as a closed set: the Covenant (§8.7).
m. **Parts:** every projection can leave flesh, heart, mind or essence, named after its pattern, collectible and in the inventory (§5.7).
n. **Inventory:** every slot shows a name label (§8.7).
o. **Agreements:** Presences ask for stage materials and parts, with complexity by floor, reasons that fit the floor and the character (§8.6).

**Still open:** only the agreements readings k–o, which the owner has not confirmed yet.
