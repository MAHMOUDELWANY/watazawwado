/**
-- ====================================================================
-- WATAZAWWADO — DATABASE TYPES
-- File: src/types/database.ts
-- Master TypeScript Type Definitions for Supabase Database & Data Layer
-- ====================================================================
*/

import type { LeadSource, HeardAbout } from '../lib/leadSource';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ServiceCategory = 'quran' | 'islamic_studies' | 'arabic' | 'english';
export type LearnerType = 'adult' | 'child';
export type LeadStatus =
  | 'visitor'
  | 'lead'
  | 'trial_booked'
  | 'trial_completed'
  | 'potential_student'
  | 'active_student'
  | 'returning_student'
  | 'contacted'
  | 'lost';
export type StudentStatus = 'active' | 'inactive' | 'paused';
export type StudentProficiency = 'beginner' | 'elementary' | 'intermediate' | 'advanced';
export type BookingType = 'trial' | 'regular';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'rescheduled' | 'completed' | 'no_show';
export type AttendanceStatus = 'attended' | 'student_no_show' | 'teacher_rescheduled' | 'cancelled';
export type SessionCompletionStatus = 'completed' | 'partial' | 'cancelled';
export type PaymentMethod = 'international_bank_iban' | 'ach_routing' | 'payoneer' | 'paypal' | 'wise' | 'other';
export type PaymentStatus = 'pending' | 'confirmed' | 'rejected' | 'refunded';
export type ReminderType = '24h_before' | '1h_before' | 'email_3h' | 'site_12h' | 'site_2h';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';
export type BlogPostStatus = 'draft' | 'published' | 'archived';
export type LearnerMilestoneKind =
  | 'surah_memorized'
  | 'juz_completed'
  | 'level_completed'
  | 'rule_mastered'
  | 'book_completed'
  | 'custom';

