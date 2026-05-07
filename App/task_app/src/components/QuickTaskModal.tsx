import { useState } from 'react'
import { format } from 'date-fns'
import { X, Zap, RefreshCw } from 'lucide-react'
import { useStore } from '../store/useStore'
import { RecurrenceType } from '../types'

interface Props {
  projectId: string
  defaultSubFolderId?: string
  onClose: () => void
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export default function QuickTaskModal({ projectId, defaultSubFolderId, onClose }: Props) {
  const { addTask, projects } = useStore()
  const project = projects.find((p) => p.id === projectId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none')
  const [recurrenceDay, setRecurrenceDay] = useState<number | undefined>(undefined)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addTask({
      projectId,
      subFolderId: defaultSubFolderId || undefined,
      title: title.trim(),
      description: description.trim(),
      deadline,
      estimatedMinutes: 30,
      subTaskSegments: [],
      milestones: [],
      status: 'todo',
      isToday: false,
      recurrence,
      recurrenceDay,
      generateBreakdown: false,
    } as Parameters<typeof addTask>[0])
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white md:rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Zap size={14} className="text-blue-400" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">クイック追加</h2>
            {project && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: project.color }}>
                {project.name}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タスク名 *"
            required
            autoFocus
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="詳細（任意）"
            rows={2}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none"
          />

          {/* Deadline */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">締切日</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer hover:border-slate-300 transition-all"
            />
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
              <RefreshCw size={12} /> 繰り返し
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['none', 'weekly', 'monthly', 'yearly'] as RecurrenceType[]).map((r) => {
                const labels = { none: 'なし', weekly: '毎週', monthly: '毎月', yearly: '毎年' }
                return (
                  <button
                    type="button" key={r}
                    onClick={() => { setRecurrence(r); setRecurrenceDay(undefined) }}
                    className={`py-2 text-xs font-medium rounded-lg transition-all ${
                      recurrence === r ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {labels[r]}
                  </button>
                )
              })}
            </div>

            {recurrence === 'weekly' && (
              <div className="mt-2">
                <p className="text-xs text-slate-500 mb-1.5">繰り返す曜日</p>
                <div className="flex gap-1">
                  {WEEKDAYS.map((d, i) => (
                    <button
                      type="button" key={i}
                      onClick={() => setRecurrenceDay(recurrenceDay === i ? undefined : i)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        recurrenceDay === i ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recurrence === 'monthly' && (
              <div className="mt-2">
                <p className="text-xs text-slate-500 mb-1.5">繰り返す日</p>
                <div className="grid grid-cols-7 gap-1">
                  {MONTH_DAYS.map((d) => (
                    <button
                      type="button" key={d}
                      onClick={() => setRecurrenceDay(recurrenceDay === d ? undefined : d)}
                      className={`py-1 text-xs font-medium rounded-md transition-all ${
                        recurrenceDay === d ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              追加する
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
