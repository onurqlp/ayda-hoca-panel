import { describe, expect, it } from 'vitest'
import { calculateAmount, derivePaymentStatus } from './calculations'

describe('calculateAmount', () => {
  it('ondalıklı ders birimini kuruş hassasiyetinde hesaplar', () => {
    expect(calculateAmount(1.5, 650)).toBe(975)
    expect(calculateAmount(0.1, 0.2)).toBe(0.02)
  })
})

describe('derivePaymentStatus', () => {
  it('ödenmedi, kısmi ve ödendi durumlarını türetir', () => {
    expect(derivePaymentStatus(1000, 0)).toBe('unpaid')
    expect(derivePaymentStatus(1000, 400)).toBe('partial')
    expect(derivePaymentStatus(1000, 1000)).toBe('paid')
  })

  it('belirsiz içe aktarma durumunu korur', () => {
    expect(derivePaymentStatus(1000, 0, true)).toBe('review')
  })
})
