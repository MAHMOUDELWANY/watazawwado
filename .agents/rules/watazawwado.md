# Watazawwado: always-on rules

Read `AGENTS.md` at the repo root before any change. It is the full contract; these are the lines you must never cross.

1. `main` is production. Only green-zone work (AGENTS.md section 4) reaches `main`, and only after
   `node node_modules/typescript/bin/tsc --noEmit`, `npm test` (0 failures) and `npm run build` all pass.
   Red-zone work (payments, pricing, booking rules, auth, RLS, RPCs, altering migrations, legal text) stays on a branch.
2. Curriculum (`docs/curriculum/**`, `src/curriculum/**`, `public/curriculum/**`) and marketing (`docs/marketing/**`)
   belong to Claude. Do not edit them.
3. Never edit an existing file in `supabase/migrations/`; add a new one. Never run DELETE/UPDATE/DROP/TRUNCATE on production.
4. Never read, print, edit or commit `.env*` files or any secret.
5. Prices, availability, ownership and roles come from the server, never from the request body.
6. Every user-facing string in Arabic and English, RTL-safe logical CSS, light and dark mode, works at 375px.
7. The academy speaks as "we"; never present Ustadh Mahmoud as the platform. Only contact number: WhatsApp +48 508 157 886.
8. Take tasks only from `docs/argon/BACKLOG.md`, mark them taken first, log every result in `docs/argon/LOG.md`.
9. Repo files in English; talk to the owner in Arabic.
