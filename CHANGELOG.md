# Changelog

What changed in each version of THE ROOTS, for players and testers. Every pull request that merges into `develop` adds its line under the `Unreleased` heading below; a release turns that section into the version's heading and publishes it with the tag. The process is in [docs/process/GITFLOW.md](docs/process/GITFLOW.md#changelog).

## Unreleased

### Added
- A Graphics section on the menu, with the field of view from 70° to 100° (default 75°). It changes the view at once, is kept between sessions, and is set with the arrow keys or the mouse, the d-pad, or a drag or tap on a phone (#109).

### Fixed
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
