import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { calculateAmount, formatTRY, monthLabel } from '../lib/calculations'
import { paymentMonthForWorkMonth } from '../lib/dates'
import { deleteWorkEntry, listMonthEntries, saveWorkEntry } from '../lib/api'
import { isRemovedTeacher } from '../lib/teacherVisibility'
import type { EntryType, Teacher, WorkEntry } from '../types'
import { MonthPicker } from '../components/MonthPicker'

const empty = { id: '', teacherId: '', type: 'group' as EntryType, quantity: '1', rate: '', description: '' }

export function WorkEntriesPage({ month, setMonth, teachers, entries, reload, editEntryId, onEditEntryHandled }: {
  month: string
  setMonth: (v: string) => void
  teachers: Teacher[]
  entries: WorkEntry[]
  reload: () => Promise<void>
  editEntryId: string | null
  onEditEntryHandled: () => void
}) {
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const teacher = teachers.find((item) => item.id === form.teacherId)
  const defaultRate = form.type === 'group' ? teacher?.group_rate : form.type === 'private' ? teacher?.private_rate : null
  const amount = calculateAmount(Number(form.quantity) || 0, Number(form.rate) || 0)

  useEffect(() => {
    if (!form.id && form.type !== 'extra') setForm((old) => ({ ...old, rate: defaultRate == null ? '' : String(defaultRate) }))
  }, [form.teacherId, form.type, form.id, defaultRate])

  // Başka bir ay seçildiğinde açık düzenlemeyi kapat; eski kaydı yeni aya taşımayalım.
  useEffect(() => { setForm(empty); setMessage('') }, [month])

  // Aylık paneldeki "Düzenle" düğmesinden doğrudan ilgili kaydı aç.
  // Ödeme durumuna bakılmaz; ders bilgisi her zaman düzenlenebilir.
  useEffect(() => {
    if (!editEntryId) return
    const entry = entries.find((item) => item.id === editEntryId && item.work_month === month)
    if (!entry) return
    setForm({
      id: entry.id, teacherId: entry.teacher_id, type: entry.entry_type,
      quantity: String(entry.quantity), rate: String(entry.unit_rate_snapshot),
      description: entry.description ?? '',
    })
    setMessage('')
    onEditEntryHandled()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [editEntryId, entries, month, onEditEntryHandled])

  const teacherEntries = useMemo(() => entries.filter((item) => !form.teacherId || item.teacher_id === form.teacherId), [entries, form.teacherId])
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setMessage('')
    if (!form.teacherId) return setMessage('Öğretmen seçin.')
    if (!form.rate || Number(form.rate) <= 0 || !Number.isFinite(Number(form.rate))) return setMessage('Birim ücret belirlenmeden kayıt yapılamaz.')
    setBusy(true)
    let savedId: string | null = null
    try {
      // Excel'den gelen kayıt düzenlenirken kaynak referansı korunur.
      // Böylece aynı Excel tekrar aktarılırsa ikinci bir hakediş oluşmaz.
      const existing = form.id ? entries.find((item) => item.id === form.id) : undefined
      const saved = await saveWorkEntry({
        id: form.id || undefined, teacher_id: form.teacherId, work_month: month,
        entry_type: form.type, quantity: Number(form.quantity),
        unit_rate_snapshot: Number(form.rate), total_amount: amount,
        description: form.description || null,
        source_type: existing?.source_type ?? 'manual',
        source_reference: existing?.source_reference ?? null,
        requires_review: existing?.requires_review ?? false,
      })
      savedId = saved.id
      await reload()
      const verified = await listMonthEntries(month)
      if (verified.some(item => item.id === saved.id)) {
        setForm({ ...empty, teacherId: form.teacherId })
        setMessage(form.id ? 'Ders güncellendi; Google Sheets\'ten doğrulandı.' : 'Ders kaydedildi; Google Sheets\'ten doğrulandı.')
      } else {
        setMessage('Kayıt Google Sheets\'e yazıldı, fakat listede henüz görünmüyor. Verileri Yenile ile kontrol edin.')
      }
    } catch (e) {
      setMessage(savedId
        ? 'Kayıt Google Sheets\'e yazıldı, fakat yeniden okuma başarısız. Verileri Yenile ile kontrol edin.'
        : e instanceof Error ? e.message : 'Kayıt başarısız.')
    } finally { setBusy(false) }
  }
  function edit(entry: WorkEntry) { setForm({ id: entry.id, teacherId: entry.teacher_id, type: entry.entry_type, quantity: String(entry.quantity), rate: String(entry.unit_rate_snapshot), description: entry.description ?? '' }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  async function remove(id: string) {
    if (removingId || !confirm('Bu ders kaydı silinsin mi? İşlem denetim kaydına işlenecek.')) return
    setRemovingId(id)
    setMessage('')
    try {
      await deleteWorkEntry(id)
      await reload()
      if (form.id === id) setForm(empty)
      setMessage('Ders kaydı iptal edildi. Hakediş yeniden hesaplandı.')
    } catch (error) {
      setMessage(error instanceof Error ? 'Ders silinemedi: ' + error.message : 'Ders kaydı silinemedi.')
    } finally { setRemovingId(null) }
  }

  return <><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold">Ders Girişi</h1><p className="mt-1 text-sm text-slate-500">{monthLabel(month)} dersleri · {monthLabel(paymentMonthForWorkMonth(month))} ayında ödenecek.</p></div><label className="text-xs font-semibold text-slate-600">Ders ayı<MonthPicker value={month} onChange={setMonth} /></label></div>
    <form className="card p-5 sm:p-6" onSubmit={submit}><div className="grid gap-4 md:grid-cols-2"><label><span className="label">Öğretmen</span><select className="field" required value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}><option value="">Seçin</option>{teachers.filter((x) => (x.active && !isRemovedTeacher(x)) || x.id === form.teacherId).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label><span className="label">Ödeme ayı</span><input className="field" value={monthLabel(paymentMonthForWorkMonth(month))} disabled /></label></div>
    {teacher && <div className="my-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-blue-50 p-3"><p className="text-xs font-medium text-blue-700">Güncel grup ücreti</p><p className="mt-1 font-bold text-blue-950">{teacher.group_rate == null ? 'Belirlenmedi' : `${formatTRY(teacher.group_rate)} / birim`}</p></div><div className="rounded-xl bg-violet-50 p-3"><p className="text-xs font-medium text-violet-700">Güncel özel ücreti</p><p className="mt-1 font-bold text-violet-950">{teacher.private_rate == null ? 'Belirlenmedi' : `${formatTRY(teacher.private_rate)} / birim`}</p></div></div>}
    <div className="grid gap-4 md:grid-cols-3"><label><span className="label">Ders türü</span><select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EntryType, rate: '' })}><option value="group">Grup ders</option><option value="private">Özel ders</option><option value="extra">Ek ücret</option></select></label><label><span className="label">Ders saati / adet</span><input className="field" type="number" min="0" step="0.001" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label><label><span className="label">Saatlik ücret (TL)</span><input className="field" type="number" min="0" step="0.01" required value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></label></div>
    <label className="mt-4 block"><span className="label">Açıklama</span><textarea className="field" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Video, prim, sınav, Schreiben grubu vb." /></label>
    <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-2xl bg-slate-950 p-4 text-white sm:flex-row sm:items-center"><div><p className="text-xs text-slate-300">Toplam hakediş</p><p className="mt-1 text-2xl font-bold">{formatTRY(amount)}</p></div><div className="flex gap-2">{form.id && <button type="button" className="btn-secondary" onClick={() => setForm(empty)}>Vazgeç</button>}<button className="btn-primary" disabled={busy}><Plus size={18} />{form.id ? 'Kaydı Güncelle' : 'Kaydet'}</button></div></div>{message && <p className="mt-4 text-sm font-medium text-ayda-700">{message}</p>}</form>
    <section className="mt-6"><h2 className="mb-1 text-lg font-bold">{monthLabel(month)} kayıtları</h2><p className="mb-3 text-sm text-slate-500">Hatalı girdiğiniz kayıtları ödeme durumundan bağımsız düzenleyebilirsiniz.</p><div className="space-y-3">{teacherEntries.map((entry) => <article className="card flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center" key={entry.id}><div><p className="font-semibold">{teachers.find((x) => x.id === entry.teacher_id)?.name} · {entry.entry_type === 'group' ? 'Grup' : entry.entry_type === 'private' ? 'Özel' : 'Ek iş'}</p><p className="mt-1 text-sm text-slate-500">{entry.quantity} × {formatTRY(entry.unit_rate_snapshot)} {entry.description ? `· ${entry.description}` : ''}</p></div><div className="flex items-center justify-between gap-3"><p className="font-bold">{formatTRY(entry.total_amount)}</p><button type="button" className="btn-secondary px-3 py-2" onClick={() => edit(entry)} title="Ders bilgilerini düzenle"><Pencil size={16} /> Düzenle</button><button type="button" className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50" title="Ders kaydını sil" disabled={removingId !== null} onClick={() => void remove(entry.id)}><Trash2 size={17} /></button></div></article>)}</div></section></>
}
