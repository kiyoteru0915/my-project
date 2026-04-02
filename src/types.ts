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

export interface Task {
  id: string
  projectId: string
  subFolderId?: string // optional sub-folder
  title: string
  description: string
  deadline: string // ISO date - final deadline
  completionDate?: string // ISO date - when actually completed
  estimatedMinutes: number // for timer
  subTaskSegments: SubTaskSegment[] // time breakdown
  milestones: MilestoneTask[] // auto-generated milestone tasks
  status: 'todo' | 'in-progress' | 'completed'
  isToday: boolean // manually marked for today
  createdAt: string
  timerStartedAt?: string
  timerElapsedSeconds: number
}

export interface Project {
  id: string
  name: string
  color: string
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
