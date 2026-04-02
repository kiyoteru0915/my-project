import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Task, Project, SubFolder, ViewType, RecurrenceType } from '../types'
import { format, addWeeks, addMonths, addYears, addDays, getDaysInMonth } from 'date-fns'
import { generateMilestones, generateSubTaskSegments } from '../utils/taskBreakdown'

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

function nextDeadline(deadline: string, recurrence: RecurrenceType, recurrenceDay?: number): string {
  const date = new Date(deadline)
  if (recurrence === 'weekly') {
    if (recurrenceDay !== undefined) {
      // 次の指定曜日を探す（1週後以降）
      let next = addWeeks(date, 1)
      while (next.getDay() !== recurrenceDay) {
        next = addDays(next, 1)
      }
      return format(next, 'yyyy-MM-dd')
    }
    return format(addWeeks(date, 1), 'yyyy-MM-dd')
  }
  if (recurrence === 'monthly') {
    if (recurrenceDay !== undefined) {
      // 翌月の指定日（月末を超えない）
      const next = addMonths(date, 1)
      const maxDay = getDaysInMonth(next)
      next.setDate(Math.min(recurrenceDay, maxDay))
      return format(next, 'yyyy-MM-dd')
    }
    return format(addMonths(date, 1), 'yyyy-MM-dd')
  }
  if (recurrence === 'yearly') return format(addYears(date, 1), 'yyyy-MM-dd')
  return deadline
}

const today = format(new Date(), 'yyyy-MM-dd')
const todayDate = new Date()

const sampleProjects: Project[] = [
  { id: 'proj-marketing', name: 'マーケティング', color: '#8b5cf6', order: 0, createdAt: new Date().toISOString() },
  { id: 'proj-product', name: '製品開発', color: '#06b6d4', order: 1, createdAt: new Date().toISOString() },
]

const sampleSubFolders: SubFolder[] = [
  { id: 'sf-pr', projectId: 'proj-marketing', name: 'プレスリリース', createdAt: new Date().toISOString() },
  { id: 'sf-sns', projectId: 'proj-marketing', name: 'SNS', createdAt: new Date().toISOString() },
]

const deadline1 = new Date(todayDate); deadline1.setDate(deadline1.getDate() + 30)
const deadline2 = new Date(todayDate); deadline2.setDate(deadline2.getDate() + 14)
const deadline3 = new Date(todayDate); deadline3.setDate(deadline3.getDate() + 7)
const deadline4 = new Date(todayDate); deadline4.setDate(deadline4.getDate() + 45)

