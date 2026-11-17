# The owner's report (Arabic Artifact page)

One private page per content folder, Arabic only, `dir="rtl"`, readable on a phone first. Load the `artifact-design`
skill before writing it. Brand palette (crimson, teal, copper, sand, gold; no green), light and dark.

Order of the page:
1. **Header:** subject, band, date, commit, what was reviewed, what was **not checked** (one line, visible).
2. **Course verdict** in one line, the score, and a table: lesson · verdict · score · blockers · majors · minors.
3. **The ten findings that matter most** across the folder, worst first.
4. **Course-level findings** (the web between lessons, progression, consistency, design system, add / cut).
5. **Per lesson** (a collapsible section each): verdict line, score breakdown by area, then findings grouped by
   severity. Each finding is a card:
   - id and severity, the expert who raised it, the place (lesson, page, step, viewport);
   - **العيب** in one or two sentences;
   - **الدليل**: the quoted line, or the screenshot (crop the tile from the sheet, embed as a compressed JPEG data URI,
     at most ~60 KB each; blockers and majors always get their image, minors only when the picture is the point);
   - **ليه ده عيب** with the principle named;
   - **الإصلاح** as the concrete change.
6. **يُحفظ:** what must not be broken, a few plain lines.
7. **اعتراضات على القواعد:** rule challenges.
8. **ملاحظات حُذفت بعد التحقق:** the count of refuted findings and the three most instructive, so the owner can audit
   the filter.

Writing: plain Egyptian-friendly standard Arabic, short sentences, no praise, no hedging. English stays only for quoted
lesson lines, file names and finding ids. The owner answers per finding by id in chat ("اقبل F03، ارفض F07 لأن…").

Keep the page under the Artifact size limit: resize crops to at most 900 px wide before embedding.
