# The "my edit vs Faris" reels: a dense analysis (2026-11-21)

Source: three reels by @3nvus in the owner's Downloads ("الفرق بين مونتاجي انا و فارس" ×2, "… نعيم الجنة").
Each one plays two edits of the same voice side by side. **The large right panel, labelled "مونتاجي", is the
polished edit we learn from.** The small left panel ("فارس") is the plainer version it is compared with. The owner
calls these "the Faris videos"; this file means the right panel whenever it says "the edit".

Method: right panel cropped, 4 fps sheets end to end (`faris-dense-1.jpg`, `-2`, `-3` here), 15 fps on four signature
moves, ffmpeg scene detection for hard cuts, ebur128 + silencedetect for sound.

## 1. Numbers

| | Reel 1 (ظالم/مظلوم, 31 s) | Reel 2 (أوّاب, 21 s) | Reel 3 (نعيم الجنة, 31 s) | Our V7 v4 (37 s) |
|---|---|---|---|---|
| Hard cuts | 5 (one per 6 s) | 4 | 5 | 9 + a flash each |
| New text or element | every 0.3–0.6 s, on the spoken word | same | same | every 1–3 s |
| Text layers on screen | 1 (the spoken line itself) | 1 | 1 | 2–3 (title + chip + sub) |
| Background moods | 3 (green-black, crimson, cream) | 3 (crimson, red moon, sand) | 3 (plum, pink cloud, night blue) | 2, fixed |
| Loudness | −17 LUFS, LRA 3 | −11, LRA 6 | −12, LRA 11 | −16.6 |

The finding that matters most: **they cut rarely and change constantly.** A "scene" is one stage that keeps building
for 5–8 s. Words arrive and swap in place, a figure enters, the camera keeps pushing, and only when the idea changes
does the whole frame blur out into the next mood. We did the opposite: many hard cuts, little change between them.

## 2. The moves, one by one

1. **The spoken line is the only text.** Every word appears as it is said (fade + slight blur-in, ~6 frames).
   No separate title, chip or subtitle repeating it. Size carries the hierarchy: the key word is 2–3× bigger.
2. **Stacked keyword swap.** Two or three words stacked in different sizes; when the voice moves on, one word is
   replaced *in place* and the rest stay: لا / مسلم → لا / توقف → مع / توقف → مع / الظالم / بحجة / القرابة.
   The layout never jumps, so the eye stays on it.
3. **Text on a path.** "هكذا قال نبينا عليه الصلاة والسلام" flows along a curved arc across the frame, word by word,
   over a blurred image of the previous scene.
4. **Characters as actors, one pose per verb.** Reel 2 reuses one faceless boy: sits with headphones on "يذنب",
   raises his hands on "يتوب", prostrates on "يسمّى أوّاب". Reel 1: the oppressor pushes in big, the victim slides in
   from the side on "مظلوم", a red-tinted double of the oppressor appears behind on "القرابة" (his people).
   Every figure enters with a push-in (scale 0.85 → 1, ~10 frames), never just fades.
5. **Multiplication for "many".** "ولو كرر الذنب ١٠٠٠": copies of the boy fill the frame while a counter ticks
   240 → 807 → 1000. One idea, made visible.
6. **Mood follows meaning.** The background is always a soft blurred texture that drifts slowly, never flat colour.
   It changes with the meaning: crimson for sin, the moon turns red on "منافقاً", sand for the turn to hope, pink
   cloud for "رؤية الله", night blue for "يكشف الحجاب".
7. **Recitation card.** For an ayah: a cream rounded card scales in empty, the text fades in grey, then each word
   darkens as it is recited (karaoke). A play button flips to pause under it, like an audio player. For a hadith:
   a white card under a header ("يقول النبي ﷺ"), with the key phrase in a second colour (teal there).
8. **Word chips.** A phrase said in passing ("فقال عليه الصلاة والسلام") pops in as round plum pills, one per word,
   drifting down together. A circular badge ("صحابي") with a small triangle pointer orbits beside the text.
9. **One word alone, glowing.** After the card, the key word stands alone with a white bloom (أوّاب), then one word
   per beat, centred, each replacing the last: والأواب / هو / كثير / الرجوع / إلى. It's the fastest stretch of the reel.
10. **Glowing word cloud.** The blessings (الخدم، الفاكهة، البساتين، الحور، الأنهار، الأشجار، القصور) glow and swirl
    around a small family figure, then the camera rushes through them.
11. **Depth reveal.** "رؤية … هو … أعظم نعيم" words fly in from depth, overlap at angles, then collapse into one
    big "الله". A build-up that resolves into one word.
12. **Transitions.** Full-frame blur-out/in between moods; letterbox bars slide in for the heaviest line
    ("تمنعه من الظلم"); a figure wipes past the camera. No flashes.
13. **Ending.** Quiet: one centred line ("والله المستعان"), a tiny signature, ~1 s of silence.
14. **Sound.** The voice carries it (low LRA in reel 1). No sharp hits on cuts; a soft bed and space before the end.

## 3. Where V7 v4 falls short of this

| Them | V7 v4 | Fix |
|---|---|---|
| 5 cuts, a stage that keeps building | 9 cuts + flash | 4 stages: hook (heart/dog) → mouth → test → close. Inside a stage, swap in place. |
| Only the spoken line on screen | Title + chip + sub | Drop chips/subs; the voice's own words build word by word; the key word big. |
| One pose per verb | A cut-out slides in and stays | Swap Noor's pose on the beat: surprised → think → happy; Zayn: point → shrug. |
| Mood colour follows meaning | Espresso/crimson fixed | Sand paper for teaching, deep crimson for the test, a warm gold-lit sand for "your heart is safe". Our palette only (RULES §1.8, no green). |
| Recitation card with karaoke | — | Not needed in V7. **V12 (three Quran words) and V9 (hadith) are built on it.** |
| Blur transitions | Flash + zoom-blur | Full-frame blur-out between stages; letterbox only for "Test time". |
| Multiplication / counter | — | V7: "a thousand times you've said K" could show copies; optional. |

## 4. What we take and what we don't

Take: rare cuts with constant building, the spoken line as the only text, in-place word swaps, a pose per verb,
mood colour, blur transitions, the recitation card, one-word-per-beat climaxes, the quiet ending.

Don't take: their colours (green-black, pink, night blue are theirs; we use crimson, espresso, sand, teal, copper,
gold), their figures (we use our curriculum cast and Meshy art), or a music bed (RULES §1.6, nasheed only where the
rules allow it).
