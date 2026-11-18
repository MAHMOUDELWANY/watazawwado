import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Link } from '../LangLink';
import { Eye, MessagesSquare, DoorClosed, VideoOff, UserRound, ShieldAlert } from 'lucide-react';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, PageHero } from '../PublicDesignSystem';
import { Card } from '../../ui/Card';
import { WhatsAppIcon } from '../../ui/WhatsAppIcon';
import { buildWhatsAppUrl } from '../../../lib/whatsapp';

// Every point restates a rule already in the terms ("Children and safeguarding", /terms#children), RULES.md §2
// (our own lesson room, observers, no recording) or the privacy policy. No new promises here: change those first.
const POINTS = [
  {
    icon: Eye,
    en: ['You can watch live', 'Watch your child’s live lesson at any time from your parent account, without your child being disturbed. You can ask for a different teacher at any time.'],
    ar: ['تابع الحصة مباشرة', 'تابع حصة ابنك المباشرة في أي وقت من حساب ولي الأمر، دون أن يتشتت الطفل. ويمكنك طلب معلم آخر متى شئت.']
  },
  {
    icon: DoorClosed,
    en: ['Our own lesson room', 'Lessons happen in our own lesson room on the site. Our academy staff may also observe lessons to make sure every lesson meets our standards.'],
    ar: ['غرفة الحصص الخاصة بنا', 'تُعقد الحصص في غرفة الحصص الخاصة بوتزودوا داخل الموقع. وقد يحضر فريق الأكاديمية الحصص ليتأكد أن كل حصة على المستوى الذي نلتزم به.']
  },
  {
    icon: MessagesSquare,
    en: ['Talk stays on our platform', 'Teachers talk to students only in our lesson room and the chat on our site, which our team can read. They never move contact to a private account and never ask for personal details the lesson doesn’t need.'],
    ar: ['الحديث كله على المنصة', 'يتواصل المعلم مع الطالب في غرفة الحصص والمحادثة على موقعنا فقط، ويستطيع فريقنا قراءتها. لا ينتقل الحديث إلى أي حساب خاص، ولا يُسأل الطفل عن بيانات شخصية لا تحتاجها الحصة.']
  },
  {
    icon: VideoOff,
    en: ['No recording', 'Lessons are never recorded. A teacher may not record, photograph or screenshot your child without your permission.'],
    ar: ['لا تسجيل', 'الحصص لا تُسجَّل أبدًا. ويُمنع المعلم من تسجيل ابنك أو تصويره أو أخذ لقطة شاشة له دون إذنك.']
  },
  {
    icon: UserRound,
    en: ['You hold the account', 'A parent opens the family account and books for each child. You can see, correct or delete your child’s details at any time.'],
    ar: ['الحساب بيدك', 'وليّ الأمر هو من يفتح حساب الأسرة ويحجز لكل طفل. ويمكنك الاطلاع على بيانات ابنك أو تصحيحها أو حذفها في أي وقت.']
  },
  {
    icon: ShieldAlert,
    en: ['Tell us if anything worries you', 'Message us on WhatsApp or email support@watazawwado.academy straight away. We look into every report and may pause the teacher’s access while we do.'],
    ar: ['إن أقلقك شيء، راسلنا', 'راسلنا فورًا على واتساب أو على support@watazawwado.academy. نراجع كل بلاغ، وقد نوقف وصول المعلم حتى ننتهي من المراجعة.']
  }
] as const;

export function SafetyPage() {
  const { lang } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  return (
    <main id="main-content" className="pt-16 sm:pt-20 pb-16">
      <PublicSection>
        <div className="max-w-3xl mx-auto space-y-10">
          <PageHero
            title={isEn ? <>Your child’s <span className="text-ribbon">safety</span></> : <>أمان <span className="text-ribbon">ابنك</span></>}
            intro={isEn ? 'How every lesson with a child works, in plain words.' : 'كيف تسير كل حصة مع طفل، بكلام بسيط.'}
          />

          <ul className="grid sm:grid-cols-2 gap-4">
            {POINTS.map(({ icon: Icon, en, ar }) => (
              <li key={en[0]}>
                <Card className="h-full p-5 space-y-2">
                  <span className="w-9 h-9 rounded-xl bg-[#087D91]/10 flex items-center justify-center text-[#087D91] dark:text-[#12A4BC]">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <h2 className="font-bold text-foreground">{isEn ? en[0] : ar[0]}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{isEn ? en[1] : ar[1]}</p>
                </Card>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
            <a
              href={buildWhatsAppUrl(isEn ? 'Assalamu alaikum Watazawwado team, I have a question about my child’s safety in lessons.' : 'السلام عليكم فريق وتزودوا، عندي سؤال عن أمان ابني في الحصص.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold border border-border bg-surface text-foreground hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]"
            >
              <WhatsAppIcon className="w-4 h-4 shrink-0 text-[#12A4BC]" />
              <span>{isEn ? 'Ask us on WhatsApp' : 'اسألنا على واتساب'}</span>
            </a>
            <Link to="/terms#children" className="underline text-primary font-semibold py-3">
              {isEn ? 'Read it in our terms' : 'اقراها في الشروط'}
            </Link>
          </div>
        </div>
      </PublicSection>
    </main>
  );
}
