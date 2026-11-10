# Who we talk to: voice rules per account (owner, 2026-11-09)

Owner review: "the account's language isn't directed or personal enough. Make design and rules for each account
language, Arabic or English, on every page, dashboard and system." This file is the rule set. Code helpers:
`src/lib/subjectReport.ts` (`audienceOf`, `messageLabel`, `messageStarters`).

## 1. Pick the reader first

| Learner | Account that reads | We write to | Example |
|---|---|---|---|
| Child 6–11 | the parent's account | the parent, about the child by first name | "Yusuf read three new words today." / «يوسف قرا ٣ كلمات جديدة النهارده.» |
| Teen 12–17, own login or child phone | the teen (family can read along) | the teen, as "you" | "You nailed the hamza today." / «ظبطت الهمزة النهارده.» |
| Teen 12–17, parent account only | the parent | the parent, warm about the teen | |
| Adult 18+ | the learner only | the learner, as "you" | "Hold on to today's idea this week." |

Never "a summary for the family" to an adult. Never talk to a 7-year-old as if they read the report.
Age comes from `students.age`; without it, `learner_type` (`child` → parent).

## 2. Speak the subject

Each subject has its own words (`reportProfile`): Zad talks about ideas, questions and the lesson's promise; Seerah
about the story and its lesson; Quran memorization about portions and revision; Tajweed about rules applied;
Reading about letters, marks and reading alone; languages about words used and speaking. No Quran or tajweed words in a
Zad, Seerah or language lesson, ever. No default surah.

## 3. Tone by audience

- **Child (via parent):** short, concrete, one thing to do at home together ("ask him at dinner…"). Praise effort.
- **Teen:** direct and light, a bit of fun, no baby words, no lecturing. Respect that they decide.
- **Adult:** calm, respectful, peer to peer; give the reason, not orders.
- **Teacher:** colleague voice, Egyptian Arabic in the dashboard, short labels, the next action first.
- **Super admin:** facts first (who, booking ref, numbers), then what was already done.

## 4. Language

- Arabic UI copy for families: warm everyday Arabic (Egyptian is fine in the dashboard and notices; Fusha-light in
  emails). English: plain, warm, no idioms that don't travel.
- Both languages always say the same thing; neither is a word-for-word translation.
- Zad (the sign-in welcome, first-visit tours, phone notices, homework, rewards) speaks for the academy: short, cheerful, never guilt or streak pressure
  (NX-01: no streaks).

## 5. Checklist for any new screen or message

1. Who reads it (table §1)? Is the label written to them?
2. Is every word from this subject (§2)?
3. Does it end with one clear next step?
4. Run `humanizer` on the copy; both languages present.
