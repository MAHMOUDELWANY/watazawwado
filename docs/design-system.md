# Watazawwado design system

Glass, calm and precise. Apple-style layered translucent surfaces, soft depth, generous space and crisp type, in our palette and our motifs (khatam star, mihrab arch, logo ribbon). This file is the source of truth (RULES.md 6b). The tokens and classes live in `src/index.css`, section "GLASS DESIGN SYSTEM 2026-10". The motifs are in the "PUBLIC REDESIGN" section just above it.

## 1. Colour roles

| Role | Light | Dark | Use |
|---|---|---|---|
| Crimson (`--crimson`, `--primary`) | #C51F24 | #E82C32 | The one main action per view, the brand mark, errors |
| Teal (`--teal`, `--focus`) | #087D91 | #12A4BC | Links, selected states, focus rings, calm accents |
| Copper (`--copper`, `--accent`) | #8B4935 | #DA7960 | Warmth, secondary accents, shadow tint |
| Gold (`--gold`, `--gold-soft`, `--gold-deep`) | #E5A93C / #F6D58E / #B9782A | #F0B54A | Light, highlights, emblems, never for body text on paper |
| Paper (`--background`) | #FAF7F2 | #110F0E | Page background |
| Surface (`--surface`, `--surface-subtle`, `--surface-warm`) | #FFFFFF / #F6F1EA / #EFE7DC | #1B1816 / #24201D / #2E2824 | Opaque cards, alternating bands |
| Text (`--foreground`, `--muted-foreground`) | #12100E / #453D34 | #FAF7F2 / #C4B9AA | Body and secondary text (both pass AA, mostly AAA) |
| Deep band (`.band-deep`) | #05363F → #3B2219 | same | Closing calls to action, door portals |

Rules: crimson for one thing per screen. Gold is light, not ink. Use the CSS variables, not hex, in shared UI, so dark mode switches on its own. Literal hex is fine inside illustrations, which look the same in both themes.

## 2. Glass surfaces

Each level has translucency, a backdrop blur, a hairline border, a 1px inner highlight on the top edge, and a layered soft shadow tinted with copper (black in dark mode).

| Class | Fill (light / dark) | Blur | Shadow | Use for |
|---|---|---|---|---|
| `.glass-1` | white 52% / espresso 50% | 10px | `--shadow-1` | Chips, quiet tiles, pills, inline badges on images |
| `.glass-2` | white 66% / espresso 64% | 18px | `--shadow-2` | Cards, panels, door frames, dashboard widgets |
| `.glass-3` | paper 80% / espresso 80% | 28px | `--shadow-3` | Nav bar, mobile tab bar, sheets, dialogs, OTP card |
| `.glass-deep` | deep teal 55% | 18px | dark | Content over a dark band or photo (paper text) |

- Tokens: `--glass-1..3`, `--glass-blur-1..3`, `--glass-hairline`, `--glass-highlight`, `--glass-solid`, `--shadow-1..3`.
- Glass needs something behind it. Put it over `.khatam-field`, `.brand-lights`, a photo or a deep band, not over flat paper (there it only looks grey).
- Fallbacks are built in. Without `backdrop-filter`, or with `prefers-reduced-transparency`, glass becomes the opaque `--glass-solid`.
- Performance: no more than about 6 blurred surfaces on screen at once. Don't animate the size of a blurred element; move it with `transform`.
- The older `.glass-card`, `.glass-surface`, `.glass-panel` and `.glass-dialog` are opaque and stay for existing screens. New work uses the levels above.

## 3. Radius and shapes

| Token | Value | Use |
|---|---|---|
| `--r-1` | 10px | Inputs inside dense UI, small chips |
| `--r-2` | 14px | Buttons, inputs, OTP cells, list rows |
| `--r-3` | 20px | Cards, panels |
| `--r-4` | 28px | Sheets, dialogs, the mobile tab bar |
| `--r-5` | 36px | Hero panels, big bands (`rounded-[2rem]` today) |
| `--r-pill` | 999px | Pills, segmented controls, avatars |

