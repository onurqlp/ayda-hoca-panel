import { callAppsScript } from './appsScript'
import { mergeMonthRows, monthLookupKeys } from './monthLookup'
import type { Payment, Teacher, WorkEntry } from '../types'

const requestId = () => crypto.randomUUID()

export async function listTeachers(includeInactive = true): Promise<Teacher[]> {
  return callAppsScript<Teacher[]>('listTeachers', { includeInactive })
}

export async function saveTeacher(input: Partial<Teacher> & { name: string }) {
  return callAppsScript<Teacher>('saveTeacher', input)
}


async function listByMonth<T extends { id: string }>(
  action: 'listMonthEntries' | 'listMonthPayments',
  month: string, field: 'work_month' | 'payment_month',
): Promise<T[]> {
  const sets = await Promise.all(
    monthLookupKeys(month).map(key => callAppsScript<T[]>(action, { month: key })),
  )
  return mergeMonthRows(sets, month, field)
}

export async function listMonthEntries(month: string): Promise<WorkEntry[]> {
  return listByMonth<WorkEntry>('listMonthEntries', month, 'work_month')
}

export async function listMonthPayments(month: string): Promise<Payment[]> {
  return listByMonth<Payment>('listMonthPayments', month, 'payment_month')
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
