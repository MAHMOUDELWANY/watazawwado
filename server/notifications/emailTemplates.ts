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

// Brand palette and surfaces (the website's glass design system, docs/design-system.md).
const TEAL = '#087D91';
const RED = '#C51F24';
const COPPER = '#8B4935';
const GOLD = '#E5A93C';
const INK = '#12100E';
const BODY = '#453D34';
const MUTED = '#6E6358';
const PAPER = '#FAF7F2';
const LINE = '#EADFD0';
const FONT_STACK = "'Thmanyah Sans', Tahoma, 'Segoe UI', Arial, sans-serif";
const SERIF_STACK = `'Thmanyah Serif', Georgia, ${FONT_STACK}`;
/** The logo's ribbon: crimson, copper, gold, teal. */
const RIBBON = `linear-gradient(90deg,${RED} 0%,#B4552F 35%,${GOLD} 60%,${TEAL} 100%)`;

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

const SIGNATURE: L = { en: 'Watazawwado · Provision that lasts', ar: 'وتزودوا · زادٌ يبقى' };

/**
 * The frame every email shares: a deep teal band with the logo in a paper mihrab arch and the
 * logo ribbon, a white card body, and a warm footer with the signature and the legal lines.
 * `hero` is extra content inside the band (the welcome email puts the verse there).
 */
