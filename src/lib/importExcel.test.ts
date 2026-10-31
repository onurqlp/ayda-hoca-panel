import { describe, expect, it } from 'vitest'
import { importSourceReferences, normalizeSheetRows } from './importExcel'

describe('normalizeSheetRows', () => {
  it('kaynağın gerçek sütunlarını, ondalıklı ders birimini ve belirsiz ödeme durumunu korur', () => {
    const result = normalizeSheetRows(
      'MAYIS', 2025,
      [
        ['ÖDEME DURUM', 'Öğretmen', 'Grup Ücret', 'Özel Ücret', 'Grup sayısı', 'Özel Sayısı', 'Toplam Ödeme'],
        [1, 'Ayşe Yılmaz', 650, 700, 1.5, null, 975],
      ],
      'abc123',
    )
    expect(result[0]).toMatchObject({
      teacherName: 'Ayşe Yılmaz', workMonth: '2025-05', entryType: 'group',
      quantity: 1.5, unitRate: 650, totalAmount: 975, requiresReview: true,
      sourceReference: 'abc123:MAYIS:2:group',
    })
  })
  it('2026 Ekim kaynak dosyasının daha önce aktarılan satırlarını tanır', () => {
    expect(importSourceReferences({
      sourceReference: 'abc123:Ekim:16:group', sheet: 'Ekim', row: 16, workMonth: '2026-10',
    })).toEqual(['abc123:Ekim:16:group', 'HOCA.xlsx:Ekim:16:group'])
    expect(importSourceReferences({
      sourceReference: 'abc123:Ekim:16:group', sheet: 'Ekim', row: 16, workMonth: '2025-10',
    })).toEqual(['abc123:Ekim:16:group'])
  })
  it('tanınmayan ay sekmesini otomatik tarihlendirmez', () => {
    expect(() => normalizeSheetRows('Sayfa2', 2025, [], 'x')).toThrow('Ay sekmesi tanınmadı')
  })
})
