# Policy texts for teacher pay and lesson outcomes: DRAFT for the owner (2026-10-28)

Launch plan F. Nothing here is live yet. The owner reads it, changes what he wants, then says "publish". On publish:
- the teacher agreement version goes from `2026-10-15.2` to `2026-10-28.1` (`src/pages/StaffAgreementPage.tsx` and `TEACHER_AGREEMENT_VERSION` in `api/index.ts`), so every teacher reads and accepts it again before continuing;
- the terms version goes from `2026-10-22.1` to `2026-10-28.1` (`src/components/public/terms/TermsPage.tsx` and `TERMS_VERSION` in `api/index.ts`).

The decisions themselves (D2, D5–D7, S1–S4) are already in RULES.md §2c; only the wording below waits.

---

## A. Teacher agreement

### A1. Replace item 3 of "Who we are and how we work together"

Today it says the dashboard does not show pay to teachers. That is no longer true (My month shows the teacher's own pay).

**EN:** Your pay is a fixed hourly rate in your own currency, agreed with Watazawwado in writing. Each lesson counts by its length (a 45-minute lesson is 0.75 hours). Your month so far, which lessons count and your payslips are on “My month” in the dashboard. You never see what students pay.

**AR:** أجرك سعر ثابت للساعة بعملتك، متفق عليه مع وتزودوا كتابةً. كل حصة تُحسب بمدتها (حصة 45 دقيقة = 0.75 ساعة). تجد شهرك حتى الآن، والحصص المحسوبة، وإيصالات أجرك في صفحة "شهري" في لوحة التحكم. ولا تظهر لك أبداً المبالغ التي يدفعها الطلاب.

### A2. New clause "Pay, month by month" (after "Lessons and quality")

**EN:**
1. Your pay is counted per calendar month. It is sent between the 1st and the 5th of the next month, outside the site (bank transfer, Instapay, Wise or another way we agree). When it is sent you get a payslip by email and on the site.
2. Watazawwado may add a bonus or make a deduction for a month, always with a written reason that you can see on your payslip.
3. Record what happened in every lesson (held, student did not come, technical problem) from the lesson window. A lesson is counted once its outcome is recorded.
4. What is paid:

| What happened | Paid to you |
|---|---|
| The lesson was held | Yes, its full length |
| Free trial lesson | No |
| The student cancelled in time (3 hours or more before) | No |
| The student did not come within 15 minutes, or cancelled late | Yes |
| The student came late | Yes, its full length |
| You could not attend, or cancelled less than 3 hours before without moving the lesson | No |
| A technical problem on our side stopped the lesson | No |
| A lesson paid later, from a package or from a credit | Yes, at the same rate |

5. If a student comes late, the lesson still ends on time. If you are free afterwards, we encourage you to add a few minutes so the student gets at least 30 minutes in total. This is your choice, not an obligation.
6. If you cannot attend a lesson, move it from the dashboard as early as possible (see “Lessons and quality”). A missed lesson is not paid, the student gets the lesson back, and repeated absences may lead to a deduction.

**AR:**
1. يُحسب أجرك عن كل شهر ميلادي، ويُرسل بين يوم 1 و5 من الشهر التالي خارج الموقع (تحويل بنكي، إنستاباي، Wise، أو طريقة أخرى نتفق عليها). وعند الإرسال يصلك إيصال بالبريد وعلى الموقع.
2. يجوز لوتزودوا إضافة مكافأة أو خصم عن شهر، دائماً مع سبب مكتوب تراه في إيصالك.
3. سجّل ما حدث في كل حصة (تمت، الطالب لم يحضر، مشكلة تقنية) من نافذة الحصة. والحصة تُحسب بعد تسجيل نتيجتها.
4. ما يُدفع عنه:

| ما حدث | يُدفع لك؟ |
|---|---|
| الحصة تمت | نعم، بمدتها كاملة |
| حصة تجريبية مجانية | لا |
| الطالب ألغى في الوقت (قبلها بـ 3 ساعات أو أكثر) | لا |
| الطالب لم يحضر خلال 15 دقيقة، أو ألغى متأخراً | نعم |
| الطالب تأخر | نعم، بمدتها كاملة |
| لم تستطع الحضور، أو ألغيت قبل أقل من 3 ساعات دون تغيير الموعد | لا |
| مشكلة تقنية من جهتنا منعت الحصة | لا |
| حصة بالدفع المؤجل أو من باقة أو من رصيد | نعم، بنفس السعر |

5. إذا تأخر الطالب، تنتهي الحصة في موعدها. وإن كنت متفرغاً بعدها، نشجعك على إضافة دقائق ليحصل الطالب على 30 دقيقة على الأقل إجمالاً. هذا اختيارك وليس إلزاماً.
6. إذا لم تستطع حضور حصة، غيّر موعدها من لوحة التحكم في أقرب وقت (انظر "الدروس والجودة"). الحصة الفائتة لا يُدفع عنها، وتعود للطالب، وقد يؤدي تكرار الغياب إلى خصم.

---

## B. Student terms

### B1. "Lessons and teachers": replace the 3rd item (late arrival)

**EN:** Lessons start and end on time. If the student joins late, the lesson still ends at its scheduled time; when the teacher is free, they may add a few minutes, but this is not guaranteed.

**AR:** تبدأ الدروس وتنتهي في موعدها. إذا تأخر الطالب، ينتهي الدرس في موعده المحدد؛ وقد يضيف المعلم بضع دقائق إن كان متفرغاً، دون أن يكون ذلك مضموناً.

### B2. "Cancelling and rescheduling": add after the 5th item (no-show)

**EN:** A student who has not joined within 15 minutes of the start counts as not attending.

**AR:** الطالب الذي لم يدخل خلال 15 دقيقة من بداية الدرس يُعتبر غائباً.

### B3. "Cancelling and rescheduling": replace the last item (our side)

**EN:** If we cancel, the teacher misses the lesson, or a technical problem on our side stops it, the lesson comes back to you as a lesson credit straight away, and we tell you. If you prefer a free new time or a refund instead, message us. This never counts toward the refund limit below.

**AR:** إذا ألغينا نحن، أو غاب المعلم، أو منعت مشكلة تقنية من جهتنا الدرس، يعود الدرس لك فوراً كرصيد حصة ونُبلغك بذلك. وإن فضّلت موعداً جديداً مجاناً أو استرداد المبلغ بدلاً منه، راسلنا. ولا يُحتسب ذلك أبداً من حد الاسترداد التالي.

---

## Questions for the owner while reading
1. Should the no-show rule (15 minutes) also say what happens to a package lesson (it is used)? Today the teacher chooses per lesson whether a package credit is used on a no-show.
2. Is "repeated absences may lead to a deduction" the wording you want, or a fixed rule (for example, the second absence in a month)?
