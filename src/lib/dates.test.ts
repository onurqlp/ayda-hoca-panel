import { describe, expect, it } from 'vitest'
import { currentMonth, dateInIstanbul, defaultPaymentMonth, isValidMonth, normalizeSavedPaymentDate, paymentMonthForWorkMonth, workMonthForPaymentMonth } from './dates'

describe('Istanbul month and payment dates', () => {
  it('does not accept cleared or malformed month values', () => {
    expect(isValidMonth('2026-10')).toBe(true)
    expect(isValidMonth('')).toBe(false)
    expect(isValidMonth('2026-13')).toBe(false)
    expect(isValidMonth('2026-1')).toBe(false)
    expect(() => workMonthForPaymentMonth('')).toThrow('Geçersiz ay')
  })

  it('uses local month at Istanbul midnight instead of UTC month', () => {
    expect(currentMonth(new Date('2026-10-31T21:30:00Z'))).toBe('2026-11')
    expect(currentMonth(new Date('2026-10-31T20:30:00Z'))).toBe('2026-10')
  })

  it('links October work to November payout, including year rollover', () => {
    expect(paymentMonthForWorkMonth('2026-10')).toBe('2026-11')
    expect(workMonthForPaymentMonth('2026-11')).toBe('2026-10')
    expect(paymentMonthForWorkMonth('2026-12')).toBe('2027-01')
    expect(workMonthForPaymentMonth('2027-01')).toBe('2026-12')
  })

  it('shows November pay period on Oct 31 and Nov 1', () => {
    expect(defaultPaymentMonth(new Date('2026-10-31T15:00:00Z'))).toBe('2026-11')
    expect(defaultPaymentMonth(new Date('2026-11-01T08:00:00Z'))).toBe('2026-11')
    expect(defaultPaymentMonth(new Date('2026-12-31T15:00:00Z'))).toBe('2027-01')
  })

  it('uses Istanbul date when a saved Google Sheet date is ISO formatted', () => {
    expect(dateInIstanbul(new Date('2026-10-31T21:00:00Z'))).toBe('2026-11-01')
    expect(normalizeSavedPaymentDate('2026-10-31T21:00:00.000Z')).toBe('2026-11-01')
    expect(normalizeSavedPaymentDate('2026-10-31')).toBe('2026-10-31')
  })
})
