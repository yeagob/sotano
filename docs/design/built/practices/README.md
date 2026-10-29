# Practices

Up: [built design](../README.md)

A practice is something people use to grow: a technique, a therapy, a book's idea. In the game it is an item on a pedestal, picked up in a treasure, vault or boss room. Picking it up changes what you can do and, in the story, who you are ([STORY premise](../story/PREMISE.md)). The player reads the word practice; the code calls it an item.

Each practice has two texts, shown on pickup and in the inventory: a **description** (what it means, in the story's voice) and an **effect** (what it does in the game, with numbers). Each one has a 12 by 12 pixel icon.

This folder has one document per practice, in a folder for its path. The catalogue is the code (`src/content/items/`, 45 files); these documents describe what it does. The table below is the index.

## Folders

| Folder | Path develops | Practices | State of being at three |
|---|---|---|---|
| [Body](body/README.md) | Presence, energy, nervous-system regulation | 7 | Embodied |
| [Mind](mind/README.md) | Clarity, focus, belief | 16 | Lucid |
| [Emotion](emotion/README.md) | Feeling instead of avoiding; release; compassion | 12 | Open-hearted |
| [Will](will/README.md) | Consistency, discipline, small steps compounding | 10 | Resolute |

## Index

| Practice | Path folder | Quality | Found in |
|---|---|---|---|
| [Box Breathing](body/BOX-BREATHING.md) | Body | 2 | treasure rooms, boss rewards |
| [Discharge](body/DISCHARGE.md) | Body | 2 | treasure rooms |
| [Flow](body/FLOW.md) | Body | 2 | treasure rooms, boss rewards |
| [Grounding](body/GROUNDING.md) | Body | 1 | treasure rooms |
| [Lion's Mane](body/LIONS-MANE.md) | Body | 2 | treasure rooms, boss rewards |
| [Satori](body/SATORI.md) | Body | 4 | treasure rooms, vault rooms |
| [Sleep Hygiene](body/SLEEP-HYGIENE.md) | Body | 2 | treasure rooms |
| [Aha Moment](mind/AHA-MOMENT.md) | Mind | 2 | treasure rooms |
| [As a Man Thinketh](mind/AS-A-MAN-THINKETH.md) | Mind | 4 | treasure rooms, vault rooms |
| [Chunking](mind/CHUNKING.md) | Mind | 3 | treasure rooms |
| [Cut Ties with Toxic People](mind/CUT-TIES-WITH-TOXIC-PEOPLE.md) | Mind | 4 | boss rewards |
| [Deep Focus](mind/DEEP-FOCUS.md) | Mind | 2 | treasure rooms, boss rewards |
| [Dual Process](mind/DUAL-PROCESS.md) | Mind | 2 | treasure rooms |
| [Follow the Omens](mind/FOLLOW-THE-OMENS.md) | Mind | 2 | treasure rooms |
| [Growth Mindset](mind/GROWTH-MINDSET.md) | Mind | 1 | treasure rooms, boss rewards |
| [Resonance](mind/RESONANCE.md) | Mind | 3 | treasure rooms |
| [Second Brain](mind/SECOND-BRAIN.md) | Mind | 3 | treasure rooms |
| [Socratic Questioning](mind/SOCRATIC-QUESTIONING.md) | Mind | 1 | treasure rooms |
| [Tao Te Ching](mind/TAO-TE-CHING.md) | Mind | 4 | treasure rooms, vault rooms |
| [Thinking, Waiting, Fasting](mind/THINKING-WAITING-FASTING.md) | Mind | 2 | treasure rooms |
| [Thought Stopping](mind/THOUGHT-STOPPING.md) | Mind | 3 | treasure rooms |
| [Triangulation](mind/TRIANGULATION.md) | Mind | 4 | treasure rooms, vault rooms |
| [Visualization](mind/VISUALIZATION.md) | Mind | 1 | treasure rooms, boss rewards |
| [Affirmation](emotion/AFFIRMATION.md) | Emotion | 3 | treasure rooms |
| [Art Therapy](emotion/ART-THERAPY.md) | Emotion | 2 | treasure rooms |
| [Boundaries](emotion/BOUNDARIES.md) | Emotion | 2 | treasure rooms |
| [Exposure](emotion/EXPOSURE.md) | Emotion | 2 | treasure rooms |
| [Forgiveness](emotion/FORGIVENESS.md) | Emotion | 3 | treasure rooms |
| [Gratitude Journal](emotion/GRATITUDE-JOURNAL.md) | Emotion | 1 | treasure rooms |
| [Nothing Personal](emotion/NOTHING-PERSONAL.md) | Emotion | 2 | treasure rooms |
| [Radical Acceptance](emotion/RADICAL-ACCEPTANCE.md) | Emotion | 2 | treasure rooms |
| [Rapport](emotion/RAPPORT.md) | Emotion | 2 | treasure rooms |
| [Self-Compassion](emotion/SELF-COMPASSION.md) | Emotion | 2 | treasure rooms |
| [Symbolic Act](emotion/SYMBOLIC-ACT.md) | Emotion | 3 | treasure rooms |
| [Systemic Constellation](emotion/SYSTEMIC-CONSTELLATION.md) | Emotion | 3 | treasure rooms |
| [Bounce Back](will/BOUNCE-BACK.md) | Will | 2 | treasure rooms |
| [Habit Stacking](will/HABIT-STACKING.md) | Will | 3 | treasure rooms |
| [Kaizen](will/KAIZEN.md) | Will | 2 | treasure rooms |
| [Kindling](will/KINDLING.md) | Will | 2 | treasure rooms |
| [Letters from a Stoic](will/LETTERS-FROM-A-STOIC.md) | Will | 4 | treasure rooms, vault rooms |
| [Meditations](will/MEDITATIONS.md) | Will | 4 | treasure rooms, vault rooms |
| [Remember Breathing](will/REMEMBER-BREATHING.md) | Will | 4 | boss rewards |
| [Self-Efficacy](will/SELF-EFFICACY.md) | Will | 3 | treasure rooms |
| [Self-Reliance](will/SELF-RELIANCE.md) | Will | 4 | treasure rooms, vault rooms |
| [Stoic Resolve](will/STOIC-RESOLVE.md) | Will | 2 | treasure rooms, boss rewards |

## How a practice is filed

- **Folder.** A practice sits in the folder of the first path tag its code lists. The other path tags are in its document under *Path* and in the folder's table under *Also on*. Satori carries all four paths and sits in body.
- **Quality.** Isaac-style, 0 to 4 stars. Quality 4 practices are the ones meant to be able to make a run. Built: 5 at quality 1, 21 at quality 2, 10 at quality 3, 9 at quality 4.
- **Found in.** Treasure rooms, boss rewards and the vault room. A vault is a room type with a richer pedestal; the deepest floors keep none (`src/world/floor.ts`).
- **Credit.** Every practice names its inspiration, as the STORY and SOURCES documents do. The credit is not the name: the name is a generic technique or concept, or the title of a public-domain work ([NAMING](../story/NAMING.md)).

## Weapons that replace the intention

Like in Isaac, two practices replace the intention. Remember Breathing turns it into a charged beam that burns through blocks tick by tick. Cut Ties with Toxic People adds a blade of light beside the intentions, which keep flying: the blade cuts every breakable block in reach, slices the rubble in two, and hits projections and their projectiles. Both are quality 4 and come only from boss rewards. Together they make One Clear Cut, a charged, giant blade of light that sweeps the room ([One Clear Cut](synergies/ONE-CLEAR-CUT.md)). The weapons are built in `src/combat/weapons.ts`; a practice's weapon outranks the others by a priority number.

## Synergies and states of being

- [Synergies](synergies/README.md): six combinations of two practices, built in `src/content/synergies.ts`.
- [States of being](states-of-being/README.md): the four states, reached by holding three practices of one path. They are also synergies in code, with a tag-count requirement.

## Open questions

Each document lists its own questions. The cross-cutting ones are here, with their codes.

Naming questions (the lore rule: practices are generic techniques or public-domain works; modern books and trademarks are credit only; a term coined by its author is Caution). Nothing is renamed here: each one waits for the owner.

| Code | Practice | Where | Question |
|---|---|---|---|
| N1 | Boundaries | [emotion/BOUNDARIES.md](emotion/BOUNDARIES.md) | The name is the title of a 1992 book; the lore rule allows the title only as credit. |
| N2 | Second Brain | [mind/SECOND-BRAIN.md](mind/SECOND-BRAIN.md) | The name is the title of a 2022 book; the lore rule allows the title only as credit. |
| N3 | Letters from a Stoic | [will/LETTERS-FROM-A-STOIC.md](will/LETTERS-FROM-A-STOIC.md) | May be the English title of a modern translation of Seneca (verify). |
| N4 | Growth Mindset | [mind/GROWTH-MINDSET.md](mind/GROWTH-MINDSET.md) | A term coined by the credited author (lore rule: Caution). |
| N5 | Self-Compassion | [emotion/SELF-COMPASSION.md](emotion/SELF-COMPASSION.md) | The name is the title of the credited 2011 book. |
| N6 | Radical Acceptance | [emotion/RADICAL-ACCEPTANCE.md](emotion/RADICAL-ACCEPTANCE.md) | Also the title of a 2003 book (verify); the term comes from the credited therapy. |
| N7 | Flow | [body/FLOW.md](body/FLOW.md) | The central term of the credited book; verify whether the author coined it (lore rule: Caution). |
| N8 | Habit Stacking | [will/HABIT-STACKING.md](will/HABIT-STACKING.md) | A term of the two credited books; verify whether it is coined by their authors (lore rule: Caution). |
| N9 | Cut Ties with Toxic People | [mind/CUT-TIES-WITH-TOXIC-PEOPLE.md](mind/CUT-TIES-WITH-TOXIC-PEOPLE.md) | A common self-help phrase; verify whether it is a modern book or course title. |
| N10 | Thinking, Waiting, Fasting | [mind/THINKING-WAITING-FASTING.md](mind/THINKING-WAITING-FASTING.md) | Paraphrases a line of the credited novel (not its title); the owner confirms it. |

Credit questions:

| Code | Practices | Where | Question |
|---|---|---|---|
| C1 | Cut Ties with Toxic People and Remember Breathing | mind/CUT-TIES-WITH-TOXIC-PEOPLE.md and will/REMEMBER-BREATHING.md | STORY section 5 credits William of Ockham and the Japanese martial arts; the code and SOURCES credit the owner's words (Santiago, Game Glover). The code follows SOURCES. |
| C2 | Systemic Constellation | emotion/SYSTEMIC-CONSTELLATION.md | The credit names Bert Hellinger, whose work is contested; SOURCES asks to avoid founder-branded terms. |

Scope and mechanic questions:

| Code | Subject | Where | Question |
|---|---|---|---|
| A1 | Radical Acceptance | emotion/RADICAL-ACCEPTANCE.md | Scope: bombs only (story text) or also thrown-block explosions (built). |
| F1 | Flooding (synergy) | synergies/FLOODING.md | Shatter on contact (story text) or on every block break (built). |
| S1-S4 | The four states of being | states-of-being/ | Effects in the design text and in the code differ for all four states. |

The STORY catalogue (section 5) agrees with the code for all 45 practices except the credits and the scope above.
