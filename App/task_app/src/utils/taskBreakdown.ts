import { MilestoneTask, SubTaskSegment } from '../types'
import { addDays, differenceInDays, format } from 'date-fns'

const milestoneNames = [
  '企画・構成',
  '草案作成',
  '内容確認・修正',
  '最終確認',
  '提出準備',
]

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function generateMilestones(
  _taskTitle: string,
  startDate: Date,
  deadline: Date
): MilestoneTask[] {
  const totalDays = differenceInDays(deadline, startDate)

  if (totalDays <= 0) return []

  let percentages: number[]

  if (totalDays > 21) {
    percentages = [0.2, 0.4, 0.6, 0.8, 0.95]
  } else if (totalDays >= 7) {
    percentages = [0.3, 0.6, 0.9]
  } else {
    percentages = [0.4, 0.8]
  }

  return percentages.map((pct, idx) => {
    const daysOffset = Math.round(totalDays * pct)
    const dueDate = addDays(startDate, daysOffset)
    return {
      id: generateId(),
      name: milestoneNames[idx] ?? `マイルストーン ${idx + 1}`,
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      completed: false,
    }
  })
}

export function generateSubTaskSegments(estimatedMinutes: number): SubTaskSegment[] {
  if (estimatedMinutes <= 30) {
    return [
      { id: generateId(), name: '準備・整理', durationMinutes: 10, completed: false },
      { id: generateId(), name: 'メイン作業', durationMinutes: estimatedMinutes - 10, completed: false },
    ]
  } else if (estimatedMinutes <= 60) {
    return [
      { id: generateId(), name: '準備・整理', durationMinutes: 15, completed: false },
      { id: generateId(), name: 'メイン作業', durationMinutes: 30, completed: false },
      { id: generateId(), name: 'レビュー・修正', durationMinutes: estimatedMinutes - 45, completed: false },
    ]
  } else if (estimatedMinutes <= 90) {
    return [
      { id: generateId(), name: '準備・整理', durationMinutes: 15, completed: false },
      { id: generateId(), name: 'メイン作業', durationMinutes: 45, completed: false },
      { id: generateId(), name: 'レビュー・修正', durationMinutes: 20, completed: false },
      { id: generateId(), name: '最終確認', durationMinutes: estimatedMinutes - 80, completed: false },
    ]
  } else {
    // 120min+: 5 segments proportionally
    const prep = Math.round(estimatedMinutes * 0.1)
    const main = Math.round(estimatedMinutes * 0.45)
    const review = Math.round(estimatedMinutes * 0.25)
    const check = Math.round(estimatedMinutes * 0.12)
    const wrap = estimatedMinutes - prep - main - review - check
    return [
      { id: generateId(), name: '準備・整理', durationMinutes: prep, completed: false },
      { id: generateId(), name: 'メイン作業（前半）', durationMinutes: Math.round(main / 2), completed: false },
      { id: generateId(), name: 'メイン作業（後半）', durationMinutes: main - Math.round(main / 2), completed: false },
      { id: generateId(), name: 'レビュー・修正', durationMinutes: review, completed: false },
      { id: generateId(), name: '最終確認・まとめ', durationMinutes: check + wrap, completed: false },
    ]
  }
}
