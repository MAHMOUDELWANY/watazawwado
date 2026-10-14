/**
 * Transactional email templates (sent through Brevo by dispatcher.ts).
 * Each email is in ONE language: English by default, Arabic (right-to-left) when the
 * recipient chose Arabic on the site (RULES.md §6). Brand colours, logo, the site's
 * Thmanyah font, light and dark mode, and a legal footer (why you got it, terms,
 * privacy, contact). All dynamic values are HTML-escaped.
 * Staff emails (teachers) never contain payment details; payment alerts go to the super admin only.
 */

export type EmailLang = 'en' | 'ar';

export interface EmailRenderResult {
  subject: string;
  html: string;
  text: string;
}

const SITE_URL = 'https://watazawwado.academy';
const LOGO_URL = `${SITE_URL}/logo.png`;
const FONT_URL = `${SITE_URL}/fonts/thmanyah`;
const WHATSAPP_DISPLAY = '+48 508 157 886';
const WHATSAPP_URL = 'https://wa.me/48508157886';
const SUPPORT_EMAIL = 'support@watazawwado.academy';

// Brand palette (same as the website).
const TEAL = '#087D91';
const SAND = '#D8C6AE';
const BROWN = '#8B4935';
const RED = '#C51F24';
const FONT_STACK = "'Thmanyah Sans', Tahoma, 'Segoe UI', Arial, sans-serif";

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

/** Bilingual string; the template picks one side. */
type L = { en: string; ar: string };
/** A details row: label in both languages, value already escaped. */
type Row = [label: L, value: string];

interface EmailContent {
  preheader: L;
  title: L;
  greeting?: L;
  paragraphs: L[];
  rows?: Row[];
  note?: L;
  button?: { url: string; label: L };
  /** Why the recipient gets this email (legal footer). */
  reason: L;
}

const pick = (value: L | undefined, lang: EmailLang) => (value ? value[lang] : '');

function detailsTable(rows: Row[] | undefined, lang: EmailLang): string {
  const visible = (rows || []).filter(([, value]) => value);
  if (visible.length === 0) return '';
  const body = visible
    .map(([label, value]) => `<tr>
        <td class="muted" style="padding:6px 0;width:42%;vertical-align:top;font-size:13px;color:#6B706A;">${label[lang]}</td>
        <td class="text" style="padding:6px 0;font-size:14px;font-weight:700;color:#2C2A27;" dir="auto">${value}</td>
      </tr>`)
    .join('');
  return `<table role="presentation" class="card" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;padding:16px 18px;background:#F3F7F6;border:1px solid #DCE7E4;border-radius:12px;">${body}</table>`;
}

