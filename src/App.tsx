import { useEffect, useState } from 'react'
import { Menu, Calendar, FolderOpen, Timer, RefreshCw } from 'lucide-react'
import { useStore } from './store/useStore'
import Sidebar from './components/Sidebar'
import TodayView from './components/TodayView'
import ProjectView from './components/ProjectView'
import TaskDetailModal from './components/TaskDetailModal'
import FocusTimer from './components/FocusTimer'
import SyncModal from './components/SyncModal'

function App() {
  const { currentView, selectedTaskId, isTimerOpen, tickTimer, timerState, projects, subFolders, openTimer, syncStatus } = useStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSyncOpen, setIsSyncOpen] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      if (timerState.isRunning) tickTimer()
    }, 1000)
    return () => clearInterval(interval)
  }, [tickTimer, timerState.isRunning])

  // Close sidebar when view changes (mobile)
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [currentView])

  const renderMain = () => {
    if (currentView === 'today') return <TodayView />
    if (currentView.startsWith('sf:')) {
      return <ProjectView subFolderId={currentView.slice(3)} />
    }
    return <ProjectView projectId={currentView} />
  }

  // Get current view title for mobile top bar
  const getViewTitle = () => {
    if (currentView === 'today') return '今日のタスク'
    if (currentView.startsWith('sf:')) {
      const sf = subFolders.find((s) => s.id === currentView.slice(3))
      return sf?.name ?? 'フォルダ'
    }
    return projects.find((p) => p.id === currentView)?.name ?? 'プロジェクト'
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0 z-30">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {currentView === 'today'
            ? <Calendar size={18} className="text-blue-600 flex-shrink-0" />
            : <FolderOpen size={18} className="text-slate-500 flex-shrink-0" />
          }
          <span className="font-semibold text-slate-800 truncate">{getViewTitle()}</span>
        </div>
        <button
          onClick={() => setIsSyncOpen(true)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 flex-shrink-0"
          title="同期設定"
        >
          <RefreshCw size={18} className={syncStatus === 'syncing' ? 'animate-spin text-blue-500' : syncStatus === 'synced' ? 'text-green-500' : ''} />
        </button>
        {timerState.taskId && (
          <button
            onClick={() => openTimer(timerState.taskId!)}
            className="p-2 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0"
          >
            <Timer size={18} className={timerState.isRunning ? 'animate-pulse' : ''} />
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-auto
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col min-w-0">
          {renderMain()}
        </main>
      </div>

      {selectedTaskId && <TaskDetailModal />}
      {isTimerOpen && <FocusTimer />}
      {isSyncOpen && <SyncModal onClose={() => setIsSyncOpen(false)} />}
    </div>
  )
}

export default App
