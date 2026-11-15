---
name: WATAZAWWADO-brand-voice
description: Use for ANY user-facing words at Watazawwado, in English or Arabic: site and app copy, buttons, errors, empty states, emails, WhatsApp prefills, notifications, About and legal wording, AI-guide lines, headlines ("اكتب نص", "copy", "wording", "رسالة", "إيميل", "اسم الزر", "رسالة الخطأ"). Applies the binding voice rules (the academy speaks as "we", warm, short, 80/20 Arabic), writes both languages natively, then runs a tell-removal pass. Not for on-camera scripts (WATAZAWWADO-mahmoud-voice) or curriculum text (WATAZAWWADO-curriculum-builder).
---

# Watazawwado Brand Voice

One voice for every surface where the academy speaks. Output is finished copy in both languages, checked, never a draft with notes.

## 1. Read first (binding, in this order of authority)

1. Root `RULES.md` §6 (language, Arabic 80/20), §6b (mission, tone, "write little", "we not one person"), §2b (subjects), §3 to §5 (price and policy wording).
2. `docs/marketing/BRAND.md` §1 to §3 and §8 (brand line, what we say vs. what only customers say, honest "teacher stays", the nine moments).
3. `docs/ux/01-brand-and-voice.md` §8 to §17 (buttons, loading, errors, success, booking, pricing, cancellation, email, AI assistant). Its font names and its fully-Egyptian Arabic examples are older: RULES.md and `docs/design-system.md` win (Thmanyah; 80% friendly Fusha, 20% well-known Egyptian).
4. Reusable lines already approved: `src/data/content.ts`, `src/data/subjectPages.ts`, `src/data/seo.ts` and the bilingual pairs in the components, plus `server/notifications/emailTemplates.ts`. Grep for a phrase that exists before inventing one.

## 2. The voice in six rules

1. **We, not a person.** "We", "our team", "the Watazawwado team". Teachers appear as teachers of the academy. Never make Ustadh Mahmoud the platform (his teacher card, the legal trader, account emails and data ids are the only exceptions). Never "I".
2. **Warm, wise, a family home, still professional.** Not salesy, no hype, no childish tone, no corporate coldness.
3. **Write little.** Short headline, short paragraph, every sentence adds something the reader did not have. No eyebrows, no ALL CAPS labels, no `A · B · C` meta strings.
4. **Honest.** Never claim an outcome ("you will memorize in 3 months"), never fake urgency or scarcity, never say the system did something it did not. Success text appears only after the server confirms.
5. **We teach more than Quran and Arabic.** A headline never shrinks the academy to one or two subjects.
6. **Mission underneath, quietly.** ﴿وتزودوا فإن خير الزاد التقوى﴾ and ﴿وأما ما ينفع الناس فيمكث في الأرض﴾: deeds over words, something that stays. Felt, not quoted in every line. Any verse follows the religious-content rule in §6 below.

## 3. Pick the register by surface

| Surface | Register | Example |
|---|---|---|
| Home, onboarding, empty states, welcome, AI guide | Warm, light, plain | "جاهز للدرس الجاي؟" / "Ready for your next lesson?" |
| Booking, navigation, packages, forms | Clear and direct | "اختار الدرس اللي يناسبك." / "Choose what works for you." |
| Payment, confirmation, cancel, reschedule, refund, errors, legal | Calm, exact, **no slang, no emoji, no Zad** | "تم تأكيد حجز الدرس." / "Your lesson is confirmed." |
| Apology (we failed: late teacher, cancelled lesson) | Plain, from the team, within hours, no excuses, then the choice (new time, credit, refund) plus the 10 extra minutes | |

Legal pages stay in clear simple standard Arabic so nothing is ambiguous. Zad appears only in joy moments (waitlist, welcome, celebrations), never in payment, cancellation or refund text.

## 4. Craft rules by element

