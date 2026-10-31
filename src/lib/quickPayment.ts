// Quick settlement uses the remaining debt in cents to avoid floating-point errors.
export function outstandingAmount(entitlement: number, paid: number): number {
  return Math.max(0, Math.round(entitlement * 100) - Math.round(paid * 100)) / 100
}

// Payment period and actual transaction date are independent.
// No forced month match or future/past-date restriction.
export function effectivePaymentDate(chosen: string, today: string): string {
  return chosen || today
}
