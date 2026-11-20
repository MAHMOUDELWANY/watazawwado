/**
 * Classroom 4.1: the tajweed markup of the Quran Foundation Content API, read without innerHTML.
 * Words come as `ا<rule class=madda_necessary>لٓ</rule>`; whole verses use `<tajweed class=...>` and
 * `<span class=end>`. The parser keeps the Quran text exactly as the API sent it and only notes which rule colours it.
 * The colours are content: each keeps its standard meaning (the usual tajweed-mushaf colours).
 */
export type TajweedPart = { text: string; rule: string | null };

export const TAJWEED_RULES: Record<string, { color: string; en: string; ar: string }> = {
  ham_wasl: { color: '#AAAAAA', en: 'Hamzat al-wasl', ar: 'همزة الوصل' },
  slnt: { color: '#AAAAAA', en: 'Silent letter', ar: 'حرف لا يُنطق' },
  laam_shamsiyah: { color: '#AAAAAA', en: 'Lam shamsiyyah', ar: 'اللام الشمسية' },
  madda_normal: { color: '#537FFF', en: 'Natural madd (2)', ar: 'مد طبيعي (٢)' },
  madda_permissible: { color: '#4050FF', en: 'Permissible madd (2, 4, 6)', ar: 'مد جائز (٢، ٤، ٦)' },
  madda_obligatory: { color: '#2144C1', en: 'Obligatory madd (4, 5)', ar: 'مد واجب (٤، ٥)' },
  madda_necessary: { color: '#000EBC', en: 'Necessary madd (6)', ar: 'مد لازم (٦)' },
  qalaqah: { color: '#DD0008', en: 'Qalqalah', ar: 'قلقلة' },
  ikhafa_shafawi: { color: '#D500B7', en: 'Ikhfa shafawi', ar: 'إخفاء شفوي' },
  ikhafa: { color: '#9400A8', en: 'Ikhfa', ar: 'إخفاء' },
  idgham_shafawi: { color: '#58B800', en: 'Idgham shafawi', ar: 'إدغام شفوي' },
  iqlab: { color: '#26BFFD', en: 'Iqlab', ar: 'إقلاب' },
  idgham_ghunnah: { color: '#169777', en: 'Idgham with ghunnah', ar: 'إدغام بغنة' },
  idgham_wo_ghunnah: { color: '#169200', en: 'Idgham without ghunnah', ar: 'إدغام بغير غنة' },
  idgham_mutajanisayn: { color: '#A1A1A1', en: 'Idgham mutajanisayn', ar: 'إدغام متجانسين' },
  idgham_mutaqaribayn: { color: '#A1A1A1', en: 'Idgham mutaqaribayn', ar: 'إدغام متقاربين' },
  ghunnah: { color: '#FF7E1E', en: 'Ghunnah (2)', ar: 'غنة (٢)' },
};

const TAG = /<(\/?)([a-z]+)([^>]*)>/gi;
const CLASS = /class\s*=\s*["']?([a-z_]+)/i;
const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };
const decode = (s: string) => s.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m);

/** Splits marked-up text into plain runs and coloured runs. `<span class=end>` (the ayah number) is dropped. */
export function parseTajweed(markup: string): TajweedPart[] {
  const out: TajweedPart[] = [];
  const stack: Array<string | null> = [];
  let skip = 0;
  let last = 0;
  const push = (text: string) => {
    if (!text || skip) return;
    const rule = [...stack].reverse().find((r) => r !== null) ?? null;
    const prev = out[out.length - 1];
    if (prev && prev.rule === rule) prev.text += decode(text);
    else out.push({ text: decode(text), rule });
  };
  for (const m of String(markup || '').matchAll(TAG)) {
    push(markup.slice(last, m.index));
    last = m.index! + m[0].length;
    const [, closing, tag, attrs] = m;
    const cls = CLASS.exec(attrs)?.[1]?.toLowerCase() ?? null;
    if (tag.toLowerCase() === 'span') {
      if (closing) { if (skip) skip--; } else if (cls === 'end') skip++;
      continue;
    }
    if (closing) stack.pop();
    else stack.push(cls);
  }
  push(markup.slice(last));
  return out;
}

/** The colour of one rule; null for plain text or a rule we have no colour for. */
export const ruleColor = (rule: string | null) => (rule && TAJWEED_RULES[rule]?.color) || null;

/** The rules that appear in some parts, for a legend that shows only what is on the page. */
export function rulesIn(parts: TajweedPart[][]): string[] {
  const seen = new Set<string>();
  for (const p of parts) for (const x of p) if (x.rule && TAJWEED_RULES[x.rule]) seen.add(x.rule);
  return Object.keys(TAJWEED_RULES).filter((r) => seen.has(r));
}
