import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Tag, Gift, Settings2, Plus, RefreshCw, AlertCircle, Power, PowerOff, Trash2, Copy, Check, Wand2, Users } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

/**
 * Super admin: discount codes, referrals and their settings (RULES.md §4, owner decisions 2026-10-22).
 * The server (server/routes/growth.ts) validates and prices everything; this page only edits and shows.
 */

interface CodeRow {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  value: number;
  applies_to: 'all' | 'lessons' | 'packages';
  first_purchase_only: boolean;
  min_amount_usd: number;
  max_redemptions: number | null;
  max_per_account: number;
  starts_at: string | null;
  ends_at: string | null;
  is_gift: boolean;
  is_active: boolean;
  note: string | null;
  created_at: string;
  used: number;
  pending: number;
  discounted: number;
}

interface ReferralRow {
  id: string;
  status: 'signed_up' | 'rewarded' | 'not_rewarded' | 'void';
  createdAt: string;
  qualifiedAt: string | null;
  welcomeCredit: number;
  rewardCredit: number;
  referrer: { name: string | null; email: string | null };
  referred: { name: string | null; email: string | null };
}

interface GrowthSettings {
  referral_enabled: boolean;
  friend_credit_usd: number;
  referrer_credit_usd: number;
  savings_cap_percent: number;
  max_rewards_per_year: number;
}

type Tab = 'codes' | 'referrals' | 'settings';

const money = (n: number) => `$${Number(n || 0).toFixed(2).replace(/\.00$/, '')}`;

const emptyForm = {
  code: '',
  discount_type: 'percent' as 'percent' | 'fixed',
  value: '',
  applies_to: 'all' as 'all' | 'lessons' | 'packages',
  first_purchase_only: false,
  min_amount_usd: '',
  max_redemptions: '',
  max_per_account: '1',
  starts_at: '',
  ends_at: '',
  is_gift: false,
  note: '',
};

/** 10 characters from a secure random source (a 100% gift code is worth guessing). */
function randomCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => alphabet[b % alphabet.length]).join('');
}

