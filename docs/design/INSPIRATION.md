# Design inspiration library (owner, 2026-11-01)

The owner's references for the site and the installed app. When the owner says "like the liquid button" or "like
Sparkle", this file says what is meant. Contact sheets (12 frames per video, left to right, top to bottom) are in
`docs/design/inspiration/`. Some are to copy as they are and some only to learn from; each row says which (owner, 2026-11-02). Unless a row says copy: our identity (ribbon gradient,
arch, khatam, Thmanyah/editorial type, espresso and cream) stays. Paid libraries (Mobbin, UXKIN) are not on our
plan; the research below comes from these files, public docs and the iOS web-app community.

## The references

| Name we use | File | What it shows | What we take |
|---|---|---|---|
| **Liquid button** | `site-ui/liquid-button.jpg` (recent.design, "Liquid Button") | A dark pill CTA that melts into an organic blob with a soft pink-purple glow on hover or press, then snaps back to the pill. | One signature press effect for the main CTA ("Book your free trial"), in our crimson-gold-teal, not pink-purple. Hover on desktop, press on touch. Respect reduced motion. |
| **Liquid Glass bars** | `site-ui/ipados26-liquid-glass.jpg` (iPadOS 26: App Store, Music, Settings, Home Screen) | Floating translucent tab bar pills that sit over content, shrink as you scroll down and grow back as you scroll up; a search pill; glass sidebar; content scrolls under the bar. | Our phone tab bar (portal and dashboard) floats as a glass pill and shrinks to icons on scroll down, back on scroll up (labels fade, pill narrows). Content scrolls under it. |
| **Signature intro** | `site-ui/signature-intro.jpg` (Michelle Kaye Fine Arts) | A calligraphic monogram draws itself stroke by stroke, then grows from the middle of the screen and fades while the page shows through; the photo unveils on a diagonal, the text wipes in. | **The transition is copied as it is** (owner, 2026-11-02): grow from the centre, paper opening from the middle, diagonal photo unveil, text wipe. **The writing is ours, not a copy:** "Watazawwado" written letter by letter in crimson from inline SVG paths, a gold swash ending in the khatam seal, "ACADEMY" under it. Plays every time the site or app is opened (once per session), skippable, off with reduced motion. |
| **Install bar** (was filed as "Language welcome") | `site-ui/language-welcome-and-install.jpg` (levigav.com) | The install bar at the top of the screen ("Install Levi Gavrilut · I build what I want to exist", Install) over the site's welcome screen. | **This reference is for the install pop-up, not the language screen** (owner, 2026-11-02). Our version: a card that comes down from the top by itself after the intro and the language choice, with our app tile, "Install Watazawwado", the domain and a teal Install button (`InstallAppNudge`). The language screen behind it was only a side idea: ours is built in our own identity (paper, khatam field, teal for the choice, crimson to continue), never the reference's dark gold look. |
| **Sparkle (promo video)** | `site-ui/sparkle-promo-video.jpg` (sparkle.ankatms.com video) | A 29s app promo: big two-word headlines ("Little wins.", "Tasks."), a 3D kid character, phone mockups tilting in, short scenes ("Every profile. One glance.", "Check in. Cheer on."), ending on the app icon and tagline. | The model for our app promo video (with the video skills): one idea per scene, real app screens in a phone frame, our Kids cast, a closing card with the icon. No music (RULES §1.6). |
| **Sparkle (scroll story)** | `site-ui/sparkle-scroll-story.jpg` (sparkle.ankatms.com page) | A landing page told as you scroll: a star counter in the header goes up as each section arrives ("Tasks become stars", "Progress you can see", "Something worth working toward", "Small wins become habits", "Built for the whole family" with kid view and parent view side by side), numbered principles, ends on the App Store button. Copy promises "No account needed · No ads · No tracking". | A scroll-told page for our app: lesson → homework → review → progress → certificate, each section a real screen; the kid view and parent view side by side. Our counter could be ayat reviewed, not stars. Note: Sparkle shows a "day streak"; we do not (NX-01: no streaks). |

## Folders

| Folder | Topic |
|---|---|
| `site-ui/` | Site and app chrome: buttons, bars, intro, install, promo/scroll story. |
| `zaadi-mascot/` | Zaadi, our mascot: how a simple mascot is built, poses, moods, motion. |
| `badges-and-rewards/` | Badge, level-up and reward reveals for homework and progress. |

## Zaadi and rewards (owner, 2026-11-09)

Sent with the homework task: "inspirations for badges and for Zaadi, from Duolingo". All of these are **inspire, not copy**: Duolingo's owl and its green are theirs, and we use no green (success = teal). Zaadi keeps its own shape and our palette (crimson, teal, copper, sand, gold, espresso).

