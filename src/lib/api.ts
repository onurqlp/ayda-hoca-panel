import { requireSupabase } from './supabase'
import type { Payment, Teacher, WorkEntry } from '../types'

const db = () => requireSupabase()

export async function listTeachers(includeInactive = true): Promise<Teacher[]> {
  let query = db().from('teachers').select('*').order('name')
  if (!includeInactive) query = query.eq('active', true)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Teacher[]
}

export async function saveTeacher(input: Partial<Teacher> & { name: string }) {
  const payload = { ...input, updated_at: new Date().toISOString() }
  const query = input.id
    ? db().from('teachers').update(payload).eq('id', input.id)
    : db().from('teachers').insert(payload)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data as Teacher
}

export async function listMonthEntries(month: string): Promise<WorkEntry[]> {
  const { data, error } = await db().from('work_entries').select('*').eq('work_month', month)
  if (error) throw error
  return (data ?? []) as WorkEntry[]
}

export async function saveWorkEntry(input: Omit<Partial<WorkEntry>, 'total_amount'> & {
  teacher_id: string
  work_month: string
  entry_type: WorkEntry['entry_type']
  quantity: number
  unit_rate_snapshot: number
  total_amount: number
}) {
  const query = input.id
    ? db().from('work_entries').update(input).eq('id', input.id)
    : db().from('work_entries').insert(input)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data as WorkEntry
}

export async function deleteWorkEntry(id: string) {
  const { error } = await db().from('work_entries').delete().eq('id', id)
  if (error) throw error
}

export async function listMonthPayments(month: string): Promise<Payment[]> {
  const { data, error } = await db().from('payments').select('*').eq('payment_month', month)
  if (error) throw error
  return (data ?? []) as Payment[]
}

export async function savePayment(input: Partial<Payment> & {
  teacher_id: string
  payment_month: string
  amount: number
  paid_at: string
}) {
  const query = input.id
    ? db().from('payments').update(input).eq('id', input.id)
    : db().from('payments').insert(input)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data as Payment
}

export async function deletePayment(id: string) {
  const { error } = await db().from('payments').delete().eq('id', id)
  if (error) throw error
}

export async function sourceReferencesExist(refs: string[]): Promise<Set<string>> {
  if (!refs.length) return new Set()
  const { data, error } = await db()
    .from('work_entries')
    .select('source_reference')
    .in('source_reference', refs)
  if (error) throw error
  return new Set((data ?? []).map((item) => item.source_reference).filter(Boolean))
}
