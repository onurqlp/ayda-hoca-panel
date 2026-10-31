export const currentMonth = () => new Date().toISOString().slice(0, 7)

export function MonthPicker({ value, onChange }: { value: string; onChange: (month: string) => void }) {
  return <input className="field min-w-40" type="month" value={value} onChange={(event) => onChange(event.target.value)} />
}
