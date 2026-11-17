# Homepage intro film (owner request, 2026-11-17)

Replaces the teacher-duo photo in the homepage hero. One short film (~36 s) in the site identity: motion graphics
with Zad, cut with a few real clips of Ustadh Mahmoud teaching. The academy speaks as "we" (RULES.md §6b): Mahmoud
appears as one of our teachers, never as the platform. No price. Voice-over in the owner's clone (Fusha for Arabic,
English clone for English), written first; scenes are timed to the VO.

Status (2026-11-17): script approved by the owner. The hero already shows the film's opening idea as a live motion
piece (`src/components/public/homepage/HeroBag.tsx`: the four kinds of learning drop into Zad's bag), replacing the
teacher photos. Voice-over recorded on the new account (eleven_v4, `mahmoud-fusha` kO4IhVkRM0Oyq7qfKk0l and `mahmoud-english`
qcy21eeEO3C1xHhSLn3U), two takes each in `marketing/intro-film/vo/` (`ar-take1/2.mp3` ~26 s, `en-take1/2.mp3`
~27 s). The VO runs ~27 s, so the film is ~30 s (scenes retimed to the VO, short tail on the logo). Next: owner
picks a take per language and records clips A–E, then the voiced film goes into the hero (tap to play) on top of
the same visual.

## Hero behaviour

- Desktop: the film sits where the photo is now, 16:9, rounded, with the arch frame.
- Phone: under the headline, 4:5 crop of the same film.
- Starts muted with burned-in captions and loops the first 8 s; one tap plays the full film with sound from the start.
- Poster frame loads first (fast page); the video file loads after the page is idle. Reduced motion: poster + play button.

## Script

| # | Time | Picture | VO (Arabic, Fusha) | VO (English) |
|---|------|---------|--------------------|--------------|
| 1 | 0–3 s | Motion: Zad opens an empty travel bag, gold light inside. | لكلِّ رحلةٍ زاد. | Every journey needs provision. |
| 2 | 3–9 s | Clip A: Mahmoud at his desk, looks up, smiles, hand on chest. | في وتزوّدوا، يجلسُ معك معلّمُك، أنتَ وحدك، حصّةً بعد حصّة. | At Watazawwado, your own teacher sits with you, just you, one lesson at a time. |
| 3 | 9–17 s | Motion: four items fly into the bag, each lighting up a word: a mushaf (Quran), a path (Zad Path), the letter ض (Arabic), "Aa" (English). | قرآنٌ وتجويدٌ وحفظ، ومنهجُ زاد، والعربيّةُ والإنجليزيّة. | Quran, Tajweed and memorisation, the Zad Path, Arabic and English. |
| 4 | 17–24 s | Clip B (lesson on the laptop), then clip C (finger tracing a line of the mushaf). | معلّمٌ أو معلّمة تختارُه أنت، يعرفُ أين وصلت، ولا يبدأُ من الصفر. | A male or female teacher you choose, who knows where you are and never starts from zero. |
| 5 | 24–30 s | Motion: a phone slides in, the after-lesson note writes itself, a gold tick. | وبعد كلِّ حصّة، نخبرُك كيف كانت، قبل أن تسأل. | After every lesson, we tell you how it went, before you ask. |
| 6 | 30–36 s | Clip D (nod, warm smile), then Zad closes the full bag; the verse ﴿وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ﴾ writes in; logo. | الحصّةُ الأولى علينا. تعالَ نتعرّف. | The first lesson is on us. Come and meet us. |

## Shot list for the owner (phone, about 15 minutes)

Record horizontal (landscape), 4K if the phone allows, phone on a stand at eye level, daylight from a window in
front of you, quiet room, no music. Hold each shot 8–10 seconds, start and end with 2 seconds of stillness, and do
each one 2–3 times. You do not need to speak: the voice-over carries the words.

- **A. Welcome:** sitting at your desk, look down at the mushaf, then up into the camera, smile, hand on chest.
- **B. The lesson:** over your shoulder, you teaching on the laptop (use a test account screen, never a real
  student's face or name).
- **C. Close-up:** only your hand and the mushaf, finger moving slowly along one line.
- **D. Listening:** facing the camera, listening, a small nod, then a warm approving smile.
- **E. Goodbye (spare):** a small wave to the camera, as at the end of a lesson.

Send the files as they are (WhatsApp compresses them; Google Drive or a cable is better).
