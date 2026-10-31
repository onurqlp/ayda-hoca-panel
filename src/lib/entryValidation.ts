// The backend accepts zero-valued Excel rows for later correction, but manual
// lessons must have a positive quantity and rate. Keep this rule consistent.
export function validateEntryNumbers(quantity: string, rate: string, imported: boolean): string | null {
  const qty = Number(quantity)
  const unitRate = Number(rate)
  if (!quantity.trim() || !Number.isFinite(qty) || qty < 0 || (!imported && qty === 0)) {
    return 'Ders miktarı geçerli bir sayı olmalı' + (imported ? '.' : ' ve sıfırdan büyük olmalı.')
  }
  if (!rate.trim() || !Number.isFinite(unitRate) || unitRate < 0 || (!imported && unitRate === 0)) {
    return 'Birim ücret geçerli bir sayı olmalı' + (imported ? '.' : ' ve sıfırdan büyük olmalı.')
  }
  return null
}
