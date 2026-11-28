---
name: sotano-recordings
description: Every Playwright test or capture of The Roots is recorded and kept with a metadata file that says what it tested, which feature it belongs to, when it ran, how long it lasted and which elements appeared. Use it EVERY time any agent runs Playwright against the game (a test, a check, a debugging run, a promo capture, a gameplay clip): it sets where the recording goes, the metadata file's fields, and the helper that writes both. Also use sotano-promo (for clips meant for social media), sotano-feature (quality bar) and sotano-docs.
---

# Playwright recordings (The Roots)

Every run of the game under Playwright leaves a **recording** (video, and screenshots when useful) and a **metadata file** beside it, so the owner can watch what a test did, see which feature it belongs to and check its timing, without rerunning it.

This applies to every agent: tests written by hand, the sandbox checks, debugging runs, and captures for promotional clips. A run without its recording and metadata is not done.

## 1. Where it goes

```
.local/recordings/<feature>/<YYYY-MM-DD>_<HHMMSS>_<slug>/
  video.webm          the recording (Playwright's recordVideo)
  metadata.json       the file described in section 2
  shots/              optional screenshots, named by step (01-start.png, 02-...)
```

- `<feature>` is a short kebab-case slug of the feature: `worm-desert`, `berserker-heart`, `test-bench`.
- `<slug>` names the run: `ride-and-dismount`, `kill-three-blasts`.
- `.local/` is git-ignored: recordings never enter a commit.
- Gameplay videos made for marketing are copied as well to `.local/marketing/gameplay/` (the owner's folder for clips), with the same base name as the run folder. The copy is additional, never a replacement.

## 2. The metadata file

`metadata.json` is written when the run ends, and it has these fields:

| Field | Meaning |
|---|---|
| `title` | One line: what this run is. |
| `description` | Two or three sentences: what it tests and what a pass means. |
| `feature` | The feature slug, and the design document it belongs to (path under `docs/design/`). |
| `issue` | The GitHub issue number, or `null`. |
| `date` | Start date, `YYYY-MM-DD` (local time). |
| `startedAt` | Start time, `HH:MM:SS` (local time). |
| `durationSeconds` | Length of the run, to one decimal. |
| `url` | The URL the run opened, with its flags (`?test`, `?seed=…`). Never a personal value. |
| `seed` | The world seed, if any. |
| `commit` | The commit under test (`git rev-parse --short HEAD`) and the branch. |
| `elements` | What appeared on screen, in order: the toasts, banners, cards, HUD elements and enemies the run showed. Each entry has `t` (seconds from the start) and `text` (the visible text) or `name` (the element). |
| `steps` | The steps the script took, in order, each with `t` and a short `what`. |
| `result` | `pass`, `fail` or `info` (a capture with no assertion). |
| `failure` | The failure message when `result` is `fail`, otherwise `null`. |
| `files` | The files written beside it, relative to the run folder. |

Write only what the run observed. Never invent an element or a time.

## 3. The helper

Use `scripts/recording.mjs`, which every script imports. It opens a browser context with video on, records the steps and the elements, and writes the folder and the metadata when `finish()` is called:

```js
import { startRecording } from '../scripts/recording.mjs';

const rec = await startRecording(browser, {
  feature: 'worm-desert',
  slug: 'ride-and-dismount',
  issue: 354,
  title: 'Ride the worm and dismount',
  description: 'Tames the worm, steers it inside the desert, then dismounts. Passes when the rider is set down.',
  url: 'http://localhost:5173/?test&seed=…',
  designDoc: 'docs/design/built/levels/worm-desert/WORM.md',
});
const page = rec.page;                    // use it as any Playwright page
rec.step('climb the back');               // a step, with its time
rec.element('toast', 'You are on the worm.'); // an element that appeared
await rec.shot('climb');                  // an optional screenshot
const meta = await rec.finish({ result: 'pass' }); // writes metadata.json and the copies
```

If a script cannot use the helper, it must still write a `metadata.json` with the same fields in the same folder. The helper is the default.

## 4. Rules

1. **Always record.** Headless runs record too: the video is the evidence.
2. **Metadata is written when the run ends**, pass or fail. A crashed run still writes `result: "fail"` with the error in `failure` (wrap the run in `try / finally`).
3. **Names and dates are real.** The folder name and `date` use the run's start time, not the time of writing.
4. **Elements come from the run.** Read the toasts and cards from the game's text on screen; do not copy them from the source.
5. **Keep the Spanish and English text as the game shows it.** The run does not change the language.
6. **Nothing personal.** No email, no name, no account, in the URL, the metadata or the file names.
7. **Keep it small.** A recording longer than 5 minutes is cut to the part that matters, and the cut is noted in `steps`.

## 5. Checks

- `scripts/recording.mjs` must have a unit test (`tests/recording.test.ts`): the folder name, the metadata fields, and a failed run still writing its metadata.
- A PR that adds a Playwright run documents it in its body: the metadata path and the `result`.
