export type Language = 'en' | 'ar';

export type BookingMode = 'trial' | 'regular';

export type LearnerAudience = 'adult' | 'child';

export type LessonDuration = 30 | 45 | 60;

export type ServiceGroupKey = 'quran' | 'islamic_studies' | 'arabic' | 'english';

export type ProficiencyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced';

export interface ServiceOption {
  id: string;
  name: string;
  arabicName: string;
  group: ServiceGroupKey;
  tagline: string;
  arabicTagline: string;
  description: string;
  arabicDescription: string;
  suggestedGoals: string[];
  arabicSuggestedGoals: string[];
  defaultDurations: LessonDuration[];
  hourlyRateUsd: number; // e.g. 7 or 10
}

export interface TimeSlot {
  id: string;
  time24: string; // e.g. "15:00"
  timeDisplay: string; // e.g. "03:00 PM"
  period: 'morning' | 'afternoon' | 'evening';
  available: boolean;
  cairoTimeEquiv: string; // Internal reference to Egypt time
}

export interface DayAvailability {
  dateString: string; // YYYY-MM-DD
  dayOfWeek: string; // Mon, Tue, etc.
  dayOfMonth: number;
  monthName: string;
  isAvailable: boolean;
  slots: TimeSlot[];
  reasonUnavailable?: string;
}

export interface TimezoneOption {
  value: string;
  label: string;
  city: string;
  offset: string;
}

export interface BookingFormData {
  mode: BookingMode;
  serviceId: string;
  goal: string;
  customGoalText: string;
  audience: LearnerAudience;
  
  // Adult learner details
  studentName: string;
  email: string;
  whatsapp: string;
  ageGroup: string;
  currentLevel: ProficiencyLevel;
  notes: string;

  // Child learner details (if audience === 'child')
  childName: string;
  childAge: string;
  parentName: string;
  parentEmail: string;
  parentWhatsapp: string;
  childLevel: ProficiencyLevel;
  parentNotes: string;

  // Schedule details
  duration: LessonDuration;
  date: string; // YYYY-MM-DD
  timeSlot: TimeSlot | null;
  timezone: string;
  studentId?: string;
  teacherId?: string;
  selectedPackageId?: string;
  packageEntitlementId?: string;
}

export interface BookingConfirmationData {
  bookingReference: string;
  managementToken?: string;
  createdAt: string;
  mode: BookingMode;
  serviceName: string;
  learnerName: string;
  parentName?: string;
  contactEmail: string;
  contactWhatsapp: string;
  date: string;
  timeDisplay: string;
  timezone: string;
  durationMinutes: number;
  cairoTimeDisplay: string;
  feeAmountUsd: number;
  isFreeTrial: boolean;
  packageEntitlementId?: string;
  integrationStatus?: 'synced' | 'pending' | 'failed';
  zoomDetails: {
    platform: 'Zoom';
    meetingLinkPlaceholder: string;
    instructions: string[];
  };
  preparationTips: string[];
}

export interface MockBookingRecord {
  reference: string;
  managementToken?: string;
  serviceName: string;
  learnerName: string;
  parentName?: string;
  email: string;
  whatsapp: string;
  scheduledIsoDatetime: string; // ISO string to check >3h vs <3h
  scheduledEndIsoDatetime?: string;
  cairoTimeDisplay?: string;
  durationMinutes: number;
  timezone: string;
  mode: BookingMode;
  status: 'confirmed' | 'cancelled' | 'rescheduled';
  feeAmountUsd?: number;
  zoomMeetingLink?: string | null;
  googleCalendarEventId?: string | null;
  integrationStatus?: 'pending' | 'synced' | 'failed' | 'cancelled';
}

export interface PackageCatalogEntry {
  id: string;
  package_type: 'weekly' | 'monthly' | string;
  name: string;
  lesson_count: number;
  price_amount: number;
  currency: string;
  is_active: boolean;
  eligibility_rules?: any;
}

export interface PackageEntitlementEntry {
  id: string;
  packageCatalogId: string;
  packageName: string;
  packageType: string;
  status: 'pending_payment' | 'active' | 'exhausted' | 'cancelled' | string;
  purchasedQuantity: number;
  remainingCredits: number;
  pricePaid?: number;
  currency?: string;
  paymentReference?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

