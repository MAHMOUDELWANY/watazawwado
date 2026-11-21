---
name: WATAZAWWADO-backlog
description: Use to work the pre-launch backlog: "what's next", "كمّل الباكلوج", "خذ المهمة اللي بعدها", picking a task from docs/backlog/BACKLOG.md, building it, closing it in docs/backlog/LOG.md, adding a new task or splitting one. Keeps the order (P1 top-down), the zones (green/red), the "check if it exists first" rule and the log format. Claude does all of it (owner, 2026-10-20).
---

# Watazawwado Backlog

`docs/backlog/BACKLOG.md` is the order of work; `docs/backlog/LOG.md` is the memory (newest first). One task = one finished, verified deliverable. Claude does every task; there are no other agents.

## 1. Read

1. Top of `BACKLOG.md` ("Order of work", "How to read a task", the shared design direction) and the lane you are in.
2. The last entries of `LOG.md` so you do not redo or contradict finished work.
3. `docs/backlog/REVIEW-ISSUES.md` (owner's picks) and `docs/backlog/HANDOFF-*.md` if a session just changed hands.
4. Root `RULES.md` for any task touching money, booking, teachers, language or tone.

## 2. Pick the task

- Order: all **P1** top-down (OPS, then RN, CRM, PA, ST, TE, AD, PU, QA), then PR-04, then P2, then P3. Backend and features first, the big design pass last (check desktop and phone on every task anyway).
- A named task from the owner beats the order. An item on `REVIEW-ISSUES.md` is built only if the owner picked it.
- Skip a task that is `taken`, `blocked`, or has an unfinished `Depends on`; say why in one line. Tasks that touch the same files stay chained.
- A task with an open owner question: do something else and ask the owner (Arabic, one question).

## 3. Build (every task, even if not repeated in its text)

1. **Does it already exist?** Search the code and `graphify query`. If yes, polish it and say so in the log instead of rebuilding.
2. Plan in one short list (`brainstorming` for anything new, `writing-plans` for multi-step). Zone check: 🟢 green (copy, UI, read-only) goes to `main` after tsc, tests and build; 🔴 red (money, booking rules, auth, RLS, RPCs, legal) additionally needs `WATAZAWWADO-booking-payments` §5 and a `/code-review` before `main`.
3. Standards: Arabic and English, RTL, light and dark, 375px, `src/components/ui/*`, copy through `WATAZAWWADO-brand-voice` (no Mahmoud-centred wording, no invented numbers), tests for new behaviour, schema through `WATAZAWWADO-new-migration`, design per `WATAZAWWADO-design-system`.
4. Real data only on anything shown to families: no fake counters, XP or urgency; weekly rhythm not daily streaks; no guilt.
5. Verify with evidence (`WATAZAWWADO-release` §1; for UI, a screenshot at phone and desktop). Then release per the standing approval.

## 4. Close the task

1. Set the task's status in `BACKLOG.md`: `done (sha)`, `review (branch)` or `blocked (reason)`.
2. Add one entry at the top of `LOG.md`: `### <ID> <title> (<date>)`, then result, files changed, checks run (with counts), **what was not checked**. Short and factual.
3. If the work changed a rule, record it in `RULES.md` with the date; if it changed the design system, update `docs/design-system.md`; if a doc lists status, update `docs/STATUS.md`.
4. Tell the owner in Arabic, shortest first: done, where to see it, anything he must do or decide.

## 5. Adding or changing tasks

New task: ID `LANE-NN`, priority, zone, size, status `todo`, what and why (one paragraph), acceptance checks, `Depends on` if any. Split anything larger than a day. Never delete a task: mark it `done`, `dropped (reason, date)` or `moved`. Owner-requested additions go in the lane that fits and, if urgent, at the top of "Order of work".

## 6. Pitfalls seen before

Rebuilding something that exists; marking done without the log line; forgetting the Arabic version; shipping a red-zone task on green-zone checks; writing the task result in chat only (the log is the memory); running a task from `REVIEW-ISSUES.md` the owner did not pick.
