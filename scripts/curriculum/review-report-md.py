# Markdown copy of the owner's Arabic review report, so the report lives in git and any session can read it.
# usage: python scripts/curriculum/review-report-md.py <report.html> <out.md>
# Keeps headings, paragraphs, lists, tables, code and links; drops scripts, styles and embedded images (a line
# "لقطة الدليل" stays where a screenshot was, so the reader knows the page has one).
import html, re, sys
from html.parser import HTMLParser

src, out = sys.argv[1:3]


class MD(HTMLParser):
    BLOCK = {'p', 'div', 'section', 'article', 'header', 'footer', 'details', 'summary', 'figure', 'figcaption', 'li', 'tr', 'br', 'hr'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.skip, self.row, self.rows_done, self.list_depth, self.href = [], 0, None, 0, 0, None

    def nl(self, n=1):
        text = ''.join(self.out)
        if not text.endswith('\n' * n):
            self.out.append('\n' * (n - (len(text) - len(text.rstrip('\n')))))

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('script', 'style', 'svg', 'head'):
            self.skip += 1
            return
        if self.skip:
            return
        if re.fullmatch(r'h[1-6]', tag):
            self.nl(2)
            self.out.append('#' * int(tag[1]) + ' ')
        elif tag == 'img':
            self.nl(2)
            self.out.append(a.get('alt') or 'لقطة الدليل')
            self.nl(2)
        elif tag in ('ul', 'ol'):
            self.list_depth += 1
            self.nl(2)
        elif tag == 'li':
            self.nl()
            self.out.append('  ' * (self.list_depth - 1) + '- ')
        elif tag == 'tr':
            self.nl()
            self.row = []
        elif tag in ('td', 'th') and self.row is not None:
            self.row.append('')
        elif tag == 'code':
            self.out.append('`')
        elif tag in ('strong', 'b'):
            self.out.append('**')
        elif tag == 'a':
            self.href = a.get('href')
        elif tag in self.BLOCK:
            self.nl(2)

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'svg', 'head'):
            self.skip = max(0, self.skip - 1)
            return
        if self.skip:
            return
        if re.fullmatch(r'h[1-6]', tag):
            self.nl(2)
        elif tag in ('ul', 'ol'):
            self.list_depth = max(0, self.list_depth - 1)
            self.nl(2)
        elif tag == 'tr' and self.row is not None:
            cells = [c.strip().replace('|', '\\|') for c in self.row]
            self.out.append('| ' + ' | '.join(cells) + ' |')
            if self.rows_done == 0:
                self.out.append('\n| ' + ' | '.join('---' for _ in cells) + ' |')
            self.rows_done += 1
            self.row = None
            self.nl()
        elif tag == 'table':
            self.rows_done = 0
            self.nl(2)
        elif tag == 'code':
            self.out.append('`')
        elif tag in ('strong', 'b'):
            self.out.append('**')
        elif tag == 'a':
            self.href = None
        elif tag in self.BLOCK:
            self.nl(2)

    def handle_data(self, data):
        if self.skip:
            return
        text = re.sub(r'\s+', ' ', data)
        if self.row is not None and self.row:
            self.row[-1] += text
        elif text.strip() or (self.out and not self.out[-1].endswith('\n')):
            self.out.append(text)


p = MD()
p.feed(open(src, encoding='utf8').read())
md = re.sub(r'[ \t]+\n', '\n', ''.join(p.out))
md = re.sub(r'\n{3,}', '\n\n', md).strip() + '\n'
open(out, 'w', encoding='utf8').write(html.unescape(md))
print(f'{out}: {len(md.splitlines())} lines')
