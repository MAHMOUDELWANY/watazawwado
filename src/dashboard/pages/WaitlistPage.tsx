import React, { useCallback, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { RefreshCw, Send } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

type Entry = {
  id: string; email: string; track: string; who: 'me' | 'child'; lang: string; source: string | null;
  pains: string[] | null; note: string | null; invited_at: string | null; joined_at: string | null; created_at: string; place: number;
};
type Data = { entries: Entry[]; byTrack: Record<string, number>; pains: Record<string, number>; waveSize: number; signupMode: 'open' | 'waitlist' };

/** An invitation holds the place for 72 hours (server/routes/waitlist.ts INVITE_HOLD_MS); after that it can be sent again. */
const HOLD_MS = 72 * 3600 * 1000;

const TRACK: Record<string, [string, string]> = { quran: ['Quran', 'القرآن'], zad: ['Zad Path', 'مسار الزاد'], arabic: ['Arabic', 'العربية'], english: ['English', 'الإنجليزية'] };
const PAIN: Record<string, [string, string]> = {
  teacher_stays: ['Teacher who stays', 'معلّم يبقى'], clear_plan: ['A clear plan', 'خطة واضحة'], see_progress: ['Seeing progress', 'رؤية التقدّم'],
  child_enjoys: ['Child enjoys it', 'الطفل يستمتع'], times_fit: ['Times that fit', 'مواعيد مناسبة'], clear_prices: ['Clear prices', 'أسعار واضحة'],
};

/** Super admin: the "Pack your zaad" line, what people said was missing, and the invitations for each wave. */
export default function WaitlistPage() {
  const { t } = useT();
  const pick = (p: [string, string]) => t(p[0], p[1]);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try { setData(await dashboardFetch<Data>('/api/dashboard/waitlist')); }
    catch (e: any) { setError(e.message || t('The waitlist could not be loaded.', 'تعذّر تحميل قائمة الانتظار.')); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const invite = async (e: Entry) => {
    if (!window.confirm(t(`Send the invitation to ${e.email}?`, `إرسال الدعوة إلى ${e.email}؟`))) return;
    setBusy(e.id);
    try { await dashboardFetch(`/api/dashboard/waitlist/${e.id}/invite`, { method: 'POST' }); await load(); }
    catch (err: any) { setError(err.message); }
    finally { setBusy(null); }
  };

  const entries = data?.entries ?? [];
  const invited = entries.filter((e) => e.invited_at).length;
  const joined = entries.filter((e) => e.joined_at).length;
  const when = (iso: string) => DateTime.fromISO(iso).toFormat('d LLL, HH:mm');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('Waitlist', 'قائمة الانتظار')}</h1>
          <p className="text-sm text-muted-foreground">
            {data && (data.signupMode === 'waitlist'
              ? t('Sign-up is invite-only. New accounts need an invitation from here.', 'التسجيل بالدعوة فقط. الحساب الجديد يحتاج دعوة من هنا.')
              : t('Sign-up is open to everyone. The line still collects names.', 'التسجيل مفتوح للجميع، والقائمة ما زالت تجمع الأسماء.'))}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="me-2 h-4 w-4" />{t('Refresh', 'تحديث')}</Button>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {data && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">{t('In line', 'في الدور')}</p>
            <p className="text-2xl font-bold">{entries.length}</p>
            <p className="text-xs text-muted-foreground">{t(`Wave size ${data.waveSize}`, `حجم الدفعة ${data.waveSize}`)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">{t('Invited / joined', 'دُعوا / انضمّوا')}</p>
            <p className="text-2xl font-bold">{invited} / {joined}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">{t('By subject', 'حسب المادة')}</p>
            <p className="text-sm">{Object.entries(data.byTrack).map(([k, n]) => `${TRACK[k] ? pick(TRACK[k]) : k} ${n}`).join(', ') || '—'}</p>
          </Card>
        </div>
      )}

      {data && Object.keys(data.pains).length > 0 && (
        <Card className="p-4">
          <p className="mb-2 text-sm font-semibold">{t('What was missing before', 'ما كان ينقصهم من قبل')}</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.pains).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
              <Badge key={k} variant="secondary">{PAIN[k] ? pick(PAIN[k]) : k}: {n}</Badge>
            ))}
          </div>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-start text-muted-foreground">
            <tr className="border-b border-border">
              <th className="p-3 text-start">#</th>
              <th className="p-3 text-start">{t('Email', 'البريد')}</th>
              <th className="p-3 text-start">{t('Subject', 'المادة')}</th>
              <th className="p-3 text-start">{t('For', 'لمن')}</th>
              <th className="p-3 text-start">{t('Joined the line', 'دخل الدور')}</th>
              <th className="p-3 text-start">{t('Note', 'ملاحظة')}</th>
              <th className="p-3 text-start">{t('Invitation', 'الدعوة')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className={`border-b border-border/60 ${data && e.place <= data.waveSize ? '' : 'opacity-75'}`}>
                <td className="p-3 font-semibold">{e.place}</td>
                <td className="p-3" dir="ltr">{e.email}</td>
                <td className="p-3">{TRACK[e.track] ? pick(TRACK[e.track]) : e.track}</td>
                <td className="p-3">{e.who === 'child' ? t('Child', 'طفل') : t('Self', 'نفسه')}</td>
                <td className="p-3 whitespace-nowrap">{when(e.created_at)}{e.source ? <span className="block text-xs text-muted-foreground">{e.source}</span> : null}</td>
                <td className="p-3 max-w-[22ch]">{e.note || (e.pains?.length ? e.pains.map((p) => PAIN[p] ? pick(PAIN[p]) : p).join(', ') : '—')}</td>
                <td className="p-3 whitespace-nowrap">
                  {e.joined_at ? <Badge variant="success">{t('Joined', 'انضمّ')}</Badge>
                    : e.invited_at && Date.now() - Date.parse(e.invited_at) < HOLD_MS ? <Badge variant="warning">{t(`Invited ${when(e.invited_at)}`, `دُعي ${when(e.invited_at)}`)}</Badge>
                    : <Button size="sm" isLoading={busy === e.id} onClick={() => invite(e)}><Send className="me-1.5 h-3.5 w-3.5" />{e.invited_at ? t('Invite again', 'ادعُ مجددًا') : t('Invite', 'ادعُ')}</Button>}
                </td>
              </tr>
            ))}
            {data && !entries.length && (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">{t('No one in line yet. Share the /zaad link in your next video.', 'لا أحد في الدور بعد. شارك رابط /zaad في الفيديو القادم.')}</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
