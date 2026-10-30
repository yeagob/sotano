# Recipes

Up: [laboratory](../README.md) · built: eight of the eleven recipes, the matching of the bulb, ice and the durations. Not built: the Warm Cordial and the Open-Hand Elixir (they need a warmth field on the damage and spawn events, step P3), the Distillate (P3) and the run-long duration ([potions](../../../not-built/practices/potions/README.md)).

What the bulb makes when a positive intention brews it, and how long the flask's effect lasts once it is drunk.

## The recipes

| Potion | Path | Bulb | Effect | Duration | Document |
|---|---|---|---|---|---|
| Plain Tonic | body | anything else | half a heart | instant | [PLAIN-TONIC](PLAIN-TONIC.md) |
| Restoring Draught | body | two flesh | one heart | instant | [RESTORING-DRAUGHT](RESTORING-DRAUGHT.md) |
| Footing Tincture | body | a body flesh and deepstone or obsidian | kick ×1.5 | 3 sealed rooms | [FOOTING-TINCTURE](FOOTING-TINCTURE.md) |
| Spring Tonic | body | a body heart | jump ×1.4 | the floor | [SPRING-TONIC](SPRING-TONIC.md) |
| Clear Infusion | mind | two minds of two mind patterns | range ×1.3, shot speed ×1.2 | 3 sealed rooms | [CLEAR-INFUSION](CLEAR-INFUSION.md) |
| Questioning Tincture | mind | a mind of the Doubt lineage and iron ore | the next lock asks one key less | one lock, or the floor | [QUESTIONING-TINCTURE](QUESTIONING-TINCTURE.md) |
| Ember Tonic | will | a will heart | fire rate ×1.3 | 3 sealed rooms | [EMBER-TONIC](EMBER-TONIC.md) |
| Patient Draught | will | a heart and a mind of one will pattern | mining ×1.6 | the floor | [PATIENT-DRAUGHT](PATIENT-DRAUGHT.md) |

## How the bulb is read

- **The whole bulb counts**, up to three things, in any order. Parts match by kind (flesh, heart, mind, essence) and by their pattern at one of four levels: the exact pattern, its lineage, its path, or any. Blocks match by their material.
- **Every thing in the bulb must be accounted for.** A recipe for one heart does not match a heart and a stone.
- **The most specific recipe wins**: exact pattern or material, then lineage, then path, then any; among equals, more inputs win. A test walks every bulb of one to three things (every part, the recipe materials, ice and one other block) and finds no two recipes tied.
- **Nothing matched makes a Plain Tonic.** A brew is never nothing.
- **No roll.** The same bulb makes the same potion in every run and every order. Recipes are content, not seed.

## Paths and lineages

Each pattern that leaves parts has a path, and the patterns that grow with depth have a lineage, as in the bestiary's cards:

| Path | Patterns |
|---|---|
| Body | Craving, Impulse, Reactivity, Spark, Perfectionism, Not Yet |
| Mind | Doubt, Second-Guessing, Paralysis, the Lectern, the Margin, the Tribunal, Distraction, Noise, Cynicism, Dogma, Rumination, the Shoulds, What If |
| Emotion | Comparison, the Hall of Mirrors, Avoidance, Gloom, Isolation, Numbness, Pretence, Resentment, Sulk, Undertow |
| Will | Panic, Alarm, Dread, Procrastination, Backlog, Autopilot, Burnout, Scarcity, Shortcut |

The lineages are Doubt (Doubt, Second-Guessing, Paralysis), the Lectern (the Lectern, the Margin, the Tribunal), Panic (Panic, Alarm, Dread), Procrastination (Procrastination, Backlog), Comparison (Comparison, the Hall of Mirrors), Distraction (Distraction, Noise) and Perfectionism (Perfectionism, Not Yet).

## Ice

Ice takes a slot and keeps the brew cold. A potion counted in rooms then lasts one sealed room more; on an instant or floor-long potion ice does nothing. Ice is not an ingredient: a bulb of only ice makes a Plain Tonic.

## Durations

Durations never show a clock. A drunk potion's effect stays while practices are gained and lost.

| Duration | Ends |
|---|---|
| Instant | at once |
| *N* sealed rooms | after *N* sealed rooms are cleared, and at the latest on the next floor entry. A challenge room's waves do not count |
| The floor | on the next floor entry, going down. Climbing back up does not end it, and does not give it back |
| One lock | when it opens a lock, or on the next floor entry |

Drinking a potion that is already active refreshes it to its full duration; it never stacks. When an effect ends, a short notice names the potion.

Code: `src/content/recipes.ts` (the resolver), `src/content/patterns.ts` (paths and lineages), `src/content/potions.ts` (the potions), `src/game/potion-effects.ts` (the durations). Tests: `tests/recipes.test.ts`, `tests/potion-effects.test.ts`.
