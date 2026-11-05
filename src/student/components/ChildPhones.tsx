import React, { useEffect, useState } from 'react';
import { MonitorSmartphone } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { Button } from '../../components/ui/Button';
import { confirmAction, notify } from '../../components/ui/Feedback';

interface Device { id: string; learnerId: string; learnerName: string | null; name: string; pairedAt: string; lastSeenAt: string | null }
interface Code { learnerName: string; code: string; expiresAt: string }

/**
 * NX-16, Family tab: give a child their own phone. The parent makes a one-time code (15 minutes); the child types it
 * at watazawwado.academy/kid. The child's phone shows only that child's lessons and homework. Removing a phone works at once.
 */
export function ChildPhones({ isAr, children }: { isAr: boolean; children: Array<{ id: string; name: string }> }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [code, setCode] = useState<Code | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => authedJson<{ devices: Device[] }>('/api/student/child-devices').then((d) => setDevices(d.devices)).catch(() => {});
  useEffect(() => { load(); }, []);

  const makeCode = async (child: { id: string; name: string }) => {
    setBusy(child.id);
    try {
      const name = isAr ? `جهاز ${child.name}` : `${child.name}'s device`;
      setCode(await authedJson<Code>('/api/student/child-devices', { method: 'POST', body: JSON.stringify({ learnerId: child.id, name }) }));
    } catch (err: any) {
      notify(err?.status === 409 ? (isAr ? 'احذف جهازًا لم تعد تستخدمه أولًا.' : 'Remove a device you no longer use first.') : (isAr ? 'تعذّر إنشاء رمز، حاول مرة أخرى.' : 'Could not make a code. Please try again.'), 'error');
    } finally { setBusy(null); }
  };

  const remove = async (d: Device) => {
    const ok = await confirmAction(isAr ? `نحذف "${d.name}"؟ سيتوقف فورًا عن فتح الحصص.` : `Remove "${d.name}"? It stops opening the lessons at once.`, { confirmLabel: isAr ? 'احذفه' : 'Remove', danger: true });
    if (!ok) return;
    setBusy(d.id);
    try { await authedJson(`/api/student/child-devices/${d.id}`, { method: 'DELETE' }); await load(); }
    catch { notify(isAr ? 'تعذّر حذف الجهاز، حاول مرة أخرى.' : 'Could not remove the device. Please try again.', 'error'); }
    finally { setBusy(null); }
  };

  if (children.length === 0) return null;
  const locale = isAr ? 'ar-EG' : 'en-GB';
  const when = (iso: string) => new Date(iso).toLocaleString(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

  return (
    <div className="pt-4 border-t border-border space-y-3" data-testid="child-phones">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <MonitorSmartphone className="w-4 h-4 text-accent" aria-hidden="true" />
        <span>{isAr ? 'جهاز خاص بابنك' : "Your child's own device"}</span>
      </h3>
      <p className="text-xs text-muted-foreground">
        {isAr
          ? 'إن كان لدى ابنك هاتف أو جهاز لوحي أو كمبيوتر غير جهازك، يستطيع أن يرى عليه حصصه وواجبه ومراجعته دون بريد ولا كلمة سر. لا يحتوي هذا الجهاز على دفع ولا حجز ولا إعدادات ولا بيانات إخوته.'
          : 'If your child has a phone, tablet or computer other than yours, they can see their lessons, homework and review on it with no email or password. That device has no payments, booking, settings or brothers and sisters.'}
      </p>

      <div className="flex flex-wrap gap-2">
        {children.map((c) => (
          <Button key={c.id} type="button" size="sm" variant="outline" isLoading={busy === c.id} onClick={() => makeCode(c)}>
            {isAr ? `اربط جهاز لـ ${c.name}` : `Link a device for ${c.name}`}
          </Button>
        ))}
      </div>

      {code && (
        <div className="p-4 rounded-xl border border-border glass-surface grid gap-2 text-sm" role="status">
          <span>{isAr ? `على جهاز ${code.learnerName} (موبايل أو تابلت أو كمبيوتر):` : `On ${code.learnerName}'s phone, tablet or computer:`}</span>
          <ol className="list-decimal ps-5 grid gap-1">
            <li>{isAr ? 'افتح موقعنا أو تطبيقنا وروح لصفحة الدخول.' : 'Open our website or app and go to sign in.'}</li>
            <li>{isAr ? 'اضغط «معايا كود من بابا أو ماما».' : 'Tap "I have a code from my parent".'}</li>
            <li>{isAr ? 'اكتب هذا الرمز:' : 'Type this code:'}</li>
          </ol>
          <span className="text-3xl font-bold tracking-[0.3em] tabular-nums text-foreground" dir="ltr">{code.code}</span>
          {/* A copy, not a link: tapping it here would link this (the parent's) browser instead of the child's phone. */}
          <Button
            type="button" size="sm" variant="ghost" className="w-fit"
            onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/kid?code=${code.code}`)
              .then(() => notify(isAr ? 'اتنسخ اللينك، ابعته لجهازه.' : 'Link copied. Send it to their device.'))
              .catch(() => notify(isAr ? 'تعذّر النسخ، اكتب الرمز على جهازه.' : 'Could not copy. Type the code on their device.', 'error'))}
          >
            {isAr ? 'أو انسخ لينك فيه الكود وابعته لجهازه' : 'or copy a link with the code to send to their device'}
          </Button>
          <span className="text-xs text-muted-foreground">
            {isAr ? `يعمل الرمز مرة واحدة حتى ${when(code.expiresAt)}.` : `The code works once, until ${when(code.expiresAt)}.`}
          </span>
        </div>
      )}

      {devices.length > 0 && (
        <ul className="grid gap-2">
          {devices.map((d) => (
            <li key={d.id} className="p-3 rounded-xl border border-border flex items-center justify-between gap-3 text-sm">
              <span className="grid gap-0.5 min-w-0">
                <span className="font-semibold text-foreground truncate">{d.name}</span>
                <span className="text-xs text-muted-foreground">
                  {d.lastSeenAt ? (isAr ? `آخر استخدام ${when(d.lastSeenAt)}` : `Last used ${when(d.lastSeenAt)}`) : (isAr ? `اتربط ${when(d.pairedAt)}` : `Linked ${when(d.pairedAt)}`)}
                </span>
              </span>
              <Button type="button" size="sm" variant="ghost" isLoading={busy === d.id} onClick={() => remove(d)}>{isAr ? 'شيله' : 'Remove'}</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
