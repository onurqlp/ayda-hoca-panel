import { describe, expect, it } from 'vitest'
import { mergeMonthRows, monthLookupKeys } from './monthLookup'

describe('Google Sheets auto-converted month fields', () => {
  it('searches text, two date representations and serial dates', () => {
    expect(monthLookupKeys('2026-10')).toEqual([
      '2026-10', '2026-09-30T21:00:00.000Z', '2026-10-01T00:00:00.000Z', 46296,
    ])
  })
  it('merges duplicate IDs and restores the original month label', () => {
    const result = mergeMonthRows([
      [{ id: 'a', work_month: '2026-10' }],
      [{ id: 'a', work_month: '2026-09-30T21:00:00Z' }, { id: 'b', work_month: 46296 }],
    ], '2026-10', 'work_month')
    expect(result).toEqual([{ id: 'a', work_month: '2026-10' }, { id: 'b', work_month: '2026-10' }])
  })
})
