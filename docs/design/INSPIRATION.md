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

## Competitor sites (owner, 2026-11-17)

Two screen recordings of competing academies, sent for the homepage rework. **Inspire only, never copy** (owner said it
three times). Their colours (Bilqalam's deep green and orange, Arabic101's yellow) are theirs; we use none of them.

| Name we use | File | What it shows | What we took |
|---|---|---|---|
| **Bilqalam** | `competitors/bilqalam-home-about.jpg`, `bilqalam-programs-pathfinder.jpg`, `bilqalam-course-page.jpg` | Hero is a captioned animated explainer video. Three promise columns with illustrations. "Where would you like to begin?" track cards. A two-step "who is this journey for? Child / Teen / Adult / Family → your best-fit path" finder. Course pages with "Watch before you start" and "Who will teach you". Rating line, payment FAQ. | The idea of a visitor reaching the right page in two taps: our **"Who is the learning for?"** finder (`PathFinder.tsx`), one tap, our own subject pages. The **"Who will teach you"** block and a drawn start path on our subject pages. The film-in-the-hero idea, done as our own Zad film. |
| **Arabic101** | `competitors/arabic101-hero-video.jpg`, `arabic101-academy.jpg` | Hero video on a chalkboard: hand-drawn arrows, a crossed-out list ("Arabic ✗ Tajweed ✗ Understand the Quran ✗"), "after years" timeline. Cut-out teacher photo with a sketchy outline. "Start your journey in 3 simple steps" joined by a line. | Only the lesson that one clear story beats many effects. Our hero became one idea: **Zad's bag being packed** (`HeroBag.tsx`), the same story the intro film tells. |

**Second pass (2026-11-18, all four recordings watched frame by frame every 3 s).** What makes both pages feel calm is
one rhythm repeated: small eyebrow, one big heading with one coloured word, one line, then one block. Our homepage now
does the same in our identity: centred hero + voiced intro film (motion, no people), four subject cards with deep
portals (Quran, Zad Path, Arabic, English) and links to the subject pages, "who is the learning for?", three promises
in espresso arches, the carpet (shorter scroll), three steps on a gold line in an espresso band, family reviews, FAQ
cards, and the verse in the closing band. Copy is ours; no Bilqalam or Arabic101 headline was reused.

## Lesson room (2026-11-18)

Research for the classroom (`docs/classroom/DESIGN-BRIEF.md`, which says per surface what we take). **Inspire only,
never copy**: no product's look or colours, our espresso stage, arch, khatam and palette stay. Links only so far; no
contact sheets yet (folder `lesson-room/` when the owner sends screen recordings).

