import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { X, Plus, Folder, RefreshCw, Sparkles, ChevronDown, ChevronUp, Check, Timer, Flag } from 'lucide-react'
import { useStore } from '../store/useStore'
import { RecurrenceType, SubTaskSegment, MilestoneTask } from '../types'
import { getSuggestionPlans } from '../utils/suggestions'

interface Props {
  projectId: string
  defaultSubFolderId?: string
  onClose: () => void
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export default function CreateTaskModal({ projectId, defaultSubFolderId, onClose }: Props) {
  const { addTask, projects, subFolders } = useStore()
  const project = projects.find((p) => p.id === projectId)
  const projectSubFolders = subFolders.filter((sf) => sf.projectId === projectId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [estimatedMinutes, setEstimatedMinutes] = useState(60)
  const [isToday, setIsToday] = useState(false)
  const [selectedSubFolderId, setSelectedSubFolderId] = useState<string>(defaultSubFolderId ?? '')
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none')
  const [recurrenceDay, setRecurrenceDay] = useState<number | undefined>(undefined)

  // 提案関連
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [selectedSegments, setSelectedSegments] = useState<SubTaskSegment[]>([])
  const [selectedMilestones, setSelectedMilestones] = useState<MilestoneTask[]>([])

  const suggestions = useMemo(() => {
    if (!title.trim() || !deadline) return []
    return getSuggestionPlans(title, estimatedMinutes, new Date(), new Date(deadline))
  }, [title, estimatedMinutes, deadline])

  const handleSelectPlan = (planId: string) => {
    const plan = suggestions.find((p) => p.id === planId)
    if (!plan) return
    setSelectedPlanId(planId)
    setSelectedSegments(plan.resolvedSegments)
    setSelectedMilestones(plan.resolvedMilestones)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    addTask({
      projectId,
      subFolderId: selectedSubFolderId || undefined,
      title: title.trim(),
      description: description.trim(),
      deadline,
      estimatedMinutes,
      subTaskSegments: selectedSegments,
      milestones: selectedMilestones,
      status: 'todo',
      isToday,
      recurrence,
      recurrenceDay,
      generateBreakdown: selectedSegments.length === 0 && selectedMilestones.length === 0,
    } as Parameters<typeof addTask>[0])

    onClose()
  }

  const timeOptions = [
    { value: 15, label: '15分' },
    { value: 30, label: '30分' },
    { value: 45, label: '45分' },
    { value: 60, label: '1時間' },
    { value: 90, label: '1.5時間' },
    { value: 120, label: '2時間' },
    { value: 180, label: '3時間' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white md:rounded-2xl shadow-2xl overflow-hidden h-full md:h-auto md:max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">タスクを追加</h2>
            {project && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: project.color }}>
                {project.name}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              タスク名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：プレスリリース作成"
              required
              autoFocus
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">説明（任意）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="タスクの詳細説明..."
              rows={2}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Sub-folder */}
          {projectSubFolders.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <Folder size={13} /> サブフォルダ（任意）
              </label>
              <select
                value={selectedSubFolderId}
                onChange={(e) => setSelectedSubFolderId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">フォルダなし</option>
                {projectSubFolders.map((sf) => (
                  <option key={sf.id} value={sf.id}>{sf.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Deadline */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">締切日</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-slate-300 transition-all"
            />
          </div>

          {/* Estimated time */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">予想作業時間</label>
            <div className="grid grid-cols-4 gap-1.5">
              {timeOptions.map((opt) => (
                <button
                  type="button" key={opt.value}
                  onClick={() => setEstimatedMinutes(opt.value)}
                  className={`py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    estimatedMinutes === opt.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
              <RefreshCw size={13} /> 繰り返し
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['none', 'weekly', 'monthly', 'yearly'] as RecurrenceType[]).map((r) => {
                const labels = { none: 'なし', weekly: '毎週', monthly: '毎月', yearly: '毎年' }
                return (
                  <button
                    type="button" key={r}
                    onClick={() => { setRecurrence(r); setRecurrenceDay(undefined) }}
                    className={`py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                      recurrence === r ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {labels[r]}
                  </button>
                )
              })}
            </div>

            {/* 毎週: 曜日選択 */}
            {recurrence === 'weekly' && (
              <div className="mt-2">
                <p className="text-xs text-slate-500 mb-1.5">繰り返す曜日</p>
                <div className="flex gap-1.5">
                  {WEEKDAYS.map((d, i) => (
                    <button
                      type="button" key={i}
                      onClick={() => setRecurrenceDay(recurrenceDay === i ? undefined : i)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                        recurrenceDay === i ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      } ${i === 0 ? 'text-red-400' : ''} ${i === 6 ? 'text-blue-400' : ''}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 毎月: 日付選択 */}
            {recurrence === 'monthly' && (
              <div className="mt-2">
                <p className="text-xs text-slate-500 mb-1.5">繰り返す日</p>
                <div className="grid grid-cols-7 gap-1">
                  {MONTH_DAYS.map((d) => (
                    <button
                      type="button" key={d}
                      onClick={() => setRecurrenceDay(recurrenceDay === d ? undefined : d)}
                      className={`py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        recurrenceDay === d ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recurrence !== 'none' && (
              <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
                <RefreshCw size={11} />
                完了後に次回タスクが自動作成されます
                {recurrence === 'weekly' && recurrenceDay !== undefined && `（毎週${WEEKDAYS[recurrenceDay]}曜日）`}
                {recurrence === 'monthly' && recurrenceDay !== undefined && `（毎月${recurrenceDay}日）`}
              </p>
            )}
          </div>

          {/* AI提案 */}
          {title.trim().length >= 2 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-purple-500" />
                  <span className="text-sm font-semibold text-slate-700">作業プランを提案する</span>
                  {selectedPlanId && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check size={10} /> 選択済み
                    </span>
                  )}
                </div>
                {showSuggestions ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {showSuggestions && (
                <div className="p-3 space-y-2 bg-white">
                  <p className="text-xs text-slate-500">「{title}」に合わせた作業プランを選んでください</p>
                  {suggestions.map((plan) => (
                    <button
                      type="button" key={plan.id}
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedPlanId === plan.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-100 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-800">{plan.label}</span>
                        <span className="text-xs text-slate-500">{plan.description}</span>
                      </div>

                      {/* セグメントプレビュー */}
                      <div className="mb-2">
                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                          <Timer size={11} /> 作業セグメント
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {plan.resolvedSegments.map((s, i) => (
                            <span key={i} className="text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded-md text-slate-600">
                              {s.name} <span className="text-slate-400">{s.durationMinutes}分</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* マイルストーンプレビュー */}
                      <div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                          <Flag size={11} /> マイルストーン
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {plan.resolvedMilestones.map((m, i) => (
                            <span key={i} className="text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded-md text-slate-600">
                              {m.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {selectedPlanId === plan.id && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                          <Check size={11} /> このプランで追加します
                        </div>
                      )}
                    </button>
                  ))}
                  {selectedPlanId && (
                    <button
                      type="button"
                      onClick={() => { setSelectedPlanId(null); setSelectedSegments([]); setSelectedMilestones([]) }}
                      className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
                    >
                      選択を解除する
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 今日に追加 */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" checked={isToday} onChange={(e) => setIsToday(e.target.checked)} className="sr-only" />
              <div className={`w-10 h-5 rounded-full transition-colors ${isToday ? 'bg-amber-500' : 'bg-slate-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 m-0.5 ${isToday ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
            <span className="text-xs font-medium text-slate-700">今日のタスクに追加</span>
          </label>

          {/* Actions */}
          <div className="flex gap-2 pt-1 pb-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              追加する
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
