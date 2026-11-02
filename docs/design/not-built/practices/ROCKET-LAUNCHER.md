# Rocket launcher

Up: [not-built practices](README.md) · [not-built design](../README.md)

Status: proposal (issue #59, from the owner's request; designed here, not validated by the owner, not built). Nothing here is in the code. The open questions at the end are the owner's to decide.

## The idea

A practice that turns the bombs you carry into missiles. A double tap of the fire control launches one bomb as a rocket: it flies straight along your aim, does not fall, and explodes on the first thing it meets with the same blast a bomb makes.

The launcher does not replace your intentions. They keep flying on every normal press, as they do beside the blade of [Cut Ties with Toxic Relationships](../../built/practices/mind/CUT-TIES-WITH-TOXIC-RELATIONSHIPS.md). It adds one verb, and it spends the bombs you already have.

## Working name, path and tier

| Field | Proposal | Status |
|---|---|---|
| Working name | Rocket Launcher | Open: the naming rules ask for a generic technique or a public-domain work, and a launcher is neither (see the open questions) |
| Path | Will (suggested) | Open: every practice has a path tag, and the owner names it |
| Quality (the tier) | Not chosen | Open. The built tiers run from 0 to 4 stars ([built practices](../../built/practices/README.md)). Suggested for the discussion: 3, because the launcher adds a verb and does not replace the intention, as the quality 4 weapons do |
| Found in | Not chosen | Open. Built rule: quality 1 to 3 comes from treasure rooms; quality 4 comes from boss rewards and vault rooms |
| Inspired by | Rocketry, a generic idea (see the lore section) | Open: the series reference is the owner's to place |

## What the player sees and feels

- The player finds the launcher as any practice: on a pedestal, in a treasure room or a reward (where it is found is open).
- The bomb counter does not change its look. A double tap spends one bomb and launches it as a missile.
- The missile leaves the muzzle along the aim, speeds up for a short part of its flight, then holds a steady line. It does not arc down, roll or bounce.
- It explodes on the first thing it meets: a solid block, a projection, a creature, a loose bomb, or the end of its range. The explosion is the bomb blast ([BOMBS.md](../../built/blocks/BOMBS.md)).
- Without the launcher, a double tap is two ordinary intentions, as now.
- With the launcher and no bombs, nothing is launched. The player hears and reads the same short refusal the bomb action gives.

## Behaviour

### One missile, one bomb

- A missile is a bomb taken from the counter. Each missile costs exactly one bomb.
- A double tap with no bomb in the counters launches nothing and spends nothing.
- A bomb picked up or carried is not changed by the launcher. Only the double tap sends one out.

### A rocket, not a thrown bomb

A bomb today is a loose cube with a fuse: it rolls, is kicked and pushed, and goes off after its fuse ([BOMBS.md](../../built/blocks/BOMBS.md)). A missile is not that cube. It is a moving thing that travels on its own.

- It flies straight along the aim. It is not affected by gravity, does not roll, cannot be kicked, and is not pushed by anything on its way.
- It has a short run-up: it speeds up over the first part of its flight, then keeps a steady speed (target: a few blocks of acceleration, then steady). Numbers are targets until a build confirms them.
- It explodes on contact. It does not wait for a fuse.
- It has a maximum range. At the end of it, with nothing hit, it explodes in the air.
- Arming distance: the missile must fly a short way before it can explode, so the player is never inside its own blast at the muzzle. Target: about two blocks. If a block stands in front of the muzzle within that distance, the shot is refused, no bomb is spent, and the refusal is the same short sound the place rule gives when there is no face to place on. Open: see the questions.

### What the blast does

- The blast is the bomb blast: a sphere about two and a half blocks across, forty points of damage at the centre falling to half at the edge, before armour. Loose cubes in the blast are thrown outward. Chests and bedrock are not hurt. Open: whether a missile hits harder than a bomb.
- Creatures are only pushed, as with any explosion: explosions do not hurt creatures ([POLARITY](../../built/intentions/POLARITY.md)).
- A missile that meets a loose bomb sets it off at once, and a missile's blast sets off any bomb in its range, as a bomb blast does ([BOMBS.md](../../built/blocks/BOMBS.md)).
- The player is hurt by their own missile only when the blast reaches them. The arming distance is meant to keep that from happening. Open: whether it can still happen, and what it costs.
- Polarity does not change a missile. Polarity is for intentions, and a missile is not one (proposal).

## The double tap on the fire control

The double tap is a new meaning of the fire control, not a new button. The controls rule ([sotano-controls](../../../architecture/input/README.md)) prefers a new meaning of an existing action in context over a new input. The rules for each device are in the controls section below.

Two ways a double tap can meet an intention. The owner decides which one is built:

- **A. The first tap fires an intention as now.** The second tap launches the missile. A double tap spends an intention and a bomb in one gesture, and it is easy to fire by accident in a fight.
- **B. The first tap waits for the window.** If a second tap comes inside the window, the missile fires and the first tap is dropped. If none comes, the first tap fires its intention once the window has passed. This is the proposal's default for review, because it keeps one gesture from firing two things. The cost is a short delay on every shot while the launcher is held (target window: about 0.3 seconds, to test).

## Controls (proposal)

The double tap is on the fire control, the action `cast` in the input table ([input README](../../../architecture/input/README.md), section 3). Each device uses its own double tap:

| Device | Fire control today | Double tap proposed | Notes |
|---|---|---|---|
| Keyboard and mouse | Left click, held | Double click the left button | The game has no separate fire key. The first click captures the mouse; a double click counts only while the pointer is locked. Open: whether a key is wanted instead |
| Gamepad | RT, held | A double press of RT | The trigger is held for intentions, so a double press must not fire an intention on each press unless option A is chosen |
| Touch, landscape | The bead of light, held | A double tap on the bead | Open: the owner's rule in [TOUCH.md, section 7](../../../architecture/input/TOUCH.md) removed a double tap on this button (see below) |

Rules that apply on every device:

- A double tap does nothing for a player without the launcher. A player who never took the practice does not see the gesture change.
- No other action may use the same double tap in the same context on the same device (the controls rule).
- Every device's double tap must be on, and tested on, keyboard and mouse, gamepad and touch, as the controls skill requires before the item ships.

### A conflict the owner must read

The built touch controls say a double tap on the fire button was removed. [TOUCH.md, section 7](../../../architecture/input/TOUCH.md) records that it was hidden and that two taps next to the fire button could switch the intention in the middle of a fight, so the polarity switch became a half turn of the phone. The review in [docs/reviews/input.md](../../../reviews/input.md), row 6, records the opposite: that the owner chose the double tap and kept it, with a short first tap that arms it. The two records disagree. The code has no double tap today: `src/input` has none. A double tap on touch brings the removed gesture back, so the owner decides it, and the record is corrected in the same change.

## Lore (proposal, not decided)

The owner suggested a link to rockets, and asked for a clear, respectful link to the anime *Dr. Stone* and its trip to the Moon.

- **The idea.** A rocket moves by pushing against what it leaves behind, and it keeps going on that push. This is the physics of a reaction engine, and it is a generic concept.
- **The mechanic that mirrors it.** The missile leaves the muzzle on its own push and keeps its line, where a thrown bomb falls. It keeps the bomb's blast.
- **The credit that could carry it.** Konstantin Tsiolkovsky's 1903 work on reaction devices is public domain in most places (verify). It would be a credit or a public-domain title, the owner's choice.
- **The series.** Not decided here. [CONTRIBUTING.md](../../../../CONTRIBUTING.md) says there are no third-party game names in practices, and practices use generic technique names or public-domain works. *Dr. Stone* is an anime, not a game, but the same caution applies to a practice's text. Where the link lives is the owner's decision: (a) in the lore notes only, in [SOURCES.md](../../../lore/SOURCES.md) and [CONCEPTS.md](../../../lore/CONCEPTS.md), with the practice using only the generic concept; or (b) as a credit line for the practice, in the way `inspiredBy` credits are written in the code. The series' names, characters, art and quotes are never used either way. The series' rights status must be checked before any in-game use (verify).

No row is added to SOURCES.md or CONCEPTS.md by this proposal. The lore library waits for the owner's choice.

## Words and art (when built)

- Name, description and effect in English and Spanish, and the refusal message and the double-tap prompt for each device, through the localization mechanism ([LOCALIZATION](../../../architecture/LOCALIZATION.md)).
- The missile, its trail, the launcher icon and the blast's new look pass the art guide before they ship (the art rules are in [ART](../../built/feel/ART.md)).
- The sound of the launch and the refusal follow the feedback rules ([FEEDBACK](../../built/feel/FEEDBACK.md)).

## Design rule check

The decided practice rule ([not-built practices](README.md)) says a practice touches at least two systems. This one touches combat (the fire control and the bomb's blast) and blocks (the blast breaks blocks and loose bombs chain). It meets the rule.

## Acceptance, once the owner validates it

From issue #59:

- The item documents its tier, effect and lore link here, and moves to `built/` in the same commit that ships it.
- A double tap launches one missile for one bomb, and launches nothing when there are no bombs.
- The double tap works on keyboard and mouse, gamepad and touch.
- The item's text is in every shipped language.

## Open questions

1. **The tier.** Which quality (0 to 4) does the launcher have, and where is it found? The suggestion is 3 for discussion.
2. **The path.** Which path tag does it carry? Will is suggested; the owner names it.
3. **The name.** Keep "Rocket Launcher" as a working name, or choose a generic technique or a public-domain title? A launcher is not a technique, so the naming rules may need a different word.
4. **Is it a practice?** The built weapons (Remember Breathing, Cut Ties) are practices. Is the launcher the same kind of item, or a different kind?
5. **The lore link.** Which concept carries it (the reaction idea, a public-domain credit, or none)?
6. **The series reference.** Where does the *Dr. Stone* link live: the lore notes only, a credit line for the practice, or nowhere? Its rights must be checked before any in-game use.
7. **The first tap.** Option A (the first tap fires an intention) or option B (the first tap waits for the window)?
8. **Touch.** Does the touch double tap on the fire button come back, given the owner's rule in [TOUCH.md, section 7](../../../architecture/input/TOUCH.md) and the conflicting review row 6? Or should touch use another verb?
9. **Keyboard.** Double click on the mouse button, or a dedicated key?
10. **Self-damage.** Does the arming rule keep the player out of their own blast, and if a shot is refused in front of a block, is that the right cost?
11. **Damage.** Is a missile's blast the same as a bomb's, or stronger?
12. **Range and speed.** Are the targets in this document right, or does the owner want a longer or shorter flight?
13. **Polarity.** Confirm that a missile is not changed by polarity.
14. **Synergies.** Out of scope here. Any synergy with other practices is a later proposal.
