# Generates the spoken guidance of the Sanctuary (docs/design/built/presences/MEDITATION-APP.md §7a) with Chatterbox,
# offline. The clips are committed; the game never calls a model or the network during a sitting.
#
# Usage (from the repository root, in a Python 3.11 environment with torch (CUDA), torchaudio, chatterbox-tts;
# --check also needs faster-whisper):
#   python scripts/meditation-voice/generate.py --check          # every missing clip, English and Spanish, checked
#   python scripts/meditation-voice/generate.py es --check       # one language
#   python scripts/meditation-voice/generate.py --check --recheck    # re-check the clips already there; redo the failing ones
#   python scripts/meditation-voice/generate.py en --force       # regenerate every English clip, unchecked
#   python scripts/meditation-voice/generate.py --list           # the lines and their clip names, no model
#
# The lines are read from src/i18n/locales/en.ts and es.ts: every key `med.<meditation>.<part>.<n>` is one
# guidance line. The breath cues (Breathe in, Hold, Breathe out, Rest) are not in these files and are never spoken.
#
# Check (--check): each clip is transcribed back (faster-whisper, small, on the CPU) and compared with its line.
# A clip is kept when its words match the line (ratio >= MIN_MATCH) and it lasts no longer than MAX_SEC, the time a
# guidance line is on screen. Otherwise the line is generated again with the next seed (up to ATTEMPTS), and the
# best candidate is kept. A clip is never kept worse than the best one seen.
#
# Output: public/audio/meditation/<lang>/<key>.mp3, mono, 24 kHz, about 56 kbit/s. Both languages together must
# stay under 20 MB (checked at the end). Voice: Chatterbox's default voice, with no reference recording, so no
# real person's voice is cloned. English uses the English model (as scripts/promo/trailer/tts.py does); Spanish uses
# the multilingual model with language_id "es". Delivery is tuned slow and calm: low exaggeration, low cfg weight.
#
# Determinism: a fixed seed. Attempt k of clip i (in sorted key order) is generated with torch and random seeded to
# SEED + i + k * ATTEMPT_STEP, so a re-run on the same machine gives the same clips. A clip that already exists is
# kept unless --force is given (or --recheck finds it failing).

import difflib
import os
import random
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOCALES = {'en': ROOT / 'src/i18n/locales/en.ts', 'es': ROOT / 'src/i18n/locales/es.ts'}
OUT = ROOT / 'public/audio/meditation'
SEED = 20261119
ATTEMPT_STEP = 10007
ATTEMPTS = 8
EXAGGERATION = 0.35
CFG_WEIGHT = 0.3
TRIM_DB = 0.02          # a peak below this is silence, at the start and end of a clip
PAD_S = 0.12            # silence kept around the speech
MIN_MATCH = 0.9         # how closely the words heard must match the line
MAX_SEC = 6.0           # a guidance line stays on screen for LINE_MS (6 s)
BUDGET_MB = 10          # per language; both together stay under 20 MB
MP3_BITRATE = '56k'
KEY = re.compile(r"^\s*'(med\.[a-z]+\.[a-z]+\.\d+)':\s*'((?:[^'\\]|\\.)*)',\s*$", re.M)


def read_lines(lang: str) -> dict:
    """The guidance lines of one language, in the order of their keys."""
    text = LOCALES[lang].read_text(encoding='utf-8')
    found = {}
    for key, raw in KEY.findall(text):
        found[key] = raw.replace("\\'", "'").replace('\\\\', '\\')
    return dict(sorted(found.items()))


def to_mp3(wav_path: str, mp3_path: Path) -> None:
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav_path, '-ac', '1', '-ar', '24000',
                    '-b:a', MP3_BITRATE, str(mp3_path)], check=True)


def duration(mp3_path: Path) -> float:
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(mp3_path)],
                         capture_output=True, text=True, check=True).stdout.strip()
    return float(out)


def trim(wav, sr: int):
    """Cuts the silence at both ends of a clip, keeping PAD_S of it."""
    import torch
    peak = wav.abs().squeeze(0)
    idx = torch.nonzero(peak > TRIM_DB).flatten()
    if idx.numel() == 0:
        return wav
    pad = int(PAD_S * sr)
    start = max(0, int(idx[0]) - pad)
    end = min(wav.shape[1], int(idx[-1]) + pad)
    return wav[:, start:end]


def words(s: str) -> list:
    return re.findall(r"[a-záéíóúñü]+", s.lower().replace('’', "'"))


