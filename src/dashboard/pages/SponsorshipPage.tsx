import React, { useCallback, useEffect, useState } from 'react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { confirmAction, notify } from '../../components/ui/Feedback';

/**
 * NX-07, super admin: the sponsorship (sadaqah) fund. Requests with their reasons (only here), a grant is one catalog
 * package placed in the learner's wallet and paid from the fund; grants can also be given without a request.
 */
type Pkg = { id: string; name: string; nameAr: string; lessons: number; priceUsd: number };
type Req = { id: string; learner_student_id: string; learner_name: string | null; lessons_requested: number; reason: string; status: string; admin_note: string | null; created_at: string };
type Data = {
  balanceUsd: number;
  donations: Array<{ id: string; donor_email: string | null; amount_usd: number; lessons: number | null; created_at: string }>;
  requests: Req[];
  grants: Array<{ id: string; learner_name: string | null; lessons: number; fund_cost_usd: number; created_at: string; request_id: string | null }>;
  packages: Pkg[];
};

const money = (n: number) => `$${Number(n || 0).toFixed(2)}`;

export default function SponsorshipPage() {
  const { isAr, t } = useT();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [found, setFound] = useState<Array<{ id: string; name: string; email: string | null }>>([]);
  const [directLearner, setDirectLearner] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(() => {
    dashboardFetch<Data>('/api/dashboard/admin/sponsorship').then(setData).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (q.trim().length < 2) { setFound([]); return; }
    const id = setTimeout(() => {
      dashboardFetch<{ learners: Array<{ id: string; name: string; email: string | null }> }>(`/api/dashboard/admin/sponsorship/learners?q=${encodeURIComponent(q.trim())}`)
        .then((d) => setFound(d.learners)).catch(() => setFound([]));
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  if (!data) return null;

  const pkgLabel = (p: Pkg) => `${isAr ? p.nameAr : p.name} · ${money(p.priceUsd)}`;
  // A request for N lessons defaults to the cheapest N-lesson package (30-minute Quran lessons).
  const defaultPkg = (lessons: number) => data.packages.filter((p) => p.lessons === lessons).sort((a, b) => a.priceUsd - b.priceUsd)[0]?.id || '';

  const grant = async (key: string, body: Record<string, unknown>, who: string, pkgId: string) => {
    const p = data.packages.find((x) => x.id === pkgId);
    if (!p) return notify(t('Choose a package.', 'اختار باقة.'), 'error');
    if (!(await confirmAction(t(`Give ${who} ${p.lessons} lessons from the fund (${money(p.priceUsd)})?`, `ندّي ${who} ${p.lessons} حصص من الصندوق (${money(p.priceUsd)})؟`)))) return;
    setBusy(key);
    try {
      await dashboardFetch('/api/dashboard/admin/sponsorship/grant', { method: 'POST', body: JSON.stringify({ ...body, packageCatalogId: pkgId }) });
      notify(t('Lessons added to the family wallet. They were told.', 'الحصص اتضافت لمحفظة الأسرة، واتبلغوا.'));
      setDirectLearner(null); setQ('');
      load();
    } catch (e: any) { notify(e.message, 'error'); }
    finally { setBusy(null); }
  };

  const decline = async (r: Req) => {
    const note = window.prompt(t('A kind line the family will see (optional):', 'سطر لطيف الأسرة هتشوفه (اختياري):')) ?? null;
    if (note === null) return;
    setBusy(r.id);
    try { await dashboardFetch(`/api/dashboard/admin/sponsorship/requests/${r.id}/decline`, { method: 'POST', body: JSON.stringify({ note }) }); load(); }
    catch (e: any) { notify(e.message, 'error'); }
    finally { setBusy(null); }
  };

  const pending = data.requests.filter((r) => r.status === 'pending');
  const decided = data.requests.filter((r) => r.status !== 'pending');
  const date = (iso: string) => new Date(iso).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-8 pb-12 max-w-5xl" data-testid="sponsorship-page">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{t('Sponsorship fund', 'صندوق الكفالة')}</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          {t('Sadaqah from families goes into one fund. You choose who receives; a grant is a normal package in the learner\'s wallet, paid from the fund. Names stay on this page only.',
            'صدقات الأسر بتروح لصندوق واحد. انت بتختار مين ياخد، والمنحة باقة عادية في محفظة الطالب مدفوعة من الصندوق. الأسماء بتفضل في الصفحة دي بس.')}
        </p>
      </div>

      <Card className="p-5 grid gap-1 w-fit">
        <span className="text-xs text-muted-foreground">{t('In the fund', 'في الصندوق')}</span>
        <span className="text-3xl font-bold tabular-nums">{money(data.balanceUsd)}</span>
      </Card>

      <section className="space-y-3" aria-labelledby="sp-requests">
        <h2 id="sp-requests" className="text-lg font-semibold">{t('Requests waiting', 'طلبات مستنية')} <Badge variant="secondary">{pending.length}</Badge></h2>
        {pending.length === 0 && <p className="text-sm text-muted-foreground">{t('No requests right now.', 'مفيش طلبات دلوقتي.')}</p>}
        {pending.map((r) => {
          const chosen = pick[r.id] ?? defaultPkg(r.lessons_requested);
          return (
            <Card key={r.id} className="p-4 grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{r.learner_name || t('Learner', 'طالب')} · {t(`${r.lessons_requested} lessons`, `${r.lessons_requested} حصص`)}</span>
                <span className="text-xs text-muted-foreground">{date(r.created_at)}</span>
              </div>
              <p className="text-sm whitespace-pre-line">{r.reason}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Select aria-label={t("Package to give", "الباقة اللي هتتدّى")} value={chosen} onChange={(e) => setPick((p) => ({ ...p, [r.id]: e.target.value }))} className="max-w-xs">
                  {data.packages.map((p) => <option key={p.id} value={p.id}>{pkgLabel(p)}</option>)}
                </Select>
                <Button size="sm" isLoading={busy === r.id} onClick={() => grant(r.id, { requestId: r.id }, r.learner_name || '', chosen)}>{t('Give', 'ادّي')}</Button>
                <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => decline(r)}>{t('Not this time', 'مش المرة دي')}</Button>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="space-y-3" aria-labelledby="sp-direct">
        <h2 id="sp-direct" className="text-lg font-semibold">{t('Give without a request', 'ادّي من غير طلب')}</h2>
        <Card className="p-4 grid gap-3">
          {directLearner ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{directLearner.name}</span>
              <Select aria-label={t("Package to give", "الباقة اللي هتتدّى")} value={pick.direct ?? defaultPkg(8)} onChange={(e) => setPick((p) => ({ ...p, direct: e.target.value }))} className="max-w-xs">
                {data.packages.map((p) => <option key={p.id} value={p.id}>{pkgLabel(p)}</option>)}
              </Select>
              <Button size="sm" isLoading={busy === 'direct'} onClick={() => grant('direct', { learnerId: directLearner.id }, directLearner.name, pick.direct ?? defaultPkg(8))}>{t('Give', 'ادّي')}</Button>
              <Button size="sm" variant="ghost" onClick={() => setDirectLearner(null)}>{t('Change', 'غيّر')}</Button>
            </div>
          ) : (
            <>
              <label className="grid gap-1.5 text-sm">
                <span>{t('Find the learner by name', 'دوّر على الطالب بالاسم')}</span>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('At least two letters', 'حرفين على الأقل')} />
              </label>
              {found.length > 0 && (
                <ul className="grid gap-1">
                  {found.map((l) => (
                    <li key={l.id}>
                      <button type="button" onClick={() => setDirectLearner({ id: l.id, name: l.name })} className="w-full text-start rounded-lg px-3 min-h-11 hover:bg-surface-subtle focus-ring text-sm">
                        {l.name} {l.email && <span className="text-xs text-muted-foreground" dir="ltr">· {l.email}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t('Grants given', 'المنح اللي اتدّت')}</h2>
          {data.grants.length === 0 ? <p className="text-sm text-muted-foreground">{t('None yet.', 'لسه مفيش.')}</p> : (
            <ul className="grid gap-2 text-sm">
              {data.grants.map((g) => (
                <li key={g.id} className="flex justify-between gap-2 border-b border-border pb-2">
                  <span>{g.learner_name || '—'} · {t(`${g.lessons} lessons`, `${g.lessons} حصص`)}</span>
                  <span className="text-muted-foreground tabular-nums">{money(g.fund_cost_usd)} · {date(g.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
          {decided.length > 0 && (
            <>
              <h3 className="text-sm font-semibold pt-2">{t('Decided requests', 'طلبات اتردّ عليها')}</h3>
              <ul className="grid gap-1 text-xs text-muted-foreground">
                {decided.map((r) => <li key={r.id}>{r.learner_name || '—'} · {r.status === 'approved' ? t('given', 'اتدّت') : t('declined', 'اتعتذرنا')} · {date(r.created_at)}</li>)}
              </ul>
            </>
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t('Sadaqah received', 'الصدقات اللي وصلت')}</h2>
          {data.donations.length === 0 ? <p className="text-sm text-muted-foreground">{t('None yet.', 'لسه مفيش.')}</p> : (
            <ul className="grid gap-2 text-sm">
              {data.donations.map((d) => (
                <li key={d.id} className="flex justify-between gap-2 border-b border-border pb-2">
                  <span className="truncate" dir="ltr">{d.donor_email || '—'}</span>
                  <span className="tabular-nums shrink-0">{money(d.amount_usd)} · {date(d.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
