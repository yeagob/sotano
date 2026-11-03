# The berserker heart: promotional video script

The first promotional video of THE ROOTS (owner, 2026-11-03): the berserker heart, about 30 seconds, narrated in English and Spanish. The feature is in [built/player/hearts/BERSERKER.md](../../design/built/player/hearts/BERSERKER.md).

Part of [promotional videos](../README.md).

## Capture

- The sandbox room (`?sandbox=blank`), the simulation running unlocked (`S.game.simulateUnlocked = true`), the debug readout hidden.
- The berserker heart is dropped with `S.heart('berserker')`; loose blocks are single blocks set on the floor; projections are spawned with the sandbox console.

## Shots and narration

| Time | Shot | English | Spanish |
|---|---|---|---|
| 0–4 s | A rare heart beats on the floor, its halo burning | Deep in the roots, a heart beats faster than the rest. | En lo hondo de las raíces, un corazón late más rápido que los demás. |
| 4–9 s | The player walks into it: the roar, the burst, the frame | The berserker heart. One more heart, and a fire you carry. | El corazón berserker. Un corazón más, y un fuego que llevas dentro. |
| 9–15 s | Running and jumping higher, single blocks shattering underfoot | Stronger. Faster. Higher. Loose stone breaks under your feet. | Más fuerte. Más rápido. Más alto. La piedra suelta se rompe bajo tus pies. |
| 15–21 s | Short intentions up close, a projection's shot sent back | Your intentions reach less, so you fight up close. And what they throw at you, comes back. | Tus intenciones llegan menos lejos: luchas de cerca. Y lo que te lanzan, vuelve. |
| 21–26 s | The heart is spent: the frame and the echo fade | Hold it as long as you can. When it breaks, the fire goes out. | Aguántalo todo lo que puedas. Cuando se rompe, el fuego se apaga. |
| 26–30 s | Title card: THE ROOTS | THE ROOTS. Go deeper. | THE ROOTS. Ve más hondo. |

## Outputs

`berserker-youtube-en.mp4`, `berserker-youtube-es.mp4` (1920 × 1080), `berserker-shorts-en.mp4`, `berserker-shorts-es.mp4` (1080 × 1920), `berserker-x-en.mp4`, `berserker-x-es.mp4` (1920 × 1080), each with an `.srt`.

## Making it again

The tools are in `scripts/promo/berserker/`. Run them from a working folder outside the repository (the outputs are large and never committed), with a Python virtual environment that has `chatterbox-tts` and `openai-whisper` (the `sotano-promo` skill, §4):

1. `node <repo>/scripts/promo/berserker/capture.mjs cap-en en` and `… cap-es es`: 690 frames each (23 s at 30 fps), the sandbox paused and stepped at a fixed tick.
2. `<venv>/bin/python <repo>/scripts/promo/berserker/tts.py en` and `… es`: one narration file per line. Each line is generated with a few seeds and checked with Whisper; the audio is cut after the line's last word, because the multilingual model sometimes adds sounds after the line.
3. `python3 <repo>/scripts/promo/berserker/edit.py en` and `… es`: the YouTube (1920 × 1080), Shorts (1080 × 1920) and X (1920 × 1080) files and the `.srt`, in `out/`.

The Spanish voice reads the title as "Di Ruts", so it sounds like the English name; the captions keep THE ROOTS.
