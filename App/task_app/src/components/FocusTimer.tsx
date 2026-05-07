import { useEffect, useState } from 'react'
import { X, Play, Pause, SkipForward, Square, CheckCircle2, ChevronRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import { format } from 'date-fns'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}時間 ${m}分 ${s}秒`
  if (m > 0) return `${m}分 ${s}秒`
  return `${s}秒`
}

export default function FocusTimer() {
  const {
    tasks, projects, timerState, closeTimer,
    startTimer, pauseTimer, resumeTimer, stopTimer, nextSegment, updateTask,
  } = useStore()

  const [showCompletion, setShowCompletion] = useState(false)
  const [completedElapsed, setCompletedElapsed] = useState(0)

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

  // 全セグメント完了時
  useEffect(() => {
    if (isAllDone && task && !showCompletion) {
      setCompletedElapsed(timerState.totalElapsedSeconds)
      setShowCompletion(true)
    }
  }, [isAllDone, task])

  if (!task) return null

  const handleStart = () => {
    if (!timerState.isRunning && timerState.totalElapsedSeconds === 0) {
      // 通知許可を取得してからタイマー開始
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
      startTimer(task.id)
    } else {
      resumeTimer()
    }
  }

  // 手動で完了ボタンを押した場合
  const handleManualComplete = () => {
    setCompletedElapsed(timerState.totalElapsedSeconds)
    setShowCompletion(true)
    pauseTimer()
  }

  const handleFinish = (markCompleted: boolean) => {
    if (markCompleted) {
      updateTask(task.id, {
        status: 'completed',
        completionDate: format(new Date(), 'yyyy-MM-dd'),
        timerElapsedSeconds: completedElapsed,
      })
    }
    stopTimer()
  }

  const accentColor = project?.color || '#6366f1'
  const r = 90
  const circumference = 2 * Math.PI * r

  // ━━━ 完了画面 ━━━
  if (showCompletion) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#09090f]">
        <div
          className="absolute inset-0 opacity-15"
          style={{ background: `radial-gradient(ellipse 55% 45% at 50% 50%, ${accentColor}, transparent)` }}
        />
        <button onClick={() => handleFinish(false)} className="absolute top-5 right-5 p-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/8 transition-all">
          <X size={18} />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-sm w-full">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-6 border"
            style={{ backgroundColor: accentColor + '20', borderColor: accentColor + '40' }}
          >
            <CheckCircle2 size={30} style={{ color: accentColor }} />
          </div>

          <p className="text-white/40 text-sm mb-1 tracking-wide">お疲れ様でした</p>
          <h2 className="text-white text-2xl font-bold mb-8 leading-snug">{task.title}</h2>

          {/* 時間サマリー */}
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <p className="text-white/35 text-xs mb-3 tracking-widest uppercase">作業時間</p>
            <p className="text-5xl font-mono font-bold text-white mb-4">{formatElapsed(completedElapsed)}</p>
            <div className="flex justify-between text-xs text-white/30 border-t border-white/8 pt-3 mt-1">
              <span>予定 {totalMinutes}分</span>
              <span>
                {completedElapsed < totalSeconds
                  ? `予定より ${formatElapsed(totalSeconds - completedElapsed)} 早い`
                  : `予定より ${formatElapsed(completedElapsed - totalSeconds)} 多い`}
              </span>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => handleFinish(true)}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all hover:brightness-110 active:scale-95"
              style={{ backgroundColor: accentColor }}
            >
              タスクを完了にする
            </button>
            <button
              onClick={() => handleFinish(false)}
              className="px-5 py-3.5 rounded-2xl text-white/50 text-sm font-medium bg-white/8 hover:bg-white/12 transition-all"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ━━━ タイマー画面 ━━━
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#09090f]">
      {/* 背景グロー */}
      <div
        className="absolute inset-0 opacity-15"
        style={{ background: `radial-gradient(ellipse 55% 45% at 50% 50%, ${accentColor}, transparent)` }}
      />

      {/* 閉じるボタン */}
      <button
        onClick={closeTimer}
        className="absolute top-5 right-5 p-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/8 transition-all"
      >
        <X size={18} />
      </button>

      {/* プロジェクト・タスク名 */}
      <div className="absolute top-5 left-5">
        {project && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
            <span className="text-white/35 text-xs font-medium">{project.name}</span>
          </div>
        )}
        <p className="text-white/65 text-sm font-semibold">{task.title}</p>
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10 flex flex-col items-center">

        {/* セグメント番号 */}
        <p className="text-white/30 text-[11px] font-medium tracking-[0.15em] uppercase mb-2">
          {currentSegment
            ? `セグメント ${timerState.currentSegmentIndex + 1} / ${task.subTaskSegments.length}`
            : '準備完了'}
        </p>

        {/* セグメント名 */}
        <h3 className="text-white/90 text-xl font-semibold mb-10 tracking-tight">
          {currentSegment?.name ?? '開始してください'}
        </h3>

        {/* サークルタイマー */}
        <div className="relative mb-10">
          <svg width="208" height="208" className="-rotate-90">
            {/* 背景トラック */}
            <circle cx="104" cy="104" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            {/* 進捗 */}
            <circle
              cx="104" cy="104" r={r}
              fill="none"
              stroke={accentColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - segmentProgress / 100)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[52px] font-mono font-bold text-white tabular-nums leading-none">
              {currentSegment ? formatTime(segmentRemaining) : formatTime(totalSeconds)}
            </span>
            <span className="text-white/25 text-xs mt-2 tabular-nums">
              {timerState.totalElapsedSeconds > 0
                ? `経過 ${formatElapsed(timerState.totalElapsedSeconds)}`
                : `合計 ${totalMinutes}分`}
            </span>
          </div>
        </div>

        {/* コントロール */}
        <div className="flex items-center gap-4 mb-8">
          {/* 停止 */}
          <button
            onClick={() => { if (confirm('タイマーを停止しますか？')) stopTimer() }}
            className="w-11 h-11 rounded-2xl bg-white/6 text-white/35 hover:bg-white/12 hover:text-white/60 flex items-center justify-center transition-all"
            title="停止"
          >
            <Square size={14} />
          </button>

          {/* 再生/一時停止 */}
          <button
            onClick={timerState.isRunning ? pauseTimer : handleStart}
            className="w-[68px] h-[68px] rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
            style={{ backgroundColor: accentColor }}
          >
            {timerState.isRunning
              ? <Pause size={26} fill="white" />
              : <Play size={26} fill="white" className="ml-1" />}
          </button>

          {/* 次へスキップ */}
          <button
            onClick={() => nextSegment()}
            disabled={!currentSegment}
            className="w-11 h-11 rounded-2xl bg-white/6 text-white/35 hover:bg-white/12 hover:text-white/60 flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            title="次のセグメントへ"
          >
            <SkipForward size={14} />
          </button>
        </div>

        {/* 完了ボタン（作業時間付き） */}
        {timerState.totalElapsedSeconds > 0 && (
          <button
            onClick={handleManualComplete}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition-all hover:bg-white/5 mb-8"
            style={{ borderColor: accentColor + '35', color: accentColor + 'cc' }}
          >
            <CheckCircle2 size={14} />
            <span>完了</span>
            <span className="opacity-60">·</span>
            <span className="opacity-75 font-mono">{formatElapsed(timerState.totalElapsedSeconds)}</span>
          </button>
        )}

        {/* 次セグメントプレビュー */}
        {nextSeg && (
          <div className="flex items-center gap-1.5 text-white/25 text-xs mb-8">
            <ChevronRight size={12} />
            <span>次: {nextSeg.name} · {nextSeg.durationMinutes}分</span>
          </div>
        )}

        {/* セグメントバー */}
        <div className="w-72">
          <SegmentBar
            segments={task.subTaskSegments}
            currentIndex={timerState.currentSegmentIndex}
            segmentElapsedSeconds={timerState.segmentElapsedSeconds}
            accentColor={accentColor}
          />
        </div>
      </div>
    </div>
  )
}

// ━━━ インラインのセグメントバー（シンプル版） ━━━
interface SegmentBarProps {
  segments: { id: string; name: string; durationMinutes: number; completed: boolean }[]
  currentIndex: number
  segmentElapsedSeconds: number
  accentColor: string
}

function SegmentBar({ segments, currentIndex, segmentElapsedSeconds, accentColor }: SegmentBarProps) {
  const total = segments.reduce((s, seg) => s + seg.durationMinutes, 0)
  return (
    <div className="w-full">
      {/* バー */}
      <div className="flex h-1 rounded-full overflow-hidden gap-[2px]">
        {segments.map((seg, idx) => {
          const w = (seg.durationMinutes / total) * 100
          const done = seg.completed
          const current = idx === currentIndex
          const pct = current
            ? Math.min(100, (segmentElapsedSeconds / (seg.durationMinutes * 60)) * 100)
            : 0
          return (
            <div key={seg.id} className="relative bg-white/10 rounded-full overflow-hidden" style={{ width: `${w}%` }}>
              {done && <div className="absolute inset-0 rounded-full" style={{ backgroundColor: accentColor }} />}
              {current && !done && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
                  style={{ width: `${pct}%`, backgroundColor: accentColor }}
                />
              )}
            </div>
          )
        })}
      </div>
      {/* ラベル */}
      <div className="flex mt-2">
        {segments.map((seg, idx) => {
          const w = (seg.durationMinutes / total) * 100
          const done = seg.completed
          const current = idx === currentIndex
          return (
            <div key={seg.id} className="text-center overflow-hidden" style={{ width: `${w}%` }}>
              <span className={`text-[10px] truncate block px-0.5 transition-colors ${
                done ? 'text-white/50' : current ? 'text-white/70 font-medium' : 'text-white/20'
              }`}>
                {seg.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
