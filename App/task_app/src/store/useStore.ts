import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Task, Project, SubFolder, ViewType, RecurrenceType } from '../types'
import { format, addWeeks, addMonths, addYears, addDays, getDaysInMonth } from 'date-fns'
import { generateMilestones, generateSubTaskSegments } from '../utils/taskBreakdown'
import { pushAllToCloud, pullAllFromCloud, deleteFromCloud } from '../lib/syncService'
import { isSupabaseEnabled } from '../lib/supabase'

// Auto-push tracking: null means "not yet hydrated from localStorage"
let _prevProjects: Project[] | null = null
let _prevSubFolders: SubFolder[] | null = null
let _prevTasks: Task[] | null = null
let _pushTimer: ReturnType<typeof setTimeout> | null = null

function updatePrevRefs(projects: Project[], subFolders: SubFolder[], tasks: Task[]) {
  _prevProjects = projects
  _prevSubFolders = subFolders
  _prevTasks = tasks
}

function generateWorkspaceId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

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


interface TimerState {
  taskId: string | null
  isRunning: boolean
  currentSegmentIndex: number
  segmentElapsedSeconds: number
  totalElapsedSeconds: number
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

interface StoreState {
  projects: Project[]
  subFolders: SubFolder[]
  tasks: Task[]
  currentView: ViewType
  selectedTaskId: string | null
  timerState: TimerState
  isTimerOpen: boolean

  workspaceId: string
  syncStatus: SyncStatus
  lastSyncedAt: string | null

  setCurrentView: (view: ViewType) => void
  setSelectedTaskId: (id: string | null) => void

  syncNow: () => Promise<void>
  pullFromCloud: () => Promise<void>
  switchWorkspace: (id: string) => Promise<boolean>

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
      projects: [],
      subFolders: [],
      tasks: [],
      currentView: 'today',
      selectedTaskId: null,
      isTimerOpen: false,
      timerState: {
        taskId: null, isRunning: false,
        currentSegmentIndex: 0, segmentElapsedSeconds: 0, totalElapsedSeconds: 0,
      },

      workspaceId: generateWorkspaceId(),
      syncStatus: 'idle',
      lastSyncedAt: null,

      setCurrentView: (view) => set({ currentView: view }),
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),

      syncNow: async () => {
        if (!isSupabaseEnabled) return
        const state = get()
        set({ syncStatus: 'syncing' })
        try {
          await pushAllToCloud(state.workspaceId, {
            projects: state.projects,
            subFolders: state.subFolders,
            tasks: state.tasks,
          })
          set({ syncStatus: 'synced', lastSyncedAt: new Date().toISOString() })
        } catch {
          set({ syncStatus: 'error' })
        }
      },

      pullFromCloud: async () => {
        if (!isSupabaseEnabled) return
        const { workspaceId } = get()
        if (!workspaceId) return
        set({ syncStatus: 'syncing' })
        try {
          const data = await pullAllFromCloud(workspaceId)
          if (!data) {
            set({ syncStatus: 'error' })
            return
          }

          const cloudHasData = data.projects.length > 0 || data.tasks.length > 0
          const local = get()
          const localHasData = local.projects.length > 0 || local.tasks.length > 0

          if (!cloudHasData && localHasData) {
            // クラウドにデータがなくローカルにある場合 → ローカルをクラウドへ送信
            await pushAllToCloud(workspaceId, {
              projects: local.projects,
              subFolders: local.subFolders,
              tasks: local.tasks,
            })
            set({ syncStatus: 'synced', lastSyncedAt: new Date().toISOString() })
            return
          }

          const newProjects = cloudHasData ? data.projects : local.projects
          const newSubFolders = cloudHasData ? data.subFolders : local.subFolders
          const newTasks = cloudHasData ? data.tasks : local.tasks
          // Update prev refs BEFORE set() to prevent auto-push from firing
          updatePrevRefs(newProjects, newSubFolders, newTasks)
          set({
            projects: newProjects,
            subFolders: newSubFolders,
            tasks: newTasks,
            syncStatus: 'synced',
            lastSyncedAt: new Date().toISOString(),
          })
        } catch (e) {
          console.error('[Sync] pull error:', e)
          set({ syncStatus: 'error' })
        }
      },

