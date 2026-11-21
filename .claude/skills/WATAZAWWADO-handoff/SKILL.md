---
name: WATAZAWWADO-handoff
description: Use when a session or Claude account is about to end, when the owner switches accounts, credits run low, a long task pauses, or a new session starts and needs to pick up ("handoff", "سلّم", "هنكمل في حساب تاني", "وين وصلنا", "اكتب ملخص للي جاي", "new session context"). Writes or reads the handoff so nothing lives only in chat memory.
---

# Watazawwado Handoff

Work stalled before whenever the owner switched Claude accounts, because the setup lived in chat. A handoff is a file in the repo, in English, that a cold session can act on in five minutes. Writing one is part of finishing any session that leaves work open.

## 1. Starting a session (read, in this order)

1. `CLAUDE.md`, root `RULES.md`, then the newest handoff for your area: curriculum `docs/curriculum/HANDOFF-*.md` (newest date) with `PLAN.md`; testing `docs/testing/RULES.md` and your brief; backlog `docs/backlog/HANDOFF-*.md`; marketing `docs/marketing/PLAN.md`; general `docs/STATUS.md`.
2. `git log --oneline -15`, `git status`, `git branch -a --sort=-committerdate | head`, `git worktree list`. Know which branch is yours and what is unmerged.
3. State back to the owner in two lines (Arabic): where you think we are and what you will do next. If the handoff and the code disagree, trust the code and fix the handoff.

## 2. Writing a handoff

File: `docs/<area>/HANDOFF-YYYY-MM-DD.md` (curriculum keeps its own folder; other work uses `docs/backlog/`). English. One page. Sections:

1. **Why this exists** (one line: account switch, credits, end of day).
2. **Where we are**: what is done and live (with commit shas and branches), what is partial, what is only on a branch. Say `pushed to main` or `NOT merged` for each.
3. **The current task**: the owner's goal in his words, the plan file that holds it, the **next step** (specific file or command), and how to know it is done.
4. **How to run and verify**: exact commands (type check, tests, build, preview server name and port, QA project and accounts), what needs `.env` (never print it), what fails locally for known reasons.
5. **Decisions made and why** (owner decisions with dates; link RULES.md sections; never restate a rule that lives elsewhere, just link it).
6. **Open questions for the owner** (one line each, Arabic wording ready to paste if the owner must answer).
7. **Gotchas**: things that burned us (case-only renames on Windows, `npx tsc` not resolving, worktrees without `.env`, HMR off on qa servers, curl loops triggering Vercel's challenge, `git checkout -- .` in the main checkout wiping settings).
8. **Branches and worktrees to integrate**: name, what it holds, whether it can merge cleanly.

## 3. Before you write it

- Run `git status`; commit or clearly list uncommitted work. Do not leave the only copy of work uncommitted. Push work branches so another account can reach them.
- Update the real homes of information first: `LOG.md`, `PLAN.md` / `BACKLOG.md` statuses, `RULES.md` for decided rules, the findings file. The handoff points to them; it does not replace them.
- Add or refresh the pointer in `CLAUDE.md` ("New account or session? Read …") so the next session finds it, and update the matching memory note in `MEMORY.md` if the situation changed.

## 4. Style

Facts, not narrative. No secrets, no passwords, no personal data of families. Names of files and commands in backticks. Prefer "next: run X in Y, expect Z" over "we should consider". Note what you did not check.

## 5. After writing

Tell the owner (Arabic, 3 lines): the file path, what is left, and the one thing he must do (for example "open the new account and say: اقرأ HANDOFF-… وكمّل").
