---
name: WATAZAWWADO-design-system
description: Use for ANY visual or UI work at Watazawwado: new or edited pages, components, screens, emails' look, illustrations, motion, dark mode, RTL, mobile layout, loaders, empty states, "design", "تصميم", "شكل", "UI", "redesign", "polish", "make it beautiful". Holds our identity (palette, glass, arches, Thmanyah, motion tokens, no green, no petrol), the build and review workflow, and how to use the outside design skills without losing our look.
---

# Watazawwado Design System (skill)

Our look is **glass, calm and precise**: Apple-style layered translucent surfaces in our palette and motifs (khatam star, mihrab arch, logo ribbon). The skill is the workflow; the facts live in `docs/design-system.md` (source of truth) and `src/index.css` section "GLASS DESIGN SYSTEM 2026-10".

## 1. Read first

1. `docs/design-system.md` (colour roles, glass levels, radii, type, motion tokens, components, do/don't, accessibility).
2. Root `RULES.md` §6 (RTL logical CSS), §6b ("Design ambition", "How design work is done", "No green, no petrol").
3. `docs/design/INSPIRATION.md` for references by topic; file every new reference the same day. For each owner reference decide first: **copy it, or take inspiration only**, and always use our palette, never the reference's colours.
4. Existing page or component you are changing: read it and the `src/components/ui/*` it should use.
5. Copy on screen goes through `WATAZAWWADO-brand-voice`.

## 2. Hard rules (any one broken = not done)

- **Palette**: crimson #C51F24 (one main action per view), teal #087D91 (links, focus, success), copper #8B4935, sand #D8C6AE, gold as light (never body text on paper), paper by day, espresso by night. **No green anywhere** (success is teal; Tailwind green/emerald/lime are mapped to teal). **Dark surfaces are espresso, never deep teal or petrol.** If `docs/design-system.md` still lists a petrol "deep band", RULES.md wins; fix the doc when you touch it. Only exception: a third party's own logo.
- **Tokens, not hex**, in shared UI, so dark mode switches by itself. Literal hex only inside illustrations.
- **Components**: new or edited UI uses `src/components/ui/*` (Button, Input, Select, Textarea, Card, Badge, Modal). Move a page to them when you change it; no mass rewrite. HeroUI is a reference only: never import it into existing pages.
- **Glass** needs something behind it (`.khatam-field`, `.brand-lights`, a photo, a band); max about 6 blurred surfaces on screen; never animate the size of a blurred element; never glass behind text the user types. New work uses `.glass-1/2/3`, not the old opaque classes.
- **Logical CSS only**: `ms/me/ps/pe/start/end`, never `left/right`. Arrows and progress flip in RTL; logos, photos, media controls, URLs and emails do not. Numbers and OTP digits stay LTR.
- **Type**: Thmanyah Sans body, `font-editorial` display; Arabic headings `font-bold`, English `font-medium tracking-tight`; no negative tracking on Arabic; lines under about 70 characters; micro text never below 0.78rem; no ALL CAPS, no eyebrow above every heading. Quranic verses use Amiri Quran, and an English page shows the meaning under the verse.
- **Icons**: custom emblems (96x96 grid, two tones plus gold, one warm light) for content and navigation; lucide only for small functional glyphs at 16 to 20px.
- **Motion**: answer to the person (press 120 ms, UI 220 ms, move 420 ms, one scene 700 ms), one orchestrated moment per page, small idle life in illustrations. Animate `transform` and `opacity` only. Never scroll-jacking, text parallax, or more than one loop in the reading area. Honour `prefers-reduced-motion` and `prefers-reduced-transparency`; in motion/react use `useReducedMotion()`.
- **Loaders**: under 300 ms nothing; up to 2 s `.skeleton-glass` shaped like the content; longer, the gold breathing khatam with one short line. No generic spinners on public pages.
- **Touch and access**: targets at least 44x44px (tab-bar items 48px), visible `:focus-visible`, contrast 4.5:1 (3:1 for 24px+), decorative SVG `aria-hidden`, meaning in real text, h1 stays in the prerendered HTML, no `window`/`document` at module scope.
- **Zad** (the mascot) appears only in joy moments, small, never in payment, cancel or refund screens, never a human face, no mouth.

## 3. Workflow (every UI task)

1. **Frame it**: who uses this surface (parent, adult learner, child account, teacher, admin), their one task, the one primary action, and the surface mode: *persuade* (public pages: ambition and memorability), *operate* (portal, dashboard, booking, payment: scanability and consistency first, brand in precise details), *read* (docs, reports, legal).
2. **Look before inventing**: open the neighbouring screens and the closest existing component; reuse the pattern. Research references (the inspiration folder, Mobbin/UXKIN MCPs, free libraries; respect licences, no attribution-required asset without attribution). Our own SVG/CSS beats a new dependency. Video references from the owner are read frame by frame with FFmpeg.
3. **Pick one idea**: one focal point per viewport, one bold thing per section with quiet around it. Prototype 2 to 3 looks when the direction is open, then ask the owner to pick; recommend one.
4. **Build** mobile first, phones 390 wide first, then desktop 1440. Grids 2 to 3 to 6 columns. No horizontal page scroll.
5. **Check in the rendered result**, not the source: run the dev server (`preview_start`), then check phone and desktop, light and dark, Arabic and English, keyboard focus, reduced motion. Batch the checks: fix what one look shows before looking again. Signed-in screens are checked locally with the dev-test-accounts launcher, never with real passwords.
6. **Critique with the outside skills, on our terms** (§4), fix the top problem, repeat once.
7. Update `docs/design-system.md` if you added a token, class or component; run `graphify update .`.

## 4. Outside design skills: when to use which (so they serve our look)

| Need | Use | Condition |
|---|---|---|
| Plan a new surface | `impeccable` shape, `brainstorming` | Our palette and `docs/design-system.md` override any palette it proposes |
| Critique or audit a built screen | `impeccable` critique/audit, `audit-ai-design-slop` | Review only, then we edit |
| Stop generic defaults | `no-ai-design-slop`, `taste-skill` | A choice is slop if it could be pasted into any other product |
| Motion feel | `apple-design`, `emil-design-eng`, `animate`, `review-animations`, `animation-performance`, `mobile-native` | Tokens in §2 win over their durations |
| Final pass | `impeccable` polish, `break-ui` | |
| Anything with green, a dark teal band, stock gradients, glass-on-glass, eyebrows, emoji as icons | refuse the suggestion | Our rules above |

## 5. Slop and mistakes to remove on sight

Glass over flat paper; grey `rgba(0,0,0,.1)` shadows (use the copper-tinted `--shadow-*`); decorative line icons; three identical cards in a row as the whole page; centred hero with gradient blob; a second competing crimson button; green or petrol; hard-coded white text on a surface that flips in dark mode; physical `left/right`; text on a busy image without a solid glass level; a spinner; a loop next to a paragraph.

## 6. Done means

Type check passes (`node node_modules/typescript/bin/tsc --noEmit`), the screen was seen at phone and desktop in both themes and both languages with a screenshot, no console errors, reduced motion works, and a short note to the owner (in Arabic) says what changed and shows the screenshot. Design work is verified by evidence, not by claiming it looks right.
