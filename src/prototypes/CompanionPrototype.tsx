import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { BookCheck, Gift, Heart, Mic, Star, Target } from 'lucide-react';
import { Button } from '../components/ui/Button';
import FocusTrap from '../components/FocusTrap';
import { hideBootSplash } from '../lib/bootSplash';
import { cn } from '../lib/utils';
import { ChestOpen } from '../components/rewards/ChestOpen';

const Companion3D = React.lazy(() => import('./Companion3D'));
// 3D models made with Meshy (free plan output is CC BY 4.0: credit Meshy if shipped).
const MODEL_3D: Partial<Record<Animal, string>> = { hoopoe: '/prototypes/companions/3d/hoopoe.glb' };

/**
 * DEV-ONLY throwaway spike (route /prototype/companion): a child's companion that grows with lesson points.
 * Nothing is saved; the art is the owner's concept sheets cut into stages (public/prototypes/companions).
 */

type Animal = 'hoopoe' | 'camel' | 'fennec';
const ANIMALS: { id: Animal; name: string; fact: string }[] = [
  { id: 'hoopoe', name: 'الهدهد', fact: 'الهدهد مذكور في القرآن في سورة النمل، في قصة نبي الله سليمان عليه السلام.' },
  { id: 'camel', name: 'الجمل', fact: 'الجمل يمشي أياماً في الصحراء من غير ماء، وذُكرت الإبل في سورة الغاشية.' },
  { id: 'fennec', name: 'الفنك', fact: 'الفنك أصغر ثعلب في العالم، وأذناه الكبيرتان تبرّدان جسمه في حر الصحراء.' },
];
// XP needed to reach each stage. About 14 XP a week (two lessons) reaches the last stage in roughly 9 months.
export const STAGE_XP = [0, 12, 70, 220, 520];
const STAGE_NAME = ['في البيضة', 'خرج للدنيا', 'صغير', 'فتى', 'كبر واشتد'];
const STAGE_HEIGHT = [34, 44, 58, 72, 88]; // % of the stage box, keeps the relative sizes of the art
const LESSON = [
  { id: 'recite', label: 'سمّع حلو', icon: Mic, xp: 1 },
  { id: 'focus', label: 'مركّز طول الحصة', icon: Target, xp: 1 },
  { id: 'homework', label: 'عمل الواجب', icon: BookCheck, xp: 1 },
  { id: 'manners', label: 'أدب وحسن استماع', icon: Heart, xp: 1 },
  { id: 'big', label: 'مهمة الأسبوع: صلواته كلها', icon: Star, xp: 10 },
];
const FRIEND_WEEK_XP = 9;

export const stageFor = (xp: number) => STAGE_XP.reduce((s, need, i) => (xp >= need ? i : s), 0);

