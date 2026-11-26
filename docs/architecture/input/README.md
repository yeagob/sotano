# Input

How the player's hands reach the game. The Roots ships three complete control schemes, keyboard and mouse, gamepad and touch, and switches between them by itself: whichever device you used last owns the prompts. Every action is defined once, in one table, and each device is a way of reaching it. How to add a control is the [`sotano-controls`](../../../.claude/skills/sotano-controls/SKILL.md) skill; the contract is checked by `tests/controls.test.ts`.

## Contents

| Document | Contents |
|---|---|
| [KEYBOARD.md](KEYBOARD.md) | Keyboard and mouse: the layout, pointer lock as pause, key repeat, the debug keys |
| [GAMEPAD.md](GAMEPAD.md) | Gamepad: the standard mapping, sticks and dead zones, waking the device, menus with the d-pad, death and disconnection, rumble |
| [TOUCH.md](TOUCH.md) | Touch: landscape only, contextual buttons that come up on a touch and fade (§1.1), the floating stick, look drag, the button arc, the half turn of the phone for polarity, the tab button and the screen, tap to place, what leaves the screen, fullscreen and the rotate card |

Reviews: [../../reviews/input.md](../../reviews/input.md).

## 1. Modules

| File | Role |
|---|---|
| `src/input/bindings.ts` | `BINDINGS`: every action with its keyboard/mouse input, gamepad button or stick, touch control, contexts and Minecraft / Noita / Isaac references. Pure data, tested in node. |
| `src/input/input.ts` | `Input`: raw state of the three devices, the action layer, the active device (`activeDevice()`, `onDeviceChange`), pausing (`playing`, `resume`, `release`), gamepad polling and rumble. |
| `src/input/touch.ts` | `TouchControls`: the touch layer. |
| `src/input/touch-layout.ts` | `TOUCH_LAYOUT`: every touch button's place, size and tier, the minimum target size, and `TouchPresence` (the set comes up on a touch and leaves 3 s after the last one, issue #376). Pure data, tested in node. |
| `src/input/labels.ts` | Words per device: `controlKey(row, device)`, `forDevice(prompt, device)`, `controlParams(device)` for the tablets. |

## 2. Actions and contexts

Game code never reads a key code, a button index or a touch. It asks `input.held(action)`, `input.hit(action)` (a rising edge this frame), `input.hitBy(action)` (which device pressed it), `input.move`, `input.navigate()`. `input.suppress(...)` mutes actions until their inputs are released, so the press that dismisses a banner or resumes the game never also casts or jumps.

`Game.frame` calls `input.poll(dt)` first, then works out the context and reads only the actions live in it:

