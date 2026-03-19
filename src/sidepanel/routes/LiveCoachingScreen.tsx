type LiveCoachingScreenProps = {
  onStop?: () => void
}

function LiveCoachingScreen({ onStop }: LiveCoachingScreenProps) {
  const liveMetrics = [
    { label: 'Fillers', value: '--', detail: 'available after speech is captured' },
    { label: 'Fillers/min', value: '--', detail: 'waiting for live transcript' },
    { label: 'WPM', value: '--', detail: 'starts after you begin speaking' },
    { label: 'Pause avg', value: '--', detail: 'measured during the session' },
    { label: 'Confidence', value: '--', detail: 'calculated from delivery signals' },
    { label: 'Relevance', value: '--', detail: 'available once coaching is connected' },
  ]

  return (
    <div className="relative flex h-full flex-col bg-[#fcfaf7] text-slate-900">
      <div className="flex-1 overflow-y-auto px-5 pb-24 pt-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Recording live
            </div>
            <h1 className="mt-3 text-xl font-semibold text-slate-950">Session in progress</h1>
            <p className="mt-1 text-sm text-slate-500">
              Google Meet connection ready. Waiting for live coaching data.
            </p>
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
            Stand by
          </div>
          <p className="mt-3 text-base font-semibold leading-6 text-slate-950">Coaching insight will appear here.</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            SpeakBetter has not received live transcript or metric data yet. Once that pipeline is
            connected, this panel can show the highest-impact coaching suggestion in real time.
          </p>
        </section>

        <section className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Also watch
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
            <span className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200">
              Live transcript
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200">
              Delivery trends
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200">
              Real-time prompts
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
              />
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-950">Transcript</p>
            <p className="text-xs text-slate-500">Live</p>
          </div>
          <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-600">
            No transcript yet. Start speaking in your meeting and connect the live pipeline to show
            transcript excerpts here.
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
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        </div>
        <p className="text-lg font-semibold leading-none text-slate-950">{value}</p>
      </div>
      <p className="mt-1 truncate text-[11px] text-slate-500">{detail}</p>
    </div>
  )
}

export default LiveCoachingScreen
