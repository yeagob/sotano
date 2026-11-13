# The six tutorial pages

Up: [the Roots](README.md) · Status: built (issue #147). The texts are the book files' words, reviewed with the owner's direction of 2026-11-12 and 2026-11-13; the owner's open word on the wording is listed in [OPEN-QUESTIONS](../../../not-built/levels/roots/OPEN-QUESTIONS.md). The words live in the book files ([`book.en.json`](../../../../../src/content/book/book.en.json), [`book.es.json`](../../../../../src/content/book/book.es.json)); this document gives each slot's purpose and the fact in the code it rests on. If the two disagree, the files are the text and this document is the reason.

## How the pages are built

- **Page 1 fills all 22 slots** and teaches, in the order of the forward ring: what a block is and what a projection is; good and bad intentions (good heals and makes creatures grow, bad breaks blocks and hurts); moving and jumping; picking up, carrying and placing a block. Every room's lesson is true to the exercise it holds.
- **Page 2 changes nine slots**: the plate wall of every room except `roots-gift` (the Sanctuary) and `roots-door` ("come back"). Its other thirteen slots keep page 1's lesson; from page 2 the rooms are carved in the easy layout, so the four lesson walls whose exercise is gone (dig, pit, bridge, seal) show a remembered panel instead ([EASY-LAYOUT §4](EASY-LAYOUT.md#4-the-panels-which-wall-says-what-from-page-2)). The owner likes page 2 as it is.
- **Pages 3 to 6 fill all 22 slots** (owner, 2026-11-13: "from page 3 on, ALL the panels change, in such a way that all the panels of the Roots' floor can be read properly"). No slot of theirs shows a panel of an earlier page, and none falls back to a remembered panel. Each kept the nine panels it had (five of page 3's moved, below) and gained thirteen on its theme.
- **The order of a page** is the forward ring from the start room: in each room, the wall a forward walker faces first ([PANELS §7](PANELS.md#7-which-wall-holds-the-lesson)), then the other. The tables of pages 3 to 6 list the slots in that order (`#`). Each page opens in the hall and closes by the way down.
- **The two special rooms keep making sense.** The treasure room holds the Boundary's Sanctuary chest and the way-down room holds the way down; no panel contradicts them, and no panel of page 2 or later describes an obstacle its easy room does not hold (no panel of pages 3 to 6 speaks of its own room at all, except the Sanctuary panels in the treasure room).
- The order of the themes follows the owner: potions and foods (2), projections and bosses with what they drop (3), practices and recipes (4), the creatures of the world (5), deeper mechanics (6).
- Tone: short, warm, concrete, for a child and an adult at once. No "positive" or "negative" in player text: good and bad. Bombs go off; keys open locks.
- Every fact below was checked in the code on 2026-11-12 (develop at bc98102), and the slots added to pages 3 to 6 on 2026-11-13 (feature/147-roots-book at 995bd6a); a change to that code must update the slot in the same commit.

## Page 1: the roots teach themselves

| Room | Side | Layout | Title | Text (English) | Key | Image | Rests on |
|---|---|---|---|---|---|---|---|
| hall | N (lesson) | lesson | The roots | Everything down here is made of blocks. Throw an intention at one and see what happens. | cast | lesson/blocks | The spawn faces north. A good intention on a whole block does nothing visible; after three, the polarity hint says to switch (`src/game/polarity-hint.ts`) |
| hall | S | plate | Doubt (A projection) | A pattern that blocks your way, given a body made of blocks. No projection lives in the roots. | | bestiary/doubt | Projections are patterns with bodies of blocks (STORY); the roots have no roster; Doubt's `minFloor` is 1 |
| step | N (lesson) | lesson | Good and bad | Your intentions are good or bad. Good ones heal and make creatures grow; bad ones break blocks and hurt. | polarity | lesson/polarity | `src/combat/polarity.ts`; creature growth per good shot (creatures README) |
| step | S | lesson | Move and jump | {jump} jumps one block, never two. Break some dirt, walk into it to pick it up, set it by the wall, climb. | move | lesson/step | Two-high walls at columns 3 and 9; dirt at the corners; walking into a loose block takes it |
| dig | S (lesson) | lesson | Break through | A wall stands in your way. Make your intentions bad and break it: the dirt in the middle gives way first. | cast | lesson/dig | The flipped wall `#####DDD#####` with a dirt plug |
| dig | N (secret) | lesson | Behind the wall | Every wall was once built to keep you safe. You can always break one, or build a better one. | | lesson/behind-wall | Only seen after breaking through; the premise's line on walls |
| mend | N (lesson) | lesson | Mend | Good intentions close cracks. Crack a dirt block with bad ones, switch back, and mend it. | polarity | lesson/mend | A good intention heals a damaged block |
| mend | S | plate | Mossling (A creature of rest) | Stay still beside it for three seconds and it rests with you: you heal a quarter of a heart. Note: Once for each Mossling. | | bestiary/mossling | The Mossling rest rule in `game.ts` |
| pit | N (lesson) | lesson | A way out | Too wide to jump, too deep to climb. Carry a block, set it against the wall, step up, build your way out. | place | lesson/pit | Two-deep trenches three wide |
| pit | S | plate | Wonder (A creature of curiosity) | A paper moth that keeps you company from a distance. It never touches you and never fights. Note: Good intentions make it grow. | | bestiary/wonder | Wonder flees within four blocks; growth rule |
| bridge | N (lesson) | lesson | A bridge | Stand at the edge, place a block in front of you, step onto it, and do it again. | place | lesson/bridge | Four-wide trenches |
| bridge | S | plate | Rootling (A creature of the roots) | It potters along on two short legs, never too close to you and never too far away. Note: Grown three times: a gift? | | bestiary/rootling | Keeps two to six blocks; a friendly creature has a 7.5% chance of a special heart when first grown to three times its size (any floor, issue #102) |
| seal | S (lesson) | lesson | Bombs | Obsidian is too hard for intentions. Break the dirt in the wall, or drop a bomb with bad intentions. | bomb | lesson/bomb | Obsidian `X` walls with dirt `E` plugs; a bomb dropped while good is a white bomb that mends, so bad is needed to break |
| seal | N | lesson | Keys and bombs | Keys open locks. Bombs burst, and can hurt you too. You count them; they take no hand. | | lesson/counters | Keys and bombs are counters, not hand slots; your own black blast costs a heart |
| crates | S (lesson) | lesson | Crates | Break a crate with bad intentions. Now and then one holds a key, a heart or a bomb. | cast | lesson/crates | `rollCrate` (key, heart, bomb) |
| crates | N | lesson | Kick and throw | With full hands, you kick the loose cubes you walk into. You can also throw one. Both hurt projections. | throw | lesson/kick | KICK-AND-THROW |
| spring | S (lesson) | lesson | Water | Wade through the shallows. In deep water, {jump} swims you up. | jump | lesson/water | Swimming: hold jump to swim up |
| spring | N | lesson | Fire and lava | Not in the roots. Deeper down, fire and lava burn. Water puts out fire and turns lava into stone. | | lesson/lava | The tutorial validator keeps fire and lava off floor 0; `quench` and `douse` reactions |
| gift | S (lesson) | lesson | Practices | A practice is a way of growing. Take one and it changes what you can do, and who you are. | inventory | lesson/practice | STORY premise |
| gift | N (kept) | lesson | The Sanctuary | The Boundary keeps this chest. Take the quick gift, or sit a short meditation for a better one. | | lesson/sanctuary | MEDITATION-APP: quick reward or a finished sitting |
| door | S (lesson) | lesson | The way down | The way down asks a price: one thing you carry. A key, a bomb, a block or a heart. | | lesson/way-down | `tollOf(0)` asks one thing |
| door | N (kept) | lesson | Come back | The roots remember you. Walk through every room before you go, and next time the walls may say more. | | lesson/ring | The page advance rule ([PAGES §1](PAGES.md#1-the-current-page)) |

## Page 2: potions and foods

| Room | Side | Layout | Title | Point | Image |
|---|---|---|---|---|---|
| hall | S | lesson (key: drink) | Potions | What released projections leave becomes potions; drink the flask on top of the hand | lesson/drink |
| step | S | lesson (key: place) | The alembic | Floors 2, 4, 6 and 8; up to three parts or blocks; a good intention brews (`LABORATORY_FLOORS`, `alembic.ts`) | lesson/alembic |
| dig | N | lesson (key: place) | The kitchen | Floors 1, 3, 5 and 7; a part becomes a meal; three cooks a kitchen (`KITCHEN_FLOORS`, `kitchen.ts`) | lesson/kitchen |
| mend | S | plate | Plain Tonic | What a bulb no recipe fits makes; restores half a heart | icon/potion/plain-tonic |
| pit | S | plate | Restoring Draught | Restores one heart | icon/potion/restoring-draught |
| bridge | S | plate | Spring Tonic | Jump strength ×1.4 until the next floor | icon/potion/spring-tonic |
| seal | N | plate | Clear Infusion | Range ×1.3 and shot speed ×1.2 for three sealed rooms | icon/potion/clear-infusion |
| crates | N | plate | Questioning Tincture | The next lock asks one key less; never the toll | icon/potion/questioning-tincture |
| spring | N | plate | Hearty Meal (A food) | A heart, mind or essence part cooks a Hearty Meal (one heart); flesh makes a Small Meal | icon/potion/meal-hearty |

## Page 3: projections and bosses, and what they leave

The arc: what a boss is and what a projection is (hall); projections and their deeper forms, each form beside the one it grows from (step to mend); then all fourteen bosses in the order of the floors, from Resistance (floor 1) to the Shadow (floor 9) by the way down. Moved from the page's first version, so the bosses read in order: Bosses (`3-spring-n` → `3-hall-n`), Resistance (`3-pit-s` → `3-pit-n`), Inertia (`3-bridge-s` → `3-pit-s`), the Insatiable (`3-seal-n` → `3-bridge-n`), Overwhelm (`3-crates-n` → `3-bridge-s`). Every boss plate's note "Leaves a practice" rests on FIGHT-FLOW §7 (`bossDown`: the boss's practice appears on its pedestal, whatever the way it is overcome).

| # | Id | Layout | Title | Point | Image | Rests on |
|---|---|---|---|---|---|---|
| 1 | 3-hall-n | lesson | Bosses | Every floor below ends with a boss; overcome it and its practice appears and the way down opens | lesson/boss-room | `BOSS_ZONES` (`src/content/bosses/index.ts`), FIGHT-FLOW §7 |
| 2 | 3-hall-s | lesson (key: polarity) | Projections | Bad intentions release a projection; good ones warm it until it turns to your side | lesson/convert | `src/combat/polarity.ts` |
| 3 | 3-step-n | plate | Second-Guessing (floors 3–7) | Comes at you, stops short, then lunges. Note: Doubt, grown deeper | bestiary/second-guessing | `second-guessing.ts`: `chase({ lunge, hesitate })`, floors 3–7; `LINEAGE` puts it in Doubt's line (`patterns.ts`) |
| 4 | 3-step-s | lesson | Parts | A released projection may leave flesh, heart, mind or essence; it rides in the hand | lesson/parts | PARTS |
| 5 | 3-dig-s | plate | The Margin (floors 3–6) | Never moves; marks the ground where you stand with a slowing patch, and shoots. Note: the Critic, grown deeper | bestiary/margin | `margin.ts`: `speed: 0`, `note` strikes a `slow` field at the target and `shootAt`; floors 3–6; `LINEAGE` critic |
| 6 | 3-dig-n | plate | Inner Critic | Keeps its distance, lobs judgements; a placed block stops them. Leaves a heart or a key sometimes (10%, 8%) | bestiary/critic | `critic.ts` |
| 7 | 3-mend-n | plate | Alarm (floors 3–6) | Like Panic, rushes, swells and bursts, and sets off every Alarm and Panic near it. Note: water calms it | bestiary/alarm | `alarm.ts`: `KIN = ['alarm', 'panic']` within `LINK` 4 start to swell; water `enter` sets `calm` for 2.5 s; floors 3–6 |
| 8 | 3-mend-s | plate | Panic | Rushes, swells, bursts; step out of reach. May leave a bomb (25%) | bestiary/panic | `panic.ts` |
| 9 | 3-pit-n | plate | Resistance (floors 1–2) | A door that walks and rams | bestiary/resistance | `resistance.ts`, Zone I pool |
| 10 | 3-pit-s | plate | Inertia (floors 1–2) | Asleep until pushed; rolls and bounces | bestiary/inertia | `inertia.ts` (`sleep`), Zone I pool |
| 11 | 3-bridge-n | plate | The Insatiable (floors 1–2) | Never walks; pulls the room in and spits it back | bestiary/insatiable | `insatiable.ts`, Zone I pool |
| 12 | 3-bridge-s | plate | Overwhelm (floors 3–4) | A tide with waves low enough to jump | bestiary/overwhelm | `overwhelm.ts`, Zone II pool |
| 13 | 3-seal-s | plate | The Hoard (floors 3–4) | A mound of all it kept: rolls weights, pulls everything back to its pile, then bursts open | bestiary/hoard | `hoard.ts`: phase 1 `tide` and `charge`, phase 2 `inhale` and `barrage`, phase 3 `nova`; floors 3–4 |
| 14 | 3-seal-n | plate | The Downpour (floors 3–4) | A low ceiling of cloud; rains on where you are going, comes lower as it weakens | bestiary/downpour | `downpour.ts`: `barrage`/`puddles` with `walk` (aimed ahead, FIGHT-FLOW §5), `altitude` 3.5, 2.4, 1.6 |
| 15 | 3-crates-s | plate | The Threshold Guardian (floor 5) | A stone gate; bars of force where you stand; at the end it charges and lands on you. Note: always floor 5's boss | bestiary/threshold-guardian | `threshold-guardian.ts`: `bars`, phase 3 `charge` and `slam`; `BOSS_ZONES` keystone of floor 5 |
| 16 | 3-crates-n | plate | The Verdict (floor 6) | A bench with seven lecterns; three accusations at once, then slowing marks on the floor | bestiary/verdict | `verdict.ts`: `accuse` fires three bolts, `sentence` strikes `slow` fields; seven lectern parts in the model; Zone III pool |
| 17 | 3-spring-s | plate | The Grudge (floor 6) | A back of mud and two eyes; sinks and rises elsewhere in a ring that hurts | bestiary/grudge | `grudge.ts`: `surface` strikes a growing ring at a seeded spot and moves the body there (unless the player is within 3) |
| 18 | 3-spring-n | plate | The Old Rule (floor 6) | A stone tablet; in its circles you cannot cast, near it you slow | bestiary/old-rule | `old-rule.ts`: `command` strikes a `mute` field (`muteT` blocks casting, `game.ts`) and a `slow` field round itself |
| 19 | 3-gift-s | plate | The Furnace (floors 7–8) | Draws you toward its mouth; then the floor catches fire | bestiary/furnace | `furnace.ts`: phase 1 `pull` strike, arena `fire` at phase 2 (`roomElement(EL_FIRE)`, `bossArena` in `game.ts`) |
| 20 | 3-gift-n | plate | The Impostor (floors 7–8) | A brass frame with a smile too wide; calls up Doubt, the Critic and Panic | bestiary/impostor | `impostor.ts`: `pretend` summons two of `doubt`, `critic`, `panic` |
| 21 | 3-door-s | plate | The Many Faces (floors 7–8) | A cube ringed with masks; calls a projection to its side, then jumps from place to place | bestiary/many-faces | `many-faces.ts`: `charm` summons one, `swap` moves the body and strikes a ring |
| 22 | 3-door-n | plate | The Shadow (floor 9) | Moves as you move; at the end, stand still beside it for three seconds. Note: its way down asks no toll | bestiary/shadow | `shadow.ts`: `mirrors` follows the player's velocity, `stops` ends it after `STILL` 3 s within 2.5 blocks at a third of its health (`phased`); `tollOf(9)` is null (`levels.ts`) |

## Page 4: practices and recipes

The arc: where practices wait (hall), the paths and the states, practices of every path (mind, will, emotion, body, miracles) up to the seal room; then the recipes from the Recipes lesson on, with the Sanctuary's six sittings in the treasure room, where its chest is, and the Patient Draught by the way down. The practice plates give the item's own description and numbers (`src/content/items/<id>.ts`, `effect`); the recipe plates give `RECIPES` (`src/content/recipes.ts`) and the potion's effect (`POTIONS`, `src/content/potions.ts`).

| # | Id | Layout | Title | Point | Image | Rests on |
|---|---|---|---|---|---|---|
| 1 | 4-hall-n | lesson | Where practices wait | On pedestals in treasure rooms, in the chest a Boundary keeps, and where a boss was overcome | lesson/practice | `pedestalSlots` (treasure, vault, boss rooms, `src/world/floor.ts`); the vault's centre chest kept by the Boundary (CHESTS); FIGHT-FLOW §7 |
| 2 | 4-hall-s | lesson (key: inventory) | Paths | Five paths: miracles, body, mind, emotion, will; the mark shows which (PATHS) | lesson/paths | PATHS |
| 3 | 4-step-n | plate | Visualization (mind) | Intentions fly farther and faster; a Sanctuary sitting. Range ×1.6, shot speed +30% | icon/item/visualization | `visualization.ts`; the `night` meditation's practice (`meditations.ts`) |
| 4 | 4-step-s | lesson | States of being | Three practices of one path make a state of being | lesson/state | `synergies.ts` |
| 5 | 4-dig-s | plate | Second Brain (mind) | Carry one more block. Reach +1 | icon/item/secondbrain | `secondbrain.ts` |
| 6 | 4-dig-n | plate | Grounding (body) | Kicks ×2, reach +1; a Sanctuary sitting | icon/item/grounding | `grounding.ts`; the `ground` meditation |
| 7 | 4-mend-n | plate | Kaizen (will) | Intentions go on through two soft blocks (dirt, crates). Reach +1 | icon/item/kaizen | `kaizen.ts` |
| 8 | 4-mend-s | plate | Gratitude Journal (emotion) | Luck +1.5; a Sanctuary sitting | icon/item/gratitude | `gratitude.ts`; the `dusk` meditation |
| 9 | 4-pit-n | plate | Stoic Resolve (will) | Damage +2; intentions 40% bigger and dropping faster | icon/item/stoic | `stoic.ts` |
| 10 | 4-pit-s | plate | Box Breathing (body) | +1 heart and a full heal; a Sanctuary sitting | icon/item/boxbreathing | `boxbreathing.ts`; the `box` meditation |
| 11 | 4-bridge-n | plate | Radical Acceptance (emotion) | Your own bombs and thrown-block bursts no longer hurt you. +1 heart | icon/item/acceptance | `acceptance.ts` |
| 12 | 4-bridge-s | plate | Self-Compassion (emotion) | +1 heart, heals one; a Sanctuary sitting | icon/item/selfcompassion | `selfcompassion.ts`; the `warm` meditation |
| 13 | 4-seal-s | plate | Dr. Launcher (miracles) | Cast twice quickly: a bomb flies as a missile where you look and bursts on what it meets. Note: it spends one bomb | icon/item/drlauncher | `drlauncher.ts` (a double tap of the fire control within 0.3 s; tags `milagros`) |
| 14 | 4-seal-n | lesson | Recipes | The most exact recipe wins; none fits, a Plain Tonic | lesson/recipe | `topMatches`, `FALLBACK` (`recipes.ts`) |
| 15 | 4-crates-s | plate | Footing Tincture (a recipe) | A flesh part of a body-path pattern and deepstone or obsidian. Kicks ×1.5 for three sealed rooms | icon/potion/footing-tincture | `RECIPES`; `POTIONS['footing-tincture']` |
| 16 | 4-crates-n | plate | Restoring Draught (a recipe) | Two flesh parts, any pattern | icon/potion/restoring-draught | `RECIPES` |
| 17 | 4-spring-s | plate | Clear Infusion (a recipe) | Two mind parts of two different mind-path patterns. Range ×1.3, shot speed ×1.2 | icon/potion/clear-infusion | `RECIPES` (`patterns: 'distinct'`) |
| 18 | 4-spring-n | plate | Spring Tonic (a recipe) | One heart part from a pattern of the body path | icon/potion/spring-tonic | `RECIPES` |
| 19 | 4-gift-s | lesson | Six sittings | The Sanctuary keeps six meditations, each from a practice; finish one and the chest gives a greater practice | lesson/sanctuary | `MEDITATIONS` (six, each with its `practice`); a finished sitting draws tier 3 or 4, the quick reward tier 1 or 2 (`meditations.ts`, MEDITATION-APP §3) |
| 20 | 4-gift-n | plate | Questioning Tincture (a recipe) | A mind part of Doubt's line and a block of iron ore. Note: one key less, once | icon/potion/questioning-tincture | `RECIPES` (`lineage: 'doubt'`, `MAT.ore`); `locks: 1` |
| 21 | 4-door-s | plate | Berserker Draught (a recipe) | Two heart parts of will-path patterns and obsidian. Berserker for two sealed rooms | icon/potion/berserker-draught | `RECIPES`; `ROOMS(2)`, `berserk` |
| 22 | 4-door-n | plate | Patient Draught (a recipe) | A heart and a mind part of the same will-path pattern. Mining ×1.6 for the floor | icon/potion/patient-draught | `RECIPES` (`patterns: 'same'`); `POTIONS['patient-draught']` |

## Page 5: the creatures of the world

The arc: the hall names both worlds (the sky above the great tree and the creatures below); then each room pairs one being of the sky, read first, with one creature of the depths: the sky climbs from floor 1 (the giant panda and its little pandas) to floor 5 while the depths go down; the treasure room holds the two deepest creatures (the Drifter, the Huddler); the way-down room closes with the horse's herd and the horse, which leaves the Triple Jump. The sky's beings are described only by what their code does: their meaning is not documented ([bestiary, gaps](../../../built/bestiary/README.md)). "Good hits" are positive hits: what wins a guardian and turns a herd's member ([sky guardians](../../../built/sky/guardians/README.md), [sky minions](../../../built/sky/minions/README.md)).

| # | Id | Layout | Title | Point | Image | Rests on |
|---|---|---|---|---|---|---|
| 1 | 5-hall-n | lesson | Above and below | The sky above the great tree has five floors, each with a guardian and a herd; here they meet the creatures below | lesson/sky | `DEITIES` and `MINIONS` (five animals, `src/sky/creatures/`) |
| 2 | 5-hall-s | lesson | Creatures | Not patterns, never die; hurt one and it hides until its room is cleared | lesson/creatures | creatures README |
| 3 | 5-step-n | plate | The giant panda (sky floor 1) | Floats over its bamboo seat; standing still on a column top delays its attacks. Won with 24 good hits | bestiary/guardian-panda | `panda.ts`: `HITS = 24`, `REST_BEAT` / `REST_BEAT_WAIT` |
| 4 | 5-step-s | plate | Chirper (floors 1–2) | Sings while its room is safe, silent when a projection is in it | bestiary/chirper | `chirper.ts` |
| 5 | 5-dig-s | plate | Little pandas (sky floor 1) | Walk, climb, roll down slopes, sit; nothing they do hurts. Three good hits turn one | bestiary/herd-panda | `minions/panda.ts` (`hitsToTurn: 3`); a minion's hindrances never hurt or drain (minions README) |
| 6 | 5-dig-n | plate | Delver (floors 1–3) | A small digger with a cap of dirt | bestiary/delver | `delver.ts` |
| 7 | 5-mend-n | plate | The koala (sky floor 2) | Asleep until you come near; too close and it vanishes far away. Won with 30 good hits | bestiary/guardian-koala | `koala.ts`: `TELEPORT_NEAR = 3`, `hits: 30` |
| 8 | 5-mend-s | plate | Bubbler (floors 3–4) | A small fish that stays in its pool | bestiary/bubbler | `bubbler.ts` |
| 9 | 5-pit-n | plate | Koalas (sky floor 2) | Sleep in clusters, hang under branches; one may drop on you: jump three times. Three good hits turn one | bestiary/herd-koala | `minions/koala.ts` (`hitsToTurn: 3`); the joey ride and its three jumps (KOALA, minions README) |
| 10 | 5-pit-s | plate | Ferryback (floors 3–4) | The largest creature, drifting across deep water | bestiary/ferryback | `ferryback.ts` |
| 11 | 5-bridge-n | plate | The elephant (sky floor 3) | Remembers where you stood still longest and aims there. Won with 36 good hits | bestiary/guardian-elephant | `elephant.ts`: `MEMORY = 10` s, `HITS = 36` |
| 12 | 5-bridge-s | plate | Leafling (floors 1–5) | A leaf-shaped light; bad intentions pass through it | bestiary/leafling | `leafling.ts` |
| 13 | 5-seal-s | plate | Young elephants (sky floor 3) | Walk in file round the waterhole, shoulder aside anyone in the way. Five good hits turn one | bestiary/herd-elephant | `minions/elephant.ts` (`hitsToTurn: 5`) |
| 14 | 5-seal-n | plate | Star-mite (floors 1–5) | Three points of light like a constellation | bestiary/star-mite | `star-mite.ts` |
| 15 | 5-crates-s | plate | The lion (sky floor 4) | Basks on its ledge; its roar sends a ring that holds you still: jump it. Won with 42 good hits | bestiary/guardian-lion | `lion.ts`: `ROAR` (paralysis ring, hold 1.5 s, a grounded player only), `hits: 42` |
| 16 | 5-crates-n | plate | Inkmite (floors 5–6) | Ink-black, its eyes its only light | bestiary/inkmite | `inkmite.ts` |
| 17 | 5-spring-s | plate | The pride (sky floor 4) | Stalk low, pounce from above; watched, one stops and stares back. Four good hits turn one | bestiary/herd-lion | `minions/lion.ts` (`hitsToTurn: 4`) |
| 18 | 5-spring-n | plate | Cinderwalker (floors 7–8) | Walks through fire and lava unburned | bestiary/cinderwalker | `cinderwalker.ts` |
| 19 | 5-gift-s | plate | Drifter (floors 5–6) | A pale plate with a low dome; floats about two blocks above the floor. Note: it stands for lightness | bestiary/drifter | `drifter.ts`: `wander({ hover: 2.2 })`; `CREATURE_LIFE` floors 5–6; pattern "Lightness" |
| 20 | 5-gift-n | plate | Huddler (floor 9) | Small, round, a rim of frost; bad intentions pass through it. Note: it stands for warmth shared | bestiary/huddler | `huddler.ts`: `responds: 'positive'`; `CREATURE_LIFE` floor 9; pattern "Warmth shared" |
| 21 | 5-door-s | plate | Horses (sky floor 5) | Gallop a wide loop, kick anyone standing behind them. Four good hits turn one | bestiary/herd-horse | `minions/horse.ts` (`hitsToTurn: 4`, `gallopLoop`) |
| 22 | 5-door-n | plate | The horse (sky floor 5) | Leaps between paddocks; stand still near it and it comes to you, and good hits count twice. Note: won, it leaves the Triple Jump | bestiary/guardian-horse | `horse.ts`: `CALM_RANGE` 8, `CALM_TIME` 1.5 s, `Gentled` (each hit counts two, HORSE), `HORSE_HITS = 48`, `gift: 'triple-jump'` |

## Page 6: deeper mechanics

The arc: good intentions reach further than they seem (warming a boss, white bombs); the hearts, every kind, on the plate walls from the step room to the bridge, among the seal and the chests; the toll and paying it with hearts; omens and cleared rooms; the Listener and growing; the Boundary and its Sanctuary in the treasure room, where it stands; and two closing ideas by the way down: mastery (what the roots give as you earn achievements) and the hidden book that the next page opens.

| # | Id | Layout | Title | Point | Image | Rests on |
|---|---|---|---|---|---|---|
| 1 | 6-hall-n | lesson (key: polarity) | Warm a boss | Fill a boss with good intentions until it turns to your side: that overcomes it too | lesson/warm-boss | `bossDown(floor, 'converted')` (`game.ts`), FIGHT-FLOW §7; the `converted` achievements (`achievements.ts`) |
| 2 | 6-hall-s | lesson (key: bomb) | White bombs | A bomb dropped while good mends blocks and turns lava to water | lesson/white-bomb | BOMBS |
| 3 | 6-step-n | plate | Red heart | Fills one heart of the containers; at full health it waits on the floor. Note: some practices add a container | icon/heart/red | RED (`collectHeart`); `maxHearts` from practices such as Box Breathing (`game.ts` `maxHp`) |
| 4 | 6-step-s | lesson (key: throw) | Hard hits | Thrown blocks hurt by hardness; obsidian about two or three intentions | lesson/throw | KICK-AND-THROW |
| 5 | 6-dig-s | lesson | The seal | A room with projections shuts its doors until the last is gone; the roots never seal | lesson/seal | SEAL-AND-OMENS (the seal; floor 0 never seals) |
| 6 | 6-dig-n | lesson | Chests | Keyholes tell the keys; brass trim means a practice (CHESTS) | lesson/chests | CHESTS |
| 7 | 6-mend-n | plate | Blue heart | One more heart after the containers, even at full health; gone for good once spent. Note: hits take it first | icon/heart/blue | BLUE; `landHit` (`src/entities/hearts.ts`) |
| 8 | 6-mend-s | plate | Stone heart | Every hit halved while it takes the blows | icon/heart/stone | STONE |
| 9 | 6-pit-n | plate | Black heart | Like the blue heart, only far rarer. Note: soot-black, a pale glint | icon/heart/black | BLACK; `HEART_CHANCE` black 1–2 % against blue 8–14 % (`tables/hearts.ts`) |
| 10 | 6-pit-s | plate | Star heart | One heart back and thirty seconds untouchable | icon/heart/star | STAR |
| 11 | 6-bridge-n | plate | Berserker heart | Stronger, faster, higher while held, intentions short; shots bounce off you. Note: the rarest | icon/heart/berserker | BERSERKER (×1.5 damage, speed, jump; range ×0.3; projectiles sent back); `HEART_CHANCE` 0.5–1.5 % |
| 12 | 6-bridge-s | plate | Blood heart | Slow healing up to two hearts; a hit stops it | icon/heart/blood | BLOOD |
| 13 | 6-seal-s | lesson | Paying with hearts | A heart given to the toll is a payment, not a hit: it never kills, and the last heart is never taken | lesson/way-down | TOLL ("a toll never kills"; the last base heart cannot be given, `src/game/toll.ts`) |
| 14 | 6-seal-n | lesson | The toll | One thing more each floor to the fifth, then practices (`tollOf`) | lesson/toll | `tollOf` |
| 15 | 6-crates-s | lesson | Omens | Cold motes gather where a projection will appear; while you stay that close, it waits | lesson/omen | SEAL-AND-OMENS (gather 1.3 s; held while the player is within 3.5 blocks, `src/game/omens.ts`) |
| 16 | 6-crates-n | plate | The Listener (A presence · floors 1–5) | Offer a heart part of a released pattern; it gives something back | bestiary/listener | LISTENER |
| 17 | 6-spring-s | lesson | Cleared rooms | When a room's last projection is gone, it leaves a heart, a bomb or a key about half the time; luck helps | lesson/room-clear | `ROOM_CLEAR` (`tables/rewards.ts`: heart 3, bomb 2, key 2, nothing 7, each drop weighted by luck) |
| 18 | 6-spring-n | lesson (key: cast) | Growing | Good intentions grow a creature to three times its size; the first time, it may leave a heart (7.5%) | lesson/grow | creatures README |
| 19 | 6-gift-s | plate | The Boundary (A presence) | A calm limestone column that keeps a chest; walk up and its Sanctuary opens. Note: one in every vault from floor 1 | bestiary/boundary | `boundary.ts`; `presence: 'boundary'` for vault rooms off floor 0 (`floor.ts`); MEDITATION-APP §2 |
| 20 | 6-gift-n | lesson | Not now | Close the Sanctuary and nothing is lost; the Boundary asks again when you come back | lesson/sanctuary | MEDITATION-APP §2 ("Not now": the chest stays locked, it asks again after the player steps away and back) |
| 21 | 6-door-s | lesson | Mastery | Every achievement raises the mastery of the roots, up to 100; the higher, the more the roots lay out when you wake | lesson/mastery | `mastery()` (achievements unlocked, capped at 100, `achievements.ts`); `rootsRewards` (keys, bombs, hearts, chests, `tables/roots-mastery.ts`) |
| 22 | 6-door-n | lesson | The hidden book | The last lesson: walk every room once more, and next time the walls speak in their own voice | lesson/ring | The page advance ([PAGES §1](PAGES.md#1-the-current-page)); page 7 is the first book page (`FIRST_BOOK_PAGE`) |

## What is not taught yet

Pages 3 to 6 now hold every boss, the Drifter and the Huddler, the sky's guardians and herds, every potion recipe but the Ember Tonic's, and every kind of heart. Still untaught: most projections of floors 1 to 9 (all but Doubt, the Inner Critic, Panic and their second forms), the third forms (Paralysis, the Tribunal, Dread), the Ember Tonic and ice in the alembic, the states of being one by one, keys and locked doors on their own, challenge rooms, fire, and the Gardener (defined, not placed). They can join the book as the owner writes it.

## Not decided

- The lesson wall instead of "south for plates": [question 1](../../../not-built/levels/roots/OPEN-QUESTIONS.md), built with its default.
- The Rootling's note hints at the 7.5% gift; if the owner prefers no hint of chance to a child, the note becomes "Good intentions make it grow" ([question 26](../../../not-built/levels/roots/OPEN-QUESTIONS.md)).
