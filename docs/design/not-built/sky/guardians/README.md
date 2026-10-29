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

The exact behaviour of every guardian and every minion is not decided here. It is assigned to a design agent on the Opus tier. The agent writes it into each guardian's document, in the section named "Behaviour specification".

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

## 4. Index

| Document | Contents | Status |
|---|---|---|
| [PANDA.md](PANDA.md) | Sky floor 1: the giant panda | Proposal; behaviour to be written |
| [KOALA.md](KOALA.md) | Sky floor 2: the koala | Proposal; behaviour to be written |
| [ELEPHANT.md](ELEPHANT.md) | Sky floor 3: the elephant | Proposal; behaviour to be written |
| [LION.md](LION.md) | Sky floor 4: the lion | Proposal; behaviour to be written |
| [HORSE.md](HORSE.md) | Sky floor 5: the horse | Proposal; behaviour to be written |

## 5. Open questions

1. **Which built stories are the sky floors.** Open: the mapping of the five sky floors onto the built tree's seven stories ([LEVELS](../../../built/levels/README.md)).
2. **Levitation.** Open: whether the deities levitate or stand on their floor.
3. **The stitch.** Open: the exact meaning of the owner's word "coser" (to stitch) and whether the stitch repairs, defeats, or both.
4. **Which floor is platforming only.** Open: whether one floor has no minions, and which one.
5. **The minions' part.** Open: whether a minion's help changes the fight's phases (see [minions](../minions/README.md)).
