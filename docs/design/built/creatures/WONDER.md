[Creatures](README.md)

# Wonder

Built. Floor 0, the roots, as ambient life. Code: `src/content/creatures/wonder.ts`.

Wonder is a small moth of pale paper that drifts among the roots and keeps away from the player. It is the curiosity that leads down: it never touches the player and never fights. It has no cold eye and no glow; the light is the player's.

- **Pattern:** curiosity.
- **Health:** 3.
- **Answers to:** both polarities. A positive intention heals it; a negative one sends it into the blocks until its room clears.

## Movement and character

- Flees the player: when the player comes within four blocks, it turns away.
- Otherwise it drifts about 1.1 blocks above the ground, changing direction every one to three seconds.
- Its wings flap like arms.
- Two to four appear on floor 0.

## What the player can do

- Watch it keep its distance. It is the first creature the player sees, and it tells the player that the roots are alive.
- Harm it: it hides until the room clears, as any creature does.
- Heal it: a positive intention heals it.

## Open questions

- **Not in the design's roster.** The bestiary lists Rootlings for curiosity; Wonder is in the code and not in the design. Keep both, or fold Wonder into Rootling?
- **Same pattern name.** Wonder and Rootling are both called curiosity in the code. One needs a different pattern.
- **Flight.** A creature that flees the player is a different verb from the others, which approach or wander. Keep it.
