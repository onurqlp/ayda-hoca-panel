import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { listMonthEntries, listMonthPayments, listTeachers } from '../lib/api'
import { workMonthForPaymentMonth } from '../lib/dates'
import type { Payment, Teacher, TeacherMonthSummary, WorkEntry } from '../types'

export function usePanelData(paymentMonth: string) {
  const workMonth = workMonthForPaymentMonth(paymentMonth)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [entries, setEntries] = useState<WorkEntry[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const requestCounter = useRef(0)

  const reload = useCallback(async () => {
    const id = ++requestCounter.current
    setLoading(true)
    setError('')
    try {
      const [teacherRows, entryRows, paymentRows] = await Promise.all([
        listTeachers(), listMonthEntries(workMonth), listMonthPayments(paymentMonth),
      ])
      if (id !== requestCounter.current) return
      setTeachers(teacherRows)
      setEntries(entryRows)
      setPayments(paymentRows)
      setLastUpdatedAt(new Date().toISOString())
    } catch (reason) {
      if (id === requestCounter.current) {
        setError(reason instanceof Error ? reason.message : 'Google Sheets okunamadı.')
      }
      throw reason
    } finally {
      if (id === requestCounter.current) setLoading(false)
    }
  }, [workMonth, paymentMonth])

  useEffect(() => { void reload().catch(() => {}) }, [reload])
  useEffect(() => {
    const onFocus = () => { void reload().catch(() => {}) }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [reload])

  const summaries = useMemo<TeacherMonthSummary[]>(() => teachers.map(teacher => {
    const teacherEntries = entries.filter(item => item.teacher_id === teacher.id)
    const teacherPayments = payments.filter(item => item.teacher_id === teacher.id)
    const entitlement = teacherEntries.reduce((sum, item) => sum + Number(item.total_amount), 0)
    const paid = teacherPayments.reduce((sum, item) => sum + Number(item.amount), 0)
    return {
      teacher, entries: teacherEntries, payments: teacherPayments, entitlement, paid,
      remaining: Math.max(0, entitlement - paid),
      groupQuantity: teacherEntries.filter(item => item.entry_type === 'group').reduce((sum, item) => sum + Number(item.quantity), 0),
      privateQuantity: teacherEntries.filter(item => item.entry_type === 'private').reduce((sum, item) => sum + Number(item.quantity), 0),
      extras: teacherEntries.filter(item => item.entry_type === 'extra').reduce((sum, item) => sum + Number(item.total_amount), 0),
      requiresReview: teacherEntries.some(item => item.requires_review),
    }
  }).filter(item => item.entries.length || item.payments.length), [teachers, entries, payments])

  return { teachers, entries, payments, summaries, loading, error, lastUpdatedAt, reload }
}
