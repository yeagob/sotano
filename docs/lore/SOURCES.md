# Source library

Every work, tradition, technique, therapy and game The Roots draws on. Add new references here first (see the [`sotano-lore`](../../.claude/skills/sotano-lore/SKILL.md) skill), then map their ideas in [CONCEPTS.md](CONCEPTS.md).

## Naming status

How a source may appear in the game (the rule from [STORY.md §5](../design/built/story/NAMING.md)):

| Status | Meaning | In-game name? |
|---|---|---|
| **PD** | Public domain everywhere we ship | Yes, the title itself can be an item or place name |
| **Concept** | A generic technique, practice or idea, not owned | Yes, the generic name |
| **Credit** | A modern work: copyrighted, maybe trademarked | No. Only in `inspiredBy` and in docs; in-game names use the generic idea behind it |
| **Caution** | Known or likely registered trademark, or disputed rights | No, and avoid its distinctive coined terms too |
| **Owner** | The owner's own words, credited to Santiago (Game Glover) | Yes, as a name, credited to the owner |

Statuses marked *(verify)* are our best understanding, not legal advice: check before a public release.

## Library

Each entry: id (used in docs and `inspiredBy`), kind, status, key ideas, where it shows up.

### Hermetic and contemplative traditions

| Id | Source | Kind | Status | Key ideas | In the game |
|---|---|---|---|---|---|
| `emerald-tablet` | *The Emerald Tablet* (attributed to Hermes Trismegistus) | Hermetic text | PD | "That which is below is like that which is above"; the one thing; transmutation | The structure of the world: depth and surface as mirrors ([COSMOLOGY.md](COSMOLOGY.md)); a future endgame item |
| `planetary-metals` | The seven metals of the alchemists and their planets (iron and Mars, copper and Venus, tin and Jupiter, quicksilver and Mercury, lead and Saturn, silver and the Moon, gold and the Sun), a medieval and Renaissance tradition | Alchemical correspondence | PD | As above, so below: each metal answers to a planet and a temperament; lead is the heavy, dark start of the work | The ores of the five zones, iron to lead from the top down; gold is left out, it is the player's light ([floors](../design/built/levels/floors/README.md#ores-by-zone), presences README D13a) |
| `kybalion` | *The Kybalion* (Three Initiates, 1908) | Hermetic text | PD | Seven principles: mentalism, correspondence, vibration, polarity, rhythm, cause and effect, gender; **mental transmutation** (a state is changed by moving along its own pole, not by fighting it: fear turns toward courage); **neutralising the pendulum** (the master rises above the swing of rhythm instead of being carried by it) | The principles mapped to game systems ([COSMOLOGY.md §2](COSMOLOGY.md#2-the-seven-principles-as-systems)); future: practices that shift a state along its pole, and a rhythm you learn to ride ([COSMOLOGY.md §4](COSMOLOGY.md#4-other-maps-of-the-same-world)) |
| `i-ching` | *I Ching* (*Book of Changes*, Zhou dynasty, with later commentaries) | Classic of change and divination | PD (the text; James Legge's 1882 English and Richard Wilhelm's 1924 German translations are PD; the Wilhelm/Baynes English edition of 1950 is not) *(verify)* | Change is the only constant; yin and yang lines; eight trigrams (heaven, earth, thunder, water, mountain, wind, fire, lake); 64 hexagrams as moments of a situation; changing lines turn one moment into the next; reading the moment rather than forcing it | The run seed shown and read as a hexagram (owner's decision); the trigrams as a map of the elements ([COSMOLOGY.md §4](COSMOLOGY.md#4-other-maps-of-the-same-world)); a natural companion to **Follow the Omens** |
| `kabbalah` | Kabbalah: the Jewish mystical tradition (*Sefer Yetzirah*, the *Zohar*, Isaac Luria's teachings) and its later Hermetic readings | Living mystical tradition | Concept (sensitive: a living religious tradition; use its structural ideas with respect, never sacred names of God, never as enemies or jokes) | The Tree of Life: ten emanations (sefirot) joined by 22 paths, from the crown (Keter) down to the kingdom (Malkuth); light descends and the soul climbs back; the shattering of the vessels: light too strong for its vessels broke them, and sparks fell into husks; repair (tikkun): gathering the sparks and rebuilding is each person's work, and it mends the world | Future: the Tree as the vertical map of descent and return; broken blocks as shattered vessels and the carried material as **shards**; building as repair, the game's aim to transform the world ([COSMOLOGY.md §4](COSMOLOGY.md#4-other-maps-of-the-same-world)) |
| `tao-te-ching` | *Tao Te Ching* (Lao Tzu) | Taoist classic | PD | Softness overcomes hardness; water; non-action (wu wei) | **Tao Te Ching** (piercing intentions); **Like Water**, the elephant's gift (#357, not yet accepted) |
| `zen` | Zen Buddhism | Tradition | Concept | Satori (sudden awakening); beginner's mind; the ensō circle | **Satori** (a little more of everything) |
| `siddhartha` | *Siddhartha* (Hermann Hesse, 1922) | Novel | Credit (PD in the US since 2018, not in the EU until 2033) *(verify)* | The river that teaches by listening; "I can think, I can wait, I can fast"; wisdom can't be taught, only lived | **Thinking, Waiting, Fasting**; the river as a future place in the depths |
| `golden-flower` | *The Secret of the Golden Flower* (Chinese Taoist text on inner cultivation; German translation and commentary by Richard Wilhelm, with commentary by C. G. Jung, 1929; English translation by Cary F. Baynes, 1931) | Commentary and translation | Credit for Jung's commentary (Jung died 1961: protected in the EU until 2031) and for the English 1931 edition; PD for the Chinese text and Wilhelm's translation (Wilhelm died 1930) *(verify)*. The title is not used as an in-game name | Turning the light around (Hsuan Tzu): attention withdrawn inward to find the centre; the golden flower as the awakened light that blooms when consciousness turns inward; guarding the centre in stillness; consciousness and the unconscious as forces to unite | Ideas only, not built: a practice that turns an intention back onto the player; the golden flower as an endgame symbol ([COSMOLOGY.md §3](COSMOLOGY.md#3-the-endgame-connection)); a stillness practice, built as **Guarding the Centre**, the koala's gift (#357, not yet accepted). Concepts: *Turning the light around*, *The golden flower* in [CONCEPTS.md](CONCEPTS.md) |

### Stoics and classics

| Id | Source | Kind | Status | Key ideas | In the game |
|---|---|---|---|---|---|
| `books-of-secrets` | The Renaissance books of secrets (*Secreti*, Alessio Piemontese, 1555, and the genre that followed) | Recipe books (remedies, cooking, small arts) | PD (the genre; the generic name may be used) | Knowledge kept by writing it down; recipes for the body, the kitchen and the workshop in one book; sharing what works | **Book of Secrets** (opens the Recipe Book: every potion, meal and offering; [RECIPE-BOOK](../design/built/practices/RECIPE-BOOK.md)) |
| `meditations` | *Meditations* (Marcus Aurelius) | Philosophy | PD | What's in your control; the obstacle is the way | **Stoic Resolve**; the carry-and-build mechanic ([STORY.md §2](../design/built/story/MECHANICS-AND-METAPHOR.md)) |
| `enchiridion` | *Enchiridion* (Epictetus) | Philosophy | PD | Dichotomy of control | **Stoic Resolve** |
| `seneca-letters` | *Moral Letters to Lucilius* (Seneca) | Philosophy | PD | Letting go; preparing for hardship | **Letters from a Stoic** |
| `self-reliance` | *Self-Reliance* (Ralph Waldo Emerson, 1841) | Essay | PD | Trust yourself | **Self-Reliance** |
| `as-a-man-thinketh` | *As a Man Thinketh* (James Allen, 1903) | Essay | PD | Thought shapes circumstance | **As a Man Thinketh**; the premise "intention alters reality" |

### Spiritual and transformational works (modern)

| Id | Source | Kind | Status | Key ideas | In the game |
|---|---|---|---|---|---|
| `course-in-miracles` | *A Course in Miracles* (Helen Schucman, 1976) | Spiritual text | Caution (title has been a registered trademark; copyright history disputed) *(verify)* | A miracle is a shift in perception; forgiveness as release; the ego vs. the true self; projection ("perception is a mirror, not a fact") | **Forgiveness** (projections that touch you are hurt instead of you); the idea that enemies are *projections*; future: perception-shift mechanics |
| `four-agreements` | *The Four Agreements* (don Miguel Ruiz, 1997) | Toltec-inspired guide | Caution (title is a registered trademark) *(verify)* | Be impeccable with your word; don't take anything personally; don't make assumptions; always do your best | **Nothing Personal** (contact hits often slide off you); future: one practice per agreement |
| `psychomagic` | *Psychomagic* (*Psicomagia*, Alejandro Jodorowsky, 1995) | Therapeutic art practice | Credit (the coined term is his) | The unconscious understands symbolic acts; a theatrical, poetic act can heal what talking can't | **Symbolic Act** (formerly Catharsis; thrown blocks burst); burning barrels (letting go rituals) in [ELEMENTS](../design/not-built/elements/BARREL.md) |
| `the-alchemist` | *The Alchemist* (Paulo Coelho, 1988) | Novel | Credit | Personal legend; omens; the treasure was where you started; alchemy as inner transformation | **Follow the Omens**; furnaces (alchemy) in ELEMENTS; the endgame idea that the treasure is at the start ([COSMOLOGY.md §3](COSMOLOGY.md#3-the-endgame-connection)) |
| `la-locura-lo-cura` | *La locura lo cura* (extractos) (Guillermo Borja, Editorial La Llave, 1995) | Book (Spanish) | Credit (a modern work: quoted with attribution, never used as a name) | Authenticity is showing oneself as one is, without a façade, and without judgement; it is not trying to be better, which is a duty | The quotation on page 17 of the Roots' book (the first of the old book pages, after the author's part one) (the treasure room's north wall, [BOOK-DATA §2b](../design/built/levels/roots/BOOK-DATA.md#2b-quotations)); the English is our translation |
| `campos-de-castilla` | *Campos de Castilla* (Antonio Machado, 1912), section "Proverbios y cantares", proverb XXIX, "Caminante, no hay camino" | Poetry (Spanish) | PD (Machado died in 1939; the book is public domain). The year is the book's 1912 edition; the first printing of the proverb itself is *(verify)* | The road is made by walking; the path you will never tread again; "there is no road, only wakes upon the sea" | The epigraph on page 7 of the Roots' book, in Spanish, with our English translation (`lang: "es"`); no year is given for the proverb |
| `conversations-with-god` | *Conversations with God: An Uncommon Dialogue*, Book 1 (Neale Donald Walsch, Hampton Roads, 1995; later books follow) | Spiritual dialogue | Caution (the title is likely a trademark, and the book is copyrighted) *(verify)*. Never quoted at length, never used as a name | Creation through choice: each moment is a choice that shapes experience; fear and love as the two basic states; the soul's purpose is to experience itself; forgiveness as release, not as excuse | Ideas only, not built: a choice mechanic in which the player's decisions shape a run's environment; an extension of the good and bad polarity ([COSMOLOGY.md §2](COSMOLOGY.md#2-the-seven-principles-as-systems)); a complement to **Forgiveness**. Concept: *Choice creates the moment* in [CONCEPTS.md](CONCEPTS.md) |
| `voices-beyond` | *Las voces del desierto* (Spanish title; Ediciones B, 2005) by Marlo Morgan, the translation of *Mutant Message Down Under*. The English original was self-published in 1990 or 1991 (sources differ) and later published by HarperCollins (US, 1994) and Thorsons (UK) *(verify years and publishers)* | Book, first presented as a true account of a journey with Aboriginal people; the author later acknowledged it as fiction (per a timeline, verify); the Spanish catalogue calls it a novel. Aboriginal elders and an anthropologist disputed its accuracy | **Caution**. The title may be named in the lore; it is not used in the game's text unless the owner decides. **Not an ethnographic source** for Aboriginal cultures: nothing about Aboriginal people in it is used as fact. Any use follows the rules of the indigenous section: traditions of several nations, never one community's property, and no sacred material. The Lecturalia listing gives no information on the author's credentials; a reader comment on it calls the experience false | Ideas from issue #201, not checked against the text (silence and the desert as inner space; inner voices as guides, told apart from projections by their guidance; silence as attention): these are not attributed to the book. Not built: a practice about listening to inner voices; a silent place in the depths ([COSMOLOGY.md §4b](COSMOLOGY.md#4-other-maps-of-the-same-world)). Concept: *Inner voices as guides* in [CONCEPTS.md](CONCEPTS.md). Sources: [Lecturalia](https://www.lecturalia.com/libro/21469/voces-del-desierto); [Penguin Random House](https://www.penguinrandomhouse.com/books/588584/las-voces-del-desierto--mutant-message-down-under-by-marlo-morgan/); a timeline of the book's history (creativespirits.info, seen in search results, not read in full) |
| `el-kamino-de-santiago` | *El Kamino de Santiago*: the owner's own book, written in Spanish with an AI co-author (credited in the book), told on the Roots' walls (the hidden book, pages 6 to 19) | Owner's book | Owner's own (credited, usable as a name) | Stories from a real road and what they taught; the book's own voice, and a reflection on a life made of small extraordinary things | The Roots' book ([BOOK-DATA](../design/built/levels/roots/BOOK-DATA.md)); the title is not an item name |

### Living religious traditions

| Id | Source | Kind | Status | Key ideas | In the game |
|---|---|---|---|---|---|
| `islamic-pilgrimage` | Islam: the sacred direction of prayer and the pilgrimage to Mecca (the Hajj), and the temples built in its spirit | Living religious tradition | Concept (sensitive: a living faith. Use its idea of a sacred direction and of a pilgrimage as a structural image of a long journey. Never a likeness of the Kaaba or of a real mosque, never Qur'anic text or calligraphy, never a religious figure, never an enemy or a joke. Its treatment in art and text is for the owner to approve) | A sacred direction, and a journey to a holy city that is itself the sacred act | The sacred west and the labyrinth temple, the journey to Mecca as a maze ([WEST-LABYRINTH](../design/not-built/levels/secret-rooms/WEST-LABYRINTH.md)) |

### Indigenous traditions

Living traditions of indigenous nations of the Americas are presented as traditions of several nations, never as one community's property. Sacred medicines (peyote, ayahuasca and other plants used in ceremony) are **out of scope** unless the owner decides otherwise (see [Issue #194](https://github.com/yeagob/sotano/issues/194) and [CAMINO-ROJO](../design/not-built/practices/CAMINO-ROJO.md)).

| Id | Source | Kind | Status | Key ideas | In the game |
|---|---|---|---|---|---|
| `camino-rojo` | Camino Rojo (Red Road): a modern path of self-knowledge that draws on Mesoamerican and wider indigenous Abya Yala traditions; it is taught by practitioners in Mexico, Spain and elsewhere. Its origin is not verified: one academic source describes it as a neo-shamanic movement that reworks several indigenous traditions, with some Lakota influence | Living spiritual tradition (modern movement) | Concept for the traditions and practices; the name "Camino Rojo" is a movement name, credited and not used in-game *(verify origin)* | The Earth as a living being; all beings are kin ("for all my relations"); discipline and self-observation; ceremonies as channels of release and vision | Ideas only, not built: [CAMINO-ROJO.md](../design/not-built/practices/CAMINO-ROJO.md) (interconnection, temazcal, vision quest). Concept: *All beings are kin* in [CONCEPTS.md](CONCEPTS.md) |
| `temazcal` | Temazcal (sweat lodge): a Mesoamerican purification ceremony in a sealed space of heated stones, steam, song and prayer, practised by many communities | Ceremony | Concept (cultural heritage shared across communities; not owned by one group) | Heat, steam, song and release as preparation for deeper work | Ideas only, not built: [CAMINO-ROJO.md](../design/not-built/practices/CAMINO-ROJO.md) §2 |
| `vision-quest` | Búsqueda de visión (vision quest): solitude, fasting and silence on a mountain, a practice of several Plains nations, also taken up in Camino Rojo groups | Ceremony | Concept (the practice; the term is common) | Solitude, silence and fasting as a way to hear inner clarity; the aim is learning to listen, not enduring hunger | Ideas only, not built: [CAMINO-ROJO.md](../design/not-built/practices/CAMINO-ROJO.md) §3 |

### Therapies and techniques

| Id | Source | Kind | Status | Key ideas | In the game |
|---|---|---|---|---|---|
| `constellations` | Family and systemic constellations (Bert Hellinger and later systemic practitioners) | Therapeutic method | Concept ("family constellations", "systemic constellations"); avoid founder-branded terms | Orders of love: belonging, order, balance of giving and taking; seeing the whole system; representatives | **Systemic Constellation** (seeing the whole system weakens the projections); future: rooms as systems, ancestors in the depths |
| `kintsugi` | Kintsugi: the Japanese craft of mending broken pottery with gold lacquer | Craft and principle | Concept | What was broken and mended is not hidden: the seam shows, and the piece is stronger and more itself where it broke | The gold seam of the presences' gifts; the **Mender's Thread** (the Covenant's Thread as an item); the Mender's mended ally |
| `pressure-cooker` | The "pressure cooker" model of anger and emotional release (the idea that pressure let out in time does not explode) | Psychological model | Concept ("pressure cooker model", "emotional release") | Pressure Valve: what you let out on purpose does not burst on its own |
| `controlled-burn` | Controlled (prescribed) burns in forest management: a small fire set on purpose removes the fuel for a large one | Land practice | Concept | A little fire that you light yourself keeps the big one away | Controlled Burn |
| `gestalt-insight` | The Gestalt "aha" of sudden insight (Max Wertheimer, Wolfgang Köhler) | Psychology concept | Concept ("the aha moment", "insight") | Insight arrives all at once as a whole, not step by step | Bolt from the Blue |
| `serendipity` | The word coined by Horace Walpole (letter of 1754, after "The Three Princes of Serendip") | Word | Public domain (the word) | Finding what you were not looking for, by staying open to it | Serendipity |
| `stretch` | Yoga and its stretching postures (asanas) | Practice tradition | Public domain (ancient practice) | Reaching further and opening the body, the habit of stretching | Stretch |
| `art-therapy` | Art therapy; the idea that making art transforms people | Therapy / principle | Concept | Creating gives form to what can't be said; the maker is changed by the making | **Art Therapy** (building heals you); placing blocks as creation |
| `cbt` | Cognitive behavioural therapy | Therapy | Concept | Exposure; Socratic questioning; reframing | **Exposure**, **Socratic Questioning** |
| `dbt` | Dialectical behaviour therapy | Therapy | Concept | Radical acceptance | **Radical Acceptance** |
| `psychodrama` | Psychodrama (J. L. Moreno) | Therapy | Concept | Catharsis through enactment | **Symbolic Act** |
| `posttraumatic-growth` | Post-traumatic growth (Richard Tedeschi and Lawrence Calhoun, 1996) | Psychological concept | Concept | Growth can follow a hard experience: deeper care for others, clearer priorities, new strength | **Post-Traumatic Growth** |
| `solve-et-coagula` | The alchemical formula *solve et coagula* (medieval alchemy) | Alchemy | PD | Dissolve and coagulate: one work, run in both directions | **Solve et Coagula** |
| `positive-psychology` | Gratitude journaling | Practice | Concept | Noticing what goes well | **Gratitude Journal** |
| `breathwork` | Box breathing (paced breathing) | Practice | Concept | Regulating the nervous system | **Box Breathing** |
| `somatic` | Somatic grounding | Practice | Concept | Coming back to the body | **Grounding** |
| `toxic-relationships` | Santiago (Game Glover), the owner's own words on toxic relationships | Owner's words | Owner's own (credited, usable as a name) | Some people drain you more than they give; cutting them off keeps your energy | **Cut Ties with Toxic Relationships**: the blade of light |
| `conscious-breathing` | Santiago (Game Glover), the owner's own words on conscious breathing | Owner's words | Owner's own (credited, usable as a name) | Breath gathered, held and let out at once | **Remember Breathing**: hold to gather, release a beam that burns through blocks |
| `no-impossible` | Santiago Dopazo, the owner's own line: "No hay nada imposible..." (shortened) | Owner's words | Owner's own (credited, quotable with the credit) | Nothing is impossible: a limit is a belief, and a love explosion has no limit of its own | **Dr. Launcher** and its love explosion ([DR-LAUNCHER.md](../design/built/practices/milagros/DR-LAUNCHER.md)) |
| `walk-slowly` | Santiago Dopazo, the owner's own line: «El acto más revolucionario que puedes llevar a cabo es caminar despacio» ("Firma SD") | Owner's words | Owner's own (credited, quotable with the credit) | Slowness as a choice against the hurry; slowing down lets you see what moves | **Walk Slowly**: crouched on the ground, the world runs at half speed ([WALK-SLOWLY.md](../design/built/practices/body/WALK-SLOWLY.md)) |
| `daily-meditation` | Santiago Dopazo, the owner's own line: «No hay nada más transformador que meditar cada día» ("There is nothing more transformative than meditating every day"); its origin is the Eastern meditation traditions, which the owner has not yet named | Owner's words | Owner's own (credited, quotable with the credit) | Sitting every day changes more than one long sitting; the habit is what changes you | **Daily Meditation**: every intention weighs more ([MEDITATIONS.md](../design/built/practices/will/MEDITATIONS.md)) |
| `lions-mane` | Lion's mane mushroom (*Hericium erinaceus*) | Natural history, folk tradition | Concept (a common name) | A shaggy mushroom that grows on old wood, in the dark; traditionally linked to the mind and nerves (no medical claim) | **Lion's Mane**: growing past the ceiling you were told was the limit (with the `platformers` wink) |
| `kaizen` | Kaizen | Practice | Concept | Small continuous improvement | **Kaizen** |
| `sports-psych` | Mental rehearsal (sports psychology) | Technique | Concept | Visualising before doing | **Visualization** |
| `thought-stopping` | Thought stopping (a cognitive behavioural technique) | Therapy technique | Concept | Interrupting a looping thought before it runs on | **Thought Stopping**: a projection hit freezes |
| `self-distancing` | Self-distancing (emotion-regulation research: seeing one's experience from a step back) | Psychology technique | Concept | Distance from a feeling gives room to choose | **Self-Distancing**, the panda's gift: intentions hurt more the further they fly (#357, not yet accepted) |
| `shield` | The shield as a symbol of protection (heraldry and myth) | Symbol | Concept (generic) | What protects you in the leap | **Shield**, the lion's gift, named by the owner (#357, not yet accepted) |
| `self-efficacy` | Self-efficacy (Albert Bandura, 1977) | Credit | Credit (psychology concept) | Belief in your own capacity to act changes what you dare | **Self-Efficacy**: a projection hit runs away |
| `resilience` | Resilience (developmental psychology) | Concept | Concept | Bouncing back from setbacks, and being shaped by them | **Bounce Back**: intentions rebound from blocks |
| `autosuggestion` | Autosuggestion and self-talk (Émile Coué, early 1900s) | Therapy / practice | PD (Coué died 1926) | Repeated, gentle self-statements shape what we expect | **Affirmation**: a positive intention that hits a block places a copy of it beside the block |
| `dialectic` | The dialectical method (Hegel; Socratic dialogue) | Philosophical method | PD (classical Socratic dialogue; Hegel died 1831) | A clash of opposed ideas gives a new view, and each side has its other side | **Dialectic**: a rebound splits an intention in two |
| `reframing` | Cognitive reframing (cognitive therapy) | Therapy technique | Concept | The same setback, looked at from another frame, points at what matters | **Reframing**: after a rebound an intention turns to the nearest projection |
| `insight` | Insight learning (Wolfgang Köhler, 1925) | Psychology concept | Credit (the book); Concept (the idea) | The sudden solution that jumps from one thought to the next | **Aha Moment**: arcs between projections |
| `somatic-discharge` | Somatic discharge (Peter Levine, *Waking the Tiger*, 1997) | Therapy | Credit (the book); Concept (discharge) | Energy held in the body released through movement | **Discharge**: landing sends a shockwave |
| `dowsing` | Dowsing, the folk practice of finding water and ore with a rod | Folk practice | Concept | Trusting a quiet pull toward what lies hidden | **Dowsing** |
| `eye-contact` | Eye contact in exposure and assertiveness training | Therapy technique | Concept | Looking at what you fear instead of away from it | **Eye Contact** |
| `lucid-dream` | Lucid dreaming (Frederik van Eeden, 1913) | Psychology concept | PD (van Eeden died 1932); Concept (the idea) | In a dream you know it is a dream, and the walls are yours to pass | **Lucid Dream**: pass through blocks after a bomb, key or heart |
| `tummo` | Tummo: the Tibetan inner-heat meditation (a practice of generating warmth with breath and attention) | Meditation practice | Concept | Heat made from within, enough to dry wet cloth in the snow | **Inner Fire** (negative intentions burn) |
| `firewalking` | Firewalking rituals (for example the Anastenaria of Greece and Bulgaria; sensitive: a living religious and folk tradition, used only as a structural image of walking through fear, never as a sacred practice or a joke) | Ritual tradition | Concept (sensitive) | Walking the coals is walking through fear: the fire was never the thing you were afraid of | **Firewalking** (fire never hurts you) |
| `prometheus-myth` | The myth of Prometheus (Hesiod, *Theogony* and *Works and Days*; Aeschylus, *Prometheus Bound*) | Myth | PD | Fire carried to others is not lost by the one who gives it | **Stolen Fire** (one intention in five is a fire seed) |
| `kindling` | Kindling, a growing warmth (a nod to the neuroscience kindling model) | Concept | Concept | Small sparks that grow into a fire | **Kindling**: pain lights a ring of fire |
| `attunement` | Attunement and the working alliance (Carl Rogers, 1961) | Therapy concept | Concept (rapport); credit (the book) | Two people in tune pass the current on | **Rapport**: charged cubes discharge; **Resonance**: the intentions in the room hum into the one you fire |

### Modern non-fiction (credit only)

| Id | Source | Status | In the game |
|---|---|---|---|
| `deep-work` | *Deep Work* (Cal Newport, 2016) | Credit | **Deep Focus** |
| `mindset` | *Mindset* (Carol Dweck, 2006) | Credit | **Growth Mindset** |
| `flow` | *Flow* (Mihaly Csikszentmihalyi, 1990) | Credit | **Flow** |
| `second-brain` | *Building a Second Brain* (Tiago Forte, 2022) | Credit | **Second Brain** |
| `atomic-habits` | *Atomic Habits* (James Clear, 2018); *Tiny Habits* (BJ Fogg, 2019) | Credit | **Habit Stacking** |
| `war-of-art` | *The War of Art* (Steven Pressfield, 2002) | Credit | The boss **Resistance** (planned) |
| `dual-process` | *Thinking, Fast and Slow* (Daniel Kahneman, 2011) | Credit | **Dual Process** |
| `chunking` | *The Magical Number Seven* (George A. Miller, 1956) | Credit | **Chunking** |
| `boundaries` | *Boundaries* (Henry Cloud and John Townsend, 1992) | Credit | **Boundaries** |
| `self-compassion` | *Self-Compassion* (Kristin Neff, 2011) | Credit | **Self-Compassion** |
| `sleep-hygiene` | Sleep hygiene (cognitive behavioural therapy for insomnia) | Concept | **Sleep Hygiene** |
| `bilateral-stimulation` | Bilateral stimulation, alternating left and right, as used in EMDR (Francine Shapiro, 1989). The EMDR name itself is a Credit (*verify*), used only in `inspiredBy` | Concept | **Bilateral Stimulation**: the hands take turns |
| `rule-of-three` | The rule of three: a proportion from three known terms (classical arithmetic) | PD | **Rule of Three**: each intention flies as three strands |
| `spiral-growth` | The spiral of growth: the turning spirals of shells, leaves and seed heads (phyllotaxis) | Concept | **Spiral Growth**: each intention flies as three strands on a helix; **Double Helix** with Bilateral Stimulation |

### Depth psychology and myth

| Id | Source | Status | In the game |
|---|---|---|---|
| `jung` | C. G. Jung: the shadow, the descent into the unconscious, *The Red Book* | Credit (concepts generic) | The descent into the basement; the boss **The Shadow** (planned). His commentary on *The Secret of the Golden Flower* is in `golden-flower` |
| `monomyth` | Joseph Campbell, *The Hero with a Thousand Faces* (1949) | Credit (concept generic) | Descent and return as the shape of a run; the threshold guardian (boss of floor 5, [BESTIARY](../design/built/projections/README.md)) |
| `dante` | Dante Alighieri, *Inferno* (*Divine Comedy*, c. 1308–1321) | PD (structure and images only; never his figures, never punishment of people) | The nine circles as floors 1–9 ([LEVELS](../design/built/levels/floors/CIRCLES.md)); each zone's image (winds, rain, weights, marsh, tombs, burning sand, ditches, ice) shapes its projections and bosses ([BESTIARY §4](../design/not-built/projections/ZONES.md)) |

### Fiction

| Id | Source | Status | Key ideas | In the game |
|---|---|---|---|---|
| `cosmere` | The Cosmere novels (Brandon Sanderson, 2005–) | Credit; "Cosmere" and its coined terms are the author's (Caution for names) *(verify)* | A whole broken into shards, each carrying a single intent; power that is held, carried and changes the holder | **Shards**: the owner's name for the light held in broken blocks, the material you carry and build with ([COSMOLOGY.md §4](COSMOLOGY.md#4-other-maps-of-the-same-world)); "shard" is a common word, we never use the author's coined terms |
| `lathe-of-heaven` | *The Lathe of Heaven* (Ursula K. Le Guin, 1971; Spanish title *La rueda celeste*), with the song title "With a Little Help from My Friends" (The Beatles, 1967), which the novel's hero sings to himself | Novel; song title | Credit (both modern works; the song title is named, its lyrics are never used) | A dreamer whose dreams change the world learns that no one is made whole alone; the help of friends | The ending of illumination: the friends of the run rise with the player into the Sun, and the card says no one is illuminated alone ([ILLUMINATION.md](../design/built/levels/totality/ILLUMINATION.md)); the owner's nod is the title only, never quoted in the game |
| `dune` | *Dune*, Frank Herbert (1965; a copyrighted novel, not public domain) | Fiction | Caution: copyright. Never the title, the names or the terms of the book | A desert world whose great worms live beneath the sand; riding a worm; prescience | The deep desert in the south and its great worm, ridden and calmed, or killed by an explosive in its mouth ([worm-desert](../design/built/levels/worm-desert/README.md)); the practice Prescience credits the book in its `inspiredBy` only. The title and the book's terms are never the game's names |

### Anime (credit only)

| Id | Source | Status | In the game |
|---|---|---|---|
| `dr-stone` | *Dr. Stone* (Riichi, illustrated by Boichi, anime and manga, 2017–) *(verify)* | Credit (copyrighted; cited in the lore notes only) | Nothing in the game. Dr. Launcher's lore credit is the citation "Let's go to the moon" ([DR-LAUNCHER.md](../design/built/practices/milagros/DR-LAUNCHER.md)); its names, characters, art and quotes are never used in the game |

### Works named on the book's pages

Checked on 2026-11-19 against every shipped page of `book.en.json` and `book.es.json` (tutorial pages and book pages, both languages). Only the rows below are works. Every work named on a book page must have a row here or above, added in the same change as the page ([sotano-book](../../.claude/skills/sotano-book/SKILL.md) §10).

| Work | Creator | Type | Page | Quoted or mentioned | Row |
|---|---|---|---|---|---|
| *Campos de Castilla* (1912) | Antonio Machado | Poetry | 7, the epigraph (`7-hall-n`) | Quoted | `campos-de-castilla` |
| *La locura lo cura* (1995) | Guillermo Borja | Book | 17 (`17-gift-n`) | Quoted | `la-locura-lo-cura` |
| *El Kamino de Santiago* | The owner (credited) | Book (the book on the walls) | 6, the title (`6-hall-n`) | The book itself | `el-kamino-de-santiago` |

Named elements that are not works (plants, places, figures) are in the table below.

| Element | Kind | Naming status | Page | Note | In the game |
|---|---|---|---|---|---|
| San Pedro cactus (*Echinopsis pachanoi*) | Plant | Concept (a common plant name, not owned) | 10 (`10-step-s`) | A traditional Andean plant with ritual uses in its region. Its ritual uses are not described in the game or in the docs | Not used. A plant used in ceremony falls under the sacred-medicines rule of the indigenous section (out of scope unless the owner decides); see [CAMINO-ROJO](../design/not-built/practices/CAMINO-ROJO.md) open question 7 |

Not listed, because they are not works: the saints and the Virgin in the scene of page 10, the Rainbow and the people named in the pages, and the bottled line "Like water, be gentle; like water, be strong" (page 10, unattributed: no creator is named in the text, so it has no row until the owner says whom to credit).

### Games

| Id | Game | What we take | What we never take |
|---|---|---|---|
| `isaac` | *The Binding of Isaac* | Rooms, floors, items and synergies, pools, quality, transformations; bestiary mechanics (chargers, leapers, splitters, hiding hosts, wall shooters, mimics, thieves, champions as rooted variants, challenge rooms, deals with a cost) ([BESTIARY](../design/built/projections/README.md)) | Names, characters, art, sounds, silhouettes |
| `minecraft` | *Minecraft* | Blocks, breaking and placing, materials, furnaces, chests, fluids | Textures, mob names, sounds |
| `silksong` | *Hollow Knight: Silksong* (Team Cherry, 2025) *(verify)* | A statue in the spirit of its world, as a paraphrased wink | Its names, characters, assets and exact lines |
| `noita` | *Noita* | Material interactions, secrets by knowledge, parallel worlds; creatures that live in the matter (burrowing worms, slime trails, electric creatures, resurrecting casters, sanctuary guardians that wake when you break their place) ([BESTIARY](../design/built/projections/README.md)) | Assets, names, silhouettes |
| `doom` | *Doom* | Doors that slide up as you approach | Assets |
| `space-opera` | The swords of light of space opera (*Star Wars*, Lucasfilm, 1977, and its heirs) | A blade made of light that cuts through anything | Names, sounds, designs, the word for it |
| `charged-beams` | The charged beams of dungeon crawlers (*The Binding of Isaac*'s blood beam) | Hold to charge, release a beam that passes through everything | Names, blood imagery, art |
| `platformers` | The classic 2D platformers (*Super Mario Bros.*, Nintendo, 1985, and its heirs) | The mushroom that makes you bigger, breaking bricks with your head, the princess who is "in another castle" (as a paraphrased wink) | Names, characters, sprites, music, exact quotes |

The project is meant to be full of these winks, out of love for games (see [STORY.md, A love letter to games](../design/built/story/NAMING.md)): every game we wink at gets a row here, with what we take and what we never take.
