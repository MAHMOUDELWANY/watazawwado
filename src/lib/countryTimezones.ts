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
  timezones: TimezoneItem[];
}

export const SERVED_COUNTRIES: ServedCountry[] = [
  {
    code: 'EG',
    name: 'Egypt',
    nameAr: 'مصر',
    flag: '🇪🇬',
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
    code: 'GB',
    name: 'United Kingdom',
    nameAr: 'المملكة المتحدة',
    flag: '🇬🇧',
    timezones: [
      {
        value: 'Europe/London',
        label: 'UK & Ireland Time (London - GMT / BST)',
        labelAr: 'توقيت بريطانيا وإيرلندا (لندن - غرينتش / الصيفي)',
        city: 'London / Manchester',
        cityAr: 'لندن / مانشستر',
        offset: 'UTC+0 / UTC+1'
      }
    ]
  },
  {
    code: 'US',
    name: 'United States',
    nameAr: 'الولايات المتحدة الأمريكية',
    flag: '🇺🇸',
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
        value: 'America/Winnipeg',
        label: 'Central Time (Winnipeg)',
        labelAr: 'التوقيت المركزي لكندا (وينيبغ)',
        city: 'Winnipeg',
        cityAr: 'وينيبغ',
        offset: 'UTC-6 / UTC-5'
      },
      {
        value: 'America/Edmonton',
        label: 'Mountain Time (Edmonton / Calgary)',
        labelAr: 'توقيت الجبال لكندا (إدمونتون / كالجاري)',
        city: 'Edmonton / Calgary',
        cityAr: 'إدمونتون / كالجاري',
        offset: 'UTC-7 / UTC-6'
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
  {
    code: 'DE',
    name: 'Germany & Central Europe',
    nameAr: 'ألمانيا وأوروبا الوسطى',
    flag: '🇩🇪',
    timezones: [
      {
        value: 'Europe/Berlin',
        label: 'Central European Time (Berlin / Vienna / Zurich)',
        labelAr: 'توقيت وسط أوروبا (برلين / فيينا / زيورخ)',
        city: 'Berlin / Frankfurt / Munich',
        cityAr: 'برلين / فرانكفورت / ميونخ',
        offset: 'UTC+1 / UTC+2'
      }
    ]
  },
  {
    code: 'FR',
    name: 'France',
    nameAr: 'فرنسا',
    flag: '🇫🇷',
    timezones: [
      {
        value: 'Europe/Paris',
        label: 'Central European Time (Paris)',
        labelAr: 'توقيت فرنسا (باريس)',
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
    timezones: [
      {
        value: 'Europe/Amsterdam',
        label: 'Central European Time (Amsterdam)',
        labelAr: 'توقيت هولندا (أمستردام)',
        city: 'Amsterdam / Rotterdam',
        cityAr: 'أمستردام / روتردام',
        offset: 'UTC+1 / UTC+2'
      }
    ]
  },
  {
    code: 'SE',
    name: 'Sweden & Scandinavia',
    nameAr: 'السويد والدول الإسكندنافية',
    flag: '🇸🇪',
    timezones: [
      {
        value: 'Europe/Stockholm',
        label: 'Central European Time (Stockholm / Oslo / Copenhagen)',
        labelAr: 'توقيت السويد والدول الإسكندنافية (ستوكهولم / أوسلو / كوبنهاغن)',
        city: 'Stockholm / Oslo',
        cityAr: 'ستوكهولم / أوسلو',
        offset: 'UTC+1 / UTC+2'
      }
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    nameAr: 'أستراليا',
    flag: '🇦🇺',
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
    code: 'OTHER',
    name: 'Other Country / Global UTC',
    nameAr: 'دولة أخرى / توقيت عالمي',
    flag: '🌐',
    timezones: [
      {
        value: 'UTC',
        label: 'Universal Coordinated Time (UTC)',
        labelAr: 'التوقيت العالمي الموحد (UTC)',
        city: 'UTC',
        cityAr: 'UTC',
        offset: 'UTC+0'
      },
      {
        value: 'Asia/Istanbul',
        label: 'Turkey Time (Istanbul)',
        labelAr: 'توقيت تركيا (إسطنبول)',
        city: 'Istanbul',
        cityAr: 'إسطنبول',
        offset: 'UTC+3'
      },
      {
        value: 'Asia/Tokyo',
        label: 'Japan Standard Time (Tokyo)',
        labelAr: 'توقيت اليابان (طوكيو)',
        city: 'Tokyo',
        cityAr: 'طوكيو',
        offset: 'UTC+9'
      },
      {
        value: 'Asia/Singapore',
        label: 'Singapore / Malaysia (Singapore)',
        labelAr: 'توقيت سنغافورة وماليزيا (سنغافورة)',
        city: 'Singapore / Kuala Lumpur',
        cityAr: 'سنغافورة / كوالالمبور',
        offset: 'UTC+8'
      }
    ]
  }
];

export const ALL_TIMEZONES: TimezoneItem[] = SERVED_COUNTRIES.flatMap((c) => c.timezones);

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
