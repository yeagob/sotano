# Source library

Every work, tradition, technique, therapy and game SÓTANO draws on. Add new references here first (see the [`sotano-lore`](../../.claude/skills/sotano-lore/SKILL.md) skill), then map their ideas in [CONCEPTS.md](CONCEPTS.md).

## Naming status

How a source may appear in the game (the rule from [STORY.md §5](../design/STORY.md#5-items-practices-with-real-names)):

| Status | Meaning | In-game name? |
|---|---|---|
| **PD** | Public domain everywhere we ship | Yes, the title itself can be an item or place name |
| **Concept** | A generic technique, practice or idea, not owned | Yes, the generic name |
| **Credit** | A modern work: copyrighted, maybe trademarked | No. Only in `inspiredBy` and in docs; in-game names use the generic idea behind it |
| **Caution** | Known or likely registered trademark, or disputed rights | No, and avoid its distinctive coined terms too |

Statuses marked *(verify)* are our best understanding, not legal advice: check before a public release.

## Library

Each entry: id (used in docs and `inspiredBy`), kind, status, key ideas, where it shows up.

### Hermetic and contemplative traditions

| Id | Source | Kind | Status | Key ideas | In the game |
|---|---|---|---|---|---|
| `emerald-tablet` | *The Emerald Tablet* (attributed to Hermes Trismegistus) | Hermetic text | PD | "That which is below is like that which is above"; the one thing; transmutation | The structure of the world: depth and surface as mirrors ([COSMOLOGY.md](COSMOLOGY.md)); a future endgame item |
| `kybalion` | *The Kybalion* (Three Initiates, 1908) | Hermetic text | PD | Seven principles: mentalism, correspondence, vibration, polarity, rhythm, cause and effect, gender; **mental transmutation** (a state is changed by moving along its own pole, not by fighting it: fear turns toward courage); **neutralising the pendulum** (the master rises above the swing of rhythm instead of being carried by it) | The principles mapped to game systems ([COSMOLOGY.md §2](COSMOLOGY.md#2-the-seven-principles-as-systems)); future: practices that shift a state along its pole, and a rhythm you learn to ride ([COSMOLOGY.md §4](COSMOLOGY.md#4-other-maps-of-the-same-world)) |
| `i-ching` | *I Ching* (*Book of Changes*, Zhou dynasty, with later commentaries) | Classic of change and divination | PD (the text; James Legge's 1882 English and Richard Wilhelm's 1924 German translations are PD; the Wilhelm/Baynes English edition of 1950 is not) *(verify)* | Change is the only constant; yin and yang lines; eight trigrams (heaven, earth, thunder, water, mountain, wind, fire, lake); 64 hexagrams as moments of a situation; changing lines turn one moment into the next; reading the moment rather than forcing it | The run seed shown and read as a hexagram (owner's decision); the trigrams as a map of the elements ([COSMOLOGY.md §4](COSMOLOGY.md#4-other-maps-of-the-same-world)); a natural companion to **Follow the Omens** |
| `kabbalah` | Kabbalah: the Jewish mystical tradition (*Sefer Yetzirah*, the *Zohar*, Isaac Luria's teachings) and its later Hermetic readings | Living mystical tradition | Concept (sensitive: a living religious tradition; use its structural ideas with respect, never sacred names of God, never as enemies or jokes) | The Tree of Life: ten emanations (sefirot) joined by 22 paths, from the crown (Keter) down to the kingdom (Malkuth); light descends and the soul climbs back; the shattering of the vessels: light too strong for its vessels broke them, and sparks fell into husks; repair (tikkun): gathering the sparks and rebuilding is each person's work, and it mends the world | Future: the Tree as the vertical map of descent and return; broken blocks as shattered vessels and the carried material as **shards**; building as repair, the game's aim to transform the world ([COSMOLOGY.md §4](COSMOLOGY.md#4-other-maps-of-the-same-world)) |
| `tao-te-ching` | *Tao Te Ching* (Lao Tzu) | Taoist classic | PD | Softness overcomes hardness; water; non-action (wu wei) | **Tao Te Ching** (piercing intentions) |
| `zen` | Zen Buddhism | Tradition | Concept | Satori (sudden awakening); beginner's mind; the ensō circle | **Satori** (a little more of everything) |
| `siddhartha` | *Siddhartha* (Hermann Hesse, 1922) | Novel | Credit (PD in the US since 2018, not in the EU until 2033) *(verify)* | The river that teaches by listening; "I can think, I can wait, I can fast"; wisdom can't be taught, only lived | **Thinking, Waiting, Fasting**; the river as a future place in the depths |

### Stoics and classics

| Id | Source | Kind | Status | Key ideas | In the game |
|---|---|---|---|---|---|
| `meditations` | *Meditations* (Marcus Aurelius) | Philosophy | PD | What's in your control; the obstacle is the way | **Meditations**, **Stoic Resolve**; the carry-and-build mechanic ([STORY.md §2](../design/STORY.md#2-the-core-metaphor-mechanic-by-mechanic)) |
| `enchiridion` | *Enchiridion* (Epictetus) | Philosophy | PD | Dichotomy of control | **Stoic Resolve** |
| `seneca-letters` | *Moral Letters to Lucilius* (Seneca) | Philosophy | PD | Letting go; preparing for hardship | **Letters from a Stoic** |
| `self-reliance` | *Self-Reliance* (Ralph Waldo Emerson, 1841) | Essay | PD | Trust yourself | **Self-Reliance** |
| `as-a-man-thinketh` | *As a Man Thinketh* (James Allen, 1903) | Essay | PD | Thought shapes circumstance | **As a Man Thinketh**; the premise "intention alters reality" |

### Spiritual and transformational works (modern)

| Id | Source | Kind | Status | Key ideas | In the game |
|---|---|---|---|---|---|
| `course-in-miracles` | *A Course in Miracles* (Helen Schucman, 1976) | Spiritual text | Caution (title has been a registered trademark; copyright history disputed) *(verify)* | A miracle is a shift in perception; forgiveness as release; the ego vs. the true self; projection ("perception is a mirror, not a fact") | **Forgiveness** (projections that touch you are hurt instead of you); the idea that enemies are *projections*; future: perception-shift mechanics |
| `four-agreements` | *The Four Agreements* (don Miguel Ruiz, 1997) | Toltec-inspired guide | Caution (title is a registered trademark) *(verify)* | Be impeccable with your word; don't take anything personally; don't make assumptions; always do your best | **Nothing Personal** (contact hits often slide off you); future: one practice per agreement |
| `psychomagic` | *Psychomagic* (*Psicomagia*, Alejandro Jodorowsky, 1995) | Therapeutic art practice | Credit (the coined term is his) | The unconscious understands symbolic acts; a theatrical, poetic act can heal what talking can't | **Symbolic Act** (formerly Catharsis; thrown blocks burst); burning barrels (letting go rituals) in [ELEMENTS](../design/ELEMENTS.md) |
| `the-alchemist` | *The Alchemist* (Paulo Coelho, 1988) | Novel | Credit | Personal legend; omens; the treasure was where you started; alchemy as inner transformation | **Follow the Omens**; furnaces (alchemy) in ELEMENTS; the endgame idea that the treasure is at the start ([COSMOLOGY.md §3](COSMOLOGY.md#3-the-endgame-connection)) |

### Therapies and techniques

| Id | Source | Kind | Status | Key ideas | In the game |
|---|---|---|---|---|---|
| `constellations` | Family and systemic constellations (Bert Hellinger and later systemic practitioners) | Therapeutic method | Concept ("family constellations", "systemic constellations"); avoid founder-branded terms | Orders of love: belonging, order, balance of giving and taking; seeing the whole system; representatives | **Systemic Constellation** (seeing the whole system weakens the projections); future: rooms as systems, ancestors in the depths |
| `art-therapy` | Art therapy; the idea that making art transforms people | Therapy / principle | Concept | Creating gives form to what can't be said; the maker is changed by the making | **Art Therapy** (building heals you); placing blocks as creation |
| `cbt` | Cognitive behavioural therapy | Therapy | Concept | Exposure; Socratic questioning; reframing | **Exposure**, **Socratic Questioning** |
| `dbt` | Dialectical behaviour therapy | Therapy | Concept | Radical acceptance | **Radical Acceptance** |
| `psychodrama` | Psychodrama (J. L. Moreno) | Therapy | Concept | Catharsis through enactment | **Symbolic Act** |
| `positive-psychology` | Gratitude journaling | Practice | Concept | Noticing what goes well | **Gratitude Journal** |
| `breathwork` | Box breathing (paced breathing) | Practice | Concept | Regulating the nervous system | **Box Breathing** |
| `somatic` | Somatic grounding | Practice | Concept | Coming back to the body | **Grounding** |
| `occam` | Occam's razor (William of Ockham, 14th century) | Philosophical principle | PD / Concept | Among competing explanations, prefer the one with the fewest assumptions; cut away what isn't needed | **Occam's Razor**: a blade of light that cuts everything in reach |
| `kiai` | Kiai, the focused shout of the Japanese martial arts | Practice | Concept | Gathering breath, body and intent into one released moment | **Kiai**: hold to gather, release a beam that burns through |
| `lions-mane` | Lion's mane mushroom (*Hericium erinaceus*) | Natural history, folk tradition | Concept (a common name) | A shaggy mushroom that grows on old wood, in the dark; traditionally linked to the mind and nerves (no medical claim) | **Lion's Mane**: growing past the ceiling you were told was the limit (with the `platformers` wink) |
| `kaizen` | Kaizen | Practice | Concept | Small continuous improvement | **Kaizen** |
| `sports-psych` | Mental rehearsal (sports psychology) | Technique | Concept | Visualising before doing | **Visualization** |

### Modern non-fiction (credit only)

| Id | Source | Status | In the game |
|---|---|---|---|
| `deep-work` | *Deep Work* (Cal Newport, 2016) | Credit | **Deep Focus** |
| `mindset` | *Mindset* (Carol Dweck, 2006) | Credit | **Growth Mindset** |
| `flow` | *Flow* (Mihaly Csikszentmihalyi, 1990) | Credit | **Flow** |
| `second-brain` | *Building a Second Brain* (Tiago Forte, 2022) | Credit | **Second Brain** |
| `atomic-habits` | *Atomic Habits* (James Clear, 2018); *Tiny Habits* (BJ Fogg, 2019) | Credit | **Habit Stacking** |
| `war-of-art` | *The War of Art* (Steven Pressfield, 2002) | Credit | The boss **Resistance** (planned) |

### Depth psychology and myth

| Id | Source | Status | In the game |
|---|---|---|---|
| `jung` | C. G. Jung: the shadow, the descent into the unconscious, *The Red Book* | Credit (concepts generic) | The descent into the basement; the boss **The Shadow** (planned) |
| `monomyth` | Joseph Campbell, *The Hero with a Thousand Faces* (1949) | Credit (concept generic) | Descent and return as the shape of a run |

### Fiction

| Id | Source | Status | Key ideas | In the game |
|---|---|---|---|---|
| `cosmere` | The Cosmere novels (Brandon Sanderson, 2005–) | Credit; "Cosmere" and its coined terms are the author's (Caution for names) *(verify)* | A whole broken into shards, each carrying a single intent; power that is held, carried and changes the holder | **Shards**: the owner's name for the light held in broken blocks, the material you carry and build with ([COSMOLOGY.md §4](COSMOLOGY.md#4-other-maps-of-the-same-world)); "shard" is a common word, we never use the author's coined terms |

### Games

| Id | Game | What we take | What we never take |
|---|---|---|---|
| `isaac` | *The Binding of Isaac* | Rooms, floors, items and synergies, pools, quality, transformations | Names, characters, art, sounds |
| `minecraft` | *Minecraft* | Blocks, breaking and placing, materials, furnaces, chests, fluids | Textures, mob names, sounds |
| `noita` | *Noita* | Material interactions, secrets by knowledge, parallel worlds | Assets |
| `doom` | *Doom* | Doors that slide up as you approach | Assets |
| `space-opera` | The swords of light of space opera (*Star Wars*, Lucasfilm, 1977, and its heirs) | A blade made of light that cuts through anything | Names, sounds, designs, the word for it |
| `charged-beams` | The charged beams of dungeon crawlers (*The Binding of Isaac*'s blood beam) | Hold to charge, release a beam that passes through everything | Names, blood imagery, art |
| `platformers` | The classic 2D platformers (*Super Mario Bros.*, Nintendo, 1985, and its heirs) | The mushroom that makes you bigger, breaking bricks with your head, the princess who is "in another castle" (as a paraphrased wink) | Names, characters, sprites, music, exact quotes |

The project is meant to be full of these winks, out of love for games (see [STORY.md, A love letter to games](../design/STORY.md#a-love-letter-to-games)): every game we wink at gets a row here, with what we take and what we never take.
