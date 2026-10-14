/**
 * Transactional email templates (sent through Brevo by dispatcher.ts).
 * Every email is bilingual (Arabic first, right-to-left, then English), uses the brand
 * colours and logo, supports light and dark mode, and ends with a legal footer
 * (why you got it, terms, privacy, contact). All dynamic values are HTML-escaped.
 * RULES.md §6: friendly tone in both languages.
 */

export interface EmailRenderResult {
  subject: string;
  html: string;
  text: string;
}

const SITE_URL = 'https://watazawwado.academy';
const LOGO_URL = `${SITE_URL}/logo.png`;
const WHATSAPP_DISPLAY = '+48 508 157 886';
const WHATSAPP_URL = 'https://wa.me/48508157886';
const SUPPORT_EMAIL = 'support@watazawwado.academy';

// Brand palette (same as the website).
const TEAL = '#087D91';
const SAND = '#D8C6AE';
const BROWN = '#8B4935';
const RED = '#C51F24';

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

/** One row of the details card: Arabic label, English label, value (already escaped). */
type Row = [ar: string, en: string, value: string];

interface Section {
  title: string;
  greeting?: string;
  paragraphs: string[];
  rows?: Row[];
  note?: string;
}

interface EmailContent {
  preheader: string;
  ar: Section;
  en: Section;
  button?: { url: string; ar: string; en: string };
  /** Why the recipient gets this email (legal footer). */
  reason: { ar: string; en: string };
}

function detailsTable(rows: Row[] | undefined, lang: 'ar' | 'en'): string {
  if (!rows || rows.length === 0) return '';
  const body = rows
    .filter(([, , value]) => value)
    .map(([ar, en, value]) => `<tr>
        <td class="muted" style="padding:6px 0;width:42%;vertical-align:top;font-size:13px;color:#6B706A;">${lang === 'ar' ? ar : en}</td>
        <td class="text" style="padding:6px 0;font-size:14px;font-weight:600;color:#2C2A27;" dir="auto">${value}</td>
      </tr>`)
    .join('');
  return `<table role="presentation" class="card" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;padding:16px 18px;background:#F3F7F6;border:1px solid #DCE7E4;border-radius:12px;">${body}</table>`;
}

function sectionHtml(section: Section, lang: 'ar' | 'en'): string {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const align = lang === 'ar' ? 'right' : 'left';
  const font = lang === 'ar'
    ? "Tahoma, 'Segoe UI', Arial, sans-serif"
    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  return `<div dir="${dir}" lang="${lang}" style="text-align:${align};font-family:${font};">
    <h1 class="text" style="margin:0 0 12px;font-size:20px;line-height:1.4;color:#2C2A27;">${section.title}</h1>
    ${section.greeting ? `<p class="text" style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#2C2A27;">${section.greeting}</p>` : ''}
    ${section.paragraphs.map(p => `<p class="text" style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#2C2A27;">${p}</p>`).join('')}
    ${detailsTable(section.rows, lang)}
    ${section.note ? `<p class="muted" style="margin:0 0 6px;font-size:13px;line-height:1.6;color:#6B706A;">${section.note}</p>` : ''}
  </div>`;
}

function buttonHtml(url: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:6px auto 18px;">
    <tr><td style="border-radius:10px;background:${TEAL};">
      <a href="${url}" style="display:inline-block;padding:12px 26px;font-family:Tahoma,Arial,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:10px;">${label}</a>
    </td></tr>
  </table>`;
}

