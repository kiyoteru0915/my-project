import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  X, Calendar, Clock, CheckCircle2, Circle, Timer, Star, StarOff,
  Trash2, Edit3, ChevronRight, Plus, Check, GripVertical, Pencil, ListPlus, RefreshCw
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { SubTaskSegment, MilestoneTask, RecurrenceType } from '../types'

const recurrenceLabels: Record<RecurrenceType, string> = {
  none: 'なし', weekly: '毎週', monthly: '毎月', yearly: '毎年',
}

const statusConfig = {
  todo: { label: '未着手', color: 'bg-slate-100 text-slate-600' },
  'in-progress': { label: '進行中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '完了', color: 'bg-green-100 text-green-700' },
}

function generateId() {
  return Math.random().toString(36).substring(2, 11)
}

export default function TaskDetailModal() {
  const {
    tasks, projects, subFolders, selectedTaskId, setSelectedTaskId,
    toggleMilestone, toggleTaskToday, updateTask, deleteTask, openTimer, addTask
  } = useStore()

  const task = tasks.find((t) => t.id === selectedTaskId)
  const project = projects.find((p) => p.id === task?.projectId)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editEstimatedMinutes, setEditEstimatedMinutes] = useState(60)
  const [editSubFolderId, setEditSubFolderId] = useState<string | undefined>(undefined)
  const [editRecurrence, setEditRecurrence] = useState<RecurrenceType>('none')
  const [editRecurrenceDay, setEditRecurrenceDay] = useState<number | undefined>(undefined)

  // Segment editing
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null)
  const [segmentEditName, setSegmentEditName] = useState('')
  const [segmentEditDuration, setSegmentEditDuration] = useState(0)

  // Milestone editing
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null)
  const [milestoneEditName, setMilestoneEditName] = useState('')
  const [milestoneEditDate, setMilestoneEditDate] = useState('')

  if (!task) return null

  const completedMilestones = task.milestones.filter((m) => m.completed).length
  const projectSubFolders = subFolders.filter((sf) => sf.projectId === task.projectId)

  const enterEditMode = () => {
    setEditTitle(task.title)
    setEditDescription(task.description)
    setEditDeadline(task.deadline)
    setEditEstimatedMinutes(task.estimatedMinutes)
    setEditSubFolderId(task.subFolderId)
    setEditRecurrence(task.recurrence ?? 'none')
    setEditRecurrenceDay(task.recurrenceDay)
    setIsEditing(true)
  }

  const saveEdit = () => {
    updateTask(task.id, {
      title: editTitle.trim() || task.title,
      description: editDescription.trim(),
      deadline: editDeadline,
      estimatedMinutes: editEstimatedMinutes,
      subFolderId: editSubFolderId,
      recurrence: editRecurrence,
      recurrenceDay: editRecurrenceDay,
    })
    setIsEditing(false)
  }

  const cancelEdit = () => {
    setIsEditing(false)
  }

  const handleStatusChange = (status: 'todo' | 'in-progress' | 'completed') => {
    updateTask(task.id, {
      status,
      completionDate: status === 'completed' ? format(new Date(), 'yyyy-MM-dd') : undefined,
    })
  }

  const handleDelete = () => {
    if (confirm(`「${task.title}」を削除しますか？`)) {
      deleteTask(task.id)
      setSelectedTaskId(null)
    }
  }

  // Segment CRUD
  const startEditSegment = (seg: SubTaskSegment) => {
    setEditingSegmentId(seg.id)
    setSegmentEditName(seg.name)
    setSegmentEditDuration(seg.durationMinutes)
  }

  const saveSegment = (segId: string) => {
    const updated = task.subTaskSegments.map((s) =>
      s.id === segId ? { ...s, name: segmentEditName.trim() || s.name, durationMinutes: segmentEditDuration } : s
    )
    updateTask(task.id, { subTaskSegments: updated })
    setEditingSegmentId(null)
  }

  const deleteSegment = (segId: string) => {
    updateTask(task.id, { subTaskSegments: task.subTaskSegments.filter((s) => s.id !== segId) })
  }

  const addSegment = () => {
    const newSeg: SubTaskSegment = {
      id: generateId(),
      name: '新しい作業',
      durationMinutes: 15,
      completed: false,
    }
    updateTask(task.id, { subTaskSegments: [...task.subTaskSegments, newSeg] })
    setEditingSegmentId(newSeg.id)
    setSegmentEditName(newSeg.name)
    setSegmentEditDuration(newSeg.durationMinutes)
  }

  // Milestone CRUD
  const startEditMilestone = (m: MilestoneTask) => {
    setEditingMilestoneId(m.id)
    setMilestoneEditName(m.name)
    setMilestoneEditDate(m.dueDate)
  }

  const saveMilestone = (milestoneId: string) => {
    const updated = task.milestones.map((m) =>
      m.id === milestoneId ? { ...m, name: milestoneEditName.trim() || m.name, dueDate: milestoneEditDate } : m
    )
    updateTask(task.id, { milestones: updated })
    setEditingMilestoneId(null)
  }

  const deleteMilestone = (milestoneId: string) => {
    updateTask(task.id, { milestones: task.milestones.filter((m) => m.id !== milestoneId) })
  }

  const addMilestone = () => {
    const newM: MilestoneTask = {
      id: generateId(),
      name: '新しいマイルストーン',
      dueDate: task.deadline,
      completed: false,
    }
    updateTask(task.id, { milestones: [...task.milestones, newM] })
    setEditingMilestoneId(newM.id)
    setMilestoneEditName(newM.name)
    setMilestoneEditDate(newM.dueDate)
  }

  // Add milestone as a standalone task
  const addMilestoneAsTask = (milestone: MilestoneTask) => {
    addTask({
      projectId: task.projectId,
      subFolderId: task.subFolderId,
      title: milestone.name,
      description: `「${task.title}」のマイルストーン`,
      deadline: milestone.dueDate,
      estimatedMinutes: 60,
      subTaskSegments: [],
      milestones: [],
      status: 'todo',
      isToday: false,
      recurrence: 'none',
      generateBreakdown: false,
    })
    alert(`「${milestone.name}」をタスクとして追加しました`)
  }

  const timeOptions = [15, 30, 45, 60, 90, 120, 180]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => { setSelectedTaskId(null); setIsEditing(false) }}
      />

      {/* Panel - full screen on mobile, side panel on desktop */}
      <div className="relative z-10 w-full md:max-w-lg h-full bg-white shadow-2xl overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {project && (
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 text-lg font-bold text-slate-800 border-b-2 border-blue-400 focus:outline-none bg-transparent"
                  autoFocus
                />
              ) : (
                <h2 className="text-lg font-bold text-slate-800 truncate">{task.title}</h2>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!isEditing && (
                <button
                  onClick={enterEditMode}
                  className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                  title="編集"
                >
                  <Edit3 size={16} />
                </button>
              )}
              <button
                onClick={() => toggleTaskToday(task.id)}
                className={`p-2 rounded-lg transition-colors ${
                  task.isToday ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:bg-slate-100'
                }`}
                title={task.isToday ? '今日から外す' : '今日に追加'}
              >
                {task.isToday ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
              </button>
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => { setSelectedTaskId(null); setIsEditing(false) }}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Status selector */}
          <div className="flex gap-2 mt-3">
            {(['todo', 'in-progress', 'completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  task.status === s
                    ? statusConfig[s].color + ' ring-2 ring-offset-1'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {statusConfig[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Edit mode fields */}
          {isEditing ? (
            <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">説明</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">締切日</label>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">予想時間</label>
                  <select
                    value={editEstimatedMinutes}
                    onChange={(e) => setEditEstimatedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {timeOptions.map((m) => (
                      <option key={m} value={m}>{m}分</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <RefreshCw size={12} /> 繰り返し
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['none', 'weekly', 'monthly', 'yearly'] as RecurrenceType[]).map((r) => (
                    <button
                      key={r} type="button"
                      onClick={() => { setEditRecurrence(r); setEditRecurrenceDay(undefined) }}
                      className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                        editRecurrence === r ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {recurrenceLabels[r]}
                    </button>
                  ))}
                </div>

                {/* Weekday selector */}
                {editRecurrence === 'weekly' && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 mb-1.5">繰り返す曜日</p>
                    <div className="flex gap-1">
                      {['日', '月', '火', '水', '木', '金', '土'].map((label, idx) => (
                        <button
                          key={idx} type="button"
                          onClick={() => setEditRecurrenceDay(idx)}
                          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            editRecurrenceDay === idx
                              ? (idx === 0 ? 'bg-red-500 text-white' : idx === 6 ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white')
                              : (idx === 0 ? 'bg-red-50 text-red-400 hover:bg-red-100' : idx === 6 ? 'bg-blue-50 text-blue-400 hover:bg-blue-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Day-of-month selector */}
                {editRecurrence === 'monthly' && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 mb-1.5">繰り返す日</p>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <button
                          key={day} type="button"
                          onClick={() => setEditRecurrenceDay(day)}
                          className={`py-1 text-xs font-medium rounded-md transition-all ${
                            editRecurrenceDay === day
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {projectSubFolders.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">サブフォルダ</label>
                  <select
                    value={editSubFolderId ?? ''}
                    onChange={(e) => setEditSubFolderId(e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">なし</option>
                    {projectSubFolders.map((sf) => (
                      <option key={sf.id} value={sf.id}>{sf.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Check size={15} />
                  保存する
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <>
              {task.description && (
                <p className="text-sm text-slate-600 leading-relaxed">{task.description}</p>
              )}
            </>
          )}

          {/* Meta info (view mode) */}
          {!isEditing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Calendar size={14} />
                  <span className="text-xs font-medium">締切日</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {format(parseISO(task.deadline), 'yyyy年M月d日', { locale: ja })}
                </p>
              </div>

              {task.completionDate && (
                <div className="bg-green-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-green-600 mb-1">
                    <CheckCircle2 size={14} />
                    <span className="text-xs font-medium">完了日</span>
                  </div>
                  <p className="text-sm font-semibold text-green-700">
                    {format(parseISO(task.completionDate), 'yyyy年M月d日', { locale: ja })}
                  </p>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Clock size={14} />
                  <span className="text-xs font-medium">予想時間</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">{task.estimatedMinutes} 分</p>
              </div>

              {task.recurrence && task.recurrence !== 'none' && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <RefreshCw size={14} />
                    <span className="text-xs font-medium">繰り返し</span>
                  </div>
                  <p className="text-sm font-semibold text-blue-700">{recurrenceLabels[task.recurrence]}</p>
                </div>
              )}

            {task.timerElapsedSeconds > 0 && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <Timer size={14} />
                    <span className="text-xs font-medium">実績時間</span>
                  </div>
                  <p className="text-sm font-semibold text-blue-700">
                    {Math.floor(task.timerElapsedSeconds / 60)} 分 {task.timerElapsedSeconds % 60} 秒
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Focus Timer button */}
          {task.status !== 'completed' && task.subTaskSegments.length > 0 && (
            <button
              onClick={() => {
                openTimer(task.id)
                setSelectedTaskId(null)
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Timer size={18} />
              フォーカスタイマーを開始
            </button>
          )}

          {/* Sub-task segments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Timer size={15} className="text-blue-500" />
                作業セグメント
                <span className="text-xs font-normal text-slate-400">
                  ({task.subTaskSegments.reduce((sum, s) => sum + s.durationMinutes, 0)}分)
                </span>
              </h3>
              <button
                onClick={addSegment}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
              >
                <Plus size={13} />
                追加
              </button>
            </div>
            <div className="space-y-2">
              {task.subTaskSegments.map((seg, idx) => (
                <div key={seg.id}>
                  {editingSegmentId === seg.id ? (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={segmentEditName}
                        onChange={(e) => setSegmentEditName(e.target.value)}
                        className="flex-1 text-sm px-2 py-1 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                        autoFocus
                      />
                      <input
                        type="number"
                        value={segmentEditDuration}
                        onChange={(e) => setSegmentEditDuration(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-sm px-2 py-1 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-center"
                        min={1}
                      />
                      <span className="text-xs text-slate-500 flex-shrink-0">分</span>
                      <button onClick={() => saveSegment(seg.id)} className="text-green-500 hover:text-green-700 p-1">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingSegmentId(null)} className="text-slate-400 hover:text-slate-600 p-1">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`flex items-center gap-3 p-3 rounded-lg border group transition-colors ${
                        seg.completed ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <GripVertical size={14} className="text-slate-300 flex-shrink-0" />
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        seg.completed ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${seg.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {seg.name}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{seg.durationMinutes}分</span>
                      <button
                        onClick={() => startEditSegment(seg)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-500 transition-all"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteSegment(seg.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {task.subTaskSegments.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-3">セグメントがありません。「追加」から作成できます。</p>
              )}
            </div>
          </div>

          {/* Milestones */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <ChevronRight size={15} className="text-blue-500" />
                マイルストーン
                <span className="text-xs font-normal text-slate-400">
                  ({completedMilestones}/{task.milestones.length} 完了)
                </span>
              </h3>
              <button
                onClick={addMilestone}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
              >
                <Plus size={13} />
                追加
              </button>
            </div>

            {task.milestones.length > 0 && (
              <div className="h-1.5 bg-slate-100 rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${task.milestones.length > 0 ? (completedMilestones / task.milestones.length) * 100 : 0}%`,
                    backgroundColor: project?.color || '#3b82f6',
                  }}
                />
              </div>
            )}

            <div className="space-y-2">
              {task.milestones.map((milestone) => (
                <div key={milestone.id}>
                  {editingMilestoneId === milestone.id ? (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                      <input
                        type="text"
                        value={milestoneEditName}
                        onChange={(e) => setMilestoneEditName(e.target.value)}
                        placeholder="マイルストーン名"
                        className="w-full text-sm px-3 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={milestoneEditDate}
                          onChange={(e) => setMilestoneEditDate(e.target.value)}
                          className="flex-1 text-sm px-3 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                        <button onClick={() => saveMilestone(milestone.id)} className="p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingMilestoneId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`flex items-start gap-3 p-3 rounded-lg border group transition-colors ${
                        milestone.completed ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
                      }`}
                    >
                      <button
                        onClick={() => toggleMilestone(task.id, milestone.id)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {milestone.completed ? (
                          <CheckCircle2 size={16} className="text-green-500" />
                        ) : (
                          <Circle size={16} className="text-slate-300" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${milestone.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {milestone.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Calendar size={11} className="text-slate-400" />
                          <span className="text-xs text-slate-400">
                            {format(parseISO(milestone.dueDate), 'M月d日', { locale: ja })}
                          </span>
                          {milestone.completedDate && (
                            <span className="text-xs text-green-500">
                              完了: {format(parseISO(milestone.completedDate), 'M月d日', { locale: ja })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                        <button
                          onClick={() => addMilestoneAsTask(milestone)}
                          className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                          title="タスクとして追加"
                        >
                          <ListPlus size={14} />
                        </button>
                        <button
                          onClick={() => startEditMilestone(milestone)}
                          className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deleteMilestone(milestone.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {task.milestones.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-3">マイルストーンがありません。「追加」から作成できます。</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
