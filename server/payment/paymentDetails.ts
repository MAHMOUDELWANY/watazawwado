/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — SERVER PAYMENT DETAILS
 * File: server/payment/paymentDetails.ts
 * Role: Server-side official payment details & formatting
 * ====================================================================
 */

export interface ServerPaymentOption {
  id: 'paypal' | 'payoneer' | 'bank_transfer' | 'ach';
  name: string;
  nameArabic: string;
  badge: string;
  instructions: string;
  details: Record<string, string>;
}

export const SERVER_PAYMENT_DETAILS: Record<string, ServerPaymentOption> = {
  paypal: {
    id: 'paypal',
    name: 'PayPal',
    nameArabic: 'باي بال (PayPal)',
    badge: 'Instant & Worldwide',
    instructions: 'Send lesson payment directly to Mahmoud’s verified PayPal email address. Please include your Booking Reference in the transfer note.',
    details: {
      'Email / Account': 'mahmoudelwany98@gmail.com',
      'Recipient Name': 'Mahmoud Said Alwani Abdel-Al'
    }
  },
  payoneer: {
    id: 'payoneer',
    name: 'Payoneer',
    nameArabic: 'بايونير (Payoneer)',
    badge: 'International Transfer',
    instructions: 'Make an account-to-account transfer via Payoneer to Mahmoud’s verified email address with zero or low transfer fees.',
    details: {
      'Email / Account': 'mahmoudelwany98@gmail.com',
      'Recipient Name': 'Mahmoud Said Alwani Abdel-Al'
    }
  },
  bank_transfer: {
    id: 'bank_transfer',
    name: 'International Bank Transfer (IBAN)',
    nameArabic: 'تحويل بنكي دولي (IBAN)',
    badge: 'UK / Worldwide Wire',
    instructions: 'Direct bank transfer using UK Clear Bank IBAN and BIC/SWIFT code.',
    details: {
      'Recipient Name': 'Mahmoud Said Alwani Abdel-Al',
      'IBAN': 'GB43CLRB04281266138923',
      'BIC / SWIFT': 'CLRBGB22XXX',
      'Account Number': '66138923',
      'Bank Name': 'Clear Bank',
      'Bank Country': 'United Kingdom (GB)',
      'Bank Address': '133 Houndsditch, LONDON, EC3A 7BX',
      'Account Type': 'Checking (Current)',
      'Recipient Address': 'Egypt, Saeed Elwany House, Sharaf Mosque, Sard Katoor Centre, Al Gharbiyah, Katoor City, 31784'
    }
  },
  ach: {
    id: 'ach',
    name: 'US Direct ACH / Routing',
    nameArabic: 'تحويل بنكي أمريكي (ACH)',
    badge: 'United States Accounts',
    instructions: 'Direct domestic transfer for US learners via ACH using Routing Number and Account Number.',
    details: {
      'Recipient Name': 'Mahmoud Said Alwani Abdel-Al',
      'Account Number': '212313309284',
      'Routing Number (ABA)': '101019644',
      'Bank Name': 'Lead Bank',
      'Bank Address': '1801 Main St., Kansas City, MO 64108',
      'Account Type': 'Checking (Current)',
      'Recipient Address': 'Egypt, Saeed Elwany House, Sharaf Mosque, Sard Katoor Centre, Al Gharbiyah, Katoor City, 31784'
    }
  }
};
