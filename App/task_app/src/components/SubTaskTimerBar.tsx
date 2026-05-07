import { SubTaskSegment } from '../types'

interface Props {
  segments: SubTaskSegment[]
  currentIndex: number
  segmentElapsedSeconds: number
}

export default function SubTaskTimerBar({ segments, currentIndex, segmentElapsedSeconds }: Props) {
  const totalMinutes = segments.reduce((sum, s) => sum + s.durationMinutes, 0)

  return (
    <div className="w-full">
      {/* Segment blocks */}
      <div className="flex h-3 rounded-full overflow-hidden gap-px bg-white/10">
        {segments.map((seg, idx) => {
          const widthPct = (seg.durationMinutes / totalMinutes) * 100
          const isCurrent = idx === currentIndex
          const isCompleted = seg.completed

          let bgClass = 'bg-white/20'
          if (isCompleted) bgClass = 'bg-green-400'
          else if (isCurrent) bgClass = 'bg-blue-400'

          return (
            <div
              key={seg.id}
              className={`relative ${bgClass} transition-all duration-300`}
              style={{ width: `${widthPct}%` }}
            >
              {isCurrent && !isCompleted && (
                <div
                  className="absolute inset-y-0 left-0 bg-blue-300 transition-all duration-1000"
                  style={{
                    width: `${Math.min(100, (segmentElapsedSeconds / (seg.durationMinutes * 60)) * 100)}%`,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Segment labels */}
      <div className="flex mt-2">
        {segments.map((seg, idx) => {
          const widthPct = (seg.durationMinutes / totalMinutes) * 100
          const isCurrent = idx === currentIndex
          const isCompleted = seg.completed
          return (
            <div
              key={seg.id}
              className="text-center overflow-hidden"
              style={{ width: `${widthPct}%` }}
            >
              <span className={`text-xs truncate block px-0.5 ${
                isCompleted ? 'text-green-400' : isCurrent ? 'text-blue-200 font-semibold' : 'text-white/40'
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
