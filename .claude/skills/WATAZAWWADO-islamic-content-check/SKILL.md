---
name: WATAZAWWADO-islamic-content-check
description: Use to verify or review ANY religious content before it ships: a Quran verse, a hadith, a ruling, a Tajweed or Arabic-language example, a story of the prophets or companions, a dua, a date or Islamic-season claim, a "what scholars say", in a lesson, page, email, video script, caption, FAQ, AI-guide line or placement question ("راجع الآية", "تأكد من الحديث", "صحيح؟", "verify", "fact-check", "is this accurate"). Source-first, grounded in the Quran MCP, never from memory. Returns a pass/fail table with the fix.
---

# Watazawwado Islamic Content Check

A wrong word in a verse, a weak hadith or an invented ruling does more harm than any bug. This is a gate: it runs on a finished draft, checks every religious claim against a primary source, and returns a verdict per claim. It does not issue fatwas and it does not rewrite the lesson's teaching; it finds what is unverified and fixes the text.

## 1. Binding rules (from `docs/marketing/RULES.md` §1, `docs/curriculum/RULES.md`, root `RULES.md` §6)

1. **Quran text is never typed from memory.** Copy it from the Quran MCP (`fetch_quran`, `search_quran`) or quran.com, with the surah name and ayah number. Read the MCP's grounding rules first (`fetch_grounding_rules`) and pass its acknowledgement as the grounding nonce.
2. **Text first, paraphrase after.** Show the verse or hadith in full before any translation or explanation of it. An English page that shows a verse shows its meaning under it, naming the translation (e.g. Saheeh International).
3. **Hadith**: only sahih or hasan, with the collection and number (and the grade source). If unsure, cut it. Never "it is narrated" without a source.
4. **No fatwas.** A fiqh question gets: "Great question: ask your teacher in class or a scholar you trust." Teaching follows the balanced, moderate Azhari foundation in Aqeedah, Ahl al-Sunnah wal-Jama'ah. Scholar disagreements are not content. No degree claims about teachers.
5. **Recitation**: a teacher re-listens to every recited word before publishing. We never recite wrongly on purpose, even to demonstrate a mistake: "wrong vs right" uses isolated letters or practice syllables.
6. **Images and sound**: no depiction of prophets, companions or angels (not even faceless silhouettes with a face); no musical instruments; never any sound over recitation. Trading in religious imagery for decoration is a defect.
7. **Respect**: no jokes about religion; no trends that mock other Muslims or groups.
8. **Every claim traces to a source or is removed.** A date, a count (words, verses, letters), a number of rakaat, a name, an etymology, a "the word means": each needs a source.

## 2. Procedure

1. **Extract** every religious claim from the draft into a list: verses (with exact words), hadith, rulings, Arabic or Tajweed rules and examples, stories, numbers, names, terminology, dates.
2. **Verify each** against a primary source, in this order:
   - Quran verse: `fetch_quran` the exact ayah(s); compare letter by letter including diacritics and verse boundaries; check the surah:ayah label.
   - Translation: `fetch_translation` (name the edition); never paraphrase it into a "quote".
   - Meaning or context: `fetch_tafsir` / `search_tafsir` from a classical source (Ibn Kathir, al-Tabari, al-Qurtubi, al-Sa'di as available); say which.
   - Arabic words: `fetch_word_morphology`, `fetch_word_concordance` for roots, forms, counts and "the word occurs N times" claims.
   - Hadith: collection + number + grade; if the MCP does not hold it, mark **UNVERIFIED** and remove or ask the owner. Do not search the web and trust a blog.
   - Tajweed/Arabic grammar rules: check against the curriculum map for that level (`docs/curriculum/<subject>/MAP*.md`) and a recognised reference; the book is scope only, the wording stays ours.
3. **Classify**: ✅ verified (source named) · ✏️ fixed (what changed) · ❓ unverified (cut or ask) · ⛔ not allowed (rule above).
4. **Fix the draft** with only what sources support. Do not add new claims while fixing.
5. **Report** a table: claim | where it appears | source used | verdict | fix. Unverified items are listed first.

## 3. Common failures to look for

- A verse quoted from memory with one letter or one diacritic off; the verse cut mid-ayah to change its meaning.
- A translation presented as "the meaning" without naming the edition, or the Arabic paraphrased before it is shown.
- A hadith with no number, a weak or fabricated one ("he said ﷺ" on a saying that is not a hadith), a famous saying that is not authentic.
- "The Quran says X times" or "the most repeated word" without a count from the concordance.
- A ruling stated as settled where scholars differ, or any ruling at all in a lesson that should defer to the teacher.
- A story detail (names, numbers, dates) from a weak narration; Seerah events with invented dialogue.
- Egyptian colloquial or Franco spellings that change a Quranic or Fusha word.
- A Hijri or Gregorian date or a season claim asserted without a source (`src/lib/islamicSeason.ts` holds our season logic; check it before stating a date).
- Images or characters that depict a prophet or companion; music over a verse.

## 4. Limits

The check is only as good as the sources it can reach. If the Quran MCP is down, stop and say so; never fall back to memory. Unverified means cut, not "probably fine". When a point needs a scholar's judgment, route it to the owner and a qualified teacher and keep it out of the product until answered.
