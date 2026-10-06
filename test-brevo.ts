/**
 * Quick Brevo Connectivity and Diagnostics Test
 * Usage: bun test-brevo.ts
 */

import { getEmailConfigStatus, sendEmail } from './server/notifications/emailService.js';

async function main() {
  console.log('=== BREVO EMAIL SERVICE DIAGNOSTIC ===');
  const status = getEmailConfigStatus();
  console.log('Config status:', JSON.stringify(status, null, 2));

  if (!status.isConfigured) {
    console.log('\n[!] BREVO_API_KEY is not detected in your current local environment.');
    console.log('Note: If BREVO_API_KEY is configured in Vercel Environment Variables, live emails will work in production on Vercel.');
    console.log('To test locally, add BREVO_API_KEY=your_key to your local .env file and run this script again.\n');
    return;
  }

  console.log('\n[*] BREVO_API_KEY is detected. Attempting test send to:', status.teacherEmail);
  const result = await sendEmail({
    to: status.teacherEmail,
    toName: 'Mahmoud Alwani',
    subject: 'اختبار ربط منصة وتزودوا مع Brevo بنجاح',
    html: `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px;">
        <h2 style="color: #C51F24;">منصة وتزودوا | Watazawwado.academy</h2>
        <p>السلام عليكم ورحمة الله،</p>
        <p>هذا إيميل تجريبي يؤكد نجاح ربط <strong>Brevo API</strong> مع نطاق المنصة الرسمي الجديد <strong>watazawwado.academy</strong>.</p>
        <p style="color: #666; font-size: 13px;">تم الإرسال عبر خادم Brevo Transactional Email بنجاح.</p>
      </div>
    `,
    text: 'هذا إيميل تجريبي يؤكد نجاح ربط Brevo مع منصة وتزودوا الرسمية watazawwado.academy.',
  });

  console.log('Result:', JSON.stringify(result, null, 2));
  if (result.success) {
    console.log('\n[✓] SUCCESS: Test email dispatched successfully via Brevo!');
  } else {
    console.log('\n[X] FAILED:', result.error);
  }
}

main().catch(console.error);
