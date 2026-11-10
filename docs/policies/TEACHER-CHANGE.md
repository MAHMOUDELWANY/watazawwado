# Changing a learner's teacher: policy and procedures

Status: **approved by the owner 2026-11-10 and built** (`server/routes/teacherChange.ts`, migration
`20261110000000_teacher_profiles_and_change_requests.sql`). Summary in RULES.md ("Changing teacher").

This covers a learner moving from one of our teachers to another. A learner who stops learning with us altogether is
a different case and is not covered here.

## 1. Principles

1. **Nobody "leaves" anybody.** Every screen, email and message says the learner *moved to another teacher*. We never
   say "left", "dropped" or "rejected", to the teacher or to the family.
2. **The reason stays with the academy.** Only the super admin reads the reason. The previous teacher is never told
   why. The family is never told that a teacher asked to hand them over.
3. **Most moves are nobody's fault.** Each reason has a type. Only *quality* reasons are counted on a teacher's private
   record, and only the super admin sees that record.
4. **The learner loses nothing.** Lessons, notes, progress, homework history and credits move with the learner.
5. **One decision-maker.** Learners, families and teachers *ask*; only the super admin *moves*.
6. **Safety reports are not teacher changes.** They follow their own urgent track (section 6).

## 2. Who can start a move

| Who | Where | What they give |
|---|---|---|
| Learner / family (per child) | Account → "My teacher" card → "Ask to change teacher" | A reason type (required) + a short note (required) + a preferred teacher (optional) |
| Teacher | Student file → "Hand over this learner" | A reason type (required) + a note for the admin + an optional handover note for the next teacher |
| Super admin | Students → learner → Assigned teacher (exists today) | Reason type for the record |

Only one open request per learner at a time. The family can withdraw its request while it is open.

## 3. Reason types

**No fault (never counted on anyone):**
- Times: the teacher's free hours no longer suit the family.
- Teacher preference: the family now prefers a male or a female teacher.
- Level or subject: the learner moved to a subject or level this teacher does not teach.
- Siblings: the family wants its children with the same teacher.
- Teacher's own reasons: reduced hours, a long leave, leaving the academy.
- Language: the learner needs explanations mostly in English or mostly in Arabic.

**Fit (not counted, but the admin talks to the family first):**
- Teaching style or personality: "it isn't clicking".