const sampleTasks: Task[] = [
  {
    id: 'task-1', projectId: 'proj-marketing', subFolderId: 'sf-pr',
    title: 'プレスリリース作成', description: '新製品ローンチに向けたプレスリリースの作成と配信準備',
    deadline: format(deadline1, 'yyyy-MM-dd'), estimatedMinutes: 90,
    subTaskSegments: generateSubTaskSegments(90),
    milestones: generateMilestones('プレスリリース作成', todayDate, deadline1),
    status: 'in-progress', isToday: true, recurrence: 'none', order: 0,
    createdAt: new Date().toISOString(), timerElapsedSeconds: 0,
  },
  {
    id: 'task-2', projectId: 'proj-marketing', subFolderId: 'sf-sns',
    title: 'SNSキャンペーン企画', description: '夏季キャンペーンのSNS戦略立案とコンテンツ計画',
    deadline: format(deadline2, 'yyyy-MM-dd'), estimatedMinutes: 60,
    subTaskSegments: generateSubTaskSegments(60),
    milestones: generateMilestones('SNSキャンペーン企画', todayDate, deadline2),
    status: 'todo', isToday: false, recurrence: 'monthly', order: 1,
    createdAt: new Date().toISOString(), timerElapsedSeconds: 0,
  },
  {
    id: 'task-3', projectId: 'proj-marketing',
    title: '市場調査レポート', description: '競合他社分析と市場トレンドのレポートまとめ',
    deadline: today, estimatedMinutes: 120,
    subTaskSegments: generateSubTaskSegments(120), milestones: [],
    status: 'todo', isToday: false, recurrence: 'none', order: 2,
    createdAt: new Date().toISOString(), timerElapsedSeconds: 0,
  },
  {
    id: 'task-4', projectId: 'proj-product',
    title: 'UI/UXデザインレビュー', description: '新機能のUI/UXデザインのレビューとフィードバック',
    deadline: format(deadline3, 'yyyy-MM-dd'), estimatedMinutes: 60,
    subTaskSegments: generateSubTaskSegments(60),
    milestones: generateMilestones('UI/UXデザインレビュー', todayDate, deadline3),
    status: 'in-progress', isToday: true, recurrence: 'none', order: 0,
    createdAt: new Date().toISOString(), timerElapsedSeconds: 0,
  },
  {
    id: 'task-5', projectId: 'proj-product',
    title: 'APIドキュメント整備', description: '新しいAPIエンドポイントのドキュメント作成と整備',
    deadline: format(deadline4, 'yyyy-MM-dd'), estimatedMinutes: 120,
    subTaskSegments: generateSubTaskSegments(120),
    milestones: generateMilestones('APIドキュメント整備', todayDate, deadline4),
    status: 'todo', isToday: false, recurrence: 'none', order: 1,
    createdAt: new Date().toISOString(), timerElapsedSeconds: 0,
  },
]

interface TimerState {
  taskId: string | null
  isRunning: boolean
  currentSegmentIndex: number
  segmentElapsedSeconds: number
  totalElapsedSeconds: number
}

interface StoreState {
  projects: Project[]
  subFolders: SubFolder[]
  tasks: Task[]
  currentView: ViewType
  selectedTaskId: string | null
  timerState: TimerState
  isTimerOpen: boolean

  setCurrentView: (view: ViewType) => void
  setSelectedTaskId: (id: string | null) => void

  addProject: (name: string, color: string) => void
  deleteProject: (id: string) => void
  reorderProjects: (orderedIds: string[]) => void

