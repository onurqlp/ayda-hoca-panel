import { useMemo, useState } from 'react'
import { ArrowRight, Banknote, BookOpen, CheckCircle2, Clock3, Pencil, Search, Users } from 'lucide-react'
import { derivePaymentStatus, formatTRY, monthLabel } from '../lib/calculations'
import { workMonthForPaymentMonth } from '../lib/dates'
import { isRemovedTeacher } from '../lib/teacherVisibility'
import type { Teacher, TeacherMonthSummary } from '../types'
import { MonthPicker } from '../components/MonthPicker'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'

type View = 'all' | 'unpaid' | 'partial' | 'paid' | 'review'

export function DashboardPage({ month, setMonth, summaries, teachers, loading, goTo, onEditEntry }: {
  month: string
  setMonth: (value: string) => void
  summaries: TeacherMonthSummary[]
  teachers: Teacher[]
  loading: boolean
  goTo: (page: 'entries' | 'payments' | 'teachers') => void
  onEditEntry: (entryId: string) => void
}) {
  const workMonth = workMonthForPaymentMonth(month)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<View>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = summaries.find(item => item.teacher.id === selectedId)
  const currentTeachers = teachers.filter(t => !isRemovedTeacher(t))
  const activeCount = currentTeachers.filter(t => t.active).length
  const inactiveCount = currentTeachers.length - activeCount
  const all = useMemo(() => [...summaries].sort((a, b) => a.teacher.name.localeCompare(b.teacher.name, 'tr')), [summaries])
  const filtered = useMemo(() => all.filter(item => {
    const match = item.teacher.name.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))
    return match && (status === 'all' || derivePaymentStatus(item.entitlement, item.paid, item.requiresReview) === status)
  }), [all, search, status])
  const sum = (key: 'entitlement' | 'paid' | 'remaining') => all.reduce((result, item) => result + item[key], 0)
  const totalDue = sum('entitlement')
  const totalPaid = sum('paid')
  const totalRemaining = sum('remaining')
  const totalGroup = all.reduce((n, item) => n + item.groupQuantity, 0)
  const totalPrivate = all.reduce((n, item) => n + item.privateQuantity, 0)
  const paymentPercentage = totalDue > 0 ? Math.min(100, Math.round(totalPaid / totalDue * 100)) : 0

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div><p className="text-xs font-bold uppercase tracking-[.15em] text-ayda-600">AYDA • Öğretmen yönetimi</p><h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Aylık Ödeme Paneli</h1><p className="mt-1 text-sm text-slate-500"><strong>{monthLabel(month)} ödemeleri</strong> · {monthLabel(workMonth)} ders hakedişleri</p></div>
      <label className="text-xs font-semibold text-slate-600">Ödeme ayı<MonthPicker value={month} onChange={setMonth} /></label>
    </div>

    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 sm:p-5"><div className="flex items-center gap-2 text-xs font-semibold text-indigo-700"><BookOpen size={16}/> Toplam hakediş</div><p className="mt-3 break-words text-xl font-extrabold text-indigo-950 sm:text-2xl">{formatTRY(totalDue)}</p><p className="mt-1 text-xs text-indigo-700">Önceki ayın dersleri</p></div>
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:p-5"><div className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 size={16}/> Ödenen</div><p className="mt-3 break-words text-xl font-extrabold text-emerald-950 sm:text-2xl">{formatTRY(totalPaid)}</p><p className="mt-1 text-xs text-emerald-700">Bu ay yapılan ödemeler</p></div>
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:p-5"><div className="flex items-center gap-2 text-xs font-semibold text-amber-700"><Banknote size={16}/> Kalan</div><p className="mt-3 break-words text-xl font-extrabold text-amber-950 sm:text-2xl">{formatTRY(totalRemaining)}</p><p className="mt-1 text-xs text-amber-700">Ödenmesi gereken</p></div>
      <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 sm:p-5"><div className="flex items-center gap-2 text-xs font-semibold text-sky-700"><Users size={16}/> Öğretmenler</div><p className="mt-3 text-xl font-extrabold text-sky-950 sm:text-2xl">{activeCount} <span className="text-sm font-medium text-sky-700">aktif</span></p><p className="mt-1 text-xs text-sky-700">{inactiveCount} pasif · {all.length} bu ay kayıtlı</p></div>
    </section>

    <section className="grid gap-4 md:grid-cols-[1fr_1fr]">
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2"><h2 className="font-bold text-slate-900">Ödeme ilerlemesi</h2><span className="text-sm font-bold text-emerald-700">%{paymentPercentage}</span></div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: paymentPercentage + '%' }} /></div>
        <p className="mt-2 text-xs text-slate-500">Önceki ayın hakedişinden ödenen tutarın oranı</p>
      </div>
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5"><div><p className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Clock3 size={17}/> Girilen ders birimi</p><p className="mt-2 text-2xl font-extrabold text-slate-950">{totalGroup + totalPrivate}</p><p className="text-xs text-slate-500">{totalGroup} grup · {totalPrivate} özel</p></div><button className="btn-primary" onClick={() => goTo('entries')}>Ders saati gir <ArrowRight size={17}/></button></div>
    </section>

    <section className="card overflow-hidden">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:p-5">
        <div><h2 className="text-lg font-bold">{monthLabel(workMonth)} derslerinin ödeme durumu</h2><p className="text-xs text-slate-500">Öğretmene dokunarak ders ve ödemelerini görün.</p></div>
        <button className="btn-secondary" onClick={() => goTo('payments')}>Ödeme kaydet <ArrowRight size={16}/></button>
      </div>
      <div className="flex flex-col gap-3 p-4 sm:flex-row">
        <label className="relative flex-1"><Search size={17} className="absolute left-3 top-3 text-slate-400"/><input className="field pl-10" placeholder="Öğretmen ara..." value={search} onChange={e => setSearch(e.target.value)}/></label>
        <select className="field sm:w-44" aria-label="Ödeme durumu filtresi" value={status} onChange={e => setStatus(e.target.value as View)}><option value="all">Tüm durumlar</option><option value="unpaid">Ödenmedi</option><option value="partial">Kısmi ödeme</option><option value="paid">Ödendi</option><option value="review">Kontrol gerekli</option></select>
      </div>
      {loading ? <p className="p-12 text-center text-slate-500">Veriler yükleniyor...</p> : filtered.length === 0 ?
        <div className="p-10 text-center"><p className="font-semibold text-slate-600">Bu ay henüz kayıt yok.</p><button className="btn-primary mt-4" onClick={() => goTo('entries')}>İlk ders kaydını ekle</button></div> :
        <>
          <div className="hidden overflow-x-auto lg:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Hoca</th><th className="px-4 py-3">Ders (grup / özel)</th><th className="px-4 py-3">Hakediş</th><th className="px-4 py-3">Ödenen</th><th className="px-4 py-3">Kalan</th><th className="px-4 py-3">Durum</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(item => <tr key={item.teacher.id} tabIndex={0} role="button" onClick={() => setSelectedId(item.teacher.id)} onKeyDown={e => e.key === 'Enter' && setSelectedId(item.teacher.id)} className="cursor-pointer hover:bg-indigo-50/60"><td className="px-4 py-4 font-semibold">{item.teacher.name}{!item.teacher.active && <span className="ml-2 rounded bg-slate-100 px-1.5 py-1 text-[10px] text-slate-500">Pasif</span>}</td><td className="px-4">{item.groupQuantity} / {item.privateQuantity}</td><td className="px-4 font-semibold">{formatTRY(item.entitlement)}</td><td className="px-4 font-semibold text-emerald-700">{formatTRY(item.paid)}</td><td className="px-4 font-semibold text-amber-700">{formatTRY(item.remaining)}</td><td className="px-4"><StatusBadge status={derivePaymentStatus(item.entitlement, item.paid, item.requiresReview)}/></td></tr>)}</tbody></table></div>
          <div className="grid gap-3 p-3 lg:hidden">{filtered.map(item => <button key={item.teacher.id} onClick={() => setSelectedId(item.teacher.id)} className="rounded-xl border border-slate-200 bg-white p-4 text-left"><div className="flex items-start justify-between gap-2"><div><p className="font-bold">{item.teacher.name}</p><p className="mt-1 text-xs text-slate-500">Grup {item.groupQuantity} · Özel {item.privateQuantity}{!item.teacher.active ? ' · Pasif' : ''}</p></div><StatusBadge status={derivePaymentStatus(item.entitlement,item.paid,item.requiresReview)}/></div><div className="mt-4 grid grid-cols-3 gap-2 text-xs"><div><p className="text-slate-500">Hakediş</p><p className="mt-1 font-bold">{formatTRY(item.entitlement)}</p></div><div><p className="text-slate-500">Ödenen</p><p className="mt-1 font-bold text-emerald-700">{formatTRY(item.paid)}</p></div><div><p className="text-slate-500">Kalan</p><p className="mt-1 font-bold text-amber-700">{formatTRY(item.remaining)}</p></div></div></button>)}</div>
        </>}
    </section>
    {selected && <Modal title={selected.teacher.name + ' · ' + monthLabel(workMonth) + ' dersleri'} onClose={() => setSelectedId(null)}>
      <p className="mb-3 text-xs text-slate-500">Ödeme dönemi: {monthLabel(month)}. Ders bilgilerini ödeme durumundan bağımsız değiştirebilirsiniz.</p>
      <div className="space-y-2">{selected.entries.map(entry => <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm" key={entry.id}><div className="min-w-0 flex-1"><b>{entry.entry_type === 'group' ? 'Grup dersi' : entry.entry_type === 'private' ? 'Özel ders' : 'Ek iş'}</b><p className="text-slate-500">{entry.quantity} × {formatTRY(entry.unit_rate_snapshot)}{entry.description ? ' · ' + entry.description : ''}</p></div><div className="flex items-center gap-2"><strong>{formatTRY(entry.total_amount)}</strong><button type="button" className="btn-secondary px-3 py-2" onClick={() => { setSelectedId(null); onEditEntry(entry.id) }}><Pencil size={15} /> Düzenle</button></div></div>)}</div>
      <div className="mt-4 space-y-2 border-t pt-4 text-sm"><div className="flex justify-between"><span>Hakediş</span><b>{formatTRY(selected.entitlement)}</b></div><div className="flex justify-between text-emerald-700"><span>Ödenen</span><b>{formatTRY(selected.paid)}</b></div><div className="flex justify-between font-bold text-amber-700"><span>Kalan</span><span>{formatTRY(selected.remaining)}</span></div></div>
      <button className="btn-primary mt-5 w-full" onClick={() => { setSelectedId(null); goTo('payments') }}>Ödemelere git</button>
    </Modal>}
  </div>
}