Arches (our signature, use them for things that "contain" a person or a place):
- `.arch-top`: a large card with a mihrab top (the homepage "one home" cards).
- `.arch-tile`: an icon tile with an arch top.
- `.door-arch`: a narrow door, about 160px wide.
- `.door-card` + `.door-portal`: a glass door frame with a semicircle top that follows its width (needs a `.door-slot` parent), holding a deep portal (5:6 ratio). Set `--door-a` / `--door-b` for the portal gradient.
- Nested shapes are concentric: inner radius = outer radius minus the padding.

## 4. Type (Thmanyah)

- Display: `font-editorial` (Thmanyah Serif Display). Body: Thmanyah Sans (the default).
- Arabic headings use `font-bold`. English headings use `font-medium tracking-tight`.

| Step | Size (mobile → desktop) | Line height | Use |
|---|---|---|---|
| Display | 2.6rem → 4rem | 1.12 | Home h1 only |
| H1 | 2.25rem → 3.75rem | 1.15 | Page heroes (`PageHero`) |
| H2 | 1.75rem → 2.5rem | 1.25 | Section titles (`editorial-heading`) |
| H3 | 1.25rem → 1.5rem | 1.3 | Card titles |
| Body L | 1.125rem → 1.25rem | 1.65 | Intros |
| Body | 1rem | 1.6 | Text |
| Small | 0.875rem | 1.5 | Meta, helper text |
| Micro | 0.78rem | 1.4 | Pills, tab bar labels (never smaller) |

Lines stay under about 70 characters (`max-w-xl`/`max-w-2xl`). No all-caps labels and no eyebrows above every heading. Quranic verses use Amiri Quran (loaded per page for those letters only). Every English page that shows a verse shows its meaning under it.

## 5. Spacing and layout

- 4px base. Steps in use: 4, 8, 12, 16, 20, 24, 32, 40, 56, 80, 112.
- Page side padding: `public-container` (16px on phones). Sections: `public-section` vertical rhythm.
- Mobile first. No horizontal page scroll. Grids go 2 → 3 → 6 columns.
- Always logical properties: `ms/me/ps/pe/start/end`, `inset-inline-*`. Arrows flip in RTL (`rtl:-scale-x-100` or the `[dir="rtl"]` rule).

## 6. Motion

| Token | Value | Use |
|---|---|---|
| `--dur-tap` | 120ms | Press feedback |
| `--dur-ui` | 220ms | Colour and border changes, toggles |
| `--dur-move` | 420ms | Lifts, sheets, cards moving |
| `--dur-scene` | 700ms | One page-level entrance |
| `--ease-out-soft` | cubic-bezier(.22,1,.36,1) | Things arriving |
| `--ease-in-out-soft` | cubic-bezier(.65,0,.35,1) | Idle loops |

When motion is allowed:
1. As an answer to the person: press, hover, open, confirm, swap.
2. One orchestrated moment per page (the hero entrance, the rotating subject word).
3. Small idle life inside illustrations: `.emblem-glow` (breathing light, 6s), `.emblem-flicker` (flame), `.emblem-twinkle` (sparks), `.emblem-float` (3px drift).

Never: scroll-jacking, parallax on text, more than one looping thing in the reading area, motion that blocks reading. `prefers-reduced-motion` turns all of it off. The global rule in `index.css` does this, the emblem classes have an explicit `animation: none`, and in motion/react check `useReducedMotion()`.

## 7. Iconography

- Content and navigation use **custom emblems**, not generic line icons. The emblems are in `src/components/public/emblems/DoorEmblems.tsx` (`MushafEmblem`, `PathEmblem`, `TeachersEmblem`, `EnvelopeEmblem`, `LanternEmblem`, `DoorAjarEmblem`).
- How an emblem is drawn: a 96×96 grid, two tones (paper and gold) on a deep brand background, one warm light source, a gold gradient for metal, and no outlines thinner than 1px. Ids come from `useId`, so two copies on one page don't clash. Emblems are decorative (`aria-hidden`), and the link text carries the meaning.
- lucide-react stays only for small functional UI glyphs (check, close, chevron, volume, menu), at 16–20px, in `currentColor`.
- New emblems follow the same recipe. Ideas for later: one person (learn alone), a family under one arch, a calendar as a lantern string, a certificate as a scroll with a khatam seal.

