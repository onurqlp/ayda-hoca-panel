import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { deletePayment, listMonthPayments, savePayment } from '../lib/api'
import { outstandingAmount, effectivePaymentDate } from '../lib/quickPayment'
import { derivePaymentStatus, formatTRY, monthLabel } from '../lib/calculations'
import type { Payment, TeacherMonthSummary } from '../types'
import { MonthPicker } from '../components/MonthPicker'
import { dateInIstanbul, normalizeSavedPaymentDate, workMonthForPaymentMonth } from '../lib/dates'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'

const today = () => dateInIstanbul()
const emptyForMonth = () => ({
  id: '', teacherId: '', amount: '',
  paidAt: today(), note: '',
})

export function PaymentsPage({ month, setMonth, summaries, payments, reload }: { month: string; setMonth: (v: string) => void; summaries: TeacherMonthSummary[]; payments: Payment[]; reload: () => Promise<void> }) {
  const [form, setForm] = useState(() => emptyForMonth())
  const workMonth = workMonthForPaymentMonth(month)
  const [message, setMessage] = useState('')
  const [quickTeacherId, setQuickTeacherId] = useState<string | null>(null)
  const [quickPaidAt, setQuickPaidAt] = useState(() => emptyForMonth().paidAt)
  const [quickNote, setQuickNote] = useState('')
  const [quickError, setQuickError] = useState('')
  const [quickBusy, setQuickBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  // Ay değişince eski ödeme kaydının yanlış döneme taşınmasını önle.
  useEffect(() => {
    setForm(emptyForMonth())
    setQuickTeacherId(null)
    setMessage('')
    setQuickError('')
  }, [month])
  const selected = summaries.find((x) => x.teacher.id === form.teacherId)
  const originalPayment = form.id ? payments.find(x => x.id === form.id) : undefined
  const previousAmount = originalPayment?.teacher_id === form.teacherId ? Number(originalPayment.amount) : 0
  const overpay = Boolean(selected && Number(form.amount) > selected.remaining + previousAmount)
  const rows = useMemo(() => summaries.filter((x) => x.entitlement > 0 || x.paid > 0), [summaries])
  const quickTeacher = summaries.find(item => item.teacher.id === quickTeacherId)
  const quickAmount = quickTeacher ? outstandingAmount(quickTeacher.entitlement, quickTeacher.paid) : 0

  function openQuickPayment(item: TeacherMonthSummary) {
    setQuickError('')
    setQuickPaidAt(emptyForMonth().paidAt)
    setQuickNote('')
    setQuickTeacherId(item.teacher.id)
  }

  async function confirmQuickPayment(event: React.FormEvent) {
    event.preventDefault()
    if (!quickTeacher || quickBusy) return
    if (quickAmount <= 0) return setQuickError('Bu hocanın kalan ödemesi bulunmuyor.')
    setQuickBusy(true)
    setQuickError('')
    let saved = false
    try {
      // Verify the balance again against Google Sheets before writing a transaction.
      const currentPayments = await listMonthPayments(month)
      const alreadyPaid = currentPayments.filter(row => row.teacher_id === quickTeacher.teacher.id)
        .reduce((sum, row) => sum + Number(row.amount), 0)
      const latestBalance = outstandingAmount(quickTeacher.entitlement, alreadyPaid)
      if (latestBalance !== quickAmount) {
        setQuickError('Ödeme tutarı başka bir işlemle değişti. Veriler güncellendi; yeni tutarı kontrol edip tekrar onaylayın.')
        await reload()
        return
      }
      if (latestBalance <= 0) {
        setQuickError('Bu hocanın ödemesi zaten tamamlanmış.')
        await reload()
        return
      }

      const payment = await savePayment({
        teacher_id: quickTeacher.teacher.id,
        payment_month: month,
        amount: latestBalance,
        paid_at: effectivePaymentDate(quickPaidAt, today()),
        note: quickNote.trim() || 'Kalan hakediş ödendi',
      })
      saved = true
      setQuickTeacherId(null)
      await reload()
      const verified = await listMonthPayments(month)
      setMessage(verified.some(row => row.id === payment.id)
        ? quickTeacher.teacher.name + ': ' + formatTRY(latestBalance) + ' ödendi ve Google Sheets\'te doğrulandı.'
        : 'Ödeme kaydı gönderildi ancak yeniden okuma doğrulanamadı. Tekrar ödeme eklemeden önce Verileri Yenile\'yi kullanın.')
    } catch (error) {
      if (saved) {
        setQuickTeacherId(null)
        setMessage('Ödeme kaydedildi ancak yeniden okuma başarısız. Tekrar ödeme eklemeden önce Verileri Yenile ile kontrol edin.')
      } else {
        setQuickError(error instanceof Error ? error.message : 'Ödeme kaydedilemedi.')
      }
    } finally {
      setQuickBusy(false)
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (saving) return; setMessage('')
    if (overpay && !confirm('Bu ödeme kalan hakedişi aşıyor. Yine de kaydedilsin mi?')) return
    setSaving(true)
    let saved = false
    try {
      const payment = await savePayment({ id: form.id || undefined, teacher_id: form.teacherId, payment_month: month, amount: Number(form.amount), paid_at: effectivePaymentDate(form.paidAt, today()), note: form.note || null })
      saved = true
      setForm(emptyForMonth())
      await reload()
      const verified = await listMonthPayments(month)
      setMessage(verified.some(item => item.id === payment.id) ? 'Ödeme Google Sheets\'ten doğrulandı.' : 'Ödeme kaydı gönderildi; yeniden okuma doğrulanamadı. Yenileyerek kontrol edin.')
    } catch (e) {
      setMessage(saved ? 'Ödeme kaydedildi ancak yenileme başarısız; tekrar kaydetmeden önce Verileri Yenile ile kontrol edin.' : e instanceof Error ? e.message : 'Ödeme kaydedilemedi.')
    } finally { setSaving(false) }
  }
  function edit(payment: Payment) { setForm({ id: payment.id, teacherId: payment.teacher_id, amount: String(payment.amount), paidAt: normalizeSavedPaymentDate(payment.paid_at), note: payment.note ?? '' }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  async function remove(id: string) {
    if (removingId || !confirm('Bu ödeme kaydı iptal edilsin mi?')) return
    setRemovingId(id)
    setMessage('')
    try {
      await deletePayment(id)
      await reload()
      setMessage('Ödeme kaydı iptal edildi. Güncel veriler alındı.')
    } catch (error) {
      setMessage(error instanceof Error ? 'Ödeme iptal edilemedi: ' + error.message : 'Ödeme iptal edilemedi.')
    } finally { setRemovingId(null) }
  }
  function exportCsv() {
    const lines = [['Öğretmen','Ders ayı','Ödeme ayı','Hakediş','Ödenen','Kalan','Durum'], ...rows.map((x) => [x.teacher.name, workMonth, month, x.entitlement, x.paid, x.remaining, derivePaymentStatus(x.entitlement, x.paid, x.requiresReview)])]
    const csv = '\uFEFF' + lines.map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `ayda-odemeler-${month}.csv`; link.click(); URL.revokeObjectURL(url)
  }
  return <><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold">{monthLabel(month)} Ödemeleri</h1><p className="mt-1 text-sm text-slate-500">{monthLabel(workMonth)} derslerinin ödemesi bu dönemde yapılır. Gerçek ödeme yapılana kadar borç açık kalır.</p></div><div className="flex gap-2"><button className="btn-secondary" onClick={exportCsv}><Download size={17} /> CSV</button><label className="text-xs font-semibold text-slate-600">Ödeme ayı<MonthPicker value={month} onChange={setMonth} /></label></div></div>
    <form className="card mb-6 p-5" onSubmit={submit}><div className="grid gap-4 md:grid-cols-4"><label><span className="label">Öğretmen</span><select className="field" required value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}><option value="">Seçin</option>{rows.map((x) => <option key={x.teacher.id} value={x.teacher.id}>{x.teacher.name}</option>)}</select></label><label><span className="label">Tutar</span><input className="field" type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label><label><span className="label">Ödeme tarihi (isteğe bağlı)</span><input className="field" type="date" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} /></label><label><span className="label">Not</span><input className="field" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label></div>{selected && <p className={`mt-3 text-sm font-medium ${overpay ? 'text-red-700' : 'text-slate-600'}`}>Kalan: {formatTRY(selected.remaining)} {overpay ? '· Girilen tutar kalanı aşıyor.' : ''}</p>}<div className="mt-4 flex items-center gap-2">{form.id && <button type="button" className="btn-secondary" onClick={() => setForm(emptyForMonth())}>Vazgeç</button>}<button className="btn-primary" disabled={saving}><Plus size={17} /> {saving ? 'Kaydediliyor...' : form.id ? 'Ödemeyi Güncelle' : 'Ödeme Ekle'}</button></div>{message && <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}</form>
    <div className="space-y-4">{rows.length === 0 && <div className="card p-8 text-center text-sm text-slate-500">{monthLabel(workMonth)} için hakediş veya ödeme kaydı yok.</div>}{rows.map((item) => <article className="card p-5" key={item.teacher.id}><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="font-bold">{item.teacher.name}</p><p className="mt-1 text-sm text-slate-500">{monthLabel(workMonth)} dersleri · {monthLabel(month)} ödemesi</p></div><div className="flex flex-wrap items-center gap-2">
      <StatusBadge status={derivePaymentStatus(item.entitlement, item.paid, item.requiresReview)} />
      {outstandingAmount(item.entitlement, item.paid) > 0
        ? <button type="button" className="btn-primary px-3 py-2" onClick={() => openQuickPayment(item)}>
            <CheckCircle2 size={17} /> {item.paid > 0 ? 'Kalanı Ödendi İşaretle' : 'Ödendi İşaretle'}
          </button>
        : outstandingAmount(item.entitlement, item.paid) <= 0 && item.entitlement > 0
          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={16} /> Tamamı ödendi</span>
          : null}
    </div></div><div className="mt-4 grid grid-cols-3 gap-3 border-y border-slate-100 py-4 text-sm"><div><p className="text-xs text-slate-500">Hakediş</p><p className="font-bold">{formatTRY(item.entitlement)}</p></div><div><p className="text-xs text-slate-500">Ödenen</p><p className="font-bold text-emerald-700">{formatTRY(item.paid)}</p></div><div><p className="text-xs text-slate-500">Kalan</p><p className="font-bold text-red-700">{formatTRY(item.remaining)}</p></div></div><div className="mt-3 space-y-2">{item.payments.map((payment) => <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm" key={payment.id}><div><span className="font-semibold">{formatTRY(payment.amount)}</span><span className="ml-2 text-slate-500">{payment.paid_at}{payment.note ? ` · ${payment.note}` : ''}</span></div><div className="flex"><button className="p-2 text-slate-500" onClick={() => edit(payment)}><Pencil size={16} /></button><button type="button" className="p-2 text-red-600 disabled:opacity-50" title="Ödemeyi iptal et" disabled={removingId !== null} onClick={() => void remove(payment.id)}><Trash2 size={16} /></button></div></div>)}</div></article>)}</div>
    {quickTeacher && <Modal title={quickTeacher.teacher.name + ' · Ödendi Olarak İşaretle'} onClose={() => { if (!quickBusy) setQuickTeacherId(null) }}>
      <form className="space-y-4" onSubmit={(event) => { void confirmQuickPayment(event) }}>
        <p className="text-sm text-slate-600">Onayladığında kalan tutar ödendi olarak kaydedilir. Tarih ödeme ayından farklı olabilir; tarih boş bırakılırsa bugün kullanılır.</p>
        {quickTeacher.requiresReview && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Ders kayıtlarında kontrol notu var. Bu, ödeme kaydetmenizi engellemez.</p>}
        <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-semibold text-emerald-700">Ödendi kaydedilecek kalan tutar</p><p className="mt-1 text-2xl font-bold text-emerald-950">{formatTRY(quickAmount)}</p><p className="mt-1 text-xs text-emerald-700">{monthLabel(workMonth)} dersleri · {monthLabel(month)} ödemesi</p></div>
        <label className="block"><span className="label">Ödeme tarihi (isteğe bağlı, boşsa bugün)</span><input className="field" type="date" value={quickPaidAt} onChange={e => setQuickPaidAt(e.target.value)} /></label>
        <label className="block"><span className="label">Not (isteğe bağlı)</span><input className="field" placeholder="Banka havalesi, nakit vb." value={quickNote} onChange={e => setQuickNote(e.target.value)} /></label>
        {quickError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{quickError}</p>}
        <div className="flex flex-wrap justify-end gap-2"><button type="button" className="btn-secondary" disabled={quickBusy} onClick={() => setQuickTeacherId(null)}>Vazgeç</button><button type="submit" className="btn-primary" disabled={quickBusy || quickAmount <= 0}><CheckCircle2 size={17} /> {quickBusy ? 'Kaydediliyor...' : 'Ödemeyi Onayla'}</button></div>
      </form>
    </Modal>}</>
}
