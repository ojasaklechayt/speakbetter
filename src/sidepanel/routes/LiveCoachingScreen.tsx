import { activeMeeting, liveMetrics, mockSessions } from './mockData'

type LiveCoachingScreenProps = {
  onStop?: () => void
}

function LiveCoachingScreen({ onStop }: LiveCoachingScreenProps) {
  const currentSession = mockSessions[0]
  const metricTrends: Record<string, { direction: string; text: string }> = {
    Fillers: { direction: '↓', text: 'improving' },
    'Fillers/min': { direction: '↓', text: 'improving' },
    WPM: { direction: '↑', text: 'rising' },
    'Pause avg': { direction: '↑', text: 'slower' },
    Confidence: { direction: '→', text: 'stable' },
    Relevance: { direction: '→', text: 'steady' },
  }

  return (
    <div className="relative flex h-full flex-col bg-[#fcfaf7] text-slate-900">
      <div className="flex-1 overflow-y-auto px-5 pb-24 pt-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Recording live
            </div>
            <h1 className="mt-3 text-xl font-semibold text-slate-950">{activeMeeting.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {activeMeeting.source} • {activeMeeting.elapsed}
            </p>
            <p className="mt-2 break-all text-xs text-slate-500">{activeMeeting.link}</p>
          </div>
          <button
            type="button"
            onClick={onStop}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
          >
            Stop
          </button>
        </header>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Right now</p>
          </div>
          <div className="mt-3 inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
            High impact
          </div>
          <p className="mt-3 text-base font-semibold leading-6 text-slate-950">Slow down and answer earlier.</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            You&apos;re losing clarity due to pacing spikes and delayed direct answers.
          </p>
        </section>

        <section className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Also watch
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
            <span className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200">
              Shorter pauses
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200">
              Fewer setup phrases
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200">
              Keep pace steady
            </span>
          </div>
        </section>

        <section className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Metrics
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {liveMetrics.map((metric) => (
              <LiveMetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                detail={metric.detail}
                trend={metricTrends[metric.label]}
              />
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-950">Transcript</p>
            <p className="text-xs text-slate-500">Live</p>
          </div>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
            {currentSession.transcript.map((line, index) => (
              <p key={`${line}-${index}`}>{line}</p>
            ))}
          </div>
        </section>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-slate-200 bg-[#fcfaf7]/95 px-5 py-4 backdrop-blur">
        <button
          type="button"
          onClick={onStop}
          className="w-full cursor-pointer rounded-2xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
        >
          Stop Coaching
        </button>
      </div>
    </div>
  )
}

function LiveMetricCard({
  label,
  value,
  detail,
  trend,
}: {
  label: string
  value: string
  detail: string
  trend?: {
    direction: string
    text: string
  }
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          {trend ? (
            <span className="text-[10px] font-medium text-slate-400">
              {trend.direction} {trend.text}
            </span>
          ) : null}
        </div>
        <p className="text-lg font-semibold leading-none text-slate-950">{value}</p>
      </div>
      <p className="mt-1 truncate text-[11px] text-slate-500">{detail}</p>
    </div>
  )
}

export default LiveCoachingScreen
