import type { CommunicationSession } from '../../services/session-manager'

type DashboardScreenProps = {
  onStartSession?: () => void
  onOpenHistory?: () => void
  onOpenSettings?: () => void
  onOpenSession?: (sessionId: string) => void
  isOnMeetingPage?: boolean
  currentTabUrl?: string
  isStartingSession?: boolean
  startSessionError?: string
  sessions?: CommunicationSession[]
}

function DashboardScreen({
  onStartSession,
  onOpenHistory,
  onOpenSettings,
  onOpenSession,
  isOnMeetingPage = false,
  currentTabUrl = '',
  isStartingSession = false,
  startSessionError = '',
  sessions = [],
}: DashboardScreenProps) {
  const completedSessions = sessions.filter((session) => Boolean(session.metadata.endedAt))
  const recentSessions = completedSessions.slice(0, 3)
  const averageConfidence = getAverageConfidence(completedSessions)
  const latestFillersMetric = getLatestMetricValue(completedSessions, 'Fillers')

  const dashboardScoreTiles = [
    {
      label: 'Sessions',
      value: String(completedSessions.length),
      detail:
        completedSessions.length > 0 ? 'completed sessions saved locally' : 'no completed sessions yet',
    },
    {
      label: 'Confidence',
      value: averageConfidence,
      detail:
        averageConfidence !== '--' ? 'average across completed sessions' : 'available after your first session',
    },
    {
      label: 'Fillers',
      value: latestFillersMetric,
      detail:
        latestFillersMetric !== '--' ? 'latest completed session value' : 'tracked once coaching runs',
    },
  ]

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

        <section
          className={`mt-5 rounded-2xl border px-4 py-4 ${
            isOnMeetingPage
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">
            Meeting check
          </p>
          <p className="mt-2 text-sm font-medium">
            {isOnMeetingPage
              ? 'Meeting page detected. You can start a session.'
              : 'Open an active Google Meet tab to enable session start.'}
          </p>
          {currentTabUrl ? (
            <p className="mt-2 truncate text-xs text-current/70">{currentTabUrl}</p>
          ) : null}
        </section>

        {startSessionError ? (
          <section className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">
              Session start failed
            </p>
            <p className="mt-2 text-sm font-medium">{startSessionError}</p>
          </section>
        ) : null}

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

          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <button
                  key={session.metadata.sessionId}
                  type="button"
                  onClick={() => onOpenSession?.(session.metadata.sessionId)}
                  className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{session.metadata.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatSessionDate(session.metadata.startedAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {session.metadata.totalDuration}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {session.postSession.verdict || session.liveSession.insight.description}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-center">
              <p className="text-sm font-semibold text-slate-950">No session history yet</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Start your first coaching session in Google Meet. Completed sessions will appear here.
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-5">
        <button
          type="button"
          onClick={onStartSession}
          disabled={isStartingSession}
          className={`pointer-events-auto w-full rounded-2xl px-4 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition ${
            isStartingSession
              ? 'cursor-wait bg-slate-500'
              : 'cursor-pointer bg-slate-900 hover:bg-slate-800 active:scale-[0.99]'
          }`}
        >
          {isStartingSession ? 'Starting session...' : 'Start Session'}
        </button>
      </div>
    </div>
  )
}

function getAverageConfidence(sessions: CommunicationSession[]) {
  const values = sessions
    .map((session) => Number.parseFloat(session.postSession.confidence))
    .filter((value) => Number.isFinite(value))

  if (values.length === 0) {
    return '--'
  }

  return `${Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)}%`
}

function getLatestMetricValue(sessions: CommunicationSession[], label: string) {
  for (const session of sessions) {
    const metric = session.postSession.metrics.find((item) => item.label === label)

    if (metric?.value) {
      return metric.value
    }
  }

  return '--'
}

function formatSessionDate(timestamp: string) {
  const date = new Date(timestamp)

  return Number.isNaN(date.valueOf())
    ? timestamp
    : date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
}

export default DashboardScreen
