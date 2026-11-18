# Homepage intro film (owner request, 2026-11-17)

Sits in the homepage hero, under the headline. One short voiced film (~27 s) in the site identity. Since 2026-11-18 it is kinetic typography (see docs/design/LANDING-LESSONS-2026-11-18.md): one phrase at a time on the voice, Zad in every scene. **No people on
camera** (owner, 2026-11-17: drop the owner clips, the film is about the academy, not one person). Six motion scenes
drawn in the page itself (`src/components/public/homepage/IntroFilm.tsx`), timed to the voice-over. No price.

Voice-over: owner's clone on the new ElevenLabs account (eleven_v4, `mahmoud-fusha` kO4IhVkRM0Oyq7qfKk0l, `mahmoud-english`
qcy21eeEO3C1xHhSLn3U). Owner picked take 1 for both: `marketing/intro-film/vo/ar-take1.mp3` (~26 s) and
`en-take1.mp3` (~27 s), served from `public/media/intro-film/{ar,en}.mp3`. Scene start times come from the silences in
each take (`STARTS` in IntroFilm.tsx); re-measure them if a take is replaced.

## Hero behaviour

- A poster (Zad's bag, the four subjects around it, "Our story · 30 s") paints on first load; nothing else loads.
- One tap plays the voice-over and the scenes, with captions burned in. Pause button top corner. At the end: "Watch
  again" and "Book the free first lesson".
- Stage: 16:9 on wide screens, 4:5 on phones. Reduced motion: scenes change with a fade only.

## Script (scenes as built)

| # | VO (Arabic, Fusha) | VO (English) | Picture |
|---|--------------------|--------------|---------|
| 1 | لكلِّ رحلةٍ زاد. | Every journey needs provision. | Zad's bag rises into a gold light. |
| 2 | في وتزوّدوا، يجلسُ معك معلّمُك، أنتَ وحدك، حصّةً بعد حصّة. | At Watazawwado, your own teacher sits with you, just you, one lesson at a time. | Two arches, "your teacher" and "you", joined by a gold thread; six dots light one by one. |
| 3 | قرآنٌ وتجويدٌ وحفظ، ومنهجُ زاد، والعربيّةُ والإنجليزيّة. | Quran, Tajweed and memorisation, the Zad Path, Arabic and English. | Four tokens wait on a shelf (mushaf, path, ض, Aa) and drop into the bag in turn. |
| 4 | معلّمٌ أو معلّمة تختارُه أنت، يعرفُ أين وصلت، ولا يبدأُ من الصفر. | A male or female teacher you choose, who knows where you are and never starts from zero. | A male and a female teacher card, one gets the teal tick; a bookmark moves on along a path. |
| 5 | وبعد كلِّ حصّة، نخبرُك كيف كانت، قبل أن تسأل. | After every lesson, we tell you how it went, before you ask. | A phone rises, the after-lesson note writes itself, "Sent to you". |
| 6 | الحصّةُ الأولى علينا. تعالَ نتعرّف. | The first lesson is on us. Come and meet us. | The verse ﴿وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ﴾, the bag, the academy name. |
