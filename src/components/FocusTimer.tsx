import { useEffect, useState } from 'react'
import { X, Play, Pause, SkipForward, Square, CheckCircle2, Coffee } from 'lucide-react'
import { useStore } from '../store/useStore'
import SubTaskTimerBar from './SubTaskTimerBar'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FocusTimer() {
  const {
    tasks, projects, timerState, closeTimer,
    startTimer, pauseTimer, resumeTimer, stopTimer, nextSegment,
  } = useStore()

  const [showCompletion, setShowCompletion] = useState(false)
  const task = tasks.find((t) => t.id === timerState.taskId)
  const project = projects.find((p) => p.id === task?.projectId)

  const currentSegment = task?.subTaskSegments[timerState.currentSegmentIndex]
  const isAllDone = task ? timerState.currentSegmentIndex >= task.subTaskSegments.length : false
  const nextSeg = task?.subTaskSegments[timerState.currentSegmentIndex + 1]

  const segmentTotalSeconds = currentSegment ? currentSegment.durationMinutes * 60 : 0
  const segmentRemaining = Math.max(0, segmentTotalSeconds - timerState.segmentElapsedSeconds)
  const segmentProgress = segmentTotalSeconds > 0
    ? (timerState.segmentElapsedSeconds / segmentTotalSeconds) * 100
    : 0

  const totalMinutes = task ? task.subTaskSegments.reduce((sum, s) => sum + s.durationMinutes, 0) : 0
  const totalSeconds = totalMinutes * 60
  const totalRemaining = Math.max(0, totalSeconds - timerState.totalElapsedSeconds)

  // Show completion animation when all done
  useEffect(() => {
    if (isAllDone && task) {
      setShowCompletion(true)
    }
  }, [isAllDone, task])

  if (!task) return null

  const handleStart = () => {
    if (!timerState.isRunning && timerState.totalElapsedSeconds === 0) {
      startTimer(task.id)
    } else {
      resumeTimer()
    }
  }

  // Color based on project
  const accentColor = project?.color || '#3b82f6'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Animated background */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${accentColor}22 0%, #0f172a 70%)`,
          backgroundColor: '#0f172a',
        }}
      />

      {/* Pulsing ring when running */}
      {timerState.isRunning && !isAllDone && (
        <div
          className="absolute w-96 h-96 rounded-full opacity-10 timer-ring"
          style={{ border: `2px solid ${accentColor}` }}
        />
      )}

      {/* Close button */}
      <button
        onClick={closeTimer}
        className="absolute top-6 right-6 p-2 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all"
      >
        <X size={20} />
      </button>

      {/* Task info top */}
      <div className="absolute top-6 left-6 text-left">
        {project && (
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
            <span className="text-white/50 text-xs">{project.name}</span>
          </div>
        )}
        <h2 className="text-white font-semibold text-lg">{task.title}</h2>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-xl px-8">

        {showCompletion ? (
          /* Completion screen */
          <div className="text-center animate-completion">
            <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 size={56} className="text-green-400" />
            </div>
            <h3 className="text-4xl font-bold text-white mb-2">完了！</h3>
            <p className="text-white/60 text-lg mb-2">すべてのセグメントが終了しました</p>
            <p className="text-white/40 text-sm mb-8">
              合計時間: {Math.floor(timerState.totalElapsedSeconds / 60)}分{timerState.totalElapsedSeconds % 60}秒
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  stopTimer()
                }}
                className="px-8 py-3 bg-green-500 text-white font-semibold rounded-2xl hover:bg-green-600 transition-colors"
              >
                完了して閉じる
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Current segment label */}
            <div className="mb-3 text-center">
              <span
                className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ color: accentColor, backgroundColor: accentColor + '20' }}
              >
                {currentSegment
                  ? `セグメント ${timerState.currentSegmentIndex + 1} / ${task.subTaskSegments.length}`
                  : 'タイマー準備完了'}
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-1 text-center">
              {currentSegment?.name || '開始してください'}
            </h3>
            <p className="text-white/40 text-sm mb-10">
              {currentSegment ? `${currentSegment.durationMinutes}分間の作業` : `合計 ${totalMinutes}分`}
            </p>

            {/* Countdown ring */}
            <div className="relative mb-10">
              <svg width="220" height="220" className="-rotate-90">
                <circle
                  cx="110"
                  cy="110"
                  r="95"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="8"
                />
                <circle
                  cx="110"
                  cy="110"
                  r="95"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 95}`}
                  strokeDashoffset={`${2 * Math.PI * 95 * (1 - segmentProgress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-mono font-bold text-white tabular-nums">
                  {currentSegment ? formatTime(segmentRemaining) : formatTime(totalSeconds)}
                </span>
                {timerState.totalElapsedSeconds > 0 && !isAllDone && (
                  <span className="text-white/40 text-sm mt-1">
                    残り合計: {formatTime(totalRemaining)}
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-10">
              {/* Stop */}
              <button
                onClick={() => {
                  if (confirm('タイマーを停止しますか？')) stopTimer()
                }}
                className="w-12 h-12 rounded-2xl bg-white/10 text-white/60 hover:bg-white/20 hover:text-white flex items-center justify-center transition-all"
              >
                <Square size={18} />
              </button>

              {/* Play/Pause (main) */}
              <button
                onClick={timerState.isRunning ? pauseTimer : handleStart}
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-2xl transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: accentColor }}
              >
                {timerState.isRunning ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" />}
              </button>

              {/* Skip segment */}
              <button
                onClick={() => nextSegment()}
                disabled={!currentSegment}
                className="w-12 h-12 rounded-2xl bg-white/10 text-white/60 hover:bg-white/20 hover:text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="次のセグメントへ"
              >
                <SkipForward size={18} />
              </button>
            </div>

            {/* Next segment preview */}
            {nextSeg && (
              <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
                <Coffee size={14} />
                <span>次: {nextSeg.name}（{nextSeg.durationMinutes}分）</span>
              </div>
            )}

            {/* Progress bar across all segments */}
            <div className="w-full">
              <SubTaskTimerBar
                segments={task.subTaskSegments}
                currentIndex={timerState.currentSegmentIndex}
                segmentElapsedSeconds={timerState.segmentElapsedSeconds}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
