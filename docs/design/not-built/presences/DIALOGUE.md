[Presences](README.md)

# Dialogue

Status: **proposal** (design text, bestiary section 8.2). The built card shows two lines and no choices (see [the Listener](../../built/presences/LISTENER.md)).

What a presence says, how it asks, and what talking gives. Presences ask more than they tell: a presence's best line is a question.

## What the design asks

- **Length.** At most two sentences a line, at most three lines before a choice, at most three choices.
- **Questions.** The Socratic way: a question is worth more than an answer.
- **Lessons.** Paraphrases of the practices and sources in the lore library, credited, never presented as said by a real person.
- **What talking gives.**

| Gift | What it is | Example |
|---|---|---|
| Insight | Knowledge: a codex page, the meaning of a projection, a map | The Cartographer marks the vault |
| Lesson | A small, lasting change for the run, earned by a choice | The Listener: plus one heart, or plus luck |
| Reading | The run, read back to the player | The Witness reads the hexagram |
| Exchange | Letting something go to receive something | The Boatman takes a block to ferry the player |
| Ally | Integration of a released projection | The Mender integrates one |

- **No bad endings.** No choice punishes the player for being honest. A deal that costs something says so plainly.
- **The card.** It sits near the presence, readable while the world keeps running (a presence's room is safe), and is dismissed by a click. Messages stay until clicked.

## Open questions

- **Choices.** The build has no choices. The design's three choices per line need the card to take a choice, and the input rules (controls) to cover it.
- **Lessons.** A Lesson is a change for the run. The run's state must hold it; the item system is the nearest model (see [items](../../../architecture/ITEMS.md)).
- **Reading and Ally.** Both need run memory and the Mender's integration (see [Memory](MEMORY.md)).
- **Localisation.** Every line goes through the translations (English and Spanish) before it ships.
