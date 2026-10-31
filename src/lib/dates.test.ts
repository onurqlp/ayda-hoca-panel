import { describe, expect, it } from 'vitest'
import { currentMonth, dateInIstanbul, normalizeSavedPaymentDate } from './dates'

describe('Istanbul month and payment dates', () => {
  it('uses local month at Istanbul midnight instead of UTC month', () => {
    expect(currentMonth(new Date('2026-10-31T21:30:00Z'))).toBe('2026-11')
    expect(currentMonth(new Date('2026-10-31T20:30:00Z'))).toBe('2026-10')
  })

  it('uses Istanbul date when a saved Google Sheet date is ISO formatted', () => {
    expect(dateInIstanbul(new Date('2026-10-31T21:00:00Z'))).toBe('2026-11-01')
    expect(normalizeSavedPaymentDate('2026-10-31T21:00:00.000Z')).toBe('2026-11-01')
    expect(normalizeSavedPaymentDate('2026-10-31')).toBe('2026-10-31')
  })
})