| Name we use | Source | What it shows | What we take |
|---|---|---|---|
| **Meet join screen** | [Meet M3 Expressive (9to5Google)](https://9to5google.com/2025/06/21/google-meet-material-3-expressive/), [Meet controls update](https://workspaceupdates.googleblog.com/2024/06/updated-design-for-meeting-controls-google-meet.html) | Big self preview, mic and camera toggles on it, shapes and colours that change with state. | Waiting room: arch preview with the toggles on it, one big Join. |
| **Meet mobile bar** | [9to5Google, 2025-02](https://9to5google.com/2025/02/20/google-meet-controls-redesign) | Reactions one tap from a floating bar; the rest in an overflow on phones. | Phone bar with four items and More; reactions one tap away. |
| **Zoom 6.7 toolbar** | [Zoom blog](https://www.zoom.com/en/blog/zoom-workplace-simplicity-ui-updates/), [U-M notes](https://its.umich.edu/communication/videoconferencing/zoom/update/changes-zoom-desktop-app-interface-vers-670) | Essentials only in the bar, More for the rest, settings in a side panel instead of a pop-up. | No horizontal scroll in our bar; device settings in a side panel. |
| **Riverside lobby** | [What changed in the studio](https://support.riverside.com/hc/en-us/articles/36653757939485-What-s-changed-in-the-studio) | Larger lobby preview, devices chosen automatically, manual test on request. | Device pickers behind a disclosure when all checks pass. |
| **Whereby pre-call test** | [Announcement](https://whereby.launchnotes.io/announcements/ann_Ig1E3Ej4Jpln5) | Device and connection test before entering, with a "help me fix this" link. | Every waiting-room problem comes with its next step. |
| **Preply classroom** | [Tutor guide](https://help.preply.com/en/articles/4182374-preply-classroom-features-for-tutors-a-complete-guide) | Preview before joining shows whether the other person is in; notes feed the next lesson. | "Your teacher is here" in the waiting room. |
| **italki classroom** | [italki Classroom](https://www.italki.com/en/italki-classroom) | One setup screen, board and materials in the room, same layout on phone and desktop. | One room for everything; one setup step. |
| **Cambly Kids** | [Tutoring on Cambly Kids](https://support.cambly.com/hc/en-us/articles/4413976520973-Part-5-Tutoring-on-Cambly-Kids) | One tutor, one child, a shared lesson screen beside the faces; parent nearby; kids may keep the camera off. | Child mode: page and faces together, a calm guardian view. |
| **FaceTime** | [Apple: FaceTime reactions on Mac](https://support.apple.com/guide/facetime/fctm7d415422/mac) | The other person fills the screen; a small self tile you can move; very few controls. | Draggable self tile that snaps to corners. We skip the effect reactions. |
| **Liquid Glass (HIG)** | [HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials) | Glass is for the controls layer only, sparingly; clear glass over media needs a dim layer (~35%). | Glass only on the bar, capsule and notices; espresso scrims on video, no blur over video. |
| **tldraw presence** | [Collaboration docs](https://tldraw.dev/docs/collaboration), [laser release](https://tldraw.dev/blog/release-notes-20230526) | Named live cursors, a fading laser, follow-my-view. | Teacher pointer keeps a name tag and fades. |
| **Duolingo warmth** | [Shape language](https://blog.duolingo.com/shape-language-duolingos-art-style/), [illustration guide](https://design.duolingo.com/illustration) | Few colours, big simple shapes, humour that lowers the fear of mistakes. | Child "I need…" grid and Zad on the child's waiting and end screens. Not their green. |
| **Contact-centre monitoring** | [Zoom Contact Center](https://library.zoom.com/business-services/zoom-contact-center/zoom-customer-experience/supervisor-experience/call-monitoring), [Dialpad](https://help.dialpad.com/docs/call-monitoring-features) | Silent Listen from a live list, one supervisor per call, explicit escalation. | Admin observe = Listen only; a live-lessons list later. No whisper or barge. |
| **Proctoring review** | [Honorlock review](https://honorlock.com/blog/reviewing-proctored-exams/), [TAO multi-session](https://userguide.taotesting.com/user-documentation/latest/public/monitoring-multiple-sessions) | Timed flags, "needs attention" filter, a visit logged but not a mark against anyone. | Admin notes with "Mark this moment"; late-reasons filter. |
| **Self-view fatigue** | [Springer 2024](https://link.springer.com/article/10.1007/s12599-024-00874-7), [Stanford via New Atlas](https://newatlas.com/telecommunications/zoom-fatigue-video-exhaustion-tips-help-stanford) | Watching yourself all call adds strain. | Small self tile, "Hide my picture". |
| **Thumb reach** | [Hoober, UXmatters](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php), [Smashing](https://smashingmagazine.com/2020/02/design-mobile-apps-one-hand-usage/) | How people hold phones; the bottom-middle is easiest to reach. | Phone bar and Join at the bottom; notices above the bar. |

## Social video references (owner, 2026-11-20)

Nine short videos the owner likes for storytelling, visual presentation and script; they get views. **Inspire only:
we take the technique, never the content, colours or characters.** Our videos use our cast (Zad, faceless people,
never prophets, companions or angels, `docs/marketing/RULES.md` §1.5), our palette under the gradient rule (RULES §1.8)
and our sound (§1.6). Hadith and numbers in them are not checked by us; anything we reuse is verified first (§1).
The binding video rules that came out of this are `docs/marketing/PRODUCTION.md` §3b.

| Name we use | File | What it shows | What we take |
|---|---|---|---|
| **Straight Path** | `social-video/straightpath-walked-away.jpg` (@straightpathstories) | Black stage, a white stick figure walking away from a gold beam of light; one short serif line per beat ("years passed."); small red labels of what he dropped ("skipped fajr"); ends on the hadith qudsi in gold Arabic + English + source. | **Light as the emotion**: one figure, one beam, almost nothing else. One line at a time, lower-case, calm. The source line small under the text. Best fit for "Come back, no lecture". |
| **Numbers in the dark** | `social-video/aiishadahir-jahannam-numbers.jpg` (@aiishadahir) | Dark stage, one huge number per scene ("977 years", "70 years") with a short line above and below and the source under it; a single animated object (fire, 70 flames, a falling stone, an arch door). | **One big number or word per scene**, readable in half a second, with the source small under it. One object that acts out the line. |
| **Paper-craft doors** | `social-video/papercraft-jahannam-doors.jpg` (Arabic reel, 8 min) | Lit paper-craft dioramas, folded figures, glowing ayah card in a "REC" camera frame, Arabic subtitles. | Only the **lit, tactile, handmade look** for long videos. The "REC" frame and the theme are theirs. |
| **Notebook mystery** | `social-video/ancient-egypt-notebook.jpg` | Lined notebook paper, condensed bold headline that builds **word by word** with the voice, one word in an accent colour, "FIG. 3" labels, cut-out photos of objects, a big "2" for "second mystery", a timeline line with a date dot. | **Word-by-word headline synced to the voice** as the only text layer. The "file / figure" frame for teaching videos (letters, Tajweed). Cut-out objects instead of full-frame stock. |
| **Faris montage** (3 files) | `social-video/faris-compare-1.jpg`, `faris-compare-2.jpg`, `faris-compare-jannah.jpg` (@3nvus) | Side-by-side "my edit vs Faris's edit": the same script cut flat vs with After Effects motion: text that flies in and settles, a glowing ayah card, play/pause UI, background colour that follows the mood (plum, deep blue, cloud sky). | **Motion that serves the line**: text enters with a purpose (scale, blur-in, a word lighting up), cards that tilt and settle, mood shifts through the background colour. Built in our stack (Remotion/HTML), not After Effects. Dense analysis (cuts, timing, 14 moves, gap vs V7): [faris-analysis.md](inspiration/social-video/faris-analysis.md). |
| **Flat faceless cast** (2 files) | `social-video/3nvus-word-of-truth.jpg`, `3nvus-parents.jpg` (@3nvus) | Flat illustrated faceless men and women in thobes and abayas on clean blue or red gradients; thought bubbles with memories; speech bubbles; one Arabic line at a time; the ayah glowing on a dark end card. | **A faceless people cast** next to Zad, **thought bubbles for memories**, one line at a time, a dark glowing card for the ayah or hadith at the end. Backgrounds stay two-tone (RULES §1.8). |

**What every one of them does (and our V1–V15 did not):** one idea and one text layer per moment, motion every 2–3 s,
an emotional turn (tension → light), the source on screen, nothing in the bottom half that repeats the top. Ours were
static paper cards with a label on the card *and* a caption box under it saying the same thing.

## Folders

| Folder | Topic |
|---|---|
| `site-ui/` | Site and app chrome: buttons, bars, intro, install, promo/scroll story. |
| `competitors/` | Other academies' sites, for inspiration only. |
| `social-video/` | Short videos (Reels, Shorts, TikTok) the owner likes, for technique only (2026-11-20). |
| `zaadi-mascot/` | Zaadi, our mascot: how a simple mascot is built, poses, moods, motion. |
| `badges-and-rewards/` | Badge, level-up and reward reveals for homework and progress. |
| `lesson-room/` | The classroom: pre-join, call rooms, observer views (links only so far, see "Lesson room"). |

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
| **Game-pet emotes** (owner, 2026-11-13) | `zad-mascot/motion-game-pet-emotes.mp4` (sheet in `zad-mascot/sheets/`) | 3D game pets each playing one emote with heavy effects: flame burst in a heart shape, spin with a glowing ring trail, dash off screen with a comet trail and an impact explosion, red aura, teleport. A grid of emote buttons beside the stage. | Interactive 3D Zad (`/prototype/zad3d`): drag to turn, tap to react, eight emotes (wave, cheer, spin with a gold ring, love burst, dash with comet trail and ground impact, dua with a light column, proud, think). Our palette and gold sparks, no fire or violence. |
## Install the app (how it should appear by itself)

- **Android / Chrome / Edge:** today `src/lib/pwaInstall.ts` calls `preventDefault()` on `beforeinstallprompt`, which hides Chrome's own install bar (the one in the levigav screenshot) and shows only our banner. To let it appear by itself, stop preventing it on public pages and keep our banner as a second path. Adding `screenshots` (narrow, phone size) and a `description` to `public/site.webmanifest` gives Android the richer install sheet with pictures.
- **iPhone / iPad:** there is no automatic prompt on iOS. Since iOS 26, a site added from Share → Add to Home Screen opens as a web app by default ("Open as Web App" is on). We keep the step-by-step guide we already show, and add: detect in-app browsers (Instagram, Facebook, TikTok, Telegram) and tell people to open the page in Safari first, since those cannot add to the Home Screen; ask for notifications only after installing and only from a tap.

## Sources
- iOS web apps: [MobiLoud PWA on iOS 2026](https://www.mobiloud.com/blog/progressive-web-apps-ios/), [OneSignal iOS web push](https://documentation.onesignal.com/docs/en/web-push-for-ios), [progressivewebapps.com iOS guide](https://progressivewebapps.com/platforms/ios-safari/), [iOS PWA limitations 2026](https://tappwa.com/blog/ios-pwa-limitations-2026)
- Tab bar minimize on scroll: [Create with Swift](https://www.createwithswift.com/making-the-tab-bar-collapse-while-scrolling/), [expo-glass-tabs](https://github.com/davidmokos/expo-glass-tabs/wiki)
- Child login on own device: [Waterford QR login](https://help.waterford.org/waterford-family-app-browsers/waterford-family-logging-in-with-qr-code), [ClassDojo child QR](https://help.classdojo.com/hc/en-us/articles/360060108292-Access-Your-Child-s-Individual-QR-Code), [RoosterMoney child login](https://support.roostermoney.com/en/articles/2942965-how-to-log-in-to-the-child-account)