**Quality (counted on the teacher's private record):**
- Lateness or missed lessons by the teacher.
- Lessons not prepared, or progress the family feels is too slow.

**Teacher-side (counted on the learner's private record, never shown to them):**
- Repeated no-shows or late cancellations by the learner.
- Disrespect from the learner or the parent.

**Urgent, its own track (section 6):** anything about safety, inappropriate behaviour, or contact outside the academy.

## 4. Steps

1. **Request.** The learner's card shows "Request under review". The super admin gets an on-site notice and an email.
   The current teacher is told nothing at this stage.
2. **Review, within 48 hours.** The super admin chooses one of:
   - **Approve**: pick the new teacher. The system only offers teachers licensed for the learner's subject (Watazawwado
     University) with free hours that week.
   - **Talk first** (for *fit* reasons): the admin calls or messages the family. Often one honest word to the
     teacher fixes it. The family can still insist, and then the request is approved.
   - **Waitlist**: no suitable teacher has free hours. The family sees "We are finding the right teacher", and the
     current teacher continues meanwhile.
   - **Decline**, with a short message the family sees (for example: no teacher of that subject yet).
3. **Booked lessons** *(owner, 2026-11-10)*. When the move is approved, every lesson booked with the previous teacher
   that starts **more than 3 hours from now** is cancelled by the academy and returned to the learner as
   **lesson credit** (package lessons go back to the package; a paid single lesson becomes a 1-lesson credit of the
   same price band and length; a pay-later lesson is simply removed). Because the academy cancels, it never counts
   toward the refund limit, and the family can still ask for a refund instead (RULES.md: platform-cancelled lessons).
   Lessons **within the next 3 hours** stay and are held with the previous teacher as normal (the teacher is paid
   for them, as for any held lesson). The family then books the new teacher's free times with that credit.
   Free trials booked with the previous teacher stay where they are; the admin sees them in the result and moves
   them with "Move lesson" (Bookings) when the new teacher is free, so a cancelled trial never triggers the 48-hour
   wait or the trial limit.
4. **The move itself** (one server action, all or nothing):
   - The learner's assigned teacher changes; new bookings go to the new teacher.
   - The new teacher gets the learner's file: goals, level, the previous teacher's lesson notes, progress, homework
     history and the optional handover note.
   - The previous teacher keeps read-only access to the lessons they taught (their own records and pay), and loses
     the learner from their active list. Their chat with the family becomes read-only.
   - A new chat opens between the family and the new teacher (already done by the admin's reassign today).
5. **Messages** (templates, written with the humanizer pass):
   - Family: "We've arranged [new teacher] for [child]. Your booked lessons have been returned to your balance as
     [n] lesson credits. Pick their first time here." No mention of who asked or why.
   - New teacher: "[Learner] joins your students. Here is their file and a note from their previous teacher."
   - Previous teacher: "[Learner] is continuing with another teacher. Thank you for the lessons you gave them; your
     notes stay with their file so their progress continues." Never the reason. For *no fault* reasons the admin may
     add a personal line of thanks.
6. **Follow-up.** One week after the first lesson with the new teacher, the family gets a short "How is it going?"
   check-in. The admin sees the answer.

## 5. Scenarios and answers

| Scenario | What happens |
|---|---|
| Family asks for a different time slot the teacher doesn't have | No fault. Approve to a teacher with those hours. |
| Family wants a female teacher for an older daughter | No fault. Approve; previous teacher gets the warm template. |
| Family can't say why, "just not clicking" | Fit. Admin talks to the family first; approve if they still want it. |
| Family complains the teacher is late or unprepared | Quality. Admin checks lesson logs, talks to the teacher privately, then approves. Counted. |
| Teacher asks to hand over a learner who keeps missing lessons | Teacher-side. Admin first reminds the family of the no-show policy; if it repeats, approve and tell the family only "We've arranged a teacher whose times suit you better". |
| Teacher asks to hand over because of disrespect from a parent | Teacher-side. Admin speaks to the family privately before any move. The teacher is never left to handle it alone. |
| Teacher leaves the academy | No fault. The teacher gives at least 7 days' notice (teacher agreement). The admin moves every learner, offering each family a choice of 1–2 teachers. Message: "[Teacher] has finished teaching with us." |
| Teacher on leave for a few weeks | Not a change. A cover teacher takes those lessons; the assignment stays. |
| Family asks to change again shortly after a change | A second change within 90 days is allowed. Before a third, the admin calls the family; no automatic approval. |
| Family asks for a teacher who has no free hours | Waitlist, or the family picks another teacher. |
| Preferred teacher isn't licensed for the subject | The system doesn't offer them; admin can grant the subject in Watazawwado University first. |
| Family has a package bought while with the previous teacher | Packages belong to the learner, not the teacher. Nothing changes except the teacher. |
| A lesson is in less than 3 hours when the move is approved | It stays with the previous teacher and is held normally. |
| Previous teacher still messages the family after the move | Chat is read-only, so they can't. If contact happens outside the academy, it goes to the urgent track. |
| Family asks the previous teacher to teach them privately, outside the academy | Breach of the teacher agreement. Teacher reports it; admin handles it with the family. |
| One child moves, siblings stay | Each child is a separate request; siblings are unaffected. |
| The request is withdrawn by the family | Nothing changes; nobody was told anything. |

## 6. Urgent track: safety and conduct

The request form has one more option: "Something about safety or respect". Choosing it:
- alerts the super admin at once (on-site notice and email, marked urgent), not within 48 hours;
- lets the admin pause the teacher's upcoming lessons with that learner immediately (cancelled to credit, as above);
- is handled by the admin directly with the family; nothing is sent to the teacher automatically.

## 7. What gets built (once approved)

- Table `teacher_change_requests` (learner, account, from teacher, preferred teacher, initiator, reason type, note,
  handover note, status open/talk/waitlist/approved/declined/withdrawn, admin note, decided by, timestamps), RLS so
  families see only their own, teachers only the ones they started, the admin all.
- One `SECURITY DEFINER` RPC that approves a request and, in one transaction, reassigns the teacher, cancels lessons
  starting more than 3 hours away and returns their credit, and writes the audit trail.
- Learner/family: "My teacher" card with the request form and its status. Teacher: "Hand over this learner".
  Admin: "Teacher change requests" list with Approve / Talk first / Waitlist / Decline.
- Private counters: quality moves per teacher, teacher-side moves per learner (admin only).
- Templates for every message above, in Arabic and English.
