import { describe, expect, it } from 'vitest'
import { isRemovedTeacher, removedNotes, visibleNotes } from './teacherVisibility'

it('hides removed teachers without deleting notes or history', () => {
  const notes = removedNotes('Önceki not')
  expect(isRemovedTeacher({ notes })).toBe(true)
  expect(visibleNotes(notes)).toBe('Önceki not')
  expect(isRemovedTeacher({ notes: visibleNotes(notes) })).toBe(false)
})
