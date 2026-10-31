import { isValidMonth } from '../lib/dates'
export { currentMonth } from '../lib/dates'

export function MonthPicker({ value, onChange }: { value: string; onChange: (month: string) => void }) {
  return <input className="field min-w-40" type="month" value={value}
    onChange={(event) => {
      // Date inputs may temporarily become empty while edited. Keep the current month.
      const next = event.target.value
      if (isValidMonth(next)) onChange(next)
    }}
  />
}
