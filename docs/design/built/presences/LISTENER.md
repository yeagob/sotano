[Presences](README.md)

# The Listener

Built. Floors 1 to 5, one per floor, in a quiet room. Code: `src/content/presences/listener.ts`, placed by `src/content/presences/index.ts`. A run meets up to five Listeners, one on each Tree floor. Each drops its reward and stays until every pickup of it is taken, then leaves (#65, #77).

The Listener is a pale stone figure of bone, a tall column with a paper-coloured head and two small side plates. It is the first presence the player meets, and what it offers is being heard. It asks nothing and orders nothing.

- **Pattern:** being heard.
- **Health:** one point, which nothing removes.
- **Answers to:** positive intentions only. A negative intention can silence it, as it can any presence that stays, until its reward is picked up (see Silence).

## Where it is

On each floor from 1 to 5, one room is chosen from the normal rooms that hold no projections, seeded by the floor. Its room is not sealed, since it holds no roster. Floor 0 holds none. A floor holds one Listener, placed when the floor is built; once its reward is picked up it is gone, and the floor holds none for the rest of the run.

## What the player meets

- **Replies.** Until the Listener has its key, each time the player comes near with something else on top of the hand, it names that thing and says it is not what it waits for. With empty hands it says so. It answers at most once every four seconds.
- **Body.** The Listener has a body: the player cannot walk through it.
- **The key.** The Listener stays silent until a heart is brought to it. Within about two blocks, a heart of a released pattern on top of the hand is taken, and then the Listener talks. Any other thing, and any other kind of part, does nothing. The first time the player comes near without the right part, the Listener says one line that points at what it wants without naming it.
- **Talk.** Once the heart is taken, a card shows two lines. The first asks what weighs on the player; the second says it heard them. The card stays until it is dismissed, and the lines are the same on every visit.
- **The reward.** The Listener never heals. It drops its reward and stays:
  - **What it drops** is chosen by the floor's seed when the floor is built: a heart 40%, a bomb 35% or a key 25%. It is the same for every visit to that floor in the same run.
  - **How many** is drawn from the run's runtime drops stream when the part is accepted: one 50%, two 35% or three 15%. It follows the player's actions, not the seed's structure.
  - **How it lands.** Each pickup leaves the Listener in its own arc toward the player, with the gold sparks of a release. A heart is a full heart (two half-hearts), and at full health a heart waits on the floor until the player is hurt, as hearts do. Keys and bombs are collected as usual.
- **Leaving.** The Listener stays after its drop, with its body, until every pickup of its reward has been taken. Then it is removed from the world: its body, its hooks and its contacts go with it, and the room is ordinary again. A card that is already open stays on the screen.
- **Light.** The design has it show its face only while the player listens, as light from the player's lantern. The build draws it as bone tones, with no such effect.

## Silence

The silence rule (BESTIARY §8.1) applies to the Listener while it stays, as it does to the Gardener. A negative intention within two blocks silences it, and a positive one within eight lifts the silence. Its silence leaves with it when it is removed, so a negative intention in its room has no effect once the reward is picked up. Before its part is accepted it is not yet heard, so it cannot be silenced either.

## Decisions taken for #65

- **One Listener per floor, never two on the same floor.** A run has up to five Listeners, one per Tree floor, so "several per run" is met by the floors, not by a second Listener in the same place. A floor that has given its reward keeps none.
- **The count is 1 to 3.** The issue leaves the number open; a single drop is too little for a reward that always lands. The weights are set by #77.

## Decisions taken for #77

- **The Listener stays until its reward is picked up.** The owner's reading of #77: it no longer leaves at the drop. Its removal happens once every pickup of its reward is taken (or has fallen out of the world, which takes it too). This supersedes the immediate leaving of #65, and it means its silence can reach it again while it stays.
- **The weights are data, one place.** `LISTENER_KIND_WEIGHTS` (heart 40, bomb 35, key 25) and `LISTENER_COUNT_WEIGHTS` (one 50, two 35, three 15) in `src/content/presences/index.ts`, the owner's suggested starting values, to be tuned there.
- **No seed bump.** The owner said the seed does not need to change for this. The kind is still one draw from the floor's fork, now read through the weighted table, so a seed code may give a different kind on a Listener floor than it did before #77.
- **A heart at full health holds the Listener.** Hearts wait on the floor until the player is hurt, so a Listener that drops only hearts stays until the player takes one. This follows from the wait; the owner should check it.

## Open questions

- **The choice.** The design has the player choose which of their paths weighs on them, and gives a Lesson from that path. The build offers no choice and no Lesson; it drops and waits to be emptied.
- **Standing still.** The design has the player stand still beside it. The build talks on contact, without stillness.
- **The tree.** The design places one Listener in a quiet side emanation of each Tree floor. The build places it in any quiet normal room of floors 1 to 5, which the code calls the tree level.
- **Lines.** The lines are English and Spanish texts awaiting owner approval (the design leaves names and lines open).
