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

## Lyrics v3 (2026-11-20, after the owner sang v2)

v2 sounded uneven when sung: long al-Mutaqarib lines with substituted feet, and endings that clash (sukun endings
next to «ـادي»). v3 uses **majzu' al-ramal** (فاعلاتن فاعلاتن), the short, even rhythm of «طلع البدر علينا», which is
easy to sing. Every line is exactly two feet. Each stanza is four lines; lines 2 and 4 rhyme (the chorus also rhymes
line 1). The meaning stays indirect: the Quran, knowledge as zaad for the journey to the Hereafter, the family, the
language, the Seerah lived with mercy, the teacher who stays, coming back.

### Arabic

**[اللازمة]**
نُورُ قُرْآنِي وَزَادِي
وَبِهِ يُهْدَى فُؤَادِي
أَحْمِلُ العِلْمَ رَفِيقًا
فِي طَرِيقِي لِلْمَعَادِ

**[١: البيت]**
فِي صَبَاحِ البَيْتِ طِفْلٌ
يَقْرَأُ الآيَاتِ نُورَا
أُمُّهُ تُصْغِي وَتَدْعُو
رَبِّ فَاجْعَلْهُ شَكُورَا

**[٢: اللسان]**
لُغَةُ القُرْآنِ تَحْيَا
فِي قُلُوبٍ وَلِسَانِ
نَعْبُرُ الدُّنْيَا بِحَرْفٍ
مِنْ بَيَانٍ لِبَيَانِ

**[٣: الدين رحمة]**
سِيرَةُ المُخْتَارِ تَهْدِي
كُلَّ قَلْبٍ لِلرَّشَادِ
وَنَعِيشُ الدِّينَ حُبًّا
رَحْمَةً بَيْنَ العِبَادِ

**[٤: المعلّم]**
صَاحِبٌ فِي الدَّرْبِ يَمْشِي
يُمْسِكُ الكَفَّ رَفِيقَا
يَعْرِفُ اسْمِي قَبْلَ حَرْفِي
ثُمَّ يَبْقَى لِي صَدِيقَا

**[الختام]**
يَا بَعِيدًا عَادَ يَرْجُو
لَمْ يَزَلْ فِي البَابِ هَادِي
(ثم اللازمة)

Order: chorus, 1, chorus, 2, 3, chorus, 4, closing, chorus.

### English (its own lyric, same meaning, not a translation)

Four-beat lines in rhyming pairs (AABB), so it sits on one simple melody.

**[Chorus]**
The Book is my light when the road is long,
its words are my zaad, they keep me strong;
I gather the knowledge, I guard the light,
and walk toward home through the longest night.

**[1: home]**
A small voice rises before the sun,
one ayah, then two, and the day's begun;
his mother is listening, she quietly prays:
"Keep him close to Your Book all his days."

**[2: language]**
A language that carried the final Word,
the oldest of songs our grandparents heard;
we learn it and pass it from old to young,
a bridge between hearts in a living tongue.

**[3: mercy]**
We follow the Prophet ﷺ, the one who came
with mercy for all, not with fear or with blame;
we live what we learn, not in words but in deeds,
a gentle faith planted like quiet seeds.

**[4: the teacher]**
A friend on the road who walks at your side,
who knows you by name, not just as a guide;
when you slip he waits, when you fall he stays,
a teacher who's there through the hardest days.

**[Closing]**
And you who have wandered so far from the door:
come back, there is light, it is open once more.

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

1. Do the v3 lyrics sing well? Try the Arabic on the rhythm of «طلع البدر علينا». Change any line; I keep the metre.
2. Should the name «وتزوّدوا» be sung? It is a Quranic word (2:197). My advice: no; we sing «زاد» and keep the name
   spoken or written only.
3. v1 test (2026-11-20, 2 takes, 1,800 credits): wrong vowels, weak lyrics. Approve the one 20 s test above before any
   more generation.
4. Later, when we grow: record it with a real munshid so the voice is human and ours.
