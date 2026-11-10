# P4: Real-user experience, every kind of user

After P1. Can run in parallel with P2 and P3 (mostly reads and reports). Suggested model: Opus 5.5, effort high.

Read first: `docs/testing/RULES.md`, root `RULES.md` (§2b subjects, §6b voice), `docs/design-system.md`,
`docs/ux/`, `.claude/product-marketing.md`. QA accounts: `qa-p4`.

## Goal
Find where real people get confused, stuck, worried or leave, and propose fixes, up to a full redesign where
it is worth it.

## Personas (each one does the full journey: land, understand, sign up, trial, book, attend, come back)
1. Busy mother in the UK, phone only, English, booking for two kids, five minutes between tasks.
2. Grandfather, 70, Arabic, large text, unsure with technology, mis-taps.
3. A 9-year-old using a parent's phone.
4. A teen who wants to be done fast and skips reading.
5. Sharp, skeptical father who compares prices and reads the legal pages.
6. A convert new to Arabic and Islamic terms.
7. A new teacher on day one: set availability, find the next lesson, mark homework.
8. The admin on a busy morning: who needs action now.
9. A user with a screen reader or keyboard only; another on a slow 3G connection.

## How
1. Play each persona in the browser pane on phone and desktop, in their language. Think aloud in the findings:
   where did they hesitate, what did they misread, what did they expect.
2. Score each journey: time, taps, errors, moments of doubt, "would they pay?".
3. Check trust: prices clear, teacher info, refund/cancel rules, academy voice ("we", not one person),
   no dead ends, help always reachable.
4. Run `impeccable` audit, `apple-design` and `review-animations` on the main screens; Lighthouse for
   performance and accessibility.
5. For each problem propose the smallest fix; where many problems share one cause, propose a redesign with a
   sketch or prototype (follow memory rules: our palette, no green).

## Output
`docs/testing/findings/P4.md` (per persona journey + ranked proposals), screenshots, entries in
`docs/backlog/REVIEW-ISSUES.md` for the owner to pick. Build nothing big without the owner's pick.

## Done when
All personas done on both devices; top 10 proposals ranked by impact; summary sent to the owner in Arabic.
