# Changelog

What changed in each version of THE ROOTS, for players and testers. Every pull request that merges into `develop` adds its line under the `Unreleased` heading below; a release turns that section into the version's heading and publishes it with the tag. The process is in [docs/process/GITFLOW.md](docs/process/GITFLOW.md#changelog).

## Unreleased

### Added
- A kitchen on floors 1, 3, 5 and 7 cooks a part into a meal (three cooks per run; flesh gives half a heart, other parts a heart), eaten with the drink key. A hint names the drink key when a potion or meal is made or picked up. The alembic is now one tile on the even floors; seeds changed (v22).
- Breaking a crate has a 30% chance to drop a key, a heart or a small bomb (#6).
- A laboratory alembic on floors 2, 4, 6 and 8 brews from up to three things in your hand (a positive intention, three brews per run). The brew leaves a flask to drink with G, X or the flask button: eight potions, from instant tonics to timed draughts. The Listener speaks only once it is given a heart of a released pattern, and the Gardener once it is given a flesh (#20).
- A monster part in your hand can be given as the toll to go down on floors 0 to 4 (#8).

- The Boundary keeps the vault's centre practice: walk up to it and it asks one real-world mission (write a sentence, a message or a letter, draw, or breathe for 30 seconds). Yes after 30 seconds or more gives a tier 3 or 4 practice; a quicker Yes, or No, gives tier 1 or 2. Either answer releases the Boundary (#35).

### Fixed
- The Listener gives its reward when you bring it a heart: a quarter heart when you are hurt, and at full health a heart that waits on the floor beside it. The part leaves your hand with a visible handover (#43).
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

### Changed
- Every hostile projection (the voices you fight) has twice its health, so a fight with the same intentions takes about twice as long. Bosses and creatures are unchanged (#45).
- The laboratory's alembic is two tiles side by side, drawn as a laboratory apparatus; laboratory seeds changed (#20).
- The blade practice is named **Cut Ties with Toxic Relationships**; its description covers substances, food and technology too (#7).
