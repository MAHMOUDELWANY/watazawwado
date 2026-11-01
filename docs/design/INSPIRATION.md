# Design inspiration library (owner, 2026-11-01)

The owner's references for the site and the installed app. When the owner says "like the liquid button" or "like
Sparkle", this file says what is meant. Contact sheets (12 frames per video, left to right, top to bottom) are in
`docs/design/inspiration/`. They are references to learn from, not designs to copy: our identity (ribbon gradient,
arch, khatam, Thmanyah/editorial type, espresso and cream) stays. Paid libraries (Mobbin, UXKIN) are not on our
plan; the research below comes from these files, public docs and the iOS web-app community.

## The references

| Name we use | File | What it shows | What we take |
|---|---|---|---|
| **Liquid button** | `liquid-button.jpg` (recent.design, "Liquid Button") | A dark pill CTA that melts into an organic blob with a soft pink-purple glow on hover or press, then snaps back to the pill. | One signature press effect for the main CTA ("Book your free trial"), in our crimson-gold-teal, not pink-purple. Hover on desktop, press on touch. Respect reduced motion. |
| **Liquid Glass bars** | `ipados26-liquid-glass.jpg` (iPadOS 26: App Store, Music, Settings, Home Screen) | Floating translucent tab bar pills that sit over content, shrink as you scroll down and grow back as you scroll up; a search pill; glass sidebar; content scrolls under the bar. | Our phone tab bar (portal and dashboard) floats as a glass pill and shrinks to icons on scroll down, back on scroll up (labels fade, pill narrows). Content scrolls under it. |
| **Signature intro** | `signature-intro.jpg` (Michelle Kaye Fine Arts) | First visit: a calligraphic monogram draws itself stroke by stroke, grows and sweeps off, then the page reveals with the photo un-masking. | A first-visit intro: our logo mark / "وتزودوا" calligraphy draws itself (SVG stroke), then the hero reveals. Once per visitor, skippable, under 2 seconds, off with reduced motion. |
| **Language welcome** | `language-welcome-and-install.jpg` (levigav.com) | A full-screen welcome over a dimmed photo with film grain: "Choose your language", big serif options, the suggested one lit with a gold underline and a "Suggested" badge; "You can change it any time at the top". Chrome's own install bar sits on top. | First-visit language choice (English / العربية) with the suggestion from the browser language, in our editorial type. And: let the browser's own install prompt show (see Install below). |
| **Sparkle (promo video)** | `sparkle-promo-video.jpg` (sparkle.ankatms.com video) | A 29s app promo: big two-word headlines ("Little wins.", "Tasks."), a 3D kid character, phone mockups tilting in, short scenes ("Every profile. One glance.", "Check in. Cheer on."), ending on the app icon and tagline. | The model for our app promo video (with the video skills): one idea per scene, real app screens in a phone frame, our Kids cast, a closing card with the icon. No music (RULES §1.6). |
| **Sparkle (scroll story)** | `sparkle-scroll-story.jpg` (sparkle.ankatms.com page) | A landing page told as you scroll: a star counter in the header goes up as each section arrives ("Tasks become stars", "Progress you can see", "Something worth working toward", "Small wins become habits", "Built for the whole family" with kid view and parent view side by side), numbered principles, ends on the App Store button. Copy promises "No account needed · No ads · No tracking". | A scroll-told page for our app: lesson → homework → review → progress → certificate, each section a real screen; the kid view and parent view side by side. Our counter could be ayat reviewed, not stars. Note: Sparkle shows a "day streak"; we do not (NX-01: no streaks). |

## Install the app (how it should appear by itself)

- **Android / Chrome / Edge:** today `src/lib/pwaInstall.ts` calls `preventDefault()` on `beforeinstallprompt`, which hides Chrome's own install bar (the one in the levigav screenshot) and shows only our banner. To let it appear by itself, stop preventing it on public pages and keep our banner as a second path. Adding `screenshots` (narrow, phone size) and a `description` to `public/site.webmanifest` gives Android the richer install sheet with pictures.
- **iPhone / iPad:** there is no automatic prompt on iOS. Since iOS 26, a site added from Share → Add to Home Screen opens as a web app by default ("Open as Web App" is on). We keep the step-by-step guide we already show, and add: detect in-app browsers (Instagram, Facebook, TikTok, Telegram) and tell people to open the page in Safari first, since those cannot add to the Home Screen; ask for notifications only after installing and only from a tap.

## Sources
- iOS web apps: [MobiLoud PWA on iOS 2026](https://www.mobiloud.com/blog/progressive-web-apps-ios/), [OneSignal iOS web push](https://documentation.onesignal.com/docs/en/web-push-for-ios), [progressivewebapps.com iOS guide](https://progressivewebapps.com/platforms/ios-safari/), [iOS PWA limitations 2026](https://tappwa.com/blog/ios-pwa-limitations-2026)
- Tab bar minimize on scroll: [Create with Swift](https://www.createwithswift.com/making-the-tab-bar-collapse-while-scrolling/), [expo-glass-tabs](https://github.com/davidmokos/expo-glass-tabs/wiki)
- Child login on own device: [Waterford QR login](https://help.waterford.org/waterford-family-app-browsers/waterford-family-logging-in-with-qr-code), [ClassDojo child QR](https://help.classdojo.com/hc/en-us/articles/360060108292-Access-Your-Child-s-Individual-QR-Code), [RoosterMoney child login](https://support.roostermoney.com/en/articles/2942965-how-to-log-in-to-the-child-account)
