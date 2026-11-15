import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  BookOpen, CircleCheck, Hand, HandHeart, Heart, HeartHandshake, Lightbulb, Medal, Moon, PartyPopper, Pause, Play,
  Pointer, Rocket, RotateCw, Search, Sparkles, MessageCircleQuestion,
} from 'lucide-react';
import { hideBootSplash } from '../lib/bootSplash';
import { cn } from '../lib/utils';
import { ZadModel, type ZadEmote } from '../components/mascots/Zad3D';
import Stage3D from '../components/mascots/Stage3D';

/**
 * DEV-ONLY spike (route /prototype/zad3d): Zad in 3D. Nobody steers Zad: the site places him and plays the moves
 * that fit each place (owner, 2026-11-13). Pick a place to watch its moves loop, or tap a move.
 */

type Move = Exclude<ZadEmote, 'idle'>;
const MOVES: Record<Move, { label: string; icon: React.ComponentType<{ size?: number }> }> = {
  wave: { label: 'سلام', icon: Hand },
  bow: { label: 'أهلاً بيك', icon: HeartHandshake },
  point: { label: 'يشاور', icon: Pointer },
  think: { label: 'بيفكر', icon: Lightbulb },
  read: { label: 'بيقرأ', icon: BookOpen },
  cheer: { label: 'يحتفل', icon: PartyPopper },
  clap: { label: 'يصقّف', icon: Sparkles },
  proud: { label: 'فخور بيك', icon: Medal },
  spin: { label: 'دوّامة', icon: RotateCw },
  check: { label: 'تمام', icon: CircleCheck },
  love: { label: 'بيحبك', icon: Heart },
  dash: { label: 'ينطلق', icon: Rocket },
  search: { label: 'بيدوّر', icon: Search },
  oops: { label: 'مش لاقي', icon: MessageCircleQuestion },
  dua: { label: 'يدعي', icon: HandHeart },
  sleep: { label: 'نايم', icon: Moon },
};

const PLACES: { id: string; label: string; where: string; moves: Move[] }[] = [
  { id: 'home', label: 'الرئيسية', where: 'أول ما الزائر يفتح الموقع أو يسجّل دخول', moves: ['wave', 'bow', 'point'] },
  { id: 'tour', label: 'الجولة', where: 'وهو بيعرّف الطالب الجديد على البوابة، خطوة خطوة', moves: ['point', 'think', 'wave'] },
  { id: 'lesson', label: 'أثناء الدرس', where: 'جنب المحتوى وهو بيحمّل، أو والطالب بيذاكر', moves: ['read', 'think'] },
  { id: 'done', label: 'خلّص الدرس', where: 'بعد آخر شريحة أو بعد الاختبار', moves: ['cheer', 'clap', 'proud', 'spin'] },
  { id: 'booked', label: 'تأكيد الحجز', where: 'صفحة نجاح الحجز والدفع', moves: ['check', 'love', 'dash'] },
  { id: 'empty', label: 'مفيش نتائج', where: 'بحث مالقاش حاجة، صفحة فاضية، أو رسالة خطأ', moves: ['search', 'oops'] },
  { id: 'dua', label: 'الدعاء', where: 'قبل بداية الحفظ وبعد ختم سورة', moves: ['dua', 'bow'] },
  { id: 'away', label: 'غياب', where: 'لما الطالب يسيب الصفحة مفتوحة فترة من غير ما يعمل حاجة', moves: ['sleep'] },
  { id: 'all', label: 'كل الحركات', where: 'الحركات الستاشر كلها', moves: Object.keys(MOVES) as Move[] },
];

export default function Zad3DPrototype() {
  const still = !!useReducedMotion();
  const [emote, setEmote] = useState<ZadEmote>('idle');
  const [startedAt, setStartedAt] = useState(0);
  const [placeId, setPlaceId] = useState('home');
  const [auto, setAuto] = useState(true);
  const next = useRef(0);
  const clockRef = useRef<() => number>(() => 0);
  useEffect(() => { hideBootSplash(); }, []);
  const place = PLACES.find((p) => p.id === placeId)!;

  const play = (id: ZadEmote) => { setEmote(id); setStartedAt(clockRef.current()); };

  // in a place, Zad loops through its moves with a short rest between them, as he would on the site
  useEffect(() => {
    if (!auto || still || emote !== 'idle') return;
    const timer = setTimeout(() => {
      play(place.moves[next.current % place.moves.length]);
      next.current++;
    }, next.current === 0 ? 500 : 1400);
    return () => clearTimeout(timer);
  }, [auto, still, emote, place]);

  return (
    <div className="min-h-[100svh] bg-[#1C120D] text-[#FBF0DA]" dir="rtl" lang="ar">
      <main className="mx-auto flex max-w-[520px] flex-col px-4 pb-10 pt-4">
        <div className="flex items-baseline justify-between">
          <p className="font-editorial text-[26px]">زاد</p>
          <a href="/prototype/hoopoe3d" className="text-xs text-[#EDB54C] underline-offset-4 hover:underline">الهدهد ورقصاته ←</a>
        </div>

        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {PLACES.map((p) => (
            <button
              key={p.id}
              onClick={() => { setPlaceId(p.id); next.current = 0; setAuto(true); setEmote('idle'); }}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-micro active:scale-[0.96]',
                p.id === placeId ? 'border-[#EDB54C] bg-[#EDB54C] text-[#2A1610]' : 'border-white/10 bg-white/5 hover:bg-white/10',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <section className="relative mt-3 h-[min(58svh,440px)] overflow-hidden rounded-3xl bg-[radial-gradient(80%_65%_at_50%_45%,#8A4128_0%,#4A2418_45%,#24140E_80%,#1C120D_100%)]">
          <Stage3D still={still} onClock={(now) => { clockRef.current = now; }}>
            <ZadModel emote={emote} startedAt={startedAt} onDone={() => setEmote('idle')} still={still} />
          </Stage3D>
          <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-[#C9B8A3]">اسحب عشان تلفّه، واضغط عليه</p>
        </section>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{place.label}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#C9B8A3]">{place.where}</p>
          </div>
          {!still && (
            <button
              onClick={() => setAuto((a) => !a)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
            >
              {auto ? <Pause size={14} /> : <Play size={14} />}
              {auto ? 'إيقاف التلقائي' : 'تشغيل تلقائي'}
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {place.moves.map((id) => {
            const { label, icon: Icon } = MOVES[id];
            return (
              <button
                key={id}
                onClick={() => { setAuto(false); play(id); }}
                className={cn(
                  'flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border text-sm transition-micro active:scale-[0.96]',
                  emote === id ? 'border-[#EDB54C] bg-[#EDB54C]/15 text-[#FFE7A8]' : 'border-white/10 bg-white/5 hover:bg-white/10',
                )}
              >
                <Icon size={22} />
                {label}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
