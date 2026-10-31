import type { PaymentStatus } from '../lib/calculations'

const labels: Record<PaymentStatus, string> = { unpaid: 'Ödenmedi', partial: 'Kısmi', paid: 'Ödendi', review: 'Kontrol gerekli' }
const styles: Record<PaymentStatus, string> = {
  unpaid: 'bg-red-50 text-red-700', partial: 'bg-amber-50 text-amber-700', paid: 'bg-emerald-50 text-emerald-700', review: 'bg-violet-50 text-violet-700',
}

export function StatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{labels[status]}</span>
}
