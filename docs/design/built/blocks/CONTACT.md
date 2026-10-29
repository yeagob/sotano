# Crush and headbutt

Two ways the body breaks blocks without an intention: pressing against blocks, and jumping into a ceiling. Both are built, both are off by default, and items switch them on.

Part of [blocks](README.md).

## What the player sees and feels

- **Crush.** With the crush stat above zero, walking into blocks wears them down. Every block you press against, at feet, waist and head height, takes the crush damage each quarter of a second; blocks below you are never touched. Armour counts. With no crush, pressing against a wall does nothing.
- The practice Exposure gives twenty damage a second: soft blocks fall at once, and obsidian takes seconds.
- **Headbutt.** The headbutt stat is the highest tier of block your head can break when you jump into a ceiling. By default it is below zero, so nothing breaks. A practice, Lion's Mane, raises it by two, so your head breaks tier-one ceilings.
- A headbutt that breaks something keeps some of the jump's upward speed, so you pop through into the gap. A headbutt that breaks nothing stops you.

## The rule behind it

The design does not mention crush or headbutt. The owner has not written a rule for either. They are recorded here as built, because the code has them, and they are part of what the body can do. The open question is whether they belong to the body or only to the practices that grant them.

Code: `src/game/game.ts` (the contact with blocks, lines 1986-2018; the headbutt, lines 2019-2034), `src/core/stats.ts` (the crush and headbutt stats, lines 42-43).

## Open questions

1. **Body or practice.** Crush and headbutt are off by default and only practices turn them on. Should they stay effects of practices, or should the body have a rule of its own that practices change? The owner should decide, because the design does not yet describe either.
