# Brevo Transactional Email Integration Guide

This guide details the setup and operational procedures for transactional email delivery on the **Mahmoud Teaching Platform** using **Brevo** (formerly Sendinblue).

---

## 1. Why Brevo for Mahmoud's Platform

- **Free Tier**: 300 free emails per day with full API access (ideal for 1-on-1 teaching operations).
- **Deliverability**: High inbox placement for Gmail, Outlook, iCloud, and international ISPs.
- **Server-Only Security**: Uses HTTPS API v3 (`https://api.brevo.com/v3/smtp/email`) with server-side authentication.
- **Transactional Templates**: Standardized, responsive emails for bookings, free trials, reminders, payment receipts, and teacher alerts.

---

## 2. Step-by-Step Setup Guide

### Step 1: Create a Free Brevo Account
1. Go to [https://www.brevo.com](https://www.brevo.com) and click **Sign Up Free**.
2. Complete account registration with your teaching business email: `mahmoudelwany98@gmail.com`.

### Step 2: Verify Your Sender Identity
1. In the Brevo dashboard, navigate to **Senders & IP** (or click your profile menu in the top-right -> **Senders & IPs**).
2. Click **Senders** -> **Add a sender**.
3. Fill in:
   - **From Name**: `Mahmoud Elwany`
   - **From Email**: `mahmoudelwany98@gmail.com`
4. Brevo will send a verification code/link to `mahmoudelwany98@gmail.com`. Open the email and confirm verification.

### Step 3: Generate a Transactional API Key
1. In the Brevo dashboard, navigate to **SMTP & API** (found under the top-right profile menu).
2. Click the **API Keys** tab.
3. Click **Generate a new API key**.
4. Name the key: `Mahmoud Teaching Platform Production`.
5. Copy the generated API key (starts with `xkeysib-...`).
   > ⚠️ **Important**: Store this securely. Brevo only shows the full key once.

### Step 4: Configure Environment Variables
Add the following variables to your hosting environment (e.g. Vercel Project Settings -> Environment Variables, or your local `.env`):

```env
# Brevo API Key
BREVO_API_KEY="xkeysib-your-full-brevo-api-key"

# Sender Details
NOTIFICATION_FROM_EMAIL="mahmoudelwany98@gmail.com"
NOTIFICATION_FROM_NAME="Mahmoud Elwany"
NOTIFICATION_REPLY_TO_EMAIL="mahmoudelwany98@gmail.com"
NOTIFICATION_TEACHER_EMAIL="mahmoudelwany98@gmail.com"
```

---

## 3. Supported Notification Events

The platform automatically sends branded, HTML-escaped emails for the following 9 events:

| Event Type | Recipient | Description |
| :--- | :--- | :--- |
| `BOOKING_CONFIRMED` | Student & Teacher | Confirms 1-on-1 paid lesson booking with date, time, and Zoom link |
| `TRIAL_BOOKED` | Student & Teacher | Confirms 30-min free trial lesson with preparation guide |
| `PAYMENT_CLAIMED` | Teacher | Alerts Mahmoud when a student submits manual payment details |
| `PAYMENT_CONFIRMED` | Student | Official receipt acknowledging payment confirmation |
| `BOOKING_CANCELLED` | Student & Teacher | Cancellation notice |
| `BOOKING_RESCHEDULED` | Student & Teacher | Reschedule confirmation with previous vs new date & time |
| `LEAD_CREATED` | Teacher | Notification when a new prospective student inquires |
| `LESSON_24H_REMINDER` | Student | 24-hour advance lesson reminder |
| `LESSON_1H_REMINDER` | Student | 1-hour advance lesson reminder with direct Zoom button |

---

## 4. Security & Idempotency Principles

1. **Server-Only API Key**: `BREVO_API_KEY` is only used on the Express backend (`api/notifications/emailService.ts`). It is never bundled into client-side code or exposed via API routes.
2. **Deterministic Idempotency**: Each notification generates a deterministic key (e.g., `booking:REF123:BOOKING_CONFIRMED`). Duplicate event triggers will not send duplicate emails.
3. **Strict HTML Escaping**: All user-supplied inputs (names, emails, notes, reference codes) are sanitized with `escapeHtml()` and `sanitizeUrl()` before rendering into email HTML to prevent XSS.
4. **Retry Safety**: If email delivery fails, the event is not marked as completed, allowing retry workers to re-attempt delivery.
5. **Masked Error Responses**: Brevo API errors are logged securely on the server and masked before returning to API callers.

---

## 5. Monitoring & Troubleshooting

- **Brevo Real-time Logs**: View real-time delivery logs, open rates, and bounces at **Transactional** -> **Statistics** in your Brevo dashboard.
- **Platform Health Status**: Check `/api/integrations/status` or view the **Teacher Dashboard -> Settings -> Integrations** card for real-time status.
