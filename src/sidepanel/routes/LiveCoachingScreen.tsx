import { activeMeeting, liveMetrics, liveTrendRows, mockSessions } from './mockData'

type LiveCoachingScreenProps = {
  onStop?: () => void
}

function LiveCoachingScreen({ onStop }: LiveCoachingScreenProps) {
  const currentSession = mockSessions[0]

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
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Live coaching</p>
          <p className="mt-3 text-lg font-semibold leading-7 text-slate-950">
            Slow down slightly. Your pace jumped in the last 20 seconds.
          </p>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          {liveMetrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {metric.label}
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{metric.value}</p>
              <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>
            </div>
          ))}
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

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-950">Trend</p>
          <div className="mt-4 space-y-3">
            {liveTrendRows.map((row) => (
              <TrendRow key={row.label} label={row.label} detail={row.detail} />
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

function TrendRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  )
}

export default LiveCoachingScreen
