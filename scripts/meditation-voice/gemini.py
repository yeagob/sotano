# Generates the spoken guidance of the Sanctuary (docs/design/built/presences/MEDITATION-APP.md §7a) with Gemini's
# speech model. It replaces generate.py (Chatterbox) for the voices. The clips are committed; the game never calls
# a model or the network during a sitting.
#
# Usage (from the repository root; Python 3.11, standard library only, ffmpeg and ffprobe on PATH):
#   python scripts/meditation-voice/gemini.py --check              # every line and the clip it would write; no API call
#   python scripts/meditation-voice/gemini.py --lang es --check    # one language
#   GEMINI_KEY=... python scripts/meditation-voice/gemini.py       # every missing clip, English and Spanish
#   GEMINI_KEY=... python scripts/meditation-voice/gemini.py --lang en --force
#   GEMINI_KEY=... python scripts/meditation-voice/gemini.py --voice Achird --out <scratch dir>   # a listening test
#
# The key is read from the environment variable GEMINI_KEY only. It is never printed, logged or written to a file.
#
# The lines are the ones generate.py reads (src/i18n/locales/en.ts and es.ts, keys med.<meditation>.<part>.<n>); the
# breath cues are not in those files and are never spoken.
#
# Model and API: gemini-3.8-flash-tts, the newest speech model listed in Google's speech generation docs
# (https://aistudio.google.com/docs/speech-generation), through the Interactions endpoint shown there. The reply is
# a 24 kHz mono 16-bit WAV, which ffmpeg turns into the clip.
#
# Output: public/audio/meditation/<lang>/<key>.mp3, mono, 24 kHz, MP3_BITRATE. The loader plays mp3 (the same names
# as before, so src/audio/meditation-voice.ts does not change). A clip that exists is kept unless --force is given.
# Gemini's speech output is not seeded, so a re-run gives different clips: the committed files are the record.

import base64
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from generate import LOCALES, OUT, read_lines  # the same line reader as the Chatterbox generator

ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions'
MODEL = 'gemini-3.8-flash-tts'
VOICE = 'Gacrux'  # provisional: see docs/design/built/presences/MEDITATION-APP.md §7a (the listening test is the owner's)
# The delivery prompt. It is sent with each line as a speech_metadata style.
STYLE = ('Speak slowly, calmly and softly, as a meditation guide: a deep, low, warm female voice, unhurried, '
         'with a soft breath between the phrases. Never bright, never loud, never rushed.')
MP3_BITRATE = '32k'     # measured: see docs/design/built/presences/MEDITATION-APP.md §7a
MAX_SEC = 6.0           # a guidance line stays on screen for 6 s
BUDGET_MB = 10          # per language; both together stay under 20 MB
PAUSE_S = 1.0           # between two requests
RETRIES = 5             # for 429 and 5xx answers, with doubling waits
BACKOFF_S = 4.0


def audio_from(reply: dict) -> bytes:
    """The base64 audio of the model's output step in an Interactions reply."""
    for step in reply.get('steps', []):
        if step.get('type') != 'model_output':
            continue
        for part in step.get('content', []):
            if part.get('type') == 'audio' and part.get('data'):
                return base64.b64decode(part['data'])
    raise RuntimeError('the reply has no audio')


def request_audio(text: str, voice: str, key: str) -> bytes:
    """One line, one call. Returns the WAV bytes the API sends back."""
    body = {
        'model': MODEL,
        'input': [{'type': 'user_input', 'content': [{
            'type': 'text',
            'text': text,
            'annotations': [{'type': 'speech_metadata', 'style': STYLE}],
        }]}],
        'response_format': {'type': 'audio'},
        'generation_config': {'speech_config': [{'voice': voice}]},
    }
    req = urllib.request.Request(ENDPOINT, data=json.dumps(body).encode('utf-8'), method='POST', headers={
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
    })
    for attempt in range(RETRIES):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return audio_from(json.loads(r.read().decode('utf-8')))
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 503) and attempt + 1 < RETRIES:
                time.sleep(BACKOFF_S * 2 ** attempt)
                continue
            raise RuntimeError(f'the Gemini API answered {e.code} {e.reason}') from None
    raise RuntimeError('the Gemini API did not answer')


def to_mp3(wav: Path, mp3: Path) -> None:
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-ac', '1', '-ar', '24000',
                    '-b:a', MP3_BITRATE, str(mp3)], check=True)


def duration(mp3: Path) -> float:
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(mp3)],
                         capture_output=True, text=True, check=True).stdout.strip()
    return float(out)


def option(argv: list, name: str, default):
    if name not in argv:
        return default
    i = argv.index(name)
    if i + 1 >= len(argv):
        raise SystemExit(f'{name} needs a value')
    return argv[i + 1]


def main(argv: list) -> int:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    check = '--check' in argv
    force = '--force' in argv
    voice = option(argv, '--voice', VOICE)
    out_root = Path(option(argv, '--out', str(OUT)))
    values = {option(argv, n, None) for n in ('--voice', '--out')}
    langs = [a for a in argv if a in LOCALES and a not in values] or list(LOCALES)

    key = ''
    if not check:
        key = os.environ.get('GEMINI_KEY', '').strip()
        if not key:
            print('GEMINI_KEY is not set. Put the Gemini API key in that environment variable; the script never '
                  'writes it anywhere.', file=sys.stderr)
            return 2

    for lang in langs:
        lines = read_lines(lang)
        folder = out_root / lang
        if not check:
            folder.mkdir(parents=True, exist_ok=True)
        print(f'{lang}: {len(lines)} lines, voice {voice}, model {MODEL}', flush=True)
        for name, text in lines.items():
            path = folder / f'{name}.mp3'
            exists = path.exists()
            if check:
                state = 'kept (exists)' if exists and not force else 'to write'
                print(f'  {name}  {state}  {path}')
                print(f'      {text}')
                continue
            if exists and not force:
                continue
            with tempfile.TemporaryDirectory() as tmp:
                wav = Path(tmp) / 'clip.wav'
                mp3 = Path(tmp) / 'clip.mp3'
                wav.write_bytes(request_audio(text, voice, key))
                to_mp3(wav, mp3)
                sec = duration(mp3)
                path.write_bytes(mp3.read_bytes())
            warn = '  (longer than the 6 s a line stays on screen)' if sec > MAX_SEC else ''
            print(f'  {name}  {sec:.1f}s  {path.stat().st_size} bytes{warn}', flush=True)
            time.sleep(PAUSE_S)

    if check:
        return 0
    total = 0
    for lang in LOCALES:
        folder = out_root / lang
        size = sum(p.stat().st_size for p in folder.glob('*.mp3')) if folder.exists() else 0
        total += size
        print(f'{lang}: {size / 1e6:.2f} MB')
        if size / 1e6 > BUDGET_MB:
            print(f'  over the {BUDGET_MB} MB budget for {lang}', file=sys.stderr)
    print(f'total: {total / 1e6:.2f} MB (budget 20 MB)')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
