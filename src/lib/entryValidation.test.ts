import { describe, expect, it } from 'vitest'
import { validateEntryNumbers } from './entryValidation'

describe('Work entry validation', () => {
  it('allows normal positive lesson entries', () => {
    expect(validateEntryNumbers('1.5', '650', false)).toBeNull()
  })
  it('rejects empty and zero manual lessons before contacting the backend', () => {
    expect(validateEntryNumbers('0', '500', false)).toBeTruthy()
    expect(validateEntryNumbers('1', '0', false)).toBeTruthy()
    expect(validateEntryNumbers('', '500', false)).toBeTruthy()
  })
  it('allows editing imported zero-valued Excel rows for later review', () => {
    expect(validateEntryNumbers('0', '0', true)).toBeNull()
    expect(validateEntryNumbers('3', '0', true)).toBeNull()
    expect(validateEntryNumbers('-1', '650', true)).toBeTruthy()
    expect(validateEntryNumbers('1', '-1', true)).toBeTruthy()
  })
})
