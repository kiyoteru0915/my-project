import { useState } from 'react'
import { format } from 'date-fns'
import { X, Plus, Wand2, Folder } from 'lucide-react'
import { useStore } from '../store/useStore'

interface Props {
  projectId: string
  defaultSubFolderId?: string
  onClose: () => void
}

export default function CreateTaskModal({ projectId, defaultSubFolderId, onClose }: Props) {
  const { addTask, projects, subFolders } = useStore()
  const project = projects.find((p) => p.id === projectId)
  const projectSubFolders = subFolders.filter((sf) => sf.projectId === projectId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [estimatedMinutes, setEstimatedMinutes] = useState(60)
  const [isToday, setIsToday] = useState(false)
  const [autoBreakdown, setAutoBreakdown] = useState(true)
  const [selectedSubFolderId, setSelectedSubFolderId] = useState<string>(defaultSubFolderId ?? '')

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
      subTaskSegments: [],
      milestones: [],
      status: 'todo',
      isToday,
      generateBreakdown: autoBreakdown,
    } as Parameters<typeof addTask>[0])

    onClose()
  }

  const timeOptions = [
    { value: 15, label: '15分' },
    { value: 30, label: '30分' },
    { value: 45, label: '45分' },
    { value: 60, label: '1時間' },
    { value: 90, label: '1時間30分' },
    { value: 120, label: '2時間' },
    { value: 180, label: '3時間' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white md:rounded-2xl shadow-2xl overflow-hidden h-full md:h-auto md:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">タスクを追加</h2>
            {project && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                style={{ backgroundColor: project.color }}
              >
                {project.name}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
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
              rows={3}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Sub-folder selector */}
          {projectSubFolders.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <Folder size={13} />
                サブフォルダ（任意）
              </label>
              <select
                value={selectedSubFolderId}
                onChange={(e) => setSelectedSubFolderId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Estimated time */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">予想作業時間</label>
            <div className="grid grid-cols-4 gap-1.5">
              {timeOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setEstimatedMinutes(opt.value)}
                  className={`py-2 text-xs font-medium rounded-lg transition-all ${
                    estimatedMinutes === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={autoBreakdown}
                  onChange={(e) => setAutoBreakdown(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${autoBreakdown ? 'bg-blue-600' : 'bg-slate-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 m-0.5 ${autoBreakdown ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Wand2 size={14} className={autoBreakdown ? 'text-blue-600' : 'text-slate-400'} />
                <span className="text-xs font-medium text-slate-700">マイルストーンを自動生成</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isToday}
                  onChange={(e) => setIsToday(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${isToday ? 'bg-amber-500' : 'bg-slate-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 m-0.5 ${isToday ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
              <span className="text-xs font-medium text-slate-700">今日のタスクに追加</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              追加する
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
