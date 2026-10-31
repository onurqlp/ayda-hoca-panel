import { describe, expect, it } from 'vitest'
import { isLikelyDuplicateName, validateTurkishIban } from './validation'

describe('validateTurkishIban', () => {
  it('boş değere izin verir, geçerli biçimi normalize eder', () => {
    expect(validateTurkishIban('')).toEqual({ valid: true, normalized: '' })
    expect(validateTurkishIban('TR33 0006 1005 1978 6457 8413 26').valid).toBe(true)
  })

  it('yanlış ülke veya uzunluğu reddeder', () => {
    expect(validateTurkishIban('DE89370400440532013000').valid).toBe(false)
    expect(validateTurkishIban('TR123').valid).toBe(false)
  })
})

describe('isLikelyDuplicateName', () => {
  it('Türkçe karakter ve boşluk farklarını benzer kabul eder', () => {
    expect(isLikelyDuplicateName('Şule  Öztürk', 'Sule Ozturk')).toBe(true)
    expect(isLikelyDuplicateName('Ayşe Yılmaz', 'Mehmet Demir')).toBe(false)
  })
})
