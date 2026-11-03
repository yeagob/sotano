# Rocket launcher

Up: [not-built practices](README.md) · [not-built design](../README.md)

Status: decided by the owner; not built. The owner's answers of 2026-11-02 are in [Decisions](#decisions-owner-2026-11-02) (issue [#89](https://github.com/yeagob/sotano/issues/89), follow-up to [#59](https://github.com/yeagob/sotano/issues/59)). Nothing here is in the code. The open questions at the end are the owner's to decide.

## Decisions (owner, 2026-11-02)

The owner answered the proposal in issue #89. The answers are recorded in English; the owner's words are paraphrased unless quoted.

1. **Tier:** 3.
2. **Kind:** a practice, not another kind of item.
3. **Lore concept:** transcending limits. The owner's own line, credited to Santiago Dopazo: "No hay nada imposible..." (the owner's words, shortened in this document). It is the owner's text, not a third-party quote, so it may be quoted with that credit.
4. **Dr. Stone:** a credit line in the lore notes only, as a citation: "Let's go to the moon" (*Dr. Stone*). Not in-game text.
5. **First tap:** confirmed. A single tap of the fire control fires its intention as usual. A quick double tap fires the missile instead of an intention, and costs one bomb. The owner's words: "only the quick double tap fires the missile". See [The double tap](#the-double-tap-on-the-fire-control).
6. **Touch:** the double tap returns for this practice only. It is not a return of the old cast-by-double-tap for intentions, which [TOUCH.md, section 7](../../../architecture/input/TOUCH.md) removed.
7. **Keyboard and mouse:** a double click of the fire button (the left button).
8. **Self-damage:** explosions hurt the player. There is no immunity. A missile fired at a nearby wall can hurt its owner.
9. **Blast:** the same as the bomb's blast. If the bomb's blast scales, the missile's scales with it.
10. **Range and speed:** the values in this document are correct. The owner will test them in a build.
11. **Polarity:** polarity changes the missile. A positive missile explodes as a love explosion, not a destructive one (see [The love explosion](#the-love-explosion-proposed-concept)).
12. **Synergies:** only with bombs.
13. **Arming refusal:** kept. The refusal stays in the design and will be tested in play (see [A rocket, not a thrown bomb](#a-rocket-not-a-thrown-bomb)).
14. **Love explosion, radius and effect:** the same radius as the bomb's blast. Each element in the area is healed and grown exactly as a positive intention would do it, with the damage the bomb would deal to that element used as the amount (see [The love explosion](#the-love-explosion-proposed-concept)).
15. **Path:** the practice belongs to **Miracles**, a new path in the design, placed first. Will fits too, but the owner chose Miracles.
16. **Name:** "Dr. Launcher". The owner judges the reference too loose to be a third-party name ("a pun far from the brand, with no direct reference"). The name note below records the rule it touches; the owner has accepted that.

The points still open are listed at the end, as open questions 1 to 5.

## The idea

A practice that turns the bombs you carry into missiles. A quick double tap of the fire control launches one bomb as a rocket: it flies straight along your aim, does not fall, and explodes on the first thing it meets with the same blast a bomb makes.

The launcher does not replace your intentions. They keep flying on every normal press, as they do beside the blade of [Cut Ties with Toxic Relationships](../../built/practices/mind/CUT-TIES-WITH-TOXIC-RELATIONSHIPS.md). It adds one verb, and it spends the bombs you already have.

## Working name, path and tier

| Field | Proposal | Status |
|---|---|---|
| Working name | Dr. Launcher | Decided by the owner (decision 16). Its rights check against the naming rules stays open (open question 2) |
| Path | Miracles, a new path placed first (decision 15) | Decided by the owner. Creating the new path in the design is a separate change |
| Quality (the tier) | 3 | Decided by the owner (decision 1). The built tiers run from 0 to 4 stars ([built practices](../../built/practices/README.md)) |
| Found in | Not chosen | Not answered in issue #89, so still open (open question 5). Built rule: quality 1 to 3 comes from treasure rooms; quality 4 comes from boss rewards and vault rooms |
| Inspired by | Transcending limits (the lore concept, decided) | Decision 3. The *Dr. Stone* credit is in the lore notes only (decision 4) |

**Name note.** [CONTRIBUTING.md](../../../../CONTRIBUTING.md) forbids third-party game names in practices, and [NAMING.md](../../built/story/NAMING.md) says a credit source is never an in-game name. "Dr." points to *Dr. Stone*, a credit source. The owner judges the reference too loose to count, and has chosen "Dr. Launcher" anyway. That is a deliberate exception to the naming rule, to be confirmed by the owner in the rights check before any in-game use. "Rocket Launcher" remains the title of this document.

## What the player sees and feels

- The player finds the launcher as any practice: on a pedestal, in a treasure room or a reward (where it is found is open).
- The bomb counter does not change its look. A quick double tap spends one bomb and launches it as a missile.
- The missile leaves the muzzle along the aim, speeds up for a short part of its flight, then holds a steady line. It does not arc down, roll or bounce.
- It explodes on the first thing it meets: a solid block, a projection, a creature, a loose bomb, or the end of its range. A missile with positive polarity explodes as a love explosion (see below); the negative case is open (open question 3).
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
- It has a short run-up: it speeds up over the first part of its flight, then keeps a steady speed (target: a few blocks of acceleration, then steady). The owner accepts these values and will test them in a build.
- It explodes on contact. It does not wait for a fuse.
- It has a maximum range. At the end of it, with nothing hit, it explodes in the air.
- Arming (decided, decision 13): the target is that the missile flies about two blocks before it can explode, so that a shot at a block right in front of the muzzle does not blow up at the muzzle. A shot is refused when a block stands within about two blocks of the muzzle: no bomb is spent, and the refusal is the same short sound the place rule gives when there is no face to place on. The refusal stays in the design and will be tested in play. The two-block distance is a target. Decision 8 still applies to the blast itself.

### What the blast does

- The blast is the bomb blast (decision 9): a sphere about two and a half blocks across, forty points of damage at the centre falling to half at the edge, before armour. If the bomb's blast scales, the missile's scales with it. Loose cubes in the blast are thrown outward. Chests and bedrock are not hurt.
- Creatures are only pushed, as with any explosion: explosions do not hurt creatures ([POLARITY](../../built/intentions/POLARITY.md)).
- A missile that meets a loose bomb sets it off at once, and a missile's blast sets off any bomb in its range, as a bomb blast does ([BOMBS.md](../../built/blocks/BOMBS.md)).
- The player is hurt by explosions, their own missile's included. There is no immunity (decision 8).
- Polarity changes the missile (decision 11). A positive missile explodes as a love explosion. Whether a negative-polarity missile exists is open (open question 3).

## The double tap on the fire control

The double tap is a new meaning of the fire control, not a new button. The controls rule ([sotano-controls](../../../architecture/input/README.md)) prefers a new meaning of an existing action in context over a new input. The rules for each device are in the controls section below.

Decided (decision 5): a single tap of the fire control fires its intention at once, as it does now. A quick double tap fires the missile instead of an intention, and costs one bomb. The window for a quick double tap is about 0.3 seconds, to test.

## Controls

The double tap is on the fire control, the action `cast` in the input table ([input README](../../../architecture/input/README.md), section 3). Each device uses its own double tap:

| Device | Fire control today | Double tap | Notes |
|---|---|---|---|
| Keyboard and mouse | Left click, held | Double click the left button (decided, decision 7) | The game has no separate fire key. The first click captures the mouse; a double click counts only while the pointer is locked |
| Gamepad | RT, held | A double press of RT (proposal) | Not answered in issue #89, so still a proposal (open question 5) |
| Touch, landscape | The bead of light, held | A double tap on the bead (decided, decision 6) | This double tap returns for this practice only. See the note below |

Rules that apply on every device:

- A double tap does nothing for a player without the launcher. A player who never took the practice does not see the gesture change.
- No other action may use the same double tap in the same context on the same device (the controls rule).
- Every device's double tap must be on, and tested on, keyboard and mouse, gamepad and touch, as the controls skill requires before the item ships.

### The built touch record to correct

The owner decided that the touch double tap returns for this practice only (decision 6). The built record disagrees with itself: [TOUCH.md, section 7](../../../architecture/input/TOUCH.md) says a double tap on the cast button was removed, and [docs/reviews/input.md](../../../reviews/input.md), row 6, says the owner kept the double tap with a short first tap that arms it. The code has no double tap today: `src/input` has none. When this practice ships, TOUCH.md section 7 and review row 6 are corrected in that same change, so that the record says the double tap is for this practice only.

## Lore (decided concept)

- **The concept (decision 3): transcending limits.** The owner's line, credited to Santiago Dopazo ([SOURCES.md](../../../lore/SOURCES.md), owner entry): "No hay nada imposible..." No third-party text is quoted.
- **The mechanic that mirrors it.** A thrown bomb falls under its own weight. The missile keeps its line and does not fall: the limit of the throw does not bind it. It keeps the bomb's blast.
- **The series reference (decision 4).** *Dr. Stone* is credited in the lore notes only, as a citation: "Let's go to the moon". It is not in-game text. The series' names, characters, art and quotes are never used in the game. Its rights status must be checked before any in-game use (verify).
- **Not chosen.** The earlier reaction-physics idea and its Tsiolkovsky credit are replaced by decision 3 and are not used.

The lore notes carry the concept and the citation: [SOURCES.md](../../../lore/SOURCES.md) (the `dr-stone` row) and [CONCEPTS.md](../../../lore/CONCEPTS.md) (the transcending-limits row).

## The love explosion (proposed concept)

Status: proposed, not built. The love explosion is a new concept, meant to be reusable: other items may use it later. No built item uses it.

- **What it does (decision 11).** An explosion of positive polarity. It does not destroy, and it does not hurt creatures.
- **Radius (decision 14).** The same radius as the bomb's blast: a sphere about two and a half blocks across.
- **Effect (decision 14).** Each element in the area is healed and grown exactly as a positive intention would do it, with the damage the bomb would deal to that element used as the amount. An ally in the area is healed by half that amount, as a positive intention heals it. A creature in the area grows by a quarter of its birth size, up to three times, as a warm love shot grows it.
- **The built rules it follows.** A positive intention never breaks a block and heals an ally by half the damage; each warm love shot grows a creature by a quarter of its birth size, up to three times ([POLARITY](../../built/intentions/POLARITY.md)). The explosion does not break blocks either. No other number is set here.
- **The lore.** Recorded as a proposed concept in [CONCEPTS.md](../../../lore/CONCEPTS.md).

## Words and art (when built)

- Name, description and effect in English and Spanish, and the refusal message and the double-tap prompt for each device, through the localization mechanism ([LOCALIZATION](../../../architecture/LOCALIZATION.md)).
- The missile, its trail, the launcher icon, the love explosion and the blast's new look pass the art guide before they ship (the art rules are in [ART](../../built/feel/ART.md)).
- The sound of the launch and the refusal follow the feedback rules ([FEEDBACK](../../built/feel/FEEDBACK.md)).

## Design rule check

The decided practice rule ([not-built practices](README.md)) says a practice touches at least two systems. This one touches combat (the fire control, the bomb's blast and the love explosion) and blocks (the blast breaks blocks and loose bombs chain). It meets the rule.

Synergies (decision 12): only with bombs.

## Acceptance, once built

From issue #59:

- The item documents its tier, effect and lore link here, and moves to `built/` in the same commit that ships it.
- A double tap launches one missile for one bomb, and launches nothing when there are no bombs.
- The double tap works on keyboard and mouse, gamepad and touch.
- The item's text is in every shipped language.

## Open questions (owner decides)

1. **Negative polarity.** Does a negative-polarity missile exist? The owner's answers do not say what its blast is.
2. **Found in and gamepad double press.** Not answered in issue #89: where the launcher is found, and whether the gamepad double press of RT is the double tap.
3. **The path's new name.** Miracles is a new path, as the owner decided. Creating it in the design (its own folder, its own practices index, its place in the path order) is a separate change. The name is a word central to *A Course in Miracles* (see SOURCES.md, Caution); the owner has not yet confirmed that this is acceptable.