export default function CompanionPrototype() {
  const still = useReducedMotion();
  const [animal, setAnimal] = useState<Animal>('hoopoe');
  const [xp, setXp] = useState(0);
  const [weekXp, setWeekXp] = useState(0);
  const [given, setGiven] = useState<string[]>([]);
  const [burst, setBurst] = useState<{ key: number; xp: number } | null>(null);
  const [card, setCard] = useState(false);
  const [view3d, setView3d] = useState(false);
  const [chest, setChest] = useState<'shut' | 'opening' | 'open'>('shut');
  useEffect(() => { hideBootSplash(); }, []);

  const stage = stageFor(xp);
  const next = STAGE_XP[stage + 1];
  const progress = next ? (xp - STAGE_XP[stage]) / (next - STAGE_XP[stage]) : 1;
  const info = ANIMALS.find((a) => a.id === animal)!;

  const add = (amount: number, week = true) => {
    if (stageFor(xp + amount) > stage) setCard(true);
    setXp((v) => v + amount);
    if (week) setWeekXp((v) => v + amount);
    setBurst({ key: Date.now(), xp: amount });
  };
  const award = (id: string, amount: number) => {
    if (given.includes(id)) return;
    setGiven((g) => [...g, id]);
    add(amount);
  };

  return (
    <div className="min-h-[100svh] bg-background text-foreground" dir="rtl" lang="ar">
      <main className="mx-auto max-w-[460px] px-4 pb-16 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-editorial text-[24px] tracking-tight">رفيقي</p>
          <div className="flex gap-1 rounded-xl border border-border p-1">
            {ANIMALS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAnimal(a.id)}
                className={cn('rounded-lg px-3 py-1.5 text-sm', animal === a.id ? 'bg-crimson text-crimson-foreground' : 'text-muted-foreground')}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        <section className="relative mt-4 h-[340px] overflow-hidden rounded-3xl border border-border bg-[radial-gradient(120%_90%_at_50%_100%,#F3DDBB_0%,#FAF1E2_55%,#FAF7F2_100%)]">
          <div className="absolute inset-x-0 bottom-7 mx-auto h-5 w-44 rounded-[50%] bg-[#7A4A22]/20 blur-md" />
          {view3d && MODEL_3D[animal] ? (
            <div className="absolute inset-0">
              <React.Suspense fallback={<p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">بيحمّل…</p>}>
                <Companion3D url={MODEL_3D[animal]!} still={!!still} />
              </React.Suspense>
            </div>
          ) : (
          <AnimatePresence initial={false}>
            <motion.div
              key={`${animal}-${stage}`}
              className="absolute inset-x-0 bottom-8 flex justify-center"
              style={{ height: `${STAGE_HEIGHT[stage]}%` }}
              initial={{ opacity: 0, scale: 0.7, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.15, filter: 'blur(8px)' }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            >
              <motion.img
                key={burst?.key ?? 'idle'}
                src={`/prototypes/companions/${animal}-${stage + 1}.webp`}
                alt={`${info.name}، ${STAGE_NAME[stage]}`}
                className="h-full w-auto select-none"
                style={{ transformOrigin: '50% 100%' }}
                draggable={false}
                initial={burst ? { y: 0, scaleY: 0.94, scaleX: 1.05 } : false}
                animate={
                  still
                    ? { y: 0, scaleX: 1, scaleY: 1 }
                    : stage === 0
                      ? { rotate: [0, -3, 3, -2, 0], y: 0, scaleX: 1, scaleY: 1 }
                      : { y: [0, burst ? -26 : -3, 0], scaleY: [1, 1.03, 1], scaleX: [1, 0.985, 1] }
                }
                transition={
                  burst && stage > 0
                    ? { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
                    : { duration: stage === 0 ? 2.4 : 3.2, repeat: Infinity, ease: 'easeInOut' }
                }
                onAnimationComplete={() => burst && setBurst(null)}
              />
            </motion.div>
          </AnimatePresence>
          )}
          <AnimatePresence>
            {burst && (
              <motion.span
                key={burst.key}
                className="absolute left-1/2 top-16 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-sm font-semibold text-[#3A2408]"
                initial={{ opacity: 0, y: 14, scale: 0.8 }}
                animate={{ opacity: 1, y: -10, scale: 1 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
              >
                +{burst.xp} XP
              </motion.span>
            )}
          </AnimatePresence>
          {MODEL_3D[animal] && (
            <button onClick={() => setView3d((v) => !v)} className="absolute left-4 top-3 z-10 rounded-full bg-background/80 px-3 py-1 text-xs">
              {view3d ? 'صورة' : 'مجسم 3D'}
            </button>
          )}
          <p className="absolute right-4 top-3 rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground">
            {info.name} · {STAGE_NAME[stage]}
          </p>
        </section>

        <section className="mt-3 rounded-2xl border border-border p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-muted-foreground">نقاطي</p>
            <p className="font-display text-xl tabular-nums" dir="ltr">{xp} XP</p>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <motion.div className="h-full rounded-full bg-crimson" animate={{ width: `${progress * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {next ? `فاضل ${next - xp} نقطة والرفيق يكبر` : 'وصل لآخر مرحلة. النقاط الجاية تفتح له زينة جديدة.'}
          </p>
        </section>

        <section className="mt-3 rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="font-display">بعد الحصة</p>
            <Button variant="ghost" size="sm" onClick={() => setGiven([])}>حصة جديدة</Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">المعلم يضغط على اللي اتحقق في الحصة.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LESSON.map(({ id, label, icon: Icon, xp: amount }) => {
              const done = given.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => award(id, amount)}
                  disabled={done}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm transition-micro active:scale-[0.97]',
                    done ? 'border-teal-border bg-teal-light text-teal' : 'border-border hover:bg-surface-subtle',
                  )}
                >
                  <Icon size={16} aria-hidden />
                  {label}
                  <span className="tabular-nums text-muted-foreground">+{amount}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-3 rounded-2xl border border-border p-4">
          <p className="font-display">تحدي الأسبوع</p>
          <p className="mt-1 text-xs text-muted-foreground">يتحسب بنقاط الأسبوع ده بس، فاللي بدأ متأخر يقدر يكسب.</p>
          {[{ who: 'أنا', value: weekXp, tone: 'bg-crimson' }, { who: 'صاحبي', value: FRIEND_WEEK_XP, tone: 'bg-teal' }].map((row) => (
            <div key={row.who} className="mt-3 flex items-center gap-3">
              <span className="w-12 text-sm">{row.who}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <motion.div className={cn('h-full rounded-full', row.tone)} animate={{ width: `${Math.min(100, (row.value / 14) * 100)}%` }} />
              </div>
              <span className="w-8 text-sm tabular-nums">{row.value}</span>
            </div>
          ))}
          <Button
            className="mt-4 w-full"
            variant={weekXp > FRIEND_WEEK_XP && chest === 'shut' ? 'primary' : 'outline'}
            disabled={weekXp <= FRIEND_WEEK_XP || chest !== 'shut'}
            onClick={() => setChest('opening')}
          >
            <Gift size={18} className="me-2" aria-hidden />
            {chest === 'open' ? 'فتحت الصندوق: +5 XP' : weekXp > FRIEND_WEEK_XP ? 'كسبت التحدي، افتح الصندوق' : 'الصندوق يتفتح للي يكسب'}
          </Button>
        </section>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>للتجربة بس:</span>
          <Button variant="outline" size="sm" onClick={() => add(40, false)}>تقديم شهر (+40)</Button>
          <Button variant="outline" size="sm" onClick={() => setChest('opening')}>جرّب الصندوق</Button>
          <Button variant="outline" size="sm" onClick={() => { setXp(0); setWeekXp(0); setGiven([]); setChest('shut'); }}>من الأول</Button>
        </div>
      </main>

      <AnimatePresence>
        {chest === 'opening' && (
          <ChestOpen
            rarity="rare"
            upgrade
            reward={{ title: 'فانوس ذهبي لرفيقك', xp: 5, image: '/prototypes/companions/item-lantern.webp' }}
            onDone={() => { setChest('open'); add(5, false); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {card && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCard(false)}
          >
            <FocusTrap onEscape={() => setCard(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="الرفيق كبر"
              className="w-full max-w-[420px] rounded-3xl border border-border bg-background p-6 text-center"
              initial={{ y: 40, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm text-gold">ما شاء الله</p>
              <p className="mt-1 font-editorial text-[24px]">{info.name} {STAGE_NAME[stage]}</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{info.fact}</p>
              <Button className="mt-5 w-full" onClick={() => setCard(false)} autoFocus>تمام</Button>
            </motion.div>
            </FocusTrap>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
