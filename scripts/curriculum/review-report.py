# Builds the owner's Arabic review page (one HTML file) for the curriculum-review skill.
# usage: python scripts/curriculum/review-report.py <packFolderDir> <out.html>
#   <packFolderDir>/chair.json            {"title","subtitle","date","scope","summary":[..],"top":[{"lesson":1,"id":".."}],
#                                          "course":[{"title","body"}],"lessons":{"1":{"verdict_line","notes"}},"not_run":[..]}
#   <packFolderDir>/L<n>/findings.json    from review-merge.py
#   <packFolderDir>/L<n>/findings-ar.json Arabic text per finding id (+ image, crop)
import base64, html, io, json, os, re, sys
from PIL import Image

root, out = sys.argv[1:3]
chair = json.load(open(os.path.join(root, 'chair.json'), encoding='utf8'))
E = html.escape
def T(v):  # Arabic prose with English quotes and file names: isolate each so the line keeps its right-to-left order
    v = E(v)
    v = re.sub(r'`([^`]+)`', lambda m: f'<code>{m.group(1)}</code>', v)
    return re.sub(r'«([^»]*[A-Za-z][^»]*)»', lambda m: f'«<bdi dir="ltr" class="en">{m.group(1)}</bdi>»', v)
SEV = {'blocker': 'مانع للإطلاق', 'major': 'كبير', 'minor': 'صغير', 'polish': 'تحسين', 'rule-challenge': 'اعتراض على قاعدة'}
ORDER = list(SEV)
EXPERT = {'subject-scholar': 'عالم المادة', 'sources-copyright': 'فاحص المصادر والحقوق', 'curriculum-designer': 'مصمم المناهج',
          'learning-scientist': 'عالم التعلّم', 'age-band': 'متخصص الفئة العمرية', 'story-editor': 'محرر القصة والنص',
          'art-director': 'المدير الفني', 'motion-defects': 'مختبر الحركة والأعطال', 'teacher-parent': 'المدرّس ووليّ الأمر'}
AREA = {'Content correctness': 'صحة المحتوى', 'Pedagogy': 'طريقة التعليم', 'Story and writing': 'القصة والكتابة',
        'Visual design': 'التصميم البصري', 'Age fit': 'مناسبة السن', 'Motion and defects': 'الحركة والأعطال', 'Teachability': 'قابلية التدريس'}
VERDICT = {'Needs fixes': 'محتاج إصلاح', 'Ready to launch': 'جاهز للإطلاق', 'Rebuild': 'يُعاد بناؤه'}

def img(lesson_dir, a):
    if not a.get('image'): return ''
    p = os.path.join(lesson_dir, a['image'])
    if not os.path.exists(p): return ''
    im = Image.open(p).convert('RGB')
    if a.get('crop'):
        x0, y0, x1, y1 = a['crop']; im = im.crop((max(0, x0), max(0, y0), min(im.width, x1), min(im.height, y1)))
    if im.width > 900: im = im.resize((900, round(im.height * 900 / im.width)))
    b = io.BytesIO(); im.save(b, 'JPEG', quality=62, optimize=True)
    return f'<img loading="lazy" alt="لقطة الدليل" src="data:image/jpeg;base64,{base64.b64encode(b.getvalue()).decode()}">'

def card(lesson, lesson_dir, f, a):
    sev = f['severity']
    meta = [f'<span class="sev sev-{sev}">{SEV[sev]}</span>', f'<code>{E(f["id"])}</code>', f'<span>{EXPERT.get(f["expert"], "لجنة المادة")}</span>']
    extra = []
    if f.get('raised_as') and f['raised_as'] != sev: extra.append(f'خفّضه المراجع المضاد من «{SEV[f["raised_as"]]}»')
    if f.get('also_raised_by'): extra.append('أثاره أيضًا: ' + '، '.join(EXPERT.get(x.rsplit('-', 1)[0], x) for x in f['also_raised_by']))
    rows = [('العيب', a.get('problem')), ('الدليل', a.get('evidence')), ('ليه ده عيب', a.get('why')), ('الإصلاح', a.get('fix'))]
    body = ''.join(f'<div class="row"><dt>{k}</dt><dd>{T(v)}</dd></div>' for k, v in rows if v)
    return (f'<article class="card c-{sev}" id="L{lesson}-{E(f["id"])}"><header><div class="meta">{"".join(meta)}</div>'
            f'<h4>{E(a.get("title") or f["id"])}</h4><p class="where">{"المادة" if lesson == "course" else "الدرس " + lesson} · {T(a.get("where") or f["where"])}</p></header>'
            f'{img(lesson_dir, a)}<dl>{body}</dl>' + (f'<p class="note">{" · ".join(E(x) for x in extra)}</p>' if extra else '') + '</article>')

