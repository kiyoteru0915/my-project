export interface SubTaskSegment {
  id: string
  name: string
  durationMinutes: number
  completed: boolean
}

export interface MilestoneTask {
  id: string
  name: string
  dueDate: string // ISO date
  completed: boolean
  completedDate?: string
}

export type RecurrenceType = 'none' | 'weekly' | 'monthly' | 'yearly'

export interface Task {
  id: string
  projectId: string
  subFolderId?: string
  title: string
  description: string
  deadline: string // ISO date - final deadline
  completionDate?: string // ISO date - when actually completed
  estimatedMinutes: number
  subTaskSegments: SubTaskSegment[]
  milestones: MilestoneTask[]
  status: 'todo' | 'in-progress' | 'completed'
  isToday: boolean
  recurrence: RecurrenceType // 繰り返し設定
  recurrenceDay?: number   // 毎週: 0=日〜6=土、毎月: 1〜31
  order: number // 表示順
  createdAt: string
  timerStartedAt?: string
  timerElapsedSeconds: number
}

export interface Project {
  id: string
  name: string
  color: string
  order: number // 表示順
  createdAt: string
}

export interface SubFolder {
  id: string
  projectId: string
  name: string
  createdAt: string
}

// ViewType: 'today' | projectId | 'sf:{subFolderId}'
export type ViewType = 'today' | string
