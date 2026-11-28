# Prescience

Up: [practices (not built)](README.md) · [built design](../../built/README.md)

Status: built in code (`src/content/items/prescience.ts`); this document waits here until the owner accepts it, then it moves to `built/practices/mind/`. The name is the owner's proposal (*Presciencia*) and provisional.

| | |
|---|---|
| Path | Mind |
| Quality | 3 of 4 |
| Rarity | Unique (issue #347): the fixed reward of one place |
| Found in | the deep desert: the great worm gives it on the dismount (not on its death, which lays the tooth knife instead) ([WORM](../../built/levels/worm-desert/WORM.md)); its only pool is `secret`, which no draw reads |
| Inspired by | Frank Herbert, *Dune* (1965): the prescience the desert gives. Credited only; the title and its terms are never names in the game ([SOURCES](../../../lore/SOURCES.md), `dune`) |
| Code | `src/content/items/prescience.ts`; the `prescience` stat; the minimap (`knownRooms`, `practiceRooms` in `src/game/minimap.ts`, `Hud.updateMap`, `Hud.drawMap`) |

## What it means

Whoever has ridden the great worm has seen the desert from above. They learn to read what has not yet risen: the shape of a place before they walk it, and what it keeps for them.

## What it does

The owner's brief: see the full maps of every zone with every item, and reveal secrets.

- **Every room.** Every floor's minimap shows all of its rooms from the start, as outlines until they are visited, with their marks (start, treasure, vault, challenge, boss). The vaults behind their hard walls are among them: those are the secrets the map holds today.
- **Every practice.** A small gold mark sits in the corner of every room that holds a practice: on a pedestal (the boss's too, before it is overcome), shut in a chest, or laid by the Roots.
- **Unique.** Only the worm of the deep desert gives it, once per run, to whoever rides it. No chest, pedestal, draw or chooser offers it.

Positive outcome: a floor read at a glance. The player chooses a route to the practices and the vaults instead of searching blind, which saves health and time on every floor that follows.

## Stats and events

| Stat | Value |
|---|---|
| `prescience` | +1 (0/1 switch) |

No hook. The minimap reads the stat; losing the practice hides the map again.

## Mirror

The Shadow skips it: loot, it reads no map ([SHADOW](../../built/bosses/SHADOW.md)).

## Recipe

No recipe yet (#112). A unique practice is a place's reward: whether it should have a recipe at all is for the owner.

## Open questions

1. The name (provisional).
2. "Every zone": the minimap of the dungeon's floors is built; the star map of the Tree floors and the surface have no map of their own to reveal yet.
3. "Reveal secrets": beyond the vaults, the hidden walls of the dungeon (the door-shaped plugs) and the secret rooms of #331 could show on the map; not built.
4. The marks stay where a practice was laid even after it is taken; whether they should go out when the practice is picked up.
