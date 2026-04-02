import { useState } from 'react'
import { format, isToday, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar, CheckCircle2, Clock } from 'lucide-react'
import { useStore } from '../store/useStore'
import TaskCard from './TaskCard'

export default function TodayView() {
  const { tasks, projects } = useStore()
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'completed'>('all')

  const todayTasks = tasks.filter((task) => {
    const isMarkedToday = task.isToday
    const isDeadlineToday = task.deadline === todayStr
    const hasMilestoneToday = task.milestones.some((m) => m.dueDate === todayStr)
    return isMarkedToday || isDeadlineToday || hasMilestoneToday
  })

  const filtered = filter === 'all' ? todayTasks : todayTasks.filter((t) => t.status === filter)

  const completedCount = todayTasks.filter((t) => t.status === 'completed').length
  const inProgressCount = todayTasks.filter((t) => t.status === 'in-progress').length

  const getProject = (projectId: string) => projects.find((p) => p.id === projectId)

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 md:px-8 py-4 md:py-5">
        <div className="flex items-center justify-between">
          <div className="hidden md:flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Calendar size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">今日のタスク</h2>
              <p className="text-sm text-slate-500">
                {format(new Date(), 'yyyy年M月d日（EEEE）', { locale: ja })}
              </p>
            </div>
          </div>
          {/* Mobile: compact date */}
          <p className="md:hidden text-sm text-slate-500">
            {format(new Date(), 'M月d日（EEEE）', { locale: ja })}
          </p>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-blue-500" />
              <span className="font-medium text-blue-600">{inProgressCount}</span>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={13} className="text-green-500" />
              <span className="font-medium text-green-600">{completedCount}</span>
              <span className="hidden sm:inline">/ {todayTasks.length} 完了</span>
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {todayTasks.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>本日の進捗</span>
              <span>{Math.round((completedCount / todayTasks.length) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / todayTasks.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 mt-4">
          {(['all', 'todo', 'in-progress', 'completed'] as const).map((f) => {
            const labels = { all: 'すべて', todo: '未着手', 'in-progress': '進行中', completed: '完了' }
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {labels[f]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Task List */}
      <div className="px-4 md:px-8 py-4 md:py-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">今日のタスクはありません</p>
            <p className="text-sm mt-1">タスクを追加するか、別のプロジェクトのタスクを今日に設定してください</p>
          </div>
        ) : (
          filtered.map((task) => {
            const project = getProject(task.projectId)
            return <TaskCard key={task.id} task={task} project={project} showProject />
          })
        )}
      </div>
    </div>
  )
}