export default function DiscountsPage() {
  const { t, isAr } = useT();
  const [tab, setTab] = useState<Tab>('codes');
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [totals, setTotals] = useState<{ welcome: number; rewards: number; used: number } | null>(null);
  const [settings, setSettings] = useState<GrowthSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [settingsDraft, setSettingsDraft] = useState<GrowthSettings | null>(null);
  const [settingsMsg, setSettingsMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [credit, setCredit] = useState({ email: '', amount: '', note: '' });
  const [creditMsg, setCreditMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, r, s] = await Promise.all([
        dashboardFetch<any>('/api/dashboard/admin/discount-codes'),
        dashboardFetch<any>('/api/dashboard/admin/referrals'),
        dashboardFetch<any>('/api/dashboard/admin/growth-settings'),
      ]);
      setCodes(c.codes || []);
      setReferrals(r.referrals || []);
      setTotals(r.totals || null);
      setSettings(s.settings);
      setSettingsDraft(s.settings);
    } catch (err: any) {
      setError(err.message || t("Couldn't load this page.", 'مقدرناش نحمّل الصفحة.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const preview = useMemo(() => {
    const v = Number(form.value);
    if (!v) return '';
    const amount = form.discount_type === 'percent' ? `${v}%` : money(v);
    const scope = {
      all: t('any lesson or package', 'أي حصة أو باقة'),
      lessons: t('single lessons', 'الحصص المفردة'),
      packages: t('packages', 'الباقات'),
    }[form.applies_to];
    const parts = [isAr ? `خصم ${amount} على ${scope}` : `${amount} off ${scope}`];
    if (form.first_purchase_only) parts.push(t('first purchase only', 'لأول شراء'));
    if (Number(form.min_amount_usd) > 0) parts.push(t(`orders from ${money(Number(form.min_amount_usd))}`, `للطلبات من ${money(Number(form.min_amount_usd))}`));
    if (form.max_redemptions) parts.push(t(`${form.max_redemptions} uses in total`, `${form.max_redemptions} استخدام بالكتير`));
    if (form.ends_at) parts.push(t(`until ${new Date(form.ends_at).toLocaleDateString('en-GB')}`, `لحد ${new Date(form.ends_at).toLocaleDateString('ar-EG')}`));
    if (form.is_gift) parts.push(t('gift: outside the savings cap', 'هدية: برّه الحد الأقصى للتوفير'));
    return parts.join(isAr ? '، ' : ', ');
  }, [form, isAr]);

  const openCreate = () => {
    setForm({ ...emptyForm, code: randomCode() });
    setFormError(null);
    setFormOpen(true);
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await dashboardFetch('/api/dashboard/admin/discount-codes', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          value: Number(form.value),
          min_amount_usd: Number(form.min_amount_usd || 0),
          max_redemptions: form.max_redemptions ? Number(form.max_redemptions) : null,
          max_per_account: Number(form.max_per_account || 1),
          starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
          ends_at: form.ends_at ? new Date(`${form.ends_at}T23:59:59`).toISOString() : null,
        }),
      });
      setFormOpen(false);
      await load();
    } catch (err: any) {
      setFormError(err.message || t("Couldn't create the code.", 'مقدرناش نعمل الكود.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleCode = async (c: CodeRow) => {
    setBusyId(c.id);
    try {
      await dashboardFetch(`/api/dashboard/admin/discount-codes/${c.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !c.is_active }) });
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const deleteCode = async (c: CodeRow) => {
    if (!window.confirm(t(`Delete ${c.code}?`, `تمسح ${c.code}؟`))) return;
    setBusyId(c.id);
    try {
      await dashboardFetch(`/api/dashboard/admin/discount-codes/${c.id}`, { method: 'DELETE' });
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsDraft) return;
    setSettingsMsg(null);
    try {
      const res = await dashboardFetch<any>('/api/dashboard/admin/growth-settings', {
        method: 'PUT',
        body: JSON.stringify({ settings: {
          ...settingsDraft,
          friend_credit_usd: Number(settingsDraft.friend_credit_usd),
          referrer_credit_usd: Number(settingsDraft.referrer_credit_usd),
          savings_cap_percent: Number(settingsDraft.savings_cap_percent),
          max_rewards_per_year: Number(settingsDraft.max_rewards_per_year),
        } }),
      });
      setSettings(res.settings);
      setSettingsDraft(res.settings);
      setSettingsMsg({ kind: 'ok', text: t('Saved.', 'اتحفظ.') });
    } catch (err: any) {
      setSettingsMsg({ kind: 'error', text: err.message });
    }
  };

  const submitCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreditMsg(null);
    try {
      const res = await dashboardFetch<any>('/api/dashboard/admin/account-credit', {
        method: 'POST',
        body: JSON.stringify({ email: credit.email.trim(), amount: Number(credit.amount), note: credit.note.trim() }),
      });
      setCreditMsg({ kind: 'ok', text: t(`Done. Balance is now ${money(res.balance)}.`, `تمام. الرصيد بقى ${money(res.balance)}.`) });
      setCredit({ email: '', amount: '', note: '' });
    } catch (err: any) {
      setCreditMsg({ kind: 'error', text: err.message });
    }
  };

  const codeStatus = (c: CodeRow) => {
    const now = Date.now();
    if (!c.is_active) return { label: t('Off', 'موقوف'), cls: 'bg-muted text-muted-foreground' };
    if (c.ends_at && new Date(c.ends_at).getTime() <= now) return { label: t('Ended', 'خلص'), cls: 'bg-muted text-muted-foreground' };
    if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: t('Scheduled', 'لسه هيبدأ'), cls: 'bg-accent/15 text-accent' };
    if (c.max_redemptions != null && c.used + c.pending >= c.max_redemptions) return { label: t('Used up', 'خلص استخدامه'), cls: 'bg-muted text-muted-foreground' };
    return { label: t('Active', 'شغال'), cls: 'bg-success/15 text-success' };
  };

  const referralStatus: Record<ReferralRow['status'], string> = {
    signed_up: t('Joined, waiting for first paid lesson', 'سجّل، مستني أول حصة مدفوعة'),
    rewarded: t('Inviter rewarded', 'اللي دعاه اخد مكافأته'),
    not_rewarded: t('Qualified (yearly limit reached)', 'اتأهل (وصل للحد السنوي)'),
    void: t('Void', 'ملغي'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 animate-spin text-accent opacity-60" />
      </div>
    );
  }

  const tabs: Array<{ key: Tab; label: string; icon: any }> = [
    { key: 'codes', label: t('Discount codes', 'أكواد الخصم'), icon: Tag },
    { key: 'referrals', label: t('Invites', 'الدعوات'), icon: Gift },
    { key: 'settings', label: t('Settings', 'الإعدادات'), icon: Settings2 },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-start pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{t('Discounts & invites', 'الخصومات والدعوات')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Codes families type at checkout, and the invite-a-friend program.', 'أكواد بيكتبها الأهالي وقت الدفع، وبرنامج ادعُ صاحبك.')}
          </p>
        </div>
        {tab === 'codes' && (
          <Button onClick={openCreate} className="self-start sm:self-auto gap-2">
            <Plus className="w-4 h-4" />
            {t('New code', 'كود جديد')}
          </Button>
        )}
      </div>

      <div role="tablist" className="inline-flex p-1 rounded-xl glass-surface border border-border gap-1 max-w-full overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
              tab === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ---------------- Codes ---------------- */}
      {tab === 'codes' && (
        codes.length === 0 ? (
          <div className="glass-card border border-border rounded-2xl p-10 text-center">
            <Tag className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="mt-3 font-semibold text-foreground">{t('No codes yet', 'مفيش أكواد لسه')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('Make one for a season, a community partner, or a gift lesson.', 'اعمل كود لموسم، أو لشريك من الجالية، أو لحصة هدية.')}
            </p>
            <Button onClick={openCreate} variant="outline" className="mt-5 gap-2"><Plus className="w-4 h-4" />{t('New code', 'كود جديد')}</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {codes.map((c) => {
              const st = codeStatus(c);
              return (
                <div key={c.id} className="glass-card border border-border rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => copyCode(c.code)}
                        className="inline-flex items-center gap-2 font-mono text-lg font-bold tracking-wider text-foreground hover:text-primary"
                        dir="ltr"
                        title={t('Copy', 'انسخ')}
                      >
                        {c.code}
                        {copied === c.code ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {c.discount_type === 'percent' ? `${c.value}%` : money(c.value)}{' '}
                        {{ all: t('on everything', 'على كل حاجة'), lessons: t('on single lessons', 'على الحصص المفردة'), packages: t('on packages', 'على الباقات') }[c.applies_to]}
                        {c.first_purchase_only ? ` · ${t('first purchase', 'أول شراء')}` : ''}
                        {c.is_gift ? ` · ${t('gift', 'هدية')}` : ''}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${st.cls}`}>{st.label}</span>
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-surface-subtle/60 p-2">
                      <dt className="text-[11px] text-muted-foreground">{t('Used', 'اتستخدم')}</dt>
                      <dd className="font-bold tabular-nums">{c.used}{c.max_redemptions ? <span className="text-muted-foreground font-normal">/{c.max_redemptions}</span> : null}</dd>
                    </div>
                    <div className="rounded-xl bg-surface-subtle/60 p-2">
                      <dt className="text-[11px] text-muted-foreground">{t('At checkout', 'في الدفع')}</dt>
                      <dd className="font-bold tabular-nums">{c.pending}</dd>
                    </div>
                    <div className="rounded-xl bg-surface-subtle/60 p-2">
                      <dt className="text-[11px] text-muted-foreground">{t('Given', 'اتخصم')}</dt>
                      <dd className="font-bold tabular-nums">{money(c.discounted)}</dd>
                    </div>
                  </dl>
                  <p className="text-xs text-muted-foreground">
                    {c.ends_at ? t(`Ends ${new Date(c.ends_at).toLocaleDateString('en-GB')}`, `بينتهي ${new Date(c.ends_at).toLocaleDateString('ar-EG')}`) : t('No end date', 'من غير تاريخ نهاية')}
                    {' · '}
                    {t(`${c.max_per_account} per family`, `${c.max_per_account} لكل عيلة`)}
                    {c.note ? ` · ${c.note}` : ''}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" variant="outline" isLoading={busyId === c.id} onClick={() => toggleCode(c)} className="gap-1.5">
                      {c.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      {c.is_active ? t('Switch off', 'وقّفه') : t('Switch on', 'شغّله')}
                    </Button>
                    {c.used + c.pending === 0 && (
                      <Button size="sm" variant="ghost" onClick={() => deleteCode(c)} className="gap-1.5 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('Delete', 'امسح')}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ---------------- Referrals ---------------- */}
      {tab === 'referrals' && (
        <div className="space-y-4">
          {settings && (
            <div className="glass-surface border border-border rounded-2xl p-4 text-sm text-muted-foreground leading-relaxed">
              {settings.referral_enabled
                ? t(
                    `Each family has a personal invite link. A friend who joins gets ${money(settings.friend_credit_usd)} credit; the inviter gets ${money(settings.referrer_credit_usd)} after the friend's first paid lesson is completed (up to ${settings.max_rewards_per_year} a year).`,
                    `كل عيلة عندها لينك دعوة خاص بيها. الصاحب اللي يسجّل ياخد ${money(settings.friend_credit_usd)} رصيد، واللي دعاه ياخد ${money(settings.referrer_credit_usd)} بعد ما الصاحب يخلّص أول حصة مدفوعة (لحد ${settings.max_rewards_per_year} في السنة).`
                  )
                : t('The invite program is switched off. Turn it on from Settings.', 'برنامج الدعوات موقوف. شغّله من الإعدادات.')}
            </div>
          )}
          {totals && (
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { k: t('Welcome credit given', 'رصيد ترحيب اتدّى'), v: totals.welcome },
                { k: t('Inviter rewards given', 'مكافآت اتدّت للي دعوا'), v: totals.rewards },
                { k: t('Balance used at checkout', 'رصيد اتستخدم في الدفع'), v: totals.used },
              ].map((x) => (
                <div key={x.k} className="glass-card border border-border rounded-2xl p-4">
                  <dt className="text-xs text-muted-foreground">{x.k}</dt>
                  <dd className="text-xl font-bold tabular-nums mt-1">{money(x.v)}</dd>
                </div>
              ))}
            </dl>
          )}
          {referrals.length === 0 ? (
            <div className="glass-card border border-border rounded-2xl p-10 text-center">
              <Users className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="mt-3 font-semibold text-foreground">{t('No invites yet', 'مفيش دعوات لسه')}</p>
            </div>
          ) : (
            <div className="glass-card border border-border rounded-2xl divide-y divide-border">
              {referrals.map((r) => (
                <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-foreground truncate">
                      {r.referrer.name || r.referrer.email || '—'} <span className="text-muted-foreground font-normal">{t('invited', 'دعا')}</span> {r.referred.name || r.referred.email || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(r.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB')} · {referralStatus[r.status]}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {t('Welcome', 'ترحيب')} {money(r.welcomeCredit)} · {t('Reward', 'مكافأة')} {money(r.rewardCredit)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------- Settings ---------------- */}
      {tab === 'settings' && settingsDraft && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <form onSubmit={saveSettings} className="glass-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-foreground">{t('Program', 'البرنامج')}</h2>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>{t('Invite-a-friend program on', 'برنامج ادعُ صاحبك شغال')}</span>
              <input type="checkbox" className="w-5 h-5 accent-primary" checked={settingsDraft.referral_enabled}
                onChange={(e) => setSettingsDraft({ ...settingsDraft, referral_enabled: e.target.checked })} />
            </label>
            {([
              ['friend_credit_usd', t('Friend gets (USD credit)', 'الصاحب ياخد (رصيد بالدولار)'), '0.5'],
              ['referrer_credit_usd', t('Inviter gets (USD credit)', 'اللي دعا ياخد (رصيد بالدولار)'), '0.5'],
              ['max_rewards_per_year', t('Inviter rewards per year (max)', 'أقصى عدد مكافآت في السنة'), '1'],
              ['savings_cap_percent', t('Total savings cap per order (%)', 'أقصى توفير على الطلب الواحد (%)'), '1'],
            ] as const).map(([key, label, step]) => (
              <label key={key} className="block text-sm">
                <span className="text-muted-foreground">{label}</span>
                <Input type="number" min={0} step={step} className="mt-1" dir="ltr"
                  value={String((settingsDraft as any)[key])}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, [key]: e.target.value as any })} />
              </label>
            ))}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('The cap counts package savings, the family 5% and the code together, against the full price. Gift codes are outside it. Account balance is money, not a discount, so it is outside it too.',
                 'الحد ده بيحسب توفير الباقة وخصم العيلة 5% والكود مع بعض، من السعر الكامل. أكواد الهدية برّه الحد. والرصيد فلوس مش خصم، فهو كمان برّه الحد.')}
            </p>
            {settingsMsg && <p role="status" className={`text-sm ${settingsMsg.kind === 'ok' ? 'text-success' : 'text-destructive'}`}>{settingsMsg.text}</p>}
            <Button type="submit">{t('Save', 'احفظ')}</Button>
          </form>

          <form onSubmit={submitCredit} className="glass-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-foreground">{t('Add or remove balance', 'زوّد أو قلّل رصيد')}</h2>
            <p className="text-xs text-muted-foreground">{t('For goodwill or a correction. Use a minus sign to remove.', 'لمجاملة أو تصحيح. حط سالب عشان تقلّل.')}</p>
            <Input type="email" required dir="ltr" aria-label={t('Family account email', 'إيميل حساب العيلة')} placeholder={t('Family account email', 'إيميل حساب العيلة')} value={credit.email}
              onChange={(e) => setCredit({ ...credit, email: e.target.value })} />
            <Input type="number" required step="0.5" dir="ltr" aria-label={t('Amount in USD', 'المبلغ بالدولار')} placeholder={t('Amount in USD, e.g. 5 or -5', 'المبلغ بالدولار، مثلاً 5 أو -5')} value={credit.amount}
              onChange={(e) => setCredit({ ...credit, amount: e.target.value })} />
            <Input required aria-label={t('Reason', 'السبب')} placeholder={t('Why (kept in the record)', 'السبب (بيتسجّل)')} value={credit.note}
              onChange={(e) => setCredit({ ...credit, note: e.target.value })} />
            {creditMsg && <p role="status" className={`text-sm ${creditMsg.kind === 'ok' ? 'text-success' : 'text-destructive'}`}>{creditMsg.text}</p>}
            <Button type="submit" variant="outline">{t('Apply', 'نفّذ')}</Button>
          </form>
        </div>
      )}

      {/* ---------------- New code ---------------- */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} maxWidth="lg" title={t('New discount code', 'كود خصم جديد')}>
        <form onSubmit={submitCode} className="space-y-4 text-start" dir={isAr ? 'rtl' : 'ltr'}>
          <label className="block text-sm">
            <span className="text-muted-foreground">{t('Code', 'الكود')}</span>
            <div className="mt-1 flex gap-2">
              <Input required dir="ltr" className="font-mono uppercase tracking-wider" value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} maxLength={32} />
              <Button type="button" variant="outline" size="icon" onClick={() => setForm({ ...form, code: randomCode() })} aria-label={t('Make a random code', 'اعمل كود عشوائي')}>
                <Wand2 className="w-4 h-4" />
              </Button>
            </div>
          </label>

          <div>
            <span className="text-sm text-muted-foreground">{t('Discount', 'الخصم')}</span>
            <div className="mt-1 flex gap-2">
              <div role="radiogroup" className="inline-flex p-1 rounded-xl glass-surface border border-border gap-1 shrink-0">
                {(['percent', 'fixed'] as const).map((k) => (
                  <button key={k} type="button" role="radio" aria-checked={form.discount_type === k}
                    onClick={() => setForm({ ...form, discount_type: k })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${form.discount_type === k ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                    {k === 'percent' ? '%' : '$'}
                  </button>
                ))}
              </div>
              <Input required type="number" min={0.01} step="0.01" max={form.discount_type === 'percent' ? 100 : undefined} dir="ltr"
                aria-label={t('Discount amount', 'قيمة الخصم')} placeholder={form.discount_type === 'percent' ? '10' : '5'} value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </div>
          </div>

          <label className="block text-sm">
            <span className="text-muted-foreground">{t('Works on', 'ينفع على')}</span>
            <select value={form.applies_to} onChange={(e) => setForm({ ...form, applies_to: e.target.value as any })}
              className="mt-1 w-full h-11 px-3 rounded-md border border-border glass-card text-sm">
              <option value="all">{t('Lessons and packages', 'الحصص والباقات')}</option>
              <option value="lessons">{t('Single lessons only', 'الحصص المفردة بس')}</option>
              <option value="packages">{t('Packages only', 'الباقات بس')}</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-muted-foreground">{t('Total uses (empty = no limit)', 'عدد الاستخدامات (فاضي = مفتوح)')}</span>
              <Input type="number" min={1} step={1} dir="ltr" className="mt-1" value={form.max_redemptions}
                onChange={(e) => setForm({ ...form, max_redemptions: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">{t('Uses per family', 'مرات لكل عيلة')}</span>
              <Input type="number" min={1} step={1} dir="ltr" className="mt-1" value={form.max_per_account}
                onChange={(e) => setForm({ ...form, max_per_account: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">{t('Starts (optional)', 'يبدأ (اختياري)')}</span>
              <Input type="date" dir="ltr" className="mt-1" value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">{t('Ends (optional)', 'ينتهي (اختياري)')}</span>
              <Input type="date" dir="ltr" className="mt-1" value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </label>
            <label className="block text-sm col-span-2">
              <span className="text-muted-foreground">{t('Minimum order in USD (optional)', 'أقل مبلغ بالدولار (اختياري)')}</span>
              <Input type="number" min={0} step="0.5" dir="ltr" className="mt-1" value={form.min_amount_usd}
                onChange={(e) => setForm({ ...form, min_amount_usd: e.target.value })} />
            </label>
          </div>

          <label className="flex items-center justify-between gap-3 text-sm">
            <span>{t('First purchase only', 'لأول شراء بس')}</span>
            <input type="checkbox" className="w-5 h-5 accent-primary" checked={form.first_purchase_only}
              onChange={(e) => setForm({ ...form, first_purchase_only: e.target.checked })} />
          </label>
          <label className="flex items-start justify-between gap-3 text-sm">
            <span>
              {t('Gift code', 'كود هدية')}
              <span className="block text-xs text-muted-foreground">
                {t('Goes past the savings cap. Use it for gifts and grants, e.g. 100% for a free lesson.', 'بيعدّي الحد الأقصى للتوفير. للهدايا والمنح، زي 100% لحصة ببلاش.')}
              </span>
            </span>
            <input type="checkbox" className="w-5 h-5 accent-primary mt-0.5" checked={form.is_gift}
              onChange={(e) => setForm({ ...form, is_gift: e.target.checked })} />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">{t('Note for the team (optional)', 'ملاحظة للفريق (اختياري)')}</span>
            <Input className="mt-1" maxLength={500} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </label>

          {preview && (
            <p className="text-sm rounded-xl bg-secondary/10 border border-secondary/25 px-3.5 py-2.5 text-foreground">
              <span className="font-mono font-bold" dir="ltr">{form.code || '—'}</span>: {preview}
            </p>
          )}
          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>{t('Cancel', 'إلغاء')}</Button>
            <Button type="submit" isLoading={saving}>{t('Create code', 'اعمل الكود')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
