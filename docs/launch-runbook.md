# Launch runbook

What to check before opening the academy to the public, what to do when something breaks, and the first
24 hours. Free tools only. The admin health page is **Dashboard → System health** (`/dashboard/health`,
super admin only).

## 1. Before launch (checklist)

- [ ] **Placement test mode off.** `PLACEMENT_BEFORE_BOOKING` in `server/routes/community.ts` is still `true`
      (temporary). The health page shows a yellow banner while it is on. Ask Claude to switch it off; it is a
      booking rule (RULES.md), so only the owner decides when.
- [ ] **Test accounts removed.** Delete the test students, guardians and bookings made while testing (ask Claude
      for the list from the database first; nothing is deleted without the owner seeing it).
- [ ] **Auth emails pasted into Supabase** (Authentication → Email Templates): Confirm signup, Reset password and
      Invite user, from `docs/email-previews/*-supabase.html` (subjects are in each file's `<title>`).
- [ ] **Supabase Auth URLs** allow `https://watazawwado.academy/**` (set-password and OTP links need it).
- [ ] **Vercel Firewall rules on:** "Block exploit probes" and "Rate limit AI and contact" (docs/STATUS.md).
- [ ] **Stripe live mode:** webhook endpoint enabled and `STRIPE_WEBHOOK_SECRET` set in Vercel.
- [ ] **Reminder cron running** on cron-job.org every 10 minutes (docs/production-reminder-scheduler.md).
- [ ] **Uptime monitor set up** (section 2).
- [ ] **System health page all green** or each amber row understood.

## 2. Uptime monitor (5 minutes, free)

`GET https://watazawwado.academy/api/health` answers `{"status":"ok"}` with no secrets and no database details.

1. Production sits behind Vercel's bot challenge, so a monitor gets 403 until it is allowed through. In Vercel →
   the project → **Firewall → Rules → Add rule**: name "Uptime monitor", condition *Request Path* *equals*
   `/api/health`, action **Bypass**. Save and publish.
2. Create a free account at [UptimeRobot](https://uptimerobot.com) (or any free HTTP monitor).
3. **Add New Monitor** → type **HTTP(s) - Keyword**, URL `https://watazawwado.academy/api/health`, keyword `ok`,
   interval 5 minutes.
4. Alert contact: the owner's email (and the UptimeRobot phone app if wanted).
5. Check the monitor turns green within 5 minutes. If it shows 403, step 1 is missing.

The reminder cron is watched from inside: every successful run is recorded, and the health page turns amber after
30 minutes without a run and red after 2 hours.

## 3. When something breaks

| Symptom | First step |
| --- | --- |
| Site down / uptime alert | Vercel → Deployments: is the latest production deployment red? Roll back (below). |
| A deploy broke a page | Roll back in Vercel, then tell Claude what broke. |
| Payments fail or a student paid and the lesson is still pending | Dashboard → Bookings / payments; Stripe → Payments for the charge. Message the student on WhatsApp (+48 508 157 886) that we are on it; never confirm a paid lesson by hand without the Stripe charge. |
| Stripe webhook row red/amber | Stripe → Developers → Webhooks: endpoint enabled, recent deliveries 2xx. |
| Emails not arriving | Health page email rows; Brevo dashboard (daily free limit, blocked sender). |
| No Zoom link on a lesson | Health page Zoom/calendar row; add the link by hand in the booking and tell the teacher. |
| Teacher calendar not syncing | The teacher reconnects Google Calendar from Settings. |
| Errors on the health page | Copy the top error (message + path) to Claude. |

**Roll back in Vercel:** Vercel → the project → **Deployments** → the last deployment that worked (marked
Production before the bad one) → **⋯ → Promote to Production** (or **Instant Rollback**). It takes effect in
seconds. Database migrations are not rolled back by this; tell Claude if the bad release had one.

**Who to message:** students affected by a payment or lesson problem get a WhatsApp message from the academy
number; teachers affected get a message in the dashboard chat. Stripe support for a Stripe outage
(status.stripe.com first).

## 4. First 24 hours

- Morning, midday and evening: open **System health**; all rows green or understood.
- After the first real booking: the student got the confirmation email, the lesson has a Zoom link, the teacher's
  calendar has the event, the 24h reminder is scheduled.
- After the first real payment: the Stripe webhook row shows a recent time and the booking is confirmed.
- Read the error list; send anything new to Claude.
- Uptime monitor: no alerts.
