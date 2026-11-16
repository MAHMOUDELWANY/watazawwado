"""Generate curriculum images with Meshy text-to-image and save them as WebP.

Usage: python scripts/curriculum/meshy-images.py <prompts.json> <raw_dir> [file-filter ...]
Submits every image (or those whose `file` contains a filter), waits, downloads the PNG to <raw_dir>,
then writes public/curriculum/<file>.webp (banners 1000x1000, landmarks 480x480).
Already-converted files are skipped, so a rerun only makes what is missing.
"""
import json, os, subprocess, sys, glob, shutil
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

MESHY = ['npm', 'exec', '--yes', '--package=meshy-cli@0.4.0', '--', 'meshy']
FLAGS = ['--output-schema', 'v1', '--format', 'json', '--no-update-check']
SIZE = {'banners': 1000, 'landmarks': 480}


def run(args):
    out = subprocess.run(MESHY + args + FLAGS, capture_output=True, text=True, encoding='utf8', shell=os.name == 'nt')
    try:
        return json.loads(out.stdout)
    except Exception:
        raise RuntimeError(out.stdout[-800:] + out.stderr[-800:])


def make(item, looks, rules, raw):
    name = item['file']
    dest = f'public/curriculum/{name}.webp'
    if os.path.exists(dest) and '--force' not in sys.argv:
        return name, 'exists', 0
    prompt = f"Square image. {looks[item['look']]} {item['prompt']} {rules}"
    tid = item.get('task')
    if not tid:
        r = run(['text-to-image', 'create', '--ai-model', 'nano-banana-pro', '--prompt', prompt, '--aspect-ratio', '1:1', '--async'])
        if not r.get('ok'):
            return name, f"create failed: {r.get('error')}", 0
        res = r['result']
        tid = res.get('task_id') or res.get('id') or (res.get('task') or {}).get('task_id') or (res.get('task') or {}).get('id')
        print(f'{name}: submitted {tid}', flush=True)
    w = run(['text-to-image', 'wait', tid, '--timeout', '600'])
    if not w.get('ok'):
        return name, f'wait failed {tid}: {w.get("error")}', 0
    task = w['result'].get('task') or w['result']
    credits = task.get('consumed_credits', 0)
    folder = os.path.join(raw, name.replace('/', '__'))
    os.makedirs(folder, exist_ok=True)
    d = run(['download', '--resource', 'text-to-image', '--task-id', tid, '--kind', 'image', '--output-dir', folder, '--overwrite'])
    pngs = sorted((f for f in glob.glob(folder + '/**/*', recursive=True) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))), key=os.path.getmtime, reverse=True)
    if not pngs:
        return name, f'download failed {tid}: {json.dumps(d)[:300]}', credits
    s = SIZE[name.split('/')[0]]
    Image.open(pngs[0]).convert('RGB').resize((s, s), Image.LANCZOS).save(dest, 'WEBP', quality=86, method=6)
    return name, f'ok {tid}', credits


def main():
    spec = json.load(open(sys.argv[1], encoding='utf8'))
    raw = sys.argv[2]
    filters = [a for a in sys.argv[3:] if not a.startswith('--')]
    items = [i for i in spec['images'] if not filters or any(f in i['file'] for f in filters)]
    total = 0
    with ThreadPoolExecutor(6) as ex:
        for name, status, c in ex.map(lambda i: make(i, spec['looks'], spec['_rules'], raw), items):
            total += c or 0
            print(f'{name}: {status} ({c} cr)', flush=True)
    print('credits used:', total)


if __name__ == '__main__':
    main()