      switchWorkspace: async (id: string) => {
        if (!isSupabaseEnabled) return false
        set({ syncStatus: 'syncing' })
        try {
          const data = await pullAllFromCloud(id)
          // nullはSupabaseエラー。空データは「コードは正しいが未同期」なので許容する
          if (!data) {
            set({ syncStatus: 'error' })
            return false
          }
          // Update prev refs BEFORE set() to prevent auto-push from firing
          updatePrevRefs(data.projects, data.subFolders, data.tasks)
          set({
            workspaceId: id,
            projects: data.projects,
            subFolders: data.subFolders,
            tasks: data.tasks,
            syncStatus: 'synced',
            lastSyncedAt: new Date().toISOString(),
            currentView: 'today',
          })
          return true
        } catch {
          set({ syncStatus: 'error' })
          return false
        }
      },

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
        const { subFolders, tasks, workspaceId } = get()
        const removedSfIds = subFolders.filter((sf) => sf.projectId === id).map((sf) => sf.id)
        const removedTaskIds = tasks.filter((t) => t.projectId === id).map((t) => t.id)
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          subFolders: state.subFolders.filter((sf) => sf.projectId !== id),
          tasks: state.tasks.filter((t) => t.projectId !== id),
          currentView: state.currentView === id ? 'today' : state.currentView,
        }))
        if (isSupabaseEnabled) {
          deleteFromCloud(workspaceId, 'projects', id)
          removedSfIds.forEach((sfId) => deleteFromCloud(workspaceId, 'sub_folders', sfId))
          removedTaskIds.forEach((tId) => deleteFromCloud(workspaceId, 'tasks', tId))
        }
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
        const { workspaceId } = get()
        set((state) => ({
          subFolders: state.subFolders.filter((sf) => sf.id !== id),
          tasks: state.tasks.map((t) => t.subFolderId === id ? { ...t, subFolderId: undefined } : t),
          currentView: state.currentView === `sf:${id}` ? 'today' : state.currentView,
        }))
        if (isSupabaseEnabled) deleteFromCloud(workspaceId, 'sub_folders', id)
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
        const { workspaceId } = get()
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
        if (isSupabaseEnabled) deleteFromCloud(workspaceId, 'tasks', id)
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
        workspaceId: state.workspaceId,
        lastSyncedAt: state.lastSyncedAt,
      }),
      onRehydrateStorage: () => (state) => {
        // After localStorage hydration, initialize prev refs so auto-push
        // doesn't fire for the hydration state change itself
        if (state) {
          updatePrevRefs(state.projects, state.subFolders, state.tasks)
        }
      },
    }
  )
)

// Auto-push to Supabase 2 seconds after data changes (not timer changes, not pulls)
if (isSupabaseEnabled) {
  useStore.subscribe((state) => {
    // _prevProjects is null until localStorage hydration completes — skip until then
    if (_prevProjects === null) return

    const dataChanged =
      state.projects !== _prevProjects ||
      state.subFolders !== _prevSubFolders ||
      state.tasks !== _prevTasks

    _prevProjects = state.projects
    _prevSubFolders = state.subFolders
    _prevTasks = state.tasks

    if (!dataChanged || !state.workspaceId) return

    if (_pushTimer) clearTimeout(_pushTimer)
    useStore.setState({ syncStatus: 'syncing' })
    _pushTimer = setTimeout(async () => {
      const s = useStore.getState()
      try {
        await pushAllToCloud(s.workspaceId, {
          projects: s.projects,
          subFolders: s.subFolders,
          tasks: s.tasks,
        })
        useStore.setState({ syncStatus: 'synced', lastSyncedAt: new Date().toISOString() })
      } catch {
        useStore.setState({ syncStatus: 'error' })
      }
    }, 2000)
  })
}
