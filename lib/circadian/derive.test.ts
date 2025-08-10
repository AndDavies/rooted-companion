import { computeCaffeineCutoff, deriveChronotype } from './derive'

describe('circadian derive', () => {
  test('morning + (wake 06:30, bed 22:30) → lark; cutoff 14:30', () => {
    const chron = deriveChronotype({ selfId: 'morning', wakeTime: '06:30', bedtime: '22:30' })
    expect(chron).toBe('lark')
    expect(computeCaffeineCutoff('22:30')).toBe('14:30')
  })

  test('evening + (wake 09:30, bed 01:00) → owl; cutoff 17:00', () => {
    const chron = deriveChronotype({ selfId: 'evening', wakeTime: '09:30', bedtime: '01:00' })
    expect(chron).toBe('owl')
    expect(computeCaffeineCutoff('01:00')).toBe('17:00')
  })

  test('neutral + extreme owl midpoint → owl', () => {
    const chron = deriveChronotype({ selfId: 'neither', wakeTime: '10:00', bedtime: '03:00' })
    expect(chron).toBe('owl')
  })

  test('midnight math wraps positive', () => {
    expect(computeCaffeineCutoff('00:30')).toBe('16:30')
  })
})


