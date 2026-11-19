import React from 'react';
import { Play } from 'lucide-react';

/**
 * The homepage film (docs/marketing/HOMEPAGE-INTRO-FILM.md, v6, 2026-11-19): made the way our social Shorts are
 * (the Remotion reel engine, composition RFilm on the content branch): hard cuts, colour fields, slammed lines, 3D
 * Zad, kinetic captions, few pictures. One upright 9:16 video on every screen, so a phone never has to turn.
 * Only the cover image loads with the page; the video loads when it is played.
 */

/** Zad's travel bag: crimson leather, gold stitching, the khatam clasp. */
export function Bag() {
  return (
    <svg viewBox="0 0 210 190" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id="hero-bag-leather" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D3363C" /><stop offset="1" stopColor="#951419" /></linearGradient>
      </defs>
      <path d="M70 66c0-38 70-38 70 0" fill="none" stroke="#951419" strokeWidth="10" strokeLinecap="round" />
      <rect x="18" y="66" width="174" height="118" rx="26" fill="url(#hero-bag-leather)" />
      <rect x="28" y="76" width="154" height="98" rx="20" fill="none" stroke="#F6D58E" strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="5 5" />
      <path d="M34 70 H176" stroke="#F6D58E" strokeWidth="4" strokeDasharray="3 3" />
      <path d="M18 92c0-14 12-26 26-26h122c14 0 26 12 26 26v14c0 4-3 7-7 8l-80 18-80-18c-4-1-7-4-7-8z" fill="url(#hero-bag-leather)" />
      <path d="M30 100c0-9 7-16 16-16h118c9 0 16 7 16 16v4l-75 17-75-17z" fill="none" stroke="#F6D58E" strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="5 5" />
      <g transform="translate(105 122)">
        <rect x="-13" y="-13" width="26" height="26" rx="4" fill="#E5A93C" />
        <rect x="-13" y="-13" width="26" height="26" rx="4" fill="#E5A93C" transform="rotate(45)" />
        <circle r="5.5" fill="#951419" />
      </g>
    </svg>
  );
}

export const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")";

export function IntroFilm({ isEn }: { isEn: boolean }) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const lang = isEn ? 'en' : 'ar';
  // A language switch goes back to the cover in the new language.
  React.useEffect(() => { setPlaying(false); }, [isEn]);
  React.useEffect(() => { if (playing) void ref.current?.play().catch(() => {}); }, [playing]);

  return (
    <figure className="relative mx-auto w-full" aria-label={isEn ? 'Our story in a minute' : 'قصتنا في دقيقة'}>
      <div className="relative overflow-hidden aspect-[9/16] rounded-[1.75rem] sm:rounded-[2.25rem] ring-1 ring-[#F6D58E]/25 shadow-[0_40px_90px_-40px_rgba(28,20,17,0.75)] bg-[#0E0907]">
        {playing ? (
          // Film: loads only now.
          <video
            ref={ref}
            key={lang}
            className="absolute inset-0 h-full w-full object-cover"
            src={`/media/intro-film/${lang}-reel-v6.mp4`}
            poster={`/media/intro-film/cover-${lang}-916.webp`}
            preload="none"
            playsInline
            controls
            onEnded={() => setPlaying(false)}
          />
        ) : (
          // Cover: one image (the hook and Zad are in it), with a play button on top.
          <button
            id="intro-film-play"
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 grid place-items-center focus-visible:outline-none"
            aria-label={isEn ? 'Play our story, one minute, with sound' : 'شغّل قصتنا، دقيقة بالصوت'}
          >
            <img src={`/media/intro-film/cover-${lang}-916.webp`} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="relative grid place-items-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#FAF7F2]/15 ring-1 ring-[#FAF7F2]/40 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105 group-active:scale-95 group-focus-visible:ring-4 group-focus-visible:ring-[#E5A93C]/70">
              <span aria-hidden="true" className="absolute inset-0 rounded-full ring-2 ring-[#F6D58E]/60 animate-ping [animation-duration:2.4s]" />
              <span className="grid place-items-center w-14 h-14 sm:w-[4.2rem] sm:h-[4.2rem] rounded-full bg-[linear-gradient(145deg,#E3343A,#951419)] text-[#FAF7F2] shadow-[0_12px_30px_-6px_rgba(197,31,36,0.9),inset_0_1px_1px_rgba(255,255,255,0.35)]">
                <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current translate-x-[2px]" aria-hidden="true" />
              </span>
            </span>
          </button>
        )}
      </div>
    </figure>
  );
}
