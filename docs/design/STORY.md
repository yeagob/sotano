# Story and metaphor

SÓTANO is a game about a person unlocking their inner potential through **intention**. Everything in it — the dungeon, the blocks, the enemies, the items, the way down and the way back up — is a metaphor for that process. This document fixes that metaphor so mechanics, names and art all point in the same direction.

## 1. Premise

A person goes down into the basement of their own mind. Down there, reality bends to intention: what you direct your will at changes. Every wall is something you once built to stay safe and that now keeps you small. Every creature is a pattern that blocks you from going after what you want. Every item is a practice — something people have used to grow: a book, a course, a technique, a therapy — and picking it up changes not only what you can do, but **who you are**.

The goal isn't to stay down there. It's to come back up to the surface changed, and live from there.

## 2. The core metaphor, mechanic by mechanic

| Mechanic | Metaphor | Why it fits |
|---|---|---|
| **Intentions** (the shot) | Focused will: attention plus purpose | They fly straight while you hold your focus, then fall: intentions without follow-through drop to the ground |
| **Breaking blocks** | Dismantling a limiting structure (a belief, a habit, an avoidance) | Some break with one look; some take sustained effort; with enough intention, everything breaks |
| **Block tiers** | How deep a limitation runs | Dirt is a passing excuse; obsidian is a core belief from childhood |
| **Loose cubes you can carry and place** | What you dismantle becomes material to build with | "The impediment to action advances action. What stands in the way becomes the way." (Marcus Aurelius) |
| **Carry limit** (1 block) | Working memory, emotional bandwidth | You can only hold so much at once; practices expand it |
| **Kicking, throwing** | Letting go; using momentum | Not everything needs to be carried |
| **Going down** | Going inward: introspection, shadow work | The deeper you go, the older and harder the material |
| **Coming back up** | Integration: bringing what you learned into daily life | The descent alone isn't the point; the hero must return |
| **Keys** | Insights | Found by breaking through something; they open places that were locked to you |
| **Bombs** | Breakthroughs | Rare, powerful, they clear a lot at once and can hurt you if you're careless |
| **Hearts** | Resilience, self-worth | You lose them when patterns hit you; practices and care restore them |
| **Doors that open as you approach** | Opportunities respond to movement | Locked ones need an insight |
| **Treasure rooms** | Moments of learning | Where a new practice is waiting |
| **Bosses** | Core blocks: the big, old patterns behind the small ones | Made of the same blocks as everything else, so they can be dismantled piece by piece |
| **Hidden pockets, side biomes** (Noita layer) | Parts of yourself you don't know yet | You only find them by digging where nobody told you to |
| **The surface** | Life after the change | What it holds is the next layer of the game |

The descent-and-return shape is the classic hero's journey (Joseph Campbell's monomyth), and the "going down into the basement" image echoes Jung's descent into the unconscious. Neither is named in the game; they are the skeleton.

## 3. The player: a state of being that evolves

The protagonist isn't a fixed character who collects gear. Items are **practices**, and each one moves the person along one or more **paths**:

| Path | What it develops | Practices on this path (examples) |
|---|---|---|
| **Body** | Presence, energy, nervous-system regulation | Grounding, breathwork, flow, movement |
| **Mind** | Clarity, focus, belief | Deep focus, visualization, growth mindset, external memory |
| **Emotion** | Feeling instead of avoiding; release; compassion | Exposure, catharsis, gratitude, radical acceptance |
| **Will** | Consistency, discipline, small steps compounding | Kaizen, habit stacking, stoic practice |

