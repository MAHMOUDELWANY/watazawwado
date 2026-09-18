# WATAZAWWADO — BRAND, VOICE & TYPOGRAPHY FOUNDATION

## 1. Brand Essence
Watazawwado is **a place, not just a website.** 
It is a serious, human, one-to-one teaching relationship supported by excellent technology. The emotional balance we strive for is **Warm + Welcoming + Human**, while remaining firmly **Serious + Trustworthy + Professional**. It is a space where students, parents, and teachers feel that things are organized and that they are cared for.

## 2. Brand Personality
- **Warm:** Inviting, empathetic, and encouraging.
- **Grounded:** Honest, rooted in reality, and practical.
- **Clear:** Direct and easy to understand; free of confusion.
- **Trustworthy:** Reliable, secure, and confident.
- **Human:** Conversational, empathetic, and relatable.
- **Modern:** Clean, structured, and friction-free.
- **Respectful:** Culturally appropriate and mindful of the student's time and effort.

## 3. What Watazawwado is / is not
**Watazawwado IS:**
- A personal teaching platform centered on a human relationship.
- A calm and structured environment for learning.
- Respectful and professional.

**Watazawwado IS NOT:**
- Childish or overly game-like.
- Flashy or trend-chasing.
- Salesy or manipulative.
- Corporate-cold or robotic.
- Generic AI or a template SaaS.
- Overly formal (unless transactional) or overly casual (slang-heavy).

## 4. Voice Principles
- **Intent over literal translation:** English and Arabic are not required to be word-for-word translations. They must communicate the exact same intent and personality naturally in each language.
- **Human over machine:** The writing must sound like a thoughtful human product team wrote it, not a machine translation or an AI text generator.
- **No generic marketing fluff:** Avoid clichés like "Unlock your potential," "Transform your learning," or "رحلة تعليمية مميزة" unless absolutely required by the context.

## 5. English Voice
- **Warm & Clear:** Use simple, direct, and reassuring language. 
- **Example:** "Ready for your next lesson?" instead of "Are you prepared to commence your next educational session?"

## 6. Arabic Voice
- **Natural & Welcoming:** Use approachable Arabic that feels native to the user, bridging standard clarity with conversational warmth where appropriate.
- **Example:** "جاهز للدرس الجاي؟" instead of "هل أنت مستعد لدرسك القادم؟" (unless in a highly formal context).
- **Example:** "اختار اللي يناسبك." instead of "اختر ما يناسبك."

## 7. Formal vs. Conversational Contexts
- **Conversational / Warm:** Home page, onboarding, friendly empty states, AI assistant, and learning encouragement. 
  - *Example:* "أهلاً بيك 🌿" / "Hey 👋"
- **Clear / Direct:** Booking flows, navigation, packages, and forms.
  - *Example:* "اختار الدرس اللي يناسبك." / "Choose what works for you."
- **Reassuring / Professional (Formal):** Payment, booking confirmation, cancellation, rescheduling, error states, and transactional emails.
  - *Example:* "تم تأكيد حجز الدرس." / "Your lesson has been confirmed." (No slang in these contexts).

## 8. Copywriting Rules
- **Headings:** Must be short, meaningful, specific, and conversational when appropriate. No paragraph-length headings or vague slogans.
- **Action-Oriented:** Language should focus on what the user is actually doing.
- **Honesty:** Never claim a system is doing something it isn't (e.g., no fake success or fake processing).

## 9. Button / Action Language
Buttons must describe the exact action clearly.
- **Prefer:** `Book this again` | `Choose weekly` | `Confirm & pay` | `Reschedule lesson`
- **Avoid:** `Continue` | `Get started` | `Submit` | `Manage`

## 10. Loading Language
Avoid generic "Loading...". Use task-oriented language that reflects the actual operation.
- **Examples:** `Loading your lesson options…` | `Checking your booking…` | `Preparing your payment…`

## 11. Error Language
Errors must never expose stack traces, SQL errors, RPC names, or implementation details.
Errors must explain:
1. What happened.
2. What the user can do next.
- **Example:** "We couldn't confirm this time slot. Please choose another available time."

## 12. Success Language
Never use fake frontend success. Success language is only shown after the server-side operation genuinely succeeds.
- **Example:** `Your lesson is confirmed.` | `تم تأكيد حجز الدرس.`

## 13. Booking Voice
Booking is the most important commercial workflow. The language should feel simple and confident based on the mental model: **Choose → Schedule → Review → Pay → Confirm**.
- **Last booking:** `Your last lesson` → `Book this again`
- **Fresh booking:** `Choose something different`
- **Packages:** `Choose how you'd like to learn`
- **Single:** `For when you want flexibility.`
- **Weekly:** `For a steady weekly rhythm.`
- **Monthly:** `For a longer learning plan.`

