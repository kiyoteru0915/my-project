import { useState } from 'react'
import { FolderOpen, Folder, Plus, CheckCircle2, Clock, ListTodo, ChevronRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import TaskCard from './TaskCard'
import CreateTaskModal from './CreateTaskModal'

interface Props {
  projectId?: string
  subFolderId?: string
}

export default function ProjectView({ projectId, subFolderId }: Props) {
  const { projects, subFolders, tasks } = useStore()
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'completed'>('all')

  // Determine project and sub-folder from props
  const subFolder = subFolderId ? subFolders.find((sf) => sf.id === subFolderId) : undefined
  const resolvedProjectId = projectId ?? subFolder?.projectId
  const project = resolvedProjectId ? projects.find((p) => p.id === resolvedProjectId) : undefined

  // Filter tasks
  const scopedTasks = tasks.filter((t) => {
    if (subFolderId) return t.subFolderId === subFolderId
    return t.projectId === resolvedProjectId
  })
  const filtered = filter === 'all' ? scopedTasks : scopedTasks.filter((t) => t.status === filter)

  const counts = {
    todo: scopedTasks.filter((t) => t.status === 'todo').length,
    inProgress: scopedTasks.filter((t) => t.status === 'in-progress').length,
    completed: scopedTasks.filter((t) => t.status === 'completed').length,
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
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 md:px-8 py-4 md:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: project.color + '20' }}
              >
                {subFolder
                  ? <Folder size={18} style={{ color: project.color }} />
                  : <FolderOpen size={18} style={{ color: project.color }} />
                }
              </div>
              <div>
                {/* Breadcrumb for sub-folders */}
                {subFolder ? (
                  <div className="flex items-center gap-1 text-sm text-slate-500 mb-0.5">
                    <span>{project.name}</span>
                    <ChevronRight size={13} />
                    <span className="font-semibold text-slate-800">{subFolder.name}</span>
                  </div>
                ) : (
                  <h2 className="text-xl font-bold text-slate-800">{project.name}</h2>
                )}
                <p className="text-sm text-slate-500">{scopedTasks.length} 件のタスク</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateTask(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              タスクを追加
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-sm">
              <ListTodo size={14} className="text-slate-400" />
              <span className="text-slate-500">未着手：</span>
              <span className="font-semibold text-slate-700">{counts.todo}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Clock size={14} className="text-blue-500" />
              <span className="text-slate-500">進行中：</span>
              <span className="font-semibold text-blue-600">{counts.inProgress}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <CheckCircle2 size={14} className="text-green-500" />
              <span className="text-slate-500">完了：</span>
              <span className="font-semibold text-green-600">{counts.completed}</span>
            </div>
          </div>

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
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={filter === f ? { backgroundColor: project.color } : undefined}
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
              <FolderOpen size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">タスクがありません</p>
              <p className="text-sm mt-1 mb-4">新しいタスクを追加してください</p>
              <button
                onClick={() => setShowCreateTask(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                タスクを追加
              </button>
            </div>
          ) : (
            filtered.map((task) => (
              <TaskCard key={task.id} task={task} project={project} />
            ))
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
    </>
  )
}
