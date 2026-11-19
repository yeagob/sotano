[Presences](README.md)

# The Mender

Built, in part. A dweller of repair. It comes to the first vault the player opens on its floor, once the vault's Boundary has left, and it asks for one part in hand. Code: `src/content/presences/mender.ts` (its identity), `src/content/presences/index.ts` (its floor `menderFloorOf`, the rule `menderComesTo`, its consent and its lines), `src/content/tables/heart-gifts.ts` (`MENDER_GIFT_TABLE`, `rollMenderGift`), `src/game/game.ts` (`summonMender`, called when a vault's Boundary leaves, and `dropPresenceReward`). Its weights, lines and wording are **proposed, pending owner ruling**. The open parts are in [the not-built part](../../not-built/presences/MENDER.md).

- **Pattern:** repair, with the seam shown.
- **Health:** one point, which nothing removes (as every presence).
- **Kind:** a dweller. It stays after its exchange, and asks again after the player steps away when declined.

## Where it is

- **Its floor.** One seeded floor of 3, 4 or 5, the vault floors above the Zone II nave (`MENDER_FLOORS`). It is drawn from the run's root (`fork('presence', 'mender')`), so no room is placed for it and the generated world does not change.
- **Its place.** It comes where the player opens a vault on that floor: it stands where the vault's Boundary stood, once the Boundary has left. It comes once per run, to the first such vault. A run with no vault opened on its floor meets no Mender.
- **Vault rule (proposed).** The Mender works on the vaults the player has already opened. The design asked for the vaults of Zones III and IV, but vaults end at floor 5 today (`levels.ts`), so the floors are 3 to 5. A levels ruling is needed before a vault on a deeper floor.

## What the player meets

- **The request.** Within about two blocks, the card asks *Give {item} to the Mender to mend it? It gives back a practice of quality three, or a special heart.* with **Give** and **Keep**. The Mender asks for one part in hand, the first part from the interaction item down (the Echo's rule). A material or a flask does not unlock it.
- **Give.** The part leaves the hand. The Mender gives one gift, rolled from the run's drops stream: three in four a practice of quality three, one in four one special heart (an even draw of the five heart kinds). It says its second line and stays.
- **Keep.** Nothing changes; nothing is taken. The Mender stays and asks again only after the player steps away and returns.

## Owed (not checked)

- Checked in headless Chromium (Playwright, the sandbox scenario `presence-mender`, the Mender two blocks from the player with one part in hand): the card opens near the Mender in Spanish at 1280 px and at 375 px, with Give and Keep, and no page errors; Enter (Give) closes the card.
- Not checked: the gift's pickup and its look (the reward is launched; no capture of it), the English text in the card, the gamepad and touch paths of the card, the Mender's look (the Listener's model is used), and a real run's vault opening (the sandbox spawns the Mender directly; the vault path is covered by the rule's tests only).
- The body uses the Listener's model until it has its own art (an art need: a figure with gold seams, see the not-built part).
