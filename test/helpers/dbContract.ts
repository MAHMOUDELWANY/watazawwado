/**
 * The database functions the app relies on, as they exist in production (pg_proc, read 2026-11-11 for P3 after
 * P2-009 found two functions missing). `test/p3-db-contract.test.ts` checks that every `.rpc('name')` in the source is
 * listed here, that every listed function exists in the database, and that the browser roles can run only the ones
 * marked `browser`.
 *
 * Adding an RPC: add the migration, apply it, then add the function here with its argument names.
 * Values are harmless samples for a call that must be refused (random ids match no row).
 */
import { randomUUID } from 'node:crypto';

const id = () => randomUUID();
const now = () => new Date().toISOString();

export interface DbFunction { args: () => Record<string, unknown>; browser?: 'anon' | 'authenticated'; note?: string }

export const DB_FUNCTIONS: Record<string, DbFunction> = {
  admin_move_booking_teacher: { args: () => ({ p_booking_id: id(), p_new_teacher_id: id(), p_reason: 'x', p_moved_by: id() }) },
  apply_checkout_discount_atomic: { args: () => ({ p_target_type: 'booking', p_target_id: id(), p_account_user_id: id(), p_code_id: null, p_list_amount: 1, p_base_amount: 1, p_discount: 0, p_credit: 0, p_final: 1 }) },
  attach_referral: { args: () => ({ p_referred_user_id: id(), p_code: 'XXXX', p_referred_name: 'x', p_welcome: 0 }) },
  check_trial_eligibility: { args: () => ({ p_email: 'x@example.com', p_whatsapp: '' }), note: 'still called by src/lib/bookingRepository.ts; refused for the browser, so that path is dead code' },
  claim_integration_jobs: { args: () => ({ p_batch_size: 1, p_booking_id: id() }) },
  claim_notification_event: { args: () => ({ p_key: `p3-contract-${id()}`, p_type: 'x' }) },
  claim_reminder: { args: () => ({ p_reminder_id: id() }) },
  delete_family_account: { args: () => ({ p_user_id: id() }) },
  finalize_notification_event: { args: () => ({ p_key: `p3-contract-${id()}`, p_token: 'x', p_status: 'sent', p_message_id: null, p_error: null }) },
  finalize_reminder: { args: () => ({ p_reminder_id: id(), p_token: 'x', p_status: 'sent', p_error: null }) },
  get_booking_management: { args: () => ({ p_reference_code: 'MHM-000000', p_management_token: 'x' }), browser: 'anon', note: 'read only, needs the booking token' },
  grant_sponsorship_atomic: { args: () => ({ p_account_user_id: id(), p_learner_student_id: id(), p_package_catalog_id: id(), p_request_id: null, p_granted_by: 'x' }) },
  hash_management_token: { args: () => ({ p_token: 'x' }) },
  qualify_referral: { args: () => ({ p_referred_user_id: id(), p_booking_id: id(), p_reward: 0, p_max_per_year: 0 }) },
  record_app_error: { args: () => ({ p_source: 'api', p_message: 'x', p_path: null, p_stack: null, p_account_id: null }) },
  record_lesson_not_held: { args: () => ({ p_booking_id: id(), p_reason: 'technical' }) },
  refund_payment_atomic: { args: () => ({ p_payment_id: id(), p_reason: 'x' }) },
  release_expired_payment_holds: { args: () => ({}) },
  reverse_checkout_discount: { args: () => ({ p_target_type: 'booking', p_target_id: id() }) },
  settle_checkout_redemptions: { args: () => ({}) },
  sponsorship_fund_balance: { args: () => ({}) },
  student_cancel_paid_lesson_to_credit: { args: () => ({ p_booking_id: id(), p_purchaser_account_id: id(), p_reason: 'x' }) },
  teacher_record_lesson_outcome: { args: () => ({ p_booking_id: id(), p_teacher_id: id(), p_outcome: 'completed', p_notes: null, p_covered_material: null, p_no_show_credit_decision: null }) },
  update_teacher_availability: { args: () => ({ p_teacher_id: id(), p_schedule: [], p_timezone: 'Africa/Cairo' }) },
  verify_payment_atomic: { args: () => ({ p_payment_id: id() }) },
  // Not called by the app (the server moves and cancels lessons itself). Migration 20261111000000 took them away
  // from the browser roles (P3-004); they stay listed so that stays checked.
  reschedule_booking_by_management: { args: () => ({ p_reference_code: 'MHM-000000', p_management_token: 'x', p_new_start: now(), p_new_end: now(), p_cairo_time_display: 'x' }), note: 'P3-004' },
  cancel_booking_by_management: { args: () => ({ p_reference_code: 'MHM-000000', p_management_token: 'x', p_reason: 'x' }), note: 'P3-004' },
};

/** Functions waiting for a migration that takes them away from the browser roles. Empty since 2026-11-11 (P3-004). */
export const PENDING_LOCKDOWN: string[] = [];

/** Tables whose rows are public content; every other table must give the anon key nothing. */
export const PUBLIC_TABLES = ['services', 'package_catalog', 'testimonials', 'blog_posts'];

/**
 * Columns that hold the academy's or the teacher's own notes. The portal reads lessons and profiles through the API,
 * which leaves these out; the browser roles can still select them straight from the database (P3-012).
 */
export const PRIVATE_COLUMNS: [table: string, column: string][] = [
  ['students', 'notes'], ['students', 'lead_source'], ['bookings', 'sync_metadata'], ['bookings', 'notes'],
  ['learning_offers', 'teacher_notes'], ['learning_offers', 'recommended_price_usd'], ['student_intakes', 'pricing_recommendation'],
  ['student_intakes', 'assessment'], ['lesson_sessions', 'teacher_observations'],
];
