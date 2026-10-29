[Presences](README.md)

# The Echo

Status: **proposal**.

A messenger of learning from failure. Where the player's last run faded, if the player reaches that place again, a faint copy of the player waits. It says how far the player got last time, gives back one key or one bomb, and fades into them.

## What the design asks

- **Place.** Where the last run faded (a stored position from the profile).
- **Line.** How far the player got last time.
- **Gift.** One key or one bomb.
- **Fade.** It fades into the player.
- **Agreement.** A part the player did not use, to learn from a failure (see [Agreements](AGREEMENTS.md)).
- **Gift tier.** Tier 1 (see [Gifts](GIFTS.md)).

## Open questions

- **Stored place.** The last run's place is state that must persist. It needs the profile save, which is memory (see [Memory](MEMORY.md)).
- **Failure.** The line must never quote the failure back. The design says so; the check is in the wording.
- **Frequency.** Once a run, or once per place? Decide with the profile rule.
