---
name: sotano-popups
description: Pop-up discipline for The Roots. Use it EVERY time a feature or system needs a pop-up, toast, notification, banner, card, dialog, panel, overlay or any other transient window. Lists every type that exists, what each is for and how to call it. Reuse an existing type first; if a new type is truly needed, add it to this skill in the same change. Also use sotano-i18n (every word), sotano-controls (every way to dismiss or answer) and sotano-art (its look).
---

# The Roots pop-ups skill

The game has a small set of window types. Each type has **one element, one look and one set of rules**. A feature that needs to tell the player something uses one of these types. It does not add a new element, a new class or per-site colours, so that changing how a type looks means editing one place.

The code lives in [src/game/hud.ts](../../../src/game/hud.ts) (the `Hud` class), [index.html](../../../index.html) (the elements) and the stylesheet block that styles each element.

## 1. Decide before you write anything

Work through the list in order. Stop at the first answer that fits.

1. **Does an existing type fit?** Read the registry in section 2. Match on *behaviour* (does it vanish by itself? does it block the game? does it need an answer?) and on *content* (a line of text, a card with a name and lines, a choice of items).
2. **Can an existing type take a parameter instead?** Extend the type with an option (a colour, a duration, a line). Do not copy it.
3. **Only then, a new type.** Criteria: no listed type can show the content with the behaviour it needs, even with a parameter. Write the reason in the PR body.

Never:
- add an element to `index.html` for one feature, unless it is a new type (and then it goes into section 2);
- hard-code a colour, size, font or animation in a feature. Use the palette tokens (`palCss(...)`) and the type's existing classes;
- let two windows of the same type fight over one element.

## 2. Registry: every type that exists

| Type | Element | Calls (on `Hud` unless noted) | Behaviour | Use it for |
|---|---|---|---|---|
| **Toast** | `#toast` | `toast(key, params)`, `toastDrinkHint(key, params)`, `effectToast(owner, id, params)` (from items and synergies), `polarityHint(params, marked)` | Short line, vanishes after about 2.5 s. Only one at a time: a new toast replaces the current one. No buttons. | Feedback that needs no answer: a pickup need, "seed copied", a potion made, a hint about a key. |
| **Achievement notice** | `#achievement` (its own element, top-right corner) | `achievementNotice(keys, level, ms, onDone)`, `achievementOpen` (getter). Cut off by `dismissBanner` and by the other windows. | **Not blocking, no input.** A slate strip in the top-right corner: a kicker, the achievement's name, what it does, and the mastery count. It leaves by itself after 3 s, or 5 s when the description is long (`noticeMillis`, over 70 characters). A window that arrives first cuts it off, and the notice stays queued. One at a time. | An achievement the player has earned. Never what the achievement gives in the Roots (issue #191). |
| **Item banner** | `#banner` | `itemBanner(def, changes, synergies)`, `dismissBanner()` | **Blocking.** Shows the item, its stat changes and its synergies. Stays until the player confirms it; gameplay input is blocked while it is open. | Telling the player what an item they just took does. |
| **Presence card** | `#banner` | `presenceCard(nameKey, lineKeys, params, kicker?)` | **Blocking.** Read-only card: a name and a few lines spoken by a presence. Stays until the player confirms it; gameplay input is blocked while it is open. Option `kicker` (a message key): a short line above the name, with a gold diamond. A param may be a function, called on each redraw, so the card follows a language change. Redrawn on a language change. | A presence speaking (the Listener, the Gardener and others). **Also an achievement's notice** (`kicker` = `achievement.card.kicker`): one card per achievement, queued and shown one at a time at a calm moment (`game.ts` `showAchievement`); the toll waits while a card is queued or open. Achievement cards carry no presence; the kicker says so. |
| **Presence offer** | `#banner` with `data-offer="true"`, `role="dialog"`, `aria-modal` | `presenceOfferCard(nameKey, carried)`, `closePresenceOffer()` | **Blocking.** Asks yes or no, with accept and decline buttons, and focuses accept. Closes only by answer. | A question the player must answer before the game goes on, such as an offering. |
| **Toll window** | `#toll` | `openToll(g, k)`, `closeToll(g)`, `confirmToll(g)` | **Blocking** grid of tiles to pick what to pay, with a cost line. | Paying a descent toll. |
| **Menu and inventory screen** | `#overlay` (a `.card.slate` with tabs) | `openScreen(g, tab)`, `closeScreen(g)`, `screenKey(g, device)` | **Blocking** full card with tabs (menu, items). Keyboard, gamepad and touch move through it. | The pause menu, the graphics settings and the inventory. |
| **Death screen** | `#death` | `showDeath(depth, items, source)` | Blocking end-of-run card. | Death. |
| **Boss bar** | `#boss` | `bossBar({ name, ratio } \| null)` | Persistent HUD status, not a message. Shows only during a boss fight. | The health of the boss in the room. |
| **Polarity indicator** | `#polarity` | `setPolarity(p)` | Persistent HUD status with a colour per polarity. | The current polarity. |
| **Inline hint** | `#fov-hint` and similar `.hint` text | set the element's text | A line of text beside a control. Not a window. | Explaining one control in a menu. |
| **Meditation app** | `src/game/meditation-app.ts`, `meditation-view.ts` | its own screen | A full screen of its own, not a pop-up. Listed so nobody builds a second one. | The Sanctuary. |
| **Developer panels** | `src/debug/test-panel.ts`, `src/debug/test-bench.ts` | developer only | Never shown to players. Their text is English on purpose (see the comment at the top of `hud.ts`). | Testing and debugging only. |
| **Fade** | `#fade` | `fadeOut(seconds)`, `fadeIn()` | Full-screen transition that is not a message. Each call restarts it. | Changing floor or room. |
| **Flash and hurt** | `#flash`, `#hurt` | `flash(color)`, `hurt()` | Screen effects, not messages. The flash has a 333 ms budget (`FLASH_BUDGET_MS`). | Damage and bright moments. |
| **Rotate prompt** | `#rotate` | shown by the device check | Blocks a phone in portrait until the player turns it. | Portrait phones only. |
| **Loading** | `#loading` | shown while the game starts | Full-screen wait message, localized through `app.loading`. | Start-up only. |
| **Sanctuary view** | `hud.sanctuary`, `hud.sanctuaryOpen` (`src/game/meditation-view.ts`) | opened from the Boundary; sets the input context to meditation | The meditation screen of the Sanctuary, drawn by its own view. | Sanctuary sittings. |

