[Presences](README.md)

# The Cartographer

Built. A dweller of knowing where you stand: it waits in one quiet room of one seeded floor per run, from floor 1 down. With the ore of its zone in hand, it asks for it and charts the whole floor. Otherwise it answers with a question: it asks which place to mark, the vault or the boss, and says in words where that place lies from where it stands. It stays where it is. Code: `src/content/presences/cartographer.ts` (its identity), `src/content/presences/index.ts` (the floor, the placement, its options, its lines and the direction word), `src/game/game.ts` (the choice and the nearest place). Its floor and its wording are **proposed, pending owner ruling** (see [the not-built part](../../not-built/presences/CARTOGRAPHER.md)).

- **Pattern:** knowing where you stand.
- **Health:** one point, which nothing removes (as every presence).
- **Kind:** a dweller. It keeps its place for the floor and gives no reward.

## Where it is

- **One floor per run, from floor 1.** `dwellerFloorOf(run, 'cartographer')` draws the floor from the run's root (`fork('presence', 'cartographer')`). Never the tutorial floor.
- **The room.** A quiet normal room of that floor with no projections, not the start room, not a room that holds another presence. The Tree's crossroads are not built; the room stands in for them.

## What the player meets

- **The ore of its zone (owner ruling D13, the presences README D13g).** Within about two blocks, with the ore of the zone it waits in carried (iron on floors 1 and 2, copper on 3 and 4, tin on 5 and 6, quicksilver on 7 and 8, lead on 9; see [floors](../levels/floors/README.md#ores-by-zone)), its consent card asks first: *Give {item} to The Cartographer? With the ore of this zone it charts the whole floor: the vault and the boss.* Give takes that ore and marks both on one card (*The vault lies {vault}.*, *The boss lies {boss}.*, or *This floor keeps no vault.* / *This floor keeps no boss.*), then *The rock of this zone has drawn its own map. Read it as you go.* Keep takes nothing and opens the question below. An ore of another zone is not asked for.
- **The question.** Within about two blocks, a choice card asks *What do you want marked on this floor?* with two answers: the vault and the boss.
- **Mark.** The nearest room of the chosen type on the same floor is read from the map's cells, and the card says where it lies from here: *The vault lies north of here.* (east, south or west of here the same way), or *in this room* when they share a cell. The card's second line is the Cartographer's line: *Go on. The map is yours to read.*
- **No such place.** A floor with no vault, or no boss, gets: *I have no mark for that on this floor.*
- **Not now.** Nothing is marked. The Cartographer asks again only after the player steps away and returns.

The mark is words on the card, not a map: the star map is not built.

## Owed (not checked in a browser)

- The choice card with a gamepad and with touch (see [ELDER.md](ELDER.md#owed-not-checked-in-a-browser)).
- The direction read on a floor with a vault and a boss: only the direction function and the placement are unit-tested; the in-game mark was not played.

## Look

The Cartographer uses the Listener's body until it has its own art (the art agent's follow-up).