class Checker:
    """Transcribes a clip back and scores it against its line. Loaded once, only when --check is on."""

    def __init__(self):
        from faster_whisper import WhisperModel
        self.model = WhisperModel('small', device='cpu', compute_type='int8')

    def score(self, mp3: Path, text: str, lang: str) -> float:
        segs, _ = self.model.transcribe(str(mp3), language=lang, beam_size=5)
        heard = ' '.join(s.text for s in segs)
        return difflib.SequenceMatcher(None, words(text), words(heard)).ratio()


def generate(model, lang: str, text: str, seed: int, sr: int, tmp: str) -> Path:
    import torch
    import torchaudio as ta
    torch.manual_seed(seed)
    random.seed(seed)
    if lang == 'en':
        wav = model.generate(text, exaggeration=EXAGGERATION, cfg_weight=CFG_WEIGHT)
    else:
        wav = model.generate(text, language_id='es', exaggeration=EXAGGERATION, cfg_weight=CFG_WEIGHT)
    wav = trim(wav.cpu(), sr)
    wav_path = os.path.join(tmp, f'clip-{seed}.wav')
    ta.save(wav_path, wav, sr)
    mp3 = Path(tmp) / f'clip-{seed}.mp3'
    to_mp3(wav_path, mp3)
    return mp3


def best_clip(model, lang: str, key: str, text: str, index: int, sr: int, checker, tmp: str) -> tuple:
    """Generates up to ATTEMPTS candidates and returns (mp3, score, seconds) of the first that passes, else the best."""
    best = None
    for k in range(ATTEMPTS):
        seed = SEED + index + k * ATTEMPT_STEP
        mp3 = generate(model, lang, text, seed, sr, tmp)
        sec = duration(mp3)
        if checker is None:
            return mp3, None, sec
        s = checker.score(mp3, text, lang)
        print(f'    try {k + 1}: match {s:.2f}, {sec:.1f}s', flush=True)
        if best is None or s > best[1]:
            best = (mp3, s, sec)
        if s >= MIN_MATCH and sec <= MAX_SEC:
            break
    return best


def main(argv: list) -> int:
    if '--list' in argv:
        for lang in LOCALES:
            lines = read_lines(lang)
            print(f'{lang}: {len(lines)} lines')
            for k, v in lines.items():
                print(f'  {k}  {v}')
        return 0
    force = '--force' in argv
    recheck = '--recheck' in argv
    check = '--check' in argv or recheck
    langs = [a for a in argv if a in LOCALES] or list(LOCALES)

    import torch
    from chatterbox.tts import ChatterboxTTS
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS

    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f'device: {device}, check: {check}')
    checker = Checker() if check else None
    models = {}
    for lang in langs:
        lines = read_lines(lang)
        (OUT / lang).mkdir(parents=True, exist_ok=True)
        index = {k: i for i, k in enumerate(lines)}
        todo = []
        for key, text in lines.items():
            path = OUT / lang / f'{key}.mp3'
            if force or not path.exists():
                todo.append((key, text))
            elif recheck:
                s = checker.score(path, text, lang)
                sec = duration(path)
                print(f'  {lang} {key}: match {s:.2f}, {sec:.1f}s', flush=True)
                if s < MIN_MATCH or sec > MAX_SEC:
                    todo.append((key, text))
        print(f'{lang}: {len(lines)} lines, {len(todo)} to generate', flush=True)
        if todo and lang not in models:
            models[lang] = ChatterboxTTS.from_pretrained(device=device) if lang == 'en' else ChatterboxMultilingualTTS.from_pretrained(device=device)
        model = models.get(lang)
        for key, text in todo:
            with tempfile.TemporaryDirectory() as tmp:
                mp3, s, sec = best_clip(model, lang, key, text, index[key], model.sr, checker, tmp)
                (OUT / lang / f'{key}.mp3').write_bytes(mp3.read_bytes())
            note = f', match {s:.2f}' if s is not None else ''
            print(f'  {key}  {sec:.1f}s{note}', flush=True)

    total = 0
    for lang in LOCALES:
        size = sum(p.stat().st_size for p in (OUT / lang).glob('*.mp3')) if (OUT / lang).exists() else 0
        total += size
        print(f'{lang}: {size / 1e6:.2f} MB')
        if size / 1e6 > BUDGET_MB:
            print(f'  over the {BUDGET_MB} MB budget for {lang}', file=sys.stderr)
    print(f'total: {total / 1e6:.2f} MB (budget 20 MB)')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
