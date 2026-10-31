import { useState } from 'react'
import { FileSpreadsheet, Upload } from 'lucide-react'
import { importSourceReferences, parseExcel, type ExcelPreview } from '../lib/importExcel'
import { isLikelyDuplicateName, normalizeName } from '../lib/validation'
import { saveTeacher, saveWorkEntry, sourceReferencesExist } from '../lib/api'
import type { Teacher } from '../types'
import { formatTRY } from '../lib/calculations'

export function ExcelImporter({ teachers, onDone }: { teachers: Teacher[]; onDone: () => Promise<void> }) {
  const [year, setYear] = useState('')
  const [preview, setPreview] = useState<ExcelPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function choose(file: File | undefined) {
    if (!file) return
    if (!year || !Number.isInteger(Number(year))) { setMessage('Önce Excel sekmelerinin yılını seçin.'); return }
    setBusy(true); setMessage(''); setPreview(null)
    try { setPreview(await parseExcel(file, Number(year))) } catch (e) { setMessage(e instanceof Error ? e.message : 'Dosya okunamadı.') } finally { setBusy(false) }
  }

  async function importApproved() {
    if (!preview) return
    setBusy(true); setMessage('')
    try {
      const existingRefs = await sourceReferencesExist(preview.entries.flatMap(importSourceReferences))
      const canonical = (value: string) => normalizeName(value).replace(/hoca$/, '')
      const teacherMap = new Map(teachers.map((teacher) => [canonical(teacher.name), teacher]))
      let createdTeachers = 0; let createdEntries = 0
      // Ana öğretmen listesindeki bilgiler önceliklidir; mevcut hocaların fiyatları
      // otomatik güncellenmez (geçmişte kullanılan birim ücretler farklı olabilir).
      for (const source of preview.teacherRows) {
        const key = canonical(source.name)
        if (teacherMap.has(key)) continue
        const created = await saveTeacher({
          name: source.name, phone: source.phone || null, iban: source.iban || null,
          account_holder: source.accountHolder || null,
          group_rate: source.groupRate, private_rate: source.privateRate,
          notes: source.notes || null, active: true,
        })
        teacherMap.set(key, created); createdTeachers++
      }
      for (const row of preview.entries) {
        let teacher = teacherMap.get(canonical(row.teacherName)) ??
          teachers.find((item) => isLikelyDuplicateName(item.name, row.teacherName))
        if (!teacher) {
          teacher = await saveTeacher({ name: row.teacherName, active: true,
            notes: 'Aylık Excel içinde bulundu; ana öğretmen listesinde yok. Bilgileri doğrulayın.' })
          teacherMap.set(canonical(row.teacherName), teacher); createdTeachers++
        }
        if (importSourceReferences(row).some((ref) => existingRefs.has(ref))) continue
        await saveWorkEntry({ teacher_id: teacher.id, work_month: row.workMonth, entry_type: row.entryType, description: row.description || null, quantity: row.quantity, unit_rate_snapshot: row.unitRate, total_amount: row.totalAmount, source_type: 'excel', source_reference: row.sourceReference, requires_review: row.requiresReview, rate_override_reason: null })
        createdEntries++
      }
      setMessage(`${createdTeachers} yeni hoca, ${createdEntries} yeni satır aktarıldı. Tekrar eden satırlar atlandı.`); await onDone()
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Aktarım tamamlanamadı.') } finally { setBusy(false) }
  }

  return <div><div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5"><div className="flex items-center gap-3"><FileSpreadsheet className="text-emerald-700" /><div><p className="font-semibold">HOCA.xlsx</p><p className="text-xs text-slate-500">Dosya tarayıcıda okunur; GitHub'a yüklenmez.</p></div></div><label className="mt-4 block"><span className="label">Sekmelerin yılı *</span><input className="field" type="number" min="2000" max="2100" value={year} placeholder="Örn. 2025" onChange={(e) => { setYear(e.target.value); setPreview(null) }} /></label><label className="btn-primary mt-4 cursor-pointer"><Upload size={17} />{busy ? 'Okunuyor…' : 'Dosya Seç'}<input type="file" accept=".xlsx,.xls" className="hidden" disabled={busy} onClick={(e) => { e.currentTarget.value = '' }} onChange={(e) => void choose(e.target.files?.[0])} /></label></div>
    {preview && <div className="mt-5"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Ana liste satırı</p><p className="text-xl font-bold">{preview.teacherRows.length}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Ders/ek iş satırı</p><p className="text-xl font-bold">{preview.entries.length}</p></div><div className="rounded-xl bg-violet-50 p-3"><p className="text-xs text-violet-700">Kontrol gerekli</p><p className="text-xl font-bold text-violet-900">{preview.entries.filter((x) => x.requiresReview || (x.difference ?? 0) !== 0).length}</p></div></div>
      {preview.warnings.length > 0 && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{preview.warnings.join(' · ')}</div>}
      <div className="mt-4 max-h-64 overflow-auto rounded-xl border"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-50"><tr><th className="p-2">Hoca</th><th className="p-2">Ay</th><th className="p-2">Tür</th><th className="p-2">Hesap</th><th className="p-2">Fark</th></tr></thead><tbody>{preview.entries.slice(0, 100).map((row) => <tr className="border-t" key={row.sourceReference}><td className="p-2 font-medium">{row.teacherName}</td><td className="p-2">{row.workMonth}</td><td className="p-2">{row.entryType}</td><td className="p-2">{formatTRY(row.totalAmount)}</td><td className={`p-2 ${(row.difference ?? 0) !== 0 ? 'font-bold text-red-700' : ''}`}>{row.difference == null ? '—' : formatTRY(row.difference)}</td></tr>)}</tbody></table></div>
      <button className="btn-primary mt-4 w-full" disabled={busy || (preview.entries.length === 0 && preview.teacherRows.length === 0)} onClick={() => void importApproved()}>Ön İzlemeyi Onayla ve Aktar</button></div>}
    {message && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}</div>
}
