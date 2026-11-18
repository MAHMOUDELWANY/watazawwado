# Classroom: rules and legal text

Status: **approved and published 2026-11-18.** The owner approved this draft on 2026-11-18 (plan Task 15, step 1).
Each section was placed in its page in that page's own style (formal Arabic on the legal pages):

- `RULES.md` §2: section 1 replaces the 2026-10-16 "Zoom host" rule.
- `src/components/public/terms/TermsPage.tsx`: section 2 ("Lessons and teachers", "Children and safeguarding");
  terms version 2026-11-18.1 (`TERMS_VERSION` in `api/index.ts`).
- `src/components/public/privacy/PrivacyPolicyPage.tsx`: section 3 (what the room records, Cloudflare and Zoom as
  backup in the providers list).
- `src/components/public/safety/SafetyPage.tsx`: section 4.
- `src/data/content.ts` (FAQ entries and the how-it-works steps) and `src/components/public/faq/FAQPage.tsx`: section 5.
- `src/pages/StaffAgreementPage.tsx`: section 6; agreement version 2026-11-18.1 (`TEACHER_AGREEMENT_VERSION` in
  `api/index.ts`), so every teacher accepts it again.
- Tests: `test/classroom-legal-published.test.ts`; version pins in `test/mk-01-04-strategy.test.ts`.

## 1. RULES.md (replaces the 2026-10-16 "Zoom host" rule)

- **[Decided 2026-11-17] Our own lesson room.** Lessons take place in the Watazawwado room inside the site.
  - **Room window:** the room opens 10 minutes before the start for teacher and learner, and closes 15 minutes after
    the booked end. Only the teacher can end a lesson earlier.
  - **Timer:** the teacher always sees elapsed and remaining time. The learner's timer is hidden unless they open it.
  - **Teacher requirements:** a laptop or desktop and a headset. Before each lesson, the waiting room checks the
    camera and connection against 720p. A failed check never blocks entry, but it is recorded.
  - **Video quality:** it adapts during the lesson, from a 1080p cap down to audio with the synced lesson content.
  - **Connection quality is recorded per lesson.** The super admin gets a monthly report per teacher, and an alert
    when a teacher's connection fails in 3 lessons within 2 weeks.
- **[Decided 2026-11-17] Teacher punctuality.** A teacher may be up to 2 minutes late.
  - Later than that, the dashboard asks for a written reason after the lesson and stays locked until it is sent.
  - The super admin reviews the reason, then excuses it or deducts pay.
  - No reason is asked when the delay came from a failure on our side.
- **[Decided 2026-11-17] Zoom fallback.** When the room fails on our side, the system tells the super admin and shows a
  "Continue on Zoom" button. The Zoom link keeps the old Zoom window.
  - A lesson finished on Zoom counts as held: the teacher is paid, the learner gets no credit, and the teacher makes up
    lost minutes.
  - A lesson that does not happen follows "What is paid".
  - Zoom stays as a fallback until the owner removes it.
- **[Decided 2026-11-17] Observers.** A guardian may silently watch their child's live lesson from parent mode.
  Adult learners' lessons have no guardian observer. The teacher sees that a guardian is watching, and the child does
  not.
  - The super admin may silently watch any live lesson for quality and safeguarding, without notifying the teacher.
    Each visit is logged.
- **[Decided 2026-11-17] No lesson recording.** Lessons are not recorded.

## 2. Terms of use (learners and families)

**English.** Lessons take place in our own online lesson room on Watazawwado. To protect the quality of teaching and
the safety of our learners, the academy may observe live lessons. A parent or guardian may also watch their child's
live lesson from their own account, without taking part. We do not record lessons. If our lesson room has a technical
problem, you may be offered a backup Zoom link for that lesson. A lesson completed on the backup link counts as a
held lesson.

**العربية.** الحصص بتتم في غرفة الحصص الخاصة بوتزودوا جوه الموقع. الأكاديمية ممكن تحضر الحصص المباشرة، عشان تحافظ
على جودة التعليم وأمان طلابنا. وولي الأمر يقدر يتابع حصة ابنه أو بنته المباشرة من حسابه من غير ما يشارك فيها. إحنا مش
بنسجّل الحصص. لو حصلت مشكلة تقنية في غرفة الحصص عندنا، ممكن يظهر لك رابط Zoom احتياطي للحصة دي، والحصة اللي بتخلص
عليه بتتحسب حصة اتعملت.

## 3. Privacy policy (what the room records)

**English.** During a lesson in our room we record when each person joins and leaves; the quality of the connection
(video resolution, interruptions, reconnects); the time a learner spends away from the lesson screen; and what
happened in the lesson (slides shown, board changes, files shared, reactions). We use this to run lessons, calculate
attendance and teacher pay, keep teaching quality high, and keep learners safe. We do not record audio or video of
lessons. Video and audio pass through our provider Cloudflare and are not stored. Files a teacher shares in a lesson
are stored privately and available only to that lesson's participants.

**العربية.** أثناء الحصة في غرفتنا بنسجّل:
- إمتى كل شخص دخل وخرج.
- جودة الاتصال: دقة الصورة، والتقطيع، ومرات إعادة الاتصال.
- الوقت اللي الطالب قضاه بعيد عن شاشة الحصة.
- اللي حصل في الحصة: الشرائح اللي اتعرضت، والسبورة، والملفات اللي اتشاركت، والتفاعلات.

بنستخدم ده عشان نشغّل الحصص، ونحسب الحضور وأجر المعلم، ونحافظ على جودة التعليم وأمان الطلاب. إحنا مش بنسجّل صوت ولا
صورة الحصص. الصوت والصورة بيعدّوا عن طريق مزوّد الخدمة Cloudflare وما بيتخزنوش. الملفات اللي المعلم بيشاركها في الحصة
بتتخزن بشكل خاص، ومتاحة لأطراف الحصة دي بس.

## 4. Safety page (children)

**English.** A parent can watch their child's live lesson at any time from the parent account, without the child
being disturbed. Our academy staff may also observe lessons to make sure every lesson meets our standards. Lessons
are never recorded.

**العربية.** ولي الأمر يقدر يتابع حصة ابنه أو بنته المباشرة في أي وقت من حسابه، من غير ما الطفل يتشتت. وكمان فريق
الأكاديمية ممكن يحضر الحصص، عشان يتأكد إن كل حصة على المستوى بتاعنا. الحصص عمرها ما بتتسجّل.

## 5. FAQ (two new entries)

- **Do I need Zoom?** No. Lessons open inside Watazawwado from your lesson card or the email link. A Zoom link
  appears only if our room has a technical problem.
- **Can I join from my phone?** Yes, learners can join from a phone or tablet. Teachers teach from a computer.

## 6. Teacher agreement (new clauses)

- I teach from a laptop or desktop computer with a headset and a stable internet connection.
- I join each lesson on time. If I am more than 2 minutes late, I write the reason after the lesson. The academy may
  excuse the delay or deduct pay according to the pay rules.
- The academy may observe my live lessons, without prior notice, for quality and safeguarding. Observation visits
  are logged.
- The academy records attendance, connection quality and lesson activity for each lesson, as described in the
  privacy policy. Lessons are not recorded.
