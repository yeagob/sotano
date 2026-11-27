# Changelog

What changed in each version of THE ROOTS, for players and testers. Every pull request that merges into `develop` adds its line under the `Unreleased` heading below; a release turns that section into the version's heading and publishes it with the tag. The process is in [docs/process/GITFLOW.md](docs/process/GITFLOW.md#changelog).

Changes to the tutorial and to the book are listed without their content, so nothing is spoiled: a line says only that the tutorial or the book was changed or extended.

## Unreleased

## 0.2.10-alpha · 2026-11-27

### Added
- Every hostile sky guardian and minion that touches you drains your spirit (4 at a time, at most once every 1.5 s).
- A new body practice, the Double Jump: one more jump in the air (#293).
- A new body practice, the Wall Jump: one more jump in the air, taken from a wall beside you (#294).
- A new practice, Walk Slowly: while you crouch on the ground, the world slows down (#340).
- The giant tree's trunk is a climb of its own: broken stretches of the stairs to jump, dig, swim or build across (#317, #328).
- Six branches leave the giant tree, each a course of moving or vanishing platforms that leads to a practice (#329).
- Projections and bosses can rise in a colour tier, Yellow or Red, stronger than the Black; an ally is drawn in inverted colours (#338).
- A new ending, at the top of the sky (#351).
- A global difficulty that grows with the Roots' mastery level (#352).
- New achievements: hold the six branch practices in one run, reach the new ending, overcome the Shadow at the highest difficulty (#353), and complete the bestiary (#360).
- The Shadow summons your friends against you, and friendly fire reaches every ally (#372).
- Wind above the crown pushes you while you are in the air (#373).
- A touch button for the body: crouch and dash share it (#377).
- On the way up, the sky and the sound run the six meditations in 40-second blocks (#380).
- A voice generator for the meditations (#381).
- Stretch, a body practice: keys, bombs and hearts on the floor within 3 blocks fly to you.
- A gift from each sky deity when it is defeated: Self-Distancing (panda), Guarding the Centre (koala), Like Water (elephant), the Shield (lion) and the Triple Jump (horse) (#357).
- Self-Distancing: intentions hurt projections ×0.5 to ×2 by how far they flew, times their size (#357).
- Guarding the Centre: every 3 s a sphere grows to 4 blocks in 1.5 s and freezes what it reaches for 3 s (#357).
- Like Water: a positive intention that hits a block leaves water there for 3 s (#357).
- The Shield: while you are in the air nothing reaches you, from the lion only (#357).
- Every being in water in the sky, and in the water of Like Water, moves at half speed (#357).

### Changed
- The shield takes the wind in the air, and the wind now blows over the Totality, the climb to the Sun, not over the tree's stars route (#373).
- The sky deities have more life: the panda 240 (10 times its former 24), then each deity double the one before, up to the horse at 3840 (#357).
- Every freeze is one family: after a freeze ends, nothing can freeze that being again for 3 s; the lion's roar and Thought Stopping included (#357).
- A challenge room's three waves run once: after the third is cleared the room stays open and does not start again.
- Every boss's health now depends on its floor and on the run's seed, so the same boss can be tougher or weaker from one run to the next (#315).
- Allies follow you through doors, climb steps, keep out of your way and stay on their floor (#327).
- The Shadow is your mirror: it has your health, uses the practices and bombs you hold, and its pace comes from the run (#339).
- The bestiary counts every variation of each projection: its three colour tiers, hostile and as an ally (#360).
- The achievements and the mastery level each one gives are listed in one register (#363).
- Pointer and menu clicks: a click in a menu always reaches its control (#356).
- Escape that leaves fullscreen no longer closes the menu (#374).
- The practice card scrolls, and closes only on a tap, never a drag (#375).
- Contextual touch controls: the buttons show when they can act and fade when not touched; one use button acts on what the hand holds (#376).
- The controls list shows only the rows of what you hold (#349).

## 0.2.9-alpha.f5 · 2026-11-25

### Changed
- The star pads above the crown no longer carry you from one to the next: you climb the route with the Triple Jump. A second Triple Jump gives a fourth jump, rising twice as high as the third, and that is the most you can hold. A cloud layer above the top of the route opens the sky when you rise through it (#325).

### Fixed
- Post-Traumatic Growth: you walk on lava for 2 seconds per copy, up to 6 seconds; then the lava burns you as usual (#341).

## 0.2.9-alpha.f4 · 2026-11-24

### Fixed
- The Leaves, the room at the top of the tree, now hold the Triple Jump: the way from the crown to the star pads and the sky is no longer closed (#316).

## 0.2.9-alpha.f3 · 2026-11-24

### Fixed
- Bosses no longer stand still while you shoot them or freeze with nothing to do: every boss now gets out of your line of fire when hit while standing still, and always moves on to its next attack (#314).

## 0.2.9-alpha.f2 · 2026-11-23

### Fixed
- The minimap's player arrow has a white border and can be seen on the dark map (#305).
- Outside a room, in the rock or a tunnel, the minimap's arrow is gold instead of black, and it is no longer cut off at the edge of the map (#305).
- The tunnels you dig more than 2 blocks tall show on the minimap as a clear light trail, also in the rock around the rooms, and the trail grows as you dig (#305).

## 0.2.9-alpha.f1 · 2026-11-23

### Added
- The minimap draws the tunnels you dig: every hole more than 2 blocks tall shows as a faint trail on its floor's map, and the trail grows as you dig (#302).

### Fixed
- A room no longer stays sealed with nothing left to fight (#301): Avoidance comes out of hiding again, a projection caught inside blocks steps free, a block can no longer be placed on a projection, and a sealed room checks itself every 2 seconds and lets go of any projection nobody can reach.
- The minimap always shows you, also between rooms, in the rock and in a tunnel (#302).
- The minimap no longer forgets the rooms you explored on a floor after a hole dug into the floor below, or after walking into a room through a dug wall (#302).

## 0.2.9-alpha · 2026-11-23

### Added
- Nineteen achievements: Beyond the Self (the state Transcendent), six for the synergies turned on for the first time, and twelve for meeting each presence (finish your first exchange with it).
- The Book of Secrets: a practice on the Roots' pedestals from mastery level 30. It opens the Recipe Book on J, in play and on the menu's Recipes tab: every potion, every meal, and what each presence takes, all read from the game's data.
- The Roots call from mastery level 50: at the start of every run, the keys, bombs, hearts, practices and chest contents on the basement floor fly to you and are taken. The Sanctuary's meditation is never pulled (#295).
- Achievements for the states of being reached for the first time (four), and for the blocks and the projections: Brick by Brick (1000 blocks placed), Many Come Home (100 projections turned to your side), and Clearing the Way (100 projections destroyed).
- Cooking a potion or a meal holds it up in both hands for a moment, with its name, as a monster's drop does (#290). Each cookable meal has its own food: a chicken drumstick for the small meal, a bowl of broth for the hearty one (#291).

### Changed
- The polarity is easier to read: the mark beside the counters is a framed bead of light (gold with a white core for a good intention, ash with an ember core for a bad one). The bomb counter takes the colour of the loaded intention, and a good intention's bomb is the white seed. On a phone, the fire button and the bomb button take that colour too.
- On the keyboard, the book download moved from B to H.
- The alembic holds a brewed flask up only when you take it out, not when it is brewed (#290).

## 0.2.8-alpha.f3 · 2026-11-22

### Fixed
- An error during play no longer freezes the game on a black screen with no menu, as after picking up the berserker heart on a phone (#287).
- A projection killed by an area attack no longer breaks the game loop: this froze the game on a black screen with no menu (#287).

## 0.2.8-alpha.f2 · 2026-11-21

### Fixed
- A broken block disappears at once on a phone, and its pieces show with it (#285).

## 0.2.8-alpha.f1 · 2026-11-21

### Fixed
- The death screen scrolls on a phone, so its button can be reached (#281).
- The completion rows show each part's real percentage.

## 0.2.8-alpha · 2026-11-21

### Added
- In a sitting, Add time lengthens it in steps of 30 seconds, 1 minute, 5 minutes and then 10 minutes, up to one hour. The part you are in keeps its end (#160).
- A new achievement, An Hour of Stillness: finish meditations for one hour in total, across runs (#160).
- Potions are types with variants: a bulb no recipe matches brews the Tincture, Cordial or Elixir of its path, flesh alone heals more the more flesh, and parts of mixed paths brew an Echo that carries a practice's effect for two sealed rooms; the Plain Tonic is left for a bulb of blocks alone (#259).
- The Folding Tincture: an easy potion (a body pattern's mind and dirt) that lets you crouch with C, R3 or a swipe down for 3 sealed rooms, as Child's Pose does (#262).
- The Stride Tonic: an easy potion (a body pattern's mind) that lets you run 45% faster with Shift, L3 or the stick at its edge for 3 sealed rooms, as Fartlek does (#263).

### Changed
- On the keyboard, C switches the crouch on and off, and Control holds it while you press it (#277).
- Taking damage knocks you back, away from its source when there is one, with a red glow on the edge the damage came from and a damage sound (#268).
- The hearts of a white bomb's blast are drawn as small red hearts that rise and turn to face you, not as red sparks (#264).
- Irimi is a tier 4 practice: the dash leaves a trail of light, hurts each projection it passes through, breaks the blocks in its way and keeps you untouchable while it lasts (#261).
- From mastery level 10 the Roots always offer Fartlek (run) on their first extra practice pedestal, and from level 25 Child's Pose (crouch) on the second, instead of a random practice (#277).

### Fixed
- A healing potion or meal is not drunk at full health, and the game says why (#260).
- Solve et Coagula converts water and lava again: the intention's position is read as the cell it is in (#256).
- A white bomb (good intentions) heals you, one heart, when you stand in its range, and its blast shows heart particles (#264).
- Kairos names the control to press to stop time and to release, on each device (#265).
- A boss turns to your side only after good intentions deal as much damage as it takes to destroy it.
- The toxic heart shows its aura as motes around you and a pulse of its two-block zone each tick; its message is shorter, and messages stay on screen as long as their length needs.
- Remember Breathing: the beam curves toward its target, so Triangulation shows three beams and the self-shot bends back to you (#257).
- Spiral Growth no longer fills the screen with Remember Breathing: its strands are thin and layered over the beam (#258).

## 0.2.7-alpha.f1 · 2026-11-20

### Fixed
- The progress panel shows only the percentage of each part, without the words after it.

## 0.2.7-alpha · 2026-11-20

### Added
- Solve et Coagula: a miracle. A positive intention that touches lava turns the connected lava (up to 256 cells) into water; a negative one turns connected water into lava, never the water you stand in.- Post-Traumatic Growth: lava never hurts you. You walk on its surface and wade through it at full speed; your intentions still go out in it.- The Transcendent state of being: with three Miracles practices, your positive intentions take the blocks around them, and hit harder for each one they take.
- Three practices for the hand, the allies and the tables: Furoshiki (two more things in your hand, the extra slots drawn dimmer), Kinship (a projection turned to your side heals a quarter heart, once per room visit) and Apprenticeship (every brew and cook heals a quarter heart; brews come out iced), in English and Spanish (#52).
- The Rebirth Draught, a new potion: drinking it asks first, then starts the run again from the first floor and keeps every practice you hold, in English and Spanish (#52).
- The flask or meal in your hand is named above the hand, with what it does; Tab shows its name, effect and duration at the top of the inventory (#52).
- Kairos: a practice that stops time. Clear rooms to charge it (it starts charged); when it is full, the miracle button (V, the D-pad up, or the clock ring on a phone) stops the world, and you mark up to five places. Release to fire five piercing intentions at once, one at each mark (#123).
- Waymark: a practice that is an extra life. A cairn on the path marks where you stand and the start of each new floor; when you would die, you return there with full hearts and everything you carry, and it is used up when it saves you (one copy, one extra life), in English and Spanish.
- Lucid Dream: a miracle. Picking up a bomb, a key or a heart lets you walk through blocks for a few seconds (more pickups add time, up to a cap), and you always come out in free space. Unbreakable blocks stay solid, in English and Spanish.
- Nine practices of the drink family, which grow with every potion or meal you drink, up to six (Nourishment, up to eight), each with its own stacks in the inventory (#110).
- New blocks: living root, cave moss, copper ore, tin ore, quicksilver ore and lead ore, in English and Spanish (#228).
- The Covenant's Light can now be given in play, after hearing a Listener's Lesson, with a gold burst and a toast (#228).
- The Mender's Thread: a promised practice (+1 heart container, a little more invulnerability after each hit) that The Mender drops once a run beside its gift; picking it up keeps the Covenant's Thread, and no toll or capture can take it (#228).
- The Mender brings back the last projection you released on its floor as an ally with a gold glow and slow gold motes (#228, #232).
- "Have you done it?": when The Gardener's or The Boatman's waiting time ends with you nearby, it asks, with Yes and Not now; Yes always gives something, and Not now costs nothing (#228, #235).
- The Leaves: a new room of the giant tree, with a ring of star stone under an open eye in its dome (#149).
- Dowsing and Eye Contact: two practices that steer intentions, one toward blocks and one toward projections. The one you gained last guides; the other is set aside, with a toast (#68).
- Three fire practices: Inner Fire (negative intentions burn, and fire hurts you half as much), Firewalking (fire never hurts you, and standing in it heals a little), and Stolen Fire (one intention in five is a fire seed that bursts). Holding three fire practices gives Hearth, which warms you when a fire bursts. In English and Spanish (#110).
- The star map: a new tab of the menu (M, View, or the Star map tab) that draws the floor you are on as a constellation of the rooms you know, with the places the presences told you of. In English and Spanish (#149).
- Two practices of the bounce, in English and Spanish: Dialectic (a rebound splits the intention in two, each at half damage, at most twice per shot) and Reframing (after a rebound the intention turns toward a projection within 8 blocks and deals 25% more). They stack with Bounce Back (#110).
- Four bomb practices, in English and Spanish: Pressure Valve (bomb radius and damage, two bombs), Controlled Burn (your blasts light the dry blocks around them, and their fire spares you close by), Bolt from the Blue (lightning from your blasts to the nearest projections) and Serendipity (luck, and a chance that a blast leaves a key, a bomb or a heart) (#110).
- New practice: Irimi, a body practice that dashes 4.5 blocks in the direction you double-tap, flick or swipe. Untouchable while it lasts, one dash in the air, cooldown 0.8 s; looking up while you dash rises (#157).
- New practices: Fartlek (hold Shift, L3 or the stick's edge to run 45% faster) and Child's Pose (hold C, R3 or swipe down on the right to crouch: fit through 1-block gaps, never fall off edges, take half contact damage; crouched you move at 45% speed) (#52).
- 62 new room layouts: arenas with low rings and benches, galleries and towers to fight from, piers and broken bridges over dry docks, canals, flooded cloisters, canal locks you open by breaking a plug, lava lakes and forges, a pool that turns lava to stone when you break its wall, crypts and catacombs in the deep circles, four new challenge rooms, two starts, three treasure rooms, two vaults and two bosses' halls. Every band of floors has at least twice as many layouts as before (#115).

### Changed
- Remember Breathing's beam is a shot first: the practices that change your shot change the beam. Dual Process and Triangulation fan it into two or three beams, Rule of Three and Spiral Growth give it strands of light, Eye Contact and Dowsing steer its rays, and Bilateral Stimulation fires one beam from each hand in turn. The Chorus and Choir synergies are removed, since the shot now reaches the beam.
- Seed codes move to v38: the same code lays out its rooms with the new and redrawn layouts (#115), and the new practices join the treasure, vault and boss draws, so its pedestals hold other practices (#110, #122, #123, #157, #52).
- Affirmation no longer aims: a positive intention that hits a block places a copy of that block beside it, in empty space inside the room (#68).
- The Gardener now asks for a living root and a tuft of cave moss, one card each, instead of a flesh part (#228).
- The Cartographer charts both the vault and the boss for the right ore, on its card and on the star map; without it, its single mark is unchanged (#228).
- The Mender now asks for two parts of different kinds on one card that names both; nothing is taken unless you say Give and both are still in your hand (#228, #233).
- The Listener's Lesson no longer gives the Covenant's Light itself: a heard Lesson opens the way to it (#149, #228).
- The Child no longer adds a Lesson in words after its gift (#149).
- The Questioning Tincture takes any ore, not only iron ore (#228).
- Seed codes move to v37: the same code grows the giant tree with the Leaves and lays the new blocks in the rock; the rooms are unchanged (#149, #228).
- 48 room layouts redrawn so their corners stay clear: no more cubes in or beside the corners where projections rise unseen or where you snag while chasing them; pillars stand on the room's cross instead (#115).

## 0.2.6-alpha · 2026-11-19

### Added
- The Boatman takes its block only when it can ferry you; in a room with no far shore it says so and you keep the block. A presence's choice card ignores a confirm in its first moment, so a double press cannot pick an answer by accident (#149).
- The Child now adds one Lesson in words to its card after its gift (#149).
- The inventory shows the Covenant pieces you hold, each with its name, the presence that gave it, a gold seam and the word promised. Nothing shows before the first piece (#149).
- The Listener's Lesson: after its gift, The Listener asks which path weighs on you, with Not now always offered, and answers in words. Its last Lesson, on floor 5, gives the Covenant's Light, so the Covenant can now be completed in play (#149).
- The Covenant, in part: The Mender, The Elder and The Witness each give one piece of it (the Thread, the Page and the Seal), kept for the run. The Light comes from The Listener's last Lesson. Once all four are held, every presence remembers you in its card (#149).
- The Child asks you to draw something small on its build card, and The Elder asks you to be still on its choice card, each with an alternative that needs no hands (#149).
- The codex: the menu lists the presences you met in this run, with what each asks and what it gives, in English and Spanish (#149).
- The idle window: after you give The Gardener or The Boatman what they asked for, it stays in its room for a seeded 30 to 60 seconds, then leaves. The length is fixed by the run's seed (#149).
- Requests from the depths: The Gardener asks you to breathe slowly, and The Boatman asks you to stand and move before the crossing. The card names the request and an always-offered alternative; Give or Keep decides, and keeping costs nothing (#149).
- The Mender, a dweller that comes to the first vault you open on floor 3, 4 or 5 (once the vault's guardian has left). It asks for one part you carry, on a Give or Keep card; Give gives a practice of quality three, or a special heart, and it stays (#149).
- The Star-reader, a dweller in a quiet room of one floor of the Tree (floors 1 to 5). It asks for a yes to its light, on a Take or Decline card: a practice of quality one or two, or a special heart. Decline keeps everything, and it stays (#149).
- The Witness, a messenger that waits in a quiet room of the ninth floor. It offers one gift: a practice of quality two, or a special heart. Take gives it and it leaves; decline keeps everything (#149).
- The Boatman, a dweller by the drowned nave of floor 3 or 4. For one block you leave on the shore, it ferries you across the deep water to the island, where its gift lies: a practice of quality two, or a special heart. It stays (#149).
- The Child, a dweller that waits on one floor of each run from floor 1, in a quiet room. It asks you to place three blocks while it watches; Take starts the build and Decline costs nothing. When three blocks are placed it gives one gift: a practice of quality one, or a special heart. It stays (#149).
- The Trickster, a messenger that waits on one floor of each run from floor 3 down, in a quiet dead end. It offers a trade: one heart for a practice of quality three. Nothing is taken unless you confirm; declining costs nothing (#149).
- The Echo: when a run ends in death, the Echo waits on the deepest floor that run reached, in the next run that reaches it, once. It asks for one part you carry and gives back a key or a bomb. Declining costs nothing (#149).
- The Wanderer, a messenger that waits on one or two floors of each run from floor 1, in a quiet room. It offers a gift: a practice of quality one, or a special heart. Nothing is taken unless you take it; declining costs nothing and it walks on (#149).
- The Elder, a dweller that waits on one floor of each run from floor 1, in a quiet room. It asks which of four paths still holds, on a choice card; it gives a practice of that path and stays. Not now costs nothing (#149).
- The Cartographer, a dweller that waits on one floor of each run from floor 1, in a quiet room. It asks whether to mark the vault or the boss, and says in words where it lies from here. It stays. Not now costs nothing (#149).
- The choice card: a presence's question with up to four answers, chosen with the arrows or the d-pad, a tap, or confirm (#149).
- The Gardener, a dweller that waits on one floor of each run from floor 1, in a quiet room. It asks for one flesh part you carry and gives nothing back; it stays where it is. Declining costs nothing (#149).
- A completion percentage: the share of the game you have done at least once (floors, bosses, achievements, practices, the bestiary, recipes and the hidden book), with each part's share. It is kept between runs, never goes down, and shows on the pause card and the death screen (#180).
- At 100% completion a final achievement unlocks, and the book can be downloaded from the pause card and the death screen (#180).
- The toxic heart now carries a toxic aura: while you hold one, every hostile projection within two blocks of you takes damage once a second, with rising soot around your feet and a soft hiss when it touches. It never breaks blocks and never hurts allies, creatures or presences, and it ends when the heart is spent (#178).
- In the Sanctuary, a finished meditation shows three choices: Receive, Sit again (the same meditation, a new length) and Choose another meditation. Sitting again does not give a second reward (#160).
- In a sitting, Add 20 seconds lengthens it, up to three times. The part you are in keeps its end (#160).
- Optional spoken guidance in the Sanctuary, in English and Spanish: the guidance lines are read aloud and never overlap. Breath cues are not spoken. Turn it on with the Voice switch (V, LB or the Voice button); it is off at first (#203).

### Changed
- The Sanctuary's reward is one per visit. Once a sitting is finished, leaving never gives the quick reward and never takes the earned one back. Leaving early still gives the quick reward when nothing is finished yet (#160).
- The practices tab, the pause card and the way-down window share the pixel art look of the achievement notice. Each practice now opens in three blocks: a teaching that carries it into everyday life, what it does in the game, and the stats it changes; every practice has its teaching in English and Spanish (#202, #223, #224).
- The lore was extended with new references and a tradition (#194, #201, #204).

### Fixed
- Symbolic Act no longer explodes blocks that were kicked: a block that falls on you while your hands are full, or a thrown block you kick later, loses its charge and does not burst (#198).

## 0.2.5.f1 · 2026-11-15

### Fixed
- The book page now advances before the player reaches the main room, so no text is missed when completing a lap (#212).
- Book page text panels now appear in the correct reading order when walking toward the Sanctuary (#214).

## 0.2.5 · 2026-11-15

### Changed
- The tutorial direction was reversed: walking forward now leads toward the Sanctuary, matching player intuition.
- The book was extended with 62 new pages covering more chapters from the author's book.
- Browsing forward through the book is no longer capped: players can walk the ring continuously to read all pages without dying or restarting.
- New teaching items added: Box Breathing, Gratitude, Grounding, Self-Compassion and Visualization.

## 0.2.4.f1 · 2026-11-14

### Added
- Six achievements: Into the Crown (enter the great tree's canopy), Down to the Roots (die on the Roots' floor), Root to Crown (dig up from the Roots to the great tree), Mind Crafter (place 1000 blocks after your first pact with the Listener), Turning Back (turn the tutorial book back a page) and The Unbreakable Floor (touch bedrock on any side) (#179).

### Changed
- The achievement notice is a small corner panel in pixel art. It leaves by itself after 5 seconds (7 for a long description) and no longer shows what the Roots gain; the description still says what the achievement does (#191).
- The tutorial was changed.
- The book was extended.

## 0.2.4 · 2026-11-13

### Added
- On a phone, a fullscreen button sits in the top bar whenever the game is not fullscreen, so you can return to fullscreen after leaving it; if the browser cannot or will not go fullscreen, a short notice says so (#161).
- A black heart: one more heart after the containers, even at full health, lost for good once spent, rarer than the blue heart (#154).
- A successful brew at the alembic names the potion it made in its notice, in English and Spanish, with the drink key (#158).
- The Roots' walls carry a book: six tutorial pages, then the first pages of a hidden book. A full lap of the ring, forward or in reverse, leafs through the pages you have reached; a run that walks every room and ends advances the page by one, and a page stone in the start room shows its number (#147).
- From the second page on, the Roots are carved in an easy layout: the same eleven rooms with their work already done, crossed on foot with no block to place or break (#147).
- Achievements: forty deeds are kept between runs, each boss destroyed and each boss turned to your side, six meditations sat to the end, the first potion brewed, the first meal cooked and four pages of the book. Each one adds a level of the Roots' mastery and a notice shows it (#147).
- The Roots grow richer as their mastery rises: more loose keys, bombs and hearts, free chests and two extra practices, an altar from level 80, and a second Boundary at 100. At level 0 the Roots start poorer; the Sanctuary chest and the way-down pedestal stay the same (#147).

### Changed
- The Roots' stone tablets are replaced by the book's panels, carved in English and Spanish (#147).
- The save keeps the Roots' page and the achievements (record version 2; a version 1 save is read and kept) (#147).
- At a descent toll each heart is its own choice: base hearts with the health they hold, and bonus hearts by type. The window shows what the choice costs before you pay, and a payment never turns into damage to base health (#155).
- A blood heart taken at full health opens one more heart container and fills it at once, instead of doing nothing; below full health it still heals over time (#146).
- Starting reach is 4 blocks, 20% less than before; Self-Efficacy, Second Brain, Grounding and Kaizen each add 1 block of reach (#162).
- The mobile drink button appears only while a flask is on top of your hand, drawn as that potion in its liquid colour in the right-thumb column above throw, and is hidden the moment the flask is drunk or put away (#159).
- Every reward is ejected away from the player instead of landing toward them, and an emptied chest disappears once it has given its reward, whether or not you collect it (#156).
- A grown friendly creature that is not an enemy shrinks one step under a warm negative shot, never below its birth size, and its one-time 7.5% growth gift applies on any floor (#102).
- Intentions show their power: more damage and more effects make them bigger, with a wider, brighter halo and a longer trail, one clear step per doubling of damage, and the phone fire button's ring thickens and glows to match (#111).

### Fixed
- The boss health bar hides when you die, reset with R or respawn, and shows again only when the boss fight resumes (#163).

## 0.2.3.f1 · 2026-11-11

### Fixed
- The Listener now searches carried items from the interaction item down, asks before taking the first monster heart, and leaves it and all other objects untouched if the offer is declined (#150).

## 0.2.3 · 2026-11-10

### Added
- The Boundary opens the Sanctuary above the Roots tutorial treasure chest as well as in vaults. Take a quick reward at once (a tier 1 or 2 practice), or sit through one of six guided meditations for a seeded duration of 20 to 40 seconds to earn a better practice (tier 3 or 4). Leaving early gives the quick reward and never a penalty; sound and calm visuals are switches inside the app (#35, #140).
- The Listener always gives a reward when offered a monster heart: a 15% chance of a health-raising practice, a 75% chance of special hearts (usually one, rarely two different kinds), or a 10% chance of two red hearts. A friendly Roots creature that reaches maximum size has its own one-time 15% chance to give a special heart (#141).

### Fixed
- A meditation no longer runs out while the game is in a hidden tab: time spent away is not counted, so a sitting always takes the time it says (#35).

## 0.2.2.f2 · 2026-11-10

### Fixed
- Sanctuary sittings now last a random 20–40 seconds, and each part shows one randomly chosen guidance phrase for up to six seconds before quiet time.

## 0.2.2.f1 · 2026-11-10

### Fixed
- Meditation sittings in the Sanctuary last 20, 30 or 40 seconds instead of minutes (#35).
- A meditation no longer runs out while the game is in a hidden tab: time spent away is not counted, so a sitting always takes the time it says (#35).

## 0.2.2 · 2026-11-10

### Added
- The Boundary opens the Sanctuary: a meditation app inside the game, with its own look, music and sounds. Take a quick reward at once (a tier 1 or 2 practice), or sit through a guided meditation of 20, 30 or 40 minutes for the better one (tier 3 or 4). Six meditations: Grounding, Gratitude, Visualization, Box Breathing, Self-Compassion and Listening to the River. Leaving early gives the quick reward and never a penalty; sound and calm visuals are switches inside the app. It replaces the Boundary's real-world missions (#35).
- The giant tree has its own leaf, branch and bark textures, and its bark changes with height so no two parts of the trunk look the same (#130).

### Changed
- Every boss on floor 0 and below now fights in a large room, and floors 6 to 9 have a new two-cell boss room, the caldera hall (#133).

## 0.2.1 · 2026-11-08

### Added
- A Graphics section on the menu, with the field of view from 70° to 100° (default 75°). It changes the view at once, is kept between sessions, and is set with the arrow keys or the mouse, the d-pad, or a drag or tap on a phone (#109).

### Fixed
- Loose cubes no longer spin endlessly in place next to another cube. A cube that lands touching another, on the edge of one, or packed tight among others in a small space now comes to rest and stays still, keeping the way it faces (#103).
- On a phone the polarity hint comes back each time three good intentions find nothing to mend on one block underground, with its turn in red. It used to show only once per run (#101).

## 0.2.0 · 2026-11-07

### Added
- Six kinds of heart: red, blue (one more heart, lost for good), stone (halves every hit while it takes them), blood (heals 3 per second, up to two hearts, until a hit), star (a heart back and 30 seconds untouchable, with its own theme) and the very rare berserker (stronger, faster and higher, short intentions, loose blocks break underfoot, shots bounce back, a frame and an echo while you hold it). The Berserker Draught (two will hearts and obsidian in the alembic) gives the same state for two rooms. Every heart that drops rolls its kind from chances each floor draws from the seed (#31).
- Dr. Launcher, a quality 3 practice of the new Miracles path, found in treasure rooms: a quick double tap of the fire control (double click, double RT, or a double tap on the bead of light) launches a bomb as a missile that flies straight and explodes on the first thing it meets. Negative intentions make it a bomb blast; positive ones a love explosion that mends blocks, heals allies, warms projections and grows creatures. Seeds changed: a new practice in the pools (v24, #59).
- A kitchen on floors 1, 3, 5 and 7 cooks a part into a meal (three cooks per run; flesh gives half a heart, other parts a heart), eaten with the drink key. A hint names the drink key when a potion or meal is made or picked up. The alembic is now one tile on the even floors; seeds changed (v22).
- Breaking a crate can drop a key, a heart or a small bomb (#6).
- A laboratory alembic on floors 2, 4, 6 and 8 brews from up to three things in your hand (a positive intention, three brews per run). The brew leaves a flask to drink with G, X or the flask button: eight potions, from instant tonics to timed draughts. The Listener speaks only once it is given a heart of a released pattern, and the Gardener once it is given a flesh (#20).
- A monster part in your hand can be given as the toll to go down on floors 0 to 4 (#8).
- Lava in the rock between floors 5 to 9: a few pockets from floor 5, more from 6, a sheet on floor 8 that covers the whole floor. It sits off the way down, and digging into it sets it flowing; the toll stays the safe way. Seeds changed (v25).
- The sky realm: climbing to the top of the giant tree carries you to a second world above it, where nothing takes your health. Its tree holds five halls, one per deity (panda, koala, elephant, lion and horse); each deity has its own attacks and hindrances, is won with many positive intentions, and opens its floor's way up. Above the crown rises Totality, with its updraft, the Earth and the Sun, and the horse's gift, the Triple Jump.
- Minions in the sky: each deity's floor spawns its herd (little pandas, koalas, young elephants, the pride and the herd). They move as their animal does and hinder without hurting; enough positive hits turn one into an ally that holds a platform, clears a wild one, carries you a short way or helps you win the deity.
- A ring of procedural mountains round the giant tree: a wide plain, rugged walls with three passes, peaks as tall as the tree and a trail of steps up each ridge, so the grass no longer ends in a square hanging in the sky. Seeds changed (v26, #10).
- A test bench for testers: open the game with `?test` for a panel that jumps to any floor or to the sky, refills spirit and shows a frames-per-second counter, with every button running a real game path.

- The Boundary keeps the vault's centre practice: walk up to it and it asks one real-world mission (write a sentence, a message or a letter, draw, or breathe for 30 seconds). Yes after 30 seconds or more gives a tier 3 or 4 practice; a quicker Yes, or No, gives tier 1 or 2. Either answer releases the Boundary (#35).

### Fixed
- Resonance had no visible effect. Now each other intention in flight in the room adds 1% damage to the intention you fire.
- Distraction and Noise now fly at eye height and attack: they stop, swell and flare their eyes, dart through where you stood and rest, so their touch can finally land; allied ones keep you company and dart at your foes (#21).
- Flying creatures (Wonder, Chirper and the other hoverers) stay up instead of sinking to the floor, climb steps, stay under the ceiling and turn off walls instead of pressing on them (#21).
- The part leaves your hand with a visible handover when you give it to the Listener (#43).
- The Boundary asks its mission when you walk up to it, not only at the chest (#40).
- Presences have a body you cannot walk through, and they answer what you bring: they name it and say whether it is what they wait for. A laboratory is placed on every laboratory floor, even when the first room chosen has no room for it.
- Open chest lids no longer clip through the chest body or its padlock (#4).
- Locked doors open when you touch them, not from across the room (#5).
- Enemy attacks that deal damage warn in yellow and hit red: the warning is yellow until the blow lands, then the live marks and shots are red. Particles, decoration and attacks that cannot hurt stay pale blue-white, so a blow no longer looks like dust (#47).
- Craving (Ansia) no longer flickers where its socket meets its top, its breathing no longer jumps every few seconds, and its wind no longer clicks as it starts (#46).
- Remember Breathing's beam and One Clear Cut now reach the laboratory's alembic, so three fed items brew as they do with a shot (#44).
- Mouse look ignores the first move after the pointer locks, and caps a single very large move, so a jump there no longer turns the view (#19).
- The game no longer freezes on the main menu in Firefox when you press Start: its sound positioning uses the calls Firefox supports.
- Placing a block into a doorway or at the world's edge is refused with a sound, instead of throwing the block back at you.
- Placing a block next to a wall, ledge or corner no longer throws it: if you stand a little in its cell you are nudged out and it goes down; if you stand deeper in, it waits in your hand until you step clear.
- A loose cube that spins fast in place for a second gets an upward push; if it still spins in place after the third push, it vanishes (#42).
- Art Therapy heals a quarter heart instead of a full one, once per room and in four rooms per floor at most (#57).
- Art Therapy spends its room and its floor count only when it actually heals: a structure built at full health does not use them up, and the Spanish description no longer says it heals a whole heart (#78).

### Changed
- The Listener never heals. Once it is given a heart, it drops one to three pickups (hearts, bombs or keys, weighted: a heart 40%, a bomb 35%, a key 25%; one, two or three at 50%, 35% or 15%) and leaves at once; a run can meet a Listener on each of the five Tree floors (#65, #77). Seeds changed (v23).
- Every hostile projection (the voices you fight) has twice its health, so a fight with the same intentions takes about twice as long. Bosses and creatures are unchanged (#45).

## 0.1.2 · 2026-10-31

### Fixed
- The Listener gives its reward when you bring it a heart: a quarter heart when you are hurt, and at full health a heart that waits on the floor beside it. The part leaves your hand with a visible handover (#43).

## 0.1.1 · 2026-10-31

### Added
- A kitchen on floors 1, 3, 5 and 7 cooks a part into a meal (three cooks per run; flesh gives half a heart, other parts a heart), eaten with the drink key. A hint names the drink key when a potion or meal is made or picked up. The alembic is now one tile on the even floors; seeds changed (v22).
- Breaking a crate has a 30% chance to drop a key, a heart or a small bomb (#6).
- A laboratory alembic on floors 2, 4, 6 and 8 brews from up to three things in your hand (a positive intention, three brews per run). The brew leaves a flask to drink with G, X or the flask button: eight potions, from instant tonics to timed draughts. The Listener speaks only once it is given a heart of a released pattern, and the Gardener once it is given a flesh (#20).
- A monster part in your hand can be given as the toll to go down on floors 0 to 4 (#8).

- The Boundary keeps the vault's centre practice: walk up to it and it asks one real-world mission (write a sentence, a message or a letter, draw, or breathe for 30 seconds). Yes after 30 seconds or more gives a tier 3 or 4 practice; a quicker Yes, or No, gives tier 1 or 2. Either answer releases the Boundary (#35).

### Fixed
- The Boundary asks its mission when you walk up to it, not only at the chest (#40).
- Presences have a body you cannot walk through, and they answer what you bring: they name it and say whether it is what they wait for. A laboratory is placed on every laboratory floor, even when the first room chosen has no room for it.
- Open chest lids no longer clip through the chest body or its padlock (#4).
- Locked doors open when you touch them, not from across the room (#5).

### Changed
- The laboratory's alembic is two tiles side by side, drawn as a laboratory apparatus; laboratory seeds changed (#20).
- The blade practice is named **Cut Ties with Toxic Relationships**; its description covers substances, food and technology too (#7).
- Friendly creatures grow when a warm love shot reaches them: each shot adds a quarter of their size, up to three times their size, and the hitbox and the way they can pass grow with them (#51).
- You start with two hands: you carry two blocks instead of one. Second Brain adds one more block to what you carry, and Letters from a Stoic adds three more (#50).
- A crate's chance to drop a key, heart or small bomb is set per floor, between 10% and 30% (it was 30% on every floor), drawn once from the seed: the same seed gives each floor the same chance (#48)
