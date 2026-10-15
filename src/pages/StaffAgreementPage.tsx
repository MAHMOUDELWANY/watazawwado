import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrandLogo } from '../components/ui/BrandLogo';
import { Button } from '../components/ui/Button';
import { useTeacherAuth } from '../lib/auth';
import { useT } from '../lib/language';
import { dashboardFetch } from '../dashboard/lib/dashboardApi';

// Keep in sync with TEACHER_AGREEMENT_VERSION in api/index.ts.
const AGREEMENT_VERSION = '2026-10-15';

type Clause = { en: { title: string; items: string[] }; ar: { title: string; items: string[] } };

const CLAUSES: Clause[] = [
  {
    en: { title: 'Who we are and how we work together', items: [
      'This agreement is between you (the teacher) and the operator of Watazawwado Academy (“Watazawwado”), who runs the platform from Poland.',
      'You teach as an independent contractor, not as an employee. You decide how to teach your lessons, within the standards in this agreement.',
      'Your pay per lesson, how and when it is paid, and any changes to it are agreed with the platform owner separately in writing (for example by message or email). The dashboard does not show prices or payments to teachers.',
    ] },
    ar: { title: 'من نحن وكيف نعمل معاً', items: [
      'هذا الاتفاق بينك (المعلم) وبين مشغّل منصة وتزودوا ("وتزودوا")، الذي يدير المنصة من بولندا.',
      'تعمل معنا كمتعاقد مستقل وليس كموظف، وتقرر طريقة تدريس دروسك في حدود المعايير الواردة في هذا الاتفاق.',
      'أجرك عن كل درس، وطريقة ومواعيد دفعه، وأي تغيير عليه، يُتفق عليه مع صاحب المنصة كتابةً بشكل منفصل (مثلاً برسالة أو بريد إلكتروني). ولا تعرض لوحة التحكم الأسعار أو المدفوعات للمعلمين.',
    ] },
  },
  {
    en: { title: 'Lessons and quality', items: [
      'Keep your weekly hours on “My hours” up to date. Students book from those hours, so only open times you can really teach.',
      'Prepare each lesson, start on time as the Zoom host from the dashboard, and teach the full booked time.',
      'If you cannot teach a booked lesson, use “Ask the student to reschedule” as early as possible and tell the platform owner. Only the platform owner moves or cancels lessons directly.',
      'Write a short note after each lesson so the student, the parent and the next lesson benefit from it.',
      'Teach in a balanced and moderate way, in line with the values described on the website, and treat every student and parent with respect.',
    ] },
    ar: { title: 'الدروس والجودة', items: [
      'حدّث ساعاتك الأسبوعية في صفحة "ساعاتي" باستمرار. الطلاب يحجزون من هذه الساعات، فافتح فقط الأوقات التي تستطيع التدريس فيها فعلاً.',
      'حضّر كل درس، وابدأ في موعده كمضيف Zoom من لوحة التحكم، ودرّس الوقت المحجوز كاملاً.',
      'إذا لم تستطع تقديم درس محجوز، استخدم "اطلب من الطالب تغيير الموعد" في أقرب وقت وأخبر صاحب المنصة. وصاحب المنصة وحده هو من يغيّر موعد الدروس أو يلغيها مباشرة.',
      'اكتب ملاحظة قصيرة بعد كل درس، ليستفيد منها الطالب وولي الأمر والدرس التالي.',
      'درّس بأسلوب متوازن ومعتدل يتفق مع القيم الموضحة على الموقع، وتعامل مع كل طالب وولي أمر باحترام.',
    ] },
  },
  {
    en: { title: 'Working with children (safeguarding)', items: [
      'Talk to students only through the platform: Zoom lessons and the on-site chat. Never move contact to personal phone numbers, social media or private accounts.',
      'Do not ask a student for personal information the lesson does not need (address, photos, passwords, family matters).',
      'Do not record, photograph or screenshot a student, and do not keep lesson content that shows a student, without the parent’s written permission given through the platform.',
      'Parents may join any lesson. Keep your camera background and language appropriate at all times.',
      'If a student tells you something worrying, or you see a sign of harm, tell the platform owner the same day. Do not investigate on your own.',
      'You confirm that you have no conviction for any offence against children. Where the law of your country allows, you will provide a criminal record certificate when asked.',
    ] },
    ar: { title: 'التعامل مع الأطفال (حمايتهم)', items: [
      'تواصل مع الطلاب عبر المنصة فقط: دروس Zoom والمحادثة داخل الموقع. ولا تنقل التواصل أبداً إلى أرقام هواتف شخصية أو وسائل تواصل اجتماعي أو حسابات خاصة.',
      'لا تطلب من الطالب معلومات شخصية لا يحتاجها الدرس (العنوان، الصور، كلمات المرور، الشؤون العائلية).',
      'لا تسجّل الطالب ولا تصوّره ولا تأخذ لقطة شاشة له، ولا تحتفظ بمحتوى من الدرس يظهر فيه الطالب، دون إذن كتابي من ولي الأمر عبر المنصة.',
      'يحق لولي الأمر حضور أي درس. حافظ على خلفية كاميرا وألفاظ لائقة في كل الأوقات.',
      'إذا أخبرك طالب بشيء مقلق، أو لاحظت علامة على أذى، أخبر صاحب المنصة في نفس اليوم، ولا تحقق في الأمر بنفسك.',
      'تقر بأنه لا توجد ضدك أي إدانة في جريمة بحق الأطفال، وأنك ستقدم شهادة خلو سوابق عند الطلب حيث يسمح قانون بلدك بذلك.',
    ] },
  },
  {
    en: { title: 'Student data and confidentiality', items: [
      'Watazawwado is the controller of student data. You use it only on Watazawwado’s instructions and only to teach your students (GDPR Art. 28 and 29).',
      'Keep everything you learn about students and families confidential, during this agreement and after it ends.',
      'Do not copy student data out of the platform (no exports, personal spreadsheets or photos of the screen). Use a device with a screen lock and do not share your password.',
      'Do not type a student’s full name, contact details or sensitive information into outside AI tools. Inside the platform, Jalila receives only what the task needs.',
      'If you think student data was lost, leaked or seen by someone who should not see it (for example a lost phone or a hacked account), tell the platform owner within 24 hours.',
      'When this agreement ends, you lose access to the platform and must delete any student information you still have.',
    ] },
    ar: { title: 'بيانات الطلاب والسرية', items: [
      'وتزودوا هي المسؤولة (المتحكمة) عن بيانات الطلاب، وأنت تستخدمها فقط وفق تعليمات وتزودوا ولتدريس طلابك فقط (المادتان 28 و29 من اللائحة العامة لحماية البيانات).',
      'حافظ على سرية كل ما تعرفه عن الطلاب وأسرهم، أثناء هذا الاتفاق وبعد انتهائه.',
      'لا تنسخ بيانات الطلاب خارج المنصة (لا تصدير، ولا جداول شخصية، ولا تصوير للشاشة). استخدم جهازاً عليه قفل شاشة، ولا تشارك كلمة مرورك.',
      'لا تكتب الاسم الكامل للطالب أو بيانات التواصل أو أي معلومات حساسة في أدوات ذكاء اصطناعي خارجية. وداخل المنصة، تستلم جليلة فقط ما تحتاجه المهمة.',
      'إذا اعتقدت أن بيانات طالب فُقدت أو تسربت أو اطلع عليها من لا يحق له (مثل فقدان الهاتف أو اختراق الحساب)، أخبر صاحب المنصة خلال 24 ساعة.',
      'عند انتهاء هذا الاتفاق يُلغى وصولك للمنصة، ويجب عليك حذف أي معلومات عن الطلاب ما زالت لديك.',
    ] },
  },
  {
    en: { title: 'Teaching materials', items: [
      'Materials you create yourself stay yours. You allow Watazawwado to use them with your students inside the platform while you teach here.',
      'Materials provided by Watazawwado (question banks, reports, designs, texts) belong to Watazawwado and may be used only for lessons on the platform.',
    ] },
    ar: { title: 'المواد التعليمية', items: [
      'المواد التي تُعدّها بنفسك تبقى ملكك، وتسمح لوتزودوا باستخدامها مع طلابك داخل المنصة طوال فترة تدريسك معنا.',
      'المواد التي توفرها وتزودوا (بنوك الأسئلة، التقارير، التصميمات، النصوص) ملك لوتزودوا، ولا تُستخدم إلا في الدروس على المنصة.',
    ] },
  },
  {
    en: { title: 'Ending the agreement and changes', items: [
      'Either side may end this agreement at any time with 14 days’ notice by message or by email to hr@watazawwado.academy. Lessons already booked in that time are taught or moved to another teacher.',
      'Watazawwado may pause or end your access immediately for a serious breach, especially of the safeguarding or data rules.',
      'If this agreement changes, you will be asked to read and accept the new version before you continue.',
      'This agreement is governed by the laws of Poland. Mandatory rules of the country where you live still apply where the law says so.',
    ] },
    ar: { title: 'إنهاء الاتفاق وتعديله', items: [
      'يحق لأي طرف إنهاء هذا الاتفاق في أي وقت بإخطار قبل 14 يوماً برسالة أو ببريد إلكتروني إلى hr@watazawwado.academy. والدروس المحجوزة خلال هذه المدة إما أن تقدمها أو تُنقل إلى معلم آخر.',
      'يحق لوتزودوا إيقاف وصولك أو إنهاؤه فوراً عند مخالفة جسيمة، خاصة لقواعد حماية الأطفال أو البيانات.',
      'إذا تغيّر هذا الاتفاق، سيُطلب منك قراءة النسخة الجديدة والموافقة عليها قبل المتابعة.',
      'يخضع هذا الاتفاق لقوانين بولندا، مع بقاء القواعد الإلزامية في بلد إقامتك سارية حيث ينص القانون على ذلك.',
    ] },
  },
];