When the person holds **three practices of the same path**, they reach a new **state of being** (Isaac's "transformations"): a bigger, visible change.

| State | Path | Effect idea |
|---|---|---|
| **Embodied** | Body ×3 | Faster, harder to knock back; the hands change colour |
| **Lucid** | Mind ×3 | Intentions home in slightly; you see hidden pockets nearby |
| **Open-hearted** | Emotion ×3 | Enemies that touch you take damage too; more hearts drop |
| **Resolute** | Will ×3 | Every 10th intention is a breakthrough (a small explosion) |

In M1 these are implemented as tag-count synergies with modest effects; their visuals (hands, HUD, aura) come later.

## 4. Enemies: projections of what blocks intention

Enemies are not monsters "out there". They are **mental projections** of the patterns that stop people from going after their goals, given a body made of the same cubes as the walls. They are always **patterns, never people or diagnoses**: they represent "the voice of doubt", not "people with anxiety".

Each one behaves like the pattern it stands for, so the mechanic teaches the metaphor without text:

| Enemy | Pattern | Behaviour (and why) | Look (Vessel Light, [art guide §8](../art/ART-GUIDE.md)) |
|---|---|---|---|
| **Doubt** *(built)* | Self-doubt | Walks at you, stops now and then to reconsider (an escape window) and reaches for you for half a second before its touch can hurt. Slow, persistent, easy to outpace if you keep moving | A dark husk hunched over a sack of stones it drags, head hooked forward like a "?", forearms crossed (it holds its own elbows); cold eyes that can't hold your gaze |
| **Inner Critic** *(built)* | The judging voice | Keeps its distance, strafes, winds up and lobs "judgements" in arcs; dangerous when you stand still | The Lectern: a stack of ruled pages on a post, a mask with two slits, a quill pointing at you; on its back, an ✗ |
| **Panic** *(built)* | Anxiety spiralling into panic | Rushes towards you, swells in three steps (the alarm goes white) and **bursts**, breaking blocks around it: destructive, but it also opens paths | A tiny near-black husk, all head, hands up, with captive light showing through hairline cracks |
| **Procrastination** *(next)* | Putting things off | Slow blob; when you hit it, it splits into smaller ones (tasks pile up) | Translucent green cube |
| **Distraction** *(next)* | Scattered attention | Erratic flyer; never threatening alone, deadly when you lose focus | Small fluttering cube with a glow |
| **Perfectionism** *(next)* | "Not good enough yet" | Armoured; takes almost no damage until you break its shell blocks first | Polished stone golem |
| **Comparison** *(next)* | Measuring yourself against others | A mirror: copies your intentions back at you | Reflective obsidian figure |

**Bosses** (later): **Resistance** (the force that stops creative work; Pressfield's term), **The Impostor**, **The Shadow** (Jung). Each built from breakable voxels, with phases that mirror how that pattern fights back.

Rooms are cleared like in Isaac: entering a room with enemies **slams its doors shut** until every projection is gone. Projections come from inside, never through the doors: they **rise from the room's own matter** (its floor, walls, ceiling, water or fire) at spawn points, each one **announced by an omen** (particles and a spatial sound) before it exists, sometimes in waves (owner, 2026-10-27; this replaces "always at the centre of the room"). The whole bestiary, its evolution with depth, the bosses by zone, and the two non-hostile kinds of beings (**inhabitants**, the living creatures of the depths, and **presences**, immortal beings you can talk to) are designed in [BESTIARY.md](BESTIARY.md). Intentions have a **polarity**: positive ones mend projections and can turn them to your side; negative ones wound everything that is yours too, inhabitants included ([BESTIARY §1.1](BESTIARY.md#11-intention-polarity-owner-2026-10-27)). Future projections tied to elements (see [ELEMENTS.md](ELEMENTS.md)): **Burnout** (fire), **Overwhelm** (deep water), **Stagnation** (mud), **Spark** (electricity).

## 5. Items: practices with real names

Items are named after **techniques, practices and concepts** that people use to unlock their potential: from books, courses, therapies and contemplative traditions. Each item says what inspired it.

### Naming rules (important for an open-source game)

- **In-game names are generic technique or concept names** ("Exposure", "Kaizen", "Box Breathing", "Deep Focus"), or titles of **public-domain works** (Marcus Aurelius' *Meditations*, Seneca, Epictetus, Lao Tzu, Emerson, James Allen's *As a Man Thinketh*).
- **Modern books, courses and branded methods** are credited only as the inspiration, in the item's `inspiredBy` field and in this document, never as the item's name. Some of them are registered trademarks (for example the Pomodoro Technique®, Getting Things Done®, the Wim Hof Method®, *The 7 Habits*®), so using them as names in a public game would be asking for trouble.
- Tone: respectful. Practices aren't magic cures, and therapies aren't jokes. Descriptions say what the practice *is about*, in one line, alongside what it *does* in the game.

### Current catalogue

Quality is Isaac-style, 0–4 stars. Quality-4 practices are meant to be able to make a run.

| Item | Path | Q | Game effect | Inspired by |
|---|---|---|---|---|
| **Stoic Resolve** | Will | 2 | +2 damage, heavier and bigger intentions | Marcus Aurelius, *Meditations*; Epictetus, *Enchiridion* |
| **Deep Focus** | Mind, Will | 2 | ×2 mining, ×0.8 damage | *Deep Work* (Cal Newport) |
| **Kaizen** | Will | 2 | Intentions go on through two soft blocks | Kaizen: continuous small improvement |
| **Habit Stacking** | Will | 3 | Breaking a block damages its same-material neighbours | Habit stacking (*Atomic Habits*, James Clear; *Tiny Habits*, BJ Fogg) |
| **Second Brain** | Mind | 3 | Carry one more block (shown in your other hand) | *Building a Second Brain* (Tiago Forte); external memory |
| **Exposure** | Emotion, Body | 2 | Every block you press against wears away (20 damage per second, armor counts), never the ones below | Exposure therapy (CBT) |
| **Symbolic Act** | Emotion | 3 | Thrown blocks burst on impact | *Psychomagic* (Alejandro Jodorowsky); catharsis in psychodrama |
| **Growth Mindset** | Mind | 1 | Jump much higher | *Mindset* (Carol Dweck) |
| **Flow** | Body | 2 | Move and cast faster | *Flow* (Mihaly Csikszentmihalyi) |
| **Visualization** | Mind | 1 | Intentions fly further and faster | Mental rehearsal in sports psychology |
| **Grounding** | Body | 1 | Kick twice as hard | Somatic grounding techniques |
| **Gratitude Journal** | Emotion | 1 | +luck: cleared rooms reward you more often | Gratitude journaling (positive psychology) |
| **Box Breathing** | Body, Emotion | 2 | +1 heart container, heals fully | Box breathing (paced breathing) |
| **Radical Acceptance** | Emotion | 2 | Your own breakthroughs (bombs) don't hurt you | Radical acceptance (Dialectical Behaviour Therapy) |
| **Socratic Questioning** | Mind | 1 | +2 keys now; locked doors sometimes open without one | Socratic questioning (CBT) |
| **Meditations** | Will, Mind | 4 | ×3 damage, +2 damage | Marcus Aurelius, *Meditations* (public domain) |
| **Self-Reliance** | Will | 4 | ×2 fire rate, +1.5 damage | Ralph Waldo Emerson, *Self-Reliance* (public domain) |
| **Tao Te Ching** | Mind, Emotion | 4 | Intentions pass through five blocks of any kind, damaging each; ×1.5 mining | Lao Tzu, *Tao Te Ching* (public domain) |
| **As a Man Thinketh** | Mind | 4 | ×4 mining, ×1.5 damage, faster and flatter intentions | James Allen, *As a Man Thinketh* (public domain) |
| **Letters from a Stoic** | Will, Body | 4 | Carry three more blocks, ×2 kick and throw, +2 reach | Seneca, *Moral Letters to Lucilius* (public domain) |
| **Satori** | All four | 4 | A little more of everything (damage, fire rate, speed, range, jump, luck, mining) | Satori, sudden awakening in Zen Buddhism |
| **Forgiveness** | Emotion | 3 | Projections that touch you take 4 damage; half their contact hits are ignored | *A Course in Miracles* (Helen Schucman) |
| **Nothing Personal** | Emotion, Mind | 2 | Two in three contact hits do nothing | *The Four Agreements* (don Miguel Ruiz) |
| **Systemic Constellation** | Emotion, Mind | 3 | Projections materialise with 30% less health, 15% slower | Family and systemic constellations (Bert Hellinger and others) |
| **Art Therapy** | Emotion, Body | 2 | Each block you place has a 20% chance to heal half a heart | Art therapy; art transforms the maker |
| **Thinking, Waiting, Fasting** | Mind, Will | 2 | Range ×1.25, +0.6 s recovery, +1 luck | *Siddhartha* (Hermann Hesse) |
| **Follow the Omens** | Mind, Emotion | 2 | +1 luck; every cleared room leaves a reward | *The Alchemist* (Paulo Coelho) |
| **Occam's Razor** | Mind | 4 | Adds a blade of light beside your intentions: it cuts every block in reach and slices the rubble in two, hits projections ×3 and destroys their projectiles (boss) | Occam's razor (William of Ockham); a wink at the swords of light of space opera |
| **Kiai** | Will | 4 | Replaces intentions with a charged beam that burns through blocks, 10 ticks a second (boss) | Kiai, the focused shout of Japanese martial arts; a wink at the charged beams of dungeon crawlers |
| **Lion's Mane** | Body | 2 | Jump height ×2; your head breaks tier-1 blocks (dirt, crates, stone, brick) | The lion's mane mushroom; a wink at the platformers that taught a generation to jump |

Every practice has two texts: a **description** (what it means, in the story's voice) and an **effect** (what it does in the game, plainly, with numbers). Both are shown on pickup and in the inventory. References and their naming status live in [../lore/SOURCES.md](../lore/SOURCES.md).

Each practice has a 12×12 pixel-art icon (shown on its pedestal, in the pickup banner, held up in your hands when you take it, and in the inventory window).

### Synergies

| Synergy | Requires | Effect |
|---|---|---|
| **One Clear Cut** | Occam's Razor + Kiai | Charge and release a giant blade of light that sweeps 140° and cuts everything in it |
| **Somatic Release** | Symbolic Act + Grounding | Kicked blocks burst too |
| **Compound Effect** | Kaizen + Deep Focus | Pierce through stone and brick as well |
| **Flooding** | Exposure + Habit Stacking | Blocks you shatter by contact break their neighbours outright |
| **Embodied** | 3 Body practices | State of being: ×1.15 speed, ×1.3 kick |
| **Lucid** | 3 Mind practices | State of being: ×1.25 range, +1 reach |
| **Open-hearted** | 3 Emotion practices | State of being: +2 luck |
| **Resolute** | 3 Will practices | State of being: ×1.15 damage, ×1.2 mining |

### Gifts and parts (planned)

Projections leave **parts** (flesh, heart, mind, essence) that are items, and some Presences make **agreements** for them. Their gifts come in three tiers and a closed set, the Covenant; every gift is marked *promised* by a gold seam. Design: [BESTIARY.md §5.7 and §8.5–§8.7](BESTIARY.md).

## A love letter to games

SÓTANO is made by people who grew up inside games, and it says so. The project will be **full of references to other games**, as an expression of love for that culture: winks, not copies.

- **How:** a phrase that echoes a famous line, a mechanic that feels like an old friend, a situation a player of that game will smile at. Lion's Mane is the model: a humble mushroom that makes you jump higher and break bricks with your head, and now and then a toast that says *"Thank you! But your ceiling is in another castle."* Nobody is named; everyone who played it knows.
- **Never:** names, characters, logos, assets, music, sprites, exact layouts or trademarks of another game (Nintendo, Mojang, Isaac, Noita…). The wink lives in the idea and the wording, never in protected material. Quotes are short paraphrases, at most one line.
- **Always the metaphor first:** a reference must still mean something in SÓTANO's story (the mushroom is about growing past the ceiling you were told was the limit). If the only reason is the joke, it isn't ready.
- **Where:** item `messages` (toasts), descriptions, `inspiredBy` ("a nod to…"), room names and secrets. The game references we draw on are catalogued in [../lore/SOURCES.md](../lore/SOURCES.md#games).

## 6. Words used in the game

| Concept | In-game word |
|---|---|
| The shot | Intention |
| Keys | Keys (art: a key with an eye; "insight" in descriptions) |
| Bombs | Bombs (art: a glowing seed; "breakthrough" in descriptions) |
| Hearts | Hearts |
| Items | Practices (shown as items on pedestals) |
| Enemies | Projections |
| Transformations | States of being |

## 7. Open questions

1. **Protagonist identity.** Gender-neutral and faceless (first person) by default. Do we ever show them? (Recommendation: only their hands, which change with their state of being.)
2. **The surface.** What does "living from there" look like as a game layer? (Left open on purpose, as in the design doc.)
3. **Death.** Losing all hearts: "the intention faded" and the run restarts. Could the next run carry a small insight (meta-progression as *knowledge*)? This fits pillar 4 of the design.
4. **Resources.** Should the game link to real mental-health resources in its menu? (Recommendation: yes, a short, sober "if you're struggling" link, since we use therapy names.)
