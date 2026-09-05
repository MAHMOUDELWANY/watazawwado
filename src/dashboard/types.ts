import { LeadStatus } from '../types/database';

export type { LeadStatus };

export interface DashboardLesson {
  id: string;
  reference_code?: string | null;
  learner_name: string | null;
  parent_name?: string | null;
  contact_email: string;
  contact_whatsapp?: string;
  service_id?: string | null;
  service_name?: string | null;
  scheduled_start: string; // ISO UTC
  scheduled_end: string;   // ISO UTC
  duration_minutes?: number | null;
  status: string | null;   // 'confirmed' | 'pending' | 'rescheduled' | 'cancelled' | 'completed' | null
  is_free_trial: boolean;
  zoom_meeting_link?: string | null;
  zoom_host_url?: string | null;
  zoom_join_url?: string | null;
  zoom_meeting_id?: string | null;
  google_calendar_event_id?: string | null;
  integration_status: 'synced' | 'pending' | 'failed' | 'manual_action_required' | 'active';
  student_timezone: string | null;
  cairo_time_display?: string;
  fee_amount_usd?: number | null;
  notes?: string;
}

export interface DashboardSummary {
  total_today: number;
  active_today: number;
  trials_today: number;
  completed_today: number;
  needs_attention_count: number;
  next_lesson: DashboardLesson | null;
}

export interface TrialAssessment {
  current_level?: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | string | null;
  strengths?: string | null;
  areas_needing_work?: string | null;
  notes?: string | null;
  recommended_service_id?: string | null;
  recommended_service_name?: string | null;
  recommended_duration_minutes?: number | null;
  recommended_frequency?: string | null;
  learning_plan_summary?: string | null;
  follow_up_status?: 'needs_follow_up' | 'awaiting_response' | 'student_deciding' | 'ready_to_continue' | 'not_now' | 'enrolled';
  follow_up_date?: string | null;
  assessed_at?: string | null;
}

export interface DashboardTrial {
  id: string;
  reference_code?: string | null;
  lead_id: string | null;
  student_id: string | null;
  learner_name: string | null;
  parent_name?: string | null;
  contact_email: string;
  contact_whatsapp?: string | null;
  service_id?: string | null;
  service_name?: string | null;
  scheduled_start: string; // ISO UTC
  scheduled_end: string;   // ISO UTC
  duration_minutes?: number | null;
  status: string | null;
  student_timezone: string | null;
  cairo_time_display?: string | null;
  goal?: string | null;
  notes?: string | null;
  zoom_meeting_link?: string | null;
  zoom_host_url?: string | null;
  zoom_join_url?: string | null;
  zoom_meeting_id?: string | null;
  google_calendar_event_id?: string | null;
  integration_status: 'synced' | 'pending' | 'failed' | 'manual_action_required' | 'active';
  assessment?: TrialAssessment | null;
  lead_status?: LeadStatus | null;
  created_at: string;
}

export interface DashboardLead {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  learner_type?: 'adult' | 'child' | null;
  service_interest_id: string | null;
  service_interest_name?: string | null;
  goal: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  parent_name?: string | null;
  trial_booking?: {
    id: string;
    reference_code?: string | null;
    scheduled_start: string;
    duration_minutes?: number | null;
    status: string | null;
    is_completed: boolean;
    has_assessment: boolean;
  } | null;
  next_action?: string;
  needs_followup?: boolean;
  followup_reason?: string | null;
  hours_since_created?: number;
  hours_since_update?: number;
}

export interface DashboardAnalytics {
  funnel: {
    total_leads: number;
    new_inquiries: number;
    contacted: number;
    trials_booked: number;
    trials_completed: number;
    potential_students: number;
    active_students: number;
    lost: number;
    rates: {
      lead_to_trial_rate: number | null;
      trial_to_student_rate: number | null;
      overall_conversion_rate: number | null;
    };
  };
  stage_counts: Record<string, number>;
  sources_distribution: Record<string, number>;
  services_distribution: Record<string, number>;
  urgent_followups: Array<{
    id: string;
    name: string;
    status: string;
    hours: number;
    reason: string;
  }>;
  total_students_enrolled: number;
  total_bookings_count: number;
}

