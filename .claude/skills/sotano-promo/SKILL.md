---
name: sotano-promo
description: How to make a promotional video of a The Roots feature for social networks, first YouTube (16:9 and Shorts) and X. Use it EVERY time the owner asks for a promo, a trailer, a teaser, a clip or a video of a feature for social media. Captures the real game with Playwright from a fixed seed, narrates with a local text-to-speech model (Chatterbox), mixes with ffmpeg and exports one file per platform. Also use sotano-art (anything visible), sotano-i18n (every word in English and Spanish) and sotano-docs.
---

# The Roots promotional video skill

A promotional video shows **one feature, playing for real**, in under a minute, with a narrator and captions, in English and in Spanish. It is made from the game itself, never from mock-ups, and every frame passes the art bar. The first one presents the berserker heart ([built/player/hearts/BERSERKER.md](../../../docs/design/built/player/hearts/BERSERKER.md)).

## 1. Platforms

| Output | Size | Length | Format |
|---|---|---|---|
| YouTube (main) | 1920 × 1080, 16:9, 30 or 60 fps | 30–90 s | H.264 high, yuv420p, AAC 48 kHz stereo, `-movflags +faststart` |
| YouTube Shorts | 1080 × 1920, 9:16 | ≤ 60 s | same codec; the action kept in the centre third |
| X | 1920 × 1080 (16:9) or 1080 × 1080 (1:1) | ≤ 2 min 20 s, aim for 20–45 s | H.264, AAC, ≤ 512 MB, ≤ 40 fps is safest |

Every output gets burned-in captions (people watch muted) and a separate `.srt` for YouTube.

## 2. The script

1. **One feature, one sentence.** Write the hook first: what the player sees in the first two seconds. Show the feature in the first five seconds; no logos first.
2. **Shape** (30–45 s): hook (0–3 s, the feature in action) → what it is (one line) → three beats, each one rule shown on screen → the payoff (the most spectacular moment) → the title card: THE ROOTS, the call to play, the repository link.
3. **Words follow the story rules** (`docs/design/built/story/`): practices, intentions (never tears), projections (patterns, never people). Write the narration in English and Spanish (`sotano-i18n` vocabulary). Lines short: about 2.5 words per second.
4. **Keep the script** in `docs/promo/<feature>/SCRIPT.md` (shots, timings, narration in both languages, the seed, the console commands per shot).

## 3. Capture the game

- Run the game with Vite and drive it with Playwright (Chromium is preinstalled; `require('playwright')`), with WebGL through SwiftShader: `chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })`, as `scripts/sandbox.mjs` does.
- Open a **fixed seed** (`?seed=ABCD-EFGH`) or a sandbox scenario (`?sandbox=<id>`), and drive every shot from the debug console (`window.S`, docs/architecture/OVERVIEW.md): `S.heart('berserker')`, `S.give(id)`, `S.tp(x, y, z)`, `S.game.simulateUnlocked = true` so it runs without a captured mouse. Never edit the game for a video; if a shot needs a hook, add it to the console and document it.
- SwiftShader is slow: record with Playwright's `recordVideo` at the target size, or take screenshots of a fixed-step simulation and assemble them with ffmpeg (`-framerate 30 -i f%05d.png`) for smooth motion. Hide the debug readout.
- The game's sound is synthesised in the browser and is not in Playwright's video: the soundtrack is the narration plus, when wanted, synthesised cues rendered separately.

## 4. Narration with a local text-to-speech model

- **Chatterbox** (Resemble AI, MIT licence) is the owner's choice. Install it in a virtual environment outside the repository (the scratchpad), CPU is enough for short lines:
  `python3 -m venv tts && tts/bin/pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu && tts/bin/pip install chatterbox-tts`
- English: `ChatterboxTTS.from_pretrained(device='cpu')`, `model.generate(text, exaggeration=0.5–0.8, cfg_weight=0.3–0.5)`, save with `torchaudio.save(path, wav, model.sr)`. Spanish: the multilingual model (`ChatterboxMultilingualTTS`, `language_id='es'`) when the installed version has it; otherwise say so and use the English voice for the English cut only.
- One file per line, so timings can be adjusted. Never clone a real person's voice without their written consent; the default voice or an original reference voice only.
- Normalise to −16 LUFS (`ffmpeg -af loudnorm=I=-16:TP=-1.5:LRA=11`).

## 5. Edit and export

- Assemble with ffmpeg: clips cut to the script, narration lines placed with `adelay`, captions from the `.srt` with the `subtitles` filter (the HUD font, bone paper on an ink box), a 2 s title card at the end built from the landing art.
- Export each platform in §1 from the same edit. Name them `<feature>-<platform>-<lang>.mp4`.
- **Never commit videos or audio** to the repository. Outputs go to the scratchpad or a release asset; the repository keeps only the script and the tools.

## 6. The gate

- [ ] Every frame is the real game, passing the `sotano-art` red lines (no assets, names or music from other games; no gore; gentle flashes, ≤ 3 Hz).
- [ ] The feature is visible in the first 5 seconds, and every rule the narration names is shown.
- [ ] Narration and captions in English and Spanish; numbers as in the design document.
- [ ] Sizes, lengths and codecs as in §1 (`ffprobe` each file).
- [ ] The script is in `docs/promo/<feature>/SCRIPT.md`, indexed in `docs/promo/README.md`.
- [ ] Report what was made, where the files are, and what could not be made.

## 7. Feedback log (append, newest last)

- **2026-11-03, owner:** the berserker heart is the first feature with a promo video; YouTube and X first; local TTS, Chatterbox preferred.
- **2026-11-03, the first video (berserker):** (1) capture by pausing the sandbox and stepping it a fixed tick per frame (`S.sb.pause(true)`, `S.sb.step(2)` at 30 fps), never by recording real time under SwiftShader; (2) the sandbox room is small: a feature that speeds the player up crosses it in two seconds, so shots are short passes reset between them; (3) loose-block shots need blocks with only one solid neighbour, spaced apart; (4) clear the hand each frame if the shot should not show what the player picks up; (5) the multilingual Chatterbox voice sometimes adds babble after a line: check every line with Whisper and cut after its last word; (6) the cover already carries the logo: the title card adds only the call and the link.
