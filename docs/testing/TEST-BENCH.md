# The test bench

Up: [testing](README.md) · a panel, opened with `?test`, to test the whole game (the sky included) in a browser without playing through every floor.

The bench ships in the bundle but builds nothing unless `?test` is in the URL: without it, no panel, no tick and no change to play (`tests/test-bench.test.ts`). It owns no rule of its own: every button calls a real game path. Code: `src/debug/test-bench.ts` (the logic and the guide's data, no DOM), `src/debug/test-panel.ts` (the panel), `Game.debugFloor` and `Game.refillSpirit` in `src/game/game.ts`, the words in `src/i18n/locales/test-bench.en.ts` and `test-bench.es.ts`.

## 1. Start the dev server

```bash
npm install
npm run dev            # Vite on http://localhost:5174 (vite.config.ts)
```

The launch configuration `.claude/launch.json` (`the-roots`) serves the same page on the same port. Open the address with a flag, for example `http://localhost:5174/?test`.

## 2. URL flags

| Flag | What it does |
|---|---|
| `?test` | Adds the test bench: a **Test** button at the top right opens the panel |
| `?sky` | The run starts on the sky's deck (`Game.debugSky`), as if the built tree had been climbed |
| `?gallery[=page]` | The art review page instead of the game ([OVERVIEW](../architecture/OVERVIEW.md), ART-GUIDE §13) |
| `?sandbox[=scenario]` | The creative room, with the `S.sb` console; `&lab` runs the scenario's script ([SANDBOX](../architecture/SANDBOX.md)) |
| `?seed=ABCD-EFGH` | Replays a run |
| `?lang=en` / `?lang=es` | The language, without saving it |

Flags combine: `?test&sky` starts on the deck with the panel; `?test&seed=ABCD-EFGH` tests one known run. The planned sky flags `?sky=1…6`, `&won=` and `&jump3` ([SKY §15](../architecture/SKY.md)) are not built.

## 3. Using the panel

With the keyboard and mouse the game holds the mouse while you play: press **Esc** to pause and free it, then use the panel. Clicks on the panel never reach the game. The panel fits a phone's width (16 px on each side) and scrolls inside itself. **Hide** folds it back into the **Test** button. No key is bound.

The status line says where you are: the floor and its name, or the sky and the spirit out of 100.

| Section | Button | What it does |
|---|---|---|
| God mode | **God mode: on / off** | On: the console's `S.god(true)` (no damage), `S.keys` and `S.bombs` top both counters up to 99 whenever they fall under 90, `S.heal` fills the hearts, and spirit stays at 100. The bench applies this four times a second, so a new run (R), a toll or a spent key is undone within a quarter of a second. A heart paid as a toll still goes through the damage rules for that instant. Off: `S.god(false)`; the counters keep what they hold |
| Floors | **0 · The roots … 9 · The ice** | `Game.debugFloor(k)`: carves and activates floor k (the capture's landing path, `undergroundSpawn`), carves the floor under it, and stands you in its start room. No toll is paid and the floors above are skipped. From the sky, the gate fades you down first, as a spirit fall does. Refused in the sandbox and while a fade is running |
| Floors | **Sky deck** | `Game.debugSky()`: the gate fades you up to the sky's deck. It does nothing when you are already in the sky |
| Sky | **Refill spirit** | `Game.refillSpirit()`: spirit back to 100 |
| Practices | **Give all** | Every practice, the sky's Triple Jump included, through `Game.grant`: no banners |
| Practices | one button per practice | `Game.give(id)`: the practice with its banner, light and sound, as from a pedestal |
| Guide | **Underground**, **The sky** | The guide of section 4, folded by floor, in the player's language |

**Sending the player to a deity's floor is not possible.** No hook exists for it: `debugSky` takes no floor, `SkyRealm` has no teleport to a hall, and the `?sky=n` flag and `S.sky.go(n)` of [SKY §15](../architecture/SKY.md) are not built. From the deck, walk the foot door and the spiral up to floor 1, then each way up as its deity is won. God mode keeps spirit full, so a fight never sends you underground.

## 4. The guide, floor by floor

The same text as the panel's guide. Sources: [levels/floors](../design/built/levels/floors/README.md), [bosses](../design/built/bosses/README.md) and [fight flow](../design/built/bosses/FIGHT-FLOW.md), `src/content/levels.ts` (the toll, `tollOf`), `src/content/bosses/index.ts` (pools, health); for the sky [SKY §7–§8](../architecture/SKY.md), [guardians](../design/not-built/sky/guardians/README.md) and `src/sky/creatures/deities/*.ts`.

### 4.1 Underground

| Floor | Layout | Boss | Way out | Asks for |
|---|---|---|---|---|
| 0 · The roots | A fixed tutorial plan of eleven rooms: the start room, with the treasure room and the way down beside it, and eight lesson rooms around them in a ring. Every door is open; the lessons are on stone tablets on the walls. | No boss and no projections. | The way down is the door room beside the start room. Its hole opens when the toll is paid. | 1 thing: a block or a part from your hand, a key, a bomb or a heart. |
| 1 · Limbo | The Tree of Life: ten rooms on a fixed map of 7 by 7 cells. You land in the kingdom at one end; the heart at the centre is the treasure room, the foundation below it is the vault (it needs a key). Floors are mirrored one to the next; which side floor 1 starts on is **not documented, see [TREE-OF-LIFE](../design/built/levels/floors/TREE-OF-LIFE.md)**. | One of Resistance, Inertia, The Insatiable, drawn by the seed (health 140). | The crown, the boss room at the far end of the map. Its doors seal, the boss rises after 1.2 s; when it is beaten or converted by positive intentions, pay the toll and a 2 by 2 hole opens down into the next start room. | 2 things: blocks or parts from your hand, keys, bombs or hearts, each once. |
| 2 · The winds | As floor 1. | As floor 1, never the same boss twice in a run (health 179). | As floor 1. | 3 things. |
| 3 · The rain | As floor 1. | One of Overwhelm, The Hoard, The Downpour (health 229). | As floor 1. | 4 things. |
| 4 · The weights | As floor 1. | As floor 3 (health 293). | As floor 1. | 5 things. |
| 5 · The marsh | The last Tree of Life floor. Its crown is two cells wide: the great pit, a long hall with still water and braziers. | The Threshold Guardian, always (health 374). | The great pit: beat the boss, pay the toll, and a 4 by 4 shaft opens into the centre of the next start room. | 1 practice you hold, lost for the run. |
| 6 · The walls | A random plan of 8 to 11 rooms. The boss room is the dead end farthest from the start; another dead end is the treasure room; no vault. Bigger rooms are common. | One of The Verdict, The Grudge, The Old Rule (health 478). | The boss room: beat the boss, pay the toll, and a 2 by 2 shaft opens down. Digging down instead meets lava in the rock. | 2 practices. |
| 7 · The rivers | As floor 6. | One of The Furnace, The Impostor, The Many Faces (health 612). | As floor 6. | 3 practices. |
| 8 · The ditches | As floor 6. | As floor 7 (health 782). | As floor 6. | 4 practices. |
| 9 · The ice | A random plan like the circles above, frozen: every pool is ice on top, water under it. | The Shadow, always (health 1000). | The boss room: beat the Shadow and a free 2 by 2 shaft drops you into silence. | Nothing: the hole is free. |
| Silence | A sealed chamber of air under the ninth floor's boss room, dark and quiet. | | Stand still for 3 s: you are carried up above the giant tree and float. Rising to the top of the sky opens the sky realm. | |

The panel names the floors and bosses from the catalogs, so it reads the same pools and health in Spanish. The floor jump skips the toll: to test a toll, jump to the floor and walk to its boss room.

### 4.2 The sky

The sky floors follow their specified layouts (provisional) and are not verified in play; the realm spawns no minions yet.

| Place | Layout | How to win | Way up |
|---|---|---|---|
| The deck | A disc of cloud round the sky tree's trunk. Falling off it takes you down to the giant tree's crown in the underground world. | | The foot door in the trunk: a heartwood spiral up the foot well comes out on floor 1, beside the Bamboo Seat. |
| 1 · The giant panda (the bamboo seat) | A grove of columns of stacked blocks, with slopes between them. The panda floats over the Bamboo Seat at the height of the tallest column. The easiest floor. | Land 24 positive hits on its body or head, in any state: it has no guard. Two phases, the second from 12 hits. An ally sitting against it adds a hit every 4 s. | The way up opens over the Bamboo Seat's ledge strip when the panda is won. |
| 2 · The koala (the branches) | A ring of branches joined by trunks round a central gap. The koala floats over the Fork, a crown of living wood over the gap at about 30 blocks. Some branches fade after a warning; cages of cubes must be broken out of. | Land 30 positive hits. From the second phase it clings after each attack and hits bounce off; an ally hugging it lifts the guard. When you come within 3 blocks it teleports far away. | The way up opens over a trunk's knots when the koala is won. |
| 3 · The elephant (the channels) | A stepped mountain of five rings up to the Basin, a pool at its top. Channels run down to the waterhole on the ground ring and fill when the elephant calls the water. | Land 36 positive hits. Only hits on the small body seen over the rim, or on the head while the trunk is raised, count. An ally in the waterhole adds a hit every 6 s. | The way up opens over the tusk line when the elephant is won. |
| 4 · The lion (the plain) | A plain of ledges at several heights with wide gaps and no walls: your own blocks are the cover. The lion paces in the air over the Sunning Ledge. | Land 42 positive hits: no guard, but it paces and pounces. Keep looking at it: the Stare-down drains spirit after 5 s of looking away. | The way up opens over the thorn tree when the lion is won. |
| 5 · The horse (the meadow) | A wide meadow of raised paddocks and platforms that fade and return, with gusts of wind. The horse walks and leaps; it does not float. | Land 48 positive hits. Stand still on its Paddock or within 8 blocks of it for 1.5 s: it comes up Gentled for 3 s and each hit counts twice. Won, it leaves the Triple Jump on its paddock. | The way up is at the top of the mast, into Totality. |
| Totality | Platforms spiralling up from the crown to the Sun, about 60 hops; every sixth is a checkpoint, where the updraft brings you back after a fall. | | Needs the Triple Jump (the horse's gift, or give it from Practices). The last jump from the last checkpoint enters the Sun; Unity is not built, so nothing follows yet. |

**Spirit and the sky's rules.**

- Nothing in the sky takes health. Special attacks drain spirit (out of 100): at most once per attack, 6 s apart, never while you are held nor within 1 s after.
- At 0 spirit you are sent to a random underground floor, 0 to 9, and spirit refills. A won deity refills it too. A capture holds you 3 s and takes one practice.
- Only positive intentions work on sky creatures: a negative one goes out in a puff. A tower of your blocks that reaches a deity's height is knocked down after a warning. Broken sky blocks grow back.

The hit counts, guards and allies' timers are the code's (`HITS` and the `hits`, `guard` and `ally` fields of each deity definition), all targets of the guardian documents, provisional until the owner tunes them.

## 5. Known gaps

Not bugs to fix from the bench: these are reported as not built yet.

- **The Sun's entrance** is built as the approved flat field: the last jump enters the Sun and records it, and Unity (issue #95) does nothing yet.
- **Elephant:** positive shots that go into the dust circle; grey water or stone in flight; the tower sweep; no sound.
- **Lion:** the ledges settling when it is won; the rally's minions; a wall that stops the roar's ring; the tower glide.
- **Horse:** the leap to a tower; its sounds.
- **Koala:** the body floating in for Hold fast and back to the Fork after a teleport; the telegraph poses; its sounds.
- **Panda:** floating to a tower or in Cradle; the tower trigger on the floor; the minion spawner on the floor; its sounds.
- **The bench itself:** no jump to a deity's floor (section 3); no button to win a deity or open a way up; the planned `?sky=n`, `&won=`, `&jump3` flags and the `S.sky` console are not built.
