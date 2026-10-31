import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { calculateAmount, formatTRY, monthLabel } from '../lib/calculations'
import { deleteWorkEntry, saveWorkEntry } from '../lib/api'
import type { EntryType, Teacher, WorkEntry } from '../types'
import { MonthPicker } from '../components/MonthPicker'

const empty = { id: '', teacherId: '', type: 'group' as EntryType, quantity: '1', rate: '', description: '', overrideReason: '' }

export function WorkEntriesPage({ month, setMonth, teachers, entries, reload }: { month: string; setMonth: (v: string) => void; teachers: Teacher[]; entries: WorkEntry[]; reload: () => Promise<void> }) {
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const teacher = teachers.find((item) => item.id === form.teacherId)
  const defaultRate = form.type === 'group' ? teacher?.group_rate : form.type === 'private' ? teacher?.private_rate : null
  const amount = calculateAmount(Number(form.quantity) || 0, Number(form.rate) || 0)
  const isOverride = form.type !== 'extra' && (defaultRate == null || Number(form.rate) !== Number(defaultRate))

  useEffect(() => {
    if (!form.id && form.type !== 'extra') setForm((old) => ({ ...old, rate: defaultRate == null ? '' : String(defaultRate) }))
  }, [form.teacherId, form.type, form.id, defaultRate])

  const teacherEntries = useMemo(() => entries.filter((item) => !form.teacherId || item.teacher_id === form.teacherId), [entries, form.teacherId])
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setMessage('')
    if (!form.teacherId) return setMessage('Öğretmen seçin.')
    if (!form.rate || Number(form.rate) < 0) return setMessage('Birim ücret belirlenmeden kayıt yapılamaz.')
    if (isOverride && !form.overrideReason.trim()) return setMessage('Farklı birim ücret için açıklama zorunludur.')
    setBusy(true)
    try {
      await saveWorkEntry({ id: form.id || undefined, teacher_id: form.teacherId, work_month: month, entry_type: form.type, quantity: Number(form.quantity), unit_rate_snapshot: Number(form.rate), total_amount: amount, description: form.description || null, rate_override_reason: isOverride ? form.overrideReason : null, source_type: 'manual', requires_review: false })
      setForm({ ...empty, teacherId: form.teacherId }); setMessage('Ders kaydı başarıyla kaydedildi.'); await reload()
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Kayıt başarısız.') } finally { setBusy(false) }
  }
  function edit(entry: WorkEntry) { setForm({ id: entry.id, teacherId: entry.teacher_id, type: entry.entry_type, quantity: String(entry.quantity), rate: String(entry.unit_rate_snapshot), description: entry.description ?? '', overrideReason: entry.rate_override_reason ?? '' }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  async function remove(id: string) { if (!confirm('Bu ders kaydı silinsin mi? İşlem denetim kaydına işlenecek.')) return; await deleteWorkEntry(id); await reload() }

  return <><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold">Saat / Ders Girişi</h1><p className="mt-1 text-sm text-slate-500">Aynı ay içinde farklı ücretli birden fazla kayıt girebilirsiniz.</p></div><MonthPicker value={month} onChange={setMonth} /></div>
    <form className="card p-5 sm:p-6" onSubmit={submit}><div className="grid gap-4 md:grid-cols-2"><label><span className="label">Öğretmen</span><select className="field" required value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}><option value="">Seçin</option>{teachers.filter((x) => x.active || x.id === form.teacherId).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label><span className="label">Ay</span><input className="field" value={monthLabel(month)} disabled /></label></div>
    {teacher && <div className="my-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-blue-50 p-3"><p className="text-xs font-medium text-blue-700">Güncel grup ücreti</p><p className="mt-1 font-bold text-blue-950">{teacher.group_rate == null ? 'Belirlenmedi' : `${formatTRY(teacher.group_rate)} / birim`}</p></div><div className="rounded-xl bg-violet-50 p-3"><p className="text-xs font-medium text-violet-700">Güncel özel ücreti</p><p className="mt-1 font-bold text-violet-950">{teacher.private_rate == null ? 'Belirlenmedi' : `${formatTRY(teacher.private_rate)} / birim`}</p></div></div>}
    <div className="grid gap-4 md:grid-cols-3"><label><span className="label">Kayıt türü</span><select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EntryType, rate: '' })}><option value="group">Grup ders</option><option value="private">Özel ders</option><option value="extra">Ek iş / ödeme</option></select></label><label><span className="label">Ders birimi / miktar</span><input className="field" type="number" min="0" step="0.001" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label><label><span className="label">Uygulanan birim ücret</span><input className="field" type="number" min="0" step="0.01" required value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></label></div>
    {isOverride && <label className="mt-4 block"><span className="label text-amber-700">Ücret düzeltme nedeni *</span><input className="field border-amber-300" value={form.overrideReason} onChange={(e) => setForm({ ...form, overrideReason: e.target.value })} placeholder="Bu kayıtta neden farklı ücret uygulanıyor?" /></label>}
    <label className="mt-4 block"><span className="label">Açıklama</span><textarea className="field" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Video, prim, sınav, Schreiben grubu vb." /></label>
    <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-2xl bg-slate-950 p-4 text-white sm:flex-row sm:items-center"><div><p className="text-xs text-slate-300">Kaydedilecek toplam</p><p className="mt-1 text-2xl font-bold">{formatTRY(amount)}</p></div><div className="flex gap-2">{form.id && <button type="button" className="btn-secondary" onClick={() => setForm(empty)}>Vazgeç</button>}<button className="btn-primary" disabled={busy}><Plus size={18} />{form.id ? 'Kaydı Güncelle' : 'Tek Tıkla Kaydet'}</button></div></div>{message && <p className="mt-4 text-sm font-medium text-ayda-700">{message}</p>}</form>
    <section className="mt-6"><h2 className="mb-3 text-lg font-bold">{monthLabel(month)} kayıtları</h2><div className="space-y-3">{teacherEntries.map((entry) => <article className="card flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center" key={entry.id}><div><p className="font-semibold">{teachers.find((x) => x.id === entry.teacher_id)?.name} · {entry.entry_type === 'group' ? 'Grup' : entry.entry_type === 'private' ? 'Özel' : 'Ek iş'}</p><p className="mt-1 text-sm text-slate-500">{entry.quantity} × {formatTRY(entry.unit_rate_snapshot)} {entry.description ? `· ${entry.description}` : ''}</p></div><div className="flex items-center justify-between gap-3"><p className="font-bold">{formatTRY(entry.total_amount)}</p><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => edit(entry)}><Pencil size={17} /></button><button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => remove(entry.id)}><Trash2 size={17} /></button></div></article>)}</div></section></>
}