## 14. Pricing Voice
Pricing communicates value without manipulation.
- **Allowed:** Clear savings (if mathematically true), recommended plans (with real product reasons), simple comparisons, clear billing frequency, transparent totals, and renewal info.
- **Forbidden:** Fake scarcity, fake countdowns, hidden cancellations, confusing units, deceptive anchoring, and manipulative defaults.

## 15. Cancellation / Reschedule Voice
The product should never guilt users. Do not use emotional manipulation.
- **Cancellation:** `Cancel this lesson?` (Followed by a clear explanation of consequence). Avoid: "Are you REALLY sure?"
- **Reschedule:** `Choose a new time` → `Confirm new time`.
- **Policy Enforcement:** If a policy prevents an action, explain the real reason clearly.

## 16. Email Voice
Transactional emails should feel like they come from the same company as the website: calm and scannable.
- **Structure:** 
  1. Short subject 
  2. Clear opening 
  3. Important information card 
  4. Primary CTA 
  5. Help/support line 
  6. Consistent footer.
- **Rule:** Do not create giant marketing emails.

## 17. AI Assistant Voice
The AI assistant is a companion, not the authority. It should not sound robotic.
- **Preferred Arabic:** `أهلاً 👋 عايز نبدأ بإيه؟`
- **Preferred English:** `Hey 👋 What do you need?`
- **Avoid:** `Hello! I am your AI-powered learning assistant. How may I assist you today?`
- **Quick Actions:** `Book a lesson` | `See my next lesson` | `Compare plans` | `Ask about learning`

## 18. Arabic Typography Rules
Arabic typography requires its own independent metrics.
- **Line-height:** Arabic text often requires slightly looser line-height than Latin text to accommodate taller ascenders/descenders and diacritics.
- **Tracking / Letter-spacing:** Do NOT apply aggressive negative letter-spacing to Arabic. Arabic script is cursive; tight tracking breaks connections and readability. Use neutral or very subtle adjustments.
- **Sizes:** Arabic UI text often needs to be 1-2px larger than its English counterpart to achieve the same optical weight and readability.

## 19. English Typography Rules
Follow clean, modern UI standards.
- **Readability:** Minimum body size is 16px. Line height 1.5–1.7. 
- **Tracking:** Headings can have slightly tighter tracking; uppercase labels should have wider tracking.

## 20. RTL Rules
RTL is not just `direction: rtl`.
- **Mirroring:** Mirror layout direction, navigation, sidebars, progress indicators, back buttons, chevrons, and UI flow.
- **Do NOT Mirror:** Logos, brand marks, photos, media controls, and LTR-specific text (like URLs or email addresses).

## 21. Font Candidates
Research validated the following strong pairings:
1. **IBM Plex Sans Arabic + IBM Plex Sans** (Coordinated family, strong UI readability).
2. **Cairo + Poppins** (Popular, but can feel too generic).
3. **Amiri + Fraunces** (Excellent for display, traditional, and editorial, but not ideal for dense data UI).

## 22. Chosen Typography Baseline + Rationale
**Primary UI (Sans):** `Plus Jakarta Sans` (English) + `IBM Plex Sans Arabic` (Arabic)
**Rationale:** Plus Jakarta Sans offers a clean, modern, and warm geometric base. IBM Plex Sans Arabic provides excellent legibility, supports modern UI metrics perfectly, and bridges the gap between professional structure and humanist warmth.

## 23. Display Typography Rules
**Display / Editorial (Serif):** `Fraunces` (English) + `Amiri` (Arabic)
- **Rule:** Reserve display serifs for large landing-page headings, marketing callouts, or editorial quotes. Do not use for dense data, forms, or small buttons. 
- The current implementation in `index.html` and `src/index.css` correctly establishes this foundation.

## 24. Accessibility Rules
- **Contrast:** Pass WCAG AA (4.5:1 for body text). Never put gray text on a colored background.
- **Focus:** Ensure visible focus states for keyboard navigation.
- **Touch Targets:** On mobile, touch targets must be at least 44px.
- **Labels:** Ensure all interactive elements have meaningful, screen-reader-friendly text.

## 25. Do / Don't Examples
- **DO:** "اختار اللي يناسبك." (Warm, natural).
- **DON'T:** "اختر ما يناسبك من باقاتنا الاستثنائية لترتقي بتجربتك." (Generic, AI-sounding, corporate translation).
- **DO:** "Cancel this lesson?"
- **DON'T:** "Are you sure you want to cancel and lose your progress?"

## 26. Real Watazawwado Examples
- **English UI:** `Ready for your next lesson?` | `Book this lesson again` | `Choose your learning rhythm`
- **Arabic UI:** `جاهز للدرس الجاي؟` | `احجز نفس الدرس تاني` | `اختار خطة التعلم اللي تناسبك.`
- **Mixed Transactional:** `Qur'an — 45 دقيقة` | `Saturday · 7:00 مساءً` | `EGP 1,200`
