---
name: WATAZAWWADO-teacher-ops
description: Use for anything about our teachers: the teacher dashboard (src/dashboard), availability and time zones, moving lessons, leave, subject licences ("University"), pay and "My month", the agreement, onboarding a teacher, the teacher-change flow, lesson summaries and reports, learner profiles, Jalila (the teacher assistant), the teachers' training and the "Watazawwado Way", and teacher-facing copy or policies ("مدرس", "ستاف", "teacher dashboard", "teacher pay", "availability", "hand over a learner"). Keeps teachers' rules, privacy and the relationship model intact.
---

# Watazawwado Teacher Operations

Our model: **one learner, one teacher who stays** (RULES.md §1, `BRAND.md` §3). The brand does not rest on one person; it rests on the way every teacher works. This skill keeps teacher features and teacher-facing text consistent with that model and with the rules that protect teachers, families and the academy.

## 1. Read first

Root `RULES.md` §1 (platform and teachers), §2c (lesson outcomes and pay), §3 to §5 only for what teachers must never see; `docs/policies/TEACHER-CHANGE.md`; `docs/marketing/BRAND.md` §4 (the Watazawwado Way); BACKLOG `TE` lane; `docs/testing/FLOWS.md` rows for the teacher role. Code: `src/dashboard/` (pages: Today, Upcoming, Bookings, StudentDetail, Availability, MyMonth, MyPay, TeacherChanges, University, Homework, Settings…), `server/routes/{lessonTeacherMove,teacherChange,teacherFiles,myMonth,teacherLoad,university,summaryDraft}.ts`, `server/payroll`, `server/routes/retentionBonus.ts`.

## 2. Binding rules to keep intact

- **Teachers never see money.** No price, fee, payment, refund or pay-later data in any teacher API field, page, notification, email or export; payment alerts go to the super admin only. Teachers see their own pay ("My month", payslip) and never what students pay or how bonuses are computed.
- **Teachers move their own lessons, never cancel.** To tomorrow or later (student's zone) with a required reason; the student gets the reschedule email and an on-site notice with the reason; the admin gets a notice. Under 3 hours: still allowed, and the dashboard opens WhatsApp to the admin with a ready message. Only the super admin cancels.
- **Leave** is granted only by the super admin; a teacher never closes days alone. Friday is the weekly rest day at launch.
- **Your teacher stays.** The academy never changes a learner's teacher on its own side; a leaving teacher gives two months' notice and the next teacher receives the profile and all reports before the first lesson. Teacher-change requests (family or teacher) need a required reason, only the super admin decides, and **the reason never reaches the previous teacher; the family is never told a teacher asked**.
- **Subject licences ("University")**: a teacher teaches only subjects the admin opened for them; the server refuses any other assignment or booking; a new subject is earned (our curriculum, teacher guide, test, observed lesson).
- **Time zones**: teachers enter weekly hours in their own zone; students always see their own. A teacher is only double-booked against their own lessons.
- **Agreement**: each teacher accepts `/staff/agreement` after setting a password and again on every version change; the dashboard is blocked until then. Pay is agreed separately in writing.
- **Zoom**: the teacher starts every lesson as host (fresh host link); students enter through the waiting room.
- **Pay mechanics** (RULES.md §2c): one fixed hourly rate per teacher in their pay currency, monthly, paid outside the site between the 1st and 5th, bonus/deduction only with a written reason, payslip on transfer; the paid/unpaid table by lesson outcome. Retention bonus exists and rewards keeping learners and doing the work well; its pool maths is never shown to teachers.
- **Roles**: the super admin is the academy, not a teacher: no teacher photo or subjects, never offered to families, no teaching tools.
- Only teachers who exist and have agreed may appear publicly; only Ustadh Mahmoud appears in marketing content (content RULES §4.3).

## 3. Design principles for teacher features

1. **Reduce the teacher's load.** After the lesson the system should draft: the family summary (`summaryDraft`), the next-week suggestion, homework. A teacher fills the least possible; every field earns its place.
2. **Make the learner known.** A learner profile built lesson by lesson (what motivates them, attention span, preferences) feeds the next lesson (the Watazawwado Way, `BRAND.md` §4). Private to the teacher chain and admin; moves to the next teacher with the learner.
3. **One action per screen on phones.** Teachers work from a phone between lessons: mobile-first, Arabic-first (teacher notes and UI can be Arabic; they are content), 44px targets.
4. **Reports are the proof.** A report goes to the guardian after the class: one strength, one next step, one line about the child as a person. Never a score used to compare children.
5. **No surveillance feel.** Quiet-learner alerts help the teacher care; they never shame a family.
6. **Everything the teacher needs is inside the platform** (games, quizzes, practice, curriculum player); no outside site.
7. **Wording**: warm and respectful to teachers as colleagues ("we", "our teachers"); no ranking teachers against each other in teacher-visible screens.

## 4. Procedure

1. State the rule(s) above the change touches. If a decision is missing (pay, leave, privacy), ask the owner; do not invent it.
2. Check what exists (code search, `graphify query`), then reuse and polish.
3. Server-side authority: derive the teacher from the verified token (`verifyTeacherAuth`), never from a body field; enforce licences and ownership of the lesson/learner on every route; strip money fields for non-admins in the API, not in the UI.
4. Bilingual, RTL, phone and desktop, light and dark; `src/components/ui/*`; copy via `WATAZAWWADO-brand-voice`.
5. Tests: role boundaries (a teacher cannot read another teacher's learner, cannot see price fields, cannot cancel), the rule's numbers (3 h, notice, licences), and the notification each rule promises.
6. QA with `WATAZAWWADO-qa` using `teacher-1`/`teacher-2` accounts; release with `WATAZAWWADO-release`.

## 5. Teacher-facing text and documents

Agreements, onboarding guides, training and policies are written in English as project files; teacher-facing Arabic UI and notes are content. Any change to the teacher agreement or the paid/unpaid table bumps the agreement version so every teacher accepts it again, and the owner approves it first (it is a legal text).
