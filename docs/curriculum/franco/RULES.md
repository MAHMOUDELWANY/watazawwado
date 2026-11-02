# Franco · spelling rules and course rules (Claude's draft, 2026-11-02, for the owner's review)

The owner asked Claude to write the Franco rules himself and review them afterwards (2026-11-02). They serve two
versions: **Literacy C** (`literacy-c`, adults: learn to read and write Egyptian in Franco) and **Egyptian · Franco**
(`egyptian-franco`: the Egyptian Adults lessons with every Arabic line in Franco, `src/curriculum/franco.ts`).

## 1. Who it is for
Adults who will speak Egyptian with family, in-laws or friends and do not want to learn the Arabic script first (or
not yet). Franco is how Egyptians text each other: WhatsApp, Instagram, comments. Our learner must read what the family
sends and answer in the same spelling. Learners who want the script go to Literacy A instead.

## 2. The spelling (one fixed system; the lessons never mix spellings)
We follow what Egyptians actually type, and pick one form where they vary, so the learner sees one spelling for one sound.

| Sound | Arabic | Franco | Example |
|---|---|---|---|
| hamza, and the Cairo ق | ء / ق | **2** | 2alb (قلب), so2al (سؤال) |
| 'ayn | ع | **3** | 3arabi (عربي), ma3a (مع) |
| strong h | ح | **7** | 7abibi (حبيبي), saba7 (صباح) |
| kh | خ | **5** | 5eer (خير), 5alas (خلاص) |
| gh | غ | **gh** | ghaali (غالي) |
| sh | ش | **sh** | shokran (شكراً) |
| Egyptian g | ج | **g** | gamiil (جميل), gedid (جديد) |
| heavy t, s, d, z | ط ص ض ظ | **t s d z** (as Egyptians type; the audio carries the weight) | tayyeb (طيب), sabr (صبر) |
| ث، ذ | | as Cairo says them: **t / s**, **d / z** | talata (تلاتة), da (ده) |
| q | ق in a Fusha or religious word | **q** | Qur2an, qibla |

Vowels:
- Short: **a, e, o** (Cairo's i sounds like e: **esmak**, **enta**; its u sounds like o: **shokran**).
- Long: **aa, ee, oo** (the long i is **ee**, the long u is **oo**): baab, beet, noor. A long vowel at the end of a word
  is one letter: ana, enti, Masri.
- **ei / ai** only where Cairo really says a diphthong (rare): we write **ee** for بيت (beet), as Egyptians do.

Other rules:
- **Doubled letters** (shadda): write the letter twice: **sayyed**, **7abba**, **el bawwab**.
- **The article** is always **el**, written apart, even when it is said like the next letter: **el shams** (said
  esh-shams), **el noor**. The lesson says the sound; the spelling stays el.
- **و "and"** is **w** joined by a space: **w 3alaykom**, **ahlan w sahlan**.
- **Ta marbuta** is **a**: salama; in a construct **et**: **madraset el wad**.
- **Allah, names and places** keep their usual capitals: Allah, Adam, Mona, Masr.
- Punctuation as in English: ? , .
- No emoji, no capitals for stress, no numbers that are not letters (we write numbers as words).

## 3. Course rules (Literacy C)
1. **Reading first, writing light.** The learner reads real messages from day one; writing is answering short texts.
2. **One sound family per lesson,** heard (owner's own recordings), seen on a number, then read in real words.
3. **The scene is a phone:** an aunt in Cairo texts the learner; each lesson unlocks more of her messages. Our own
   messages and names, warm and modest, neutral praise ("Well done!", decision 7).
4. **Adults look:** the Adults paper stage; no characters drawn as a cast (decision 13: none for Adults); people as
   faceless figures when needed.
5. Every word on screen has Franco + the English meaning; Arabic script appears only as a faint shadow under the number
   letters (2 ء, 3 ع, 7 ح, 5 خ), to explain why that number was chosen.
6. Reviews are real moments (a message to read and answer), with the reason after each answer.
7. Every new word goes in `vocab` (Franco in `arabic` is not allowed: Literacy C vocab keeps the Arabic word and its
   Franco in `translit`), so the spaced-repetition deck works the same way.

## 4. For the owner to check
- The choice of **5** for خ and **gh** for غ (some Egyptians type 7' and 3').
- **ee / oo** for the long vowels, **e / o** for Cairo's short i / u.
- **el** always written as el.
