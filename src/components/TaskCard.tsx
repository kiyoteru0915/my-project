import { format, isPast, isToday, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar, Clock, Star, StarOff, Timer, CheckCircle2, AlertCircle } from 'lucide-react'
import { Task, Project } from '../types'
import { useStore } from '../store/useStore'

interface Props {
  task: Task
  project?: Project
  showProject?: boolean
}

const statusConfig = {
  todo: { label: '未着手', className: 'status-badge-todo' },
  'in-progress': { label: '進行中', className: 'status-badge-in-progress' },
  completed: { label: '完了', className: 'status-badge-completed' },
}

export default function TaskCard({ task, project, showProject }: Props) {
  const { setSelectedTaskId, toggleTaskToday, openTimer } = useStore()

  const deadlineDate = parseISO(task.deadline)
  const isDeadlineToday = isToday(deadlineDate)
  const isOverdue = isPast(deadlineDate) && !isToday(deadlineDate) && task.status !== 'completed'

  const completedMilestones = task.milestones.filter((m) => m.completed).length
  const milestoneProgress = task.milestones.length > 0
    ? (completedMilestones / task.milestones.length) * 100
    : 0

  const completedSegments = task.subTaskSegments.filter((s) => s.completed).length
  const totalSegments = task.subTaskSegments.length

  return (
    <div
      className={`bg-white rounded-xl border transition-all duration-200 cursor-pointer group hover:shadow-md hover:-translate-y-0.5 ${
        task.status === 'completed'
          ? 'border-slate-200 opacity-75'
          : isOverdue
          ? 'border-red-200 hover:border-red-300'
          : isDeadlineToday
          ? 'border-amber-200 hover:border-amber-300'
          : 'border-slate-200 hover:border-blue-300'
      }`}
      onClick={() => setSelectedTaskId(task.id)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Status indicator */}
          <div className="flex-shrink-0 mt-0.5">
            {task.status === 'completed' ? (
              <CheckCircle2 size={18} className="text-green-500" />
            ) : isOverdue ? (
              <AlertCircle size={18} className="text-red-400" />
            ) : (
              <div
                className="w-4 h-4 rounded-full border-2 mt-0.5"
                style={{
                  borderColor: project?.color || '#94a3b8',
                  backgroundColor: task.status === 'in-progress' ? (project?.color || '#94a3b8') + '30' : 'transparent',
                }}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`font-medium text-sm leading-snug ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                {task.title}
              </h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={statusConfig[task.status].className}>
                  {statusConfig[task.status].label}
                </span>
              </div>
            </div>

            {/* Project badge */}
            {showProject && project && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-xs text-slate-500">{project.name}</span>
              </div>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {/* Deadline */}
              <div className={`flex items-center gap-1 text-xs ${
                isOverdue ? 'text-red-500 font-medium' : isDeadlineToday ? 'text-amber-600 font-medium' : 'text-slate-400'
              }`}>
                <Calendar size={12} />
                <span>
                  {isOverdue ? '期限超過: ' : isDeadlineToday ? '今日締切: ' : '締切: '}
                  {format(deadlineDate, 'M月d日', { locale: ja })}
                </span>
              </div>

              {/* Estimated time */}
              {task.estimatedMinutes > 0 && (
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={12} />
                  <span>{task.estimatedMinutes}分</span>
                </div>
              )}

              {/* Timer segments progress */}
              {totalSegments > 0 && completedSegments > 0 && (
                <div className="flex items-center gap-1 text-xs text-blue-500">
                  <Timer size={12} />
                  <span>{completedSegments}/{totalSegments}</span>
                </div>
              )}
            </div>

            {/* Milestone progress bar */}
            {task.milestones.length > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>マイルストーン</span>
                  <span>{completedMilestones}/{task.milestones.length}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${milestoneProgress}%`,
                      backgroundColor: project?.color || '#3b82f6',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action bar - always visible on touch, hover on desktop */}
      <div
        className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => toggleTaskToday(task.id)}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-2 py-1 rounded-md ${
            task.isToday
              ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
              : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
          }`}
        >
          {task.isToday ? <Star size={12} fill="currentColor" /> : <StarOff size={12} />}
          {task.isToday ? '今日に設定済み' : '今日に追加'}
        </button>

        {task.status !== 'completed' && task.subTaskSegments.length > 0 && (
          <button
            onClick={() => openTimer(task.id)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors px-2 py-1 rounded-md"
          >
            <Timer size={12} />
            タイマー開始
          </button>
        )}
      </div>
    </div>
  )
}
