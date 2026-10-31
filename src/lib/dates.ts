const istanbulDateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Istanbul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function dateInIstanbul(date: Date = new Date()): string {
  const parts = istanbulDateFormatter.formatToParts(date)
  const part = (type: 'year' | 'month' | 'day') =>
    parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function currentMonth(date: Date = new Date()): string {
  return dateInIstanbul(date).slice(0, 7)
}

// Ekim derslerinin ödemesi Kasım dönemine aittir.
export function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split('-').map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12)
    throw new Error('Geçersiz ay: ' + month)
  return new Date(Date.UTC(year, monthNumber - 1 + delta, 1)).toISOString().slice(0, 7)
}

export function workMonthForPaymentMonth(paymentMonth: string): string {
  return shiftMonth(paymentMonth, -1)
}

export function paymentMonthForWorkMonth(workMonth: string): string {
  return shiftMonth(workMonth, 1)
}

// Ay başında mevcut, ayın 20'sinden sonra gelecek ödeme dönemini göster.
export function defaultPaymentMonth(date: Date = new Date()): string {
  const local = dateInIstanbul(date)
  const month = local.slice(0, 7)
  return Number(local.slice(8, 10)) >= 20 ? paymentMonthForWorkMonth(month) : month
}

export function normalizeSavedPaymentDate(value: string): string {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value.slice(0, 10) : dateInIstanbul(parsed)
}
