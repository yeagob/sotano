---
name: sotano-controls
description: Input discipline for The Roots. Use it EVERY time a control is added, changed or removed - a new action from an item, a synergy, a weapon, an effect, an element, a menu or a screen - or when any key, mouse button, gamepad button, stick or touch control is bound or rebound. Every action must be mapped on keyboard and mouse, gamepad and touch, following Minecraft, Noita and The Binding of Isaac, and the controls test must stay green.
---

# The Roots controls skill

The Roots ships in three versions that are always complete: **keyboard and mouse**, **gamepad** (any controller with the browser's standard mapping) and **touch** (mobile, always landscape). A control that exists on one of them and not on the others is a bug. The design is in [docs/architecture/input/](../../../docs/architecture/input/README.md) (the README for the table and contexts, then one document per scheme: KEYBOARD.md, GAMEPAD.md, TOUCH.md); this is the checklist.

## 1. The rule

**One table, three devices.** Every action lives in `BINDINGS` (`src/input/bindings.ts`) with a keyboard/mouse input, a gamepad input and a touch control, the contexts where it is live, and its references. Game code never reads a key code, a button index or a touch: it asks `input.held(action)`, `input.hit(action)`, `input.move` or `input.navigate()`.

## 2. Adding a control (an item, a weapon or an effect gives the player a new verb)

1. **Can it reuse a verb?** Prefer a new meaning for an existing action in context (a weapon that replaces `cast`, an item that changes what `place` does) over a new button. Isaac adds items, not buttons.
2. **Look up the references, in this order, and write them in `refs`:**
   - **Minecraft** (keyboard/mouse, controller and pocket edition): where the same kind of verb lives (use/place on the left trigger, attack on the right trigger, drop on B / Q, inventory on Y / E, hotbar on the bumpers, jump on A).
   - **Noita**: wands and throwables (fire held on the trigger, switch on the shoulders, throw/kick on its own button, inventory pauses).
   - **The Binding of Isaac: Repentance**: one glance, one button per consumable (bomb, pocket item, active item), Start pauses, restart lives in the pause menu on a pad.
   Take the slot the three agree on; when they disagree, take the one a player of all three would guess first.
3. **Add the entry to `BINDINGS`** with `kind` (`hold`, `press` or `axis`), `when` (contexts: `play`, `prompt`, `paused`, `dead`, `inventory`) and, only if a device differs, a per-device `when`.
4. **Gamepad:** free buttons in `play` today are `X`, `LS` and `RS`. Never take `MENU` (pause), `A` (jump/confirm) or `RT` (cast). A long press or a chord is a last resort.
5. **Touch:** a `button` (a glyph in `HUD_ICONS`, drawn by the art agent per `sotano-art`), a `systemButton` (top bar), a `menuButton` (on a card), a `tap`, or a `doubleTap` on an existing button (`on: '<action>'`; the polarity switch is a double tap on the cast button, owner rule). Touch buttons sit in the right-thumb arc; nothing goes under the left thumb's stick zone. Maximum seven buttons on screen in `play`: past that, fold the verb into a double tap, a drag or a menu.
6. **Words:** add `controls.<action>` (what it does) and `controls.<action>.key`, `.pad`, `.touch` (how) in every catalog (`sotano-i18n`). If a tablet or prompt mentions the control, use a `{placeholder}` filled by `controlParams(device)`, never a literal key name.
7. **The pause card** lists `CONTROL_ROWS`: add the action there if the player needs to learn it.
8. **Juice:** a gamepad rumble or a phone vibration comes through `Hud.shake` → `input.rumble`; never call the Vibration or Gamepad APIs elsewhere.

## 3. Rules

- No two actions share an input in the same context on the same device (the test checks it).
- Prompts adapt to the last device used (`forDevice('banner.continue', device)`): mouse words for the mouse, button names for the pad, taps for touch.
- A press that dismisses a prompt must not also act: `input.suppress(...)` until the input is released.
- Touch is landscape only: portrait shows the rotate card and pauses. Things that are not needed every second (the item bar) leave the touch screen and live behind a button.
- Menus pause on every device: pointer lock for the mouse, `engaged` for the pad and touch.

## 4. Before you commit

- [ ] `BINDINGS` entry with all three devices and the three references.
- [ ] Messages in every catalog; the pause card and tablets read right on each device.
- [ ] Verified in the browser: keyboard, a gamepad (a real one or `navigator.getGamepads` stubbed) and touch emulation in landscape and portrait.
- [ ] `npm run typecheck && npm test` (`tests/controls.test.ts`).
- [ ] The action table in [docs/architecture/input/README.md](../../../docs/architecture/input/README.md), the device's own document (KEYBOARD.md, GAMEPAD.md, TOUCH.md) and the root README controls updated.
