import { useCallback, useEffect, useMemo, useState } from 'react'
import { listMonthEntries, listMonthPayments, listTeachers } from '../lib/api'
import type { Payment, Teacher, TeacherMonthSummary, WorkEntry } from '../types'

export function usePanelData(month: string) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [entries, setEntries] = useState<WorkEntry[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [teacherRows, entryRows, paymentRows] = await Promise.all([
        listTeachers(), listMonthEntries(month), listMonthPayments(month),
      ])
      setTeachers(teacherRows); setEntries(entryRows); setPayments(paymentRows)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Veriler alınamadı.')
    } finally { setLoading(false) }
  }, [month])

  useEffect(() => { void reload() }, [reload])

  const summaries = useMemo<TeacherMonthSummary[]>(() => teachers.map((teacher) => {
    const teacherEntries = entries.filter((item) => item.teacher_id === teacher.id)
    const teacherPayments = payments.filter((item) => item.teacher_id === teacher.id)
    const entitlement = teacherEntries.reduce((sum, item) => sum + Number(item.total_amount), 0)
    const paid = teacherPayments.reduce((sum, item) => sum + Number(item.amount), 0)
    return {
      teacher, entries: teacherEntries, payments: teacherPayments, entitlement, paid,
      remaining: Math.max(0, entitlement - paid),
      groupQuantity: teacherEntries.filter((item) => item.entry_type === 'group').reduce((sum, item) => sum + Number(item.quantity), 0),
      privateQuantity: teacherEntries.filter((item) => item.entry_type === 'private').reduce((sum, item) => sum + Number(item.quantity), 0),
      extras: teacherEntries.filter((item) => item.entry_type === 'extra').reduce((sum, item) => sum + Number(item.total_amount), 0),
      requiresReview: teacherEntries.some((item) => item.requires_review),
    }
  }).filter((summary) => summary.entries.length || summary.payments.length), [teachers, entries, payments])

  return { teachers, entries, payments, summaries, loading, error, reload }
}