lessons, cards = {}, {}
for key in sorted(chair['lessons'], key=int):
    d = os.path.join(root, f'L{key}')
    data = json.load(open(os.path.join(d, 'findings.json'), encoding='utf8'))
    ar = json.load(open(os.path.join(d, 'findings-ar.json'), encoding='utf8'))
    extra = os.path.join(root, 'extra-ar.json')  # chair's Arabic for findings added after the translation pass
    if os.path.exists(extra): ar['findings'].update(json.load(open(extra, encoding='utf8')).get(key, {}))
    missing = [f['id'] for f in data['findings'] if f['id'] not in ar['findings']]
    if missing: sys.exit(f'L{key}: no Arabic text for {missing}')
    lessons[key] = (d, data, ar)
    for f in data['findings']:
        cards[(key, f['id'])] = card(key, d, f, ar['findings'].get(f['id'], {}))

h = []
h.append(f'''<title>{E(chair["title"])}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;700&family=Noto+Kufi+Arabic:wght@600;800&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
/* Examiner's dossier: one narrow reading column, verdict first, findings as evidence cards ranked by severity. */
:root {{
  --paper:#FBF7F1; --ink:#2A1A14; --muted:#7A6257; --line:#E6D9CC; --card:#FFFFFF;
  --crimson:#B81E25; --copper:#8B4935; --gold:#C98A1E; --teal:#0B6F80; --sand:#EFE3D2;
  --display:"Noto Kufi Arabic", "IBM Plex Sans Arabic", Tahoma, sans-serif;
  --body:"IBM Plex Sans Arabic", "Segoe UI", Tahoma, sans-serif; --mono:"IBM Plex Mono", Consolas, monospace;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --paper:#1A120E; --ink:#F3E9DE; --muted:#B9A293; --line:#3A2A22; --card:#231915; --crimson:#E2474D; --copper:#C98266; --gold:#E5A93C; --teal:#3FA9BA; --sand:#2E211B; color-scheme:dark }} }}
:root[data-theme="dark"] {{ --paper:#1A120E; --ink:#F3E9DE; --muted:#B9A293; --line:#3A2A22; --card:#231915; --crimson:#E2474D; --copper:#C98266; --gold:#E5A93C; --teal:#3FA9BA; --sand:#2E211B; color-scheme:dark }}
body {{ background:var(--paper); color:var(--ink); font:16px/1.75 var(--body); }}
main {{ max-width:860px; margin:0 auto; padding-block:28px 64px; padding-left:max(16px, env(safe-area-inset-left, 0px)); padding-right:max(16px, env(safe-area-inset-right, 0px)); display:grid; grid-template-columns:minmax(0,1fr); gap:28px; }}
h1,h2,h3 {{ font-family:var(--display); line-height:1.35; text-wrap:balance; margin:0; }}
h1 {{ font-size:clamp(1.6rem,4.5vw,2.3rem); }} h2 {{ font-size:1.35rem; border-bottom:2px solid var(--crimson); padding-bottom:6px; }} h3 {{ font-size:1.1rem; }}
.eyebrow {{ color:var(--copper); font-weight:700; letter-spacing:.02em; margin:0 0 6px; }}
.sub, .muted {{ color:var(--muted); }} p {{ margin:0; }}
section {{ display:grid; gap:14px; min-width:0; }}
.verdicts {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:12px; }}
.verdict {{ background:var(--card); border:1px solid var(--line); border-radius:10px; padding:16px; display:grid; gap:6px; }}
.verdict .big {{ font-family:var(--display); font-size:1.5rem; color:var(--crimson); }}
.verdict .score {{ font-size:2.2rem; font-weight:700; font-variant-numeric:tabular-nums; line-height:1; }}
.verdict .score small {{ font-size:1rem; color:var(--muted); font-weight:500; }}
.counts {{ display:flex; flex-wrap:wrap; gap:6px; }}
.sev {{ display:inline-block; font-size:.78rem; font-weight:700; padding:1px 9px; border-radius:99px; border:1px solid currentColor; }}
.sev-blocker {{ color:#fff; background:var(--crimson); border-color:var(--crimson); }} .sev-major {{ color:var(--crimson); }}
.sev-minor {{ color:var(--copper); }} .sev-polish {{ color:var(--muted); }} .sev-rule-challenge {{ color:var(--teal); }}
.scroll {{ overflow-x:auto; }} table {{ border-collapse:collapse; width:100%; font-variant-numeric:tabular-nums; }}
th,td {{ border-bottom:1px solid var(--line); padding:7px 8px; text-align:start; vertical-align:top; min-width:6.5em; }} th {{ color:var(--muted); font-weight:500; }}
.bar {{ display:inline-block; height:8px; border-radius:4px; background:var(--gold); vertical-align:middle; }}
ul,ol {{ margin:0; padding-inline-start:1.3em; display:grid; gap:6px; }}
.card {{ background:var(--card); border:1px solid var(--line); border-inline-start:4px solid var(--line); border-radius:8px; padding:14px 16px; display:grid; gap:10px; min-width:0; }}
.c-blocker,.c-major {{ border-inline-start-color:var(--crimson); }} .c-minor {{ border-inline-start-color:var(--copper); }} .c-rule-challenge {{ border-inline-start-color:var(--teal); }}
.card header {{ display:grid; gap:4px; }} .meta {{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; font-size:.85rem; color:var(--muted); }}
.card h4 {{ margin:0; font-size:1.05rem; font-family:var(--display); font-weight:600; }}
.where {{ font-size:.88rem; color:var(--muted); }}
code {{ font-family:var(--mono); font-size:.78rem; direction:ltr; unicode-bidi:isolate; background:var(--sand); padding:1px 6px; border-radius:4px; }}
.card img {{ width:100%; border-radius:6px; border:1px solid var(--line); }}
dl {{ margin:0; display:grid; gap:8px; }} .row {{ display:grid; gap:2px; }} dt {{ font-weight:700; font-size:.85rem; color:var(--copper); }} dd {{ margin:0; overflow-wrap:anywhere; }}
bdi.en {{ font-family:var(--body); }}
.note {{ font-size:.85rem; color:var(--teal); }}
details {{ border:1px solid var(--line); border-radius:10px; background:var(--card); }}
details > summary {{ cursor:pointer; padding:14px 16px; font-family:var(--display); font-weight:600; list-style-position:inside; }}
details > .inner {{ padding:0 16px 16px; display:grid; gap:14px; }}
details details {{ background:var(--paper); }}
summary:focus-visible, a:focus-visible {{ outline:2px solid var(--gold); outline-offset:2px; }}
a {{ color:var(--teal); }}
.callout {{ background:var(--sand); border-radius:8px; padding:12px 14px; }}
@media (prefers-reduced-motion: reduce) {{ * {{ scroll-behavior:auto !important; }} }}
</style>
<main dir="rtl" lang="ar">
<header style="display:grid;gap:8px"><p class="eyebrow">{E(chair["subtitle"])}</p><h1>{E(chair["title"])}</h1>
<p class="sub">{E(chair["date"])} · {E(chair["scope"])}</p></header>''')

