# Packages & discounts

Status: **Approved by the owner on 2026-10-14 and live** in `package_catalog` (migration `20261014000002`). Rows exist for 30, 45 and 60-minute lessons.

## Principles

- Built on the approved hourly rates: **$9/hour** (Quran, Tajweed, Islamic studies) and **$13/hour** (Arabic, English).
- Real but modest savings that reward commitment, never a "fire sale". The biggest discount is about 11–12%, so the teacher's time is never undersold.
- Prices are shown as a clear **per-hour price** and an honest "you save $X". No countdowns, fake scarcity or pressure.
- A package is for one subject group (the $9 group or the $13 group) and is used for that group's lessons only.
- Shorter lessons use the same rule as single lessons: price = package hourly rate × minutes / 60.

## Package tiers (per month)

| Package | Lessons | $9 group: price per hour | $9 group: total (60 min) | You save | $13 group: price per hour | $13 group: total (60 min) | You save |
|---|---|---|---|---|---|---|---|
| Single lesson | 1 | $9.00 | $9 | — | $13.00 | $13 | — |
| Steady start | 4 (1 per week) | $8.50 | $34 | $2 | $12.25 | $49 | $3 |
| Committed learner | 8 (2 per week) | $8.25 | $66 | $6 | $12.00 | $96 | $8 |
| Fast progress | 12 (3 per week) | $8.00 | $96 | $12 | $11.50 | $138 | $18 |

Examples with shorter lessons (12 × 30 min, $9 group): 12 × $8.00 × 0.5 = $48 instead of $54.

## Family discount (siblings)

- When a parent account buys a package for a **second (or third…) child**, that child's package gets an extra **5% off**.
- The first child pays the normal package price.
- Shown with warm wording, for example "Family care: 5% off for siblings".
- Total discount never exceeds about 16% (12-lesson package + family).

## What changes in the system after approval

1. Replace the live `package_catalog` rows with the table above (one row per group × lesson count). No packages have been sold yet, so nothing existing is affected.
2. Enforce at booking time that a package credit is used only for its subject group.
3. Apply the family discount on the server when the package is created; the browser never sends prices.
4. Update the pricing page, the student packages page and the booking flow to show these numbers from the server.
