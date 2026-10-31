export type EntryType = 'group' | 'private' | 'extra'
export type SourceType = 'manual' | 'excel'

export interface Teacher {
  id: string
  name: string
  phone: string | null
  iban: string | null
  account_holder: string | null
  group_rate: number | null
  private_rate: number | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface WorkEntry {
  id: string
  teacher_id: string
  work_month: string
  entry_type: EntryType
  description: string | null
  quantity: number
  unit_rate_snapshot: number
  total_amount: number
  rate_override_reason: string | null
  source_type: SourceType
  source_reference: string | null
  requires_review: boolean
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  teacher_id: string
  payment_month: string
  amount: number
  paid_at: string
  note: string | null
  created_at: string
  updated_at: string
}

export interface TeacherMonthSummary {
  teacher: Teacher
  entries: WorkEntry[]
  payments: Payment[]
  entitlement: number
  paid: number
  remaining: number
  groupQuantity: number
  privateQuantity: number
  extras: number
  requiresReview: boolean
}
