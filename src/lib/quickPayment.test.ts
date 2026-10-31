import { describe, expect, it } from 'vitest'
import { outstandingAmount, effectivePaymentDate } from './quickPayment'

describe('Quick paid button', () => {
  it('pays only the remaining amount after a partial payment', () => {
    expect(outstandingAmount(1000, 0)).toBe(1000)
    expect(outstandingAmount(1000, 400)).toBe(600)
    expect(outstandingAmount(1000, 1000)).toBe(0)
    expect(outstandingAmount(1000, 1200)).toBe(0)
    expect(outstandingAmount(0.3, 0.1)).toBe(0.2)
  })

  it('allows payment date to differ from the selected payment period', () => {
    expect(effectivePaymentDate('2026-10-31', '2026-10-31')).toBe('2026-10-31')
    expect(effectivePaymentDate('2026-10-31', '2026-11-01')).toBe('2026-10-31')
    expect(effectivePaymentDate('2026-12-02', '2026-10-31')).toBe('2026-12-02')
  })

  it('uses today when no date was entered', () => {
    expect(effectivePaymentDate('', '2026-10-31')).toBe('2026-10-31')
  })
})
