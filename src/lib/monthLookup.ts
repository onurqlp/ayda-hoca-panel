// Google Sheets may convert YYYY-MM to a DATE, serial number or ISO timestamp.
export function monthLookupKeys(month: string): Array<string | number> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Geçersiz ay: ' + month)
  const [year, m] = month.split('-').map(Number)
  const utc = Date.UTC(year, m - 1, 1)
  return [month, new Date(utc - 10800000).toISOString(), new Date(utc).toISOString(), Math.round((utc - Date.UTC(1899, 11, 30)) / 86400000)]
}

export function mergeMonthRows<T extends { id: string }>(
  sets: T[][], month: string, field: 'work_month' | 'payment_month',
): T[] {
  const unique = new Map<string, T>()
  for (const rows of sets) for (const row of rows) {
    unique.set(row.id, { ...row, [field]: month })
  }
  return [...unique.values()]
}
