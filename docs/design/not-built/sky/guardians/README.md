# The guardians of the sky

Up: [The realm of the sky](../README.md)

The guardians are the five deities of the first five floors of the sky tree. Each one is a small, soft body under a giant animal head, placed over its floor. Each guardian's floor is one giant boss fight with minions: the player must climb the floor, answer its puzzle and reach the deity. Every guardian has its own document. This README holds only what all five share, the order, and the assignment for the exact behaviour.

Status: decided for the animals and their order. Proposal for the shared contract. Open for the points listed under open questions.

## 1. The shared contract

Status: decided for the first and the third rule. Proposal for the rest.

1. **A small body under a giant head.** Each deity is a small, round, soft body, like a plush toy, that carries the giant head of its animal. The head is big and the body is small. The look is cute, not threatening. Exact proportions and any further parts are open. *(Decided: a small body with a giant animal head.)*
2. **Levitation.** Open: whether the deities levitate or stand on their floor. The owner's latest description is a small body under a giant head, so the earlier decision is withdrawn until the owner decides.
3. **The arena is the floor.** The fight takes place on the whole sky floor. There is no separate arena room. *(Decided: one giant boss fight per floor.)*
4. **Each fight is a puzzle.** Each floor has a different puzzle, built from its platforming and from the hindrances in [abilities](../abilities/README.md). The puzzle is solved with the built world's verbs: jumping, building blocks, water, lava, cubes, and going straight up.
5. **Platforming first.** Each floor is strong platforming before it is a fight. The player must be able to reach the deity by climbing, with or without practices. Each floor's platforming is different from the others (see the table in section 2).
6. **The stitch.** The player defeats a deity by hitting it with positive intentions until it falls. The meaning of the owner's word "coser" (to stitch) is open; see the open questions of each guardian.
7. **The minions help.** Minions turned into allies can help the player on the floor. What allies do is proposal in [minions](../minions/README.md).
8. **Not every floor is a minion army.** One floor may be only challenging platforming with the player hitting the deity, with no minions. Which floor, if any, is open.
9. **Negative intentions do nothing.** Sky creatures are won only with positive intentions ([sky laws](../README.md#33-negative-intentions-do-not-work-on-sky-creatures)).

## 2. The order of appearance

Status: decided.

The guardians appear in this order, one per sky floor. The order is the owner's: giant panda, koala, elephant, lion, horse.

| Order | Guardian | Sky floor | Platforming signature (proposal) | Document |
|---|---|---|---|---|
| 1 | Giant panda | Sky floor 1 | Slow vertical climb on columns of stacked blocks; the easiest floor | [PANDA](PANDA.md) |
| 2 | Koala | Sky floor 2 | Long jumps between branches that fade; cages to break out of | [KOALA](KOALA.md) |
| 3 | Elephant | Sky floor 3 | Water channels that carry the player; dams to build | [ELEPHANT](ELEPHANT.md) |
| 4 | Lion | Sky floor 4 | Wide gaps and ledges under a roar that freezes the player | [LION](LION.md) |
| 5 | Horse | Sky floor 5 | Fast runs against gusts of wind over fading platforms | [HORSE](HORSE.md) |

The order is also the rising difficulty of the sky. Each floor adds one new kind of puzzle, and no floor relies on the previous one's answer.

## 3. Assignment: behaviour specification

Status: proposal. The assignment is documentation: the design agent is not run from this folder.

The exact behaviour of every guardian and every minion is not decided here. It is assigned to a design agent. The agent writes it into each guardian's document, in the section named "Behaviour specification".

**Inputs to read (before writing anything):**

- This folder: this README and the five guardian documents.
- The sky laws: [the realm of the sky](../README.md).
- The abilities folder: [abilities](../abilities/README.md) and its eight documents.
- The minions contract: [minions](../minions/README.md).
- The projections and bosses that are built, for shape and feel: the built bestiary under `docs/design/built/` when that branch exists, and until then the existing [BESTIARY](../README.md). Read them for how a fight is paced and telegraphed, not for their content.
- The naming rules in [STORY](../../../built/projections/README.md), section 4 and section 5.

**Output to write:**

- For each guardian, in its own document, under "Behaviour specification":
  - the deity's states and the phases of its fight;
  - its attacks, each one a visible intention the player can answer with movement or with a positive shot;
  - the timing of each attack, as a telegraph window and a target length, marked as target;
  - the pattern of each minion's movement, from the animal;
  - the platforming layout rules of the floor: which cells, which heights, which routes;
  - the stitch mechanic: how positive shots add up, what shows progress, and what the fall looks like.
- Where the document is open, leave the question open and list it. Do not decide an open question silently.

**Constraints:**

- No win through negative intentions, on any floor.
- Nothing in the sky is destroyed for good, except player-made blocks destroyed by a positive intention.
- Every hindrance is telegraphed before it takes effect.
- Every floor can be cleared with no practices.
- The player can always go straight up, and the floor leaves a route for it.
- No code, no model version names, English only.

**Done when:** each of the five guardian documents has a complete "Behaviour specification" section, every hindrance it uses links to its document in [abilities](../abilities/README.md), and the open questions of the document are still listed.

**Result:** written. Each guardian document now holds its specification; the terms all five share are in section 6.

## 4. Index

| Document | Contents | Status |
|---|---|---|
| [PANDA.md](PANDA.md) | Sky floor 1: the giant panda | Proposal, specified |
| [KOALA.md](KOALA.md) | Sky floor 2: the koala | Proposal, specified |
| [ELEPHANT.md](ELEPHANT.md) | Sky floor 3: the elephant | Proposal, specified |
| [LION.md](LION.md) | Sky floor 4: the lion | Proposal, specified |
| [HORSE.md](HORSE.md) | Sky floor 5: the horse | Proposal, specified |

## 5. Open questions

1. **Which built stories are the sky floors.** Open: the mapping of the five sky floors onto the built tree's seven stories ([LEVELS](../../../built/levels/README.md)).
2. **Levitation.** Open: whether the deities levitate or stand on their floor.
3. **The stitch.** Open: the exact meaning of the owner's word "coser" (to stitch) and whether the stitch repairs, defeats, or both.
4. **Which floor is platforming only.** Open: whether one floor has no minions, and which one.
5. **The minions' part.** Open: whether a minion's help changes the fight's phases (see [minions](../minions/README.md)).
6. **Block nests.** The specifications give every floor nests of loose cubes that refill (section 6.3), so building never needs a negative intention. Does the owner want nests, or should blocks come only from breaking the original world?
7. **Broken cubes as player blocks.** A cube from a broken original block, once placed, counts as a player block in the specifications. Is that the owner's reading of the realm's law 3.2?
8. **Winning by allies alone.** Allies add stitches with no cap on four floors. Can a floor be won with no stitch from the player's own hand?
9. **Harm.** The specifications propose 2 points for a deity's lobs, bolts and rings, and no harm from hindrances or minions (section 6.6). The question stays open in [abilities](../abilities/README.md#4-open-questions).
10. **The telegraph ladder.** The warnings shorten from 1.4 s on the first floor to 0.9 s on the fifth (section 6.4). Confirm that the shortening is the sky's rising difficulty.

## 6. Shared terms of the behaviour specifications

Status: proposal. Every number below is a target, not a fact of the code. The built values are given for comparison only.

### 6.1 The player the floors are measured against

Built values, from the built design ([player movement](../../../built/player/MOVEMENT.md), [shot stats](../../../built/intentions/STATS.md), [placing](../../../built/blocks/PLACING.md), [hands](../../../built/player/HANDS.md), [polarity](../../../built/intentions/POLARITY.md)):

- walk about 4.6 blocks a second; jump about 1.26 blocks high; a flat running jump crosses about 2.7 blocks (derived from the walk and the jump); coyote time 0.1 s;
- an intention flies straight for about 8 blocks (half a second at 16 blocks a second) before it falls; 2.7 intentions a second;
- the player places a block within about 5 blocks and carries one block by default;
- a good intention never breaks a block, and a bad one breaks original blocks as it always did. Falling does not hurt.

So, on every sky floor: a one-block step is a jump, a two-block step needs one placed block, a gap of two blocks is a jump, a gap of three is a jump only with a drop of one block or more, and a gap of four or more needs a bridge.

### 6.2 States every deity shares

Each deity has the same core cycle, with its own timings and its own animal states added in its document:

- **Idle**: the animal's own rest. No attack.
- **Watching**: the head turns to the player. Starts when the player comes within the deity's sight (its document gives the distance).
- **Attacking**: one attack, with its telegraph first (section 6.4).
- **Recovering**: the deity is open after an attack. The best moment for a stitch.
- **Hurt**: a short flinch when a stitch lands. It never cancels a telegraph already shown.
- **Rallying**: when a seam is complete (section 6.5) the deity holds for target 2 s, like the built phase hold of 2 s ([fight flow](../../../built/bosses/FIGHT-FLOW.md)), and its next seam begins with one more attack.

The cycle is Idle, Watching, Attacking, Recovering, then Watching again while the player is in sight, or Idle when they are not. Rallying interrupts the cycle once per seam.

**Levitation stays open.** Each document writes the deity's position in two options: (A) it levitates over its seat, or (B) it sits or stands on its seat. The behaviour is the same in both; only the target the player aims at moves.

### 6.3 Original blocks, player blocks and where blocks come from

- **Regrowth.** An original block of a sky floor that breaks comes back after target 5 s. Target 1 s before it returns, its cell shimmers. A block never returns into a cell that holds the player, a minion or a player block; it waits until the cell is free.
- **Block nests.** Each floor has nests: hollows that hold target 3 loose cubes of the floor's material. A cube taken from a nest is replaced after target 6 s. Nests let a player with no practices build without ever using a negative intention.
- **Broken cubes.** A cube that falls out of a broken original block is a loose cube like any other: it can be carried and placed.
- **Placed is the player's.** A cube the player places becomes a player block (the realm's [law 3.2](../README.md#32-blocks-the-player-makes-are-the-exception)). Hindrances never change a player block, and only a positive intention destroys one.

### 6.4 Telegraphs

Every attack and every hindrance shows its telegraph first ([abilities](../abilities/README.md#1-the-shared-rules)). The built game's windups are 0.4 to 0.9 s ([attacks](../../../built/encounters/ATTACKS.md)). The sky is slower to read, and the telegraph shortens as the floors rise:

| Floor | Guardian | Telegraph target |
|---|---|---|
| 1 | Giant panda | 1.4 s |
| 2 | Koala | 1.2 s |
| 3 | Elephant | 1.1 s |
| 4 | Lion | 1.0 s |
| 5 | Horse | 0.9 s |

No sky telegraph is shorter than target 0.8 s.

### 6.5 The stitch

The meaning of the owner's word "coser" stays open (section 5). The specifications use only what the player sees:

- **A stitch** is one positive intention that touches the deity's body or head while the deity is not in a guarded state (each document names its guards, if any).
- **Seams.** Each deity's stitches are counted in three seams, like the built three phases at two thirds and one third ([fight flow](../../../built/bosses/FIGHT-FLOW.md)). Each landed stitch adds a visible stitch mark of light along one seam of the plush body. A complete seam glows; three complete seams end the fight.
- **Allies help.** An ally that reaches the deity, or the place its document names, adds stitches by itself on a timer. The player can win by hitting the deity, by making the minions help, or both.
- **For comparison**: a built floor 1 boss has 140 health, about 40 bad intentions at 3.5 each. In the built game a good intention's warmth converts any boss in about five hits, which the built fight flow lists as an open question ([fight flow](../../../built/bosses/FIGHT-FLOW.md#open-questions)). The sky's counts sit between the two, because every stitch must be climbed for.

### 6.6 What works, and harm

- **What works is a positive intention.** It stitches a deity, turns a minion toward an ally, and answers every attack and hindrance.
- **A negative intention that touches a sky creature goes out with a small puff and does nothing**: no stitch, no harm, no change of side, no reaction. The puff is the feedback that teaches the rule.
- **Harm is open** ([abilities, open question 2](../abilities/README.md#4-open-questions)). The specifications propose: a deity's bolts, lobs and rings may take target 2 points (a quarter of a heart, against the built boss touch of 8); hindrances and minions only move, slow or hold the player. The real cost of a mistake in the sky is lost height.

