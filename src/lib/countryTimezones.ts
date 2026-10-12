import { DateTime } from 'luxon';

export interface TimezoneItem {
  value: string;
  label: string;
  labelAr: string;
  city: string;
  cityAr: string;
  offset: string;
}

export interface ServedCountry {
  code: string;
  name: string;
  nameAr: string;
  flag: string;
  dialCode: string;
  primaryTimezone: string;
  phoneLength: number | number[]; // Number of digits expected excluding country dial code
  phonePlaceholder: string;
  phoneHintAr: string;
  phoneHintEn: string;
  timezones: TimezoneItem[];
}

export const SERVED_COUNTRIES: ServedCountry[] = [
  // ================= ARAB COUNTRIES =================
  {
    code: 'EG',
    name: 'Egypt',
    nameAr: 'مصر',
    flag: '🇪🇬',
    dialCode: '+20',
    primaryTimezone: 'Africa/Cairo',
    phoneLength: [10, 11], // 10 digits without leading 0 (10xxxxxxxx), 11 with leading 0 (010xxxxxxxx)
    phonePlaceholder: '101 234 5678',
    phoneHintAr: '10 أو 11 رقماً (مثال: 01012345678)',
    phoneHintEn: '10 or 11 digits (e.g. 01012345678)',
    timezones: [
      {
        value: 'Africa/Cairo',
        label: 'Egypt Standard Time (Cairo)',
        labelAr: 'توقيت مصر (القاهرة والإسكندرية)',
        city: 'Cairo / Alexandria',
        cityAr: 'القاهرة / الإسكندرية',
        offset: 'UTC+2 / UTC+3'
      }
    ]
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    nameAr: 'المملكة العربية السعودية',
    flag: '🇸🇦',
    dialCode: '+966',
    primaryTimezone: 'Asia/Riyadh',
    phoneLength: [9, 10], // 9 digits (5xxxxxxxx) or 10 (05xxxxxxxx)
    phonePlaceholder: '50 123 4567',
    phoneHintAr: '9 أرقام تبدأ بـ 5 (مثال: 501234567)',
    phoneHintEn: '9 digits starting with 5 (e.g. 501234567)',
    timezones: [
      {
        value: 'Asia/Riyadh',
        label: 'Arabian Standard Time (Riyadh / Makkah)',
        labelAr: 'توقيت السعودية (الرياض / مكة المكرمة / المدينة)',
        city: 'Riyadh / Makkah',
        cityAr: 'الرياض / مكة المكرمة',
        offset: 'UTC+3'
      }
    ]
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    nameAr: 'الإمارات العربية المتحدة',
    flag: '🇦🇪',
    dialCode: '+971',
    primaryTimezone: 'Asia/Dubai',
    phoneLength: [9, 10], // 9 digits (5xxxxxxxx) or 10 (05xxxxxxxx)
    phonePlaceholder: '50 123 4567',
    phoneHintAr: '9 أرقام (مثال: 501234567)',
    phoneHintEn: '9 digits (e.g. 501234567)',
    timezones: [
      {
        value: 'Asia/Dubai',
        label: 'Gulf Standard Time (Dubai / Abu Dhabi)',
        labelAr: 'توقيت الإمارات (دبي / أبوظبي)',
        city: 'Dubai / Abu Dhabi',
        cityAr: 'دبي / أبوظبي',
        offset: 'UTC+4'
      }
    ]
  },
  {
    code: 'KW',
    name: 'Kuwait',
    nameAr: 'الكويت',
    flag: '🇰🇼',
    dialCode: '+965',
    primaryTimezone: 'Asia/Kuwait',
    phoneLength: 8,
    phonePlaceholder: '9123 4567',
    phoneHintAr: '8 أرقام (مثال: 91234567)',
    phoneHintEn: '8 digits (e.g. 91234567)',
    timezones: [
      {
        value: 'Asia/Kuwait',
        label: 'Kuwait Standard Time (Kuwait City)',
        labelAr: 'توقيت الكويت (مدينة الكويت)',
        city: 'Kuwait City',
        cityAr: 'مدينة الكويت',
        offset: 'UTC+3'
      }
    ]
  },
  {
    code: 'QA',
    name: 'Qatar',
    nameAr: 'قطر',
    flag: '🇶🇦',
    dialCode: '+974',
    primaryTimezone: 'Asia/Qatar',
    phoneLength: 8,
    phonePlaceholder: '3312 3456',
    phoneHintAr: '8 أرقام (مثال: 33123456)',
    phoneHintEn: '8 digits (e.g. 33123456)',
    timezones: [
      {
        value: 'Asia/Qatar',
        label: 'Qatar Standard Time (Doha)',
        labelAr: 'توقيت قطر (الدوحة)',
        city: 'Doha',
        cityAr: 'الدوحة',
        offset: 'UTC+3'
      }
    ]
  },
  {
    code: 'BH',
    name: 'Bahrain',
    nameAr: 'البحرين',
    flag: '🇧🇭',
    dialCode: '+973',
    primaryTimezone: 'Asia/Bahrain',
    phoneLength: 8,
    phonePlaceholder: '3912 3456',
    phoneHintAr: '8 أرقام (مثال: 39123456)',
    phoneHintEn: '8 digits (e.g. 39123456)',
    timezones: [
      {
        value: 'Asia/Bahrain',
        label: 'Bahrain Standard Time (Manama)',
        labelAr: 'توقيت البحرين (المنامة)',
        city: 'Manama',
        cityAr: 'المنامة',
        offset: 'UTC+3'
      }
    ]
  },
  {
    code: 'OM',
    name: 'Oman',
    nameAr: 'سلطنة عُمان',
    flag: '🇴🇲',
    dialCode: '+968',
    primaryTimezone: 'Asia/Muscat',
    phoneLength: 8,
    phonePlaceholder: '9123 4567',
    phoneHintAr: '8 أرقام (مثال: 91234567)',
    phoneHintEn: '8 digits (e.g. 91234567)',
    timezones: [
      {
        value: 'Asia/Muscat',
        label: 'Oman Standard Time (Muscat)',
        labelAr: 'توقيت سلطنة عُمان (مسقط)',
        city: 'Muscat',
        cityAr: 'مسقط',
        offset: 'UTC+4'
      }
    ]
  },
  {
    code: 'JO',
    name: 'Jordan',
    nameAr: 'الأردن',
    flag: '🇯🇴',
    dialCode: '+962',
    primaryTimezone: 'Asia/Amman',
    phoneLength: [9, 10],
    phonePlaceholder: '79 123 4567',
    phoneHintAr: '9 أرقام (مثال: 791234567)',
    phoneHintEn: '9 digits (e.g. 791234567)',
    timezones: [
      {
        value: 'Asia/Amman',
        label: 'Jordan Standard Time (Amman)',
        labelAr: 'توقيت الأردن (عمّان)',
        city: 'Amman',
        cityAr: 'عمّان',
        offset: 'UTC+3'
      }
    ]
  },
  {
    code: 'LB',
    name: 'Lebanon',
    nameAr: 'لبنان',
    flag: '🇱🇧',
    dialCode: '+961',
    primaryTimezone: 'Asia/Beirut',
    phoneLength: [8, 9],
    phonePlaceholder: '70 123 456',
    phoneHintAr: '8 أرقام (مثال: 70123456)',
    phoneHintEn: '8 digits (e.g. 70123456)',
    timezones: [
      {
        value: 'Asia/Beirut',
        label: 'Lebanon Time (Beirut)',
        labelAr: 'توقيت لبنان (بيروت)',
        city: 'Beirut',
        cityAr: 'بيروت',
        offset: 'UTC+2 / UTC+3'
      }
    ]
  },
  {
    code: 'PS',
    name: 'Palestine',
    nameAr: 'فلسطين',
    flag: '🇵🇸',
    dialCode: '+970',
    primaryTimezone: 'Asia/Gaza',
    phoneLength: [9, 10],
    phonePlaceholder: '59 123 4567',
    phoneHintAr: '9 أرقام (مثال: 591234567)',
    phoneHintEn: '9 digits (e.g. 591234567)',
    timezones: [
      {
        value: 'Asia/Gaza',
        label: 'Palestine Time (Jerusalem / Gaza)',
        labelAr: 'توقيت فلسطين (القدس / غزة)',
        city: 'Jerusalem / Gaza',
        cityAr: 'القدس / غزة',
        offset: 'UTC+2 / UTC+3'
      }
    ]
  },
  {
    code: 'IQ',
    name: 'Iraq',
    nameAr: 'العراق',
    flag: '🇮🇶',
    dialCode: '+964',
    primaryTimezone: 'Asia/Baghdad',
    phoneLength: 10,
    phonePlaceholder: '770 123 4567',
    phoneHintAr: '10 أرقام (مثال: 7701234567)',
    phoneHintEn: '10 digits (e.g. 7701234567)',
    timezones: [
      {
        value: 'Asia/Baghdad',
        label: 'Arabia Standard Time (Baghdad)',
        labelAr: 'توقيت العراق (بغداد)',
        city: 'Baghdad',
        cityAr: 'بغداد',
        offset: 'UTC+3'
      }
    ]
  },
  {
    code: 'MA',
    name: 'Morocco',
    nameAr: 'المغرب',
    flag: '🇲🇦',
    dialCode: '+212',
    primaryTimezone: 'Africa/Casablanca',
    phoneLength: [9, 10],
    phonePlaceholder: '612 345 678',
    phoneHintAr: '9 أرقام (مثال: 612345678)',
    phoneHintEn: '9 digits (e.g. 612345678)',
    timezones: [
      {
        value: 'Africa/Casablanca',
        label: 'Western European Time (Casablanca / Rabat)',
        labelAr: 'توقيت المغرب (الرباط / الدار البيضاء)',
        city: 'Casablanca / Rabat',
        cityAr: 'الرباط / الدار البيضاء',
        offset: 'UTC+1'
      }
    ]
  },
  {
    code: 'DZ',
    name: 'Algeria',
    nameAr: 'الجزائر',
    flag: '🇩🇿',
    dialCode: '+213',
    primaryTimezone: 'Africa/Algiers',
    phoneLength: [9, 10],
    phonePlaceholder: '551 234 567',
    phoneHintAr: '9 أرقام (مثال: 551234567)',
    phoneHintEn: '9 digits (e.g. 551234567)',
    timezones: [
      {
        value: 'Africa/Algiers',
        label: 'Central European Time (Algiers)',
        labelAr: 'توقيت الجزائر (الجزائر العاصمة)',
        city: 'Algiers',
        cityAr: 'الجزائر العاصمة',
        offset: 'UTC+1'
      }
    ]
  },
  {
    code: 'TN',
    name: 'Tunisia',
    nameAr: 'تونس',
    flag: '🇹🇳',
    dialCode: '+216',
    primaryTimezone: 'Africa/Tunis',
    phoneLength: 8,
    phonePlaceholder: '98 123 456',
    phoneHintAr: '8 أرقام (مثال: 98123456)',
    phoneHintEn: '8 digits (e.g. 98123456)',
    timezones: [
      {
        value: 'Africa/Tunis',
        label: 'Central European Time (Tunis)',
        labelAr: 'توقيت تونس (تونس العاصمة)',
        city: 'Tunis',
        cityAr: 'تونس العاصمة',
        offset: 'UTC+1'
      }
    ]
  },
  {
    code: 'LY',
    name: 'Libya',
    nameAr: 'ليبيا',
    flag: '🇱🇾',
    dialCode: '+218',
    primaryTimezone: 'Africa/Tripoli',
    phoneLength: [9, 10],
    phonePlaceholder: '91 123 4567',
    phoneHintAr: '9 أرقام (مثال: 911234567)',
    phoneHintEn: '9 digits (e.g. 911234567)',
    timezones: [
      {
        value: 'Africa/Tripoli',
        label: 'Eastern European Time (Tripoli / Benghazi)',
        labelAr: 'توقيت ليبيا (طرابلس / بنغازي)',
        city: 'Tripoli',
        cityAr: 'طرابلس',
        offset: 'UTC+2'
      }
    ]
  },
  {
    code: 'SD',
    name: 'Sudan',
    nameAr: 'السودان',
    flag: '🇸🇩',
    dialCode: '+249',
    primaryTimezone: 'Africa/Khartoum',
    phoneLength: [9, 10],
    phonePlaceholder: '91 234 5678',
    phoneHintAr: '9 أرقام (مثال: 912345678)',
    phoneHintEn: '9 digits (e.g. 912345678)',
    timezones: [
      {
        value: 'Africa/Khartoum',
        label: 'Central Africa Time (Khartoum)',
        labelAr: 'توقيت السودان (الخرطوم)',
        city: 'Khartoum',
        cityAr: 'الخرطوم',
        offset: 'UTC+2'
      }
    ]
  },
  {
    code: 'YE',
    name: 'Yemen',
    nameAr: 'اليمن',
    flag: '🇾🇪',
    dialCode: '+967',
    primaryTimezone: 'Asia/Aden',
    phoneLength: [9, 10],
    phonePlaceholder: '77 123 4567',
    phoneHintAr: '9 أرقام (مثال: 771234567)',
    phoneHintEn: '9 digits (e.g. 771234567)',
    timezones: [
      {
        value: 'Asia/Aden',
        label: 'Arabia Standard Time (Sanaa / Aden)',
        labelAr: 'توقيت اليمن (صنعاء / عدن)',
        city: 'Aden / Sanaa',
        cityAr: 'عدن / صنعاء',
        offset: 'UTC+3'
      }
    ]
  },

  // ================= NORTH AMERICA =================
  {
    code: 'US',
    name: 'United States',
    nameAr: 'الولايات المتحدة الأمريكية',
    flag: '🇺🇸',
    dialCode: '+1',
    primaryTimezone: 'America/New_York',
    phoneLength: 10,
    phonePlaceholder: '202 555 0123',
    phoneHintAr: '10 أرقام (مثال: 2025550123)',
    phoneHintEn: '10 digits (e.g. 2025550123)',
    timezones: [
      {
        value: 'America/New_York',
        label: 'Eastern Time (New York / Florida / Boston)',
        labelAr: 'التوقيت الشرقي (نيويورك / فلوريدا / بوسطن)',
        city: 'New York / Miami / Atlanta',
        cityAr: 'نيويورك / ميامي / أتلانتا',
        offset: 'UTC-5 / UTC-4'
      },
      {
        value: 'America/Chicago',
        label: 'Central Time (Chicago / Texas / Houston)',
        labelAr: 'التوقيت المركزي (شيكاغو / تكساس / هيوستن)',
        city: 'Chicago / Dallas / Houston',
        cityAr: 'شيكاغو / دالاس / هيوستن',
        offset: 'UTC-6 / UTC-5'
      },
      {
        value: 'America/Denver',
        label: 'Mountain Time (Denver / Phoenix)',
        labelAr: 'توقيت الجبال (دنفر / فينيكس)',
        city: 'Denver / Salt Lake City',
        cityAr: 'دنفر / سولت ليك',
        offset: 'UTC-7 / UTC-6'
      },
      {
        value: 'America/Los_Angeles',
        label: 'Pacific Time (California / Seattle / LA)',
        labelAr: 'توقيت المحيط الهادئ (كاليفورنيا / سياتل / لوس أنجلوس)',
        city: 'Los Angeles / San Francisco / Seattle',
        cityAr: 'لوس أنجلوس / سان فرانسيسكو / سياتل',
        offset: 'UTC-8 / UTC-7'
      }
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    nameAr: 'كندا',
    flag: '🇨🇦',
    dialCode: '+1',
    primaryTimezone: 'America/Toronto',
    phoneLength: 10,
    phonePlaceholder: '416 555 0123',
    phoneHintAr: '10 أرقام (مثال: 4165550123)',
    phoneHintEn: '10 digits (e.g. 4165550123)',
    timezones: [
      {
        value: 'America/Toronto',
        label: 'Eastern Time (Toronto / Montreal / Ottawa)',
        labelAr: 'التوقيت الشرقي لكندا (تورونتو / مونتريال / أوتاوا)',
        city: 'Toronto / Montreal',
        cityAr: 'تورونتو / مونتريال',
        offset: 'UTC-5 / UTC-4'
      },
      {
        value: 'America/Vancouver',
        label: 'Pacific Time (Vancouver)',
        labelAr: 'توقيت المحيط الهادئ لكندا (فانكوفر)',
        city: 'Vancouver',
        cityAr: 'فانكوفر',
        offset: 'UTC-8 / UTC-7'
      }
    ]
  },

  // ================= EUROPE =================
  {
    code: 'GB',
    name: 'United Kingdom',
    nameAr: 'المملكة المتحدة (بريطانيا)',
    flag: '🇬🇧',
    dialCode: '+44',
    primaryTimezone: 'Europe/London',
    phoneLength: [10, 11],
    phonePlaceholder: '7123 456789',
    phoneHintAr: '10 أرقام تبدأ بـ 7 (مثال: 7123456789)',
    phoneHintEn: '10 digits starting with 7 (e.g. 7123456789)',
    timezones: [
      {
        value: 'Europe/London',
        label: 'UK & Ireland Time (London - GMT / BST)',
        labelAr: 'توقيت بريطانيا (لندن - غرينتش / الصيفي)',
        city: 'London / Manchester',
        cityAr: 'لندن / مانشستر',
        offset: 'UTC+0 / UTC+1'
      }
    ]
  },
  {
    code: 'DE',
    name: 'Germany',
    nameAr: 'ألمانيا',
    flag: '🇩🇪',
    dialCode: '+49',
    primaryTimezone: 'Europe/Berlin',
    phoneLength: [10, 11],
    phonePlaceholder: '151 23456789',
    phoneHintAr: '10 أو 11 رقماً (مثال: 15123456789)',
    phoneHintEn: '10 or 11 digits',
    timezones: [
      {
        value: 'Europe/Berlin',
        label: 'Central European Time (Berlin / Munich / Frankfurt)',
        labelAr: 'توقيت ألمانيا (برلين / ميونخ / فرانكفورت)',
        city: 'Berlin / Frankfurt',
        cityAr: 'برلين / فرانكفورت',
        offset: 'UTC+1 / UTC+2'
      }
    ]
  },
  {
    code: 'FR',
    name: 'France',
    nameAr: 'فرنسا',
    flag: '🇫🇷',
    dialCode: '+33',
    primaryTimezone: 'Europe/Paris',
    phoneLength: [9, 10],
    phonePlaceholder: '6 12 34 56 78',
    phoneHintAr: '9 أرقام تبدأ بـ 6 أو 7 (مثال: 612345678)',
    phoneHintEn: '9 digits starting with 6 or 7',
    timezones: [
      {
        value: 'Europe/Paris',
        label: 'Central European Time (Paris / Lyon)',
        labelAr: 'توقيت فرنسا (باريس / ليون)',
        city: 'Paris / Lyon',
        cityAr: 'باريس / ليون',
        offset: 'UTC+1 / UTC+2'
      }
    ]
  },
  {
    code: 'NL',
    name: 'Netherlands',
    nameAr: 'هولندا',
    flag: '🇳🇱',
    dialCode: '+31',
    primaryTimezone: 'Europe/Amsterdam',
    phoneLength: 9,
    phonePlaceholder: '6 12345678',
    phoneHintAr: '9 أرقام (مثال: 612345678)',
    phoneHintEn: '9 digits (e.g. 612345678)',
    timezones: [
      {
        value: 'Europe/Amsterdam',
        label: 'Central European Time (Amsterdam / Rotterdam)',
        labelAr: 'توقيت هولندا (أمستردام / روتردام)',
        city: 'Amsterdam',
        cityAr: 'أمستردام',
        offset: 'UTC+1 / UTC+2'
      }
    ]
  },
  {
    code: 'SE',
    name: 'Sweden',
    nameAr: 'السويد',
    flag: '🇸🇪',
    dialCode: '+46',
    primaryTimezone: 'Europe/Stockholm',
    phoneLength: 9,
    phonePlaceholder: '70 123 45 67',
    phoneHintAr: '9 أرقام (مثال: 701234567)',
    phoneHintEn: '9 digits (e.g. 701234567)',
    timezones: [
      {
        value: 'Europe/Stockholm',
        label: 'Central European Time (Stockholm / Gothenburg)',
        labelAr: 'توقيت السويد (ستوكهولم / غوتنبرغ)',
        city: 'Stockholm',
        cityAr: 'ستوكهولم',
        offset: 'UTC+1 / UTC+2'
      }
    ]
  },
  {
    code: 'NO',
    name: 'Norway',
    nameAr: 'النرويج',
    flag: '🇳🇴',
    dialCode: '+47',
    primaryTimezone: 'Europe/Oslo',
    phoneLength: 8,
    phonePlaceholder: '412 34 567',
    phoneHintAr: '8 أرقام (مثال: 41234567)',
    phoneHintEn: '8 digits',
    timezones: [
      {
        value: 'Europe/Oslo',
        label: 'Central European Time (Oslo / Bergen)',
        labelAr: 'توقيت النرويج (أوسلو)',
        city: 'Oslo',
        cityAr: 'أوسلو',
        offset: 'UTC+1 / UTC+2'
      }
    ]
  },
  {
    code: 'DK',
    name: 'Denmark',
    nameAr: 'الدانمارك',
    flag: '🇩🇰',
    dialCode: '+45',
    primaryTimezone: 'Europe/Copenhagen',
    phoneLength: 8,
    phonePlaceholder: '20 12 34 56',
    phoneHintAr: '8 أرقام (مثال: 20123456)',
    phoneHintEn: '8 digits',
    timezones: [
      {
        value: 'Europe/Copenhagen',
        label: 'Central European Time (Copenhagen)',
        labelAr: 'توقيت الدانمارك (كوبنهاغن)',
        city: 'Copenhagen',
        cityAr: 'كوبنهاغن',
        offset: 'UTC+1 / UTC+2'
      }
    ]
  },
  {
    code: 'FI',
    name: 'Finland',
    nameAr: 'فنلندا',
    flag: '🇫🇮',
    dialCode: '+358',
    primaryTimezone: 'Europe/Helsinki',
    phoneLength: [9, 10],
    phonePlaceholder: '40 123 4567',
    phoneHintAr: '9 أرقام (مثال: 401234567)',
    phoneHintEn: '9 digits',
    timezones: [
      {
        value: 'Europe/Helsinki',
        label: 'Eastern European Time (Helsinki)',
        labelAr: 'توقيت فنلندا (هلسنكي)',
        city: 'Helsinki',
        cityAr: 'هلسنكي',
        offset: 'UTC+2 / UTC+3'
      }
    ]
  },
  {
    code: 'IE',
    name: 'Ireland',
    nameAr: 'إيرلندا',
    flag: '🇮🇪',
    dialCode: '+353',
    primaryTimezone: 'Europe/Dublin',
    phoneLength: 9,
    phonePlaceholder: '83 123 4567',
    phoneHintAr: '9 أرقام (مثال: 831234567)',
    phoneHintEn: '9 digits',
    timezones: [
      {
        value: 'Europe/Dublin',
        label: 'Irish Standard Time (Dublin)',
        labelAr: 'توقيت إيرلندا (دبلن)',
        city: 'Dublin',
        cityAr: 'دبلن',
        offset: 'UTC+0 / UTC+1'
      }
    ]
  },
  {
    code: 'CH',
    name: 'Switzerland',
    nameAr: 'سويسرا',
    flag: '🇨🇭',
    dialCode: '+41',
    primaryTimezone: 'Europe/Zurich',
    phoneLength: 9,
    phonePlaceholder: '78 123 45 67',
    phoneHintAr: '9 أرقام (مثال: 781234567)',
    phoneHintEn: '9 digits',
    timezones: [
      {
        value: 'Europe/Zurich',
        label: 'Central European Time (Zurich / Geneva)',
        labelAr: 'توقيت سويسرا (زيورخ / جنيف)',
        city: 'Zurich / Geneva',
        cityAr: 'زيورخ / جنيف',
        offset: 'UTC+1 / UTC+2'
      }
    ]
  },
  {
    code: 'AT',
    name: 'Austria',
    nameAr: 'النمسا',
    flag: '🇦🇹',
    dialCode: '+43',
    primaryTimezone: 'Europe/Vienna',
    phoneLength: [10, 11],
    phonePlaceholder: '664 1234567',
    phoneHintAr: '10 أرقام (مثال: 6641234567)',
    phoneHintEn: '10 digits',
    timezones: [
      {
        value: 'Europe/Vienna',
        label: 'Central European Time (Vienna)',
        labelAr: 'توقيت النمسا (فيينا)',
        city: 'Vienna',
        cityAr: 'فيينا',
        offset: 'UTC+1 / UTC+2'
      }
    ]
  },
  {
    code: 'BE',
    name: 'Belgium',
    nameAr: 'بلجيكا',
    flag: '🇧🇪',
    dialCode: '+32',
    primaryTimezone: 'Europe/Brussels',
    phoneLength: 9,
    phonePlaceholder: '470 12 34 56',
    phoneHintAr: '9 أرقام (مثال: 470123456)',
    phoneHintEn: '9 digits',
    timezones: [
      {
        value: 'Europe/Brussels',
        label: 'Central European Time (Brussels / Antwerp)',
        labelAr: 'توقيت بلجيكا (بروكسل)',
        city: 'Brussels',
        cityAr: 'بروكسل',
        offset: 'UTC+1 / UTC+2'
      }
    ]
  },
  {
    code: 'IT',
    name: 'Italy',
    nameAr: 'إيطاليا',
    flag: '🇮🇹',
    dialCode: '+39',
    primaryTimezone: 'Europe/Rome',
    phoneLength: 10,
    phonePlaceholder: '320 123 4567',
    phoneHintAr: '10 أرقام (مثال: 3201234567)',
    phoneHintEn: '10 digits',
    timezones: [
      {
        value: 'Europe/Rome',
        label: 'Central European Time (Rome / Milan)',
        labelAr: 'توقيت إيطاليا (روما / ميلانو)',
        city: 'Rome / Milan',
        cityAr: 'روما / ميلانو',
        offset: 'UTC+1 / UTC+2'
      }
    ]
  },
  {
    code: 'ES',
    name: 'Spain',
    nameAr: 'إسبانيا',
    flag: '🇪🇸',
    dialCode: '+34',
    primaryTimezone: 'Europe/Madrid',
    phoneLength: 9,
    phonePlaceholder: '612 34 56 78',
    phoneHintAr: '9 أرقام (مثال: 612345678)',
    phoneHintEn: '9 digits',
    timezones: [
      {
        value: 'Europe/Madrid',
        label: 'Central European Time (Madrid / Barcelona)',
        labelAr: 'توقيت إسبانيا (مدريد / برشلونة)',
        city: 'Madrid / Barcelona',
        cityAr: 'مدريد / برشلونة',
        offset: 'UTC+1 / UTC+2'
      }
    ]
  },
  {
    code: 'PT',
    name: 'Portugal',
    nameAr: 'البرتغال',
    flag: '🇵🇹',
    dialCode: '+351',
    primaryTimezone: 'Europe/Lisbon',
    phoneLength: 9,
    phonePlaceholder: '912 345 678',
    phoneHintAr: '9 أرقام (مثال: 912345678)',
    phoneHintEn: '9 digits',
    timezones: [
      {
        value: 'Europe/Lisbon',
        label: 'Western European Time (Lisbon / Porto)',
        labelAr: 'توقيت البرتغال (لشبونة / بورتو)',
        city: 'Lisbon',
        cityAr: 'لشبونة',
        offset: 'UTC+0 / UTC+1'
      }
    ]
  },
  {
    code: 'GR',
    name: 'Greece',
    nameAr: 'اليونان',
    flag: '🇬🇷',
    dialCode: '+30',
    primaryTimezone: 'Europe/Athens',
    phoneLength: 10,
    phonePlaceholder: '691 234 5678',
    phoneHintAr: '10 أرقام (مثال: 6912345678)',
    phoneHintEn: '10 digits',
    timezones: [
      {
        value: 'Europe/Athens',
        label: 'Eastern European Time (Athens)',
        labelAr: 'توقيت اليونان (أثينا)',
        city: 'Athens',
        cityAr: 'أثينا',
        offset: 'UTC+2 / UTC+3'
      }
    ]
  },
  {
    code: 'PL',
    name: 'Poland',
    nameAr: 'بولندا',
    flag: '🇵🇱',
    dialCode: '+48',
    primaryTimezone: 'Europe/Warsaw',
    phoneLength: 9,
    phonePlaceholder: '512 345 678',
    phoneHintAr: '9 أرقام (مثال: 512345678)',
    phoneHintEn: '9 digits',
    timezones: [
      {
        value: 'Europe/Warsaw',
        label: 'Central European Time (Warsaw)',
        labelAr: 'توقيت بولندا (وارسو)',
        city: 'Warsaw',
        cityAr: 'وارسو',
        offset: 'UTC+1 / UTC+2'
      }
    ]
  },
  {
    code: 'TR',
    name: 'Turkey',
    nameAr: 'تركيا',
    flag: '🇹🇷',
    dialCode: '+90',
    primaryTimezone: 'Europe/Istanbul',
    phoneLength: 10,
    phonePlaceholder: '532 123 4567',
    phoneHintAr: '10 أرقام (مثال: 5321234567)',
    phoneHintEn: '10 digits',
    timezones: [
      {
        value: 'Europe/Istanbul',
        label: 'Turkey Time (Istanbul / Ankara)',
        labelAr: 'توقيت تركيا (إسطنبول / أنقرة)',
        city: 'Istanbul / Ankara',
        cityAr: 'إسطنبول / أنقرة',
        offset: 'UTC+3'
      }
    ]
  },

  // ================= AUSTRALIA & NEW ZEALAND =================
  {
    code: 'AU',
    name: 'Australia',
    nameAr: 'أستراليا',
    flag: '🇦🇺',
    dialCode: '+61',
    primaryTimezone: 'Australia/Sydney',
    phoneLength: [9, 10],
    phonePlaceholder: '412 345 678',
    phoneHintAr: '9 أرقام تبدأ بـ 4 (مثال: 412345678)',
    phoneHintEn: '9 digits starting with 4 (e.g. 412345678)',
    timezones: [
      {
        value: 'Australia/Sydney',
        label: 'Eastern Time (Sydney / Melbourne / Brisbane)',
        labelAr: 'التوقيت الشرقي لأستراليا (سيدني / ملبورن / بريزبان)',
        city: 'Sydney / Melbourne',
        cityAr: 'سيدني / ملبورن',
        offset: 'UTC+10 / UTC+11'
      },
      {
        value: 'Australia/Perth',
        label: 'Western Time (Perth)',
        labelAr: 'التوقيت الغربي لأستراليا (بيرث)',
        city: 'Perth',
        cityAr: 'بيرث',
        offset: 'UTC+8'
      }
    ]
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    nameAr: 'نيوزيلندا',
    flag: '🇳🇿',
    dialCode: '+64',
    primaryTimezone: 'Pacific/Auckland',
    phoneLength: [8, 9, 10],
    phonePlaceholder: '21 123 4567',
    phoneHintAr: '8 إلى 10 أرقام (مثال: 211234567)',
    phoneHintEn: '8 to 10 digits',
    timezones: [
      {
        value: 'Pacific/Auckland',
        label: 'New Zealand Time (Auckland / Wellington)',
        labelAr: 'توقيت نيوزيلندا (أوكلاند / ويلينغتون)',
        city: 'Auckland / Wellington',
        cityAr: 'أوكلاند / ويلينغتون',
        offset: 'UTC+12 / UTC+13'
      }
    ]
  },

  // ================= ASIA & GLOBAL =================
  {
    code: 'MY',
    name: 'Malaysia',
    nameAr: 'ماليزيا',
    flag: '🇲🇾',
    dialCode: '+60',
    primaryTimezone: 'Asia/Kuala_Lumpur',
    phoneLength: [9, 10],
    phonePlaceholder: '12 345 6789',
    phoneHintAr: '9 أو 10 أرقام (مثال: 123456789)',
    phoneHintEn: '9 or 10 digits',
    timezones: [
      {
        value: 'Asia/Kuala_Lumpur',
        label: 'Malaysia Time (Kuala Lumpur)',
        labelAr: 'توقيت ماليزيا (كوالالمبور)',
        city: 'Kuala Lumpur',
        cityAr: 'كوالالمبور',
        offset: 'UTC+8'
      }
    ]
  },
  {
    code: 'SG',
    name: 'Singapore',
    nameAr: 'سنغافورة',
    flag: '🇸🇬',
    dialCode: '+65',
    primaryTimezone: 'Asia/Singapore',
    phoneLength: 8,
    phonePlaceholder: '8123 4567',
    phoneHintAr: '8 أرقام (مثال: 81234567)',
    phoneHintEn: '8 digits',
    timezones: [
      {
        value: 'Asia/Singapore',
        label: 'Singapore Standard Time (Singapore)',
        labelAr: 'توقيت سنغافورة',
        city: 'Singapore',
        cityAr: 'سنغافورة',
        offset: 'UTC+8'
      }
    ]
  },
  {
    code: 'ZA',
    name: 'South Africa',
    nameAr: 'جنوب إفريقيا',
    flag: '🇿🇦',
    dialCode: '+27',
    primaryTimezone: 'Africa/Johannesburg',
    phoneLength: 9,
    phonePlaceholder: '71 123 4567',
    phoneHintAr: '9 أرقام (مثال: 711234567)',
    phoneHintEn: '9 digits',
    timezones: [
      {
        value: 'Africa/Johannesburg',
        label: 'South Africa Standard Time (Johannesburg / Cape Town)',
        labelAr: 'توقيت جنوب إفريقيا (جوهانسبرغ)',
        city: 'Johannesburg',
        cityAr: 'جوهانسبرغ',
        offset: 'UTC+2'
      }
    ]
  },
  {
    code: 'OTHER',
    name: 'Other Country / Global UTC',
    nameAr: 'دولة أخرى / توقيت عالمي',
    flag: '🌐',
    dialCode: '+',
    primaryTimezone: 'UTC',
    phoneLength: [7, 8, 9, 10, 11, 12, 13, 14, 15],
    phonePlaceholder: '1234567890',
    phoneHintAr: 'رقم الهاتف الدولي مع الكود',
    phoneHintEn: 'International phone number',
    timezones: [
      {
        value: 'UTC',
        label: 'Universal Coordinated Time (UTC)',
        labelAr: 'التوقيت العالمي الموحد (UTC)',
        city: 'UTC',
        cityAr: 'UTC',
        offset: 'UTC+0'
      }
    ]
  }
];

export const ALL_TIMEZONES: TimezoneItem[] = SERVED_COUNTRIES.flatMap((c) => c.timezones);

/**
 * Find country object by ISO 2-letter country code (case insensitive).
 */
export function findCountryByCode(code?: string | null): ServedCountry {
  if (!code) return SERVED_COUNTRIES[0];
  const clean = code.toUpperCase().trim();
  const found = SERVED_COUNTRIES.find((c) => c.code === clean);
  return found || SERVED_COUNTRIES[0];
}

export const getCountryByCode = findCountryByCode;

/**
 * Automatically detects the user's country from their system IANA timezone.
 */
export function findCountryByTimezone(tz: string): ServedCountry {
  if (!tz) return SERVED_COUNTRIES[0]; // Egypt default
  const cleanTz = tz.trim();
  const found = SERVED_COUNTRIES.find((country) =>
    country.timezones.some((item) => item.value.toLowerCase() === cleanTz.toLowerCase())
  );
  return found || SERVED_COUNTRIES.find((c) => c.code === 'OTHER') || SERVED_COUNTRIES[0];
}

/**
 * Strips formatting, extracts digits, removes domestic leading 0 and country dial code if duplicated.
 */
export function cleanPhoneDigits(raw: string, countryCode: string): string {
  if (!raw) return '';
  const country = findCountryByCode(countryCode);
  let digits = raw.replace(/\D/g, '');

  const dialDigits = country.dialCode.replace(/\D/g, '');
  if (dialDigits && digits.startsWith(dialDigits)) {
    digits = digits.slice(dialDigits.length);
  }

  // Remove leading domestic zero (e.g. 010 -> 10, 05 -> 5)
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits;
}

/**
 * Formats a phone number cleanly into standard international E.164 string (+CountryCode Digits).
 */
export function formatFullInternationalPhone(localOrFullNumber: string, countryCode: string): string {
  const country = findCountryByCode(countryCode);
  const clean = cleanPhoneDigits(localOrFullNumber, countryCode);
  if (!clean) return '';
  return `${country.dialCode}${clean}`;
}

/**
 * Validates a phone number against its country's expected digit constraints.
 */
export function validatePhoneNumber(
  localNumber: string,
  countryCode: string
): { isValid: boolean; messageAr: string; messageEn: string; cleanDigits: string; fullNumber: string } {
  const country = findCountryByCode(countryCode);
  const clean = cleanPhoneDigits(localNumber, countryCode);
  const expectedLengths = Array.isArray(country.phoneLength) ? country.phoneLength : [country.phoneLength];

  // If user entered with leading zero locally (e.g. 01012345678 = 11 digits, cleaned = 10 digits),
  // check either the cleaned digits length or raw digits length.
  const isValid = expectedLengths.includes(clean.length);

  let messageAr = '';
  let messageEn = '';

  if (!clean) {
    messageAr = 'يرجى إدخال رقم الهاتف (يُشترط توفر واتساب عليه).';
    messageEn = 'Please enter a phone number (must have active WhatsApp).';
  } else if (!isValid) {
    messageAr = `رقم غير مكتمل لدولة ${country.nameAr}. المتوقع ${country.phoneHintAr}.`;
    messageEn = `Incomplete number for ${country.name}. Expected ${country.phoneHintEn}.`;
  }

  return {
    isValid,
    messageAr,
    messageEn,
    cleanDigits: clean,
    fullNumber: clean ? `${country.dialCode}${clean}` : ''
  };
}

/**
 * Returns formatted label for a given timezone in current language.
 */
export function getTimezoneDisplayLabel(tz: string, isAr: boolean): string {
  const item = ALL_TIMEZONES.find((t) => t.value === tz);
  if (item) {
    return isAr ? `${item.labelAr} (${item.offset})` : `${item.label} (${item.offset})`;
  }
  try {
    const zoned = DateTime.now().setZone(tz);
    if (zoned.isValid) {
      const offset = `UTC${zoned.toFormat('ZZ')}`;
      return `${tz} (${offset})`;
    }
  } catch {}
  return tz || 'UTC';
}

/**
 * Local storage keys for persisting user-chosen working timezone.
 */
export const ACTIVE_TIMEZONE_STORAGE_KEY = 'watazawwado_active_timezone';

export function getActiveWorkingTimezone(fallback = 'Africa/Cairo'): string {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(ACTIVE_TIMEZONE_STORAGE_KEY);
    if (saved && DateTime.now().setZone(saved).isValid) {
      return saved;
    }
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && DateTime.now().setZone(detected).isValid) {
      return detected;
    }
  } catch {}
  return fallback;
}

export function setActiveWorkingTimezone(tz: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_TIMEZONE_STORAGE_KEY, tz);
    window.dispatchEvent(new CustomEvent('watazawwado_timezone_change', { detail: tz }));
  } catch {}
}
