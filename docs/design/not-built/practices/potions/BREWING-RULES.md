# Brewing rules

Status: approved for §1 (owner, 2026-10-28); §2 to confirm; §3 proposal. Index: [potions](README.md).

The rules that decide when a potion is made. §1 is what the owner approved. §2 follows from §1 and the proposal's defaults, and the owner has not yet confirmed it. §3 is the drinking verb, which the proposal designs but the owner has not approved.

## 1. Approved (2026-10-28)

1. **Only a positive intention brews.** A positive intention hit on a loaded bulb starts a brew. Good intentions make; the rule matches what players already know (good intentions mend and make, bad ones break). Source: POTIONS §7, question 3.
2. **Three brews per alembic per run.** After the third brew the alembic goes cold. Source: question 2.
3. **One laboratory per zone.** Each great zone has one alembic, so five per run. The zones are I to V in [BESTIARY](../../projections/ZONES.md) §4.1. Source: question 1.
4. **No shop.** The alembic closes the "parts need a purpose" task, and "no coins, no shop" holds ([DESIGN](README.md) §4). Source: question 9. The Trickster's trades are the only exchange, as the proposal's default says; the owner approved "no shop", not the Trickster.

## 2. Follows from §1 (to confirm)

These are the proposal's defaults. They follow from the approved rules but the owner did not name them.

1. **A negative intention boils the bulb off.** The contents are lost, grey steam rises, and no brew is spent. The alembic cannot be broken: it is the zone's only one. Source: POTIONS §2 step 6 and question 3's default.
2. **The bulb holds three cubes.** A fourth bounces off with the denied sound. Source: POTIONS §2 step 2.
3. **Nothing fed can be taken back.** What goes into the work stays in the work. Source: POTIONS §2 step 3.
4. **Grey never says no recipe.** An unmatched bulb stays grey, so discovery stays open. Source: POTIONS §2 step 4.
5. **Only the positive path makes drops.** A positive brew fills the flask over six seconds, one drop per second. Source: POTIONS §2 step 5.

## 3. The drink verb (proposal, not approved)

The drink verb is how a flask is used. It is designed here and not approved; it passes [sotano-controls](../../../../../.claude/skills/sotano-controls/SKILL.md) before any key is chosen.

- **The verb:** Drink. A new action, a press, live only in play.
- **What it acts on:** the top of the hand, when that is a flask. Otherwise it does nothing and plays the denied sound.
- **The lift:** the hands raise the flask to the mouth for 0.4 seconds. The player may move but not cast during the lift (question 11's default).
- **After the lift:** the drink event fires, the effect installs, the flask is gone, and the banner names the potion and its effect line, as for practices.
- **Mappings (to decide):** keyboard and mouse, one key live only in play, with no clash with place, throw, bomb or polarity (F is polarity, [KEYBOARD](../../../../architecture/input/KEYBOARD.md)). Gamepad, one face or stick button; the controls skill lists X, LS and RS as free in play. Touch, a flask button in the right-thumb arc, shown only while a flask is in the hand, within the seven-button limit.
- **Stations:** the kitchen's meals may later share the action under a wider label ([CARRYABLES](../../stations/CARRYABLES.md)). The brainstorm's "eat with F" must change either way: F is polarity.

## 4. The steps of a brew (proposal)

The physical sequence as the proposal describes it. Its rules are §1 and §2.

1. **Find it.** The laboratory glows warm through its open door; the hearth burns. Three small brass rings on the base show the brews left.
2. **Feed the bulb.** Place or throw a part or a block cube into it. One mark on the glass lights in the cube's path colour (parts), or stays plain (materials). Three cubes at most; a fourth bounces off with the denied sound.
3. **It keeps what is fed** for the whole run. With one hand slot, parts can be ferried one by one. Nothing fed can be taken back.
4. **Read it.** If the contents match a recipe brewed in any run, the liquid takes that potion's colour. Otherwise it stays grey, which never says there is no recipe.
5. **Brew.** A positive intention on the bulb raises its light, and drops fall into the flask, one per second, for six seconds: a visible fill, no bar and no number. One brew ring goes dark.
6. **Spoil.** A negative intention on a loaded bulb boils it off: grey steam, the contents lost, and no brew spent.
7. **Collect.** The flask stands on its stand. Walking onto it lifts it into a free hand slot. If the hand is full, it waits there for the run.
8. **Rest.** After the third brew the hearth goes cold and the bulb frosts over. Nothing is said: the rest is a visual.

## Why the rules are so tight

Brewing is scarce by design: parts are not scarce (challenge rooms give endless waves), so scarcity has to be at the station ([RECIPE-MODEL](RECIPE-MODEL.md) §6). The approved rules are the cap; the rest of the scarcity list is proposal.