| Name we use | File | What it shows | What we take |
|---|---|---|---|
| **Mascot construction** | `zaadi-mascot/construction-*.jpg` | One body silhouette (flat top with two soft ear bumps, wing flares, two oval feet), a separate face mask, eyes as tall ovals with a cut highlight, a tiny beak, three belly marks. Line art beside colour. | Build Zaadi the same way: a few flat parts (body, face mask, eyes, small mouth, feet) as separate SVG layers so each can move. Thick simple shapes that read at 32px. |
| **Poses with props** | `zaadi-mascot/poses-props.jpg` | Same mascot with a flag, a crown on books, a cap and drink, glasses, headphones, a pencil, a clipboard. | Zaadi poses per moment: books + crown for a finished unit, pencil for homework, clipboard for the teacher's report, headphones for listening tasks. |
| **Emotion stickers** | `zaadi-mascot/poses-emotions-stickers.jpg` | 17 moods: proud, shy, starry-eyed, crying, medal, mind-blown, chef, hugging, cheering foam finger. | A small mood set for feedback: proud (homework passed), starry eyes (new badge), gentle sad (missed), mind-blown (all correct), medal (unit review). No mocking or guilt faces. |
| **Sleepy / unimpressed** | `zaadi-mascot/mood-sleepy-*.jpg` | Half-closed eyes, deadpan. | Only as a soft "we miss you" for a homework not opened in days. Never shaming. |
| **Hype glow** | `zaadi-mascot/hype-*.jpg` | Mascot turned into a glowing silhouette (fire, flying with sparks, sunglasses in a flame). | The peak moment of a badge unlock: Zaadi turns gold-glow with sparks for ~1s, then back to normal. |
| **Mascot motion** | `zaadi-mascot/motion-*.mp4` (sheets in `zaadi-mascot/sheets/`) | Jump out of an empty "shell", idle look-around and turn, shy happy bounce with hands at cheeks. | Idle loop (blink, look left/right) on the homework tab; bounce when a homework is handed in; jump-in entrance on the result screen. Squash and stretch, spring easing, reduced-motion = still pose. |
| **Badge reveal** | `badges-and-rewards/badge-reveal-*.mp4`, `badge-ornate-ruby-idle.mp4` | Ornate badge shown, then it shatters into a light burst that collapses to a glowing core; idle shimmer on an ornate badge. | Badge unlock: the badge drops in, a gold light burst, settles with a slow shimmer. Our badges are flatter (arch + khatam motifs), not ornate game crests. |
| **Tap-to-open chest** | `badges-and-rewards/chest-tap-to-open-rare-epic.mp4` | Chest shakes on each tap ("Tap! Tap!", "1 chance left"), upgrades from Rare to Epic with a colour swap and a swoosh. | Optional: a "review chest" after a spaced-review set; tap to open. Rarity by result, colours from our palette. |
## Install the app (how it should appear by itself)

- **Android / Chrome / Edge:** today `src/lib/pwaInstall.ts` calls `preventDefault()` on `beforeinstallprompt`, which hides Chrome's own install bar (the one in the levigav screenshot) and shows only our banner. To let it appear by itself, stop preventing it on public pages and keep our banner as a second path. Adding `screenshots` (narrow, phone size) and a `description` to `public/site.webmanifest` gives Android the richer install sheet with pictures.
- **iPhone / iPad:** there is no automatic prompt on iOS. Since iOS 26, a site added from Share → Add to Home Screen opens as a web app by default ("Open as Web App" is on). We keep the step-by-step guide we already show, and add: detect in-app browsers (Instagram, Facebook, TikTok, Telegram) and tell people to open the page in Safari first, since those cannot add to the Home Screen; ask for notifications only after installing and only from a tap.

## Sources
- iOS web apps: [MobiLoud PWA on iOS 2026](https://www.mobiloud.com/blog/progressive-web-apps-ios/), [OneSignal iOS web push](https://documentation.onesignal.com/docs/en/web-push-for-ios), [progressivewebapps.com iOS guide](https://progressivewebapps.com/platforms/ios-safari/), [iOS PWA limitations 2026](https://tappwa.com/blog/ios-pwa-limitations-2026)
- Tab bar minimize on scroll: [Create with Swift](https://www.createwithswift.com/making-the-tab-bar-collapse-while-scrolling/), [expo-glass-tabs](https://github.com/davidmokos/expo-glass-tabs/wiki)
- Child login on own device: [Waterford QR login](https://help.waterford.org/waterford-family-app-browsers/waterford-family-logging-in-with-qr-code), [ClassDojo child QR](https://help.classdojo.com/hc/en-us/articles/360060108292-Access-Your-Child-s-Individual-QR-Code), [RoosterMoney child login](https://support.roostermoney.com/en/articles/2942965-how-to-log-in-to-the-child-account)
