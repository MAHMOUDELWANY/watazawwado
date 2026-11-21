# Builds each reel's voice track from the English and Fusha takes (one take each, cut on the aligned word times,
# long pauses shortened) and writes <id>.timeline.json: every spoken word with its time in the new track.
# Run: python assemble.py   (needs ffmpeg; inputs in vo/, transcripts in vo/*.words.json)
import json, subprocess, pathlib
HERE = pathlib.Path(__file__).parent
VO = HERE / 'vo'
words = {k: [w for w in json.load(open(VO / f'{k}.words.json', encoding='utf-8'))['words'] if not w['text'].startswith('[') and not w['text'].endswith(']')] for k in ('v7-en', 'v9-en', 'v12-en', 'ar')}

# (source, start, end, gap after) — start/end are word times from the alignment
PIECES = {
    'v7': [('v7-en', 0.2, 3.16, .35), ('ar', 0, .56, .2), ('v7-en', 4.16, 5.63, .35), ('ar', 1.92, 2.56, .2), ('v7-en', 6.48, 8.06, .3),
           ('v7-en', 8.8, 12.84, .3), ('v7-en', 13.76, 17.11, .15), ('ar', 3.52, 3.92, .3), ('v7-en', 18.05, 22.54, .15), ('ar', 4.84, 5.4, .35),
           ('v7-en', 23.28, 24.02, .25), ('ar', 6.32, 7.95, .3), ('v7-en', 24.8, 25.7, .3), ('v7-en', 26.64, 28.8, .5), ('ar', 8.88, 9.4, .4),
           ('v7-en', 29.52, 31.68, .25), ('v7-en', 32.2, 33.12, .6)],
    'v9': [('v9-en', .16, 3.08, .3), ('v9-en', 3.76, 9.52, .3), ('v9-en', 9.84, 15.04, .2), ('v9-en', 15.28, 17.96, .4), ('v9-en', 19.41, 21.76, .4),
           ('ar', 10.4, 16.72, .5), ('v9-en', 22.88, 29.96, .4), ('v9-en', 30.96, 35.76, .4), ('v9-en', 36.67, 39.52, .4), ('v9-en', 40.36, 41.12, .6)],
    'v12': [('v12-en', .16, 4.6, .3), ('v12-en', 4.99, 9.36, .35), ('v12-en', 10.08, 17.36, .35), ('v12-en', 18.4, 22.6, .35),
            ('v12-en', 23.61, 29.87, .4), ('v12-en', 30.64, 35.04, .3), ('v12-en', 35.36, 38.88, .6)],
}
PRE, POST = .04, .1
for vid, pieces in PIECES.items():
    t, parts, tl = .15, [], []
    for i, (src, a, b, gap) in enumerate(pieces):
        a0, b0 = max(0, a - PRE), b + POST
        parts.append((src, a0, b0, gap))
        for w in words[src]:
            if w['start'] >= a - .02 and w['end'] <= b + .05:
                tl.append({'p': i, 'w': w['text'], 's': round(t + w['start'] - a0, 3), 'e': round(t + w['end'] - a0, 3)})
        tl.append({'p': i, 'piece_start': round(t, 3)})
        t += (b0 - a0) + gap
    # concat with ffmpeg: lead-in silence, each slice, silence gap
    inputs, filt, n = [], [], 0
    filt.append(f'anullsrc=r=44100:cl=mono,atrim=0:0.15[s0]'); labels = ['[s0]']
    for k, (src, a0, b0, gap) in enumerate(parts):
        inputs += ['-i', str(VO / f'{src}.mp3')]
        filt.append(f'[{n}:a]atrim={a0}:{b0},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=mono,afade=t=in:d=0.02,afade=t=out:st={b0-a0-0.03}:d=0.03[c{k}]')
        filt.append(f'anullsrc=r=44100:cl=mono,atrim=0:{gap}[g{k}]')
        labels += [f'[c{k}]', f'[g{k}]']; n += 1
    filt.append(''.join(labels) + f'concat=n={len(labels)}:v=0:a=1,loudnorm=I=-15:TP=-1.5:LRA=7[out]')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', ';'.join(filt), '-map', '[out]', '-ar', '48000', str(HERE / f'{vid}.voice.wav')], check=True)
    json.dump({'length': round(t, 3), 'words': tl}, open(HERE / f'{vid}.timeline.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(vid, round(t, 2), 's')