export interface StudentNote {
  id: string;
  student_id: string;
  content: string;
  observations?: string | null;
  next_steps?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStudentListItem {
  id: string;
  lead_id?: string | null;
  name: string;
  email: string | null;
  whatsapp: string | null;
  learner_type: 'adult' | 'child' | null;
  parent_name: string | null;
  country: string | null;
  timezone: string | null;
  current_level: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | null;
  status: 'active' | 'paused' | 'inactive';
  primary_service_id: string | null;
  primary_service_name: string | null;
  total_completed_lessons: number;
  next_lesson: {
    id: string;
    scheduled_start: string;
    duration_minutes: number;
    service_id: string | null;
    service_name: string | null;
    status: string;
    zoom_join_url?: string | null;
  } | null;
  last_lesson: {
    id: string;
    scheduled_start: string;
    service_id: string | null;
    service_name: string | null;
  } | null;
  notes_count: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStudentDetail {
  student: {
    id: string;
    lead_id: string | null;
    name: string;
    email: string | null;
    whatsapp: string | null;
    learner_type: 'adult' | 'child' | null;
    country: string | null;
    timezone: string | null;
    current_level: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | null;
    status: 'active' | 'paused' | 'inactive';
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  guardian: {
    id?: string;
    student_id?: string;
    parent_name: string;
    parent_email?: string | null;
    parent_whatsapp?: string | null;
    relationship_type?: string | null;
    created_at?: string;
  } | null;
  goals: Array<{
    id: string;
    service_id: string | null;
    service_name?: string | null;
    goal_text: string;
    is_primary: boolean;
    status: string;
  }>;
  primary_service_id: string | null;
  primary_service_name: string | null;
  total_completed_lessons: number;
  next_lesson: {
    id: string;
    reference_code?: string | null;
    scheduled_start: string;
    duration_minutes: number;
    service_id: string | null;
    service_name: string | null;
    status: string;
    zoom_join_url?: string | null;
  } | null;
  last_lesson: {
    id: string;
    scheduled_start: string;
    service_id: string | null;
    service_name: string | null;
  } | null;
  bookings: Array<{
    id: string;
    reference_code?: string | null;
    booking_type: 'regular' | 'trial';
    service_id: string;
    service_name?: string | null;
    duration_minutes: number;
    scheduled_start: string;
    scheduled_end: string;
    status: string;
    zoom_join_url?: string | null;
    cancellation_reason?: string | null;
    notes?: string | null;
  }>;
  trial_context: {
    booking_id?: string;
    reference_code?: string | null;
    trial_date?: string | null;
    status?: string | null;
    assessed_level?: string | null;
    recommended_service_id?: string | null;
    recommended_service_name?: string | null;
    recommended_duration?: number | null;
    recommended_frequency?: string | null;
    learning_plan_summary?: string | null;
    private_notes?: string | null;
    assessed_at?: string | null;
  } | null;
  lead_context: {
    lead_id: string;
    origin_status: string;
    service_interest_id: string | null;
    service_interest_name?: string | null;
    goal: string | null;
    notes: string | null;
    created_at: string;
  } | null;
  notes: StudentNote[];
  services?: Array<{ id: string; title: string; arabic_title?: string }>;
}

export type PaymentRecordStatus = 'pending' | 'confirmed' | 'rejected' | 'refunded';
export type PaymentMethodType = 'international_bank_iban' | 'ach_routing' | 'payoneer' | 'paypal' | 'wise' | 'other';

export interface DashboardPayment {
  id: string;
  booking_id: string | null;
  student_id: string | null;
  amount: number;
  currency: string;
  payment_method: PaymentMethodType;
  status: PaymentRecordStatus;
  payment_reference: string | null;
  confirmed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type BookingPaymentStatus = 
  | 'free_trial' 
  | 'paid' 
  | 'partially_paid' 
  | 'pending_review' 
  | 'payment_rejected' 
  | 'unpaid';

export interface DashboardBookingListItem {
  id: string;
  reference_code: string;
  student_id: string | null;
  lead_id: string | null;
  contact_name: string;
  contact_email: string;
  contact_whatsapp: string | null;
  parent_name: string | null;
  service_id: string;
  service_name?: string | null;
  service_arabic_title?: string | null;
  booking_type: 'trial' | 'regular';
  duration_minutes: number;
  scheduled_start: string;
  scheduled_end: string;
  student_timezone: string;
  cairo_time_display: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rescheduled' | 'completed' | 'no_show';
  cancellation_reason: string | null;
  notes: string | null;
  fee_amount_usd: number | null;
  zoom_meeting_link: string | null;
  zoom_host_url?: string | null;
  zoom_join_url?: string | null;
  google_calendar_event_id?: string | null;
  integration_status: 'synced' | 'pending' | 'failed' | 'manual_action_required' | 'active';
  created_at: string;
  updated_at: string;
  // Payment Reconciliation
  payment_status: BookingPaymentStatus;
  expected_amount: number | null;
  confirmed_amount: number;
  currency: string;
  payments: DashboardPayment[];
}

export interface DashboardBookingDetail extends DashboardBookingListItem {
  student?: {
    id: string;
    name: string;
    email: string | null;
    whatsapp: string | null;
    timezone: string | null;
    current_level: string | null;
    status: string;
  } | null;
  lead?: {
    id: string;
    name: string;
    email: string;
    whatsapp: string | null;
    status: string;
  } | null;
  lesson_session?: {
    id: string;
    attendance: string;
    completion_status: string;
    covered_material?: string | null;
    next_action?: string | null;
  } | null;
}

export interface BookingsOperationalSummary {
  total_bookings: number;
  upcoming_count: number;
  unpaid_upcoming_count: number;
  pending_payments_count: number;
  recently_confirmed_count: number;
  completed_count: number;
}


