# Laboratory

Up: [Built](../README.md) · the alembic as the game has it today. The brewing rules are approved; the flask, the drink and eight of the eleven recipes are built ([recipes](recipes/README.md)). The Warm Cordial, the Open-Hand Elixir, the Distillate, the codex and the alembic's own look are not built yet ([potions](../../not-built/practices/potions/README.md)).

## Documents

| Document | Contents |
|---|---|
| [recipes](recipes/README.md) | The eight built recipes, how the bulb is read, ice and durations, one document per recipe |

## Where it is

Four laboratories, on floors 2, 4, 6 and 8 (`LABORATORY_FLOORS` in `src/world/floor.ts`). Each alembic is two tiles side by side, both answering feed, brew and drink; it is one alembic, however many tiles it fills. The owner chose four on 2026-10-30, instead of the one per zone (five) that the brewing rules first approved. It is one alembic block on the floor of one normal room, drawn from the floor's own fork of the seed, and it sits on a free tile of that room. The laboratory is not on floor 9, which holds the last zone's Compost; the zone's laboratory there is still open ([open questions](../../not-built/practices/potions/OPEN-QUESTIONS.md)). Floor 0, the tutorial, has none.

## What it does

- **Feed it.** Aim at the alembic and right-click: the top of your hand goes into the bulb. The bulb holds three things, parts or blocks. A fourth is refused.
- **A positive intention brews.** One of the alembic's three brews is spent, and what was fed is gone for good. The brew leaves a flask on top of the alembic. Walk onto it to take it into your hand, if the hand has room.
- **What the bulb makes.** The whole bulb is read against eight recipes; the most specific one wins, and a bulb no recipe matches makes a Plain Tonic ([recipes](recipes/README.md)). Ice in the bulb makes a potion counted in rooms last one room more. The flask is not an ingredient: the bulb refuses it.
- **Drink.** G on a keyboard, X on a pad, or the flask button on a touch screen (shown only while a flask is in the hand). The top of the hand is drunk at once and a notice names the potion and its effect. Instant potions heal; the others change stats for a number of sealed rooms or until the next floor, and the Questioning Tincture takes one key off the next lock. A flask can also be placed (right click) or thrown (Q) like a part.
- **A negative intention boils the bulb off.** What was fed is lost and no brew is spent.
- **One hit counts once.** Only the first intention hit in each 0.6 seconds counts, so a swing or a beam tick cannot brew twice.
- **Three brews per run.** After the third brew the alembic is cold: it takes nothing and says so.
- **Unbreakable.** The alembic cannot be dug, burned or blasted.

## Placeholders

The alembic is two tiles side by side in one normal room. It is drawn by a model (`src/render/alembic-model.ts`: a stepped stone hearth, a glass bulb in brass hoops, a copper coil and a flask stand), and every flask is still one shared bottle icon with a liquid colour per potion. Neither has passed the art gate (sotano-art): they stay placeholders until an art pass draws the alembic (bulb, coil and flask stand) and the potion icons. The drink button's touch glyph (`touchDrink` in `src/content/hud-icons.ts`) is a placeholder too. The six-second fill of a brew (BREWING-RULES §2.5 and §4.5) is not built: a brew leaves its flask at once.

The rules are in `src/game/alembic.ts` and tested in `tests/alembic.test.ts`, with the brew event. The placement is tested in `tests/laboratory.test.ts`. Brewing and drinking emit the `brew` and `drink` events for practices to react to ([ITEMS](../../../architecture/ITEMS.md)).
