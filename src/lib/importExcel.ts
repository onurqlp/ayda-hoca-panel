import { calculateAmount } from './calculations'
import * as XLSX from 'xlsx'

export interface TeacherImportRow {
  name: string
  phone: string
  iban: string
  accountHolder: string
  groupRate: number | null
  privateRate: number | null
  notes: string
  row: number
}

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
  teacherRows: TeacherImportRow[]
  entries: ImportEntry[]
  warnings: string[]
}

const monthNumbers: Record<string, string> = {
  ocak: '01', şubat: '02', subat: '02', mart: '03', nisan: '04', mayıs: '05', mayis: '05',
  haziran: '06', temmuz: '07', ağustos: '08', agustos: '08', eylül: '09', eylul: '09',
  ekim: '10', kasım: '11', kasim: '11', aralık: '12', aralik: '12',
}

const text = (value: unknown): string => value == null ? '' : String(value).trim()
const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100
const valueAt = (row: unknown[], index: number): unknown => row[index]
const num = (value: unknown): number | null => {
  if (value === null || value === undefined || text(value) === '' || text(value) === '-') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const raw = text(value).replace(/\s/g, '').replace(/[₺€]/g, '')
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw
  const parsed = Number(normalized)
  return normalized && Number.isFinite(parsed) ? parsed : null
}

function readRows(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null, blankrows: true })
}

function extractTeachers(sheet: XLSX.WorkSheet | undefined): TeacherImportRow[] {
  if (!sheet) return []
  return readRows(sheet).slice(2).flatMap((row, index) => {
    const name = text(valueAt(row, 1)).replace(/\s+/g, ' ')
    if (!name) return []
    const rawBank = text(valueAt(row, 4))
    const ibanMatches = [...rawBank.matchAll(/TR(?:\s*\d){24}/gi)]
    const iban = ibanMatches[0]?.[0].replace(/\s/g, '').toUpperCase() || ''
    const remainder = rawBank.replace(/TR(?:\s*\d){24}/gi, '')
      .split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    const accountHolder = iban ? remainder.shift() || '' : ''
    const notes = [
      text(valueAt(row, 2)), text(valueAt(row, 7)),
      ...(ibanMatches.length > 1 ? ['İkinci IBAN (doğrula): ' + ibanMatches.slice(1).map((m) => m[0]).join(' / ')] : []),
      ...remainder,
      ...(!iban && rawBank ? [rawBank] : []),
    ].filter(Boolean)
    return [{
      name, phone: text(valueAt(row, 3)), iban, accountHolder,
      groupRate: num(valueAt(row, 5)), privateRate: num(valueAt(row, 6)),
      notes: [...new Set(notes)].join(' | '), row: index + 3,
    }]
  })
}