function renderLayout(content: EmailContent, lang: EmailLang): string {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const align = lang === 'ar' ? 'right' : 'left';
  const safeButtonUrl = content.button ? sanitizeUrl(content.button.url) : '';
  const year = new Date().getFullYear();
  const p = (html: string) => `<p class="text" style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#2C2A27;">${html}</p>`;
  const footerLinks = lang === 'ar'
    ? `<a href="${SITE_URL}/terms" style="color:${TEAL};text-decoration:none;">الشروط</a> &nbsp;|&nbsp; <a href="${SITE_URL}/privacy" style="color:${TEAL};text-decoration:none;">الخصوصية</a> &nbsp;|&nbsp; <a href="${WHATSAPP_URL}" style="color:${TEAL};text-decoration:none;">واتساب <span dir="ltr">${WHATSAPP_DISPLAY}</span></a>`
    : `<a href="${SITE_URL}/terms" style="color:${TEAL};text-decoration:none;">Terms</a> &nbsp;|&nbsp; <a href="${SITE_URL}/privacy" style="color:${TEAL};text-decoration:none;">Privacy</a> &nbsp;|&nbsp; <a href="${WHATSAPP_URL}" style="color:${TEAL};text-decoration:none;">WhatsApp ${WHATSAPP_DISPLAY}</a>`;
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${content.title[lang]}</title>
  <style>
    @font-face { font-family: 'Thmanyah Sans'; font-weight: 400; src: url('${FONT_URL}/thmanyahsans-Regular.woff2') format('woff2'); }
    @font-face { font-family: 'Thmanyah Sans'; font-weight: 700; src: url('${FONT_URL}/thmanyahsans-Bold.woff2') format('woff2'); }
    body, table, td, p, a, h1 { font-family: ${FONT_STACK}; }
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
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${content.preheader[lang]}</div>
  <table role="presentation" class="page" width="100%" cellspacing="0" cellpadding="0" style="background:#F8F6F0;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" class="shell" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E5DFD5;border-radius:18px;overflow:hidden;">
        <tr><td style="height:6px;background:${TEAL};background-image:linear-gradient(135deg,${TEAL} 0%,${SAND} 40%,${BROWN} 75%,${RED} 100%);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td align="center" class="pad" style="padding:26px 32px 8px;">
          <img src="${LOGO_URL}" width="150" alt="Watazawwado" style="display:block;width:150px;max-width:60%;height:auto;border:0;">
        </td></tr>
        <tr><td class="pad" dir="${dir}" style="padding:18px 32px 8px;text-align:${align};">
          <h1 class="text" style="margin:0 0 12px;font-size:21px;line-height:1.4;color:#2C2A27;">${content.title[lang]}</h1>
          ${content.greeting ? p(content.greeting[lang]) : ''}
          ${content.paragraphs.map(par => p(par[lang])).join('')}
          ${detailsTable(content.rows, lang)}
          ${pick(content.note, lang) ? `<p class="muted" style="margin:0 0 6px;font-size:13px;line-height:1.6;color:#6B706A;">${pick(content.note, lang)}</p>` : ''}
          ${safeButtonUrl && content.button ? `<table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:10px auto 18px;">
            <tr><td style="border-radius:10px;background:${TEAL};">
              <a href="${safeButtonUrl}" style="display:inline-block;padding:12px 26px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:10px;">${content.button.label[lang]}</a>
            </td></tr>
          </table>` : ''}
        </td></tr>
        <tr><td class="pad divider" dir="${dir}" style="padding:20px 32px 26px;border-top:1px solid #E5DFD5;text-align:center;">
          <p class="muted" style="margin:0 0 12px;font-size:12px;line-height:1.6;color:#6B706A;">${content.reason[lang]}</p>
          <p style="margin:0 0 8px;font-size:12px;">${footerLinks}</p>
          <p class="muted" style="margin:0;font-size:11px;color:#6B706A;">${SUPPORT_EMAIL} · © ${year} Watazawwado</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Plain-text version for clients that block HTML. */
function renderText(content: EmailContent, lang: EmailLang): string {
  const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const rows = (content.rows || []).filter(([, v]) => v).map(([label, v]) => `- ${label[lang]}: ${strip(v)}`).join('\n');
  return [
    content.title[lang],
    pick(content.greeting, lang),
    ...content.paragraphs.map(par => par[lang]),
    rows,
    pick(content.note, lang),
    content.button ? `${content.button.label[lang]}: ${content.button.url}` : '',
    '',
    lang === 'ar'
      ? `الشروط: ${SITE_URL}/terms · الخصوصية: ${SITE_URL}/privacy · واتساب: ${WHATSAPP_DISPLAY}`
      : `Terms: ${SITE_URL}/terms · Privacy: ${SITE_URL}/privacy · WhatsApp: ${WHATSAPP_DISPLAY}`
  ].filter(line => line !== undefined).map(strip).join('\n');
}

function render(content: EmailContent, subject: L, lang: EmailLang = 'en'): EmailRenderResult {
  return { subject: subject[lang], html: renderLayout(content, lang), text: renderText(content, lang) };
}

const STUDENT_REASON: L = {
  en: 'You are receiving this email because you have an account or a booking on Watazawwado.',
  ar: 'وصلتك الرسالة دي لأن عندك حساب أو حجز على منصة وتزودوا.'
};
const STAFF_REASON: L = {
  en: 'You are receiving this email because you are a teacher or admin on Watazawwado.',
  ar: 'وصلتك الرسالة دي لأنك معلم أو مدير على منصة وتزودوا.'
};
const ACCOUNT_BUTTON = (path = '/student') => ({ url: `${SITE_URL}${path}`, label: { en: 'Open my account', ar: 'افتح حسابي' } });

// Shared row labels.
const LBL = {
  subject: { en: 'Subject', ar: 'المادة' },
  when: { en: 'When', ar: 'الموعد' },
  length: { en: 'Length', ar: 'المدة' },
  ref: { en: 'Booking ref', ar: 'رقم الحجز' },
  amount: { en: 'Amount', ar: 'المبلغ' },
  student: { en: 'Student', ar: 'الطالب' },
  zoom: { en: 'Zoom link', ar: 'رابط Zoom' }
};

function zoomParts(zoomLink?: string | null) {
  const url = sanitizeUrl(zoomLink);
  return {
    url,
    note: url ? undefined : {
      en: 'Your lesson link is being prepared and will reach you before the lesson.',
      ar: 'رابط الحصة بيتجهز وهيوصلك قبل ميعاد الدرس.'
    }
  };
}

const whenValue = (date: string, time: string, tz: string) => `${escapeHtml(date)} · ${escapeHtml(time)} (${escapeHtml(tz)})`;
const minutes = (m: number | undefined, fallback: number) => `${Number(m) || fallback} min`;

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
  lang?: EmailLang;
}): EmailRenderResult {
  const name = escapeHtml(params.learnerName);
  const service = escapeHtml(params.serviceName);
  const zoom = zoomParts(params.zoomLink);
  return render({
    preheader: { en: `Your lesson is confirmed · ${params.date}`, ar: `حصتك اتأكدت · ${params.date}` },
    title: { en: 'Your lesson is confirmed ✅', ar: 'حصتك اتأكدت ✅' },
    greeting: { en: `Assalamu alaikum ${name},`, ar: `السلام عليكم ${name}،` },
    paragraphs: [{
      en: `Your <strong>${service}</strong> lesson is booked and confirmed. We look forward to seeing you!`,
      ar: `حصتك في <strong>${service}</strong> اتحجزت واتأكدت. مستنيينك إن شاء الله!`
    }],
    rows: [
      [LBL.subject, service],
      [LBL.when, whenValue(params.date, params.timeDisplay, params.timezone)],
      [LBL.length, minutes(params.durationMinutes, 60)],
      [LBL.ref, escapeHtml(params.bookingRef)],
      [LBL.amount, params.feeAmount ? `${Number(params.feeAmount).toFixed(2)} ${escapeHtml(params.currency || 'USD')}` : '']
    ],
    note: zoom.note || {
      en: 'You can cancel up to 3 hours before (you get a lesson credit) or move it up to 1 hour before, from your account.',
      ar: 'تقدر تلغي لحد 3 ساعات قبل الحصة (وترجع لك كرصيد)، أو تغيّر الميعاد لحد ساعة قبلها من حسابك.'
    },
    button: zoom.url ? { url: params.zoomLink!, label: { en: 'Join on Zoom', ar: 'ادخل الحصة على Zoom' } } : ACCOUNT_BUTTON(),
    reason: STUDENT_REASON
  }, {
    en: `Lesson confirmed: ${params.serviceName} [${params.bookingRef}]`,
    ar: `تم تأكيد حصتك: ${params.serviceName} [${params.bookingRef}]`
  }, params.lang);
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
  lang?: EmailLang;
}): EmailRenderResult {
  const name = escapeHtml(params.learnerName);
  const service = escapeHtml(params.serviceName);
  const zoom = zoomParts(params.zoomLink);
  return render({
    preheader: { en: `Your free trial is booked · ${params.date}`, ar: `حصتك التجريبية اتحجزت · ${params.date}` },
    title: { en: 'Your free trial is booked 🌱', ar: 'حصتك التجريبية المجانية جاهزة 🌱' },
    greeting: { en: `Welcome ${name},`, ar: `أهلاً ${name}،` },
    paragraphs: [
      {
        en: `You booked a free trial lesson in <strong>${service}</strong>. We will get to know your level and goal and build a plan that fits you.`,
        ar: `حجزت حصة تجريبية مجانية في <strong>${service}</strong>. هنتعرف على مستواك وهدفك ونعمل خطة على مقاسك.`
      },
      { en: 'Find a quiet spot with headphones and join a couple of minutes early.', ar: 'جهّز مكان هادي وسماعة، وادخل قبل الميعاد بدقيقتين.' }
    ],
    rows: [
      [LBL.subject, service],
      [LBL.when, whenValue(params.date, params.timeDisplay, params.timezone)],
      [LBL.length, minutes(params.durationMinutes, 30)],
      [LBL.ref, escapeHtml(params.bookingRef)]
    ],
    note: zoom.note || { en: 'You can move your trial once, up to 1 hour before it starts.', ar: 'تقدر تغيّر ميعاد التجربة مرة واحدة لحد ساعة قبلها.' },
    button: zoom.url ? { url: params.zoomLink!, label: { en: 'Join on Zoom', ar: 'ادخل الحصة على Zoom' } } : ACCOUNT_BUTTON(),
    reason: STUDENT_REASON
  }, {
    en: `Free trial booked [${params.bookingRef}]`,
    ar: `حصتك التجريبية اتحجزت [${params.bookingRef}]`
  }, params.lang);
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
  lang?: EmailLang;
}): EmailRenderResult {
  const name = escapeHtml(params.learnerName);
  return render({
    preheader: { en: `Payment received · ${Number(params.amount).toFixed(2)} ${params.currency}`, ar: `وصلنا الدفع · ${Number(params.amount).toFixed(2)} ${params.currency}` },
    title: { en: 'Payment received — thank you 🤍', ar: 'وصلنا الدفع، شكراً لك 🤍' },
    greeting: { en: `Assalamu alaikum ${name},`, ar: `السلام عليكم ${name}،` },
    paragraphs: [{ en: 'We received your payment. Please keep this email as your receipt.', ar: 'استلمنا دفعتك بنجاح. احتفظ بالرسالة دي كإيصال.' }],
    rows: [
      [{ en: 'Item', ar: 'الخدمة' }, escapeHtml(params.serviceName)],
      [LBL.amount, `${Number(params.amount).toFixed(2)} ${escapeHtml(params.currency)}`],
      [{ en: 'Method', ar: 'طريقة الدفع' }, escapeHtml(params.paymentMethod)],
      [{ en: 'Payment ref', ar: 'مرجع الدفع' }, escapeHtml(params.paymentReference || '')],
      [LBL.ref, escapeHtml(params.bookingRef || '')],
      [{ en: 'Date', ar: 'التاريخ' }, escapeHtml(params.date)]
    ],
    note: {
      en: 'If you cancel a paid lesson 3 hours or more before it starts, you get a lesson credit, and you can ask for a refund instead as described in the terms.',
      ar: 'لو ألغيت حصة مدفوعة قبلها بـ 3 ساعات بترجع لك كرصيد، وتقدر تطلب الاسترداد بدل الرصيد حسب الشروط.'
    },
    button: ACCOUNT_BUTTON(),
    reason: STUDENT_REASON
  }, {
    en: `Payment receipt: ${params.serviceName}`,
    ar: `إيصال الدفع: ${params.serviceName}`
  }, params.lang);
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
  lang?: EmailLang;
}): EmailRenderResult {
  const name = escapeHtml(params.learnerName);
  return render({
    preheader: { en: `Lesson cancelled · ${params.date}`, ar: `الحصة اتلغت · ${params.date}` },
    title: { en: 'Your lesson was cancelled', ar: 'تم إلغاء الحصة' },
    greeting: { en: `Assalamu alaikum ${name},`, ar: `السلام عليكم ${name}،` },
    paragraphs: [{
      en: 'This lesson has been cancelled. If it was paid and cancelled in time, its credit is back in your account to book any time.',
      ar: 'الحصة دي اتلغت. لو كانت مدفوعة واتلغت في الوقت المسموح، رصيدها رجع لحسابك وتقدر تحجز بيه في أي وقت.'
    }],
    rows: [
      [LBL.subject, escapeHtml(params.serviceName)],
      [LBL.when, whenValue(params.date, params.timeDisplay, params.timezone)],
      [LBL.ref, escapeHtml(params.bookingRef)],
      [{ en: 'Reason', ar: 'السبب' }, escapeHtml(params.reason || '')]
    ],
    note: { en: 'Questions? Message us on WhatsApp.', ar: 'لو عندك أي سؤال كلمنا على واتساب.' },
    button: { url: `${SITE_URL}/student`, label: { en: 'Book a new time', ar: 'احجز ميعاد جديد' } },
    reason: STUDENT_REASON
  }, {
    en: `Lesson cancelled [${params.bookingRef}]`,
    ar: `تم إلغاء الحصة [${params.bookingRef}]`
  }, params.lang);
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
  lang?: EmailLang;
}): EmailRenderResult {
  const name = escapeHtml(params.learnerName);
  const zoom = zoomParts(params.zoomLink);
  return render({
    preheader: { en: `New time · ${params.newDate} ${params.newTimeDisplay}`, ar: `ميعاد جديد · ${params.newDate} ${params.newTimeDisplay}` },
    title: { en: 'Your lesson has a new time 🗓️', ar: 'ميعاد حصتك اتغيّر 🗓️' },
    greeting: { en: `Assalamu alaikum ${name},`, ar: `السلام عليكم ${name}،` },
    paragraphs: [{ en: 'Your lesson has moved. Here are the new details:', ar: 'ميعاد حصتك اتغيّر. التفاصيل الجديدة تحت:' }],
    rows: [
      [LBL.subject, escapeHtml(params.serviceName)],
      [{ en: 'Old time', ar: 'الميعاد القديم' }, `<s>${escapeHtml(params.oldDate)} · ${escapeHtml(params.oldTimeDisplay)}</s>`],
      [{ en: 'New time', ar: 'الميعاد الجديد' }, whenValue(params.newDate, params.newTimeDisplay, params.timezone)],
      [LBL.length, minutes(params.durationMinutes, 60)],
      [LBL.ref, escapeHtml(params.bookingRef)]
    ],
    note: zoom.note,
    button: zoom.url ? { url: params.zoomLink!, label: { en: 'Join on Zoom', ar: 'ادخل الحصة على Zoom' } } : ACCOUNT_BUTTON(),
    reason: STUDENT_REASON
  }, {
    en: `Lesson rescheduled [${params.bookingRef}]`,
    ar: `ميعاد جديد لحصتك [${params.bookingRef}]`
  }, params.lang);
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
  lang?: EmailLang;
}): EmailRenderResult {
  const name = escapeHtml(params.learnerName);
  const zoom = zoomParts(params.zoomLink);
  return render({
    preheader: { en: `Tomorrow: ${params.serviceName} at ${params.timeDisplay}`, ar: `بكرة: ${params.serviceName} الساعة ${params.timeDisplay}` },
    title: params.isTrial
      ? { en: 'Your free trial is tomorrow ⏰', ar: 'حصتك التجريبية بكرة ⏰' }
      : { en: 'Your lesson is tomorrow ⏰', ar: 'حصتك بكرة ⏰' },
    greeting: { en: `Hi ${name},`, ar: `أهلاً ${name}،` },
    paragraphs: [{ en: 'A friendly reminder about your lesson tomorrow.', ar: 'تذكير صغير بحصتك بكرة إن شاء الله.' }],
    rows: [
      [LBL.subject, escapeHtml(params.serviceName)],
      [LBL.when, whenValue(params.date, params.timeDisplay, params.timezone)],
      [LBL.length, minutes(params.durationMinutes, 60)]
    ],
    note: { en: 'You can still cancel up to 3 hours before or move it up to 1 hour before.', ar: 'لسه تقدر تلغي لحد 3 ساعات قبلها أو تغيّر الميعاد لحد ساعة قبلها.' },
    button: zoom.url ? { url: params.zoomLink!, label: { en: 'Lesson link', ar: 'رابط الحصة' } } : ACCOUNT_BUTTON(),
    reason: STUDENT_REASON
  }, {
    en: 'Reminder: your lesson is tomorrow',
    ar: 'تذكير: حصتك بكرة'
  }, params.lang);
}

