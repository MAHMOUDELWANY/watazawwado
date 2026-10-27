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
// (Zoom host and waiting room) or the privacy policy. No new promises here: change those first.
const POINTS = [
  {
    icon: Eye,
    en: ['You can sit in', 'Join any lesson whenever you like, and ask for a different teacher at any time.'],
    ar: ['تقدر تحضر معاهم', 'احضر أي حصة في أي وقت، وتقدر تطلب معلم تاني وقت ما تحب.']
  },
  {
    icon: DoorClosed,
    en: ['The teacher opens the room', 'The teacher starts every lesson as the Zoom host. Your child waits in the waiting room until the teacher lets them in.'],
    ar: ['المعلم هو اللي بيفتح الحصة', 'المعلم بيبدأ كل حصة كمضيف على Zoom، وابنك بيستنى في غرفة الانتظار لحد ما المعلم يدخّله.']
  },
  {
    icon: MessagesSquare,
    en: ['Talk stays on our platform', 'Teachers talk to students only in our Zoom lessons and the chat on our site, which our team can read. They never move contact to a private account and never ask for personal details the lesson doesn’t need.'],
    ar: ['الكلام كله على المنصة', 'المعلم بيكلّم الطالب في حصص Zoom والمحادثة اللي على موقعنا بس، وفريقنا يقدر يقراها. ومفيش نقل للكلام لأي حساب خاص، ولا سؤال عن بيانات شخصية الحصة مش محتاجاها.']
  },
  {
    icon: VideoOff,
    en: ['No recording', 'We don’t record lessons. A teacher may not record, photograph or screenshot your child without your permission.'],
    ar: ['مفيش تسجيل', 'إحنا مش بنسجّل الحصص. وممنوع المعلم يسجّل أو يصوّر ابنك أو ياخد له سكرين شوت من غير إذنك.']
  },
  {
    icon: UserRound,
    en: ['You hold the account', 'A parent opens the family account and books for each child. You can see, correct or delete your child’s details at any time.'],
    ar: ['الحساب في إيدك', 'ولي الأمر هو اللي بيفتح حساب العيلة وبيحجز لكل طفل. وتقدر تشوف بيانات ابنك أو تصححها أو تمسحها في أي وقت.']
  },
  {
    icon: ShieldAlert,
    en: ['Tell us if anything worries you', 'Message us on WhatsApp or email support@watazawwado.academy straight away. We look into every report and may pause the teacher’s access while we do.'],
    ar: ['لو حاجة قلقتك، كلّمنا', 'ابعتلنا على واتساب أو على support@watazawwado.academy على طول. بنراجع كل بلاغ، وممكن نوقف وصول المعلم لحد ما نخلّص المراجعة.']
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
            intro={isEn ? 'How every lesson with a child works, in plain words.' : 'إزاي بتمشي كل حصة مع طفل، بكلام بسيط.'}
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
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold bg-[#25D366] text-[#07361F] hover:bg-[#20BD5A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
            >
              <WhatsAppIcon className="w-4 h-4 shrink-0" />
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
