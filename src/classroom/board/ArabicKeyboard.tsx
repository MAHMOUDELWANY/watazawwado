import React from 'react';
import { useT } from '../../lib/language';

// Standard Arabic keyboard rows, then the hamza forms and the tashkeel marks.
const ROWS = [
  'ض ص ث ق ف غ ع ه خ ح ج د',
  'ش س ي ب ل ا ت ن م ك ط ذ',
  'ئ ء ؤ ر ى ة و ز ظ أ إ آ',
].map((r) => r.split(' '));
const TASHKEEL: Array<[string, string, string]> = [
  ['َ', 'Fatha', 'فتحة'], ['ُ', 'Damma', 'ضمة'], ['ِ', 'Kasra', 'كسرة'], ['ْ', 'Sukun', 'سكون'],
  ['ّ', 'Shadda', 'شدة'], ['ً', 'Tanween fath', 'تنوين فتح'], ['ٌ', 'Tanween damm', 'تنوين ضم'],
  ['ٍ', 'Tanween kasr', 'تنوين كسر'], ['ٰ', 'Dagger alif', 'ألف خنجرية'],
];

/**
 * Put text at the caret of the focused input or textarea (Excalidraw's text editor is a textarea) and fire `input`
 * so React and Excalidraw see the change. Returns false when nothing editable has focus.
 */
export function insertAtCursor(text: string): boolean {
  const el = document.activeElement;
  if (!(el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement)) return false;
  el.setRangeText(text, el.selectionStart ?? el.value.length, el.selectionEnd ?? el.value.length, 'end');
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

const keyClass = 'h-10 min-w-9 rounded-lg border border-border bg-surface text-lg text-foreground hover:bg-surface-subtle active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary';

/** Classroom Task 8: on-screen Arabic letters and tashkeel. Keys never take focus, so the caret stays where it was. */
export function ArabicKeyboard({ onInsert = insertAtCursor }: { onInsert?: (text: string) => void }) {
  const { t } = useT();
  // preventDefault on mousedown keeps focus (and the caret) in the field being typed in.
  const key = (ch: string, label?: string) => (
    <button key={ch} type="button" className={keyClass} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={() => onInsert(ch)}>
      {label ? <span className="font-arabic">{'◌' + ch}</span> : ch}
    </button>
  );
  return (
    <div dir="rtl" lang="ar" className="grid gap-1.5 rounded-xl border border-border bg-surface p-2" aria-label={t('Arabic keyboard', 'كيبورد عربي')} role="group">
      {ROWS.map((row, i) => <div key={i} className="flex flex-wrap justify-center gap-1">{row.map((ch) => key(ch))}</div>)}
      <div className="flex flex-wrap justify-center gap-1">
        {TASHKEEL.map(([ch, en, ar]) => key(ch, t(en, ar)))}
        <button type="button" className={`${keyClass} min-w-24`} onMouseDown={(e) => e.preventDefault()} onClick={() => onInsert(' ')}>{t('Space', 'مسافة')}</button>
      </div>
    </div>
  );
}
