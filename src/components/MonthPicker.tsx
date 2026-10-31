export { currentMonth } from '../lib/dates'

export function MonthPicker({ value, onChange }: { value: string; onChange: (month: string) => void }) {
  return <input className="field min-w-40" type="month" value={value} onChange={(event) => onChange(event.target.value)} />
}
