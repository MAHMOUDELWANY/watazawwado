import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { authedJson } from '../../../lib/authedJson';
import { supabase } from '../../../lib/supabase';
import { AchievementEmblem } from '../achievements/AchievementEmblems';

/**
 * CM-04 on the community page (design docs/superpowers/specs/2026-10-20-milestone-celebration-design.md):
 * - FamilyAchievements: "your family completed 100 lessons together"; the account holder decides whether it shows on
 *   the Hall of Honor and under which family name, and can take it down.
 * - HonorPhoto: an optional photo for an achievement already on the Hall of Honor, with a second, explicit consent.
 *   It shows only after our review, and the family can remove it any time (the emblem comes back).
 */
interface FamilyItem { id: string; lessons: number; title_en: string; title_ar: string; status: 'awaiting_consent' | 'published' | 'declined' | 'withdrawn'; display_name: string | null }

export function FamilyAchievements({ isAr, onChanged }: { isAr: boolean; onChanged?: () => void }) {
  const [items, setItems] = useState<FamilyItem[]>([]);
  const [defaults, setDefaults] = useState<{ ar: string; en: string } | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    authedJson<{ achievements: FamilyItem[]; defaultName?: { ar: string; en: string } }>('/api/student/community/family')
      .then((d) => { setItems(d.achievements || []); setDefaults(d.defaultName || null); }).catch(() => setItems([]));
  }, []);
  useEffect(load, [load]);
  if (items.length === 0) return null;

  const decide = async (item: FamilyItem, decision: 'yes' | 'no' | 'withdraw') => {
    setBusy(`${item.id}:${decision}`); setError('');
    try {
      const name = (names[item.id] ?? (isAr ? defaults?.ar : defaults?.en) ?? '').trim();
      await authedJson(`/api/student/community/family/${item.id}/decision`, { method: 'POST', body: JSON.stringify({ decision, name, lang: isAr ? 'ar' : 'en' }) });
      load(); onChanged?.();
    } catch {
      setError(isAr ? 'تعذّر حفظ اختياركم. حاولوا مرة أخرى.' : 'We could not save your choice. Please try again.');
    } finally { setBusy(null); }
  };

  return (
    <Card className="p-5 grid gap-4" data-testid="family-achievements">
      <h2 className="font-display text-lg font-bold text-foreground">{isAr ? 'إنجاز أسرتكم' : 'Your family’s achievement'}</h2>
      <ul className="grid gap-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-[#E5A93C]/35 bg-[#E5A93C]/5 p-4 grid gap-3">
            <div className="flex items-start gap-3">
              <AchievementEmblem id="lessons-100" className="w-12 h-12 shrink-0" />
              <div className="grid gap-1 min-w-0">
                <p className="font-semibold text-foreground">{isAr ? `ما شاء الله! أسرتكم ${item.title_ar}` : `MashaAllah! Your family ${item.title_en.charAt(0).toLowerCase()}${item.title_en.slice(1)}`}</p>
                {item.status === 'awaiting_consent' && (
                  <p className="text-sm text-muted-foreground">{isAr
                    ? 'هل تحبون أن يظهر في لوحة الشرف؟ اللوحة داخل الحسابات فقط، ويظهر اسم الأسرة الذي تختارونه بلا أسماء الأولاد ولا صور.'
                    : 'Would you like it on the Hall of Honor? It is inside the accounts only, and shows the family name you choose, with no children’s names or photos.'}</p>
                )}
                {item.status === 'published' && <p className="text-sm text-muted-foreground">{isAr ? `ظاهر في لوحة الشرف باسم «${item.display_name}».` : `On the Hall of Honor as “${item.display_name}”.`}</p>}
                {(item.status === 'declined' || item.status === 'withdrawn') && <p className="text-sm text-muted-foreground">{isAr ? 'خاص، لا يظهر لأحد.' : 'Private. Not shown to anyone.'}</p>}
              </div>
            </div>
            {item.status !== 'published' ? (
              <div className="grid gap-2">
                <label className="grid gap-1 text-sm">
                  <span>{isAr ? 'اسم الأسرة الذي يظهر' : 'Family name to show'}</span>
                  <Input maxLength={40} value={names[item.id] ?? (isAr ? defaults?.ar : defaults?.en) ?? ''} onChange={(e) => setNames((n) => ({ ...n, [item.id]: e.target.value }))} />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => decide(item, 'yes')} isLoading={busy === `${item.id}:yes`} disabled={busy !== null}>{isAr ? 'نعم، اعرضوه' : 'Yes, show it'}</Button>
                  {item.status === 'awaiting_consent' && <Button variant="outline" onClick={() => decide(item, 'no')} isLoading={busy === `${item.id}:no`} disabled={busy !== null}>{isAr ? 'لا، خلّيه لنا' : 'No, keep it private'}</Button>}
                </div>
              </div>
            ) : (
              <div><Button size="sm" variant="ghost" onClick={() => decide(item, 'withdraw')} isLoading={busy === `${item.id}:withdraw`}>{isAr ? 'شيلوه من اللوحة' : 'Take it down'}</Button></div>
            )}
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </Card>
  );
}

