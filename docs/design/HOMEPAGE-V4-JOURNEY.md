# Homepage v4: the page is a journey (2026-11-18)

Owner feedback on v3: no animation, feels lost and scattered, "I don't know what comes next", weak organisation and
visuals, too traditional. This is the direction that answers it.

## The idea

Our name is a call to take provision for a journey. So the page **is** the journey: six numbered stations, a gold
thread that draws itself as you scroll, Zad's bag that fills one step per station, and at the end of every station a
"Next: …" door. The visitor always sees where they are, how far they are and what is next.

## Story backbone (StoryBrand SB7, in our tone)

The family is the hero, we are the guide, Zad is the companion.

| Station | SB7 role | Content |
|---|---|---|
| Hero | Character + want | Brand line, one action, the kinetic film. |
| 01 Your child | Problem (gently, named by the parent) | Four familiar situations, then the three questions (self-persuasion). |
| 02 Who walks with you | Guide: empathy + authority | Real teachers with checkable facts, the safety facts. |
| 03 The lesson, and after | Success, shown | Pinned phone story: booked → live → the note arrives → the path (labelled examples). |
| 04 The plan | Plan + call to action | The whole offer once, three tiny steps, the button. |
| 05 The provisions | Product | Four subject tracks with their pages and prices. |
| 06 The teacher stays | Success vision | The flying carpet. |
| Arrival | Proof + objections + CTA | Reviews, questions, verse + three reminders. |

## Motion system (rules taken from the Bang Motion, Remotion-skill and Shotcraft READMEs; nothing installed)

- Never linear: expo-out and soft springs. Entrances combine rise + scale + fade; exits are faster than entrances.
- Staggers of 50–90 ms; nothing enters at once.
- Something always moves: drifting light in dark bands, the thread drawing, Zad idling, grain on dark surfaces.
- At most two pinned sections (the phone story, the carpet). Reduced motion: everything static and readable.
- One persistent thread across scenes (the gold journey line), not fades between unrelated blocks.

## Tools from the owner's videos

Bang Motion, video-shotcraft and claude-remotion-skill were read on the web (README and listings), not installed:
they run third-party scripts and download browsers and assets, which our rules do not allow from unknown sources.
Their rules are applied by hand above; we already have Remotion in `marketing/promo-video` if a rendered film is
needed later.
