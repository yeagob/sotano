# The stats of the shot

The numbers that make an intention weak or strong, and what each one does to the player's play.

Part of [intentions](README.md).

## What the player sees and feels

- The shot is tuned by eight stats. Every item that touches the shot changes one or more of them.
- Damage is what an intention does to a projection or an ally. Mining is what it does to a block. They are separate: a practice can make you a good fighter and a poor miner, or the reverse.
- Fire rate is how many intentions leave per second while you hold cast.
- Shot speed is how fast an intention leaves: at base it crosses sixteen blocks a second.
- Range is how far it flies straight before it starts to fall: at base half a second of flight.
- Gravity is how hard it drops after that flight.
- Size is how big the intention is, and so how easily it meets a target.
- Luck is recorded but does not change the shot. It weights the loot: which reward or chest item a room gives you.

## Base values

| Stat | Base | What it does |
|---|---|---|
| Damage | 3.5 | Damage points per intention against a projection or an ally |
| Fire rate | 2.7 | Intentions per second while cast is held |
| Shot speed | 1 | Launch speed, sixteen blocks a second at 1 |
| Range | 1 | Half a second of straight flight at 1 |
| Gravity | 1 | Fall rate after the flight, twenty-two blocks a second squared at 1 |
| Size | 1 | Radius of the intention, 0.12 blocks at 1 |
| Luck | 0 | Weights the loot tables (rewards and chests) |
| Mining | 3.5 | Block damage per intention before armour |

Most of these stats have a floor and a ceiling, so that no practice pushes a shot past a set range. The limits are in the same file as the base values.

## The rule behind it

Damage and mining are separate numbers on purpose: the design calls mining "a very useful design lever" that lets items make a fighter who is a poor miner, and the reverse ([DESIGN.md, section 4](README.md)).

## Open questions

1. **Luck.** The design text gives luck as the chance of special effects, with a base of zero ([DESIGN.md, section 4](README.md)). The code uses luck only to weight loot rolls: room rewards and chests (`src/game/game.ts`, the reward roll at lines 1208-1211 and the chest roll at lines 2141-2145). No special effect reads it. The planned meaning is in [not-built/intentions/LUCK.md](../../not-built/intentions/LUCK.md). The owner should decide which one stands.

Code: `src/core/stats.ts` (the base values and limits, lines 27-49), `src/combat/intents.ts` (the spec made from the stats, lines 11-32).
