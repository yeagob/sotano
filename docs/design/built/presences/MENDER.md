[Presences](README.md)

# The Mender

Built, in part. A dweller of repair. It comes to the first vault the player opens on its floor, once the vault's Boundary has left, and it asks for two parts of different kinds on one card (owner, #228, D11). Its exchange gives a gift, the Covenant's Thread as an item (D10), and one projection the player released on its floor back as an ally (D9). Code: `src/content/presences/mender.ts` (its identity), `src/content/presences/index.ts` (its floor `menderFloorOf`, the rule `menderComesTo`, its consent and its lines), `src/content/tables/heart-gifts.ts` (`MENDER_GIFT_TABLE`, `rollMenderGift`), `src/content/presences/thread.ts` (the Thread's drop rule), `src/content/presences/mended.ts` (the releases and the one brought back), `src/content/items/menders-thread.ts` (the Thread), `src/game/game.ts` (`summonMender`, called when a vault's Boundary leaves, `dropPresenceReward`, `mendReleased` and `updateSeams`). Its weights, lines and wording are **proposed, pending owner ruling**. The open parts are in [the not-built part](../../not-built/presences/MENDER.md).

- **Pattern:** repair, with the seam shown.
- **Health:** one point, which nothing removes (as every presence).
- **Kind:** a dweller. It stays after its exchange, and asks again after the player steps away when declined.

## Where it is

- **Its floor.** One seeded floor of 3, 4 or 5, the vault floors above the Zone II nave (`MENDER_FLOORS`). It is drawn from the run's root (`fork('presence', 'mender')`), so no room is placed for it and the generated world does not change.
- **Its place.** It comes where the player opens a vault on that floor: it stands where the vault's Boundary stood, once the Boundary has left. It comes once per run, to the first such vault. A run with no vault opened on its floor meets no Mender.
- **Vault rule (proposed).** The Mender works on the vaults the player has already opened. The design asked for the vaults of Zones III and IV, but vaults end at floor 5 today (`levels.ts`), so the floors are 3 to 5. A levels ruling is needed before a vault on a deeper floor.

## What the player meets

- **The request (a multi-part card).** Within about two blocks, the card names both objects in one sentence: *Give {first} and {second} to the Mender to mend a vessel? It gives back a practice of quality three or a special heart, and its Thread.* with **Give** and **Keep**. The Mender asks for two parts of different kinds (flesh, heart, mind or essence), read from the interaction item down: the first part, then the next part of another kind. With one part, or two of the same kind, there is no offer and the Mender says its hint. A material or a flask does not count. Reason (decided by agent): the design's three shards of different essences, scaled to floors 3 to 5, where an agreement asks for two things (AGREEMENTS.md, complexity grows with depth).
- **Give.** Both named parts leave the hand, and only if both are still in their slots when the answer comes; otherwise nothing is taken. The Mender gives one gift, rolled from the run's drops stream: three in four a practice of quality three, one in four one special heart (an even draw of the five heart kinds). Beside it, once a run, it drops the **Mender's Thread**, an item (see below). It says its second line and stays.
- **The one it brings back (owner, #228, D9).** If the player released a projection on the Mender's floor before the exchange, the last one released comes back beside the Mender, on the side away from the player, as an ally (part of the self, like a converted projection) with full health, and the card adds *A projection you released comes back with a gold seam. It fights beside you now.* It comes back once: the Mender comes once a run, a boss or a presence is never brought back, and a mended ally released again stays released. The choice reads the order of the releases, so it draws no randomness. It comes back in the colour tier it was released in. Its look: like every ally, all its colours are inverted, with no glow over them ([colour tiers](../projections/TIERS.md), DECISIONS.md §14.6), and one gold mote rises from its body every 0.6 seconds (DECISIONS.md §14.4).
- **Keep.** Nothing changes; nothing is taken. The Mender stays and asks again only after the player steps away and returns.

## The Mender's Thread (owner, #228, D10)

The Covenant's Thread is an inventory item, held like the other practices, not a run record.

- **Where it comes from.** The Mender drops it beside its gift on a Give, once a run, unless the player already holds it. It lands like any gift and is picked up by walking into it. The Covenant keeps its Thread when that Thread is picked up; a Thread from anywhere else (the debug grant) is an item and no piece.
- **What it does.** *+1 heart container, and 0.25 s more invulnerability after each hit.* Meaning: what broke was mended with gold, and it is stronger where it broke (kintsugi). Quality three, the Emotion path. Its name and effect are proposed by agent, pending the owner.
- **Promised.** No capture of the sky, no toll and no other rule can take it: the toll card does not offer it and refuses it, and a capture draws from the other practices only. It is in no pool: no pedestal, chest or presence table gives it, and it has no recipe (a second source would break the Covenant's rule of one source each). The pedestals and every presence's table are as they were.
- **Code.** `src/content/items/menders-thread.ts`, `src/items/pool.ts` (`isPromised`), `src/content/presences/thread.ts`. Tested in `tests/menders-thread.test.ts`.

## Owed (not checked)

- Checked for #228 in headless Chromium (Playwright, a sandbox room with the Mender, two parts of different kinds in hand and one release recorded on the floor), English at 1280 px and Spanish at 375 px: the card names both parts in one sentence with Give and Keep; a click on Give takes both parts, drops the gift and the Mender's Thread, brings the released Doubt back as a mended ally, and the card adds the return line; walking onto the Thread puts it in the practices and keeps the Covenant's Thread. No page errors, no horizontal scroll. Not checked: the mended ally's look on screen (the camera faced away), the gamepad and touch paths of the two-part card.
- Checked in headless Chromium (Playwright, the sandbox scenario `presence-mender`, the Mender two blocks from the player with one part in hand): the card opens near the Mender in Spanish at 1280 px and at 375 px, with Give and Keep, and no page errors; Enter (Give) closes the card.
- Not checked: the gift's pickup and its look (the reward is launched; no capture of it), the English text in the card, the gamepad and touch paths of the card, the Mender's look (the Listener's model is used), and a real run's vault opening (the sandbox spawns the Mender directly; the vault path is covered by the rule's tests only).
- The body uses the Listener's model until it has its own art (an art need: a figure with gold seams, see the not-built part).
