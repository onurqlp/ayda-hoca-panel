import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { derivePaymentStatus, formatTRY, monthLabel } from '../lib/calculations'
import type { TeacherMonthSummary } from '../types'
import { MonthPicker } from '../components/MonthPicker'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'

export function DashboardPage({ month, setMonth, summaries, loading }: { month: string; setMonth: (value: string) => void; summaries: TeacherMonthSummary[]; loading: boolean }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<TeacherMonthSummary | null>(null)
  const filtered = useMemo(() => summaries.filter((item) => {
    const itemStatus = derivePaymentStatus(item.entitlement, item.paid, item.requiresReview)
    return item.teacher.name.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')) && (status === 'all' || status === itemStatus)
  }), [summaries, search, status])
  const total = (key: 'entitlement' | 'paid' | 'remaining') => summaries.reduce((sum, item) => sum + item[key], 0)

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold">Aylık Panel</h1><p className="mt-1 text-sm text-slate-500">{monthLabel(month)} özeti</p></div><MonthPicker value={month} onChange={setMonth} /></div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[['Aktif hoca', summaries.length.toString()], ['Grup / Özel', `${summaries.reduce((s, x) => s + x.groupQuantity, 0)} / ${summaries.reduce((s, x) => s + x.privateQuantity, 0)}`], ['Toplam hakediş', formatTRY(total('entitlement'))], ['Ödenen', formatTRY(total('paid'))], ['Kalan', formatTRY(total('remaining'))]].map(([label, value]) => <article className="card p-4" key={label}><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-slate-950">{value}</p></article>)}
      </section>
      <div className="my-5 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input className="field pl-10" placeholder="Hoca ara" value={search} onChange={(e) => setSearch(e.target.value)} /></label><select className="field sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Tüm durumlar</option><option value="unpaid">Ödenmedi</option><option value="partial">Kısmi</option><option value="paid">Ödendi</option><option value="review">Kontrol gerekli</option></select></div>
      {loading ? <p className="py-12 text-center text-slate-500">Yükleniyor…</p> : filtered.length === 0 ? <div className="card py-14 text-center text-slate-500">Bu ay için kayıt bulunamadı.</div> : <>
        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white lg:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Öğretmen', 'Grup', 'Özel', 'Ek ödeme', 'Hakediş', 'Ödenen', 'Durum'].map((x) => <th className="px-4 py-3" key={x}>{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((item) => <tr key={item.teacher.id} onClick={() => setSelected(item)} className="cursor-pointer hover:bg-ayda-50"><td className="px-4 py-4 font-semibold">{item.teacher.name}</td><td className="px-4">{item.groupQuantity}</td><td className="px-4">{item.privateQuantity}</td><td className="px-4">{formatTRY(item.extras)}</td><td className="px-4 font-semibold">{formatTRY(item.entitlement)}</td><td className="px-4">{formatTRY(item.paid)}</td><td className="px-4"><StatusBadge status={derivePaymentStatus(item.entitlement, item.paid, item.requiresReview)} /></td></tr>)}</tbody></table></div>
        <div className="grid gap-3 lg:hidden">{filtered.map((item) => <button key={item.teacher.id} onClick={() => setSelected(item)} className="card p-4 text-left"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{item.teacher.name}</p><p className="mt-1 text-xs text-slate-500">Grup {item.groupQuantity} · Özel {item.privateQuantity}</p></div><StatusBadge status={derivePaymentStatus(item.entitlement, item.paid, item.requiresReview)} /></div><div className="mt-4 grid grid-cols-3 gap-2 text-sm"><div><p className="text-xs text-slate-500">Hakediş</p><p className="font-semibold">{formatTRY(item.entitlement)}</p></div><div><p className="text-xs text-slate-500">Ödenen</p><p className="font-semibold">{formatTRY(item.paid)}</p></div><div><p className="text-xs text-slate-500">Kalan</p><p className="font-semibold text-red-700">{formatTRY(item.remaining)}</p></div></div></button>)}</div>
      </>}
      {selected && <Modal title={`${selected.teacher.name} · ${monthLabel(month)}`} onClose={() => setSelected(null)}><div className="space-y-3">{selected.entries.map((entry) => <div className="rounded-xl border border-slate-200 p-3 text-sm" key={entry.id}><div className="flex justify-between gap-3"><p className="font-semibold">{entry.entry_type === 'group' ? 'Grup' : entry.entry_type === 'private' ? 'Özel' : 'Ek iş'} · {entry.quantity} × {formatTRY(entry.unit_rate_snapshot)}</p><p className="font-bold">{formatTRY(entry.total_amount)}</p></div>{entry.description && <p className="mt-1 text-slate-500">{entry.description}</p>}</div>)}</div><div className="mt-5 flex justify-between border-t pt-4 font-bold"><span>Kalan</span><span>{formatTRY(selected.remaining)}</span></div></Modal>}
    </>
  )
}
