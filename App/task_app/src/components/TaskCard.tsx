import { format, isPast, isToday, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar, CalendarCheck, Clock, Star, StarOff, Timer, CheckCircle2, AlertCircle, Circle, Minus } from 'lucide-react'
import { Task, Project } from '../types'
import { useStore } from '../store/useStore'

interface Props {
  task: Task
  project?: Project
  showProject?: boolean
}

export default function TaskCard({ task, project, showProject }: Props) {
  const { setSelectedTaskId, toggleTaskToday, openTimer, updateTask, toggleMilestone } = useStore()

  const deadlineDate = parseISO(task.deadline)
  const isDeadlineToday = isToday(deadlineDate)
  const isOverdue = isPast(deadlineDate) && !isToday(deadlineDate) && task.status !== 'completed'

  // ステータスを順番にサイクル（クリックで切り替え）
  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = task.status === 'todo' ? 'in-progress' : task.status === 'in-progress' ? 'completed' : 'todo'
    updateTask(task.id, {
      status: next,
      completionDate: next === 'completed' ? format(new Date(), 'yyyy-MM-dd') : undefined,
    })
  }

  const accentColor = project?.color || '#94a3b8'

  const dateColor = isOverdue
    ? 'text-red-500'
    : isDeadlineToday
    ? 'text-amber-500'
    : 'text-slate-400'

  return (
    <div className="group">
      {/* ━━ タスク行 ━━ */}
      <div
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer ${
          task.status === 'completed' ? 'opacity-60' : ''
        }`}
        onClick={() => setSelectedTaskId(task.id)}
      >
        {/* ステータスアイコン（クリックで切替） */}
        <button
          onClick={cycleStatus}
          className="flex-shrink-0 p-0.5 rounded-full hover:scale-110 transition-transform"
          title="ステータスを変更"
        >
          {task.status === 'completed' ? (
            <CheckCircle2 size={17} className="text-green-500" />
          ) : task.status === 'in-progress' ? (
            <Minus size={17} style={{ color: accentColor }} />
          ) : isOverdue ? (
            <AlertCircle size={17} className="text-red-400" />
          ) : (
            <Circle size={17} style={{ color: accentColor }} className="opacity-50" />
          )}
        </button>

        {/* タイトル */}
        <span className={`flex-1 text-sm font-medium truncate ${
          task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'
        }`}>
          {task.title}
        </span>

        {/* プロジェクトバッジ（今日ビュー用） */}
        {showProject && project && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 hidden sm:inline"
            style={{ backgroundColor: accentColor + '18', color: accentColor }}
          >
            {project.name}
          </span>
        )}

        {/* 実施予定日 */}
        {task.plannedDate && (
          <span className="text-xs flex-shrink-0 flex items-center gap-1 text-blue-400 hidden sm:flex" title="実施予定日">
            <CalendarCheck size={11} />
            {format(parseISO(task.plannedDate), 'M/d', { locale: ja })}
          </span>
        )}

        {/* 締切日 */}
        <span className={`text-xs flex-shrink-0 flex items-center gap-1 ${dateColor}`}>
          <Calendar size={11} />
          {format(deadlineDate, 'M/d', { locale: ja })}
        </span>

        {/* 予想時間 */}
        {task.estimatedMinutes > 0 && (
          <span className="text-xs text-slate-300 flex-shrink-0 flex items-center gap-1 hidden sm:flex">
            <Clock size={11} />
            {task.estimatedMinutes}分
          </span>
        )}

        {/* ホバー時アクション */}
        <div
          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => toggleTaskToday(task.id)}
            className={`p-1 rounded transition-colors ${
              task.isToday ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'
            }`}
            title={task.isToday ? '今日から外す' : '今日に追加'}
          >
            {task.isToday ? <Star size={13} fill="currentColor" /> : <StarOff size={13} />}
          </button>
          {task.status !== 'completed' && task.subTaskSegments.length > 0 && (
            <button
              onClick={() => openTimer(task.id)}
              className="p-1 rounded text-slate-300 hover:text-blue-500 transition-colors"
              title="タイマー開始"
            >
              <Timer size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ━━ マイルストーン サブ行 ━━ */}
      {task.milestones.length > 0 && (
        <div className="ml-8 border-l border-slate-100 pl-3 mb-0.5">
          {task.milestones.map((m) => {
            const mDate = parseISO(m.dueDate)
            const mToday = isToday(mDate)
            const mOverdue = isPast(mDate) && !mToday && !m.completed
            return (
              <div
                key={m.id}
                className="flex items-center gap-2 py-1 group/m hover:bg-slate-50 rounded px-1.5 -mx-1.5 cursor-default"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleMilestone(task.id, m.id)
                  }}
                  className="flex-shrink-0 hover:scale-110 transition-transform"
                >
                  {m.completed
                    ? <CheckCircle2 size={13} className="text-green-400" />
                    : <Circle size={13} className={mOverdue ? 'text-red-300' : 'text-slate-300'} />
                  }
                </button>
                <span className={`flex-1 text-xs truncate ${
                  m.completed ? 'line-through text-slate-300' : mOverdue ? 'text-red-400' : 'text-slate-500'
                }`}>
                  {m.name}
                </span>
                <span className={`text-[10px] flex-shrink-0 ${
                  mOverdue ? 'text-red-400' : mToday ? 'text-amber-500' : 'text-slate-300'
                }`}>
                  {format(mDate, 'M/d', { locale: ja })}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
