import { useMemo, useState } from 'react'
import { Clipboard, FileUp, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import { saveTeacher } from '../lib/api'
import { isRemovedTeacher, removedNotes, visibleNotes } from '../lib/teacherVisibility'
import { formatTRY } from '../lib/calculations'
import { formatIban, isLikelyDuplicateName, validateTurkishIban } from '../lib/validation'
import type { Teacher, TeacherMonthSummary } from '../types'
import { Modal } from '../components/Modal'
import { ExcelImporter } from '../components/ExcelImporter'

const blank = { id: '', name: '', phone: '', iban: '', account_holder: '', group_rate: '', private_rate: '', notes: '', active: true }
type View = 'active' | 'inactive' | 'all' | 'removed'

const teacherPayload = (t: Teacher) => ({
  id: t.id, name: t.name, phone: t.phone, iban: t.iban,
  account_holder: t.account_holder, group_rate: t.group_rate,
  private_rate: t.private_rate, notes: t.notes, active: t.active,
})

export function TeachersPage({ teachers, summaries, reload }: { teachers: Teacher[]; summaries: TeacherMonthSummary[]; reload: () => Promise<void> }) {
  const [search, setSearch] = useState('')
  const [view, setView] = useState<View>('active')
  const [form, setForm] = useState(blank)
  const [open, setOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const present = teachers.filter(t => !isRemovedTeacher(t))
  const removed = teachers.filter(isRemovedTeacher)
  const filtered = useMemo(() => teachers.filter(t => {
    if (!t.name.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))) return false
    if (view === 'removed') return isRemovedTeacher(t)
    if (isRemovedTeacher(t)) return false
    return view === 'all' || t.active === (view === 'active')
  }), [teachers, search, view])
  const activeCount = present.filter(x => x.active).length
  const similar = teachers.find((x) => x.id !== form.id && isLikelyDuplicateName(x.name, form.name))
  const originalName = teachers.find(x => x.id === form.id)?.name
  const duplicateBlocked = Boolean(similar && (!form.id || !originalName || !isLikelyDuplicateName(originalName, form.name)))
  const duplicateName = similar?.name ?? ''
  function edit(t: Teacher) { setForm({ id: t.id, name: t.name, phone: t.phone ?? '', iban: t.iban ?? '', account_holder: t.account_holder ?? '', group_rate: t.group_rate == null ? '' : String(t.group_rate), private_rate: t.private_rate == null ? '' : String(t.private_rate), notes: visibleNotes(t.notes), active: t.active }); setOpen(true) }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setMessage('')
    if (duplicateBlocked) return setMessage('Bu isim zaten kayıtlı: ' + duplicateName + '. Aynı hocayı tekrar eklemek yerine mevcut kaydı düzenleyin.')
    const iban = validateTurkishIban(form.iban)
    if (!iban.valid) return setMessage('IBAN geçerli bir TR IBAN biçiminde değil.')
    setBusy(true)
    try {
      await saveTeacher({
        id: form.id || undefined, name: form.name.trim(),
        phone: form.phone || null, iban: iban.normalized || null,
        account_holder: form.account_holder || null,
        group_rate: form.group_rate === '' ? null : Number(form.group_rate),
        private_rate: form.private_rate === '' ? null : Number(form.private_rate),
        notes: form.notes || null, active: form.active,
      })
      await reload()
      setOpen(false); setForm(blank)
      setMessage('Hoca bilgileri Google Sheets\'e kaydedildi.')
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Kaydedilemedi.') }
    finally { setBusy(false) }
  }
  async function remove(teacher: Teacher) {
    if (!confirm(teacher.name + ' listeden silinsin mi? Eski ders ve ödeme kayıtları korunur; Silinenler bölümünden geri getirebilirsiniz.')) return
    setBusy(true); setMessage('')
    try {
      await saveTeacher({ ...teacherPayload(teacher), active: false, notes: removedNotes(teacher.notes) })
      await reload()
      setMessage(teacher.name + ' silindi. Geçmiş kayıtları korunuyor.')
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Hoca silinemedi.') }
    finally { setBusy(false) }
  }

  async function restore(teacher: Teacher) {
    setBusy(true); setMessage('')
    try {
      await saveTeacher({ ...teacherPayload(teacher), active: false, notes: visibleNotes(teacher.notes) })
      await reload()
      setMessage(teacher.name + ' geri getirildi. Pasif hocalar bölümünden tekrar aktif yapılabilir.')
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Geri getirme başarısız.') }
    finally { setBusy(false) }
  }

  return <><div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold">Hocalar</h1><p className="mt-1 text-sm text-slate-500">Güncel ücretler yeni derslere uygulanır. Silinen hocaların geçmiş ödemeleri korunur.</p></div><div className="flex gap-2"><button className="btn-secondary" onClick={() => setImportOpen(true)}><FileUp size={17} /> Excel'den Aktar</button><button className="btn-primary" onClick={() => { setForm(blank); setOpen(true) }}><Plus size={17} /> Yeni Hoca Ekle</button></div></div>
    <label className="relative mb-5 block"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input className="field pl-10" placeholder="Hoca ara" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
    <div className="mb-4 flex flex-wrap gap-2">
      <button className={`rounded-xl px-4 py-2 text-sm font-semibold ${view === 'active' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`} onClick={() => setView('active')}>Aktif hocalar ({activeCount})</button>
      <button className={`rounded-xl px-4 py-2 text-sm font-semibold ${view === 'inactive' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}`} onClick={() => setView('inactive')}>Pasif hocalar ({present.length - activeCount})</button>
      <button className={`rounded-xl px-4 py-2 text-sm font-semibold ${view === 'all' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'}`} onClick={() => setView('all')}>Tümü ({present.length})</button>
      {removed.length > 0 && <button className={`rounded-xl px-4 py-2 text-sm font-semibold ${view === 'removed' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`} onClick={() => setView('removed')}>Silinenler ({removed.length})</button>}
    </div>{message && <p role="status" className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}{filtered.length === 0 && <div className="card p-7 text-center text-sm text-slate-500">Bu bölümde hoca bulunamadı.</div>}<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((teacher) => { const current = summaries.find((x) => x.teacher.id === teacher.id); return <article className={`card border-t-4 p-5 ${teacher.active ? 'border-t-emerald-400' : 'border-t-slate-300 bg-slate-50'}`} key={teacher.id}><div className="flex items-start justify-between"><div><p className="font-bold">{teacher.name}</p><p className="mt-1 text-xs text-slate-500">{isRemovedTeacher(teacher) ? 'Silinen hoca' : teacher.active ? '🟢 Aktif' : '⚪ Pasif'} · Ders hakedişi {current ? formatTRY(current.entitlement) : 'kayıt yok'}</p></div>{isRemovedTeacher(teacher)
        ? <button type="button" className="btn-secondary px-3 py-2" disabled={busy} onClick={() => void restore(teacher)}><RotateCcw size={15} /> Geri getir</button>
        : <div className="flex items-center gap-1">
            <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Hocayı düzenle" onClick={() => edit(teacher)}><Pencil size={17} /></button>
            <button type="button" className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Hocayı sil" disabled={busy} onClick={() => void remove(teacher)}><Trash2 size={17} /></button>
          </div>}</div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-blue-50 p-3"><p className="text-xs text-blue-700">Grup</p><p className="mt-1 font-bold text-blue-950">{teacher.group_rate == null ? 'Belirlenmedi' : formatTRY(teacher.group_rate)}</p></div><div className="rounded-xl bg-violet-50 p-3"><p className="text-xs text-violet-700">Özel</p><p className="mt-1 font-bold text-violet-950">{teacher.private_rate == null ? 'Belirlenmedi' : formatTRY(teacher.private_rate)}</p></div></div>{!isRemovedTeacher(teacher) && teacher.iban && <button onClick={() => navigator.clipboard.writeText(teacher.iban!)} className="mt-4 flex items-center gap-2 text-xs text-slate-600 hover:text-ayda-700"><Clipboard size={14} /> {formatIban(teacher.iban)}</button>}</article> })}</div>
    {open && <Modal title={form.id ? 'Hoca Bilgilerini Düzenle' : 'Yeni Hoca Ekle'} onClose={() => setOpen(false)}><form onSubmit={submit} className="space-y-4"><label><span className="label">Ad soyad *</span><input className="field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>{duplicateBlocked && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Benzer kayıt bulundu: <b>{duplicateName}</b>. Aynı kişi olup olmadığını kontrol edin.</p>}<div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Telefon</span><input className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label><span className="label">Hesap sahibi</span><input className="field" value={form.account_holder} onChange={(e) => setForm({ ...form, account_holder: e.target.value })} /></label></div><label><span className="label">IBAN</span><input className="field font-mono" value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} /></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Grup birim ücreti (TL)</span><input className="field" type="number" min="0" step="0.01" value={form.group_rate} onChange={(e) => setForm({ ...form, group_rate: e.target.value })} /></label><label><span className="label">Özel birim ücreti (TL)</span><input className="field" type="number" min="0" step="0.01" value={form.private_rate} onChange={(e) => setForm({ ...form, private_rate: e.target.value })} /></label></div><label><span className="label">Not</span><textarea className="field" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Aktif hoca</label>{message && <p className="text-sm text-red-700">{message}</p>}<button className="btn-primary w-full" disabled={busy || duplicateBlocked}>{busy ? 'Kaydediliyor...' : form.id ? 'Değişiklikleri Kaydet' : 'Hocayı Kaydet'}</button></form></Modal>}
    {importOpen && <Modal title="Excel'den Aktar" wide onClose={() => setImportOpen(false)}><ExcelImporter teachers={teachers} onDone={reload} /></Modal>}</>
}