// 7. Reminder 1 hour before
export function renderStudent1hReminder(params: {
  learnerName: string;
  serviceName: string;
  timeDisplay: string;
  timezone: string;
  bookingRef: string;
  zoomLink?: string | null;
  lang?: EmailLang;
}): EmailRenderResult {
  const name = escapeHtml(params.learnerName);
  const zoom = zoomParts(params.zoomLink);
  return render({
    preheader: { en: `Starting in 1 hour · ${params.timeDisplay}`, ar: `كمان ساعة · ${params.timeDisplay}` },
    title: { en: 'Your lesson starts in 1 hour 🔔', ar: 'حصتك كمان ساعة 🔔' },
    greeting: { en: `Hi ${name},`, ar: `أهلاً ${name}،` },
    paragraphs: [{ en: 'Your lesson starts in one hour. Get ready and join on time.', ar: 'حصتك هتبدأ كمان ساعة. جهّز نفسك وادخل في الميعاد.' }],
    rows: [
      [LBL.subject, escapeHtml(params.serviceName)],
      [{ en: 'Time', ar: 'الساعة' }, `${escapeHtml(params.timeDisplay)} (${escapeHtml(params.timezone)})`]
    ],
    note: zoom.note,
    button: zoom.url ? { url: params.zoomLink!, label: { en: 'Join on Zoom', ar: 'ادخل الحصة على Zoom' } } : undefined,
    reason: STUDENT_REASON
  }, {
    en: 'Your lesson starts in 1 hour',
    ar: 'حصتك كمان ساعة'
  }, params.lang);
}

