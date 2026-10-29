# Elephant: the third guardian (sky floor 3)

Up: [Guardians](README.md) · [The realm of the sky](../README.md)

The elephant is the third deity: an elephant with a giant head on a small, soft plush body, over sky floor 3, a floor of channels and rivers that carry the player.

Status: proposal. The animal and the floor order are decided. The character, the mirror, the minions and the puzzle are proposals.

## 1. Who it is

An elephant head, huge, grey, with ears that open like sails and a trunk that curls down to the floor. Elephants remember. They travel long distances, they keep to their herd, and they are slow to anger and slow to forget.

**Mirror (proposal).** The elephant mirrors carrying an old weight: grudges, old hurts and the rehearsal of what happened long ago, carried into every new room. The pattern is memory that never gets put down. The practice the elephant points to is remembering with care and putting the weight down on purpose.

The elephant is wise and strong rather than cruel. Its floor is about carrying: what the player carries, and what the floor carries away.

## 2. Floor order

Sky floor 3, the middle of the five. The player arrives having learned to climb (panda) and to commit to a jump (koala). Here the floor moves: water and its currents make every route a question of direction.

## 3. Minions

The minions are the elephant itself, embodied as smaller elephants of the herd. The shared rules are in [minions](../minions/README.md). This animal's minion, its movement and its character are below.

- **Movement.** Elephants walk heavily, in lines, with a steady pace that does not change. A minion walks the floor like the herd walks a path, and it wades through water without slowing.
- **Character.** Patient, protective of the herd, not quick to attack. It flaps its ears, which is the sign it is about to push.
- **Rules tied to the animal.** A minion pushes the player with its shoulder or its trunk (see [knockback](../abilities/KNOCKBACK.md)). It sprays water from its trunk (see [water currents](../abilities/WATER-CURRENTS.md)). It does not climb: it stays on the floor, so the player can always escape up.

## 4. Arena and puzzle

**The arena.** The floor is a set of channels cut into the blocks, with banks between them and a central pool. Water runs through the channels. Some channels are dry at the start, and water fills them when the elephant calls it.

**The platforming.** Crossings over water, jumps from one bank to the next, and ledges above the channels. Water carries the player along the channel, so the route is a question of direction and timing.

**The puzzle (proposal).** Water is coming down a channel toward a drop, and the player must build a dam to stop it, or cross on the bank before it fills. The elephant's trunk pushes the player off a bank at the wrong moment, so the player must stand where the push cannot send them into the water. The route up is a staircase of dams, built one block at a time. Each dam the player builds stays (section 3.2 of the realm README).

**Hindrances used (proposal).**

- [Water currents](../abilities/WATER-CURRENTS.md): instantiated water that pushes and carries the player along the channels.
- [Knockback](../abilities/KNOCKBACK.md): the trunk kicks the player off a bank.

The owner has not assigned hindrances to animals. This choice is proposal, and the open questions list it.

## 5. How minions turn into allies

A positive shot at an elephant minion turns it into an ally (decided, see [minions](../minions/README.md)). This elephant ally, proposal:

- stands in a channel and holds the water back, so a dam does not have to be built there;
- pushes a minion that is about to push the player, so the knockback goes to a minion instead.

## 6. The stitch

The elephant falls when the player hits it with enough positive intentions. The meaning of the stitch is open ([guardians](README.md#1-the-shared-contract)). The elephant's fall is proposal: the water drains from the channels, and the herd of minions stays on the floor until it is done.

## Behaviour specification

To be written by the design agent assigned in guardians/README.md.

## Open questions

1. Is the water a hindrance the elephant creates, or a feature of the floor that the elephant only switches on?
2. Does the elephant's trunk push send the player off a ledge with no fall, or always onto a safe block? (Knockback rules: [knockback](../abilities/KNOCKBACK.md).)
3. Does the dam the player builds stay after the floor is cleared?
4. Is the elephant's floor the one that can be cleared without minions? (See [guardians](README.md).)
