import React from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

/** The fields of a /api/student/packages entitlement this component reads. */
export interface BalanceEntitlement {
  id: string;
  status: string;
  isCredit?: boolean;
  purchasedQuantity: number;
  remainingCredits: number;
  durationMinutes?: number | null;
  hourlyRate?: number | null;
  learnerName?: string | null;
  refundRequestedAt?: string | null;
}

/** Packages that still have lessons to book (refund-requested credits are on their way back, so not counted). */
export function activeBalances(entitlements: BalanceEntitlement[] | null | undefined): BalanceEntitlement[] {
  return (entitlements || []).filter(
    (e) => e.status === 'active' && Number(e.remainingCredits) > 0 && !e.refundRequestedAt
  );
}

/** "حصة واحدة / حصتين / 3 حصص / 11 حصة" */
export function arLessons(n: number): string {
  if (n === 1) return 'حصة واحدة';
  if (n === 2) return 'حصتين';
  if (n >= 3 && n <= 10) return `${n} حصص`;
  return `${n} حصة`;
}

export function balanceLine(e: BalanceEntitlement, isAr: boolean): string {
  const left = Number(e.remainingCredits);
  if (e.isCredit) {
    return isAr
      ? `${arLessons(left)} من رصيد حصة ملغاة`
      : `${left} ${left === 1 ? 'lesson' : 'lessons'} left from a cancelled-lesson credit`;
  }
  const size = Number(e.purchasedQuantity);
  return isAr
    ? `باقي ${arLessons(left)} في باقة الـ ${arLessons(size)}`
    : `${left} ${left === 1 ? 'lesson' : 'lessons'} left in your ${size}-lesson package`;
}

function detailLine(e: BalanceEntitlement, isAr: boolean): string {
  const parts: string[] = [];
  if (e.durationMinutes) parts.push(isAr ? `${e.durationMinutes} دقيقة` : `${e.durationMinutes} min`);
  if (e.hourlyRate) parts.push(isAr ? `فئة ${e.hourlyRate}$ للساعة` : `$${e.hourlyRate}/hour band`);
  if (e.learnerName) parts.push(isAr ? `لـ ${e.learnerName}` : `for ${e.learnerName}`);
  return parts.join(' · ');
}

/**
 * RN-01: remaining lessons per active package, the same on the home page, the booking page and the packages page.
 * Renders nothing when there is no balance, so each page keeps its own empty state.
 */
export function PackageBalance({
  entitlements,
  isAr,
  showLink = false,
  className = ''
}: {
  entitlements: BalanceEntitlement[] | null | undefined;
  isAr: boolean;
  showLink?: boolean;
  className?: string;
}) {
  const balances = activeBalances(entitlements);
  if (balances.length === 0) return null;

  return (
    <div className={`rounded-2xl glass-surface border border-border-subtle p-3 space-y-2 ${className}`} aria-label={isAr ? 'رصيد الباقات' : 'Package balance'}>
      <ul className="space-y-2">
        {balances.map((e) => {
          const detail = detailLine(e, isAr);
          return (
            <li key={e.id} className="flex items-start gap-2.5">
              <Package className="w-4 h-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{balanceLine(e, isAr)}</div>
                {detail && <div className="text-xs text-muted-foreground">{detail}</div>}
              </div>
            </li>
          );
        })}
      </ul>
      {showLink && (
        <Link to="/student/packages" className="inline-block text-xs font-semibold text-accent hover:underline">
          {isAr ? 'تفاصيل الباقات' : 'Package details'}
        </Link>
      )}
    </div>
  );
}
