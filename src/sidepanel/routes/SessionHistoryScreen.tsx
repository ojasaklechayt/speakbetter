import type { CommunicationSession } from '../../services/session-manager'

type SessionHistoryScreenProps = {
  sessions?: CommunicationSession[]
  onBack?: () => void
  onOpenSession?: (sessionId: string) => void
}

function SessionHistoryScreen({
  sessions = [],
  onBack,
  onOpenSession,
}: SessionHistoryScreenProps) {
  const completedSessions = sessions.filter((session) => Boolean(session.metadata.endedAt))
  const averageConfidence = getAverageConfidence(completedSessions)

  return (
    <div className="flex h-full flex-col bg-[#fcfaf7]">
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Session archive
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Session History</h1>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 active:scale-[0.98]"
          >
            Back
          </button>
        </header>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex min-h-24 flex-col justify-between rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Sessions</p>
              <p className="text-2xl font-semibold leading-none text-slate-950">{completedSessions.length}</p>
            </div>
            <div className="flex min-h-24 flex-col justify-between rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Avg confidence</p>
              <p className="text-2xl font-semibold leading-none text-slate-950">{averageConfidence}</p>
            </div>
          </div>
        </section>

        {completedSessions.length > 0 ? (
          <section className="mt-4 space-y-3">
            {completedSessions.map((session) => (
              <button
                key={session.metadata.sessionId}
                type="button"
                onClick={() => onOpenSession?.(session.metadata.sessionId)}
                className="w-full cursor-pointer rounded-[1.6rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold leading-6 text-slate-950">
                      {session.metadata.title}
                    </p>
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
          </section>
        ) : (
          <section className="mt-4 rounded-[1.6rem] border border-dashed border-slate-300 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">No history</p>
            <p className="mt-3 text-base font-semibold leading-6 text-slate-950">
              Completed sessions will appear here.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Once you finish a meeting session, SpeakBetter can show trends, confidence scores, and
              session breakdowns in this archive.
            </p>
          </section>
        )}
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

export default SessionHistoryScreen
