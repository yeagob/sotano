[Presences](README.md)

# The Listener

Built. Floors 1 to 5, one per floor, in a quiet room. Code: `src/content/presences/listener.ts`, placed by `src/content/presences/index.ts`.

The Listener is a pale stone figure of bone, a tall column with a paper-coloured head and two small side plates. It is the first presence the player meets, and what it offers is being heard. It asks nothing and orders nothing.

- **Pattern:** being heard.
- **Health:** one point, which nothing removes.
- **Answers to:** positive intentions only. A negative intention silences it.

## Where it is

On each floor from 1 to 5, one room is chosen from the normal rooms that hold no projections, seeded by the floor. Its room is not sealed, since it holds no roster. Floor 0 holds none.

## What the player meets

- **Replies.** Once the Listener has its key, each time the player comes near with something else on top of the hand, it names that thing and says it is not what it waits for. With empty hands it says so. It answers at most once every four seconds.
- **Body.** The Listener has a body: the player cannot walk through it.
- **The key.** The Listener stays silent until a heart is brought to it. Within about two blocks, a heart of a released pattern on top of the hand is taken, and then the Listener talks. Any other thing, and any other kind of part, does nothing. The first time the player comes near without the right part, the Listener says one line that points at what it wants without naming it.
- **Talk.** Once the heart is taken, a card shows two lines. The first asks what weighs on the player; the second says it heard them. The Listener heals a quarter of a heart the first time. It talks once per run.
- **Silence.** Once it has been heard, a negative intention within two blocks makes it turn its light away. A card shows its refusal: a line that asks the player to say something kinder. It says nothing more until a positive intention passes within eight blocks, which lifts the silence.
- **Light.** The design has it show its face only while the player listens, as light from the player's lantern. The build draws it as bone tones, with no such effect.

## Open questions

- **The choice.** The design has the player choose which of their paths weighs on them, and gives a Lesson from that path. The build offers no choice and no Lesson; it heals and talks.
- **Standing still.** The design has the player stand still beside it. The build talks on contact, without stillness.
- **Once only.** It talks once per run. The design has it permanent; should a second visit to the room say something new?
- **The tree.** The design places one Listener in a quiet side emanation of each Tree floor. The build places it in any quiet normal room of floors 1 to 5, which the code calls the tree level.
- **Lines.** The lines are English and Spanish texts awaiting owner approval (the design leaves names and lines open).
