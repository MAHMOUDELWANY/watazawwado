# NX-02 Homework between lessons — design

Approved by the owner on 2026-11-01 in chat ("اعتمد كل اللي انت قلته"), as the one last development before launch.

## Why

Lessons are a few times a week; between them the learner opens nothing and the family does not know what to practise.
Homework gives the week a shape, tells the guardian exactly what to do, and lets the teacher start the next lesson
from what was done.

## Goals

- The teacher sets 1 to 3 tasks for the next lesson in under 30 seconds, inside the existing post-lesson summary form
  (`PostLessonSummaryEditor`), saved with the same button.
- Three kinds:
  - `recite`: memorize or recite a surah from ayah N to ayah M. The learner gets the surah name, the range and a link
    to read it on quran.com (a trusted source; we do not ship Quran text in this feature).
  - `review`: review a lesson of the curriculum. Short text naming it, and a link to "My curriculum", where covered
    approved lessons open for review.
  - `task`: free text (for example "write 5 Fusha words about your family").
- Jalila suggests tasks from the teacher's notes; the teacher accepts or edits (same pattern as the family summary draft).
- Learner and guardian: a "This week's homework" card on the student home, one "Done" button per task. A child ticks
  their own tasks; the guardian sees everything (home card per active learner, progress page, monthly report).
- One reminder only: the existing 12-hour on-site lesson reminder adds a homework line when tasks are open.
- Next lesson: the teacher's lesson window shows the open homework and its state; the teacher marks each task
  **Mastered** or **Needs review**. Mastered counts in progress; Needs review creates the same task again for the next
  week automatically.
- Trial lesson: the teacher can set a small task after a trial too; the card then also shows "Book your next lesson".
- Motion: a calm tick and "زادك الله" when a task is done; a short celebration when the teacher marks Mastered. No
  music. Respects `prefers-reduced-motion`.

## Non-goals

- No grades, points or scores. No daily reminders. No uploads or audio (that is NX-03, built later on this table).
- No red, no "late", no overdue wording. An open task stays open until the next lesson the learner actually attends.

## Rules and constraints

- Who sees a task: the learner, their guardian account, the assigned teacher (or the teacher of that lesson), the super
  admin. Server-only table (service role), like `lesson_feedback`; the browser never reads it directly.
- The server decides everything: who may write (`canTeacherWriteForLesson`), who may tick (`getLearners` +
  `canFamilyReadLearner`), the surah and ayah range are validated against the 114 surahs and their ayah counts.
- Max 3 open tasks per learner per subject created by one lesson; text up to 500 characters.
- Arabic and English UI, RTL, light and dark, 375px, `src/components/ui/*`, humanizer on copy.

## Data

New table `lesson_homework`:
`id, student_id, booking_id, lesson_note_id, teacher_id, subject, kind (recite|review|task), surah, ayah_from, ayah_to,
body, done_at, done_by, review (mastered|needs_review), reviewed_at, reviewed_by, carried_from, created_at`.

## API

- `POST /api/dashboard/students/:id/post-lesson-summary` accepts `homework: [{kind, surah?, ayah_from?, ayah_to?, body?}]`.
- `GET /api/dashboard/students/:id/homework` open + recently reviewed tasks for the lesson window.
- `POST /api/dashboard/homework/:id/review` `{ review: 'mastered' | 'needs_review' }`.
- `GET /api/student/homework?learnerId=` open and recent tasks for the family.
- `POST /api/student/homework/:id/done` `{ done: boolean }`.
- Jalila: the existing family-summary draft route also returns suggested tasks.

## Builder's calls (mine, owner can change)

- quran.com link instead of inline Quran text (no text dataset in the repo; the link is the trusted source).
- "Review" links to My curriculum rather than a single lesson (the teacher's pick of one lesson needs the curriculum
  report picker; later).
- The reminder is the existing 12-hour on-site notice, not a new email.
