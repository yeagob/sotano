import sys, torchaudio as ta, torch
lang = sys.argv[1]
lines = {
 'en': [
  "Deep in the roots, a heart beats faster than the rest.",
  "The berserker heart. One more heart, and a fire you carry.",
  "Stronger. Faster. Higher. Loose stone breaks under your feet.",
  "Your intentions reach less, so you fight up close. And what they throw at you, comes back.",
  "Hold it as long as you can. When it breaks, the fire goes out.",
  "The Roots. Go deeper.",
 ],
 'es': [
  "En lo hondo de las raíces, un corazón late más rápido que los demás.",
  "El corazón berserker. Un corazón más, y un fuego que llevas dentro.",
  "Más fuerte. Más rápido. Más alto. La piedra suelta se rompe bajo tus pies.",
  "Tus intenciones llegan menos lejos: luchas de cerca. Y lo que te lanzan, vuelve.",
  "Aguántalo todo lo que puedas. Cuando se rompe, el fuego se apaga.",
  "Di Ruts. Ve más hondo.",
 ],
}[lang]
torch.manual_seed(7)
if lang == 'en':
    from chatterbox.tts import ChatterboxTTS
    m = ChatterboxTTS.from_pretrained(device='cpu')
    gen = lambda t: m.generate(t, exaggeration=0.6, cfg_weight=0.4)
else:
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    m = ChatterboxMultilingualTTS.from_pretrained(device='cpu')
    gen = lambda t: m.generate(t, language_id='es', exaggeration=0.6, cfg_weight=0.4)
import json, whisper
json.dump(lines, open(f'lines-{lang}.json', 'w'), ensure_ascii=False)
w = whisper.load_model('base')
for i, t in enumerate(lines):
    last = t.rstrip('.').split()[-1].lower()[-4:]
    best = None
    for seed in [7, 101, 202, 303, 404, 505]:
        torch.manual_seed(seed)
        wav = gen(t)
        ta.save('cand.wav', wav, m.sr)
        r = w.transcribe('cand.wav', language=lang, word_timestamps=True)
        words = [x for s in r['segments'] for x in s['words']]
        idx = [k for k, x in enumerate(words) if last in x['word'].lower()]
        if not idx: continue
        k = idx[0]
        cut = min(words[k]['end'] + 0.3, words[k + 1]['start'] if k + 1 < len(words) else 99)
        if best is None or abs(k + 1 - len(t.split())) < abs(best[1] - len(t.split())): best = (wav[:, :int(cut * m.sr)], k + 1)
        if k + 1 == len(t.split()): break
    ta.save(f'vo-{lang}-{i}.wav', (best or (gen(t), 0))[0], m.sr)
    print('done', i, r['text'], flush=True)
