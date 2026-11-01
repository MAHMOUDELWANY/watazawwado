---
target: homepage and pricing
total_score: 19
max_score: 32
na_heuristics: 7,9
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\ahmed\\OneDrive\\Desktop\\watazawwado\\.claude\\worktrees\\current-status-progress-3ce994\\src\\components\\public\\pricing\\PricingPage.tsx"
target_fingerprint: "sha256:dd6c0853f9f3720347eb80baf2bb6103e9a823fed9f43f88d39f261196a9ef64"
target_path: "C:\\Users\\ahmed\\OneDrive\\Desktop\\watazawwado\\.claude\\worktrees\\current-status-progress-3ce994\\src\\components\\public\\pricing\\PricingPage.tsx"
timestamp: 2026-11-01T20-37-42Z
slug: src-components-public-pricing-pricingpage-tsx
---
Method: dual-agent (A: design review · B: detector + browser evidence)
Targets: homepage (/, /ar) and /pricing, desktop 1440 and phone 375/390.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | System status | 2 | /pricing opens on a loader, then no prices; cards appear below the fold with no cue |
| 2 | Real world | 3 | Warm plain copy; "Step in", "Committed Learner" vague |
| 3 | Control | 3 | ?subject= kept in URL; toggles work |
| 4 | Consistency | 2 | Footer lists Pricing twice; green WhatsApp breaks palette; package name shown twice |
| 5 | Error prevention | 3 | "No card needed", "nothing renews" |
| 6 | Recognition | 1 | One package price visible at a time; compare from memory |
| 7 | Flexibility | n/a | Persuade surface |
| 8 | Minimalist | 3 | Calm; some thin sections |
| 9 | Error recovery | n/a | No forms |
| 10 | Help | 2 | FAQ and safety only in footer |
| Total | | 19/32 | Acceptable-good |

Design specificity: pass. Arches, ayah interludes with recitation, khatam portals and envelopes are this brand's own. Structure lags the styling: home is a 6-door hub, pricing hides prices.
Deterministic scan: source scan empty (Tailwind not read). Rendered: home 12-13, pricing 4-7 findings, all brand-pinned (ribbon text, CTA glows, teal portals, band-deep) except: pricing paragraph line length (PricingPage.tsx:177), theme toggle overshoot easing (ThemeToggle.tsx:80, advisory), Learning Guide FAB second glow (LearningGuide.tsx:103). body-text-viewport-edge = false positive (16px gutter rule).

Priority issues:
- [P0] /pricing shows no prices at rest: subject defaults to null (PricingPage.tsx:109-110, 147); prices hide inside envelopes until hover/centre (EnvelopeCard.tsx). Fix: default band, 2-way $9/$13 switch, all three prices visible at rest; envelope as flourish only.
- [P1] Phone: one package open at a time, no comparison. Fix: compact 3-row comparison on touch.
- [P1] Child safety and trust not shown at the decision moment (home hero, next to packages). Fix: short safety block with links; one credential line per teacher (only facts from the About page).
- [P2] Home doors grid repeats the menu where persuasion should be. Fix: show how a lesson works (4 steps) inline; rank or cut doors, specific labels.
- [P2] Hero rotating word shows blank between words. Fix: crossfade, keep previous word until next arrives.

Persona red flags: mobile parent (chips wrap 4 rows, one price at a time, FAB + back-to-top + install banner over text); first-timer (Zad/Seerah unglossed, tier names); accessibility (prices on hover/focus only, 11-12px muted trust chips, no pause on rotator).
Minor: hero headline widow, WhatsApp green, duplicate footer link, duplicate package name, ayah reference format differs EN/AR, pricing first-view loader.
Questions: if prices are honestly low, why hide them? What if home showed a real lesson moment instead of doors? Should the child-safety answer be on the first screen?
