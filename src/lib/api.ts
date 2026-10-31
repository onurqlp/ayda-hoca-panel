import { callAppsScript } from './appsScript'
import type { Payment, Teacher, WorkEntry } from '../types'

const requestId = () => crypto.randomUUID()

export async function listTeachers(includeInactive = true): Promise<Teacher[]> {
  return callAppsScript<Teacher[]>('listTeachers', { includeInactive })
}

export async function saveTeacher(input: Partial<Teacher> & { name: string }) {
  return callAppsScript<Teacher>('saveTeacher', input)
}

export async function listMonthEntries(month: string): Promise<WorkEntry[]> {
  return callAppsScript<WorkEntry[]>('listMonthEntries', { month })
}

export async function saveWorkEntry(input: Omit<Partial<WorkEntry>, 'total_amount'> & {
  teacher_id: string
  work_month: string
  entry_type: WorkEntry['entry_type']
  quantity: number
  unit_rate_snapshot: number
  total_amount: number
}) {
  return callAppsScript<WorkEntry>('saveWorkEntry', { ...input, request_id: requestId() })
}

export async function deleteWorkEntry(id: string) {
  await callAppsScript('deleteWorkEntry', { id })
}

export async function listMonthPayments(month: string): Promise<Payment[]> {
  return callAppsScript<Payment[]>('listMonthPayments', { month })
}

export async function savePayment(input: Partial<Payment> & {
  teacher_id: string
  payment_month: string
  amount: number
  paid_at: string
}) {
  return callAppsScript<Payment>('savePayment', { ...input, request_id: requestId() })
}

export async function deletePayment(id: string) {
  await callAppsScript('deletePayment', { id })
}

export async function sourceReferencesExist(refs: string[]): Promise<Set<string>> {
  if (!refs.length) return new Set()
  return new Set(await callAppsScript<string[]>('sourceReferencesExist', { refs }))
}
