import type { Teacher } from '../types'

// Keep teacher IDs in accounting records; only hide the teacher from active lists.
const marker = '[AYDA_TEACHER_REMOVED]'
export function isRemovedTeacher(teacher: Pick<Teacher, 'notes'>): boolean {
  return (teacher.notes ?? '').includes(marker)
}
export function visibleNotes(notes: string | null | undefined): string {
  return (notes ?? '').replaceAll(marker, '').trim()
}
export function removedNotes(notes: string | null | undefined): string {
  return [visibleNotes(notes), marker].filter(Boolean).join('\n')
}
