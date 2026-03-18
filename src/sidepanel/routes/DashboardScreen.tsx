import { dashboardScoreTiles, mockSessions } from './mockData'

type DashboardScreenProps = {
  onStartSession?: () => void
  onOpenHistory?: () => void
  onOpenSettings?: () => void
  onOpenSessionDetail?: (sessionId: string) => void
}

function DashboardScreen({
  onStartSession,
  onOpenHistory,
  onOpenSettings,
  onOpenSessionDetail,
}: DashboardScreenProps) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#fcfaf7]">
      <div className="flex-1 overflow-y-auto px-5 pb-28 pt-5">
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              SpeakBetter
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onOpenHistory}
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 active:scale-[0.98]"
            >
              History
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 active:scale-[0.98]"
            >
              Settings
            </button>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-3">
          {dashboardScoreTiles.map((tile) => (
            <div key={tile.label} className="rounded-xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {tile.label}
              </p>
              <div className="mt-4 min-h-12">
                <p className="text-2xl font-semibold leading-none text-slate-950">{tile.value}</p>
              </div>
              <p className="mt-3 text-xs text-slate-500">{tile.detail}</p>
            </div>
          ))}
        </section>
        
        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-950">Recent sessions</h3>
            <button
              type="button"
              onClick={onOpenHistory}
              className="cursor-pointer text-xs font-medium text-slate-500 transition hover:text-slate-700 active:text-slate-900"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {mockSessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => onOpenSessionDetail?.(session.id)}
                className="block w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:translate-y-0"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">{session.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {session.time} • {session.duration}
                  </p>
                </div>

                <div className="mt-3 flex gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-1">{session.pace}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">Confidence {session.confidence}</span>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">{session.feedback}</p>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-5">
        <button
          type="button"
          onClick={onStartSession}
          className="pointer-events-auto w-full cursor-pointer rounded-2xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 active:scale-[0.99]"
        >
          Start Session
        </button>
      </div>
    </div>
  )
}

export default DashboardScreen
