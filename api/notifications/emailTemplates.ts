/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — EMAIL TEMPLATES
 * File: api/notifications/emailTemplates.ts
 * Role: Art-directed, responsive, brand-aligned HTML & text emails
 *       with strict HTML escaping on all dynamic learner/booking values.
 * ====================================================================
 */

export interface EmailRenderResult {
  subject: string;
  html: string;
  text: string;
}

// Brand Styles & Colors
const BRAND_BG = '#F8F6F0';
const CARD_BG = '#FFFFFF';
const TEXT_MAIN = '#30332F';
const TEXT_MUTED = '#6B706A';
const ACCENT_SAGE = '#6F907D';
const ACCENT_LIGHT_SAGE = '#8FAE9B';
const ACCENT_BG = '#EAF0EB';
const BORDER_COLOR = '#E5DFD5';

/**
 * Escapes unsafe characters for HTML context to prevent XSS and layout breaking.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes URLs to ensure they use safe http/https schemes.
 */
export function sanitizeUrl(url: unknown): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  return '';
}

function baseEmailWrapper(title: string, contentHtml: string): string {
  const safeTitle = escapeHtml(title);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${BRAND_BG}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${TEXT_MAIN}; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: ${BRAND_BG}; padding: 32px 16px; }
    .container { max-width: 580px; margin: 0 auto; background-color: ${CARD_BG}; border-radius: 16px; border: 1px solid ${BORDER_COLOR}; overflow: hidden; }
    .header { padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid ${BORDER_COLOR}; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 600; color: ${TEXT_MAIN}; letter-spacing: -0.3px; }
    .header p { margin: 4px 0 0; font-size: 13px; color: ${TEXT_MUTED}; }
    .body { padding: 32px; font-size: 15px; line-height: 1.6; color: ${TEXT_MAIN}; }
    .card { background-color: ${ACCENT_BG}; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #DDE8E0; }
    .btn { display: inline-block; background-color: ${ACCENT_SAGE}; color: #FFFFFF !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; text-align: center; margin: 16px 0; }
    .footer { padding: 24px 32px; text-align: center; font-size: 12px; color: ${TEXT_MUTED}; border-top: 1px solid ${BORDER_COLOR}; }
    .footer a { color: ${ACCENT_SAGE}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <div class="container">
            <div class="header">
              <h1>Mahmoud Elwany</h1>
              <p>Personalized 1-on-1 Quran, Arabic &amp; Islamic Studies</p>
            </div>
            <div class="body">
              ${contentHtml}
            </div>
            <div class="footer">
              <p style="margin: 0 0 8px;">Direct 1-on-1 Mentorship &bull; WhatsApp: +20 155 242 5799</p>
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Mahmoud Elwany. All rights reserved.</p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

// 1. Student Booking Confirmation (Regular Paid Lesson)
export function renderStudentBookingConfirmation(params: {
  learnerName: string;
  serviceName: string;
  date: string;
  timeDisplay: string;
  timezone: string;
  durationMinutes: number;
  bookingRef: string;
  zoomLink?: string | null;
  cairoTimeDisplay?: string | null;
  feeAmount?: number | null;
  currency?: string | null;
}): EmailRenderResult {
  const safeLearnerName = escapeHtml(params.learnerName);
  const safeServiceName = escapeHtml(params.serviceName);
  const safeDate = escapeHtml(params.date);
  const safeTimeDisplay = escapeHtml(params.timeDisplay);
  const safeTimezone = escapeHtml(params.timezone);
  const safeDuration = Number(params.durationMinutes) || 60;
  const safeRef = escapeHtml(params.bookingRef);
  const safeCairoTime = params.cairoTimeDisplay ? escapeHtml(params.cairoTimeDisplay) : null;
  const safeZoomUrl = sanitizeUrl(params.zoomLink);

  const subject = `Lesson Confirmed: ${params.serviceName} with Mahmoud [Ref: ${params.bookingRef}]`;
  const zoomSection = safeZoomUrl
    ? `<div style="margin: 16px 0;">
        <a href="${safeZoomUrl}" class="btn" style="display: block;">Join Zoom Classroom</a>
        <p style="font-size: 12px; color: ${TEXT_MUTED}; text-align: center; margin-top: 4px;">Meeting Link: ${safeZoomUrl}</p>
       </div>`
    : `<p style="font-size: 13px; color: ${TEXT_MUTED};">Your classroom link is being prepared and will be sent shortly prior to your lesson.</p>`;

  const html = baseEmailWrapper(
    'Lesson Confirmation',
    `<h2 style="font-size: 18px; margin-top: 0; color: ${TEXT_MAIN};">Assalamu Alaikum ${safeLearnerName},</h2>
     <p>Your 1-on-1 lesson for <strong>${safeServiceName}</strong> has been successfully scheduled.</p>
     
     <div class="card">
       <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: ${ACCENT_SAGE}; margin-bottom: 12px; letter-spacing: 0.5px;">Appointment Details</div>
       <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 14px;">
         <tr><td style="color: ${TEXT_MUTED}; width: 120px;">Service:</td><td><strong>${safeServiceName}</strong></td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Date:</td><td><strong>${safeDate}</strong></td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Time:</td><td><strong>${safeTimeDisplay}</strong> (${safeTimezone})</td></tr>
         ${safeCairoTime ? `<tr><td style="color: ${TEXT_MUTED};">Teacher Time:</td><td>${safeCairoTime}</td></tr>` : ''}
         <tr><td style="color: ${TEXT_MUTED};">Duration:</td><td>${safeDuration} minutes</td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Reference:</td><td><code style="background: #E5DFD5; padding: 2px 6px; border-radius: 4px;">${safeRef}</code></td></tr>
       </table>
     </div>

     ${zoomSection}

     <div style="background-color: #FAF8F5; border-radius: 10px; padding: 16px; margin-top: 20px; font-size: 13px; color: ${TEXT_MUTED}; border-left: 3px solid ${ACCENT_LIGHT_SAGE};">
       <strong>Cancellation Policy:</strong> You may reschedule or cancel up to 3 hours prior to the scheduled lesson time directly through your booking link.
     </div>

     <p style="margin-top: 24px; font-size: 14px;">If you have any questions or need preparation guidance, feel free to reach out to Mahmoud on WhatsApp at <strong>+20 155 242 5799</strong>.</p>`
  );

  const text = `Assalamu Alaikum ${params.learnerName},

Your 1-on-1 lesson for ${params.serviceName} is confirmed.

Appointment Details:
- Service: ${params.serviceName}
- Date: ${params.date}
- Time: ${params.timeDisplay} (${params.timezone})
- Duration: ${params.durationMinutes} minutes
- Booking Reference: ${params.bookingRef}
${params.zoomLink ? `- Zoom Link: ${params.zoomLink}` : ''}

Cancellation Policy: You may reschedule or cancel up to 3 hours before start.

WhatsApp: +20 155 242 5799
Mahmoud Elwany`;

  return { subject, html, text };
}

// 2. Student Free Trial Confirmation
export function renderStudentTrialConfirmation(params: {
  learnerName: string;
  serviceName: string;
  date: string;
  timeDisplay: string;
  timezone: string;
  durationMinutes: number;
  bookingRef: string;
  zoomLink?: string | null;
  cairoTimeDisplay?: string | null;
}): EmailRenderResult {
  const safeLearnerName = escapeHtml(params.learnerName);
  const safeServiceName = escapeHtml(params.serviceName);
  const safeDate = escapeHtml(params.date);
  const safeTimeDisplay = escapeHtml(params.timeDisplay);
  const safeTimezone = escapeHtml(params.timezone);
  const safeDuration = Number(params.durationMinutes) || 30;
  const safeRef = escapeHtml(params.bookingRef);
  const safeCairoTime = params.cairoTimeDisplay ? escapeHtml(params.cairoTimeDisplay) : null;
  const safeZoomUrl = sanitizeUrl(params.zoomLink);

  const subject = `Free Trial Confirmed: ${params.serviceName} with Mahmoud [Ref: ${params.bookingRef}]`;
  const zoomSection = safeZoomUrl
    ? `<div style="margin: 16px 0;">
        <a href="${safeZoomUrl}" class="btn" style="display: block;">Join Trial Classroom</a>
        <p style="font-size: 12px; color: ${TEXT_MUTED}; text-align: center; margin-top: 4px;">Meeting Link: ${safeZoomUrl}</p>
       </div>`
    : `<p style="font-size: 13px; color: ${TEXT_MUTED};">Your classroom room link is being prepared and will be sent shortly prior to your trial.</p>`;

  const html = baseEmailWrapper(
    'Free Trial Confirmation',
    `<h2 style="font-size: 18px; margin-top: 0; color: ${TEXT_MAIN};">Assalamu Alaikum ${safeLearnerName},</h2>
     <p>Your complimentary <strong>Free Trial Lesson (${safeDuration} min)</strong> for <strong>${safeServiceName}</strong> has been booked.</p>
     
     <div class="card">
       <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: ${ACCENT_SAGE}; margin-bottom: 12px; letter-spacing: 0.5px;">Trial Session Details</div>
       <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 14px;">
         <tr><td style="color: ${TEXT_MUTED}; width: 120px;">Service:</td><td><strong>${safeServiceName}</strong> (Complimentary)</td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Date:</td><td><strong>${safeDate}</strong></td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Time:</td><td><strong>${safeTimeDisplay}</strong> (${safeTimezone})</td></tr>
         ${safeCairoTime ? `<tr><td style="color: ${TEXT_MUTED};">Teacher Time:</td><td>${safeCairoTime}</td></tr>` : ''}
         <tr><td style="color: ${TEXT_MUTED};">Duration:</td><td>${safeDuration} minutes</td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Reference:</td><td><code style="background: #E5DFD5; padding: 2px 6px; border-radius: 4px;">${safeRef}</code></td></tr>
       </table>
     </div>

     ${zoomSection}

     <div style="background-color: #FAF8F5; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13px; color: ${TEXT_MAIN}; border-left: 3px solid ${ACCENT_SAGE};">
       <strong style="color: ${ACCENT_SAGE}; display: block; margin-bottom: 6px;">What to Expect in Your Free Trial:</strong>
       <ul style="margin: 0; padding-left: 18px; line-height: 1.5;">
         <li>Warm introduction &amp; discussing your personal learning goals.</li>
         <li>Accurate, friendly level assessment without pressure.</li>
         <li>A brief sample mini-lesson to experience the teaching style.</li>
         <li>A customized, honest learning roadmap with zero obligation.</li>
       </ul>
     </div>

     <p style="font-size: 14px;">Mahmoud is looking forward to meeting you! WhatsApp: <strong>+20 155 242 5799</strong>.</p>`
  );

  const text = `Assalamu Alaikum ${params.learnerName},

Your Free Trial Lesson for ${params.serviceName} is confirmed!

Trial Details:
- Service: ${params.serviceName} (Free Trial)
- Date: ${params.date}
- Time: ${params.timeDisplay} (${params.timezone})
- Duration: ${params.durationMinutes} minutes
- Booking Ref: ${params.bookingRef}
${params.zoomLink ? `- Zoom Link: ${params.zoomLink}` : ''}

What to Expect:
1. Warm introduction and discussing your learning goals.
2. Accurate, gentle level assessment.
3. A sample mini-lesson.
4. An honest learning recommendation.

WhatsApp: +20 155 242 5799
Mahmoud Elwany`;

  return { subject, html, text };
}

// 3. Student Payment Confirmed (Receipt / Acknowledgment)
export function renderStudentPaymentConfirmed(params: {
  learnerName: string;
  serviceName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentReference?: string | null;
  bookingRef?: string | null;
  date: string;
}): EmailRenderResult {
  const safeLearnerName = escapeHtml(params.learnerName);
  const safeServiceName = escapeHtml(params.serviceName);
  const safeAmount = Number(params.amount).toFixed(2);
  const safeCurrency = escapeHtml(params.currency);
  const safeMethod = escapeHtml(params.paymentMethod);
  const safePaymentRef = params.paymentReference ? escapeHtml(params.paymentReference) : null;
  const safeBookingRef = params.bookingRef ? escapeHtml(params.bookingRef) : null;
  const safeDate = escapeHtml(params.date);

  const subject = `Payment Confirmed: ${params.amount} ${params.currency} for ${params.serviceName}`;
  const html = baseEmailWrapper(
    'Payment Confirmed',
    `<h2 style="font-size: 18px; margin-top: 0; color: ${TEXT_MAIN};">Assalamu Alaikum ${safeLearnerName},</h2>
     <p>Your payment for <strong>${safeServiceName}</strong> has been confirmed by Ustadh Mahmoud. Jazakum Allahu Khairan.</p>
     
     <div class="card">
       <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: ${ACCENT_SAGE}; margin-bottom: 12px; letter-spacing: 0.5px;">Receipt Information</div>
       <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 14px;">
         <tr><td style="color: ${TEXT_MUTED}; width: 130px;">Amount Paid:</td><td><strong style="color: ${ACCENT_SAGE}; font-size: 16px;">${safeAmount} ${safeCurrency}</strong></td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Payment Method:</td><td>${safeMethod}</td></tr>
         ${safePaymentRef ? `<tr><td style="color: ${TEXT_MUTED};">Transaction Ref:</td><td>${safePaymentRef}</td></tr>` : ''}
         ${safeBookingRef ? `<tr><td style="color: ${TEXT_MUTED};">Booking Ref:</td><td>${safeBookingRef}</td></tr>` : ''}
         <tr><td style="color: ${TEXT_MUTED};">Confirmation Date:</td><td>${safeDate}</td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Status:</td><td><span style="background: #DDE8E0; color: ${ACCENT_SAGE}; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 12px;">Confirmed</span></td></tr>
       </table>
     </div>

     <p style="font-size: 14px;">Your lesson is confirmed and ready. If you have any questions, feel free to message Mahmoud anytime on WhatsApp at <strong>+20 155 242 5799</strong>.</p>`
  );

  const text = `Assalamu Alaikum ${params.learnerName},

Your payment has been received and confirmed by Ustadh Mahmoud.

Payment Details:
- Service: ${params.serviceName}
- Amount: ${params.amount.toFixed(2)} ${params.currency}
- Method: ${params.paymentMethod}
${params.paymentReference ? `- Ref: ${params.paymentReference}` : ''}
${params.bookingRef ? `- Booking Ref: ${params.bookingRef}` : ''}
- Date: ${params.date}
- Status: Confirmed

Jazakum Allahu Khairan.
Mahmoud Elwany`;

  return { subject, html, text };
}

// 4. Student Cancellation Confirmation
export function renderStudentCancellation(params: {
  learnerName: string;
  serviceName: string;
  date: string;
  timeDisplay: string;
  timezone: string;
  bookingRef: string;
}): EmailRenderResult {
  const safeLearnerName = escapeHtml(params.learnerName);
  const safeServiceName = escapeHtml(params.serviceName);
  const safeDate = escapeHtml(params.date);
  const safeTimeDisplay = escapeHtml(params.timeDisplay);
  const safeTimezone = escapeHtml(params.timezone);
  const safeRef = escapeHtml(params.bookingRef);

  const subject = `Lesson Cancelled: ${params.serviceName} [Ref: ${params.bookingRef}]`;
  const html = baseEmailWrapper(
    'Lesson Cancelled',
    `<h2 style="font-size: 18px; margin-top: 0; color: ${TEXT_MAIN};">Assalamu Alaikum ${safeLearnerName},</h2>
     <p>Your booking for <strong>${safeServiceName}</strong> has been cancelled as requested.</p>
     
     <div class="card" style="background-color: #F8F6F0; border-color: ${BORDER_COLOR};">
       <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: ${TEXT_MUTED}; margin-bottom: 12px; letter-spacing: 0.5px;">Cancelled Lesson Details</div>
       <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 14px;">
         <tr><td style="color: ${TEXT_MUTED}; width: 120px;">Service:</td><td>${safeServiceName}</td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Scheduled Date:</td><td>${safeDate}</td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Scheduled Time:</td><td>${safeTimeDisplay} (${safeTimezone})</td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Booking Ref:</td><td>${safeRef}</td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Status:</td><td><strong style="color: #A33A3A;">Cancelled</strong></td></tr>
       </table>
     </div>

     <p style="font-size: 14px;">If you would like to book a new lesson time in the future, you are always welcome to schedule anytime at your convenience.</p>`
  );

  const text = `Assalamu Alaikum ${params.learnerName},

Your lesson for ${params.serviceName} on ${params.date} at ${params.timeDisplay} (${params.timezone}) has been cancelled.

Booking Reference: ${params.bookingRef}

You are welcome to schedule a new time whenever you are ready.
Mahmoud Elwany`;

  return { subject, html, text };
}

// 5. Student Reschedule Confirmation
export function renderStudentReschedule(params: {
  learnerName: string;
  serviceName: string;
  oldDate: string;
  oldTimeDisplay: string;
  newDate: string;
  newTimeDisplay: string;
  timezone: string;
  durationMinutes: number;
  bookingRef: string;
  zoomLink?: string | null;
}): EmailRenderResult {
  const safeLearnerName = escapeHtml(params.learnerName);
  const safeServiceName = escapeHtml(params.serviceName);
  const safeOldDate = escapeHtml(params.oldDate);
  const safeOldTime = escapeHtml(params.oldTimeDisplay);
  const safeNewDate = escapeHtml(params.newDate);
  const safeNewTime = escapeHtml(params.newTimeDisplay);
  const safeTimezone = escapeHtml(params.timezone);
  const safeDuration = Number(params.durationMinutes) || 60;
  const safeRef = escapeHtml(params.bookingRef);
  const safeZoomUrl = sanitizeUrl(params.zoomLink);

  const subject = `Lesson Rescheduled: ${params.serviceName} with Mahmoud [Ref: ${params.bookingRef}]`;
  const zoomSection = safeZoomUrl
    ? `<div style="margin: 16px 0;">
        <a href="${safeZoomUrl}" class="btn" style="display: block;">Join Zoom Classroom</a>
        <p style="font-size: 12px; color: ${TEXT_MUTED}; text-align: center; margin-top: 4px;">Meeting Link: ${safeZoomUrl}</p>
       </div>`
    : '';

  const html = baseEmailWrapper(
    'Lesson Rescheduled',
    `<h2 style="font-size: 18px; margin-top: 0; color: ${TEXT_MAIN};">Assalamu Alaikum ${safeLearnerName},</h2>
     <p>Your lesson for <strong>${safeServiceName}</strong> has been successfully rescheduled to a new time.</p>
     
     <div class="card">
       <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: ${ACCENT_SAGE}; margin-bottom: 12px; letter-spacing: 0.5px;">Updated Appointment Details</div>
       <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 14px;">
         <tr><td style="color: ${TEXT_MUTED}; width: 130px;">Service:</td><td><strong>${safeServiceName}</strong></td></tr>
         <tr><td style="color: ${TEXT_MUTED};">New Date:</td><td><strong style="color: ${ACCENT_SAGE}; font-size: 15px;">${safeNewDate}</strong></td></tr>
         <tr><td style="color: ${TEXT_MUTED};">New Time:</td><td><strong style="color: ${ACCENT_SAGE}; font-size: 15px;">${safeNewTime}</strong> (${safeTimezone})</td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Previous Time:</td><td style="color: ${TEXT_MUTED}; text-decoration: line-through;">${safeOldDate} at ${safeOldTime}</td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Duration:</td><td>${safeDuration} minutes</td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Booking Ref:</td><td>${safeRef}</td></tr>
       </table>
     </div>

     ${zoomSection}

     <p style="font-size: 14px;">Your calendar and reminders have been updated accordingly. Looking forward to our session!</p>`
  );

  const text = `Assalamu Alaikum ${params.learnerName},

Your lesson for ${params.serviceName} has been rescheduled.

New Appointment Time:
- Date: ${params.newDate}
- Time: ${params.newTimeDisplay} (${params.timezone})
- Duration: ${params.durationMinutes} minutes
- Booking Ref: ${params.bookingRef}
${params.zoomLink ? `- Zoom Link: ${params.zoomLink}` : ''}

Previous Time: ${params.oldDate} at ${params.oldTimeDisplay}

Mahmoud Elwany`;

  return { subject, html, text };
}

// 6. Student 24-Hour Reminder
export function renderStudent24hReminder(params: {
  learnerName: string;
  serviceName: string;
  date: string;
  timeDisplay: string;
  timezone: string;
  durationMinutes: number;
  bookingRef: string;
  zoomLink?: string | null;
  isTrial?: boolean;
}): EmailRenderResult {
  const safeLearnerName = escapeHtml(params.learnerName);
  const safeServiceName = escapeHtml(params.serviceName);
  const safeDate = escapeHtml(params.date);
  const safeTimeDisplay = escapeHtml(params.timeDisplay);
  const safeTimezone = escapeHtml(params.timezone);
  const safeDuration = Number(params.durationMinutes) || 60;
  const safeRef = escapeHtml(params.bookingRef);
  const safeZoomUrl = sanitizeUrl(params.zoomLink);

  const subject = `Reminder: Lesson tomorrow with Mahmoud [${params.timeDisplay}]`;
  const zoomSection = safeZoomUrl
    ? `<div style="margin: 16px 0;">
        <a href="${safeZoomUrl}" class="btn" style="display: block;">Join Zoom Classroom</a>
        <p style="font-size: 12px; color: ${TEXT_MUTED}; text-align: center; margin-top: 4px;">Link: ${safeZoomUrl}</p>
       </div>`
    : '';

  const html = baseEmailWrapper(
    '24-Hour Lesson Reminder',
    `<h2 style="font-size: 18px; margin-top: 0; color: ${TEXT_MAIN};">Assalamu Alaikum ${safeLearnerName},</h2>
     <p>This is a gentle reminder that your 1-on-1 session for <strong>${safeServiceName}</strong> is scheduled for tomorrow.</p>
     
     <div class="card">
       <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: ${ACCENT_SAGE}; margin-bottom: 12px; letter-spacing: 0.5px;">Tomorrow's Session</div>
       <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 14px;">
         <tr><td style="color: ${TEXT_MUTED}; width: 120px;">Date:</td><td><strong>${safeDate}</strong></td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Time:</td><td><strong>${safeTimeDisplay}</strong> (${safeTimezone})</td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Duration:</td><td>${safeDuration} minutes</td></tr>
         <tr><td style="color: ${TEXT_MUTED};">Reference:</td><td>${safeRef}</td></tr>
       </table>
     </div>

     ${zoomSection}

     <p style="font-size: 13px; color: ${TEXT_MUTED};">Please have a quiet space and your learning materials or Mushaf ready. If you need any assistance beforehand, you can message Mahmoud on WhatsApp at <strong>+20 155 242 5799</strong>.</p>`
  );

  const text = `Assalamu Alaikum ${params.learnerName},

Gentle reminder: Your lesson for ${params.serviceName} is scheduled for tomorrow.

- Date: ${params.date}
- Time: ${params.timeDisplay} (${params.timezone})
- Duration: ${params.durationMinutes} min
- Booking Ref: ${params.bookingRef}
${params.zoomLink ? `- Zoom Link: ${params.zoomLink}` : ''}

See you tomorrow insha'Allah!
Mahmoud Elwany`;

  return { subject, html, text };
}

// 7. Student 1-Hour Reminder
export function renderStudent1hReminder(params: {
  learnerName: string;
  serviceName: string;
  timeDisplay: string;
  timezone: string;
  bookingRef: string;
  zoomLink?: string | null;
}): EmailRenderResult {
  const safeLearnerName = escapeHtml(params.learnerName);
  const safeServiceName = escapeHtml(params.serviceName);
  const safeTimeDisplay = escapeHtml(params.timeDisplay);
  const safeTimezone = escapeHtml(params.timezone);
  const safeRef = escapeHtml(params.bookingRef);
  const safeZoomUrl = sanitizeUrl(params.zoomLink);

  const subject = `Lesson starting in 1 hour: ${params.serviceName} with Mahmoud`;
  const zoomSection = safeZoomUrl
    ? `<div style="margin: 16px 0;">
        <a href="${safeZoomUrl}" class="btn" style="display: block; font-size: 16px; padding: 14px 28px;">Enter Zoom Classroom</a>
        <p style="font-size: 12px; color: ${TEXT_MUTED}; text-align: center; margin-top: 4px;">${safeZoomUrl}</p>
       </div>`
    : '';

  const html = baseEmailWrapper(
    'Lesson Starting Soon',
    `<h2 style="font-size: 18px; margin-top: 0; color: ${TEXT_MAIN};">Assalamu Alaikum ${safeLearnerName},</h2>
     <p>Your 1-on-1 session for <strong>${safeServiceName}</strong> begins in <strong>1 hour</strong> at <strong>${safeTimeDisplay} (${safeTimezone})</strong>.</p>
     
     ${zoomSection}

     <p style="font-size: 13px; color: ${TEXT_MUTED};">Please ensure your audio and video are ready. Ustadh Mahmoud will be waiting in the classroom.</p>`
  );

  const text = `Assalamu Alaikum ${params.learnerName},

Your lesson for ${params.serviceName} begins in 1 hour at ${params.timeDisplay} (${params.timezone}).

${params.zoomLink ? `Classroom Link: ${params.zoomLink}` : ''}

Ustadh Mahmoud will be waiting for you.
Ref: ${params.bookingRef}`;

  return { subject, html, text };
}

// 8. Teacher Notification (Internal Alerts for Mahmoud)
export function renderTeacherNotification(params: {
  eventType: 'new_booking' | 'new_trial' | 'new_lead' | 'payment_claimed' | 'payment_confirmed' | 'cancelled' | 'rescheduled' | 'alert';
  title: string;
  summary: string;
  details: Record<string, any>;
  actionUrl?: string;
}): EmailRenderResult {
  const safeTitle = escapeHtml(params.title);
  const safeSummary = escapeHtml(params.summary);
  const safeActionUrl = sanitizeUrl(params.actionUrl);
  const subject = `[Fikra Alert] ${params.title}`;
  
  const detailRows = Object.entries(params.details)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `<tr><td style="color: ${TEXT_MUTED}; width: 140px; font-weight: 500;">${escapeHtml(k)}:</td><td><strong>${escapeHtml(String(v))}</strong></td></tr>`)
    .join('');

  const html = baseEmailWrapper(
    params.title,
    `<h2 style="font-size: 18px; margin-top: 0; color: ${TEXT_MAIN};">${safeTitle}</h2>
     <p style="font-size: 15px; color: ${TEXT_MAIN};">${safeSummary}</p>
     
     <div class="card" style="background-color: #FAF8F5;">
       <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size: 14px;">
         ${detailRows}
       </table>
     </div>

     ${safeActionUrl ? `<div style="text-align: center; margin: 20px 0;"><a href="${safeActionUrl}" class="btn">Open Teacher Dashboard</a></div>` : ''}

     <p style="font-size: 12px; color: ${TEXT_MUTED};">Automated teacher notification &bull; Sent to mahmoudelwany98@gmail.com</p>`
  );

  const textDetails = Object.entries(params.details)
    .map(([k, v]) => `- ${k}: ${String(v)}`)
    .join('\n');

  const text = `${params.title}
${params.summary}

Details:
${textDetails}

${params.actionUrl ? `Dashboard: ${params.actionUrl}` : ''}`;

  return { subject, html, text };
}
