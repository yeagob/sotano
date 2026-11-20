# The tutorial: the prologue (five pages)

Up: [the Roots](README.md) · Status: built (the prologue of the owner's book, 2026-11-15). The words live in the book files ([`book.en.json`](../../../../../src/content/book/book.en.json), [`book.es.json`](../../../../../src/content/book/book.es.json)); this document gives each slot's purpose and the code its fact rests on. If the two disagree, the files are the text and this document is the reason.

The tutorial is a prologue to the book. It moves from the technical to the meaning: page 1 the basics, page 2 the ingredients and the recipes, page 3 the further technical lessons, page 4 who lives down here and why they are named so, page 5 the practices, the attitude and why the game is made this way. After page 5 the walls begin the book's front matter, then the Kamino pages, then the three book pages ([HIDDEN-BOOK](../../../not-built/levels/roots/HIDDEN-BOOK.md)).

## How the pages are built

- **Page 1 fills all 22 slots**, teaching layout. It is the only page the validator makes full; its texts are the ones the owner kept, plus the new lesson on taking and placing a block (`1-step-s`).
- **Page 2 fills 14 slots**: the ingredients, the alembic, the kitchen, the drinking lesson and every recipe, one panel per recipe. Its other eight slots show page 1's panel, or in the easy layout the remembered one.
- **Pages 3, 4 and 5 fill all 22 slots**, so no slot of theirs shows a panel of an earlier page (owner's rule, 2026-11-13; tested in both languages).
- **The order of a page** is the forward ring from the start room: in each room, the wall a forward walker faces first, then the other. The tables below list the slots in that order (hall, step, dig, mend, pit, bridge, seal, crates, spring, gift, door; north then south).
- **From page 2 on the rooms are carved in the easy layout** ([EASY-LAYOUT](EASY-LAYOUT.md)): the four lesson walls whose exercise is gone show a remembered panel where a page leaves the slot out (`easy-*`).
- **Reading the file:** the text of each slot is the file's text in English. Spanish is in `book.es.json` with the same ids, layouts and keys.

## What each page's facts rest on

Checked in the code on 2026-11-15 for this prologue:

- **Controls** (`src/input/bindings.ts`, `BINDINGS`): place is the right mouse button (keyboard), LT (gamepad), a tap on the block (touch); cast is the left mouse button held, RT, the touch bead; jump is Space, A, the touch button; throw Q, B; drink G, X; bomb E, RB; polarity F, LB, the touch turn; inventory Tab or I, Y. Picking up a loose block is passive: walking into it (`PASSIVE`). A placed block goes on the face the aim ray hits within reach (`tryPlace`, `src/game/game.ts`); with nothing in reach it is thrown.
- **Recipes** (`src/content/recipes.ts`, `RECIPES`): eight recipes, the fallback `plain-tonic`. Meals are cooked in the kitchen (`src/game/kitchen.ts`): flesh gives the small meal (half a heart), heart, mind or essence the hearty one (one heart). The alembic (`src/game/alembic.ts`) takes up to three things; a good intention brews, a bad one boils off.
- **Parts** (`src/content/parts.ts`): flesh, mind, heart, essence, left by released projections with chances 0.30, 0.12, 0.05, 0.02.
- **Projections and families** (`src/content/patterns.ts`, `LINEAGE`): the seven families on page 4 (doubt, critic, panic, procrastination, comparison, distraction, perfectionism); each name is the game's own name (`src/i18n`).
- **Creatures** (`src/content/creatures`, the creatures README): never die, never attack, grow with good intentions; the names and their meanings are the game's (Wonder, Mossling, Huddler, Drifter, Ferryback).
- **Presences** (`src/content/presences`, the presences README): the Listener (takes a part, gives a reward, leaves), the Boundary (keeps the Sanctuary). The Sanctuary's meditations and rewards: `MEDITATION-APP.md`.
- **Sky** (`docs/design/built/sky/README.md`): five guardians (panda, koala, elephant, lion, horse) and their herds, above the great tree.
- **Practices and paths** (`src/content/items`, `src/content/palette.ts` `PATHS`): five paths (miracles, body, emotion, mind, will); three practices of one path make a state of being (`src/content/synergies.ts`). Miracles has one practice in code, Dr. Launcher (`drlauncher.ts`). Forgiveness is an emotion practice.
- **Toll and leaving behind** (`src/game/toll.ts`): the way down asks one thing from the hand or the hearts. A new run clears the hand, the keys, the bombs, the bonus hearts and the practices (`begin` in `src/game/game.ts`: `inventory.restore([])`); the save keeps the achievements, the mastery and the book's page (`src/game/meta.ts`).
- **Hearts** (`src/entities/hearts.ts`, `src/content/hud-icons.ts`): red, blue, black, stone, star, berserker, blood; the rare ones are the six that are not red.
- **Floors**: kitchens on the odd floors 1, 3, 5, 7; the way down after each boss.

Not closed in the design (not named on any panel, as the owner asked): the presences of [not-built/presences](../../../not-built/presences/README.md) (the Witness, the Elder, the Child, the Cartographer, the Boatman, the Mender, the Star-reader, the Wanderer, the Trickster, the Echo), the bosses of [not-built/bosses](../../../not-built/bosses/README.md), and the creature acts of [not-built/creatures](../../../not-built/creatures/README.md). `4-bridge-s` and `4-spring-s` say, without naming any of them, that there are presences and forms still to come.

## Corrections the owner decided (2026-11-15)

- `1-step-s` has the key cap `jump` and says `{place}` in its text; `easy-step-s` has the key cap `place`.
- The rare hearts are one plate (`3-crates-n`); the red heart is the page 4 plate `4-crates-n`, so page 3 has no red-heart slot.
- `3-door-n` says the hands-on lessons end here ("El porqué" / "The why"); the walls to come speak of the why.
- The Machado epigraph and the author's page are on the book side of the book ([HIDDEN-BOOK](../../../not-built/levels/roots/HIDDEN-BOOK.md)).

## Pull request notes: saves at pages 6 to 9

The book is longer than the tutorial, so a saved page moves with the book. A save holds a page number (`roots.page`, read in `src/game/meta.ts` as an integer of at least 1; `RootsBook` caps it at the page count), so no save breaks. Players saved on page 6 (the old sixth tutorial page) now open on the title page; players saved on pages 7, 8 or 9 (the old first three book pages) open on the epigraph, the author's page and the thanks, and reach the old book pages at 17 to 19. No migration (owner's decision, 2026-11-15). The first book page (`book.page.7`) unlocks at page 6, the title page; its id is kept, saves hold it.

## The tables

The tables are generated from the English file; the Spanish file has the same ids, layouts and keys, and each text is its translation.

## Page 1 (`tutorial-1`), 22 slots

| Slot | Id | Layout | Title | Text (English) | Key | Image |
|---|---|---|---|---|---|---|
| hall N | 1-hall-n | lesson | The roots | Everything down here is made of blocks. Throw an intention at one and see what happens. | cast | lesson/blocks |
| hall S | 1-hall-s | plate | Doubt (A projection) | A pattern that blocks your way, given a body made of blocks. No projection lives in the roots. |  | bestiary/doubt |
| step N | 1-step-n | lesson | Good and bad | Your intentions are good or bad. Good ones heal and make creatures grow; bad ones break blocks and hurt. | polarity | lesson/polarity |
| step S | 1-step-s | lesson | Take, place, jump | Touch a loose block to take it. {place} sets it where you aim. Jump one block, never two. | jump | lesson/step |
| dig N | 1-dig-n | lesson | Behind the wall | Every wall was once built to keep you safe. You can always break one, or build a better one. |  | lesson/behind-wall |
| dig S | 1-dig-s | lesson | Break through | A wall stands in your way. Make your intentions bad and break it: the dirt in the middle gives way first. | cast | lesson/dig |
| mend N | 1-mend-n | lesson | Mend | Good intentions close cracks. Crack a dirt block with bad ones, switch back, and mend it. | polarity | lesson/mend |
| mend S | 1-mend-s | plate | Mossling (A creature of rest) | Stay still beside it for three seconds and it rests with you: you heal a quarter of a heart. |  | bestiary/mossling |
| pit N | 1-pit-n | lesson | A way out | Too wide to jump, too deep to climb. Carry a block, set it against the wall, step up, build your way out. | place | lesson/pit |
| pit S | 1-pit-s | plate | Wonder (A creature of curiosity) | A paper moth that keeps you company from a distance. It never touches you and never fights. |  | bestiary/wonder |
| bridge N | 1-bridge-n | lesson | A bridge | Stand at the edge, place a block in front of you, step onto it, and do it again. | place | lesson/bridge |
| bridge S | 1-bridge-s | plate | Rootling (A creature of the roots) | It potters along on two short legs, never too close to you and never too far away. |  | bestiary/rootling |
| seal N | 1-seal-n | lesson | Keys and bombs | Keys open locks. Bombs burst, and can hurt you too. You count them; they take no hand. |  | lesson/counters |
| seal S | 1-seal-s | lesson | Bombs | Obsidian is too hard for intentions. Break the dirt in the wall, or drop a bomb with bad intentions. | bomb | lesson/bomb |
| crates N | 1-crates-n | lesson | Kick and throw | With full hands, you kick the loose cubes you walk into. You can also throw one. Both hurt projections. | throw | lesson/kick |
| crates S | 1-crates-s | lesson | Crates | Break a crate with bad intentions. Now and then one holds a key, a heart or a bomb. | cast | lesson/crates |
| spring N | 1-spring-n | lesson | Fire and lava | Not in the roots. Deeper down, fire and lava burn. Water puts out fire and turns lava into stone. |  | lesson/lava |
| spring S | 1-spring-s | lesson | Water | Wade through the shallows. In deep water, press {jump} to swim up. | jump | lesson/water |
| gift N | 1-gift-n | lesson | The Sanctuary | The Boundary keeps this chest. Take the quick gift, or sit a short meditation for a better one. |  | lesson/sanctuary |
| gift S | 1-gift-s | lesson | Practices | A practice is a way of growing. Take one and it changes what you can do, and who you are. | inventory | lesson/practice |
| door N | 1-door-n | lesson | Come back | The roots remember you. Walk through every room before you go, and next time the walls may say more. |  | lesson/ring |
| door S | 1-door-s | lesson | The way down | The way down asks a price: one thing you carry. A key, a bomb, a block or a heart. |  | lesson/way-down |

## Page 2 (`tutorial-2`), 14 slots

| Slot | Id | Layout | Title | Text (English) | Key | Image |
|---|---|---|---|---|---|---|
| hall N | 2-hall-n | plate | Plain Tonic (No recipe) | What the alembic makes when no recipe fits. Plain, but never nothing. |  | icon/potion/plain-tonic |
| hall S | 2-hall-s | lesson | Ingredients | A freed projection sometimes leaves a part: flesh, mind, heart or essence. Blocks are ingredients too. |  | lesson/parts |
| step N | 2-step-n | plate | Hearty Meal (In the kitchen) | A flesh part: a light meal, half a heart. Heart, mind or essence: a hearty meal, one heart. |  | icon/potion/meal-hearty |
| step S | 2-step-s | lesson | The alembic | On floors 2, 4, 6 and 8. Feed it up to three parts or blocks, then touch it with a good intention. | place | lesson/alembic |
| dig N | 2-dig-n | lesson | The kitchen | On floors 1, 3, 5 and 7. Give it a part and it cooks you a meal. Three meals, then its fire is out. | place | lesson/kitchen |
| mend S | 2-mend-s | lesson | Potions | What released projections leave can become potions. With a flask on top of your hand, drink it. | drink | lesson/drink |
| pit S | 2-pit-s | plate | Restoring Draught (Recipe) | Two parts of flesh. |  | icon/potion/restoring-draught |
| bridge S | 2-bridge-s | plate | Footing Tincture (Recipe) | One flesh part of the body path and a block of deepstone or obsidian. |  | icon/potion/footing-tincture |
| seal N | 2-seal-n | plate | Spring Tonic (Recipe) | One heart part of the body path. |  | icon/potion/spring-tonic |
| crates N | 2-crates-n | plate | Clear Infusion (Recipe) | Two mind parts from two different projections. |  | icon/potion/clear-infusion |
| spring N | 2-spring-n | plate | Questioning Tincture (Recipe) | One mind part of the doubt family and a block of iron ore. |  | icon/potion/questioning-tincture |
| gift S | 2-gift-s | plate | Ember Tonic (Recipe) | One heart part of the will path. |  | icon/potion/ember-tonic |
| door N | 2-door-n | plate | Patient Draught (Recipe) | One heart and one mind from the same projection, of the will path. |  | icon/potion/patient-draught |
| door S | 2-door-s | plate | Berserker Draught (Recipe) | Two heart parts of the will path and a block of obsidian. |  | icon/potion/berserker-draught |

## Page 3 (`tutorial-3`), 22 slots

| Slot | Id | Layout | Title | Text (English) | Key | Image |
|---|---|---|---|---|---|---|
| hall N | 3-hall-n | lesson | Bosses | Every floor below ends with a boss. Overcome it and its practice appears, and the way down opens. |  | lesson/boss-room |
| hall S | 3-hall-s | lesson | Projections | Bad intentions release a projection. Good ones warm it until it turns to your side. | polarity | lesson/convert |
| step N | 3-step-n | lesson | Parts | A released projection may leave a part: flesh, heart, mind or essence. It rides in your hand. |  | lesson/parts |
| step S | 3-step-s | lesson | Hard hits | A thrown block hurts by its hardness. Dirt barely bruises; obsidian hits like two or three intentions. | throw | lesson/throw |
| dig N | 3-dig-n | lesson | Chests | A padlock's keyholes tell how many keys a chest asks. Brass trim means a practice waits inside. |  | lesson/chests |
| dig S | 3-dig-s | lesson | The seal | Step into a room with projections and its doors slam shut until the last one is gone. The roots never seal. |  | lesson/seal |
| mend N | 3-mend-n | lesson | Warm a boss | Bosses can be warmed too. Fill one with good intentions until it turns to your side: that also overcomes it. | polarity | lesson/warm-boss |
| mend S | 3-mend-s | lesson | White bombs | Drop a bomb with good intentions: it bursts in light, mends blocks and turns lava into water. | bomb | lesson/white-bomb |
| pit N | 3-pit-n | lesson | Above and below | Above the great tree, the sky has five floors, each with a guardian and a herd. Here they meet the creatures below. |  | lesson/sky |
| pit S | 3-pit-s | lesson | Creatures | Creatures are not patterns, and they never die. Hurt one and it hides until its room is cleared. |  | lesson/creatures |
| bridge N | 3-bridge-n | plate | The Listener (A presence · floors 1–5) | Offer it the heart part of a released pattern, and it gives you something back. |  | bestiary/listener |
| bridge S | 3-bridge-s | plate | The Boundary (A presence) | A tall, calm column of limestone that keeps a chest. Walk up to it and its Sanctuary opens. |  | bestiary/boundary |
| seal N | 3-seal-n | lesson | The toll | Each way down asks more: one thing more on every floor until the fifth, then practices. |  | lesson/toll |
| seal S | 3-seal-s | lesson | Paying with hearts | A heart given to the toll is a payment, not a hit. It never kills you, and your last heart is never taken. |  | lesson/way-down |
| crates N | 3-crates-n | plate | Rare hearts (Blue, black, stone…) | Blue, black, stone, star, berserker and blood. Each helps in its own way; you will see when you find one. |  | icon/heart/blue |
| crates S | 3-crates-s | lesson | Omens | Before a projection appears, cold motes gather where it will stand. While you stay that close, it waits. |  | lesson/omen |
| spring N | 3-spring-n | lesson | Growing | Good intentions make a creature grow, up to three times its size. The first time, a grown one may leave a heart. | cast | lesson/grow |
| spring S | 3-spring-s | lesson | Cleared rooms | When the last projection of a room is gone, the room leaves a heart, a bomb or a key about half the time. Luck helps. |  | lesson/room-clear |
| gift N | 3-gift-n | lesson | Not now | Close the Sanctuary and nothing is lost: the chest stays shut, and the Boundary asks again when you come back. |  | lesson/sanctuary |
| gift S | 3-gift-s | lesson | Six sittings | The Sanctuary keeps six meditations, each from a practice. Finish one and the chest gives you a greater practice. |  | lesson/sanctuary |
| door N | 3-door-n | lesson | The why | Here the hands-on lessons end. Walk every room once more: the walls to come speak of the why. |  | lesson/ring |
| door S | 3-door-s | lesson | Mastery | Every achievement raises the mastery of the roots, up to 100. The higher it is, the more you find here when you wake. |  | lesson/mastery |

## Page 4 (`tutorial-4`), 22 slots

| Slot | Id | Layout | Title | Text (English) | Key | Image |
|---|---|---|---|---|---|---|
| hall N | 4-hall-n | prose |  | You know how to move. Now the why. Nothing down here is named by chance: each name points at something you already know from your own life. |  |  |
| hall S | 4-hall-s | plate | Projections (The ones in your way) | They are not people. They are patterns: a doubt, a judging voice, a fear. They never speak. |  | bestiary/doubt |
| step N | 4-step-n | prose |  | They carry the names of patterns: Doubt, Inner Critic, Panic, Comparison, Perfectionism. If something like that ever held you back, you know them already. Naming a thing is the first step: what has a name can be looked at. |  |  |
| step S | 4-step-s | prose |  | Nobody is killed down here. A projection is freed, and what held you back sometimes leaves something that feeds you. So it goes with a fear once you finally look at it. |  |  |
| dig N | 4-dig-n | prose |  | They come in families: doubt, the critic, panic, putting things off, comparison, distraction, perfectionism. Each family has small and large forms, like a habit that grows when nobody is looking. |  |  |
| dig S | 4-dig-s | prose |  | Everything you see down here is yours. Projections, creatures, presences: different shapes of one mind looking at itself. That is why even what attacks you is yours. |  |  |
| mend N | 4-mend-n | plate | Bosses (The large patterns) | Resistance, Inertia, the Verdict, the Shadow… Each guards the way out of a floor. They too can be warmed. |  | bestiary/resistance |
| mend S | 4-mend-s | prose |  | A boss is a pattern grown so large it looks like a door: the resistance to begin, the inertia of staying the same, judgement, the grudge, the impostor. It is not there to punish you. It stands exactly where it is time to grow. |  |  |
| pit N | 4-pit-n | plate | Creatures (The ones beside you) | They are alive, they never attack and they never die. Good intentions make them grow. |  | bestiary/wonder |
| pit S | 4-pit-s | prose |  | Their names are small good things. Wonder is curiosity; Mossling, rest; Huddler, warmth shared; Drifter, lightness; Ferryback, being carried. They are here to remind you that not everything down here is an obstacle. |  |  |
| bridge N | 4-bridge-n | plate | Presences (The ones who know) | They are the parts of you that already know. Not gods, not people. They offer a deal or a rest. |  | bestiary/listener |
| bridge S | 4-bridge-s | prose |  | The Listener asks for something and always gives something back. The Boundary keeps a place for you to sit. There are more presences than you will meet today: some have not come down to these floors yet. |  |  |
| seal N | 4-seal-n | plate | Guardians (The ones in the crown) | Above the roots, a tree rises. Five guardians and their herds: panda, koala, elephant, lion, horse. |  | bestiary/guardian-panda |
| seal S | 4-seal-s | prose |  | Above and below are the same journey. What you see in the crown gives you heart to go down; what you learn at the bottom is what lets you climb. |  |  |
| crates N | 4-crates-n | plate | Hearts (What holds you up) | The red ones are the everyday ones. The rare ones come now and then, the way help comes: unannounced. |  | icon/heart/red |
| crates S | 4-crates-s | prose |  | Keys, bombs, blocks: what you carry speaks of you too. A key opens what someone closed. A bomb opens what does not want to open. A block is a piece of wall you now carry yourself. |  |  |
| spring N | 4-spring-n | prose |  | Water puts out fire and turns lava to stone. What calms also builds. |  |  |
| spring S | 4-spring-s | prose |  | If something down here has no name yet, it is because it is still being made, like you. This world is not finished, and that is why it is still alive. |  |  |
| gift N | 4-gift-n | plate | The Sanctuary (Behind the Boundary) | A place to sit. Staying to the end of a meditation gives a better gift than leaving early. |  | bestiary/boundary |
| gift S | 4-gift-s | prose |  | Sitting is playing too. This game does not reward you for running: it rewards you for stopping, breathing, and staying a little longer than you felt like. |  |  |
| door N | 4-door-n | prose |  | They are all waiting below. They will stand in your way and, even so, none of them is your enemy: they are what you have left to look at. |  |  |
| door S | 4-door-s | prose |  | Walk the whole ring of the roots once more. The next page is about the practices, and about why this game is made the way it is. |  |  |

## Page 5 (`tutorial-5`), 22 slots

| Slot | Id | Layout | Title | Text (English) | Key | Image |
|---|---|---|---|---|---|---|
| hall N | 5-hall-n | prose |  | A practice is something done many times. Breathing by count, giving thanks, writing down what you think. None of them is magic on the first day. What changes a person is not what they know: it is what they repeat. |  |  |
| hall S | 5-hall-s | lesson | Where practices wait | On pedestals in treasure rooms, in the chest a Boundary keeps, and where a boss was overcome. |  | lesson/practice |
| step N | 5-step-n | lesson | Paths | Every practice follows a path: miracles, body, mind, emotion or will. Its mark tells you which. | inventory | lesson/paths |
| step S | 5-step-s | lesson | States of being | Hold three practices of one path, body, mind, emotion or will, and you reach a state of being. |  | lesson/state |
| dig N | 5-dig-n | plate | Body (A path) | Grounding, breathing, moving. The body is the first home: if it is here, you are here. |  | icon/item/grounding |
| dig S | 5-dig-s | plate | Mind (A path) | Sorting what you think, writing it down, asking if it is true. A clear mind aims better. |  | icon/item/secondbrain |
| mend N | 5-mend-n | plate | Emotion (A path) | Giving thanks, accepting, being kind to yourself. Feeling is not a fault: it is information. |  | icon/item/selfcompassion |
| mend S | 5-mend-s | plate | Will (A path) | One small step each day. Will is not brute force: it is beginning again. |  | icon/item/kaizen |
| pit N | 5-pit-n | plate | Miracles (A path) | Going past what seemed impossible. A miracle, here, is a limit that stops being one. |  | icon/item/drlauncher |
| pit S | 5-pit-s | prose |  | No practice is our invention. They come from old traditions and from the therapies of today: Stoicism, meditation, journaling, breathwork. People of many centuries tried them in their own lives before they reached this basement. |  |  |
| bridge N | 5-bridge-n | prose |  | Three practices of one path wake a state of being. It works the same outside: what you practise often stops being something you do and becomes something you are. |  |  |
| bridge S | 5-bridge-s | prose |  | Three attitudes will take you further than any object. Wanting to grow. Wanting to know yourself. And giving the best of yourself, today, with what you have today. Nothing more is needed. Nothing less will do. |  |  |
| seal N | 5-seal-n | prose |  | Every wall down here you once built to stay safe. That is why you can break it. And that is why you can also mend it: not every wall is one too many. |  |  |
| seal S | 5-seal-s | prose |  | Your intentions are good or bad, and both are needed. The bad ones break what no longer serves; the good ones heal and make things grow. Knowing which one is called for is almost the whole game. |  |  |
| crates N | 5-crates-n | prose |  | To go down you must leave something. It is not a punishment: nobody moves on carrying everything. Choosing what you let go of is part of the road, here and above. |  |  |
| crates S | 5-crates-s | prose |  | When you fall, you come back to the roots. What you carried stays behind. What the roots learned from you does not: their mastery and this page are waiting. Beginning again is not going backwards. |  |  |
| spring N | 5-spring-n | prose |  | You go down floor by floor, from the newest to the oldest in you. It is the road of a life, told inwards. There is no hurry: the slower, the better. |  |  |
| spring S | 5-spring-s | prose |  | This game is made this way on purpose. It could have told you these things. It would rather you did them: break, mend, let go, sit, return. What is done with the hands is understood in another way. |  |  |
| gift N | 5-gift-n | prose |  | A quick gift, or a better one if you stay. Almost everything worth having works like that. |  |  |
| gift S | 5-gift-s | prose |  | The Sanctuary is here for one thing only: for you to stop. If you ever put the game down for a minute to truly breathe, the game will have done its work. |  |  |
| door N | 5-door-n | prose |  | Here the prologue ends. What follows on these walls no longer explains the game. It is a book: stories from a real road, and what they taught. Walk the ring once more, and it begins. |  |  |
| door S | 5-door-s | prose |  | The way down is still here. So is the book. You can do both. |  |  |
