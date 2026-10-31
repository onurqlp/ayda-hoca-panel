import { describe, expect, it } from 'vitest'
import { normalizeSheetRows } from './importExcel'

describe('normalizeSheetRows', () => {
  it('ondalıklı miktarı, kaynak satırını ve belirsiz ödeme durumunu korur', () => {
    const result = normalizeSheetRows(
      'Mayıs',
      2025,
      [{ Hoca: 'Ayşe Yılmaz', 'Grup sayısı': 1.5, 'Grup Ücreti': 650, Ödeme: 1 }],
      'abc123',
    )
    expect(result[0]).toMatchObject({
      teacherName: 'Ayşe Yılmaz',
      workMonth: '2025-05',
      entryType: 'group',
      quantity: 1.5,
      unitRate: 650,
      totalAmount: 975,
      requiresReview: true,
      sourceReference: 'abc123:Mayıs:2:group',
    })
  })

  it('tanınmayan ay sekmesini otomatik tarihlendirmez', () => {
    expect(() => normalizeSheetRows('Sayfa2', 2025, [], 'x')).toThrow('Ay sekmesi tanınmadı')
  })
})
