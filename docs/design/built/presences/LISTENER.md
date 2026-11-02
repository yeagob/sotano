[Presences](README.md)

# The Listener

Built. Floors 1 to 5, one per floor, in a quiet room. Code: `src/content/presences/listener.ts`, placed by `src/content/presences/index.ts`. A run meets up to five Listeners, one on each Tree floor, and each leaves once it has dropped its reward (#65).

The Listener is a pale stone figure of bone, a tall column with a paper-coloured head and two small side plates. It is the first presence the player meets, and what it offers is being heard. It asks nothing and orders nothing.

- **Pattern:** being heard.
- **Health:** one point, which nothing removes.
- **Answers to:** positive intentions only. A negative intention can silence a presence that stays; the Listener does not stay (see Silence).

## Where it is

On each floor from 1 to 5, one room is chosen from the normal rooms that hold no projections, seeded by the floor. Its room is not sealed, since it holds no roster. Floor 0 holds none. A floor holds one Listener, placed when the floor is built; once it has dropped its reward it is gone, and the floor holds none for the rest of the run.

## What the player meets

- **Replies.** Once the Listener has its key, each time the player comes near with something else on top of the hand, it names that thing and says it is not what it waits for. With empty hands it says so. It answers at most once every four seconds.
- **Body.** The Listener has a body: the player cannot walk through it.
- **The key.** The Listener stays silent until a heart is brought to it. Within about two blocks, a heart of a released pattern on top of the hand is taken, and then the Listener talks. Any other thing, and any other kind of part, does nothing. The first time the player comes near without the right part, the Listener says one line that points at what it wants without naming it.
- **Talk.** Once the heart is taken, a card shows two lines. The first asks what weighs on the player; the second says it heard them. The card stays until it is dismissed, and the lines are the same on every visit.
- **The reward.** The Listener never heals. It drops its reward and leaves:
  - **What it drops** is chosen by the floor's seed when the floor is built: a heart, a bomb or a key, equally likely. It is the same for every visit to that floor in the same run.
  - **How many** is drawn from the run's runtime drops stream when the part is accepted: one, two or three, equally likely. It follows the player's actions, not the seed's structure.
  - **How it lands.** Each pickup leaves the Listener in its own arc toward the player, with the gold sparks of a release. A heart is a full heart (two half-hearts), and at full health a heart waits on the floor until the player is hurt, as hearts do. Keys and bombs are collected as usual.
- **Leaving.** Once the reward is on the floor, the Listener is removed from the world: its body, its hooks and its contacts go with it, and the room is ordinary again. A card that is already open stays on the screen.
- **Light.** The design has it show its face only while the player listens, as light from the player's lantern. The build draws it as bone tones, with no such effect.

## Silence

The silence rule (BESTIARY §8.1) is unchanged for presences that stay, the Gardener among them. The Listener does not stay: it leaves when it drops its reward, so its silence leaves with it, and a negative intention in its old room has no effect there (owner decision on #65, option A). Before its part is accepted it is not yet heard, so it cannot be silenced either.

## Decisions taken for #65

- **One Listener per floor, never two on the same floor.** A run has up to five Listeners, one per Tree floor, so "several per run" is met by the floors, not by a second Listener in the same place. A floor that has given its reward keeps none.
- **The count is 1 to 3.** The issue leaves the number open; a single drop is too little for a reward that always lands.
- **Leaving is immediate.** The Listener is removed in the same moment its drop appears. A reading where it waits until the drop is picked up would keep its silence in play for a while; the owner should check this, because it changes whether silence can ever reach the Listener.

## Open questions

- **The choice.** The design has the player choose which of their paths weighs on them, and gives a Lesson from that path. The build offers no choice and no Lesson; it drops and leaves.
- **Standing still.** The design has the player stand still beside it. The build talks on contact, without stillness.
- **The tree.** The design places one Listener in a quiet side emanation of each Tree floor. The build places it in any quiet normal room of floors 1 to 5, which the code calls the tree level.
- **Lines.** The lines are English and Spanish texts awaiting owner approval (the design leaves names and lines open).