If a type you need is missing from this table, it is not a type yet. Read section 1 again before you add one.

## 3. Rules every type follows

**Text.** Every word the player can read is a message key, present in English and Spanish (`sotano-i18n`). Use `t(key, params)` through the type's method; never pass an English literal. Escape values put into `innerHTML`.

**Control.** Every window that waits for the player is dismissed or answered on **keyboard, mouse, gamepad and touch** (`sotano-controls`). Each such window needs a confirm action and a back action. A **timed** window (the toast, the achievement notice) needs no answer: it leaves by itself, and takes no input. The code paths differ (the presence offer, the toll, the screen and the death screen each wire their own), so check the path for the window you touch. A window the player cannot close is a bug.

**Focus and accessibility.** Only the presence offer sets `role="dialog"`, `aria-modal`, `aria-labelledby` and `aria-describedby`, and it moves focus to its accept action. Two gaps exist today: focus is not given back when a window closes, and the toast has no `aria-live` region. When you touch either one, close the gap: restore focus on close, and add `aria-live="polite"` to the toast. A toast is never a focus target.

**Single slot.** Each element holds one window at a time. A toast replaces the previous toast; a banner replaces the previous banner. Do not stack them and do not queue silently. When two things must be seen, use a blocking type and let the player answer one before the next.

**Look.** The look of a type lives in its one element's styles and the shared `.slate` surface. To change how a type looks, change it there, and only there. A new feature does not get its own styles.

**Blocking input.** While the item banner, a presence card, a presence offer, the toll, a screen or the death screen is open, gameplay input is blocked (movement, fire, drink): the game is in the prompt context. Only the presence offer is a question with accept and decline. The window owns the keys it uses. Test this path.

**Persistence.** Toasts and banners are not saved. Anything the player must not lose (an answer, a purchase) is stored in the game state, and the window only shows it.

## 4. Adding a new type

Only when section 1 says so. In the same change:

1. Add a row to the table in section 2: the type, its element, its calls, its behaviour and what it is for.
2. Add the element to `index.html` (if it is a new element) with a `data-i18n` or message-key text path, and its styles beside the others.
3. Add one method on `Hud` as the only way to open it. Feature code calls the method, never the element.
4. Follow sections 3 (rules) and the `sotano-i18n`, `sotano-controls` and `sotano-art` skills.
5. Add a test that opens, closes and replaces the window, and that its text exists in both languages.
6. Update the docs (`sotano-docs`) and say in the PR body why no existing type fitted.

## 5. Checklist for every feature that shows a window

- [ ] I read section 2 and used an existing type, or I wrote why none fit.
- [ ] The text is in every shipped language.
- [ ] It can be dismissed or answered with keyboard, mouse, gamepad and touch.
- [ ] I did not add an element, class or colour for this feature alone.
- [ ] If I added a type, it is in section 2 of this skill.
- [ ] The PR body names the type I used.
