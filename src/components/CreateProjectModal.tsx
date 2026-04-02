import { useState } from 'react'
import { X, FolderPlus } from 'lucide-react'
import { useStore } from '../store/useStore'

interface Props {
  onClose: () => void
}

const presetColors = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#ec4899', '#64748b',
]

export default function CreateProjectModal({ onClose }: Props) {
  const { addProject } = useStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addProject(name.trim(), color)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderPlus size={18} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">プロジェクトを追加</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              プロジェクト名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：マーケティング"
              required
              autoFocus
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">カラー</label>
            <div className="flex items-center gap-2 flex-wrap">
              {presetColors.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-full border-2 border-slate-200 cursor-pointer overflow-hidden"
                title="カスタムカラー"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-sm text-slate-600">{name || 'プロジェクト名'}</span>
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
              disabled={!name.trim()}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              作成する
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