/** Shown after a new teacher sets a password, and whenever the agreement version changes. */
export default function StaffAgreementPage() {
  const { t, isAr } = useT();
  const navigate = useNavigate();
  const { user, loading } = useTeacherAuth();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    setBusy(true);
    setError(null);
    try {
      await dashboardFetch('/api/dashboard/agreement/accept', {
        method: 'POST',
        body: JSON.stringify({ version: AGREEMENT_VERSION, accepted: true })
      });
      navigate('/dashboard', { replace: true });
    } catch {
      setError(t('Could not save your acceptance. Please try again.', 'تعذر حفظ موافقتك. حاول مرة أخرى.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto glass-dialog rounded-3xl p-6 sm:p-10 space-y-8">
        <div className="text-center space-y-2">
          <BrandLogo variant="large" className="mx-auto mb-3" />
          <h1 className="text-2xl font-display font-bold">{t('Teacher agreement', 'اتفاقية المعلم')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('Please read it carefully. You need to accept it once before you open your dashboard.', 'يرجى قراءتها بعناية. تحتاج للموافقة عليها مرة واحدة قبل فتح لوحة التحكم.')}
          </p>
          <p className="text-xs text-muted-foreground">{t(`Version ${AGREEMENT_VERSION}`, `إصدار ${AGREEMENT_VERSION}`)}</p>
        </div>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed">
          {CLAUSES.map((clause, i) => {
            const c = isAr ? clause.ar : clause.en;
            return (
              <section key={clause.en.title} className="space-y-2">
                <h2 className="font-bold text-foreground">{`${i + 1}. ${c.title}`}</h2>
                <ul className="list-disc ps-6 space-y-1.5 text-muted-foreground">
                  {c.items.map(item => <li key={item}>{item}</li>)}
                </ul>
              </section>
            );
          })}
        </div>

        {!loading && !user ? (
          <div className="text-center">
            <Link to="/staff/login" className="inline-flex px-5 py-2.5 rounded-xl btn-primary-material text-primary-foreground text-sm font-semibold">
              {t('Sign in to accept', 'سجّل الدخول للموافقة')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4 border-t border-border pt-6">
            <label className="flex items-start gap-2.5 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 accent-teal-600"
              />
              <span>
                {t('I have read the teacher agreement and I accept it.', 'قرأت اتفاقية المعلم وأوافق عليها.')}
                {user?.email && <span className="block text-xs text-muted-foreground mt-0.5" dir="ltr">{user.email}</span>}
              </span>
            </label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="button" onClick={accept} disabled={!accepted} isLoading={busy || loading} className="w-full">
              {t('Accept and open my dashboard', 'أوافق وافتح لوحة التحكم')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