## 8. Core components

**Buttons**
- Primary: `PublicButton variant="primary"` (public pages) or `ui/Button` (portal/dashboard). Crimson, one per view.
- Secondary: `.btn-glass` (add `.is-pill` for a round pill). Ghost: `PublicButton variant="ghost"`.
- Height at least 44px. Press = `scale(.98)`. Focus = a 2px teal outline, offset 3px.

**Cards**: `.glass-2` with `rounded-[var(--r-3)]`, padding 20–28px, plus `.lift` when the whole card is a link. An arch card uses `.arch-top`. Opaque content-heavy cards (tables, long forms) use `ui/Card`.

**Glass panel**: `.glass-2` or `.glass-3` with `rounded-[var(--r-4)]`, over `.khatam-field brand-lights`.

**Nav bar**: `.glass-3` sticky at the top, `rounded-[var(--r-pill)]` on wide screens and full-bleed on phones. The active item uses teal text and a `glass-1` pill.

**Mobile tab bar** (portal and dashboard, phones only):
- A `.tabbar-glass` floating pill, `fixed inset-x-3 bottom-0`, 4–5 items, each at least 48px tall, with a 22px glyph and a 0.78rem label.
- Active item: teal glyph and label, with a `glass-1` capsule behind it (move it with `transform`, 220ms).
- Respects the safe area (built in). Content gets bottom padding equal to the bar height plus 24px.

**Loaders**
- Below 300ms: show nothing. Up to 2s: `.skeleton-glass` blocks shaped like the content. Longer, or a full page: a khatam star drawn in gold that breathes (`emblem-glow` on an SVG star) with one short line ("لحظة…" / "One moment…").
- No generic spinners on public pages.
- Reduced motion: static star, no shimmer.

**Inputs**: `ui/Input`, `ui/Select`, `ui/Textarea`, `rounded-[var(--r-2)]`, opaque surface (never glass behind text you type). Teal focus ring. The error text goes below the field and says how to fix it.

**OTP screen**
- A `.glass-3` card (`rounded-[var(--r-4)]`) over `.khatam-field brand-lights`.
- 6 cells, each 48×56px, `rounded-[var(--r-2)]`, opaque surface, `font-editorial` 1.5rem digits.
- The filled cell gets a teal border. On error the cells shake once, horizontally, 6px (only with motion allowed). On success there is a gold glow.
- `inputMode="numeric"`, `autoComplete="one-time-code"`, digits stay LTR (`dir="ltr"`) inside RTL pages, and pasting fills all cells.

## 9. Do / don't

| Do | Don't |
|---|---|
| One bold thing per section, quiet around it | Glass on everything, glass on glass on glass |
| Glass over pattern, light or photo | Glass over flat paper |
| Copper-tinted layered shadows (`--shadow-*`) | `rgba(0,0,0,.1)` grey shadows |
| Custom emblems for content | Generic line icons as decoration |
| Short copy, warm and plain | Eyebrows, ALL CAPS, `A · B · C` meta strings |
| Logical properties, both directions tested | `left`/`right`, `ml`/`mr` |
| Test light and dark | Hard-coded white text on a surface that flips |

## 10. Accessibility

- Text contrast is at least 4.5:1 (3:1 for 24px+). Glass text sits on `--glass-2` or stronger. Never put body text on `.glass-1` over a busy image.
- Every interactive element shows a visible `:focus-visible` (`.focus-ring`, or the class's built-in outline) and is at least 44×44px.
- Decorative SVG gets `aria-hidden="true"`. Meaning lives in real text. Any text that rotates or animates has a static full version for screen readers (see `HeroSubjects`: `.rotator-static` / `.rotator-live`).
- Respect `prefers-reduced-motion` and `prefers-reduced-transparency`.
- Pages are prerendered: no `window`/`document` at module scope or during render, and h1 text stays in the HTML.
