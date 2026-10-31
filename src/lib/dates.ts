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

export function normalizeSavedPaymentDate(value: string): string {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value.slice(0, 10) : dateInIstanbul(parsed)
}
