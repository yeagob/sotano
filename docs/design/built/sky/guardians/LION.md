# Lion (built)

Up: [The guardians of the sky (built)](README.md) · sky floor 4, the plain.

The fourth deity: a golden lion head with a full mane on a small plush body, floating over the Sunning Ledge, the highest ledge of a plain of rocks and gaps. The full design, its targets and its open questions are in [not-built LION](../../../not-built/sky/guardians/LION.md).

## What the player meets

- **Where.** The lion floats one block over the Sunning Ledge and paces along it in the air, 3 blocks each way at one block a second. It does not teleport.
- **Basking.** It starts curled on its ledge for at least 4 s and watches the player within 14 blocks.
- **Glides.** For the Pounce and the Scruff hold the lion glides out to the player's ledge, lands beside them, and glides back at 6 blocks a second after its recovery.
- **Facing the roar, its own rule.** A player whose aim stays on the lion for half a second of a roar's telegraph halves the roar's ring. A positive hit during a telegraph softens that attack.
- **The Stare-down** (owner, 2026-11-05, provisional). While the player looks away from the lion, its gaze builds over 5 s and falls back when they look again (a cone of 30 degrees counts as looking). When it is full, a 1.2 s warning, then it drains 12 spirit. Looking back at the lion is the answer.
- **Three phases**, at a third and two thirds of its 42 hits; the rest between attacks is 3 s, then 2.5 s, then 2 s.

## Attacks

| # | Attack | Phase | What it does | Answer |
|---|---|---|---|---|
| 1 | Roar | 1 | A ring of paralysis spreads at the level of the player's ground, 8 blocks a second out to 12; a grounded player it passes is held 1.5 s | Jump as it passes; face the lion to halve it |
| 2 | Crosswind | 1 | A gust of 3 s across the player's ledge toward its nearest edge | A block in its line |
| 3 | Long grass | 1 | The top cells round the player (radius 3) are dense for 5 s, never past the ledge's edge nor on a placed block | Walk off it, or build over it |
| 4 | Pounce | 2 | The lion glides to the player's ledge; its landing ring pushes 5 blocks | Jump the ring, or move off the ledge before it lands |
| 5 | Scrape | 2 | The strip of the ledge on the lion's side turns to mist for 3 s, then reforms | Step back onto firm rock |
| 6 | Dusk call | 2 | Three rings, from the Sunning Ledge and from each shade rock; any ring that touches the player drains 14, once | Jump the rings |
| 7 | Mane flare | 3 | Three sun bolts in a fan, each a push along its line | A block in the line stops a bolt |
| 8 | Noon sun | 3 | A glare on the player's ledge; still in the sun when it ends drains 16 | Get under shade within 3 blocks overhead (a roof of placed blocks counts) |
| 9 | Scruff hold | 3 | A glide to the player and a ring that closes round them; inside, they are held 3 s and lose one practice ("The lion holds you by the scruff and keeps one of your practices.") | Leave the ring |

The spreading rings of the roar and the dusk call are the lion's own hindrance (`lion-ring`). The player may build roofs and walls on this floor (owner, 2026-11-05).

## Won

At 42 positive hits the lion lies down and its pride with it ("The lion lies down, and its pride lies down with it."): the stare ends, the lion settles over its ledge, purring, the floor's way up over the thorn tree opens and spirit refills. An ally lion rubbing against it adds a hit every 5 s, at most 14 in all (provisional: a third of the target).

## Not built

- **The ledges do not settle** when the lion is won.
- **No rally minions:** the two minions the rally calls are not spawned (no floor spawns minions yet).
- **No wall stops the roar:** a placed wall does not stop the roar's ring.
- **No tower glide:** the lion does not glide to a tower to knock it down.
- An ally's back as a step is not built.
- The lion's sounds are placeholders made of the game's existing cues; its own voice waits for the audio pass.
- The art gate is pending owner review ([lion art](../../../../art/sky/lion.md)).

Code: `src/sky/creatures/deities/lion.ts`, `src/sky/hindrances/lion-ring.ts`, `src/audio/sky/lion.ts`; tests in `tests/sky-lion.test.ts`.
