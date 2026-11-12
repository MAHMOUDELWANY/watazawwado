import React from 'react';
import { Link } from './LangLink';

/**
 * "New to Islam or to Arabic? Start here" (P4-031): a door for a newcomer who does not yet know the names of the
 * subjects. It opens the Zad Path on the Learning page, where Zad Essentials starts from the first things every
 * Muslim needs. `onOpen` replaces the link when the visitor is already on that page.
 */
export function NewToIslamDoor({ isEn, onOpen }: { isEn: boolean; onOpen?: () => void }) {
  const body = (
    <>
      <span className="block font-bold text-foreground">
        {isEn ? 'New to Islam, or to Arabic? Start here' : 'جديد على الإسلام أو العربية؟ ابدأ من هنا'}
      </span>
      <span className="block text-sm text-muted-foreground mt-0.5">
        {isEn
          ? 'Zad Essentials begins with the first things every Muslim needs, in plain words, with a male or female teacher.'
          : 'يبدأ «أول الزاد» بأول ما يحتاجه كل مسلم، بكلام بسيط، مع معلم أو معلمة.'}
      </span>
    </>
  );
  const cls = 'block w-full max-w-2xl mx-auto mt-8 p-4 sm:p-5 rounded-2xl border-2 border-[#8B4935]/40 bg-[#8B4935]/5 text-start hover:bg-[#8B4935]/10 transition-colors cursor-pointer focus-ring';
  return onOpen
    ? <button type="button" onClick={onOpen} className={cls} data-testid="new-to-islam-door">{body}</button>
    : <Link to="/learning?family=islamic_studies" className={cls} data-testid="new-to-islam-door">{body}</Link>;
}
