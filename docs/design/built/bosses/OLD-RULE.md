[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# The Old Rule

Built, in part. Floor 6, from the Zone III pool. Code: `src/content/bosses/old-rule.ts`.

The Old Rule is a tall stone tablet with two dim eyes on its face. It issues rules the player must keep: a field that mutes the player where it stands, one that slows, and a column of force where the player is standing when a rule is "broken". Its phases use the older emitter and charge behaviours.

- **Pattern:** a belief from childhood. Certainty.
- **Path:** Mind.
- **Health:** 478 on floor 6.

## Phases

### Phase 1: commands

Every four seconds it issues a command. Two fields come with it:

- A mute field of 2.4 blocks' radius at a seeded point in the room, lasting four seconds, after a 0.8-second warning. Muted, the player cannot cast.
- A slow field of three blocks' radius around the Old Rule itself, for the same four seconds.

Its own position is not moved by a command: it stays where it stood.

- Arena: none on entering.

### Phase 2: enforces (from two thirds of its health)

Arena `drop`: a block of the room's wall material falls on the player's position. Every 2.4 seconds it enforces a rule: a tall ring at the player's position, after a one-second warning, doing 8 at its height of 2.6 blocks.

### Phase 3: charges (from one third of its health)

Arena `crumble`: toast only. It charges the player along a line, runs 1.6 blocks, stuns for 1.2 seconds on hitting a wall, and repeats after a cooldown of 1.2 seconds.

## Toasts

- Entering phase 2: "It enforces: stone falls where a rule is broken".
- Entering phase 3: "It crumbles: its rings go out across the room".

## Defeat

As in [Fight flow](FIGHT-FLOW.md#7-defeat). The design's tomb-temple arena, its tablets that fall and become a bridge, is not built.

## Open questions

- **Crumble.** The toast promises rings across the room. The build's phase 3 is a charge; the rings are not built.
- **Rules.** The design gives two rules at once and names them (no jumping, no casting, no carrying, no standing still). The build's two fields are mute and slow, not named rules. Keep it simple or name them?
- **Mute.** Muting the player while they stand in a field is a strong rule. Check in play that it is readable.
