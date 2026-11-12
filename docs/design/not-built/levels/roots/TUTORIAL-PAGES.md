# The six tutorial pages

Up: [the Roots as an evolving tutorial](README.md) · Status: proposal (written to the owner's direction for issue #147; awaiting the owner's read). The words live in the book files ([`book.en.json`](../../../../../src/content/book/book.en.json), [`book.es.json`](../../../../../src/content/book/book.es.json)); this document gives each slot's purpose and the fact in the code it rests on. If the two disagree, the files are the text and this document is the reason.

## How the pages are built

- **Page 1 fills all 22 slots** and teaches, in the order of the forward ring: what a block is and what a projection is; good and bad intentions (good heals and makes creatures grow, bad breaks blocks and hurts); moving and jumping; picking up, carrying and placing a block. Every room's lesson is true to the exercise it holds.
- **The lesson wall** of each room (the one a forward walker faces, [PANELS §7](PANELS.md#7-which-wall-holds-the-lesson)) keeps page 1's lesson on every page. From page 2 the rooms are carved in the easy layout, and the four lesson walls whose exercise is gone (dig, pit, bridge, seal), with the step room's south slot, show a remembered panel instead ([EASY-LAYOUT §4](EASY-LAYOUT.md#4-the-panels-which-wall-says-what-from-page-2)).
- **Pages 2 to 6 change the nine other slots**: the plate wall of every room except `roots-gift` (the Sanctuary) and `roots-door` ("come back"), which stay because they belong to their room.
- The order of the themes follows the owner: potions and foods (2), projections and bosses with what they drop (3), practices and recipes (4), the creatures of the world (5), deeper mechanics (6).
- Tone: short, warm, concrete, for a child and an adult at once. No "positive" or "negative" in player text: good and bad. Bombs are breakthroughs, keys open locks.
- Every fact below was checked in the code on 2026-11-12 (develop at bc98102); a change to that code must update the slot in the same commit.

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
| seal | S (lesson) | lesson | Breakthroughs | Obsidian is too hard for intentions. Break the dirt in the wall, or drop a breakthrough with bad intentions. | bomb | lesson/breakthrough | Obsidian `X` walls with dirt `E` plugs; a breakthrough dropped while good is a white bomb that mends, so bad is needed to break |
| seal | N | lesson | Keys and seeds | Keys open locks. Breakthroughs are seeds that burst, and can hurt you too. You count them; they take no hand. | | lesson/counters | Keys and bombs are counters, not hand slots; your own black blast costs a heart |
| crates | S (lesson) | lesson | Crates | Break a crate with bad intentions. Now and then one holds a key, a heart or a breakthrough. | cast | lesson/crates | `rollCrate` (key, heart, bomb) |
| crates | N | lesson | Kick and throw | With full hands, you kick the loose cubes you walk into. You can also throw one. Both hurt projections. | throw | lesson/kick | KICK-AND-THROW |
| spring | S (lesson) | lesson | Water | Wade through the shallows. In deep water, {jump} swims you up. | jump | lesson/water | Swimming: hold jump to swim up |
| spring | N | lesson | Fire and lava | Not in the roots. Deeper down, fire and lava burn. Water puts out fire and turns lava into stone. | | lesson/lava | The tutorial validator keeps fire and lava off floor 0; `quench` and `douse` reactions |
| gift | S (lesson) | lesson | Practices | A practice is a way of growing. Take one and it changes what you can do, and who you are. | inventory | lesson/practice | STORY premise |
| gift | N (kept) | lesson | The Sanctuary | The Boundary keeps this chest. Take the quick gift, or sit a short meditation for a better one. | | lesson/sanctuary | MEDITATION-APP: quick reward or a finished sitting |
| door | S (lesson) | lesson | The way down | The way down asks a price: one thing you carry. A key, a breakthrough, a block or a heart. | | lesson/way-down | `tollOf(0)` asks one thing |
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

| Room | Side | Layout | Title | Point | Image |
|---|---|---|---|---|---|
| hall | S | lesson (key: polarity) | Projections | Bad intentions release a projection; good ones warm it until it turns to your side | lesson/convert |
| step | S | lesson | Parts | A released projection may leave flesh, heart, mind or essence; it rides in the hand | lesson/parts |
| dig | N | plate | Inner Critic | Keeps its distance, lobs judgements; a placed block stops them. Leaves a heart or a key sometimes (10%, 8%) | bestiary/critic |
| mend | S | plate | Panic | Rushes, swells, bursts; step out of reach. May leave a breakthrough (25%) | bestiary/panic |
| pit | S | plate | Resistance (A boss · floors 1–2) | A door that walks and rams. Leaves a practice | bestiary/resistance |
| bridge | S | plate | Inertia (A boss · floors 1–2) | Asleep until pushed; rolls and bounces. Leaves a practice | bestiary/inertia |
| seal | N | plate | The Insatiable (A boss · floors 1–2) | Never walks; pulls the room in and spits it back. Leaves a practice | bestiary/insatiable |
| crates | N | plate | Overwhelm (A boss · floors 3–4) | A tide with waves low enough to jump. Leaves a practice | bestiary/overwhelm |
| spring | N | lesson | Bosses | Every floor below ends with a boss; overcome it and its practice appears and the way down opens (FIGHT-FLOW §7) | lesson/boss-room |

## Page 4: practices and recipes

| Room | Side | Layout | Title | Point | Image |
|---|---|---|---|---|---|
| hall | S | lesson (key: inventory) | Paths | Five paths: miracles, body, mind, emotion, will; the mark shows which (PATHS) | lesson/paths |
| step | S | lesson | States of being | Three practices of one path (body, mind, emotion or will) make a state of being | lesson/state |
| dig | N | plate | Grounding (A practice · body) | Its description, and that the Sanctuary keeps a sitting of it. Kicks ×2, reach +1 | icon/item/grounding |
| mend | S | plate | Gratitude Journal (A practice · emotion) | Luck +1.5; a Sanctuary sitting | icon/item/gratitude |
| pit | S | plate | Box Breathing (A practice · body) | +1 heart and a full heal; a Sanctuary sitting | icon/item/boxbreathing |
| bridge | S | plate | Self-Compassion (A practice · emotion) | +1 heart, heals one; a Sanctuary sitting | icon/item/selfcompassion |
| seal | N | lesson | Recipes | The most exact recipe wins; none fits, a Plain Tonic (`recipes.ts`) | lesson/recipe |
| crates | N | plate | Restoring Draught (A recipe) | Two flesh parts, any pattern | icon/potion/restoring-draught |
| spring | N | plate | Spring Tonic (A recipe) | One heart part from a pattern of the body path | icon/potion/spring-tonic |

## Page 5: the creatures of the world

| Room | Side | Layout | Title | Point | Image |
|---|---|---|---|---|---|
| hall | S | lesson | Creatures | Not patterns, never die; hurt one and it hides until its room is cleared | lesson/creatures |
| step | S | plate | Chirper (floors 1–2) | Sings while its room is safe, silent when a projection is in it | bestiary/chirper |
| dig | N | plate | Delver (floors 1–3) | A small digger with a cap of dirt | bestiary/delver |
| mend | S | plate | Bubbler (floors 3–4) | A small fish that stays in its pool | bestiary/bubbler |
| pit | S | plate | Ferryback (floors 3–4) | The largest creature, drifting across deep water | bestiary/ferryback |
| bridge | S | plate | Leafling (floors 1–5) | A leaf-shaped light; bad intentions pass through it | bestiary/leafling |
| seal | N | plate | Star-mite (floors 1–5) | Three points of light like a constellation | bestiary/star-mite |
| crates | N | plate | Inkmite (floors 5–6) | Ink-black, its eyes its only light | bestiary/inkmite |
| spring | N | plate | Cinderwalker (floors 7–8) | Walks through fire and lava unburned | bestiary/cinderwalker |

## Page 6: deeper mechanics

| Room | Side | Layout | Title | Point | Image |
|---|---|---|---|---|---|
| hall | S | lesson (key: bomb) | White seeds | A breakthrough dropped while good mends blocks and turns lava to water (BOMBS) | lesson/white-seed |
| step | S | lesson (key: throw) | Hard hits | Thrown blocks hurt by hardness; obsidian about two or three intentions | lesson/throw |
| dig | N | lesson | Chests | Keyholes tell the keys; brass trim means a practice (CHESTS) | lesson/chests |
| mend | S | plate | Stone heart | Every hit halved while it takes the blows | icon/heart/stone |
| pit | S | plate | Star heart | One heart back and thirty seconds untouchable | icon/heart/star |
| bridge | S | plate | Blood heart | Slow healing up to two hearts; a hit stops it | icon/heart/blood |
| seal | N | lesson | The toll | One thing more each floor to the fifth, then practices (`tollOf`) | lesson/toll |
| crates | N | plate | The Listener (A presence · floors 1–5) | Offer a heart part of a released pattern; it gives something back | bestiary/listener |
| spring | N | lesson (key: cast) | Growing | Good intentions grow a creature to three times its size; the first time, it may leave a heart (7.5%) | lesson/grow |

## What is left for later pages

The Hoard, the Downpour, the Threshold Guardian, the Verdict, the Grudge, the Old Rule, the Furnace, the Impostor, the Many Faces and the Shadow; the projections of floors 3 to 9; the Drifter and the Huddler; the rest of the potions and recipes; the blue and black hearts. They can join the book as the owner writes it.

## Open questions

- The lesson wall instead of "south for plates": [question 1](OPEN-QUESTIONS.md).
- The Rootling's note hints at the 7.5% gift; if the owner prefers no hint of chance to a child, the note becomes "Good intentions make it grow".