- **Buttons** name the exact action: "Confirm and pay", "Choose a new time", "Book this again". Not "Continue", "Submit", "Get started", "Manage".
- **Loading** says the task: "Checking your booking…", never "Loading…". Under 300 ms show nothing.
- **Errors** say what happened and what to do next, in plain words. Never leak a database, RPC, provider or stack message (RULES.md §7).
- **Cancel / reschedule** never guilts. "Cancel this lesson?" then the real consequence (3 h rule, trial 1 h rule). Never "Are you REALLY sure?".
- **Prices** are "from" prices for standard lessons; shorter lessons are proportional; savings are shown only if the maths is true. No contact number except WhatsApp +48 508 157 886.
- **Emails**: short subject, clear opening, one information card, one CTA, a help line, the standard footer. One language per email (English default; Arabic only if the person chose it). Sender mailbox matches the topic (support@, finance@, hr@, info@, privacy@).
- **WhatsApp prefills** greet "the Watazawwado team", state the booking ref and what the person needs.
- **Subject and level names** come from `src/components/onboarding/subjects.ts`, never retyped from memory.

## 5. Arabic and English are written, not translated

Write each from the intent, then compare meaning, not words. Arabic: friendly Fusha every Arab understands, plus a light touch of Egyptian words known from films and series ("عايز"، "كده"، "خلّينا"), in warm second person ("اختار"، "جاهز"). Never the stiff "هل أنت مستعد لدرسك القادم". Arabic has its own tells to avoid: "رحلة تعليمية مميزة"، "ارتقِ بتجربتك"، "نقدّم لك أفضل..."، "حيث"/"من خلال" chains, "في عالم..." openers, stacks of adjectives. English tells: see §7. Keep numbers, URLs and emails LTR inside Arabic; mixed lines stay readable ("Qur'an — 45 دقيقة").

## 6. Religious wording

Quran text, translation and counts come from the Quran MCP (read its grounding rules first), with surah:ayah; show the verse before any paraphrase; an English page that shows a verse shows its meaning under it. Hadith only with collection, number and an authentic grade. No rulings, no degree claims, few Azhar mentions: "balanced and moderate, with an Azhari foundation in Aqeedah, following Ahl al-Sunnah wal-Jama'ah" (RULES.md §6). If a fact cannot be verified, cut it.

## 7. The pass that removes machine voice (from the strongest external method, adapted)

After drafting, mark the tells, rewrite, then re-check the ones that survive most. Strongest first; one sighting is enough:

1. **Not X but Y** ("not just a school, a home"): say the claim directly.
2. **Closer lines** that repeat the paragraph ("That is the real win", "هذا هو الفرق الحقيقي").
3. **Deep-sounding sayings** ("at its core", "the language of trust", "رحلة", "بصمة").
4. **Staged openers** ("Let's dive in", "Here's the thing", "اكتشف الآن").
5. **Forced triads** and rows of fragments; **dashes everywhere**; **bold labels** on every item; inflated words (seamless, unlock, transform, journey, "أفضل", "استثنائي").
6. **Invented facts**: a number, name, date, quote or promise that no source gave us. Cut it; never keep it because it sounds good.

The sentence test: does this line add something the reader did not already have? If not, delete it. Vary sentence length. Read it aloud in both languages.

## 8. Ship checklist

- [ ] Speaks as "we"; no one person is the platform.
- [ ] Short; no filler line; no eyebrow; no all-caps.
- [ ] No promise of results, no fake urgency, no fake success.
- [ ] Button/loading/error/cancel rules in §4 hold.
- [ ] Arabic is 80/20 and natural, English is plain; both say the same thing in their own way.
- [ ] Transactional text has no slang, emoji or Zad.
- [ ] Prices, subjects, policy numbers match `RULES.md` and the code (check, do not recall).
- [ ] Verse/hadith rule in §6 holds.
- [ ] Existing phrases reused where they exist; every new string ships in both languages in the same change (pages use `useLanguage` from `src/lib/language.ts`; emails use the one language chosen).
