// Quick settlement uses the remaining debt in cents to avoid floating-point errors.
export function outstandingAmount(entitlement: number, paid: number): number {
  return Math.max(0, Math.round(entitlement * 100) - Math.round(paid * 100)) / 100
}

export function quickPaymentDateError(date: string, paymentMonth: string, today: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Ödeme yapıldıysa gerçek tarihi seçin.'
  if (date > today) return 'Gelecekteki bir ödeme ödendi olarak işaretlenemez.'
  if (date.slice(0, 7) !== paymentMonth) return 'Ödeme tarihi seçilen ödeme ayına ait olmalı.'
  return null
}