export function HonorPhoto({ entryId, status, isAr, onChanged }: { entryId: string; status: 'pending' | 'approved' | 'rejected' | null; isAr: boolean; onChanged: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const upload = async () => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError(isAr ? 'الصورة أكبر من ٢ ميجا. اختاروا صورة أصغر.' : 'The photo is over 2 MB. Choose a smaller one.'); return; }
    setBusy(true); setError('');
    try {
      const { path, token } = await authedJson<{ path: string; token: string }>(`/api/student/community/honor/${entryId}/photo-url`, { method: 'POST', body: JSON.stringify({ contentType: file.type }) });
      const { error: upErr } = await supabase.storage.from('honor-photos').uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (upErr) throw upErr;
      await authedJson(`/api/student/community/honor/${entryId}/photo`, { method: 'POST', body: JSON.stringify({ path, consent: true }) });
      setFile(null); setAgree(false); onChanged();
    } catch (e: any) {
      setError(e?.status === 400 && e?.message ? e.message : (isAr ? 'تعذّر رفع الصورة. حاولوا مرة أخرى.' : 'We could not upload the photo. Please try again.'));
    } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true); setError('');
    try { await authedJson(`/api/student/community/honor/${entryId}/photo/remove`, { method: 'POST' }); onChanged(); }
    catch { setError(isAr ? 'تعذّر حذف الصورة. حاولوا مرة أخرى.' : 'We could not remove the photo. Please try again.'); }
    finally { setBusy(false); }
  };

  if (status === 'pending' || status === 'approved') {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">
          {status === 'pending' ? (isAr ? 'الصورة لدى فريقنا للمراجعة، ويظهر الشعار حتى نوافق.' : 'Our team is reviewing the photo; the emblem shows until then.') : (isAr ? 'الصورة ظاهرة في لوحة الشرف.' : 'The photo is on the Hall of Honor.')}
        </span>
        <Button size="sm" variant="ghost" onClick={remove} isLoading={busy}>{isAr ? 'شيلوا الصورة' : 'Remove the photo'}</Button>
        {error && <p role="alert" className="basis-full text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-semibold text-foreground min-h-11 flex items-center">{isAr ? 'تحبوا تضيفوا صورة؟ (اختياري)' : 'Add a photo? (optional)'}</summary>
      <div className="grid gap-2 pt-2">
        <p className="text-muted-foreground">{isAr
          ? 'يظهر الشعار الآن. وإن أحببتم صورة بدلًا منه: لن يراها إلا أسر الأكاديمية وطلابها، ويراجعها فريقنا أولًا، ويمكنكم حذفها في أي وقت. وللبنات والسيدات يبقى الشعار متاحًا دائمًا بدل الصورة.'
          : 'The emblem shows now. If you prefer a photo: only academy families and students will see it, our team reviews it first, and you can remove it any time. For girls and women the emblem is always there instead.'}</p>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label={isAr ? 'اختاروا صورة' : 'Choose a photo'} onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="accent-teal w-4 h-4 mt-0.5" />
          <span>{isAr ? 'نوافق على عرض هذه الصورة في لوحة الشرف داخل الأكاديمية.' : 'We agree to show this photo on the Hall of Honor inside the academy.'}</span>
        </label>
        <Button size="sm" className="w-fit" onClick={upload} isLoading={busy} disabled={!file || !agree}>{isAr ? 'ابعتوا الصورة' : 'Send the photo'}</Button>
        {error && <p role="alert" className="text-destructive">{error}</p>}
      </div>
    </details>
  );
}