function renderLayout(content: EmailContent): string {
  const safeButtonUrl = content.button ? sanitizeUrl(content.button.url) : '';
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${content.en.title}</title>
  <style>
    @media (prefers-color-scheme: dark) {
      .page { background:#121416 !important; }
      .shell { background:#1C1F22 !important; border-color:#2E3338 !important; }
      .text { color:#ECEAE6 !important; }
      .muted { color:#A7ACA6 !important; }
      .card { background:#20292B !important; border-color:#2F4044 !important; }
      .divider { border-color:#2E3338 !important; }
    }
    [data-ogsc] .shell { background:#1C1F22 !important; }
    [data-ogsc] .text { color:#ECEAE6 !important; }
    @media (max-width: 600px) { .pad { padding:22px 18px !important; } }
  </style>
</head>
<body class="page" style="margin:0;padding:0;background:#F8F6F0;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${content.preheader}</div>
  <table role="presentation" class="page" width="100%" cellspacing="0" cellpadding="0" style="background:#F8F6F0;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" class="shell" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E5DFD5;border-radius:18px;overflow:hidden;">
        <tr><td style="height:6px;background:${TEAL};background-image:linear-gradient(135deg,${TEAL} 0%,${SAND} 40%,${BROWN} 75%,${RED} 100%);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td align="center" class="pad" style="padding:26px 32px 8px;">
          <img src="${LOGO_URL}" width="150" alt="وتزودوا | Watazawwado" style="display:block;width:150px;max-width:60%;height:auto;border:0;">
        </td></tr>
        <tr><td class="pad" style="padding:18px 32px 6px;">
          ${sectionHtml(content.ar, 'ar')}
          ${safeButtonUrl && content.button ? buttonHtml(safeButtonUrl, content.button.ar) : ''}
        </td></tr>
        <tr><td style="padding:0 32px;"><div class="divider" style="border-top:1px solid #E5DFD5;"></div></td></tr>
        <tr><td class="pad" style="padding:18px 32px 6px;">
          ${sectionHtml(content.en, 'en')}
          ${safeButtonUrl && content.button ? buttonHtml(safeButtonUrl, content.button.en) : ''}
        </td></tr>
        <tr><td class="pad divider" style="padding:20px 32px 26px;border-top:1px solid #E5DFD5;text-align:center;font-family:Tahoma,Arial,sans-serif;">
          <p class="muted" dir="rtl" style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#6B706A;">${content.reason.ar}</p>
          <p class="muted" style="margin:0 0 12px;font-size:12px;line-height:1.6;color:#6B706A;">${content.reason.en}</p>
          <p style="margin:0 0 8px;font-size:12px;">
            <a href="${SITE_URL}/terms" style="color:${TEAL};text-decoration:none;">الشروط · Terms</a> &nbsp;|&nbsp;
            <a href="${SITE_URL}/privacy" style="color:${TEAL};text-decoration:none;">الخصوصية · Privacy</a> &nbsp;|&nbsp;
            <a href="${WHATSAPP_URL}" style="color:${TEAL};text-decoration:none;">WhatsApp ${WHATSAPP_DISPLAY}</a>
          </p>
          <p class="muted" style="margin:0;font-size:11px;color:#6B706A;">${SUPPORT_EMAIL} · © ${year} وتزودوا | Watazawwado</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Plain-text version (both languages) for clients that block HTML. */
function renderText(content: EmailContent, rawRows?: Array<[string, string]>): string {
  const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const block = (s: Section) => [s.title, s.greeting, ...s.paragraphs, s.note].filter(Boolean).map(x => strip(x!)).join('\n');
  const rows = (rawRows || []).filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join('\n');
  return [
    block(content.ar),
    '',
    block(content.en),
    rows ? `\n${rows}` : '',
    content.button ? `\n${content.button.en}: ${content.button.url}` : '',
    '',
    `Terms: ${SITE_URL}/terms · Privacy: ${SITE_URL}/privacy · WhatsApp: ${WHATSAPP_DISPLAY}`
  ].join('\n');
}

const STUDENT_REASON = {
  ar: 'وصلتك الرسالة دي لأن عندك حساب أو حجز على منصة وتزودوا.',
  en: 'You are receiving this email because you have an account or a booking on Watazawwado.'
};

function zoomParts(zoomLink?: string | null) {
  const url = sanitizeUrl(zoomLink);
  return {
    url,
    noteAr: url ? '' : 'رابط الحصة بيتجهز وهيوصلك قبل ميعاد الدرس.',
    noteEn: url ? '' : 'Your lesson link is being prepared and will reach you before the lesson.'
  };
}

// 1. Student booking confirmation (paid or package lesson)
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
  const name = escapeHtml(params.learnerName);
  const service = escapeHtml(params.serviceName);
  const when = `${escapeHtml(params.date)} · ${escapeHtml(params.timeDisplay)} (${escapeHtml(params.timezone)})`;
  const duration = Number(params.durationMinutes) || 60;
  const ref = escapeHtml(params.bookingRef);
  const fee = params.feeAmount ? `${Number(params.feeAmount).toFixed(2)} ${escapeHtml(params.currency || 'USD')}` : '';
  const zoom = zoomParts(params.zoomLink);
  const rows: Row[] = [
    ['المادة', 'Subject', service],
    ['الموعد', 'When', when],
    ['المدة', 'Length', `${duration} min`],
    ['رقم الحجز', 'Booking ref', ref],
    ['المبلغ', 'Amount', fee]
  ];
  const content: EmailContent = {
    preheader: `Your lesson is confirmed · ${params.date}`,
    ar: {
      title: 'حصتك اتأكدت ✅',
      greeting: `السلام عليكم ${name}،`,
      paragraphs: [`حصتك في <strong>${service}</strong> اتحجزت واتأكدت. مستنيينك إن شاء الله!`],
      rows,
      note: zoom.noteAr || 'تقدر تلغي لحد 3 ساعات قبل الحصة (وترجع لك كرصيد)، أو تغيّر الميعاد لحد ساعة قبلها من حسابك.'
    },
    en: {
      title: 'Your lesson is confirmed ✅',
      greeting: `Assalamu alaikum ${name},`,
      paragraphs: [`Your <strong>${service}</strong> lesson is booked and confirmed. We look forward to seeing you!`],
      rows,
      note: zoom.noteEn || 'You can cancel up to 3 hours before (you get a lesson credit) or move it up to 1 hour before, from your account.'
    },
    button: zoom.url ? { url: params.zoomLink!, ar: 'ادخل الحصة على Zoom', en: 'Join on Zoom' } : { url: `${SITE_URL}/student`, ar: 'افتح حسابي', en: 'Open my account' },
    reason: STUDENT_REASON
  };
  return {
    subject: `تم تأكيد حصتك · Lesson confirmed: ${params.serviceName} [${params.bookingRef}]`,
    html: renderLayout(content),
    text: renderText(content, [['Subject', params.serviceName], ['When', `${params.date} ${params.timeDisplay} (${params.timezone})`], ['Booking ref', params.bookingRef]])
  };
}

// 2. Free trial confirmation
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
  const name = escapeHtml(params.learnerName);
  const service = escapeHtml(params.serviceName);
  const when = `${escapeHtml(params.date)} · ${escapeHtml(params.timeDisplay)} (${escapeHtml(params.timezone)})`;
  const duration = Number(params.durationMinutes) || 30;
  const zoom = zoomParts(params.zoomLink);
  const rows: Row[] = [
    ['المادة', 'Subject', service],
    ['الموعد', 'When', when],
    ['المدة', 'Length', `${duration} min`],
    ['رقم الحجز', 'Booking ref', escapeHtml(params.bookingRef)]
  ];
  const content: EmailContent = {
    preheader: `Your free trial is booked · ${params.date}`,
    ar: {
      title: 'حصتك التجريبية المجانية جاهزة 🌱',
      greeting: `أهلاً ${name}،`,
      paragraphs: [
        `حجزت حصة تجريبية مجانية في <strong>${service}</strong>. هنتعرف على مستواك وهدفك ونعمل خطة على مقاسك.`,
        'جهّز مكان هادي وسماعة، وادخل قبل الميعاد بدقيقتين.'
      ],
      rows,
      note: zoom.noteAr || 'تقدر تغيّر ميعاد التجربة مرة واحدة لحد ساعة قبلها.'
    },
    en: {
      title: 'Your free trial is booked 🌱',
      greeting: `Welcome ${name},`,
      paragraphs: [
        `You booked a free trial lesson in <strong>${service}</strong>. We will get to know your level and goal and build a plan that fits you.`,
        'Find a quiet spot with headphones and join a couple of minutes early.'
      ],
      rows,
      note: zoom.noteEn || 'You can move your trial once, up to 1 hour before it starts.'
    },
    button: zoom.url ? { url: params.zoomLink!, ar: 'ادخل الحصة على Zoom', en: 'Join on Zoom' } : { url: `${SITE_URL}/student`, ar: 'افتح حسابي', en: 'Open my account' },
    reason: STUDENT_REASON
  };
  return {
    subject: `حصتك التجريبية اتحجزت · Free trial booked [${params.bookingRef}]`,
    html: renderLayout(content),
    text: renderText(content, [['Subject', params.serviceName], ['When', `${params.date} ${params.timeDisplay} (${params.timezone})`], ['Booking ref', params.bookingRef]])
  };
}

// 3. Payment confirmed (receipt)
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
  const name = escapeHtml(params.learnerName);
  const amount = `${Number(params.amount).toFixed(2)} ${escapeHtml(params.currency)}`;
  const rows: Row[] = [
    ['الخدمة', 'Item', escapeHtml(params.serviceName)],
    ['المبلغ', 'Amount', amount],
    ['طريقة الدفع', 'Method', escapeHtml(params.paymentMethod)],
    ['مرجع الدفع', 'Payment ref', escapeHtml(params.paymentReference || '')],
    ['رقم الحجز', 'Booking ref', escapeHtml(params.bookingRef || '')],
    ['التاريخ', 'Date', escapeHtml(params.date)]
  ];
  const content: EmailContent = {
    preheader: `Payment received · ${Number(params.amount).toFixed(2)} ${params.currency}`,
    ar: {
      title: 'وصلنا الدفع، شكراً لك 🤍',
      greeting: `السلام عليكم ${name}،`,
      paragraphs: ['استلمنا دفعتك بنجاح. احتفظ بالرسالة دي كإيصال.'],
      rows,
      note: 'لو ألغيت حصة مدفوعة قبلها بـ 3 ساعات بترجع لك كرصيد، وتقدر تطلب الاسترداد بدل الرصيد حسب الشروط.'
    },
    en: {
      title: 'Payment received — thank you 🤍',
      greeting: `Assalamu alaikum ${name},`,
      paragraphs: ['We received your payment. Please keep this email as your receipt.'],
      rows,
      note: 'If you cancel a paid lesson 3 hours or more before it starts, you get a lesson credit, and you can ask for a refund instead as described in the terms.'
    },
    button: { url: `${SITE_URL}/student`, ar: 'افتح حسابي', en: 'Open my account' },
    reason: STUDENT_REASON
  };
  return {
    subject: `إيصال الدفع · Payment receipt: ${params.serviceName}`,
    html: renderLayout(content),
    text: renderText(content, [['Item', params.serviceName], ['Amount', `${Number(params.amount).toFixed(2)} ${params.currency}`], ['Payment ref', params.paymentReference || ''], ['Date', params.date]])
  };
}

// 4. Lesson cancelled
export function renderStudentCancellation(params: {
  learnerName: string;
  serviceName: string;
  date: string;
  timeDisplay: string;
  timezone: string;
  bookingRef: string;
  reason?: string | null;
}): EmailRenderResult {
  const name = escapeHtml(params.learnerName);
  const rows: Row[] = [
    ['المادة', 'Subject', escapeHtml(params.serviceName)],
    ['الموعد', 'When', `${escapeHtml(params.date)} · ${escapeHtml(params.timeDisplay)} (${escapeHtml(params.timezone)})`],
    ['رقم الحجز', 'Booking ref', escapeHtml(params.bookingRef)],
    ['السبب', 'Reason', escapeHtml(params.reason || '')]
  ];
  const content: EmailContent = {
    preheader: `Lesson cancelled · ${params.date}`,
    ar: {
      title: 'تم إلغاء الحصة',
      greeting: `السلام عليكم ${name}،`,
      paragraphs: ['الحصة دي اتلغت. لو كانت مدفوعة واتلغت في الوقت المسموح، رصيدها رجع لحسابك وتقدر تحجز بيه في أي وقت.'],
      rows,
      note: 'لو عندك أي سؤال كلمنا على واتساب.'
    },
    en: {
      title: 'Your lesson was cancelled',
      greeting: `Assalamu alaikum ${name},`,
      paragraphs: ['This lesson has been cancelled. If it was paid and cancelled in time, its credit is back in your account to book any time.'],
      rows,
      note: 'Questions? Message us on WhatsApp.'
    },
    button: { url: `${SITE_URL}/student`, ar: 'احجز ميعاد جديد', en: 'Book a new time' },
    reason: STUDENT_REASON
  };
  return {
    subject: `تم إلغاء الحصة · Lesson cancelled [${params.bookingRef}]`,
    html: renderLayout(content),
    text: renderText(content, [['Subject', params.serviceName], ['When', `${params.date} ${params.timeDisplay} (${params.timezone})`], ['Booking ref', params.bookingRef]])
  };
}

// 5. Lesson moved
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
  const name = escapeHtml(params.learnerName);
  const tz = escapeHtml(params.timezone);
  const zoom = zoomParts(params.zoomLink);
  const rows: Row[] = [
    ['المادة', 'Subject', escapeHtml(params.serviceName)],
    ['الميعاد القديم', 'Old time', `<s>${escapeHtml(params.oldDate)} · ${escapeHtml(params.oldTimeDisplay)}</s>`],
    ['الميعاد الجديد', 'New time', `${escapeHtml(params.newDate)} · ${escapeHtml(params.newTimeDisplay)} (${tz})`],
    ['المدة', 'Length', `${Number(params.durationMinutes) || 60} min`],
    ['رقم الحجز', 'Booking ref', escapeHtml(params.bookingRef)]
  ];
  const content: EmailContent = {
    preheader: `New time · ${params.newDate} ${params.newTimeDisplay}`,
    ar: { title: 'ميعاد حصتك اتغيّر 🗓️', greeting: `السلام عليكم ${name}،`, paragraphs: ['غيّرنا ميعاد حصتك. التفاصيل الجديدة تحت:'], rows, note: zoom.noteAr },
    en: { title: 'Your lesson has a new time 🗓️', greeting: `Assalamu alaikum ${name},`, paragraphs: ['Your lesson has moved. Here are the new details:'], rows, note: zoom.noteEn },
    button: zoom.url ? { url: params.zoomLink!, ar: 'ادخل الحصة على Zoom', en: 'Join on Zoom' } : { url: `${SITE_URL}/student`, ar: 'افتح حسابي', en: 'Open my account' },
    reason: STUDENT_REASON
  };
  return {
    subject: `ميعاد جديد لحصتك · Lesson rescheduled [${params.bookingRef}]`,
    html: renderLayout(content),
    text: renderText(content, [['Subject', params.serviceName], ['New time', `${params.newDate} ${params.newTimeDisplay} (${params.timezone})`], ['Booking ref', params.bookingRef]])
  };
}

// 6. Reminder 24 hours before
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
  const name = escapeHtml(params.learnerName);
  const zoom = zoomParts(params.zoomLink);
  const rows: Row[] = [
    ['المادة', 'Subject', escapeHtml(params.serviceName)],
    ['الموعد', 'When', `${escapeHtml(params.date)} · ${escapeHtml(params.timeDisplay)} (${escapeHtml(params.timezone)})`],
    ['المدة', 'Length', `${Number(params.durationMinutes) || 60} min`]
  ];
  const content: EmailContent = {
    preheader: `Tomorrow: ${params.serviceName} at ${params.timeDisplay}`,
    ar: {
      title: params.isTrial ? 'حصتك التجريبية بكرة ⏰' : 'حصتك بكرة ⏰',
      greeting: `أهلاً ${name}،`,
      paragraphs: ['تذكير صغير بحصتك بكرة إن شاء الله.'],
      rows,
      note: 'لسه تقدر تلغي لحد 3 ساعات قبلها أو تغيّر الميعاد لحد ساعة قبلها.'
    },
    en: {
      title: params.isTrial ? 'Your free trial is tomorrow ⏰' : 'Your lesson is tomorrow ⏰',
      greeting: `Hi ${name},`,
      paragraphs: ['A friendly reminder about your lesson tomorrow.'],
      rows,
      note: 'You can still cancel up to 3 hours before or move it up to 1 hour before.'
    },
    button: zoom.url ? { url: params.zoomLink!, ar: 'رابط الحصة', en: 'Lesson link' } : { url: `${SITE_URL}/student`, ar: 'افتح حسابي', en: 'Open my account' },
    reason: STUDENT_REASON
  };
  return {
    subject: `تذكير: حصتك بكرة · Reminder: your lesson is tomorrow`,
    html: renderLayout(content),
    text: renderText(content, [['Subject', params.serviceName], ['When', `${params.date} ${params.timeDisplay} (${params.timezone})`]])
  };
}

// 7. Reminder 1 hour before
export function renderStudent1hReminder(params: {
  learnerName: string;
  serviceName: string;
  timeDisplay: string;
  timezone: string;
  bookingRef: string;
  zoomLink?: string | null;
}): EmailRenderResult {
  const name = escapeHtml(params.learnerName);
  const zoom = zoomParts(params.zoomLink);
  const rows: Row[] = [
    ['المادة', 'Subject', escapeHtml(params.serviceName)],
    ['الساعة', 'Time', `${escapeHtml(params.timeDisplay)} (${escapeHtml(params.timezone)})`]
  ];
  const content: EmailContent = {
    preheader: `Starting in 1 hour · ${params.timeDisplay}`,
    ar: { title: 'حصتك كمان ساعة 🔔', greeting: `أهلاً ${name}،`, paragraphs: ['حصتك هتبدأ كمان ساعة. جهّز نفسك وادخل في الميعاد.'], rows, note: zoom.noteAr },
    en: { title: 'Your lesson starts in 1 hour 🔔', greeting: `Hi ${name},`, paragraphs: ['Your lesson starts in one hour. Get ready and join on time.'], rows, note: zoom.noteEn },
    button: zoom.url ? { url: params.zoomLink!, ar: 'ادخل الحصة على Zoom', en: 'Join on Zoom' } : undefined,
    reason: STUDENT_REASON
  };
  return {
    subject: `حصتك كمان ساعة · Your lesson starts in 1 hour`,
    html: renderLayout(content),
    text: renderText(content, [['Subject', params.serviceName], ['Time', `${params.timeDisplay} (${params.timezone})`]])
  };
}

// 8. Teacher / super admin notification
export function renderTeacherNotification(params: {
  eventType: 'new_booking' | 'new_trial' | 'new_lead' | 'payment_claimed' | 'payment_confirmed' | 'cancelled' | 'rescheduled' | 'alert';
  title: string;
  summary: string;
  details: Record<string, any>;
  actionUrl?: string;
}): EmailRenderResult {
  const titlesAr: Record<string, string> = {
    new_booking: 'حجز جديد',
    new_trial: 'حصة تجريبية جديدة',
    new_lead: 'طالب مهتم جديد',
    payment_claimed: 'طالب بلّغ عن دفع',
    payment_confirmed: 'تم تأكيد دفع',
    cancelled: 'حصة اتلغت',
    rescheduled: 'حصة اتغيّر ميعادها',
    alert: 'تنبيه'
  };
  const rows: Row[] = Object.entries(params.details)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => [escapeHtml(k), escapeHtml(k), escapeHtml(String(v))]);
  const content: EmailContent = {
    preheader: params.summary,
    ar: { title: titlesAr[params.eventType] || 'تنبيه', paragraphs: [escapeHtml(params.summary)], rows },
    en: { title: escapeHtml(params.title), paragraphs: [escapeHtml(params.summary)] },
    button: params.actionUrl ? { url: params.actionUrl, ar: 'افتح لوحة التحكم', en: 'Open the dashboard' } : undefined,
    reason: {
      ar: 'وصلتك الرسالة دي لأنك معلم أو مدير على منصة وتزودوا.',
      en: 'You are receiving this email because you are a teacher or admin on Watazawwado.'
    }
  };
  return {
    subject: `[وتزودوا · Watazawwado] ${params.title}`,
    html: renderLayout(content),
    text: renderText(content, Object.entries(params.details).map(([k, v]) => [k, String(v ?? '')]))
  };
}