export interface Database {
  public: {
    Tables: {
      app_errors: {
        Row: {
          fingerprint: string;
          source: 'client' | 'api';
          message: string;
          path: string | null;
          stack: string | null;
          last_account_id: string | null;
          occurrences: number;
          first_seen: string;
          last_seen: string;
        };
        // Written only through the record_app_error RPC.
        Insert: never;
        Update: never;
      };
      crm_notes: {
        Row: { id: string; account_student_id: string; child_student_id: string | null; body: string; author_id: string | null; created_at: string };
        Insert: { id?: string; account_student_id: string; child_student_id?: string | null; body: string; author_id?: string | null; created_at?: string };
        Update: { child_student_id?: string | null; body?: string };
      };
      crm_tags: {
        Row: { account_student_id: string; tag: string; created_by: string | null; created_at: string };
        Insert: { account_student_id: string; tag: string; created_by?: string | null; created_at?: string };
        Update: never;
      };
      ops_heartbeats: {
        Row: { key: string; last_at: string; detail: Record<string, unknown> };
        Insert: { key: string; last_at?: string; detail?: Record<string, unknown> };
        Update: { key?: string; last_at?: string; detail?: Record<string, unknown> };
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          bio: string | null;
          email: string;
          whatsapp: string | null;
          timezone: string;
          language_preference: string;
          avatar_url: string | null;
          credentials: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          bio?: string | null;
          email: string;
          whatsapp?: string | null;
          timezone?: string;
          language_preference?: string;
          avatar_url?: string | null;
          credentials?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          bio?: string | null;
          email?: string;
          whatsapp?: string | null;
          timezone?: string;
          language_preference?: string;
          avatar_url?: string | null;
          credentials?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          category: ServiceCategory;
          title: string;
          arabic_title: string;
          short_description: string;
          arabic_description: string;
          display_order: number;
          is_active: boolean;
          hourly_rate_usd: number;
          supported_durations: number[];
          trial_allowed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          category: ServiceCategory;
          title: string;
          arabic_title: string;
          short_description: string;
          arabic_description: string;
          display_order?: number;
          is_active?: boolean;
          hourly_rate_usd?: number;
          supported_durations?: number[];
          trial_allowed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: ServiceCategory;
          title?: string;
          arabic_title?: string;
          short_description?: string;
          arabic_description?: string;
          display_order?: number;
          is_active?: boolean;
          hourly_rate_usd?: number;
          supported_durations?: number[];
          trial_allowed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          name: string;
          email: string;
          whatsapp: string | null;
          learner_type: LearnerType;
          service_interest_id: string | null;
          goal: string | null;
          source: string | null;
          status: LeadStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          whatsapp?: string | null;
          learner_type: LearnerType;
          service_interest_id?: string | null;
          goal?: string | null;
          source?: string | null;
          status?: LeadStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          whatsapp?: string | null;
          learner_type?: LearnerType;
          service_interest_id?: string | null;
          goal?: string | null;
          source?: string | null;
          status?: LeadStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          lead_id: string | null;
          assigned_teacher_id: string | null;
          name: string;
          email: string | null;
          whatsapp: string | null;
          learner_type: LearnerType;
          country: string | null;
          timezone: string;
          current_level: StudentProficiency;
          notes: string | null;
          booking_preference?: 'self' | 'child';
          age?: number | null;
          lead_source?: LeadSource | null;
          heard_about?: HeardAbout | null;
          status: StudentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          assigned_teacher_id?: string | null;
          name: string;
          email?: string | null;
          whatsapp?: string | null;
          learner_type?: LearnerType;
          country?: string | null;
          timezone?: string;
          current_level?: StudentProficiency;
          notes?: string | null;
          booking_preference?: 'self' | 'child';
          age?: number | null;
          lead_source?: LeadSource | null;
          heard_about?: HeardAbout | null;
          status?: StudentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string | null;
          assigned_teacher_id?: string | null;
          name?: string;
          email?: string | null;
          whatsapp?: string | null;
          learner_type?: LearnerType;
          country?: string | null;
          timezone?: string;
          current_level?: StudentProficiency;
          notes?: string | null;
          booking_preference?: 'self' | 'child';
          age?: number | null;
          lead_source?: LeadSource | null;
          heard_about?: HeardAbout | null;
          status?: StudentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      guardians: {
        Row: {
          id: string;
          student_id: string;
          parent_name: string;
          parent_email: string | null;
          parent_whatsapp: string | null;
          relationship_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          parent_name: string;
          parent_email?: string | null;
          parent_whatsapp?: string | null;
          relationship_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          parent_name?: string;
          parent_email?: string | null;
          parent_whatsapp?: string | null;
          relationship_type?: string;
          created_at?: string;
        };
      };
      student_goals: {
        Row: {
          id: string;
          student_id: string;
          service_id: string | null;
          goal_text: string;
          is_primary: boolean;
          status: 'in_progress' | 'achieved' | 'revised';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          service_id?: string | null;
          goal_text: string;
          is_primary?: boolean;
          status?: 'in_progress' | 'achieved' | 'revised';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          service_id?: string | null;
          goal_text?: string;
          is_primary?: boolean;
          status?: 'in_progress' | 'achieved' | 'revised';
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          reference_code: string;
          student_id: string | null;
          lead_id: string | null;
          service_id: string;
          booking_type: BookingType;
          duration_minutes: number;
          scheduled_start: string;
          scheduled_end: string;
          student_timezone: string;
          cairo_time_display: string | null;
          status: BookingStatus;
          contact_name: string;
          contact_email: string;
          contact_whatsapp: string | null;
          parent_name: string | null;
          cancellation_reason: string | null;
          not_held_reason: 'teacher_absent' | 'technical' | null;
          notes: string | null;
          fee_amount_usd: number;
          zoom_meeting_link: string | null;
          zoom_meeting_id: string | null;
          google_calendar_event_id: string | null;
          integration_status: 'pending' | 'synced' | 'failed' | 'cancelled';
          sync_metadata: Json;
          management_token?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_code: string;
          student_id?: string | null;
          lead_id?: string | null;
          service_id: string;
          booking_type: BookingType;
          duration_minutes: number;
          scheduled_start: string;
          scheduled_end: string;
          student_timezone?: string;
          cairo_time_display?: string | null;
          status?: BookingStatus;
          contact_name: string;
          contact_email: string;
          contact_whatsapp?: string | null;
          parent_name?: string | null;
          cancellation_reason?: string | null;
          not_held_reason?: 'teacher_absent' | 'technical' | null;
          notes?: string | null;
          fee_amount_usd?: number;
          zoom_meeting_link?: string | null;
          zoom_meeting_id?: string | null;
          google_calendar_event_id?: string | null;
          integration_status?: 'pending' | 'synced' | 'failed' | 'cancelled';
          sync_metadata?: Json;
          management_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_code?: string;
          student_id?: string | null;
          lead_id?: string | null;
          service_id?: string;
          booking_type?: BookingType;
          duration_minutes?: number;
          scheduled_start?: string;
          scheduled_end?: string;
          student_timezone?: string;
          cairo_time_display?: string | null;
          status?: BookingStatus;
          contact_name?: string;
          contact_email?: string;
          contact_whatsapp?: string | null;
          parent_name?: string | null;
          cancellation_reason?: string | null;
          not_held_reason?: 'teacher_absent' | 'technical' | null;
          notes?: string | null;
          fee_amount_usd?: number;
          zoom_meeting_link?: string | null;
          zoom_meeting_id?: string | null;
          google_calendar_event_id?: string | null;
          integration_status?: 'pending' | 'synced' | 'failed' | 'cancelled';
          sync_metadata?: Json;
          management_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lesson_sessions: {
        Row: {
          id: string;
          booking_id: string | null;
          student_id: string;
          lesson_date: string;
          attendance: AttendanceStatus;
          completion_status: SessionCompletionStatus;
          covered_material: string | null;
          next_action: string | null;
          teacher_observations: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id?: string | null;
          student_id: string;
          lesson_date: string;
          attendance?: AttendanceStatus;
          completion_status?: SessionCompletionStatus;
          covered_material?: string | null;
          next_action?: string | null;
          teacher_observations?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string | null;
          student_id?: string;
          lesson_date?: string;
          attendance?: AttendanceStatus;
          completion_status?: SessionCompletionStatus;
          covered_material?: string | null;
          next_action?: string | null;
          teacher_observations?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lesson_notes: {
        Row: {
          id: string;
          session_id: string | null;
          student_id: string;
          private_notes: string;
          observations: string | null;
          next_steps: string | null;
          family_summary: string | null;
          achievements: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          student_id: string;
          private_notes: string;
          observations?: string | null;
          next_steps?: string | null;
          family_summary?: string | null;
          achievements?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          student_id?: string;
          private_notes?: string;
          observations?: string | null;
          next_steps?: string | null;
          family_summary?: string | null;
          achievements?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      student_progress: {
        Row: {
          id: string;
          student_id: string;
          category: ServiceCategory;
          current_level: string;
          progress_percent: number;
          notes: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          category: ServiceCategory;
          current_level: string;
          progress_percent?: number;
          notes?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          category?: ServiceCategory;
          current_level?: string;
          progress_percent?: number;
          notes?: string | null;
          updated_at?: string;
        };
      };
      availability: {
        Row: {
          id: string;
          teacher_id: string | null;
          weekday: number; // 0-6
          start_time: string;
          end_time: string;
          is_active: boolean;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id?: string | null;
          weekday: number;
          start_time: string;
          end_time: string;
          is_active?: boolean;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string | null;
          weekday?: number;
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          booking_id: string | null;
          student_id: string | null;
          amount: number;
          currency: string;
          payment_method: PaymentMethod;
          status: PaymentStatus;
          payment_reference: string | null;
          confirmed_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id?: string | null;
          student_id?: string | null;
          amount: number;
          currency?: string;
          payment_method: PaymentMethod;
          status?: PaymentStatus;
          payment_reference?: string | null;
          confirmed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string | null;
          student_id?: string | null;
          amount?: number;
          currency?: string;
          payment_method?: PaymentMethod;
          status?: PaymentStatus;
          payment_reference?: string | null;
          confirmed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          booking_id: string;
          reminder_type: ReminderType;
          scheduled_for: string;
          status: ReminderStatus;
          sent_at: string | null;
          error_info: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          reminder_type: ReminderType;
          scheduled_for: string;
          status?: ReminderStatus;
          sent_at?: string | null;
          error_info?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          reminder_type?: ReminderType;
          scheduled_for?: string;
          status?: ReminderStatus;
          sent_at?: string | null;
          error_info?: string | null;
          created_at?: string;
        };
      };
      calendar_connections: {
        Row: {
          id: string;
          teacher_id: string | null;
          provider: string;
          account_email: string;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id?: string | null;
          provider?: string;
          account_email: string;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string | null;
          provider?: string;
          account_email?: string;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      testimonials: {
        Row: {
          id: string;
          student_name: string;
          display_name: string;
          role_or_relationship: string | null;
          content: string;
          arabic_content: string;
          rating: number;
          source: string | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_name: string;
          display_name: string;
          role_or_relationship?: string | null;
          content: string;
          arabic_content: string;
          rating?: number;
          source?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_name?: string;
          display_name?: string;
          role_or_relationship?: string | null;
          content?: string;
          arabic_content?: string;
          rating?: number;
          source?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          arabic_title: string;
          slug: string;
          excerpt: string;
          arabic_excerpt: string;
          content: string;
          arabic_content: string;
          cover_image_url: string | null;
          status: BlogPostStatus;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          arabic_title: string;
          slug: string;
          excerpt: string;
          arabic_excerpt: string;
          content: string;
          arabic_content: string;
          cover_image_url?: string | null;
          status?: BlogPostStatus;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          arabic_title?: string;
          slug?: string;
          excerpt?: string;
          arabic_excerpt?: string;
          content?: string;
          arabic_content?: string;
          cover_image_url?: string | null;
          status?: BlogPostStatus;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_knowledge: {
        Row: {
          id: string;
          category: string;
          title: string;
          content: string;
          is_verified: boolean;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          title: string;
          content: string;
          is_verified?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          title?: string;
          content?: string;
          is_verified?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          event_name: string;
          page_path: string | null;
          source: string | null;
          service_id: string | null;
          booking_type: string | null;
          session_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_name: string;
          page_path?: string | null;
          source?: string | null;
          service_id?: string | null;
          booking_type?: string | null;
          session_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_name?: string;
          page_path?: string | null;
          source?: string | null;
          service_id?: string | null;
          booking_type?: string | null;
          session_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      settings: {
        Row: {
          key: string;
          value: Json;
          category: string;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          category: string;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          category?: string;
          description?: string | null;
          updated_at?: string;
        };
      };
      curriculum_lesson_reports: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string | null;
          subject: string;
          lesson_number: number;
          from_page: number;
          to_page: number;
          strengths: string[];
          to_reinforce: string[];
          note: string | null;
          game_result: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          teacher_id?: string | null;
          subject: string;
          lesson_number: number;
          from_page: number;
          to_page: number;
          strengths?: string[];
          to_reinforce?: string[];
          note?: string | null;
          game_result?: Json | null;
          created_at?: string;
        };
        Update: never;
      };
      learner_milestones: {
        Row: {
          id: string;
          student_id: string;
          subject: string;
          kind: LearnerMilestoneKind;
          title_ar: string;
          title_en: string;
          reached_at: string;
          created_by: string | null;
          lesson_session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject: string;
          kind: LearnerMilestoneKind;
          title_ar: string;
          title_en: string;
          reached_at?: string;
          created_by?: string | null;
          lesson_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          subject?: string;
          kind?: LearnerMilestoneKind;
          title_ar?: string;
          title_en?: string;
          reached_at?: string;
          created_by?: string | null;
          lesson_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      check_trial_eligibility: {
        Args: {
          p_email: string;
          p_whatsapp?: string;
        };
        Returns: boolean;
      };
    };
  };
}

// Discount codes, account balance and referrals (migration 20261022000000, RULES.md §4).
// Server-only tables (service_role); the browser sees them only through server/routes/growth.ts.
export interface DiscountCodeRow {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  value: number;
  applies_to: 'all' | 'lessons' | 'packages';
  first_purchase_only: boolean;
  min_amount_usd: number;
  max_redemptions: number | null;
  max_per_account: number;
  starts_at: string | null;
  ends_at: string | null;
  is_gift: boolean;
  is_active: boolean;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscountRedemptionRow {
  id: string;
  code_id: string | null;
  account_user_id: string;
  target_type: 'booking' | 'package';
  target_id: string;
  list_amount: number;
  base_amount: number;
  discount_amount: number;
  credit_used: number;
  final_amount: number;
  status: 'reserved' | 'redeemed' | 'released' | 'reversed';
  created_at: string;
  updated_at: string;
}

export interface AccountCreditLedgerRow {
  id: string;
  account_user_id: string;
  amount_usd: number;
  reason: 'referral_welcome' | 'referral_reward' | 'checkout_use' | 'checkout_release' | 'refund_return' | 'admin_adjust';
  redemption_id: string | null;
  referral_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ReferralCodeRow {
  owner_user_id: string;
  code: string;
  created_at: string;
}

export interface ReferralRow {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  referred_name: string | null;
  status: 'signed_up' | 'rewarded' | 'not_rewarded' | 'void';
  welcome_credit_usd: number;
  reward_credit_usd: number;
  qualifying_booking_id: string | null;
  created_at: string;
  qualified_at: string | null;
}
