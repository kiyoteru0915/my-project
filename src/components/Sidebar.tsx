import { useState } from 'react'
import { Calendar, FolderOpen, Plus, Trash2, Timer, ChevronDown, ChevronRight, FolderPlus, Folder, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import CreateProjectModal from './CreateProjectModal'

interface Props {
  onClose?: () => void
}

export default function Sidebar({ onClose }: Props) {
  const {
    projects, subFolders, currentView, setCurrentView,
    deleteProject, addSubFolder, deleteSubFolder,
    timerState, openTimer
  } = useStore()

  const [showCreateProject, setShowCreateProject] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(projects.map(p => p.id)))
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [addingSubFolderTo, setAddingSubFolderTo] = useState<string | null>(null)
  const [newSubFolderName, setNewSubFolderName] = useState('')

  const toggleExpand = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) next.delete(projectId)
      else next.add(projectId)
      return next
    })
  }

  const handleAddSubFolder = (projectId: string) => {
    if (!newSubFolderName.trim()) return
    addSubFolder(projectId, newSubFolderName.trim())
    setNewSubFolderName('')
    setAddingSubFolderTo(null)
  }

  return (
    <>
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm">
        {/* App Header */}
        <div className="px-4 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">タスク管理</h1>
            <p className="text-xs text-slate-400 mt-0.5">Task Manager</p>
          </div>
          {/* Close button for mobile drawer */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
          {/* Today */}
          <div className="px-3 mb-1">
            <button
              onClick={() => setCurrentView('today')}
              className={`w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'today'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Calendar size={17} className={currentView === 'today' ? 'text-blue-600' : 'text-slate-400'} />
              <span>今日のタスク</span>
            </button>
          </div>

          {/* Projects label */}
          <div className="px-4 pt-4 pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">プロジェクト</span>
              <button
                onClick={() => setShowCreateProject(true)}
                className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded"
                title="プロジェクトを追加"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          <div className="px-3 space-y-0.5">
            {projects.map((project) => {
              const projectSubFolders = subFolders.filter((sf) => sf.projectId === project.id)
              const isExpanded = expandedProjects.has(project.id)
              const isProjectActive = currentView === project.id

              return (
                <div key={project.id}>
                  {/* Project row */}
                  <div
                    className="relative flex items-center"
                    onMouseEnter={() => setHoveredItem(project.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <button
                      onClick={() => toggleExpand(project.id)}
                      className="p-1 text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
                    >
                      {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>

                    <button
                      onClick={() => setCurrentView(project.id)}
                      className={`flex-1 flex items-center gap-2 px-2 py-3 md:py-2 rounded-lg text-sm font-medium transition-all min-w-0 ${
                        isProjectActive
                          ? 'bg-slate-100 text-slate-800'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <FolderOpen size={14} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">{project.name}</span>
                    </button>

                    {hoveredItem === project.id && (
                      <div className="absolute right-1 flex items-center gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setAddingSubFolderTo(project.id)
                            setExpandedProjects((prev) => new Set([...prev, project.id]))
                          }}
                          className="p-1 rounded text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          title="サブフォルダを追加"
                        >
                          <FolderPlus size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`「${project.name}」を削除しますか？`)) {
                              deleteProject(project.id)
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sub-folders */}
                  {isExpanded && (
                    <div className="ml-6 mt-0.5 space-y-0.5">
                      {projectSubFolders.map((sf) => {
                        const sfViewKey = `sf:${sf.id}`
                        const isSfActive = currentView === sfViewKey
                        return (
                          <div
                            key={sf.id}
                            className="relative"
                            onMouseEnter={() => setHoveredItem(sf.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            <button
                              onClick={() => setCurrentView(sfViewKey)}
                              className={`w-full flex items-center gap-2 px-3 py-2.5 md:py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isSfActive
                                  ? 'bg-slate-100 text-slate-800'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                              }`}
                            >
                              <Folder size={13} className="text-slate-400 flex-shrink-0" />
                              <span className="truncate">{sf.name}</span>
                            </button>
                            {hoveredItem === sf.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (confirm(`「${sf.name}」を削除しますか？`)) {
                                    deleteSubFolder(sf.id)
                                  }
                                }}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        )
                      })}

                      {addingSubFolderTo === project.id && (
                        <div className="flex items-center gap-1 px-2 py-1">
                          <input
                            type="text"
                            value={newSubFolderName}
                            onChange={(e) => setNewSubFolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddSubFolder(project.id)
                              if (e.key === 'Escape') {
                                setAddingSubFolderTo(null)
                                setNewSubFolderName('')
                              }
                            }}
                            placeholder="フォルダ名"
                            autoFocus
                            className="flex-1 text-xs px-2 py-1 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                          <button
                            onClick={() => handleAddSubFolder(project.id)}
                            className="text-blue-500 hover:text-blue-700 p-0.5"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Active Timer indicator */}
        {timerState.taskId && (
          <div className="px-3 py-3 border-t border-slate-100">
            <button
              onClick={() => openTimer(timerState.taskId!)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
            >
              <Timer size={14} className={timerState.isRunning ? 'animate-pulse' : ''} />
              <span>{timerState.isRunning ? 'タイマー実行中' : 'タイマー一時停止中'}</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">{projects.length} プロジェクト</p>
        </div>
      </aside>

      {showCreateProject && (
        <CreateProjectModal onClose={() => setShowCreateProject(false)} />
      )}
    </>
  )
}
