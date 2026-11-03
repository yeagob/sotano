import subprocess, sys, json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')
lang = sys.argv[1]
FR = 'cap-' + lang
starts = [0.3, 3.3, 6.4, 12.3, 18.4, 23.6]
title = {'en': ('THE ROOTS', 'Go deeper.'), 'es': ('THE ROOTS', 'Ve más hondo.')}[lang]
lines = json.load(open(f'lines-{lang}.json'))
def dur(f): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]).decode())
durs = [dur(f'vo-{lang}-{i}.wav') for i in range(6)]
t = 0; starts2 = []
for s, d in zip(starts, durs):
    t = max(s, t); starts2.append(t); t += d + 0.25
end = max(starts2[-1] + durs[-1] + 0.8, 26.0)
def ts(x): h=int(x//3600); m=int(x%3600//60); s=x%60; return f"{h:02d}:{m:02d}:{s:06.3f}".replace('.',',')
with open(f'berserker-{lang}.srt','w') as f:
    for i,(s,d,l) in enumerate(list(zip(starts2,durs,lines))[:5]): f.write(f"{i+1}\n{ts(s)} --> {ts(s+d)}\n{l}\n\n")
vo_in = sum([['-i', f'vo-{lang}-{i}.wav'] for i in range(6)], [])
mix = ''.join(f"[{i+2}:a]adelay={int(s*1000)}|{int(s*1000)},aformat=channel_layouts=stereo[a{i}];" for i,s in enumerate(starts2))
mix += ''.join(f'[a{i}]' for i in range(6)) + f"amix=inputs=6:normalize=0,apad,atrim=0:{end},loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[aout]"
gameT = 690/30
font = '/usr/share/fonts/opentype/inter/Inter-Bold.otf'
def render(w, h, out, crop):
    vf = (f"[0:v]fps=30,{crop},scale={w}:{h},setsar=1,format=yuv420p[g];"
          f"[1:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},eq=brightness=-0.1,"
          f"drawtext=fontfile={font}:text='{title[1]}':fontcolor=0xF2C14E:box=1:boxcolor=0x0E0B10@0.6:boxborderw=12:fontsize={int(h*0.05)}:x=(w-tw)/2:y=h*0.72,"
          f"drawtext=fontfile={font}:text='github.com/yeagob/sotano':fontcolor=0xC4B8A3:box=1:boxcolor=0x0E0B10@0.6:boxborderw=8:fontsize={int(h*0.03)}:x=(w-tw)/2:y=h*0.80,"
          f"trim=0:{end-gameT},setpts=PTS-STARTPTS,fps=30,format=yuv420p,setsar=1[t];"
          f"[g][t]concat=n=2:v=1:a=0,subtitles=berserker-{lang}.srt:force_style='Fontname=Inter,Fontsize={9 if h>w else 14},PrimaryColour=&H00D0E4ED,BackColour=&HC010110E,BorderStyle=4,Outline=0,Shadow=0,MarginV={70 if h>w else 30}'[v];")
    subprocess.check_call(['ffmpeg','-loglevel','error','-y','-framerate','30','-i',f'{FR}/f%05d.png','-loop','1','-framerate','30','-i',os.path.join(ROOT, 'public', 'the-roots-cover.jpg'),*vo_in,
        '-filter_complex', vf + mix, '-map','[v]','-map','[aout]','-c:v','libx264','-profile:v','high','-pix_fmt','yuv420p','-crf','19','-preset','medium',
        '-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart','-t',f'{end:.2f}', out])
render(1920, 1080, f'out/berserker-youtube-{lang}.mp4', 'null')
render(1080, 1920, f'out/berserker-shorts-{lang}.mp4', 'crop=ih*9/16:ih')
os.makedirs('out', exist_ok=True)
subprocess.check_call(['cp', f'out/berserker-youtube-{lang}.mp4', f'out/berserker-x-{lang}.mp4'])
subprocess.check_call(['cp', f'berserker-{lang}.srt', f'out/berserker-{lang}.srt'])
print('ok', lang, end)
