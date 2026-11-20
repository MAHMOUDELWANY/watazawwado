# Our nasheed (draft for owner review)

Status: **[Proposed 2026-11-20]**. Owner's idea: one nasheed that belongs to us, in Arabic and English, used under
carousel videos, at the end of YouTube lessons and courses, and later at events. Rules: `RULES.md` §1.6 (human voices,
at most a soft daf, our own lyrics, no ayah or hadith sung to a melody, commercial-use plan, stops before recitation).

## What we make

| Cut | Length | Use |
|---|---|---|
| Sting | ~5 s | "Pack your zaad" / «جهّز زادك» + one daf hit. End cards, intros, transitions |
| Bed | 30 s, loopable, voices low, few words | Under carousel videos and motion pieces (fades out over the last 3 s) |
| Full | 60–90 s | End of long YouTube lessons and courses, events, the homepage film later |

Arabic and English versions of each. Same melody in both, so the sound is recognisable in either language.

## Lyrics v2 (2026-11-20, after the owner's review of v1)

v1 was rejected: weak rhyme, sounded like an ad, and the model changed the vowels. v2 is a real nasheed: one metre
(al-Mutaqarib, فعولن فعولن فعولن فعول), each couplet rhymes, the chorus rhymes on «ـادي» (زادي، رشادي، فؤادي، هادي).
Themes: the Quran, knowledge as our zaad, Arabic and other languages, the family, the teacher who stays, coming back.
Full tashkeel on every word, because the music model pronounces what it is given.

### Arabic

**[اللازمة]**
سَلَكْتُ الطَّرِيقَ بِزَادِ اليَقِينْ ... وَفِي العِلْمِ نُورِي وَفِيهِ رَشَادِي
وَأَحْمِلُ فِي القَلْبِ حُبَّ الكِتَابْ ... وَحَرْفَ لِسَانِي وَنَبْضَ فُؤَادِي

**[المقطع ١: البيت والقرآن]**
صَغِيرٌ يُرَتِّلُ عِنْدَ الصَّبَاحْ ... فَيَمْلَأُ بَيْتًا ضِيَاءً وَنُورَا
وَأُمٌّ تُتَابِعُ آيَاتِهِ ... وَتَدْعُو لَهُ اللهَ قَلْبًا شَكُورَا

**[المقطع ٢: اللسان واللغات]**
وَنَبْنِي لِسَانًا بِأَصْلٍ فَصِيحْ ... وَنَعْبُرُ لِلنَّاسِ جِسْرَ البَيَانْ
فَنَحْفَظُ لِلضَّادِ عِزًّا قَدِيمًا ... وَنَفْتَحُ لِلْعَالَمِينَ اللِّسَانْ

**[المقطع ٣: المعلّم الذي يبقى]**
مُعَلِّمُنَا صَاحِبٌ لَا يَغِيبْ ... يَعُودُ إِذَا تُهْتُ دَرْبًا رَفِيقَا
يَرَى خَطْوَتِي قَبْلَ أَنْ أَسْأَلَهْ ... وَيَبْقَى عَلَى العَهْدِ دَوْمًا صَدِيقَا

**[الختام: العودة]**
فَيَا مَنْ بَعُدْتَ تَعَالَ قَرِيبًا ... فَفِي البَابِ نُورٌ وَفِي الدَّرْبِ هَادِي
(ثم اللازمة)

### English (written to sing, same melody)

**[Chorus]**
I walked this road with a lamp in my hand,
my zaad is the light that helps me stand;
the Book in my heart, its letters my guide,
a teacher who stays and walks at my side.

**[Verse 1: home]**
A child at the dawn reads soft and slow,
and the house fills up with a gentle glow;
his mother is listening, whispering a prayer:
"Ya Rabb, keep his heart forever there."

**[Verse 2: languages]**
We learn the old tongue our grandparents knew,
the words of the Book, and the world's words too;
a bridge between homes, from the young to the old,
a language of love that never grows cold.

**[Verse 3: coming back]**
If ever you've drifted, the door is still wide,
come back as you are, there is light inside.

## Generation plan (to save ElevenLabs credits, which also voice the curriculum)

1. **One test first:** the Arabic chorus only, about 20 s, one take, model `music_v2_5` (ElevenLabs' recommended
   model). Styles in English, lyrics with full tashkeel (ElevenLabs: "styles must be in English, lyrics can be any
   language"). Their docs say nothing about Arabic pronunciation, so this test decides whether the model can do it.
2. **Style words:** "a cappella", "soft intimate male vocals", "gentle daf", "slow", "quiet", "sparse"; "no instruments,
   no piano, no synths, no strings".
3. **Quiet background version: no extra credits.** We lower the volume ourselves when we mix it under a video
   (about -18 dB under the voice), and cut the 5 s sting and the 30 s bed from the full take.
4. If the test still changes the vowels: stop spending credits. Options then: the owner (or a munshid) records the
   Arabic vocals, and we keep the AI only for the English version.
5. ElevenLabs Music terms (09 Oct 2026): our Creator plan allows online and offline commercial use and streaming, no
   attribution needed, 62 minutes of music a month; we stay responsible for checking each output.

## Open questions for the owner

1. Do the v2 lyrics say what you want? Change any line freely; I keep the metre and rhyme.
2. Should the name «وتزوّدوا» be sung? It is a Quranic word (2:197). My advice: no; we sing «زاد» and keep the name
   spoken or written only.
3. v1 test (2026-11-20, 2 takes, 1,800 credits): wrong vowels, weak lyrics. Approve the one 20 s test above before any
   more generation.
4. Later, when we grow: record it with a real munshid so the voice is human and ours.