  addSubFolder: (projectId: string, name: string) => void
  deleteSubFolder: (id: string) => void

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'timerElapsedSeconds' | 'order'> & { generateBreakdown?: boolean }) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTaskToday: (id: string) => void
  toggleMilestone: (taskId: string, milestoneId: string) => void
  completeSegment: (taskId: string, segmentId: string) => void
  reorderTasks: (projectId: string, orderedIds: string[]) => void

  startTimer: (taskId: string) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  tickTimer: () => void
  nextSegment: () => void
  openTimer: (taskId: string) => void
  closeTimer: () => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      projects: sampleProjects,
      subFolders: sampleSubFolders,
      tasks: sampleTasks,
      currentView: 'today',
      selectedTaskId: null,
      isTimerOpen: false,
      timerState: {
        taskId: null, isRunning: false,
        currentSegmentIndex: 0, segmentElapsedSeconds: 0, totalElapsedSeconds: 0,
      },

      setCurrentView: (view) => set({ currentView: view }),
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),

      addProject: (name, color) => {
        const { projects } = get()
        const project: Project = {
          id: generateId(), name, color,
          order: projects.length,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ projects: [...state.projects, project] }))
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          subFolders: state.subFolders.filter((sf) => sf.projectId !== id),
          tasks: state.tasks.filter((t) => t.projectId !== id),
          currentView: state.currentView === id ? 'today' : state.currentView,
        }))
      },

      reorderProjects: (orderedIds) => {
        set((state) => ({
          projects: state.projects
            .map((p) => ({ ...p, order: orderedIds.indexOf(p.id) }))
            .sort((a, b) => a.order - b.order),
        }))
      },

      addSubFolder: (projectId, name) => {
        const sf: SubFolder = { id: generateId(), projectId, name, createdAt: new Date().toISOString() }
        set((state) => ({ subFolders: [...state.subFolders, sf] }))
      },

      deleteSubFolder: (id) => {
        set((state) => ({
          subFolders: state.subFolders.filter((sf) => sf.id !== id),
          tasks: state.tasks.map((t) => t.subFolderId === id ? { ...t, subFolderId: undefined } : t),
          currentView: state.currentView === `sf:${id}` ? 'today' : state.currentView,
        }))
      },

      addTask: (taskData) => {
        const { generateBreakdown, ...rest } = taskData as typeof taskData & { generateBreakdown?: boolean }
        const { tasks } = get()
        const projectTasks = tasks.filter((t) => t.projectId === rest.projectId)

        let milestones = rest.milestones || []
        let subTaskSegments = rest.subTaskSegments || []

        if (generateBreakdown && rest.deadline) {
          milestones = generateMilestones(rest.title, new Date(), new Date(rest.deadline))
        }
        if (rest.estimatedMinutes && subTaskSegments.length === 0) {
          subTaskSegments = generateSubTaskSegments(rest.estimatedMinutes)
        }

        const task: Task = {
          id: generateId(),
          createdAt: new Date().toISOString(),
          timerElapsedSeconds: 0,
          order: projectTasks.length,
          ...rest,
          milestones,
          subTaskSegments,
        }
        set((state) => ({ tasks: [...state.tasks, task] }))
      },

      updateTask: (id, updates) => {
        const { tasks } = get()
        const task = tasks.find((t) => t.id === id)

        // 繰り返しタスクが完了になった場合、次回のタスクを自動作成
        if (
          updates.status === 'completed' &&
          task &&
          task.recurrence !== 'none' &&
          task.status !== 'completed'
        ) {
          const newDeadline = nextDeadline(task.deadline, task.recurrence, task.recurrenceDay)
          const newTask: Task = {
            ...task,
            id: generateId(),
            title: task.title,
            status: 'todo',
            isToday: false,
            completionDate: undefined,
            timerElapsedSeconds: 0,
            timerStartedAt: undefined,
            deadline: newDeadline,
            order: tasks.filter((t) => t.projectId === task.projectId).length,
            milestones: generateMilestones(task.title, new Date(), new Date(newDeadline)),
            subTaskSegments: generateSubTaskSegments(task.estimatedMinutes),
            createdAt: new Date().toISOString(),
          }
          set((state) => ({
            tasks: [
              ...state.tasks.map((t) =>
                t.id === id
                  ? { ...t, ...updates, completionDate: updates.completionDate ?? format(new Date(), 'yyyy-MM-dd') }
                  : t
              ),
              newTask,
            ],
          }))
          return
        }

        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }))
      },

      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
      },

      toggleTaskToday: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) => t.id === id ? { ...t, isToday: !t.isToday } : t),
        }))
      },

      toggleMilestone: (taskId, milestoneId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t
            return {
              ...t,
              milestones: t.milestones.map((m) =>
                m.id === milestoneId
                  ? { ...m, completed: !m.completed, completedDate: !m.completed ? format(new Date(), 'yyyy-MM-dd') : undefined }
                  : m
              ),
            }
          }),
        }))
      },

      completeSegment: (taskId, segmentId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t
            return { ...t, subTaskSegments: t.subTaskSegments.map((s) => s.id === segmentId ? { ...s, completed: true } : s) }
          }),
        }))
      },

      reorderTasks: (projectId, orderedIds) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.projectId !== projectId) return t
            const idx = orderedIds.indexOf(t.id)
            return idx >= 0 ? { ...t, order: idx } : t
          }),
        }))
      },

      openTimer: (taskId) => {
        const { timerState } = get()
        if (timerState.taskId !== taskId) {
          set({ isTimerOpen: true, timerState: { taskId, isRunning: false, currentSegmentIndex: 0, segmentElapsedSeconds: 0, totalElapsedSeconds: 0 } })
        } else {
          set({ isTimerOpen: true })
        }
      },

      closeTimer: () => set({ isTimerOpen: false }),

      startTimer: (taskId) => {
        set({ timerState: { taskId, isRunning: true, currentSegmentIndex: 0, segmentElapsedSeconds: 0, totalElapsedSeconds: 0 } })
        get().updateTask(taskId, { status: 'in-progress', timerStartedAt: new Date().toISOString() })
      },

      pauseTimer: () => set((state) => ({ timerState: { ...state.timerState, isRunning: false } })),
      resumeTimer: () => set((state) => ({ timerState: { ...state.timerState, isRunning: true } })),

      stopTimer: () => {
        const { timerState } = get()
        if (timerState.taskId) {
          get().updateTask(timerState.taskId, { timerElapsedSeconds: timerState.totalElapsedSeconds })
        }
        set({ timerState: { taskId: null, isRunning: false, currentSegmentIndex: 0, segmentElapsedSeconds: 0, totalElapsedSeconds: 0 }, isTimerOpen: false })
      },

      tickTimer: () => {
        const { timerState, tasks } = get()
        if (!timerState.isRunning || !timerState.taskId) return
        const task = tasks.find((t) => t.id === timerState.taskId)
        if (!task) return
        const currentSegment = task.subTaskSegments[timerState.currentSegmentIndex]
        if (!currentSegment) return

        const segmentDurationSeconds = currentSegment.durationMinutes * 60
        const newSegmentElapsed = timerState.segmentElapsedSeconds + 1
        const newTotalElapsed = timerState.totalElapsedSeconds + 1

        if (newSegmentElapsed >= segmentDurationSeconds) {
          get().completeSegment(timerState.taskId, currentSegment.id)
          const nextIndex = timerState.currentSegmentIndex + 1
          const allDone = nextIndex >= task.subTaskSegments.length
          if (allDone) {
            get().updateTask(timerState.taskId, { status: 'completed', completionDate: format(new Date(), 'yyyy-MM-dd'), timerElapsedSeconds: newTotalElapsed })
            set({ timerState: { ...timerState, isRunning: false, segmentElapsedSeconds: segmentDurationSeconds, totalElapsedSeconds: newTotalElapsed, currentSegmentIndex: nextIndex } })
          } else {
            set({ timerState: { ...timerState, currentSegmentIndex: nextIndex, segmentElapsedSeconds: 0, totalElapsedSeconds: newTotalElapsed } })
          }
        } else {
          set({ timerState: { ...timerState, segmentElapsedSeconds: newSegmentElapsed, totalElapsedSeconds: newTotalElapsed } })
        }
      },

      nextSegment: () => {
        const { timerState, tasks } = get()
        if (!timerState.taskId) return
        const task = tasks.find((t) => t.id === timerState.taskId)
        if (!task) return
        const currentSegment = task.subTaskSegments[timerState.currentSegmentIndex]
        if (currentSegment) get().completeSegment(timerState.taskId, currentSegment.id)
        const nextIndex = timerState.currentSegmentIndex + 1
        if (nextIndex >= task.subTaskSegments.length) {
          get().updateTask(timerState.taskId, { status: 'completed', completionDate: format(new Date(), 'yyyy-MM-dd') })
          set({ timerState: { ...timerState, isRunning: false, currentSegmentIndex: nextIndex } })
        } else {
          set({ timerState: { ...timerState, currentSegmentIndex: nextIndex, segmentElapsedSeconds: 0 } })
        }
      },
    }),
    {
      name: 'task-manager-storage',
      partialize: (state) => ({
        projects: state.projects,
        subFolders: state.subFolders,
        tasks: state.tasks,
        timerState: state.timerState,
      }),
    }
  )
)
