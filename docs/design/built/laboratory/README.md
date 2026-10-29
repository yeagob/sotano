# Laboratory

Up: [Built](../README.md) · the alembic as the game has it today. The brewing rules are approved; the flask, the drink and the recipes are not built yet ([potions](../../not-built/practices/potions/README.md)).

## Where it is

One laboratory on floors 2, 4, 6 and 8 (`LABORATORY_FLOORS` in `src/world/floor.ts`). It is one alembic block on the floor of one normal room, drawn from the floor's own fork of the seed, and it sits on a free tile of that room. The laboratory is not on floor 9, which holds the last zone's Compost; the zone's laboratory there is still open ([open questions](../../not-built/practices/potions/OPEN-QUESTIONS.md)). Floor 0, the tutorial, has none.

## What it does

- **Feed it.** Aim at the alembic and right-click: the top of your hand goes into the bulb. The bulb holds three things, parts or blocks. A fourth is refused.
- **A positive intention brews.** One of the alembic's three brews is spent, and what was fed is gone for good. The brew has no output yet, because the flask is not built.
- **A negative intention boils the bulb off.** What was fed is lost and no brew is spent.
- **One hit counts once.** Only the first intention hit in each 0.6 seconds counts, so a swing or a beam tick cannot brew twice.
- **Three brews per run.** After the third brew the alembic is cold: it takes nothing and says so.
- **Unbreakable.** The alembic cannot be dug, burned or blasted. It is a placeholder block until sotano-art gives it its own look.

The rules are in `src/game/alembic.ts` and tested in `tests/alembic.test.ts`. The placement is tested in `tests/laboratory.test.ts`.