export type StaffEventType =
  | 'new_booking' | 'new_trial' | 'new_lead' | 'payment_claimed' | 'payment_confirmed'
  | 'cancelled' | 'rescheduled' | 'alert';

const STAFF_TITLES: Record<StaffEventType, L> = {
  new_booking: { en: 'New lesson booked', ar: 'حجز حصة جديدة' },
  new_trial: { en: 'New free trial booked', ar: 'حصة تجريبية جديدة' },
  new_lead: { en: 'New interested student', ar: 'طالب مهتم جديد' },
  payment_claimed: { en: 'A student reported a payment', ar: 'طالب بلّغ عن دفع' },
  payment_confirmed: { en: 'Payment received', ar: 'وصل دفع' },
  cancelled: { en: 'Lesson cancelled', ar: 'حصة اتلغت' },
  rescheduled: { en: 'Lesson moved', ar: 'حصة اتغيّر ميعادها' },
  alert: { en: 'Alert', ar: 'تنبيه' }
};

// 8. Teacher / super admin notification
export function renderTeacherNotification(params: {
  eventType: StaffEventType;
  /** English summary line (shown in English emails). */
  title?: string;
  summary: string;
  summaryAr?: string;
  /** Rows as [English label, Arabic label, value] or a plain record (English labels). */
  details: Array<[string, string, unknown]> | Record<string, any>;
  actionUrl?: string;
  lang?: EmailLang;
}): EmailRenderResult {
  const rows: Row[] = (Array.isArray(params.details)
    ? params.details.map(([en, ar, v]) => [{ en, ar }, v] as [L, unknown])
    : Object.entries(params.details).map(([k, v]) => [{ en: k, ar: k }, v] as [L, unknown]))
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([label, v]) => [label, escapeHtml(String(v))]);
  const title = STAFF_TITLES[params.eventType] || STAFF_TITLES.alert;
  const summary: L = { en: escapeHtml(params.summary), ar: escapeHtml(params.summaryAr || params.summary) };
  return render({
    preheader: summary,
    title,
    paragraphs: [summary],
    rows,
    button: { url: params.actionUrl || `${SITE_URL}/dashboard`, label: { en: 'Open the dashboard', ar: 'افتح لوحة التحكم' } },
    reason: STAFF_REASON
  }, {
    en: `[Watazawwado] ${params.title || title.en}`,
    ar: `[وتزودوا] ${title.ar}`
  }, params.lang);
}