| Context | When |
|---|---|
| `play` | Simulating |
| `prompt` | Information banners dismiss with confirm; a practice card (the item banner) closes on the release of a tap that did not drag (a pointer press never closes it, #375); a Presence offer pauses the world until confirm accepts or back declines |
| `paused` | The menu is up (the screen with its menu tab, or the pause card) |
| `dead` | The death screen |
| `inventory` | The screen is open on its menu, practices or star map tab (it pauses the world) |
| `toll` | The way-down window: pick what to give, confirm gives, back stays (LEVELS §2.3c) |
| `meditation` | The Sanctuary, the Boundary's meditation app, over the paused world: navigate moves between the choices of its screen, confirm chooses (and pauses or resumes a sitting), skip moves to the next part, mute and calm are its two switches, back goes one screen back (not now on its first screen, the leave sheet in a sitting). A click on it never captures the mouse (`Input.modal`) ([MEDITATION-APP.md](../../design/built/presences/MEDITATION-APP.md)) |

## 3. The actions

| Action | Kind | Contexts | Keyboard and mouse | Gamepad | Touch |
|---|---|---|---|---|---|
| move | axis | play | WASD / arrows | left stick | floating stick |
| look | axis | play | mouse | right stick | drag on the right |
| jump | hold | play | Space | A | the arrow |
| cast | hold | play | left click | RT | the bead of light |
| place | press | play | right click | LT | a tap on the block (aims at the tap) |
| throw | press | play | Q | B | the use button (the flying block): one button for the active hand, shared with drink |
| drink | press | play | G | X | the use button, while a flask is on top of the hand (drawn as that flask) |
| bomb | press | play | E | RB | the bomb |
| polarity | press | play | F | LB | a half turn of the phone |
| dash | press | play | double tap of a movement key (W A S D or arrows) | double flick of the left stick | the body button while the stick moves (shared with crouch, TOUCH §1.1); the swipe on the left side still dashes |
| run | hold | play | hold Shift (left or right) | L3 (toggles until the left stick returns to centre; the left stick at its edge also runs) | the left stick pushed past 95 % of its radius |
| crouch | hold | play | C switches it, Control holds it | R3 (toggles) | the body button (toggles; shared with dash, kneels while the stick rests); the swipe down from the bottom of the right side still toggles |
| previous | press | play | mouse wheel up | d-pad left | none of its own: tap the item in the inventory |
| next | press | play | mouse wheel down | d-pad right | none of its own: tap the item in the inventory |
| pick | press | play, inventory | 1 to 9; Enter in the inventory | A in the inventory | tap an item in the inventory |
| inventory | press | play, paused, inventory | Tab / I | Y | the tab button (top) |
| map | press | play, paused, inventory (gamepad: play, inventory; touch: paused, inventory) | M | View | the Star map tab of the screen |
| recipes | press | play, paused, inventory (gamepad: play; touch: paused, inventory) | J | D-pad Down | the Recipes tab of the screen (shown only while the Book of Secrets is held) |
| pause | press | play, paused | Esc | Menu | none: the tab button opens the same screen |
| restart | press | see each device | R | View | "New run" on the landing and the pause card |
| book | press | paused, dead | H | X | the "Download the book" button, at 100% completion (COMPLETION §8) |
| confirm | press | prompt, paused, dead, toll, meditation | click / Enter | A | tap |
| navigate | axis | inventory, toll, paused, meditation, prompt | arrows | d-pad | tap a tile; on the menu, drag the field-of-view bar or tap − and + |

| back | press | inventory, toll, meditation; prompt (keyboard/gamepad) | Esc | B | ✕ (in a sitting, the Leave button); offer card buttons |
| skip | press | meditation | N | RB | the Next part button |
| mute | press | meditation | M | X | the Sound button |
| calm | press | meditation | C | Y | the Calm visuals button |
| voice | press | meditation | V | LB | the Voice button (the Sanctuary's spoken guidance) |
| miracle | press | play | V | D-pad Up | the clock ring, shown only while Kairos is held (its charge fills the ring) |

**The choice card (prompt).** A presence's question with up to four answers (`Hud.presenceChoiceCard`) reads `navigate` to move the selection (left and right, or up and down, wrap at the ends); confirm picks the selected answer; back, or Not now, answers nothing. A tap on an answer picks it. Owed in a browser: the gamepad and touch paths were not checked (see ELDER.md and CARTOGRAPHER.md).

### 3.1 The touch audit (issue #377)

Every verb the player has, against each device, including the verbs that are a new meaning of an action (a practice, a weapon, the laboratory). Read with the table above: an action there is a row here only when the audit adds something. `tests/controls.test.ts` reads the table above and fails on an action without a row or with an empty cell; it also pins the keyboard, mouse and gamepad mappings to `tests/controls.keyboard-gamepad.json`, so a touch change cannot move them.

| Verb | Comes from | Keyboard and mouse | Gamepad | Touch | Touch before #377 |
|---|---|---|---|---|---|
| move, look, jump, cast, place, throw, drink, bomb | always (drink: a flask on top) | as above | as above | as above | had it |
| intention polarity | always | F | LB | half turn of the phone | had it |
| air jumps | Double Jump, Triple Jump, Wall Jump | Space again in the air | A again | the arrow again | had it |
| launch a missile | Dr. Launcher (`missile`) | double click | double RT | double tap on the bead | had it |
| run | Fartlek, Stride Tonic (`run`) | Shift | L3 | stick at its edge | had it |
| **crouch** | Child's Pose, Walk Slow, Folding Tincture (`crouch`) | C / Control | R3 | **the body button** (+ the swipe) | **gap**: only a hidden swipe at the bottom edge, where the phone's home gesture lives |
| **dash** | Irimi (`dash`) | double tap a direction | double flick | **the body button** (+ the swipe) | **gap**: only a hidden swipe, no visible control |
| slow time | Walk Slow | crouch on the ground | crouch | the body button | gap (through crouch) |
| miracle | Kairos | V | D-pad Up | the clock ring | had it |
| recipe book | Book of Secrets (`recipes`) | J | D-pad Down | Recipes tab of the screen | had it |
| brew at the alembic | the laboratory | cast at it | RT | the bead | had it (a meaning of cast) |
| take a flask, pick up | the world | walk over it | walk over it | walk over it | passive |
| choose a carried item | always | 1-9, wheel | d-pad left / right | tap a hand slot | had it |
| inventory, pause, map | always | Tab / I, Esc, M | Y, Menu, View | the tab button; the map tab | had it |
| restart, book | menus | R, H | View, X | buttons of the card | had it |
| confirm, navigate, back | menus | Enter / click, arrows, Esc | A, d-pad, B | tap, tap, ✕ / Keep | had it |
| the Sanctuary (skip, mute, calm, voice) | the Boundary | N, M, C, V | RB, X, Y, LB | its bar's buttons | had it |

Count: 29 actions in `BINDINGS`, plus 5 verbs that are a new meaning of one (air jumps, missile, slow time, brewing, polarity's half turn). Before #377 two actions (crouch, dash) and the slow time that rides on crouch had no visible touch control; after it, none.

**Shared touch buttons.** One: the **body button**, for crouch and dash (`touch.shared: 'body'`, `SHARED_TOUCH` in `bindings.ts`, the rule in `src/input/context-button.ts`). They share because both are body verbs given by a practice, and most runs hold only one of them, so one place on screen is enough; with both, the stick decides: still kneels, moving dashes (TOUCH §1.1). No other touch control is shared; the test lists every clash and allows only this one.

**Air jumps** (with the Triple Jump, [built/player/TRIPLE-JUMP.md](../../design/built/player/TRIPLE-JUMP.md)). No new action: while you are off the ground, a second press of jump is the next air jump (the Triple Jump gives two, the Double Jump one). It is the same button, the same press on every device, and it needs no `BINDINGS` change. The words for jump name the air jumps (`controls.jump`, every device's row). References: Minecraft (a double jump is the same jump button, pressed again in the air), Noita (the levitate key is held, not a new key), Isaac (a practice changes what the one button does, never adds a button).

**The double tap of cast** (only with the `missile` stat, Dr. Launcher). It is a new meaning of `cast`, not an action of its own: a second press of cast within `DOUBLE_TAP_MS` (0.3 s, `src/input/bindings.ts`) of the first launches a bomb as a missile instead of an intention, and the press is suppressed until released. The first press always casts as usual. It is a quick double click of the left button, a quick double press of RT, or a quick double tap on the bead of light; without the stat a double tap is two intentions. The game reads it from `input.hit('cast')` (`Game.tapMissile`), so every device gets it from the same rule. Its words are `controls.launch` and `.key`, `.pad`, `.touch`; the first time the stat is on in a run, `toast.missileHint` names the device's gesture. References: Minecraft (a double press already means something new: a double jump flies, a double forward sprints), Noita (one fire control, the wand decides what leaves it), Isaac (an item changes what the shot does, never adds a button).

## 4. Pausing

`Input.playing` is true while the pointer is locked or the player is `engaged`. The keyboard pauses by losing pointer lock. The gamepad and touch have no pointer lock: `resume()` sets `engaged`, `release()` clears it. Losing the window (blur, a hidden tab) always pauses. **The screen.** Esc, Tab, Menu, Y and the touch tab button all open one screen with two tabs, Menu and Practices (`Hud.screenKey`, `Hud.openScreen`, `Hud.closeScreen`). Opening it releases the pointer lock and stops the world; closing it resumes on the device that opened it. On the keyboard Tab opens the Practices tab, and pressed again while Practices is shown it closes the screen; pressed on the Menu tab it switches to Practices. The touch tab button opens the Menu tab and closes the screen when pressed again.

**The controls list (issue #349).** The pause card's list is `CONTROL_ROWS` filtered by `visibleControlRows` (`src/input/bindings.ts`). A row with a gate in `CONTROL_GATES` shows only while the player meets it: the `run`, `crouch`, `dash` and `recipes` stats (a practice or a potion grants them), the `kairos` practice for the miracle, and the star map's first opening in the run (`Game.starMapSeen`). A row with no gate is basic and always shows: look, move, jump, cast, polarity, pickup, place, throw, drink, bomb, doors, previous, next, pick, inventory, restart, pause. `Hud.syncControls` redraws the list each frame when its rows change. The gates do not depend on the device: keyboard, gamepad and touch show the same rows, and no row says that another is missing.

**The menu's settings.** While the menu shows (the pause card, or the screen on its Menu tab), `navigate` left and right step the field of view by 5° (`Game.frame`, `Hud.menuShown`); up and down do nothing yet. It is a new meaning of `navigate`, not a new action: the arrows on the keyboard, the d-pad on a pad, and on touch a drag of the bar or a tap on − and +. The mouse drags the bar or clicks − and +, and those clicks never capture the pointer (the menu rule below) nor resume on touch.

**The mouse in the menus (#356).** Pointer lock is taken only for play. `#overlay` (the pause card, the menu panel and the screen with its tabs) is marked `data-menu` in `index.html`, and a mouse press inside a `data-menu` element never requests the lock (`capturesMouse` in `src/input/input.ts`): the pointer stays visible and every control there gets its click the first time. Play starts from a click, never a press: the Click to play button (`resume`), or on the keyboard and mouse a click on the pause card's backdrop outside the card and its scrollbar (`backdropResumes` in `src/game/menu-pointer.ts`; never while the screen is open). Opening the screen or the pause releases the lock as before. A hover on a practice tile redraws the screen only when it moves the highlight (`hoverRedraws`), so a redraw never replaces the tile between the press and the release. Gamepad and touch are unchanged. The death screen is not a menu here: a press there still captures the mouse for the next run. The hint under the bar names the device in use (`graphics.hint`, `.pad`, `.touch`). References: Minecraft (an options slider moved by mouse drag or by left and right on a controller), Noita (the d-pad moves through its options), Isaac (left and right change an option in the pause menu).

## 5. Words and juice

Every prompt has a version per device (`intro.play`, `banner.continue`, `death.restart`, `inv.close`, plus `.pad` and `.touch`), and every control row has `controls.<row>.key`, `.pad` and `.touch` in every catalog. The roots' tablets use placeholders (`{move}`, `{cast}`…) filled by `controlParams(device)` and are carved again when the device changes. Screen shake also rumbles the pad or vibrates the phone, through `Hud.shake` → `Input.rumble`.

## 6. Later

Remapping (DECISIONS §10.4 asks for remappable input): `BINDINGS` is the default layout a settings page would copy and edit. Gyro aiming on phones.

**The star map (D15 of #149).** `map` opens the screen on its star map tab, and closes the screen when that tab is the one on screen (`mapKeyOutcome`); back (Esc, B) and the card's ✕ close it as any tab. On the map tab `navigate` and `pick` do nothing. References: Minecraft (the map is held up and read; the screen keeps one view per tab), Noita (M opens the map of what you have seen), Isaac (Tab, or Select on a pad, shows the floor's map). The design is [STAR-MAP.md](../../design/built/levels/giant-tree/STAR-MAP.md).

**The Recipe Book.** `recipes` opens the screen on its Recipes tab, and closes the screen when that tab is the one on screen (`recipesKeyOutcome`); back (Esc, B) and the card's ✕ close it as any tab. It works only while the `recipes` stat is 1 (the Book of Secrets); without it the key does nothing and the tab is hidden. On a pad D-pad Down opens it in play only: on the screen the d-pad is `navigate`, which scrolls the book up and down on its tab (`Hud.scrollRecipes`); `pick` does nothing there. The key is J (a journal, as in many games): B is the Roots' book download on the pause card and the death screen, and it moved to H; I is the inventory and F the polarity. References: Minecraft (the recipe book is a button of the inventory screen), Noita (what you learned is read on a page of the pause screen), Isaac (one key, one screen: the journal of what you found). The design is [RECIPE-BOOK.md](../../design/built/practices/RECIPE-BOOK.md).