h.append('<section><h2>الحكم</h2><div class="verdicts">')
for key, (d, data, ar) in lessons.items():
    c = data['counts']
    h.append(f'<div class="verdict"><h3>الدرس {key}</h3><div class="big">{VERDICT[data["verdict"]]}</div>'
             f'<div class="score">{data["score"]}<small> / 100</small></div>'
             f'<div class="counts">' + ''.join(f'<span class="sev sev-{s}">{SEV[s]} {c[s]}</span>' for s in ORDER if c[s]) + '</div>'
             f'<p>{E(chair["lessons"][key]["verdict_line"])}</p></div>')
h.append('</div>' + ''.join(f'<p>{E(x)}</p>' for x in chair['summary']) + '</section>')

h.append('<section><h2>أهم ما يجب إصلاحه</h2><p class="muted">مرتبة بالأولوية عبر الدرسين. كل بطاقة كاملة بدليلها، والباقي داخل قسم كل درس.</p>')
h += [cards[(str(t['lesson']), t['id'])] for t in chair['top'] if (str(t['lesson']), t['id']) in cards]
h.append('</section>')

cpath = os.path.join(root, 'course-ar.json')
if os.path.exists(cpath):  # course panel: accumulation across lessons
    c = json.load(open(cpath, encoding='utf8'))
    tbl = lambda rows: '<div class="scroll"><table><thead><tr>' + ''.join(f'<th>{E(x)}</th>' for x in rows[0]) + '</tr></thead><tbody>' + ''.join('<tr>' + ''.join(f'<td>{T(x)}</td>' for x in r) + '</tr>' for r in rows[1:]) + '</tbody></table></div>'
    lst = lambda xs: '<ul>' + ''.join(f'<li>{T(x)}</li>' for x in xs) + '</ul>'
    h.append(f'<section><h2>التراكم: هل الدروس تبني على بعض؟</h2><div class="callout"><h3>{E(c["verdict_title"])}</h3><p>{T(c["verdict"])}</p></div>')
    fs = sorted(c['findings'].items(), key=lambda kv: (ORDER.index(kv[1]['severity']), int(kv[0].split('-')[1])))
    h += [card('course', root, {'id': k, 'severity': v['severity'], 'expert': 'course', 'where': ''}, v) for k, v in fs if v['severity'] in ('blocker', 'major')]
    rest = [card('course', root, {'id': k, 'severity': v['severity'], 'expert': 'course', 'where': ''}, v) for k, v in fs if v['severity'] not in ('blocker', 'major')]
    h.append(f'<details><summary>باقي ملاحظات المادة ({len(rest)})</summary><div class="inner">' + ''.join(rest) + '</div></details>')
    h.append('<details><summary>جدول الروابط بين الدروس</summary><div class="inner">' + tbl(c['ledger_rows']) + f'<p>{T(c["ledger_totals"])}</p><h3>روابط كان يجب أن توجد ولا توجد</h3>' + lst(c['missing']) + '<h3>الخيوط</h3>' + tbl(c['threads']) + '</div></details>')
    d = c['design']
    h.append('<details open><summary>أصغر مجموعة تغييرات تجعل الدروس تراكمية</summary><div class="inner">' + ''.join(f'<h3>الدرس {k[1]}</h3>' + lst(d[k]) for k in ('L1', 'L2', 'L3') if d.get(k)) + '<h3>قاعدة الشبكة لكل درس قادم</h3>' + lst(d.get('rule', [])) + '</div></details>')
    h.append('<details><summary>يُحفظ · لم يُفحص</summary><div class="inner">' + lst(c.get('keep', [])) + lst(c.get('not_checked', [])) + '</div></details></section>')
