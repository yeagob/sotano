[Built](../README.md) · [Design](../../README.md)

# Presences (built)

Pictures and a catalogue entry for each presence are in the [bestiary](../bestiary/README.md). The detail of each presence is in its document below.

Presences are the beings of the depths who speak: the parts of the player that already know. They are archetypes, never gods, saints or real people, and they never give orders. They are immortal: they have no health and take no damage, and a negative intention silences them rather than hurting them. Two are in the game: the Listener, on floors 1 to 5, and the Boundary, a calm guardian of the vaults. The Listener is the reference implementation for a part-for-reward Presence: it searches the carried hand and asks before taking the first matching part. The Gardener is defined in the code but not placed. Everything else in the design is in [not-built/presences](../../not-built/presences/README.md).

| Document | Presence | Where it is | What it does |
|---|---|---|---|
| [LISTENER.md](LISTENER.md) | The Listener | One per floor from 1 to 5, in a quiet room | Takes a monster heart, always drops a 15/75/10 practice or heart reward, and leaves at once |
| [BOUNDARY.md](BOUNDARY.md) | The Boundary | One per vault of a dungeon floor | Stays still while its sanctuary holds; wakes and throws cubes when the sanctuary is broken |
| [MEDITATION-APP.md](MEDITATION-APP.md) | The Sanctuary, the Boundary's meditation app | Opens at the Boundary of each vault, and above the tutorial treasure chest | A quick reward at once (a tier 1–2 practice), or a guided meditation of a random 20–40 seconds for the better one (tier 3–4); six meditations, each with its own scene, music and words |

## What they share (built)

- **Immortal.** No health. The Boundary has armour that absorbs every hit; the Listener has one point of health that nothing removes.
- **Polarity.** Positive intentions pass through with a chime or a healing where it applies. Negative intentions silence a presence within two blocks: its card shows one line of refusal, and it says nothing more until a positive intention passes within eight blocks. See [Polarity](../encounters/POLARITY.md).
- **Talk by contact.** A presence speaks when the player comes within about two blocks of it, in a card with its lines, read in the player's language. The card stays until it is dismissed.
- **Replies and bodies.** Each presence has a body the player cannot walk through. Until its part is brought, it answers each approach with the name of what the player holds, and says it is not what it waits for; with empty hands it says so. It answers at most once every four seconds.
- **The key part.** A presence speaks only to the player who brings it its part. The Listener takes a heart; the Gardener, which is not placed, takes a flesh. The carried hand is searched from the interaction item down, and the first matching part is taken; other carried things stay. Until then the presence says nothing, not even its silence line. See [Parts](../projections/PARTS.md).
- **Their rooms never seal.** A presence's room is placed with no projections in it, so it is cleared from the start and its doors stay open.
- **Look.** The Listener is built from bone tones. The Boundary is limestone, like its vault. Neither uses the cold or the living tones.

## Open questions (shared)

- **Sanctuary.** The design gives each presence a sanctuary: projections never enter its room, and none spawn in its ring. The build does not enforce this beyond the empty room.
- **Kind.** The Boundary is a projection in the code and a creature in the design (see its document). The shared rules above assume a presence is neither.
- **Naming.** The design's roster names eleven presences; the build has two placed and one defined. The rest are in [not-built/presences](../../not-built/presences/README.md).
