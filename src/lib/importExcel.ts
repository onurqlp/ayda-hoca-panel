import { calculateAmount } from './calculations'

export interface ImportEntry {
  teacherName: string
  workMonth: string
  entryType: 'group' | 'private' | 'extra'
  description: string
  quantity: number
  unitRate: number
  totalAmount: number
  sourceAmount: number | null
  difference: number | null
  requiresReview: boolean
  sourceReference: string
  sheet: string
  row: number
}

export interface ExcelPreview {
  fingerprint: string
  teacherRows: Record<string, unknown>[]
  entries: ImportEntry[]
  warnings: string[]
}

const monthNumbers: Record<string, string> = {
  ocak: '01', subat: '02', şubat: '02', mart: '03', nisan: '04', mayis: '05', mayıs: '05',
  haziran: '06', temmuz: '07', agustos: '08', ağustos: '08', eylul: '09', eylül: '09',
  ekim: '10', kasim: '11', kasım: '11', aralik: '12', aralık: '12',
}

const normalizedKey = (value: string) => value.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim()
const cell = (row: Record<string, unknown>, candidates: string[]) => {
  const found = Object.keys(row).find((key) => candidates.includes(normalizedKey(key)))
  return found ? row[found] : undefined
}
const numberCell = (value: unknown): number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value.replace(/\./g, '').replace(',', '.')) || 0
  return 0
}

export function normalizeSheetRows(
  sheet: string,
  year: number,
  rows: Record<string, unknown>[],
  fingerprint: string,
): ImportEntry[] {
  const month = monthNumbers[normalizedKey(sheet)]
  if (!month) throw new Error(`Ay sekmesi tanınmadı: ${sheet}`)
  const workMonth = `${year}-${month}`
  const entries: ImportEntry[] = []

  rows.forEach((row, index) => {
    const teacherName = String(cell(row, ['hoca', 'öğretmen', 'ad soyad', 'isim']) ?? '').trim()
    if (!teacherName) return
    const sourceAmountRaw = cell(row, ['toplam', 'hakediş', 'tutar', 'ödenecek'])
    const sourceAmount = sourceAmountRaw == null || sourceAmountRaw === '' ? null : numberCell(sourceAmountRaw)
    const paymentFlag = cell(row, ['ödeme', 'ödendi', 'durum'])
    const requiresReview = paymentFlag === 1 || paymentFlag === '1' || paymentFlag == null || paymentFlag === ''
    const description = String(cell(row, ['açıklama', 'not', 'ek iş', 'iş']) ?? '').trim()

    const add = (entryType: ImportEntry['entryType'], quantityKeys: string[], rateKeys: string[]) => {
      const quantity = numberCell(cell(row, quantityKeys))
      const unitRate = numberCell(cell(row, rateKeys))
      if (!quantity && !unitRate) return
      const totalAmount = calculateAmount(quantity, unitRate)
      entries.push({
        teacherName,
        workMonth,
        entryType,
        description,
        quantity,
        unitRate,
        totalAmount,
        sourceAmount,
        difference: sourceAmount == null ? null : Math.round((sourceAmount - totalAmount) * 100) / 100,
        requiresReview,
        sourceReference: `${fingerprint}:${sheet}:${index + 2}:${entryType}`,
        sheet,
        row: index + 2,
      })
    }

    add('group', ['grup sayısı', 'grup sayisi', 'grup', 'grup ders'], ['grup ücreti', 'grup ucreti', 'grup birim ücret'])
    add('private', ['özel sayısı', 'özel sayisi', 'özel', 'özel ders'], ['özel ücreti', 'özel ucreti', 'özel birim ücret'])
    const extraAmount = numberCell(cell(row, ['ek ücret', 'ek ucret', 'prim', 'video', 'sınav', 'sinav', 'schreiben']))
    if (extraAmount) {
      entries.push({
        teacherName, workMonth, entryType: 'extra', description: description || 'Excel ek ödemesi',
        quantity: 1, unitRate: extraAmount, totalAmount: extraAmount, sourceAmount: extraAmount,
        difference: 0, requiresReview, sourceReference: `${fingerprint}:${sheet}:${index + 2}:extra`, sheet, row: index + 2,
      })
    }
  })
  return entries
}

export async function parseExcel(file: File, year: number): Promise<ExcelPreview> {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const hash = await crypto.subtle.digest('SHA-256', buffer)
  const fingerprint = Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  const workbook = XLSX.read(buffer, { type: 'array' })
  const teacherSheet = workbook.Sheets.Sayfa1
  const teacherRows = teacherSheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(teacherSheet, { defval: '' }) : []
  const entries: ImportEntry[] = []
  const warnings: string[] = []

  for (const sheetName of workbook.SheetNames.filter((name) => name !== 'Sayfa1')) {
    try {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' })
      entries.push(...normalizeSheetRows(sheetName, year, rows, fingerprint))
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : String(error))
    }
  }
  return { fingerprint, teacherRows, entries, warnings }
}
