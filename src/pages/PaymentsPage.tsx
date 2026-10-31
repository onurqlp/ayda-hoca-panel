import { useEffect, useMemo, useState } from 'react'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { deletePayment, savePayment } from '../lib/api'
import { derivePaymentStatus, formatTRY, monthLabel } from '../lib/calculations'
import type { Payment, TeacherMonthSummary } from '../types'
import { MonthPicker } from '../components/MonthPicker'
import { dateInIstanbul, normalizeSavedPaymentDate } from '../lib/dates'
import { StatusBadge } from '../components/StatusBadge'

const today = () => dateInIstanbul()
const empty = { id: '', teacherId: '', amount: '', paidAt: today(), note: '' }

export function PaymentsPage({ month, setMonth, summaries, payments, reload }: { month: string; setMonth: (v: string) => void; summaries: TeacherMonthSummary[]; payments: Payment[]; reload: () => Promise<void> }) {
  const [form, setForm] = useState(empty)
  const [message, setMessage] = useState('')
  // Ay değişince eski ödeme kaydının yanlış döneme taşınmasını önle.
  useEffect(() => { setForm({ ...empty, paidAt: today() }); setMessage('') }, [month])
  const selected = summaries.find((x) => x.teacher.id === form.teacherId)
  const overpay = selected && Number(form.amount) > selected.remaining + (form.id ? Number(payments.find((x) => x.id === form.id)?.amount ?? 0) : 0)
  const rows = useMemo(() => summaries.filter((x) => x.entitlement > 0 || x.paid > 0), [summaries])
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setMessage('')
    if (overpay && !confirm('Bu ödeme kalan hakedişi aşıyor. Yine de kaydedilsin mi?')) return
    try { await savePayment({ id: form.id || undefined, teacher_id: form.teacherId, payment_month: month, amount: Number(form.amount), paid_at: form.paidAt, note: form.note || null }); setForm(empty); setMessage('Ödeme kaydedildi.'); await reload() } catch (e) { setMessage(e instanceof Error ? e.message : 'Ödeme kaydedilemedi.') }
  }
  function edit(payment: Payment) { setForm({ id: payment.id, teacherId: payment.teacher_id, amount: String(payment.amount), paidAt: normalizeSavedPaymentDate(payment.paid_at), note: payment.note ?? '' }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  async function remove(id: string) { if (!confirm('Bu ödeme kaydı iptal edilsin mi?')) return; await deletePayment(id); await reload() }
  function exportCsv() {
    const lines = [['Öğretmen','Ay','Hakediş','Ödenen','Kalan','Durum'], ...rows.map((x) => [x.teacher.name, month, x.entitlement, x.paid, x.remaining, derivePaymentStatus(x.entitlement, x.paid, x.requiresReview)])]
    const csv = '\uFEFF' + lines.map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `ayda-odemeler-${month}.csv`; link.click(); URL.revokeObjectURL(url)
  }
  return <><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold">Ödemeler</h1><p className="mt-1 text-sm text-slate-500">Tam veya kısmi ödeme kaydedin.</p></div><div className="flex gap-2"><button className="btn-secondary" onClick={exportCsv}><Download size={17} /> CSV</button><MonthPicker value={month} onChange={setMonth} /></div></div>
    <form className="card mb-6 p-5" onSubmit={submit}><div className="grid gap-4 md:grid-cols-4"><label><span className="label">Öğretmen</span><select className="field" required value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}><option value="">Seçin</option>{rows.map((x) => <option key={x.teacher.id} value={x.teacher.id}>{x.teacher.name}</option>)}</select></label><label><span className="label">Tutar</span><input className="field" type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label><label><span className="label">Ödeme tarihi</span><input className="field" type="date" required value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} /></label><label><span className="label">Not</span><input className="field" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label></div>{selected && <p className={`mt-3 text-sm font-medium ${overpay ? 'text-red-700' : 'text-slate-600'}`}>Kalan: {formatTRY(selected.remaining)} {overpay ? '· Girilen tutar kalanı aşıyor.' : ''}</p>}<div className="mt-4 flex items-center gap-2">{form.id && <button type="button" className="btn-secondary" onClick={() => setForm(empty)}>Vazgeç</button>}<button className="btn-primary"><Plus size={17} /> {form.id ? 'Ödemeyi Güncelle' : 'Ödeme Ekle'}</button></div>{message && <p className="mt-3 text-sm text-ayda-700">{message}</p>}</form>
    <div className="space-y-4">{rows.map((item) => <article className="card p-5" key={item.teacher.id}><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="font-bold">{item.teacher.name}</p><p className="mt-1 text-sm text-slate-500">{monthLabel(month)}</p></div><StatusBadge status={derivePaymentStatus(item.entitlement, item.paid, item.requiresReview)} /></div><div className="mt-4 grid grid-cols-3 gap-3 border-y border-slate-100 py-4 text-sm"><div><p className="text-xs text-slate-500">Hakediş</p><p className="font-bold">{formatTRY(item.entitlement)}</p></div><div><p className="text-xs text-slate-500">Ödenen</p><p className="font-bold text-emerald-700">{formatTRY(item.paid)}</p></div><div><p className="text-xs text-slate-500">Kalan</p><p className="font-bold text-red-700">{formatTRY(item.remaining)}</p></div></div><div className="mt-3 space-y-2">{item.payments.map((payment) => <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm" key={payment.id}><div><span className="font-semibold">{formatTRY(payment.amount)}</span><span className="ml-2 text-slate-500">{payment.paid_at}{payment.note ? ` · ${payment.note}` : ''}</span></div><div className="flex"><button className="p-2 text-slate-500" onClick={() => edit(payment)}><Pencil size={16} /></button><button className="p-2 text-red-600" onClick={() => void remove(payment.id)}><Trash2 size={16} /></button></div></div>)}</div></article>)}</div></>
}
