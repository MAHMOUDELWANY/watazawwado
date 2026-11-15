# XP design system

Owner, 2026-11-15: one look for points wherever a child sees them. Components live in `src/components/xp/Xp.tsx`. The first user is the companion card on the child's progress page (`src/components/companion/CompanionDemo.tsx`, demo mode).

## Tokens

The components use only the site tokens, so the light and dark themes both work:

| Use | Token |
|---|---|
| Coin, chips, unlocked borders | `--gold`, `--gold-soft` (text on dark), `--gold-deep` (text on light) |
| Progress fill | `--crimson` → `#E0672E` → `--gold` (follows the reading direction) |
| Achievement icons | `--copper` on a gold-tinted disc |
| Current stage | `--crimson` dot with a `--gold` ring |
| Track, locked tiles | `--foreground` at 6–9 %, dashed `--border` |

There is no green. Progress never uses teal either, so it never reads as "success / done".

## Parts

- **XpCoin**: a gold disc with the khatam star struck into it. It is the only symbol for points; there are no stars, gems or flames.
- **XpCount**: the coin, the number (tabular figures) and "XP". `chip` is used inline; `hero` sits at the top of the companion card. The number springs in when it changes.
- **XpGain**: a "+N" pill that rises from the count and fades out, once per gain.
- **XpBar**: progress to the next milestone, with a light sweep along the fill and a coin at the goal. The caption says what is next ("12 points until the egg hatches", "18 points to Twirl").
- **StageTrack**: the five growth stages (egg, hatched, small, growing, grown). Done stages are gold, the current one is crimson with a gold ring, and later ones are faint.
- **AchievementTile**: what a teacher gives after a lesson. It has an icon on a sand disc with a gold ring, the label, and "+N" with a coin.
- **UnlockTile**: a dance or other unlock. An open tile plays its dance. A locked tile has a dashed border, a lock icon and the XP it needs.
- **DemoChip**: a dashed copper "Demo" label on anything that runs on made-up points.

## Motion

- Spring in, ease out.
- Nothing loops except the light sweep on the bar, which plays every four seconds.
- With reduced motion, the "+N" only fades.
- A level-up shows a toast over the 3D stage and confetti, then plays the new dance.

## Rules

- The XP total never goes down.
- Real XP is computed on the server from what the teacher records. The demo keeps made-up XP in `localStorage` (`demo-hoopoe-xp`) and is labelled "Demo".
