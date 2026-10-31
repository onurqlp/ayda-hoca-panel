export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'review'

const toCents = (value: number) => Math.round((value + Number.EPSILON) * 100)

export function calculateAmount(quantity: number, unitRate: number): number {
  const quantityUnits = Math.round((quantity + Number.EPSILON) * 1000)
  const rateCents = toCents(unitRate)
  return Math.round((quantityUnits * rateCents) / 1000) / 100
}

export function derivePaymentStatus(
  entitlement: number,
  paid: number,
  requiresReview = false,
): PaymentStatus {
  const due = toCents(entitlement)
  const settled = toCents(paid)
  // The amount is paid when fully settled, even if imported lessons still need review.
  if (settled > 0 && settled >= due) return 'paid'
  if (requiresReview) return 'review'
  if (settled <= 0) return 'unpaid'
  if (settled < due) return 'partial'
  return 'paid'
}

export function formatTRY(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(value)
}

export function monthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(
    new Date(year, monthNumber - 1, 1),
  )
}
