import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// QA-02: static checks that keep the keyboard and screen-reader fixes from regressing.

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...tsxFiles(p));
    else if (p.endsWith('.tsx') && !p.endsWith('.test.tsx')) out.push(p);
  }
  return out;
}

/** The full JSX opening tag starting at a line (tags span lines, and `=>` inside props contains a `>`). */
function tagAt(lines: string[], i: number): string {
  const parts: string[] = [];
  for (let j = i; j < Math.min(i + 30, lines.length); j++) {
    parts.push(lines[j]);
    if (/\/>/.test(lines[j]) || /<\/(textarea|select|Select|Textarea)>/.test(lines[j])) break;
  }
  return parts.join(' ');
}

describe('QA-02 accessibility', () => {
  it('every text field has a name: a wrapping <label>, a label htmlFor its id, aria-label or aria-labelledby', () => {
    const missing: string[] = [];
    for (const f of tsxFiles('src')) {
      const src = fs.readFileSync(f, 'utf8');
      const lines = src.split(/\r?\n/);
      lines.forEach((line, i) => {
        const m = line.match(/<(input|select|textarea|Input|Select|Textarea)\b/);
        if (!m) return;
        const tag = tagAt(lines, i);
        if (/type=["'](hidden|checkbox|radio|file|submit|button)["']/.test(tag)) return;
        if (/aria-label(ledby)?=/.test(tag) || /\blabel=/.test(tag)) return;
        // Shared wrappers (ui/Input, Select, Textarea) pass the caller's label props through.
        if (/\{\.\.\.(props|rest)\}/.test(tag)) return;
        const id = tag.match(/\bid=(?:"([^"]+)"|\{`([^`]+)`\}|\{([^}]+)\})/);
        if (id) {
          const value = id[1] || id[2] || id[3];
          if (src.includes(`htmlFor="${value}"`) || src.includes(`htmlFor={\`${value}\`}`) || src.includes(`htmlFor={${value}}`)) return;
        }
        const before = lines.slice(Math.max(0, i - 12), i).join('\n');
        if (before.lastIndexOf('<label') > before.lastIndexOf('</label>')) return;
        // The field is passed to a wrapper that renders the label (e.g. PassField htmlFor=...).
        if (/htmlFor=/.test(lines.slice(Math.max(0, i - 4), i).join('\n'))) return;
        missing.push(`${f}:${i + 1}`);
      });
    }
    assert.deepStrictEqual(missing, []);
  });

  it('every role="dialog" keeps focus inside (FocusTrap or the shared Modal)', () => {
    const bad = tsxFiles('src').filter((f) => {
      const s = fs.readFileSync(f, 'utf8');
      return /role="dialog"/.test(s) && !/FocusTrap/.test(s);
    });
    assert.deepStrictEqual(bad, []);
  });

  it('FocusTrap moves focus in, wraps Tab, handles Escape and returns focus to the opener', () => {
    const s = fs.readFileSync('src/components/FocusTrap.tsx', 'utf8');
    assert.ok(s.includes("document.addEventListener('keydown', handleKeyDown, true)"), 'listens even when focus is outside');
    assert.ok(s.includes("e.key === 'Escape' && onEscapeRef.current"));
    assert.ok(s.includes('opener.focus()'), 'restores focus on close');
    assert.ok(/const items = focusables\(\);/.test(s), 'recomputes focusable elements on every Tab');
  });

  it('dialogs over a page do not add a second h1', () => {
    for (const f of ['src/components/GetStartedModal.tsx', 'src/components/StudentAuthModal.tsx']) {
      assert.match(fs.readFileSync(f, 'utf8'), /heading="h2"/, f);
    }
  });

  it('the theme toggle no longer renders a duplicate id', () => {
    assert.ok(!fs.readFileSync('src/components/ui/ThemeToggle.tsx', 'utf8').includes('id="theme-toggle-btn"'));
  });
});