if chair.get('course'):
    h.append('<section><h2>ملاحظات الرئيس وقرارات تنتظرك</h2>' + ''.join(f'<div class="callout"><h3>{E(x["title"])}</h3><p>{T(x["body"])}</p></div>' for x in chair['course']) + '</section>')

top = {(str(t['lesson']), t['id']) for t in chair['top']}
for key, (d, data, ar) in lessons.items():
    h.append(f'<section><h2>الدرس {key} بالتفصيل</h2>')
    if chair['lessons'][key].get('notes'): h.append(''.join(f'<p>{E(x)}</p>' for x in chair['lessons'][key]['notes']))
    h.append('<div class="scroll"><table><thead><tr><th>المجال</th><th>الدرجة</th><th></th></tr></thead><tbody>')
    for area, (full, got) in data['areas'].items():
        h.append(f'<tr><td>{AREA[area]}</td><td>{got} / {full}</td><td><span class="bar" style="width:{round(120 * got / full)}px"></span></td></tr>')
    h.append(f'<tr><td>المصادر والحقوق</td><td colspan="2">{"فيها مخالفات كبيرة" if data["sources"] == "fail" else "سليمة مع ملاحظات"}</td></tr></tbody></table></div>')
    for s in ORDER:
        group = [f for f in data['findings'] if f['severity'] == s]
        if not group: continue
        open_ = ' open' if s in ('blocker', 'major') else ''
        h.append(f'<details{open_}><summary>{SEV[s]} ({len(group)})</summary><div class="inner">')
        h += [cards[(key, f['id'])] if (key, f['id']) not in top else f'<p class="muted"><a href="#L{key}-{E(f["id"])}">{E(ar["findings"].get(f["id"], {}).get("title", f["id"]))}</a> (في القائمة أعلاه)</p>' for f in group]
        h.append('</div></details>')
    if ar.get('keep'): h.append('<details><summary>يُحفظ عند الإصلاح</summary><div class="inner"><ul>' + ''.join(f'<li>{E(x)}</li>' for x in ar['keep']) + '</ul></div></details>')
    if ar.get('not_checked'): h.append('<details><summary>لم يُفحص</summary><div class="inner"><ul>' + ''.join(f'<li>{E(x)}</li>' for x in ar['not_checked']) + '</ul></div></details>')
    h.append('</section>')

h.append('<section><h2>ما لم يُنفّذ في هذه الجولة</h2><ul>' + ''.join(f'<li>{E(x)}</li>' for x in chair['not_run']) + '</ul></section>')
h.append('<section><h2>كيف ترد</h2><p>اكتب في المحادثة رقم الملاحظة وقرارك، مثل: «اقبل <code>subject-scholar-1</code>، ارفض <code>art-director-18</code> لأن…». الرفض وسببه يُسجَّلان في ملف المعايرة، والمراجعات القادمة لا تكرر ما رفضته.</p></section></main>')
open(out, 'w', encoding='utf8').write('\n'.join(h))
print(out, round(os.path.getsize(out) / 1e6, 2), 'MB')
