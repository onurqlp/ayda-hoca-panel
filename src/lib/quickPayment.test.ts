import { describe, expect, it } from 'vitest'
import { outstandingAmount, quickPaymentDateError } from './quickPayment'

describe('Quick paid button', () => {
  it('pays only the remaining amount after a partial payment', () => {
    expect(outstandingAmount(1000, 0)).toBe(1000)
    expect(outstandingAmount(1000, 400)).toBe(600)
    expect(outstandingAmount(1000, 1000)).toBe(0)
    expect(outstandingAmount(1000, 1200)).toBe(0)
    expect(outstandingAmount(0.3, 0.1)).toBe(0.2)
  })
  it('requires actual payment date in the selected payment month', () => {
    expect(quickPaymentDateError('2026-11-03', '2026-11', '2026-11-03')).toBeNull()
    expect(quickPaymentDateError('', '2026-11', '2026-10-31')).toBeTruthy()
    expect(quickPaymentDateError('2026-11-01', '2026-11', '2026-10-31')).toBeTruthy()
    expect(quickPaymentDateError('2026-10-31', '2026-11', '2026-11-01')).toBeTruthy()
  })
})
