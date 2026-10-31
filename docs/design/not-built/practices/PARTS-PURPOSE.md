# What parts are for

Up: [not-built practices](README.md)

Status: idea (the question is open; the potions proposal is a candidate answer, not a decision).

## What a part is today

A projection leaves a part when it is released: flesh, heart, mind or essence, named after the pattern it came from. A part takes a hand slot the way a block does: you walk onto one and it lifts into a free slot, and you place or throw it. Parts are not practices, they have no effect, and the design says no inventory window lists them. Code: `src/content/parts.ts` and the pickup in the game loop. The header of the parts module is not consistent about the inventory: it says parts sit in the inventory and then that they never enter it. The design text is the one followed here.

Each release rolls the four kinds independently: flesh 30% of the time, mind 12%, heart 5% and essence 2%.

## Why it is open

A part with no effect and a hand slot is weight. The owner's pending task asks for a purpose ([SHOP](SHOP.md) and [DESIGN, section 13](../player/SHOP.md)).

The design has several candidate uses, none decided:

- **Agreements.** Some presences ask for parts by name. A part in the pack is then a clue about the floor it came from. The gifts they give come in three tiers and a closed set, the Covenant, and every gift is promised: it bears a gold seam and cannot be lost ([BESTIARY, sections 8.5 to 8.7](README.md)).
- **The compost.** A farming room that turns parts into something else ([BESTIARY, section 8.8](README.md)).
- **The alembic.** A laboratory station that brews parts into potions. Only a positive intention brews, three brews per alembic, and four laboratories, on floors 2, 4, 6 and 8 (the owner's decision of 2026-10-30). This is the potions proposal ([potions](potions/README.md)).
- **A shop.** Parts traded for other things ([SHOP](SHOP.md)).

## Open questions

1. Does a part get a purpose at all, or do parts stay collectibles?
2. If they get one: which of the candidates above, or another? Any of them can be built alone.
3. Does the alembic answer close the task, with no shop (the potions proposal's default)?
4. Are the gifts (the promised items) a separate use of parts, or a result of the same agreements?
5. Should the inventory show parts at all, and where, given the contradiction in the module's notes?