export function normalizeSheetRows(
  sheet: string,
  year: number,
  rows: unknown[][],
  fingerprint: string,
  warnings: string[] = [],
): ImportEntry[] {
  const key = sheet.toLocaleLowerCase('tr-TR').trim()
  const month = monthNumbers[key]
  if (!month) throw new Error('Ay sekmesi tanınmadı: ' + sheet)
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error('Aktarım yılı seçilmelidir.')
  const workMonth = year + '-' + month
  const entries: ImportEntry[] = []
  const isNovember = month === '11'
  const isEarly = month === '05' || month === '06'

  // Kaynak HOCA.xlsx'de ilk satır başlık; diğer satırlar gerçek Excel satır numarasıyla saklanır.
  rows.slice(1).forEach((raw, index) => {
    const row = Array.isArray(raw) ? raw : []
    const excelRow = index + 2
    const teacherName = text(valueAt(row, 1)).replace(/\s+/g, ' ')
    if (!teacherName) return
    const flag = valueAt(row, 0)
    const requiresReviewFlag = flag === 1 || flag === '1' || flag == null || flag === ''
    const groupRate = num(valueAt(row, 2))
    const privateRate = num(valueAt(row, 3))
    const groupQty = num(valueAt(row, isNovember ? 5 : 4)) || 0
    const privateQty = num(valueAt(row, isNovember ? 6 : 5)) || 0
    const specialRate = isNovember ? num(valueAt(row, 4)) : null
    const specialQty = isNovember ? num(valueAt(row, 7)) || 0 : 0
    const baseSource = num(valueAt(row, isNovember ? 8 : 6))
    const finalSource = num(valueAt(row, isNovember ? 13 : 11))
    const baseCalculated = roundMoney(
      groupQty * (groupRate || 0) + privateQty * (privateRate || 0) + specialQty * (specialRate || 0),
    )
    const difference = baseSource == null ? null : roundMoney(baseSource - baseCalculated)
    const rowReview = requiresReviewFlag || (difference !== null && Math.abs(difference) > 0.01)
    if (difference !== null && Math.abs(difference) > 0.01) {
      warnings.push(sheet + ' satır ' + excelRow + ' (' + teacherName + '): kaynak ders toplamı ile miktar × ücret farklı.')
    }
    const ref = (type: string) => fingerprint + ':' + sheet + ':' + excelRow + ':' + type
    const add = (type: ImportEntry['entryType'], quantity: number, unitRate: number,
      description: string, suffix: string, review = rowReview) => {
      entries.push({
        teacherName, workMonth, entryType: type, description,
        quantity, unitRate, totalAmount: calculateAmount(quantity, unitRate),
        sourceAmount: baseSource, difference, requiresReview: review,
        sourceReference: ref(suffix), sheet, row: excelRow,
      })
    }

    if (groupQty !== 0) add('group', groupQty, groupRate || 0, '', 'group', rowReview || groupRate === null)
    if (privateQty !== 0) add('private', privateQty, privateRate || 0, '', 'private', rowReview || privateRate === null)
    if (specialQty !== 0) add('extra', specialQty, specialRate || 0, 'Özel grup', 'special', rowReview || specialRate === null)

    let extraTotal = 0
    const amountExtra = (description: string, quantityCell: unknown, amountCell: unknown, suffix: string) => {
      const amount = num(amountCell)
      const quantity = num(quantityCell)
      if (amount !== null && amount !== 0) {
        extraTotal += amount
        const count = quantity && quantity > 0 ? quantity : 1
        add('extra', count, roundMoney(amount / count), description, suffix,
          rowReview || (quantity !== null && quantity <= 0))
      } else if (text(quantityCell) && (quantity === null || quantity !== 0)) {
        const label = text(quantityCell)
        add('extra', quantity && quantity > 0 ? quantity : 1, 0,
          description + ' - tutar girilmemiş: ' + label, suffix, true)
        warnings.push(sheet + ' satır ' + excelRow + ': ' + description + ' için tutar doğrulanmalı.')
      }
    }

    if (isEarly) {
      const note = text(valueAt(row, 7))
      const extra = num(valueAt(row, 8))
      if (extra !== null && extra !== 0) {
        extraTotal += extra
        add('extra', 1, extra, note || 'Diğer ek ödeme', 'extra')
      } else if (note) {
        add('extra', 1, 0, note + ' - tutar belirtilmemiş', 'extra-note', true)
      }
    } else {
      amountExtra('Video', valueAt(row, isNovember ? 9 : 7), valueAt(row, isNovember ? 10 : 8), 'video')
      amountExtra('Prim', valueAt(row, isNovember ? 11 : 9), valueAt(row, isNovember ? 12 : 10), 'prim')
    }

    // Bazı satırlarda ders adedi sıfır olsa bile kaynak toplamda sınav vb. ücret var.
    // Tutarı kaybetmemek için fiyatı ayrıca doğrulanacak bir ek iş olarak tut.
    if (baseSource !== null && baseSource !== 0 && baseCalculated === 0) {
      add('extra', 1, baseSource, 'Ders adedi olmayan kaynak toplamı - kontrol gerekli', 'source-unclassified', true)
    }
    if (finalSource !== null) {
      const expected = roundMoney((baseSource === null ? baseCalculated : baseSource) + extraTotal)
      if (Math.abs(finalSource - expected) > 0.01) {
        warnings.push(sheet + ' satır ' + excelRow + ': genel toplam ile ders + ek ödemeler uyumsuz.')
        for (const entry of entries) if (entry.sheet === sheet && entry.row === excelRow) entry.requiresReview = true
      }
    }
  })
  return entries
}

export async function parseExcel(file: File, year: number): Promise<ExcelPreview> {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error('Önce doğru yılı seçin.')
  const buffer = await file.arrayBuffer()
  const hash = await crypto.subtle.digest('SHA-256', buffer)
  const fingerprint = Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  const workbook = XLSX.read(buffer, { type: 'array' })
  const teacherRows = extractTeachers(workbook.Sheets.Sayfa1)
  const warnings: string[] = []
  const entries: ImportEntry[] = []
  for (const sheetName of workbook.SheetNames.filter((name) => name !== 'Sayfa1')) {
    try {
      entries.push(...normalizeSheetRows(sheetName, year, readRows(workbook.Sheets[sheetName]), fingerprint, warnings))
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : String(error))
    }
  }
  return { fingerprint, teacherRows, entries, warnings }
}
