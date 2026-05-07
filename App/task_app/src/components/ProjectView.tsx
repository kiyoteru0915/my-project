import { useRef, useState } from 'react'
import { FolderOpen, Folder, Plus, CheckCircle2, Clock, ListTodo, ChevronRight, GripVertical, Zap } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore } from '../store/useStore'
import { Task, Project } from '../types'
import TaskCard from './TaskCard'
import CreateTaskModal from './CreateTaskModal'
import QuickTaskModal from './QuickTaskModal'

function SortableTaskCard({ task, project }: { task: Task; project: Project }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1 group/row">
      <button
        {...attributes}
        {...listeners}
        className="mt-2.5 p-1 text-slate-200 hover:text-slate-400 opacity-0 group-hover/row:opacity-100 cursor-grab active:cursor-grabbing touch-none flex-shrink-0 transition-opacity"
      >
        <GripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">
        <TaskCard task={task} project={project} />
      </div>
    </div>
  )
}

interface Props {
  projectId?: string
  subFolderId?: string
}

export default function ProjectView({ projectId, subFolderId }: Props) {
  const { projects, subFolders, tasks, reorderTasks, addTask } = useStore()
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showQuickTask, setShowQuickTask] = useState(false)
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'completed'>('all')
  const [quickTitle, setQuickTitle] = useState('')
  const quickInputRef = useRef<HTMLInputElement>(null)

  const subFolder = subFolderId ? subFolders.find((sf) => sf.id === subFolderId) : undefined
  const resolvedProjectId = projectId ?? subFolder?.projectId
  const project = resolvedProjectId ? projects.find((p) => p.id === resolvedProjectId) : undefined

  const scopedTasks = tasks
    .filter((t) => subFolderId ? t.subFolderId === subFolderId : t.projectId === resolvedProjectId)
    .sort((a, b) => a.order - b.order)

  const filtered = filter === 'all' ? scopedTasks : scopedTasks.filter((t) => t.status === filter)

  const counts = {
    todo: scopedTasks.filter((t) => t.status === 'todo').length,
    inProgress: scopedTasks.filter((t) => t.status === 'in-progress').length,
    completed: scopedTasks.filter((t) => t.status === 'completed').length,
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !resolvedProjectId) return
    const oldIndex = filtered.findIndex((t) => t.id === active.id)
    const newIndex = filtered.findIndex((t) => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    reorderTasks(resolvedProjectId, arrayMove(filtered, oldIndex, newIndex).map((t) => t.id))
  }

  // クイック追加（Enterで即時追加）
  const handleQuickAdd = () => {
    const title = quickTitle.trim()
    if (!title || !resolvedProjectId) return
    addTask({
      projectId: resolvedProjectId,
      subFolderId: subFolderId || undefined,
      title,
      description: '',
      deadline: new Date().toISOString().slice(0, 10),
      estimatedMinutes: 30,
      subTaskSegments: [],
      milestones: [],
      status: 'todo',
      isToday: false,
      recurrence: 'none',
      generateBreakdown: false,
    } as Parameters<typeof addTask>[0])
    setQuickTitle('')
    quickInputRef.current?.focus()
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <p>プロジェクトが見つかりません</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* ヘッダー */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: project.color + '18' }}
              >
                {subFolder
                  ? <Folder size={16} style={{ color: project.color }} />
                  : <FolderOpen size={16} style={{ color: project.color }} />
                }
              </div>
              <div className="min-w-0">
                {subFolder ? (
                  <div className="flex items-center gap-1 text-sm text-slate-500 flex-wrap">
                    <span>{project.name}</span>
                    <ChevronRight size={12} />
                    <span className="font-semibold text-slate-800">{subFolder.name}</span>
                  </div>
                ) : (
                  <h2 className="text-base md:text-lg font-bold text-slate-800 truncate">{project.name}</h2>
                )}
                <p className="text-xs text-slate-400">{scopedTasks.length} 件</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setShowQuickTask(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Zap size={13} />
                <span className="hidden sm:inline">クイック</span>
              </button>
              <button
                onClick={() => setShowCreateTask(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">詳細追加</span>
                <span className="sm:hidden">追加</span>
              </button>
            </div>
          </div>

          {/* カウンター */}
          <div className="flex gap-3 mt-2">
            {[
              { icon: <ListTodo size={12} className="text-slate-400" />, label: '未着手', val: counts.todo, color: 'text-slate-600' },
              { icon: <Clock size={12} className="text-blue-400" />, label: '進行中', val: counts.inProgress, color: 'text-blue-600' },
              { icon: <CheckCircle2 size={12} className="text-green-400" />, label: '完了', val: counts.completed, color: 'text-green-600' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1 text-xs text-slate-500">
                {s.icon}
                {s.label}：<span className={`font-semibold ${s.color}`}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* フィルタータブ */}
          <div className="flex gap-1 mt-2">
            {(['all', 'todo', 'in-progress', 'completed'] as const).map((f) => {
              const labels = { all: 'すべて', todo: '未着手', 'in-progress': '進行中', completed: '完了' }
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                    filter === f ? 'text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                  style={filter === f ? { backgroundColor: project.color } : undefined}
                >
                  {labels[f]}
                </button>
              )
            })}
          </div>
        </div>

        {/* タスクリスト */}
        <div className="px-3 md:px-5 py-3">
          {/* クイック追加 */}
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg border border-dashed border-slate-200 hover:border-slate-300 transition-colors group/quick">
            <Plus size={14} className="text-slate-300 group-focus-within/quick:text-blue-400 flex-shrink-0" />
            <input
              ref={quickInputRef}
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd() }}
              placeholder="タスクを追加… (Enterで即時追加)"
              className="flex-1 text-sm text-slate-700 placeholder-slate-300 bg-transparent focus:outline-none"
            />
            {quickTitle.trim() && (
              <button
                onClick={handleQuickAdd}
                className="text-xs text-blue-500 font-medium px-2 py-0.5 rounded hover:bg-blue-50 flex-shrink-0"
              >
                追加
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FolderOpen size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium">タスクがありません</p>
              <p className="text-xs mt-1 text-slate-300">上の入力欄から追加してください</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filtered.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-0.5">
                  {filtered.map((task) => (
                    <SortableTaskCard key={task.id} task={task} project={project} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {showCreateTask && (
        <CreateTaskModal
          projectId={resolvedProjectId!}
          defaultSubFolderId={subFolderId}
          onClose={() => setShowCreateTask(false)}
        />
      )}
      {showQuickTask && (
        <QuickTaskModal
          projectId={resolvedProjectId!}
          defaultSubFolderId={subFolderId}
          onClose={() => setShowQuickTask(false)}
        />
      )}
    </>
  )
}
