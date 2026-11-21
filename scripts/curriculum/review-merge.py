# Chair's merge for the curriculum-review skill: applies the refuter's verdicts to the experts' findings, folds
# duplicates, scores the lesson and writes the English record plus findings.json for the Arabic report.
# usage: python scripts/curriculum/review-merge.py <packLessonDir> <folder> <lessonNumber> <YYYY-MM-DD> [--rebuild]
import json, os, re, subprocess, sys

pack, folder, n, date = sys.argv[1:5]
rebuild = '--rebuild' in sys.argv
fdir = os.path.join(pack, 'findings')
AREAS = {  # expert -> (area, full marks); sources is pass/fail, not scored
    'subject-scholar': ('Content correctness', 25), 'curriculum-designer': ('Pedagogy', 20), 'learning-scientist': ('Pedagogy', 20),
    'story-editor': ('Story and writing', 15), 'art-director': ('Visual design', 15), 'age-band': ('Age fit', 10),
    'motion-defects': ('Motion and defects', 10), 'teacher-parent': ('Teachability', 5), 'sources-copyright': ('Sources and copyright', 0),
}
# Each surviving finding multiplies its area's score: nine experts digging this deep would zero any flat deduction.
COST = {'blocker': 0.5, 'major': 0.9, 'minor': 0.97, 'polish': 0.99, 'rule-challenge': 1}
ORDER = ['blocker', 'major', 'minor', 'polish', 'rule-challenge']

findings, extras = {}, {}
for name in sorted(os.listdir(fdir)):
    expert = name[:-3]
    if not name.endswith('.md') or expert == 'refuter': continue
    text = open(os.path.join(fdir, name), encoding='utf8').read()
    tail = re.split(r'^## (Keep|Not checked)\s*$', text, flags=re.M)
    for i in range(1, len(tail) - 1, 2): extras.setdefault(tail[i], []).append((expert, tail[i + 1].strip()))
    for m in re.finditer(r'^### (\S+) · (\S+) · (\S+)[^\n]*\n(.*?)(?=^### |^## |\Z)', tail[0], flags=re.M | re.S):
        fid, sev, conf, body = m.groups()
        who = fid.rsplit('-', 1)[0]  # lean files hold several experts: the id prefix names the brief
        f = {'id': fid, 'expert': who if who in AREAS else expert, 'severity': sev, 'confidence': conf, 'raised_as': sev}
        for key in ('where', 'evidence', 'why', 'fix'):
            k = re.search(rf'^{key}:\s*(.*?)(?=^(?:where|evidence|why|fix):|\Z)', body, flags=re.M | re.S)
            f[key] = k.group(1).strip() if k else ''
        findings[fid] = f

refuted, dupes = [], {}
rpath = os.path.join(fdir, 'refuter.md')
if os.path.exists(rpath):
    for line in open(rpath, encoding='utf8'):
        p = [x.strip() for x in line.split('|')]
        if len(p) < 3 or p[0] not in findings: continue
        f, verdict = findings[p[0]], p[1]
        f['refuter'] = p[2]
        if verdict.startswith('refuted'): refuted.append(findings.pop(p[0]))
        elif verdict.startswith('duplicate-of'): dupes.setdefault(verdict.split()[-1], []).append(findings.pop(p[0]))
        elif verdict.startswith('stands-weakened'):
            new = re.search(r'\((.*?)\)', verdict)
            if new and new.group(1) in COST: f['severity'] = new.group(1)
for target, ds in dupes.items():
    if target in findings: findings[target]['also_raised_by'] = [d['id'] for d in ds]
    else: [findings.setdefault(d['id'], d) for d in ds]  # target missing: keep them rather than lose a flaw

live = sorted(findings.values(), key=lambda f: (ORDER.index(f['severity']), f['id']))
scores = {}
for expert, (area, full) in AREAS.items():
    if full: scores.setdefault(area, [full, 1.0])
for f in live:
    area, full = AREAS[f['expert']]
    if full: scores[area][1] *= COST[f['severity']]
table = {a: (full, round(full * keep, 1)) for a, (full, keep) in scores.items()}
total = round(sum(v[1] for v in table.values()), 1)
count = {s: sum(1 for f in live if f['severity'] == s) for s in ORDER}
src = [f for f in live if f['expert'] == 'sources-copyright' and f['severity'] in ('blocker', 'major')]
sources = 'fail' if src else 'pass with notes'
verdict = 'Rebuild' if rebuild else 'Needs fixes' if count['blocker'] or count['major'] else 'Ready to launch'
commit = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], capture_output=True, text=True).stdout.strip()
short = lambda s: s.replace(pack.replace('/', '\\'), '<pack>').replace(pack, '<pack>')

out = [f'# Review: {folder} · Lesson {n} · {date}', '',
       f'Commit `{commit}`. Screenshots are not in git: `<pack>` is the scratch evidence pack of the run.', '',
       f'**Verdict: {verdict}.** Score **{total} / 100**. Blockers {count["blocker"]}, majors {count["major"]}, minors {count["minor"]}, polish {count["polish"]}, rule challenges {count["rule-challenge"]}. Sources and copyright: **{sources}**.', '',
       '| Area | Score |', '|---|---|'] + [f'| {a} | {got} / {full} |' for a, (full, got) in table.items()] + ['',
       f'Raised {len(live) + len(refuted) + sum(len(d) for d in dupes.values())}, duplicates folded {sum(len(d) for d in dupes.values())}, refuted {len(refuted)}, surviving {len(live)}.', '']
for sev in ORDER:
    group = [f for f in live if f['severity'] == sev]
    if not group: continue
    out += [f'## {sev.capitalize()} ({len(group)})', '']
    for f in group:
        out += [f'### {f["id"]} · {f["confidence"]} · status: open', f'- **where:** {short(f["where"])}', f'- **evidence:** {short(f["evidence"])}',
                f'- **why:** {short(f["why"])}', f'- **fix:** {short(f["fix"])}']
        if f['severity'] != f['raised_as']: out.append(f'- **raised as:** {f["raised_as"]}')
        if f.get('refuter'): out.append(f'- **refuter:** {short(f["refuter"])}')
        if f.get('also_raised_by'): out.append(f'- **also raised by:** {", ".join(f["also_raised_by"])}')
        out.append('')
out += ['## Refuted', ''] + ([f'- {f["id"]}: {short(f.get("refuter", ""))}' for f in refuted] or ['None.']) + ['']
for head in ('Keep', 'Not checked'):
    out += [f'## {head}', ''] + [f'**{e}**\n{short(t)}\n' for e, t in extras.get(head, [])]
dest = os.path.join('docs', 'curriculum', 'reviews', folder)
os.makedirs(dest, exist_ok=True)
path = os.path.join(dest, f'{date}-L{int(n):02d}.md')
open(path, 'w', encoding='utf8', newline='\n').write('\n'.join(out))
json.dump({'folder': folder, 'lesson': int(n), 'verdict': verdict, 'score': total, 'areas': table, 'counts': count, 'sources': sources,
           'findings': live, 'refuted': refuted, 'extras': extras}, open(os.path.join(pack, 'findings.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print(f'{path}: {verdict}, {total}/100, {count}')
