# Minions of the sky

Up: [The realm of the sky](../README.md)

The minions are the animals of the sky, embodied as smaller creatures. Each guardian has its own herd, pride or family of minions. A minion is the animal itself, not a creature shaped like it: its movement is the animal's own, and its behaviour follows the animal's habits. This README holds the rules every minion shares. The character and movement of each animal's minions are in that animal's guardian document, linked below.

Status: decided for the allies rule, for the negative-intention rule and for the rule that minions never die. Proposal for the rest.

Built, in play: the minion engine, the five herds and a spawner on each guardian floor ([built minions](../../../built/sky/minions/README.md)). Not built: the `factionChange` event when a minion turns, the lion's rally minions, and the koala's refill of the very cluster a turned koala left.

## 1. The shared contract

### 1.1 Embodied animal

Status: decided.

A minion is the animal embodied: the panda, the koala, the elephant, the lion or the horse, at a smaller size. The animal's own movement comes first, and the minion's behaviour is tied to the animal's habits. A minion must read as its animal before it reads as a threat.

### 1.2 Movement from the animal

Status: proposal.

Each minion moves the way its animal moves. Its attacks are the animal's own actions (a push, a pounce, a roar, a bolt). The shared rule is that a player can learn an animal's movement by watching it, and then predict it. The exact movement of each animal is in its guardian document.

### 1.3 Behaviour rules tied to the animal

Status: proposal.

Every minion has rules that come from the animal, not from a generic enemy template. A minion never acts without a visible sign first, and a sign is always the animal's own (the elephant's ears, the lion's mane, the horse's rear).

### 1.4 Negative intentions do nothing

Status: decided.

A negative shot has no effect on a minion. A minion is won only by a positive intention (see the realm's [law 3.3](../README.md#33-negative-intentions-do-not-work-on-sky-creatures)).

### 1.5 Positive shots turn minions into allies

Status: decided.

A positive shot at a minion turns it into an ally. The minion stops attacking the player and starts to help.

## 2. What allies do

Status: proposal.

An ally helps the player on the floor. The help must come from the animal's habits, and it must never make the floor impassable. Each guardian's document says what its allies do. The shared forms are:

- **Hold.** An ally holds something in place (a block, a ledge, a current), so the player can climb it.
- **Clear.** An ally pushes or moves a minion out of the way.
- **Carry.** An ally carries the player for a short distance, where the animal carries.

An ally does not do the player's platforming for them. The player still makes the jump, the block and the route.

### 2.1 Allies go for the deity the player shoots (#357)

Status: built as a target (owner, 2026-11-26).

While the player's positive or negative shots have touched a deity in the last 4 s, every ally of its floor leaves its other help and goes to it: along the floor's graph, then straight under it. An ally that reaches it (within 1.5 blocks plus the deity's half width, and up to 6 blocks under its body) holds it still for 2 s: the deity does not move, does not attack and does not change state, and anything it had already started runs on. After the 2 s it is free again, and no ally can hold it again for 3 s more. The owner said "it stays still for 2 seconds"; the 3 s gap is a proposal, so a crowd of allies cannot hold a deity for good.

## 3. When the deity is defeated

Status: proposal.

What happens to the minions when their deity is defeated is open in form. The proposal: allies stay allies and keep their help on the floor; minions that are not allies change their attitude with their deity, or leave the floor. Whether they stay after the floor is cleared is open (section 7).

## 4. Minions never die

Status: decided.

No minion dies, in any way (the realm's [law 3.7](../README.md#37-nothing-dies-in-the-sky)). At most a minion transforms, changes its attitude and behaviour (turning into an ally is one such change), or leaves the floor. A minion that leaves can come back; nothing in the sky is removed for good.

## 5. Are minions projections?

Status: open.

The rules for enemies in [STORY section 4](../../../built/projections/README.md) say enemies are projections of patterns. The owner has not said whether the sky's minions are projections. They are the animals, not patterns, so the answer changes the naming and the mirror rules. Open.

## 6. Index

The minions of each guardian are described in that guardian's document. The shared rules are in this README.

Each guardian document's "Behaviour specification" holds the minions' count, spawn, movement, rules, ally help and targets (section B5 of each).

| Animal | Guardian | Movement, in one line (proposal, specified) | Status |
|---|---|---|---|
| Giant panda | [PANDA](../guardians/PANDA.md#behaviour-specification) | Walks slowly, climbs columns one block at a time, sits in the way, tucks and rolls down slopes, chews original blocks | Proposal, specified |
| Koala | [KOALA](../guardians/KOALA.md#behaviour-specification) | Sleeps in clusters, climbs any face and hangs under branches, swings and drops, hugs and holds until shaken off | Proposal, specified |
| Elephant | [ELEPHANT](../guardians/ELEPHANT.md#behaviour-specification) | Walks heavily in file at one steady pace, wades without slowing, trumpets to close the herd, flaps its ears and shoulders the player aside, sprays up channels, climbs no more than one block | Proposal, specified |
| Lion | [LION](../guardians/LION.md#behaviour-specification) | Stalks low, faster when unseen and still when watched, circles, holds ledges, pounces from above, roars a small freeze | Proposal, specified |
| Horse | [HORSE](../guardians/HORSE.md#behaviour-specification) | Gallops wide loops, passes close and turns away, grazes once a loop, kicks from behind, bolts when startled | Proposal, specified |

## 7. Open questions

1. Are minions projections? (Section 5.)
2. What happens to the minions after the floor is cleared, and which of them transform, change attitude or leave when their deity is defeated? (Section 3.)
3. How many minions does a floor have? The owner asked for ten to twenty times the first counts (#357): the targets are now ten times each: 40, 60, 50, 60 and 50 (30, 60, 30, 40 and 30 hostile), with their effects three to five times stronger (section 8). The owner has to confirm them after playing.
4. Allies and negative intentions. In the built game a bad intention harms an ally and can turn it back. In the sky a negative intention does nothing to any sky creature, allies included, so an ally never turns back. Confirm.

## 8. Many, and hard to ignore (#357)

Status: built as a target; numbers provisional until the owner plays them.

| Animal | Max (was) | Hostile (was) | Count × | Effect × | What the effect multiplies | Spawn |
|---|---|---|---|---|---|---|
| Panda | 40 (4) | 30 (3) | 10 | 4 | the roll's shove 3.75 → 15; a new shove at 5 blocks | six every 3 s |
| Koala | 60 (6) | 60 (6) | 10 | 3 | hug 2 → 6 s; wakes at 4 → 12; climbs toward the player from 8 → 24 | six every 4 s |
| Elephant | 50 (5) | 30 (3) | 10 | 3 | shoulder 2 → 6 blocks; spray current 3 → 9 | five every 3 s |
| Lion | 60 (6) | 40 (4) | 10 | 3 | pounce ring 5 → 15; roar freeze 1 → 3 s | six every 3 s |
| Horse | 50 (5) | 30 (3) | 10 | 4 | kick 2.5 → 10 blocks | six every 3 s |

- **The floor fills fast:** when the player arrives, a batch comes at once at the next spawn places (scattered over each place), then one batch a warning, until the hostile count is reached.
- **They hunt:** once the deity is awake, a share of each herd (panda six in ten, elephant and horse half; the koalas climb toward the player and the lions stalk on their own) leaves its habit and walks to the player along the floor's graph, then straight at them.
- **They block:** a minion between the player and the deity takes the shot meant for the deity (and is turned by it).
- **Telegraphs:** every minion blow is a hindrance with the floor's telegraph (1.4 to 0.9 s); at most three minion shoves are on show at once on the panda's floor, 1.2 s apart.