function renderShell(opts: { lang: EmailLang; title: string; preheader: string; hero?: string; body: string; reason: string; signature?: string }): string {
  const { lang } = opts;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const link = (href: string, label: string) => `<a href="${href}" style="color:${TEAL};text-decoration:none;font-weight:700;">${label}</a>`;
  const footerLinks = (lang === 'ar'
    ? [link(`${SITE_URL}/terms`, 'الشروط'), link(`${SITE_URL}/privacy`, 'الخصوصية'), link(WHATSAPP_URL, `واتساب <span dir="ltr">${WHATSAPP_DISPLAY}</span>`)]
    : [link(`${SITE_URL}/terms`, 'Terms'), link(`${SITE_URL}/privacy`, 'Privacy'), link(WHATSAPP_URL, `WhatsApp ${WHATSAPP_DISPLAY}`)]
  ).join(' &nbsp;·&nbsp; ');
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${opts.title}</title>
  <style>
    @font-face { font-family: 'Thmanyah Sans'; font-weight: 400; src: url('${FONT_URL}/thmanyahsans-Regular.woff2') format('woff2'); }
    @font-face { font-family: 'Thmanyah Sans'; font-weight: 700; src: url('${FONT_URL}/thmanyahsans-Bold.woff2') format('woff2'); }
    @font-face { font-family: 'Thmanyah Serif'; font-weight: 700; src: url('${FONT_URL}/thmanyahserifdisplay-Bold.woff2') format('woff2'); }
    body, table, td, p, a, h1 { font-family: ${FONT_STACK}; }
    @media (prefers-color-scheme: dark) {
      .page { background:#110F0E !important; }
      .shell { background:#1B1816 !important; border-color:#2E2824 !important; }
      .text { color:#FAF7F2 !important; }
      .body-text { color:#E4DACB !important; }
      .muted { color:#C4B9AA !important; }
      .card { background:#24201D !important; border-color:#3A322C !important; }
      .note { background:#2A231C !important; }
      .foot { background:#161311 !important; border-color:#2E2824 !important; }
    }
    [data-ogsc] .shell { background:#1B1816 !important; }
    [data-ogsc] .text { color:#FAF7F2 !important; }
    [data-ogsc] .body-text { color:#E4DACB !important; }
    [data-ogsc] .muted { color:#C4B9AA !important; }
    [data-ogsc] .card { background:#24201D !important; }
    @media (max-width: 600px) { .pad { padding-left:20px !important; padding-right:20px !important; } .verse { font-size:24px !important; } }
  </style>
</head>
<body class="page" style="margin:0;padding:0;background:#F1EADF;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>
  <table role="presentation" class="page" width="100%" cellspacing="0" cellpadding="0" style="background:#F1EADF;">
    <tr><td align="center" style="padding:28px 12px 36px;">
      <table role="presentation" class="shell" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border:1px solid ${LINE};border-radius:28px;overflow:hidden;box-shadow:0 18px 40px -14px rgba(59,34,25,0.24);">
        <tr><td align="center" style="background:#05363F;background-image:radial-gradient(circle at 80% 0%,rgba(229,169,60,0.28) 0%,rgba(229,169,60,0) 55%),linear-gradient(135deg,#05363F 0%,#0A5866 55%,#3B2219 100%);padding:30px 24px 26px;">
          <table role="presentation" cellspacing="0" cellpadding="0" align="center"><tr><td style="background:${PAPER};border-radius:56px 56px 18px 18px;padding:18px 18px 12px;border:1px solid rgba(229,169,60,0.6);">
            <img src="${LOGO_URL}" width="104" alt="Watazawwado" style="display:block;width:104px;height:auto;border:0;">
          </td></tr></table>
          ${opts.hero || ''}
          <div style="width:96px;height:3px;margin:18px auto 0;border-radius:3px;background:${GOLD};background-image:${RIBBON};font-size:0;line-height:0;">&nbsp;</div>
        </td></tr>
        <tr><td class="pad" dir="${dir}" style="padding:30px 36px 14px;text-align:${lang === 'ar' ? 'right' : 'left'};">
          ${opts.body}
        </td></tr>
        <tr><td class="pad foot" dir="${dir}" style="padding:22px 32px 26px;background:${PAPER};border-top:1px solid ${LINE};text-align:center;">
          <p class="text" style="margin:0 0 10px;font-family:${SERIF_STACK};font-size:15px;font-weight:700;color:${COPPER};">${opts.signature || SIGNATURE[lang]}</p>
          <p class="muted" style="margin:0 0 10px;font-size:12px;line-height:1.6;color:${MUTED};">${opts.reason}</p>
          <p style="margin:0 0 8px;font-size:12px;">${footerLinks}</p>
          <p class="muted" style="margin:0;font-size:11px;color:${MUTED};">${SUPPORT_EMAIL} · © ${new Date().getFullYear()} Watazawwado</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** The one main action of an email: a crimson pill. */
function ctaButton(url: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:14px auto 22px;">
            <tr><td style="border-radius:999px;background:${RED};box-shadow:0 10px 22px -10px rgba(197,31,36,0.7);">
              <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:999px;">${label}</a>
            </td></tr>
          </table>`;
}

function detailsTable(rows: Row[] | undefined, lang: EmailLang): string {
  const visible = (rows || []).filter(([, value]) => value);
  if (visible.length === 0) return '';
  const body = visible
    .map(([label, value], i) => {
      const rule = i ? `border-top:1px solid ${LINE};` : '';
      return `<tr>
        <td class="muted" style="padding:9px 0;${rule}width:40%;vertical-align:top;font-size:13px;color:${MUTED};">${label[lang]}</td>
        <td class="text" style="padding:9px 0;${rule}font-size:14px;font-weight:700;color:${INK};" dir="auto">${value}</td>
      </tr>`;
    })
    .join('');
  return `<table role="presentation" class="card" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;background:#F6F1EA;border:1px solid ${LINE};border-radius:18px;">
      <tr><td style="padding:8px 20px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${body}</table></td></tr>
    </table>`;
}

function renderLayout(content: EmailContent, lang: EmailLang): string {
  const safeButtonUrl = content.button ? sanitizeUrl(content.button.url) : '';
  const side = lang === 'ar' ? 'right' : 'left';
  const p = (html: string) => `<p class="body-text" style="margin:0 0 12px;font-size:15px;line-height:1.75;color:${BODY};">${html}</p>`;
  const note = pick(content.note, lang);
  const body = `<h1 class="text" style="margin:0 0 14px;font-family:${SERIF_STACK};font-size:24px;line-height:1.35;font-weight:700;color:${INK};">${content.title[lang]}</h1>
          ${content.greeting ? p(content.greeting[lang]) : ''}
          ${content.paragraphs.map(par => p(par[lang])).join('')}
          ${detailsTable(content.rows, lang)}
          ${note ? `<p class="muted note" style="margin:0 0 8px;padding:10px 14px;border-${side}:3px solid ${GOLD};background:#FBF4E6;border-radius:10px;font-size:13px;line-height:1.65;color:${MUTED};">${note}</p>` : ''}
          ${safeButtonUrl && content.button ? ctaButton(safeButtonUrl, content.button.label[lang]) : ''}`;
  return renderShell({ lang, title: content.title[lang], preheader: content.preheader[lang], body, reason: content.reason[lang] });
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
  termsVersion?: string | null;
  termsAcceptedAt?: string | null;
  isPackageLesson?: boolean;
  lang?: EmailLang;
}): EmailRenderResult {
  const name = escapeHtml(params.learnerName);
  const service = escapeHtml(params.serviceName);
  const zoom = zoomParts(params.zoomLink);
  const version = escapeHtml(params.termsVersion || '');
  const acceptedOn = escapeHtml(String(params.termsAcceptedAt || '').slice(0, 10));
  const termsLink = `<a href="${SITE_URL}/terms" style="color:${TEAL};">${SITE_URL.replace(/^https?:\/\//, '')}/terms</a>`;
  const legal: L[] = [];
  if (version) {
    legal.push({
      en: `This booking follows our terms version ${version}${acceptedOn ? `, which you accepted on ${acceptedOn}` : ''}: ${termsLink}`,
      ar: `يخضع هذا الحجز لشروطنا (إصدار ${version})${acceptedOn ? ` التي وافقت عليها بتاريخ ${acceptedOn}` : ''}: ${termsLink}`
    });
  }
  // Paid single lessons: confirm the early-start request and the 14-day withdrawal right on a durable medium.
  // The early-start checkbox exists from terms 2026-10-15.2 (string order works for these versions).
  if (version >= '2026-10-15.2' && !params.isPackageLesson && params.feeAmount) {
    legal.push({
      en: `You asked for this lesson to take place before your 14-day withdrawal period ends. You may still withdraw within 14 days of booking by writing to ${SUPPORT_EMAIL}; you would pay only for what was already provided, and the right ends once the lesson has been fully delivered.`,
      ar: `طلبت أن يتم هذا الدرس قبل انتهاء مدة الانسحاب (14 يوماً). ويظل من حقك الانسحاب خلال 14 يوماً من الحجز بمراسلتنا على ${SUPPORT_EMAIL}، وتدفع فقط مقابل ما تم تقديمه فعلاً، وينتهي هذا الحق بعد تقديم الدرس بالكامل.`
    });
  }
  return render({
    preheader: { en: `Your lesson is confirmed · ${params.date}`, ar: `حصتك اتأكدت · ${params.date}` },
    title: { en: 'Your lesson is confirmed ✅', ar: 'حصتك اتأكدت ✅' },
    greeting: { en: `Assalamu alaikum ${name},`, ar: `السلام عليكم ${name}،` },
    paragraphs: [{
      en: `Your <strong>${service}</strong> lesson is booked and confirmed. We look forward to seeing you!`,
      ar: `حصتك في <strong>${service}</strong> اتحجزت واتأكدت. مستنيينك إن شاء الله!`
    }, ...legal],
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
// 8. Reminder 3 hours before (RULES.md §2, 2026-10-15: email at booking and 3 hours before)
export function renderStudent3hReminder(params: {
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
    preheader: { en: `In 3 hours · ${params.timeDisplay}`, ar: `كمان ٣ ساعات · ${params.timeDisplay}` },
    title: { en: 'Your lesson is in 3 hours 🌿', ar: 'حصتك كمان ٣ ساعات 🌿' },
    greeting: { en: `Assalamu alaikum ${name},`, ar: `السلام عليكم ${name}،` },
    paragraphs: [{
      en: 'A gentle reminder: your lesson is today, in about three hours. Find a quiet corner, and your teacher will be waiting for you.',
      ar: 'تذكير لطيف: حصتك النهارده كمان حوالي ٣ ساعات. جهّز ركن هادي، ومعلمك هيكون في انتظارك.'
    }],
    rows: [
      [LBL.subject, escapeHtml(params.serviceName)],
      [{ en: 'Time', ar: 'الساعة' }, `${escapeHtml(params.timeDisplay)} (${escapeHtml(params.timezone)})`],
      [LBL.ref, escapeHtml(params.bookingRef)]
    ],
    note: zoom.note,
    button: zoom.url ? { url: params.zoomLink!, label: { en: 'Join on Zoom', ar: 'ادخل الحصة على Zoom' } } : ACCOUNT_BUTTON(),
    reason: STUDENT_REASON
  }, {
    en: 'Your lesson is in 3 hours',
    ar: 'حصتك كمان ٣ ساعات'
  }, params.lang);
}

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
  | 'new_booking' | 'new_trial' | 'new_lead' | 'new_student' | 'payment_claimed' | 'payment_confirmed'
  | 'cancelled' | 'rescheduled' | 'alert' | 'new_signup' | 'payslip';

const STAFF_TITLES: Record<StaffEventType, L> = {
  new_booking: { en: 'New lesson booked', ar: 'حجز حصة جديدة' },
  new_trial: { en: 'New free trial booked', ar: 'حصة تجريبية جديدة' },
  new_lead: { en: 'New interested student', ar: 'طالب مهتم جديد' },
  new_student: { en: 'A new student chose you', ar: 'طالب جديد اختارك' },
  payment_claimed: { en: 'A student reported a payment', ar: 'طالب بلّغ عن دفع' },
  payment_confirmed: { en: 'Payment received', ar: 'وصل دفع' },
  cancelled: { en: 'Lesson cancelled', ar: 'حصة اتلغت' },
  rescheduled: { en: 'Lesson moved', ar: 'حصة اتغيّر ميعادها' },
  alert: { en: 'Alert', ar: 'تنبيه' },
  new_signup: { en: 'New student signed up', ar: 'طالب جديد سجّل' },
  payslip: { en: 'Your pay for the month', ar: 'مرتبك عن الشهر' }
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

// Short notice that mirrors an on-site notification (refunds, admin replies, placement results).
/**
 * PR-09: the monthly progress note for an adult learner or a family. Names come from our database and are escaped;
 * the footer reason says how to switch these emails off (profile → preferences, RN-07).
 */
export function renderMonthlyProgressEmail(params: {
  name?: string | null;
  monthLabel: L;
  lines: L[];
  reportPath: string;
  lang?: EmailLang;
}): EmailRenderResult {
  const name = escapeHtml(params.name || '');
  const settings = `${SITE_URL}/student/account?tab=preferences`;
  const title: L = { en: `Your month with us: ${params.monthLabel.en}`, ar: `شهرك معانا: ${params.monthLabel.ar}` };
  return render({
    preheader: title,
    title,
    greeting: name ? { en: `Assalamu alaikum ${name},`, ar: `السلام عليكم ${name}،` } : { en: 'Assalamu alaikum,', ar: 'السلام عليكم،' },
    paragraphs: [
      ...params.lines.map((l) => ({ en: escapeHtml(l.en), ar: escapeHtml(l.ar) })),
      { en: 'The full report, with the teacher\'s notes, is in your account. You can print it or keep it.', ar: 'التقرير الكامل بملاحظات المعلم موجود في حسابك، وتقدر تطبعه أو تحتفظ بيه.' }
    ],
    button: { url: `${SITE_URL}${params.reportPath}`, label: { en: 'Open the monthly report', ar: 'افتح التقرير الشهري' } },
    reason: {
      en: `You get this monthly note because progress emails are on in your account. <a href="${settings}" style="color:${TEAL};">Turn them off</a> any time.`,
      ar: `وصلتك الرسالة دي لأن إيميلات التقدّم شغّالة في حسابك. تقدر <a href="${settings}" style="color:${TEAL};">توقفها</a> في أي وقت.`
    }
  }, title, params.lang);
}

export function renderSimpleNotice(params: {
  name?: string | null;
  title: L;
  body: L;
  buttonPath?: string;
  staff?: boolean;
  lang?: EmailLang;
}): EmailRenderResult {
  const name = escapeHtml(params.name || '');
  return render({
    preheader: params.title,
    title: params.title,
    greeting: name ? { en: `Assalamu alaikum ${name},`, ar: `السلام عليكم ${name}،` } : undefined,
    paragraphs: [{ en: escapeHtml(params.body.en), ar: escapeHtml(params.body.ar) }],
    button: params.buttonPath ? { url: `${SITE_URL}${params.buttonPath}`, label: { en: 'Open the website', ar: 'افتح الموقع' } } : undefined,
    reason: params.staff ? STAFF_REASON : STUDENT_REASON
  }, params.title, params.lang);
}

/**
 * Welcome email after onboarding ("welcome to the Watazawwado family"). Its own richer layout:
 * a deep-teal hero carrying the verse the site is named after, then the three steps ahead.
 * Table-based and inline-styled for email clients; same brand colours, font and legal footer.
 */
export function renderWelcomeEmail(params: {
  name: string;
  teacherName?: string | null;
  isFamily?: boolean;
  childNames?: string[];
  lang?: EmailLang;
}): EmailRenderResult {
  const lang: EmailLang = params.lang || 'en';
  const ar = lang === 'ar';
  const dir = ar ? 'rtl' : 'ltr';
  const align = ar ? 'right' : 'left';
  const name = escapeHtml(params.name);
  const kids = (params.childNames || []).map(escapeHtml).join(ar ? '، ' : ', ');
  const t = (en: string, arText: string) => (ar ? arText : en);
  const subject = t('Welcome to the Watazawwado family', 'أهلًا بيك في عائلة وتزودوا');
  const steps: [string, string][] = [
    [t('Book your free trial', 'احجز حصتك التجريبية المجانية'), t('30 minutes on Zoom, at a time that suits you. No card needed.', '30 دقيقة على زووم في الوقت اللي يناسبك، من غير أي دفع.')],
    [t('A short placement test', 'اختبار تحديد مستوى قصير'), t('About 5 minutes after booking, so your teacher prepares the lesson for your exact level.', 'حوالي 5 دقايق بعد الحجز، عشان معلمك يجهّز الحصة على قد مستواك بالظبط.')],
    [t('Your first lesson', 'أول حصة ليك'), t('Your teacher opens the class; you join from your account or the email we send.', 'المعلم بيفتح الفصل، وانت بتدخل من حسابك أو من الإيميل اللي بيوصلك.')]
  ];
  const intro = params.isFamily
    ? t(`We are honoured that you chose us for your family's learning${kids ? ` — a warm welcome to ${kids}` : ''}. From today, every lesson is one-to-one, with a teacher who knows each child by name.`,
        `يشرفنا إنك اخترتنا لرحلة تعلّم عائلتك${kids ? ` — وأهلًا وسهلًا بـ ${kids}` : ''}. من النهارده كل حصة فردية، مع معلم بيعرف كل طفل باسمه.`)
    : t('We are honoured that you chose to begin this journey with us. From today, every lesson is one-to-one, shaped around you and your goals.',
        'يشرفنا إنك اخترت تبدأ الرحلة دي معانا. من النهارده كل حصة فردية، ومتفصّلة على قدك وعلى أهدافك.');
  // Steps sit on a gold thread: numbered medallions (the first in crimson), joined by a thin line.
  const stepRows = steps.map(([title, body], i) => `
          <tr>
            <td width="48" valign="top" style="padding:0;"><div style="width:40px;">
              <div style="width:36px;height:36px;border-radius:18px;background:${i === 0 ? RED : TEAL};border:2px solid ${GOLD};color:#FFFFFF;font-size:15px;font-weight:700;line-height:36px;text-align:center;">${i + 1}</div>
              ${i < steps.length - 1 ? `<div style="width:2px;height:30px;margin:4px auto;background:${GOLD};opacity:0.55;font-size:0;line-height:0;">&nbsp;</div>` : ''}</div>
            </td>
            <td valign="top" dir="${dir}" style="padding:4px 0 16px;text-align:${align};">
              <p class="text" style="margin:0 0 3px;font-size:16px;font-weight:700;color:${INK};">${title}</p>
              <p class="muted" style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};">${body}</p>
            </td>
          </tr>`).join('');

  const hero = `<p class="verse" dir="rtl" style="margin:20px 0 0;font-family:${SERIF_STACK};font-size:28px;line-height:1.6;color:#F6D58E;">﴿وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ﴾</p>
          <p style="margin:4px 0 0;font-size:12px;color:#CFE3E6;">${t('Al-Baqarah 197, the verse our name comes from', 'البقرة ١٩٧، ومنها اسمنا')}</p>`;
  const body = `<h1 class="text" style="margin:0 0 8px;font-family:${SERIF_STACK};font-size:26px;line-height:1.35;font-weight:700;color:${INK};">${t(`Welcome to the family, ${name}`, `أهلًا بيك في العيلة يا ${name}`)}</h1>
          <p class="body-text" style="margin:0 0 22px;font-size:15px;line-height:1.8;color:${BODY};">${intro}</p>
          ${params.teacherName ? `<table role="presentation" class="card" width="100%" cellspacing="0" cellpadding="0" style="background:#F6F1EA;border:1px solid ${LINE};border-radius:18px;margin:0 0 24px;">
            <tr><td dir="${dir}" style="padding:14px 20px;text-align:${align};">
              <p class="muted" style="margin:0;font-size:12px;color:${MUTED};">${t('Your teacher', params.isFamily ? 'المعلم المسؤول' : 'معلمك')}</p>
              <p class="text" style="margin:2px 0 0;font-family:${SERIF_STACK};font-size:18px;font-weight:700;color:${TEAL};">${escapeHtml(params.teacherName)}</p>
            </td></tr>
          </table>` : ''}
          <p class="text" style="margin:0 0 14px;font-size:13px;font-weight:700;color:${COPPER};">${t('What happens next', 'اللي جاي')}</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${stepRows}</table>
          ${ctaButton(`${SITE_URL}/student/book`, t('Book my free trial', 'احجز حصتي التجريبية'))}
          <p class="muted" style="margin:0 0 18px;font-size:13px;line-height:1.7;color:${MUTED};text-align:center;">${t('Questions? Write to us in Messages in your account, or on WhatsApp', 'عندك سؤال؟ اكتبلنا في "الرسائل" في حسابك، أو على واتساب')} <a href="${WHATSAPP_URL}" style="color:${TEAL};text-decoration:none;" dir="ltr">${WHATSAPP_DISPLAY}</a></p>`;

  const html = renderShell({
    lang,
    title: subject,
    preheader: t('Your journey starts here. Your free trial is one click away.', 'رحلتك بتبدأ من هنا، وحصتك التجريبية على بُعد ضغطة.'),
    hero,
    body,
    reason: STUDENT_REASON[lang]
  });

  const text = [
    subject,
    'وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ (2:197)',
    t(`Welcome to the family, ${params.name}`, `أهلًا بيك في العيلة يا ${params.name}`),
    intro,
    params.teacherName ? `${t('Your teacher', 'معلمك')}: ${params.teacherName}` : '',
    ...steps.map(([title, body], i) => `${i + 1}. ${title} — ${body}`),
    `${t('Book my free trial', 'احجز حصتي التجريبية')}: ${SITE_URL}/student/book`,
    `WhatsApp: ${WHATSAPP_DISPLAY}`
  ].filter((l) => l !== '').join('\n\n');

  return { subject, html, text };
}

/**
 * Templates pasted into Supabase Auth → Email Templates (sign-up code, password reset, teacher invite).
 * Supabase sends one template to everyone, so these carry Arabic first, then English, in the same frame.
 * They keep Supabase's own placeholders ({{ .Token }}, {{ .ConfirmationURL }}). Rendered to
 * docs/email-previews by scripts/render-email-previews.ts.
 */
export function renderSupabaseAuthTemplate(kind: 'confirm' | 'reset' | 'invite'): { subject: string; html: string } {
  const copy = {
    confirm: {
      subject: 'رمز تأكيد حسابك · Your Watazawwado code',
      ar: ['رمز تأكيد حسابك', 'اكتب الرمز ده في صفحة التأكيد عشان نفتح حسابك. صالح لمدة ساعة.'],
      en: ['Your sign-up code', 'Enter this code on the confirmation page to open your account. It works for one hour.']
    },
    reset: {
      subject: 'كلمة سر جديدة · Reset your Watazawwado password',
      ar: ['نختار كلمة سر جديدة؟', 'وصلنا طلب تغيير كلمة السر لحسابك. اضغط الزر واختار كلمة جديدة.'],
      en: ['Choose a new password', 'We received a request to reset your password. Press the button to choose a new one.']
    },
    invite: {
      subject: 'دعوة للانضمام لفريق وتزودوا · Join the Watazawwado teachers',
      ar: ['أهلاً بيك في فريق المعلمين', 'اتضافت كمعلم في وتزودوا. اضغط الزر عشان تختار كلمة السر وتدخل لوحة المعلم.'],
      en: ['Welcome to the teaching team', 'You were added as a teacher at Watazawwado. Press the button to choose your password and open the teacher dashboard.']
    }
  }[kind];
  const action = kind === 'confirm'
    ? `<table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:6px auto 22px;"><tr><td class="card" dir="ltr" style="background:#F6F1EA;border:1px solid ${LINE};border-radius:22px;padding:16px 26px;font-family:${SERIF_STACK};font-size:34px;font-weight:700;letter-spacing:10px;color:${INK};">{{ .Token }}</td></tr></table>`
    : ctaButton('{{ .ConfirmationURL }}', kind === 'reset' ? 'تغيير كلمة السر · Reset password' : 'قبول الدعوة · Accept the invitation');
  const block = (lang: EmailLang, [title, text]: string[]) => `<div dir="${lang === 'ar' ? 'rtl' : 'ltr'}" style="text-align:${lang === 'ar' ? 'right' : 'left'};">
            <h1 class="text" style="margin:0 0 8px;font-family:${SERIF_STACK};font-size:${lang === 'ar' ? 24 : 20}px;line-height:1.35;font-weight:700;color:${INK};">${title}</h1>
            <p class="body-text" style="margin:0 0 14px;font-size:${lang === 'ar' ? 15 : 14}px;line-height:1.75;color:${BODY};">${text}</p>
          </div>`;
  const ignore = kind === 'invite'
    ? 'لو مكنتش مستني الدعوة دي، تجاهل الرسالة.<br><span dir="ltr">If you did not expect this invitation, ignore this email.</span>'
    : 'لو مش إنت اللي طلبت، تجاهل الرسالة وحسابك هيفضل في أمان.<br><span dir="ltr">If this was not you, ignore this email; your account stays safe.</span>';
  const body = `${block('ar', copy.ar)}
          ${kind === 'confirm' ? '' : action}
          <div style="height:1px;background:${LINE};margin:4px 0 18px;font-size:0;line-height:0;">&nbsp;</div>
          ${block('en', copy.en)}
          ${action}
          <p class="muted" style="margin:0 0 14px;font-size:12px;line-height:1.7;color:${MUTED};text-align:center;">${ignore}</p>`;
  const html = renderShell({
    lang: 'ar',
    title: copy.subject,
    preheader: copy.subject,
    body,
    reason: 'وصلتك الرسالة دي لأن الإيميل <span dir="ltr">{{ .Email }}</span> اتسجل على وتزودوا.<br><span dir="ltr">You received this because {{ .Email }} was used on Watazawwado.</span>',
    signature: 'وتزودوا · Watazawwado'
  });
  return { subject: copy.subject, html };
}
